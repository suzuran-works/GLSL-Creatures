#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;
uniform float uAlpha;
varying vec2 fragCoord;

void main(void) {
    float t = time * 0.8; // 炎っぽいゆらぎをゆっくりめに
    vec2 r = resolution;

    // 中央原点に座標を変換
    vec2 p = (fragCoord.xy * 2.0 - r) / min(r.x, r.y);
    vec2 baseP = p;

    float f = 0.0;
    for (float i = 0.0; i < 7.0; i++) {
        float rad = t * (i + 1.0) * 0.6;
        float coef = mod(i, 2.0) * 2.0 - 1.0;
        float s = sin(rad + sin(t * 0.7) * 0.5); // ゆらぎを追加
        float c = cos(rad + cos(t * 0.4) * 0.3);
        mat2 m = mat2(c * coef, -s * coef, s, c);
        p *= m;

        // 中心から少しシフトさせて炎の広がりを作る
        vec2 q = vec2(p.x - 0.035 * (7.0 - i), p.y + 0.02 * sin(t + i));
        f += 0.012 / length(q);
    }

    // 炎の強度調整
    f = smoothstep(0.08, 1.0, f);

    // 青→シアン→緑への炎色
    vec3 col = vec3(0.0);
    col += vec3(0.1, 0.4, 1.0) * f; // 青
    col += vec3(0.0, 1.0, 0.8) * pow(f, 1.5); // シアン
    col += vec3(0.0, 0.6, 0.2) * pow(f, 3.0); // 緑の芯

    // 外側に向かってフェードアウト
    float dist = length(baseP);
    float thresDist = 0.5;
    float fadeLength = 0.25;
    col *= smoothstep(thresDist, thresDist - fadeLength, dist);

    // 出力
    gl_FragColor = vec4(col * uAlpha, uAlpha);
}