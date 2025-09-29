#ifdef GL_ES
precision mediump float;
#endif

// レイマーチングテスト

#extension GL_OES_standard_derivatives : enable

// time
uniform float time;
// resolution
uniform vec2 resolution;
// alpha(custom)
uniform float uAlpha;
// pixel position (phaser game object)
varying vec2 fragCoord;
// mouse position
uniform vec2 mouse;

//vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));

float dist_func(vec3 pos, float size)
{
    return length(pos) - size;
}

vec3 getNormal(vec3 pos, float size)
{
    float ep = 0.0001;
    return normalize(vec3(
                     dist_func(pos, size) - dist_func(vec3(pos.x - ep, pos.y, pos.z), size),
                     dist_func(pos, size) - dist_func(vec3(pos.x, pos.y - ep, pos.z), size),
                     dist_func(pos, size) - dist_func(vec3(pos.x, pos.y, pos.z - ep), size)
                     ));
}

void main( void ) {
    float t = time;
    vec2 r = resolution;
    vec2 pos = (fragCoord.xy * 2.0 - r) / min(r.x, r.y);
    
    vec3 col = vec3(0.0);

    vec3 cameraPos = vec3(0.0, 0.0, 3.0);

    vec3 ray = normalize(vec3(pos, 0.0) - cameraPos);
    vec3 cur = cameraPos;

    vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
    
    lightDir.x = cos(t * 2.0);
    lightDir.y = sin(t * 5.0);
    lightDir.z = sin(t * 3.0);
    
    // 固定
    //vec2 m = mouse;
    vec2 m = vec2(0.75, 0.75);

    vec2 mouseNorm = m * 2.0 - 1.0;
    float size = 1.0 - length(mouseNorm);
    float diffCoef = 0.5;
    for (int i = 0; i < 16; i++)
    {
        float d = dist_func(cur, size);
        if (d < 0.0001)
        {
            vec3 normal = getNormal(cur, size);
            float diff = dot(normal, lightDir);
            col = vec3(diff * diffCoef) + vec3(0.1);
            break;
        }
        cur += ray * d;
    }

    gl_FragColor = vec4(0.0, col.g, col.b, 1.0);
}