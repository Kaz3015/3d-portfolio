uniform vec2 uResolution;
uniform float uSize;
uniform sampler2D uParticlesTexture;
uniform float uProgress;

attribute vec2 aParticlesUv;
attribute float aSize;
attribute vec3 aPositionTarget;


varying vec3 vColor;
varying vec3 vPosition;

#include ../includes/simplexNoise3d.glsl

void main()
{

    vec4 particle = texture(uParticlesTexture, aParticlesUv);
    float noiseOrigin = simplexNoise3d(particle.xyz * 0.2);
    float noiseTarget = simplexNoise3d(aPositionTarget * 0.2);
    float noise = mix(noiseOrigin, noiseTarget, uProgress);
    noise = smoothstep(-1.0, 1.0, noise);
    float duration = 0.4;
    float delay = (1.0 - duration) * noise;
    float end = delay + duration;
    float progress = smoothstep(delay, end, uProgress);

    vec3 mixedPosition = mix(particle.xyz, aPositionTarget, progress);
    // Final position
    vec4 modelPosition = modelMatrix * vec4(mixedPosition.xyz, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    // Point size
    gl_PointSize = aSize * uSize * uResolution.y;
    gl_PointSize *= (1.0 / - viewPosition.z);

    // Varyings
    vColor = vec3(1.0);
    vPosition = modelPosition.xyz;
}