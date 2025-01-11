import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { GPUComputationRenderer } from 'three/examples/jsm/Addons.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
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
const camera = new THREE.PerspectiveCamera(60, sizes.width / sizes.height, 0.1, 35)

const camera2 = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 100)
camera.position.set(6.6, 0, 20)
camera2.position.set(20, 3, 30)
scene.add(camera, camera2)



const cameraHelper = new THREE.CameraHelper(camera)





// Controls
const controls = new OrbitControls(camera2, canvas)
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

debugObject.clearColor = '#000000'
renderer.setClearColor(debugObject.clearColor)

/**
 * render text Geometry
 */

let introGeometry = null
const baseGeometry = {}
const loader = new FontLoader()
 loader.load('./font/BadScript_Regular.json', (font) => {
 introGeometry = new TextGeometry("Kyle Zicherman's Portfolio",
        {
        font: font,
        size: 1,
        depth: .1,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 0.03,
        bevelSize: 0.02,
        bevelOffset: 0,
        bevelSegments: 5
    } );
    const aboutMeGeometry = new TextGeometry("About Me",
        {
        font: font,
        size: 1,
        depth: .1,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 0.03,
        bevelSize: 0.02,
        bevelOffset: 0,
        bevelSegments: 5
    } );
    const projectGeometry = new TextGeometry("Projects",
        {
        font: font,
        size: 1,
        depth: .1,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 0.03,
        bevelSize: 0.02,
        bevelOffset: 0,
        bevelSegments: 5
    } );
    const contactGeometry = new TextGeometry("Contact Infromation",
        {
        font: font,
        size: 1,
        depth: .1,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 0.03,
        bevelSize: 0.02,
        bevelOffset: 0,
        bevelSegments: 5
    } );

    particles.geometries = [introGeometry, aboutMeGeometry, projectGeometry, contactGeometry]
    particles.maxCount = Math.max(...particles.geometries.map(geometry => geometry.attributes.position.count))
    particles.positions = []

    for(const geometry of particles.geometries) {
        const originalArray = geometry.attributes.position.array
        const newArray = new Float32Array(particles.maxCount * 3)

        

        for(let i = 0; i < particles.maxCount; i++) {

            const i3 = i * 3

            if(i3 < originalArray.length) {
                newArray[i3 + 0] = originalArray[i3 + 0]
                newArray[i3 + 1] = originalArray[i3 + 1]
                newArray[i3 + 2] = originalArray[i3 + 2]
            }
            else {
                const randomIndex = Math.floor(Math.random() * geometry.attributes.position.count) * 3
                newArray[i3 + 0] = originalArray[randomIndex]
                newArray[i3 + 1] = originalArray[randomIndex + 1]
                newArray[i3 + 2] = originalArray[randomIndex + 2]
            }
        }
        particles.positions.push(new THREE.BufferAttribute(newArray, 3))

    }
    console.log(particles.positions)

    baseGeometry.instance = new THREE.BufferGeometry()
    baseGeometry.instance.setAttribute('position', particles.positions[0])
    baseGeometry.instance.setAttribute("aPositionTarget", particles.positions[1])

baseGeometry.count = baseGeometry.instance.attributes.position.count
});

    // console.log(textGeometry)
    const textMaterial = new THREE.MeshBasicMaterial()
    // const text = new THREE.Mesh(textGeometry, textMaterial)
    // scene.add(text)


/**
 * Base Geometry
 */
const gltf = await loader.loadAsync('./font/BadScript_Regular.json')
//creates the base geometry




// scene.add(mesh)
//gets the count of the base geometry
// baseGeometry.count = baseGeometry.instance.attributes.position.count
let mousePos = { x: 0.0, y: 0.0 }
canvas.addEventListener("mousemove", (event) => {
    const rect = canvas.getBoundingClientRect();
    mousePos.x = (event.clientX - rect.left) / rect.width;
    mousePos.y = 1.0 - (event.clientY - rect.top) / rect.height; // Flip y-axis
});

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
gpgpu.particleVariable.material.uniforms.uMouse = new THREE.Uniform(new THREE.Vector2(mousePos.x, mousePos.y))


//init
gpgpu.computation.init()

//Debug
// gpgpu.debug = new THREE.Mesh(
//     new THREE.PlaneGeometry(3, 3),
//  new THREE.MeshBasicMaterial({
//         map: gpgpu.computation.getCurrentRenderTarget(gpgpu.particleVariable).texture
//  }))
//  gpgpu.debug.position.set(3, 0, 0)
//  scene.add(gpgpu.debug)




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
particles.geometry.setAttribute('aPositionTarget', particles.positions[3])



// Material
particles.material = new THREE.ShaderMaterial({
    vertexShader: particlesVertexShader,
    fragmentShader: particlesFragmentShader,
    uniforms:
    {
        uSize: new THREE.Uniform(0.00),
        uResolution: new THREE.Uniform(new THREE.Vector2(sizes.width * sizes.pixelRatio, sizes.height * sizes.pixelRatio)),
        uParticlesTexture: new THREE.Uniform(),
        uProgress: new THREE.Uniform(0)
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
gui.add(particles.material.uniforms.uProgress, 'value').min(0).max(1).step(0.001).name('uProgress')
const cameraFolder = gui.addFolder('Camera Position')
cameraFolder.add(camera.position, 'x').min(-50).max(50).step(0.1).name('X')
cameraFolder.add(camera.position, 'y').min(-50).max(50).step(0.1).name('Y')
cameraFolder.add(camera.position, 'z').min(-50).max(50).step(0.1).name('Z')

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
    gpgpu.particleVariable.material.uniforms.uMouse.value = new THREE.Vector2(mousePos.x, mousePos.y)
    gpgpu.computation.compute()
    particles.material.uniforms.uParticlesTexture.value = gpgpu.computation.getCurrentRenderTarget(gpgpu.particleVariable).texture

    // Render normal scene
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()