import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { GPUComputationRenderer } from 'three/examples/jsm/Addons.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import GUI from 'lil-gui'
import particlesVertexShader from './shaders/particles/vertex.glsl'
import particlesFragmentShader from './shaders/particles/fragment.glsl'
import gpgpuParticleShader from './shaders/gpgpu/particles.glsl'

/**
 * Base
 */
// Debug
const gui = new GUI({ width: 340 })
const debugObject = {}

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// Loaders
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('/draco/')

const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: Math.min(window.devicePixelRatio, 2)
}

/**
 * Particles
 */
const particles = {}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    sizes.pixelRatio = Math.min(window.devicePixelRatio, 2)

    // Materials
    particles.material.uniforms.uResolution.value.set(sizes.width * sizes.pixelRatio, sizes.height * sizes.pixelRatio)

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(sizes.pixelRatio)
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 100)
camera.position.set(4.5, 4, 11)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(sizes.pixelRatio)

debugObject.clearColor = '#29191f'
renderer.setClearColor(debugObject.clearColor)

/**
 * Base Geometry
 */

const baseGeometry = {}
//creates the base geometry
const textGeometry = new TextGeometry('Kyle Zicherman', {
    size: 1,
});
const mesh = new THREE.Mesh(textGeometry, new THREE.MeshBasicMaterial({ color: 0xff0000 }))
// scene.add(mesh)
baseGeometry.instance = new THREE.SphereGeometry(3)
//gets the count of the base geometry
baseGeometry.count = baseGeometry.instance.attributes.position.count

/**
 * GPU Computation
 */

//setup
const gpgpu = {}
//size of the gpgpu texture
gpgpu.size = Math.ceil(Math.sqrt(baseGeometry.count))
//computation renderer
gpgpu.computation = new GPUComputationRenderer(gpgpu.size, gpgpu.size, renderer)

//base particles 
const baseParticleTexture = gpgpu.computation.createTexture()


//fill the base particle texture
for(let i = 0; i < baseGeometry.count; i++) {
    const i3 = i * 3
    const i4 = i * 4

    //taking the x value of the coordinates of the base geometry and putting it in the r channel of the base particle texture
    baseParticleTexture.image.data[i4 + 0] = baseGeometry.instance.attributes.position.array[i3 + 0]
    //taking the y value of the coordinates of the base geometry and putting it in the g channel of the base particle texture
    baseParticleTexture.image.data[i4 + 1] = baseGeometry.instance.attributes.position.array[i3 + 1]
    //taking the z value of the coordinates of the base geometry and putting it in the b channel of the base particle texture
    baseParticleTexture.image.data[i4 + 2] = baseGeometry.instance.attributes.position.array[i3 + 2]
    //setting the alpha channel to 1
    baseParticleTexture.image.data[i4 + 3] = Math.random()

}

//particles variable
gpgpu.particleVariable = gpgpu.computation.addVariable('uParticles', gpgpuParticleShader, baseParticleTexture)
gpgpu.computation.setVariableDependencies(gpgpu.particleVariable, [gpgpu.particleVariable])

//uniforms 
gpgpu.particleVariable.material.uniforms.uTime = new THREE.Uniform(0)
gpgpu.particleVariable.material.uniforms.uDeltaTime = new THREE.Uniform(0)
gpgpu.particleVariable.material.uniforms.uBase = new THREE.Uniform(baseParticleTexture)
//init
gpgpu.computation.init()

//Debug
gpgpu.debug = new THREE.Mesh(
    new THREE.PlaneGeometry(3, 3),
 new THREE.MeshBasicMaterial({
        map: gpgpu.computation.getCurrentRenderTarget(gpgpu.particleVariable).texture
 }))
 gpgpu.debug.position.set(3, 0, 0)
 scene.add(gpgpu.debug)




// Geometry
const particlesArray = new Float32Array(baseGeometry.count * 2)
const sizesArray = new Float32Array(baseGeometry.count)


for(let y = 0; y < gpgpu.size; y++) {
    
    for(let x = 0; x < gpgpu.size; x++) {
        const i = (y * gpgpu.size + x)
        const i2 = i * 2

        const uvX = (x + 0.5) / (gpgpu.size)
        const uvY = (y + 0.5) / (gpgpu.size)

        particlesArray[i2 + 0] = uvX
        particlesArray[i2 + 1] = uvY

        sizesArray[i] = Math.random()
    }

}
particles.geometry = new THREE.BufferGeometry()
particles.geometry.setDrawRange(0, baseGeometry.count)
particles.geometry.setAttribute('aParticlesUv', new THREE.BufferAttribute(particlesArray, 2))
particles.geometry.setAttribute('aSize', new THREE.BufferAttribute(sizesArray, 1))



// Material
particles.material = new THREE.ShaderMaterial({
    vertexShader: particlesVertexShader,
    fragmentShader: particlesFragmentShader,
    uniforms:
    {
        uSize: new THREE.Uniform(0.07),
        uResolution: new THREE.Uniform(new THREE.Vector2(sizes.width * sizes.pixelRatio, sizes.height * sizes.pixelRatio)),
        uParticlesTexture: new THREE.Uniform()
    }
})

// Points
particles.points = new THREE.Points(particles.geometry, particles.material)
scene.add(particles.points)

/**
 * Tweaks
 */
gui.addColor(debugObject, 'clearColor').onChange(() => { renderer.setClearColor(debugObject.clearColor) })
gui.add(particles.material.uniforms.uSize, 'value').min(0).max(1).step(0.001).name('uSize')

/**
 * Animate
 */
const clock = new THREE.Clock()
let previousTime = 0

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - previousTime
    previousTime = elapsedTime
    
    // Update controls
    controls.update()

    //GPGPU update
    gpgpu.particleVariable.material.uniforms.uDeltaTime.value = deltaTime
    gpgpu.particleVariable.material.uniforms.uTime.value = elapsedTime
    gpgpu.computation.compute()
    particles.material.uniforms.uParticlesTexture.value = gpgpu.computation.getCurrentRenderTarget(gpgpu.particleVariable).texture

    // Render normal scene
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()