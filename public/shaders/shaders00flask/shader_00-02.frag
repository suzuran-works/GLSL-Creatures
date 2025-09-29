#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;
uniform float uAlpha;
varying vec2 fragCoord;

vec3 hsv2rgb(vec3 c) {
    vec3 rgb = clamp( abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),
                              6.0)-3.0)-1.0,
                      0.0,
                      1.0 );
    rgb = rgb*rgb*(3.0-2.0*rgb);
    return c.z * mix(vec3(1.0), rgb, c.y);
}

void main(void) {
    float t = time;
    vec2 r = resolution;
    vec2 p = (fragCoord.xy * 2.0 - r) / min(r.x, r.y);

    float f = 0.0;
    for (float i = 0.0; i < 7.0; i++) {
        float rad = t * (i + 1.5);
        float s = sin(rad);
        float c = cos(rad);
        mat2 m = mat2(c, -s, s, c);
        p *= m;

        vec2 q = vec2(p.x - (0.05 * (7.0 - i)), p.y);
        f += 0.02 / length(q);
    }

    // 光の強さをブースト
    f = pow(f, 1.2) * 3.0;

    // ランダムなピカピカ感
    float twinkle = 0.5 + 0.5*sin(dot(p, p)*40.0 + t*10.0);

    // 色相を速めに回転させて虹色ビカビカ
    float hue = mod(t*0.7 + length(p)*3.0, 1.0);
    vec3 color = hsv2rgb(vec3(hue, 1.0, f * twinkle));
    
    // 中央から外側に向かってフェードアウト
    float dist = length(p);
    color *= smoothstep(0.8, 0.0, dist);

    // 出力（アルファはしっかり残す）
    gl_FragColor = vec4(color * uAlpha, 1.0);
}