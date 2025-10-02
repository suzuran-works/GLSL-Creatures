#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;
uniform float uAlpha;
varying vec2 fragCoord;

void main(void) {
    float t = time * 0.8;
    vec2 r = resolution;

    // 中央基準座標
    vec2 p = (fragCoord.xy * 2.0 - r) / min(r.x, r.y);
    vec2 baseP = p;

    // --- 炎の揺らぎ ---
    // 縦方向は周期的な変化でゆらぎ感を出す（無限に流さない）
    p.y += 0.1 * sin(t + p.x * 5.0);
    // 横方向に炎がゆらめく動き
    p.x += 0.2 * sin(p.y * 3.0 + t * 2.0);

    float f = 0.0;
    for (float i = 0.0; i < 6.0; i++) {
        vec2 q = vec2(p.x - 0.03 * (6.0 - i), p.y);
        f += 0.012 / length(q);
    }

    // 強度
    f = smoothstep(0.1, 1.0, f);

    // トゥーン調（段階化）
    float toonF;
    if (f > 0.7) toonF = 1.0;
    else if (f > 0.4) toonF = 0.6;
    else if (f > 0.2) toonF = 0.3;
    else toonF = 0.0;

    // 炎色（赤〜オレンジ）
    vec3 col = vec3(0.0);
    col += vec3(1.0, 0.2, 0.1) * toonF;
    col += vec3(1.0, 0.6, 0.2) * (toonF * 0.6);

    // 外縁フェード
    float dist = length(baseP);
    col *= smoothstep(0.5, 0.25, dist);

    gl_FragColor = vec4(col * uAlpha, uAlpha);
}