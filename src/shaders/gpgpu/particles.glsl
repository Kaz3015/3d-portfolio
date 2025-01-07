#include ../includes/simplexNoise4d.glsl
uniform float uTime;
uniform float uDeltaTime;
uniform sampler2D uBase;
uniform vec2 uMouse;

void main() {
    float time = uTime * 0.2;
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 particle = texture(uParticles, uv);
    vec4 base = texture(uBase, uv);

    // particle life
    if(particle.a >= 1.0) {
        particle.a = mod(particle.a, 1.0);
        particle.xyz = base.xyz;
    } else {
        float strength = simplexNoise4d(vec4(base.xyz * 0.1, time + 1.0));
        strength = smoothstep(0.2, 1.0, strength);

        vec3 flowField = vec3(
            simplexNoise4d(vec4(particle.x + 3.193, particle.y, particle.z, time)),
            simplexNoise4d(vec4(particle.x + 6.1892, particle.y, particle.z, time)),
            simplexNoise4d(vec4(particle.x + 9.20238, particle.y, particle.z, time))
        );
        flowField = normalize(flowField);

        particle.xyz += flowField * uDeltaTime * strength * 0.5;
        particle.a += uDeltaTime * 0.3;
        
    }

     // Displacement vector (push particles away if mouse postion intersects with particle position mouse is a small circle)
    
     

    
    

    


    // Displacement vector (push particles away)
    
    gl_FragColor = particle;
}