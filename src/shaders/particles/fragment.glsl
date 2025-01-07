varying vec3 vColor;
varying vec3 vPosition;

#include ../includes/simplexNoise4d.glsl

void main()
{
    float distanceToCenter = length(gl_PointCoord - 0.5);
    if(distanceToCenter > 0.5) {
        discard;
    }

vec3 color1 = vec3(0.0, 0.0, 1.0);
vec3 color2 = vec3(1.0, 0.0, 0.0);

vec3 newColor = mix(color1, color2, vPosition.x * 0.05);


    
    gl_FragColor = vec4(newColor, 1.0);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}