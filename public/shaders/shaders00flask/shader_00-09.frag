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

    // 中央原点に座標を変換
    vec2 p = (fragCoord.xy * 2.0 - r) / min(r.x, r.y);
    vec2 baseP = p;

    float f = 0.0;
    for (float i = 0.0; i < 8.0; i++) {
        float rad = t * (i + 1.0) * 0.6;
        float coef = mod(i, 2.0) * 2.0 - 1.0;
        float s = sin(rad + sin(t * 0.8) * 0.5);
        float c = cos(rad + cos(t * 0.5) * 0.3);
        mat2 m = mat2(c * coef, -s * coef, s, c);
        p *= m;

        vec2 q = vec2(p.x - 0.035 * (7.0 - i), p.y + 0.02 * sin(t + i));
        f += 0.012 / length(q);
    }

    // 炎の強度
    f = smoothstep(0.08, 1.0, f);

    // --- トゥーン調の段階化 ---
    float toonF;
    if (f > 0.7) toonF = 1.0;       // 一番明るい領域
    else if (f > 0.4) toonF = 0.6;  // 中間の輝き
    else if (f > 0.2) toonF = 0.3;  // 暗め
    else toonF = 0.0;               // 外側は黒

    // 赤〜オレンジの炎色
    vec3 col = vec3(0.0);
    col += vec3(1.0, 0.2, 0.1) * toonF;      // 赤基調
    col += vec3(1.0, 0.6, 0.2) * (toonF*0.6); // オレンジを少し混ぜる

    // 外側にフェードアウト
    float dist = length(baseP);
    float thresDist = 0.45;
    float fadeLength = 0.0025;
    col *= smoothstep(thresDist, thresDist - fadeLength, dist);

    gl_FragColor = vec4(col * uAlpha, uAlpha);
}