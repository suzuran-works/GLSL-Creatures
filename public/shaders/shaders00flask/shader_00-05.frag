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
    float t = time * 0.25; // ゆっくり動く
    vec2 r = resolution;
    vec2 p = (fragCoord.xy * 2.0 - r) / min(r.x, r.y);
    vec2 baseP = p;

    // --- 幻想感を出すために座標を波打たせる ---
    p.x += 0.2 * sin(p.y*2.5 + t*1.2);
    p.y += 0.2 * cos(p.x*2.5 + t*1.0);

    // --- 幾何学模様ベース（中心にシフト調整） ---
    p = abs(p);
    p = mod(p*3.0 + 1.0, 2.0) - 1.0;

    // --- 放射状の光の干渉 ---
    float f = 0.0;
    for (float i = 0.0; i < 6.0; i++) {
        float rad = t * (i + 1.0);
        float s = sin(rad);
        float c = cos(rad);
        mat2 m = mat2(c, -s, s, c);
        vec2 q = m * p;
        f += 0.012 / length(q);
    }

    f = pow(f, 1.6) * 2.0;

    // --- 青紫系カラー (0.55〜0.75) ---
    float hue = mix(0.55, 0.75, 0.5 + 0.5*sin(t + length(p)*2.0));
    vec3 color = hsv2rgb(vec3(hue, 0.8, f));

    // 中央から外側に向かってフェードアウト
    float dist = length(baseP);
    color *= smoothstep(0.8, 0.0, dist);
    
    gl_FragColor = vec4(color * uAlpha, 1.0);
}