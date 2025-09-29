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

// 擬似ランダム
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main(void) {
    float t = time * 0.3;
    vec2 r = resolution;
    vec2 uv = fragCoord.xy / r;
    vec2 p = (fragCoord.xy * 2.0 - r) / min(r.x, r.y);
    vec2 baseP = p;

    // 幾何学的ゆらめき + 渦巻き
    float angle = 0.5 * length(p) + t*0.5;
    float s = sin(angle);
    float c = cos(angle);
    mat2 rot = mat2(c, -s, s, c);
    p = rot * p;

    p.x += 0.2 * sin(p.y*3.0 + t*1.2);
    p.y += 0.2 * cos(p.x*3.0 + t*1.0);
    p = abs(p);
    p = mod(p*6.0 + 1.0, 2.0) - 1.0;

    // 放射状の光
    float f = 0.0;
    for (float i = 0.0; i < 5.0; i++) {
        float rad = t * (i + 1.0);
        float cs = cos(rad);
        float sn = sin(rad);
        mat2 m = mat2(cs, -sn, sn, cs);
        vec2 q = m * p;
        f += 0.012 / length(q);
    }
    f = pow(f, 1.4) * 1.8;

    // 流れる光の線
    float lines = sin((uv.x + t*0.2)*20.0) * 0.15 + sin((uv.y + t*0.3)*30.0)*0.15;

    // 基本カラー（緑〜エメラルド）
    float hue = mix(0.3, 0.45, 0.5 + 0.5*sin(t*0.7 + length(p)*2.0));
    vec3 baseColor = hsv2rgb(vec3(hue, 0.8, f + lines));

    // 派手星屑
    float star = 0.0;
    vec2 grid = floor(uv * 120.0); // 星の密度
    float rnd = hash(grid);
    if (rnd > 0.98) {
        float twinkle = 0.5 + 0.5*sin(time*10.0 + rnd*800.0);
        float d = length(fract(uv*120.0) - 0.5);
        star = smoothstep(0.078 * 7.0, 0.0, d) * twinkle;
    }

    vec3 color = baseColor + vec3(0.6, 1.0, 0.7) * star;

    // 中央から外側に向かってフェードアウト
    float dist = length(baseP);
    color *= smoothstep(0.5, 0.0, dist);

    gl_FragColor = vec4(color * uAlpha, 1.0);
}