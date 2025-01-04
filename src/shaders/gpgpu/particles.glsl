#include ../includes/simplexNoise4d.glsl
uniform float uTime;
uniform float uDeltaTime;
uniform sampler2D uBase;
void main() {
    float time = uTime * 0.2;
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 particle = texture(uParticles, uv);
    vec4 base = texture(uBase, uv);

    //particle life
    if(particle.a >= 1.0) {
        particle.a = mod(particle.a, 1.0);
        particle.xyz = base.xyz;
    } else {
        float strength = simplexNoise4d(vec4(base.xyz * 0.2, time + 1.0));
        strength = smoothstep(0.0, 1.0, strength);
        //flow field
    vec3 flowField = vec3(
        simplexNoise4d(vec4(particle.xyz + 3.193, time)),
        simplexNoise4d(vec4(particle.xyz + 6.1892, time)),
        simplexNoise4d(vec4(particle.xyz + 9.20238, time))
    );
    flowField = normalize(flowField);
    particle.xyz += flowField * uDeltaTime * strength * 0.5;
    particle.a += uDeltaTime * 0.3;
        
    }
    gl_FragColor = particle;
}