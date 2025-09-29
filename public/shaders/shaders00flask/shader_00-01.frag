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
    vec2 uv = fragCoord.xy / r.xy;

    // 画面中央基準座標
    vec2 p = (fragCoord.xy * 2.0 - r) / min(r.x, r.y);

    // --- グリッチ感: UVを時間で揺らす ---
    float glitch = step(0.95, fract(sin(dot(p.xy, vec2(12.9898,78.233)) + t*5.0) * 43758.5453));
    uv.x += glitch * (0.05 * sin(t*50.0));

    // --- ネオンライン効果 ---
    float line = sin(p.y*20.0 + t*10.0) * 0.5 + 0.5;
    float f = 0.0;
    for (float i = 0.0; i < 6.0; i++) {
        float rad = t * (i+1.0);
        float s = sin(rad);
        float c = cos(rad);
        mat2 m = mat2(c, -s, s, c);
        p *= m;

        vec2 q = vec2(p.x - (0.04 * (6.0 - i)), p.y);
        f += 0.02 / length(q);
    }
    f = pow(f, 1.3) * (1.5 + line*1.5);

    // --- サイバー色相 ---
    float hue = mod(t*0.5 + uv.x*2.0 + uv.y*2.0, 1.0);
    vec3 neon = hsv2rgb(vec3(hue, 1.0, f));

    // グリッチ発動時は色を反転して派手に
    if (glitch > 0.5) {
        neon = 1.0 - neon;
    }

    // 中央から外側に向かってフェードアウト
    float dist = length(p);
    neon *= smoothstep(0.7, 0.0, dist);

    gl_FragColor = vec4(neon * uAlpha, 1.0);
}