#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2  resolution;
uniform float uAlpha;
varying vec2  fragCoord;

// ========== HSV → RGB ==========
vec3 hsv2rgb(vec3 c){
    vec3 K = vec3(1.0, 2.0/3.0, 1.0/3.0);
    vec3 p = abs(fract(c.xxx + K) * 6.0 - 3.0);
    return c.z * mix(vec3(1.0), clamp(p - 1.0, 0.0, 1.0), c.y);
}

// 線分への距離（DNAの“ハシゴ”部分）
float lineDistance(vec2 p, vec2 a, vec2 b){
    vec2 pa = p - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h);
}

void main(void){
    vec2 r = resolution;
    // -1..1 正規化
    vec2 p = (fragCoord * 2.0 - r) / min(r.x, r.y);
    float t = time;

    // 背景（ちょいサイバーな紺）
    vec3 col = vec3(0.02, 0.04, 0.08);

    // 二重らせんのパラメータ
    const int SEGMENTS = 24;         // 縦方向の節の数
    float yMin  = -1.1;
    float yMax  =  1.1;
    float helixAmp = 0.45;           // 左右の振れ幅
    float freq  = 6.0;               // ねじれの密度
    float speed = 1.4;               // 回転スピード

    float accumMask = 0.0;           // 最終的なα用マスク

    for(int i = 0; i < SEGMENTS; i++){
        float fi = float(i);
        float tSeg = fi / float(SEGMENTS - 1);
        float yPos = mix(yMin, yMax, tSeg);

        // y位置に応じたねじれ位相
        float phase = yPos * freq + t * speed;

        // 2本の鎖の中心位置（左右対称）
        float xCenter = sin(phase) * helixAmp;
        vec2 s1 = vec2( xCenter, yPos); // 右
        vec2 s2 = vec2(-xCenter, yPos); // 左

        // 鎖のビーズ（円）
        float beadRadius = 0.10;
        float beadWidth  = 0.03;

        float d1 = length(p - s1);
        float d2 = length(p - s2);

        float bead1 = 1.0 - smoothstep(beadRadius, beadRadius + beadWidth, d1);
        float bead2 = 1.0 - smoothstep(beadRadius, beadRadius + beadWidth, d2);

        // 鎖ごとの色（インデックス＋時間でゆるく変化）
        float hue1 = fract(0.60 + 0.03 * fi + 0.10 * sin(phase + 0.5));
        float hue2 = fract(0.85 + 0.03 * fi + 0.10 * sin(phase + 1.8));

        vec3 col1 = hsv2rgb(vec3(hue1, 0.7, 1.0));
        vec3 col2 = hsv2rgb(vec3(hue2, 0.7, 1.0));

        // 中心に近い節ほど少し明るく
        float centerBoost = 1.0 - abs(yPos) / (yMax);
        col1 *= (0.5 + 0.6 * centerBoost);
        col2 *= (0.5 + 0.6 * centerBoost);

        // “はしご”部分（2点を結ぶ線）
        float ld = lineDistance(p, s1, s2);
        float rung = 1.0 - smoothstep(0.015, 0.035, ld);

        // はしごの色（やや白寄り）
        vec3 rungCol = hsv2rgb(vec3(0.58 + 0.02 * sin(phase),
                               0.25,
                               1.0));

        // 細かいトゥイスト：はしごの両端に近いほど色を2色に寄せる
        float tAlong = clamp(dot(p - s1, s2 - s1) / dot(s2 - s1, s2 - s1), 0.0, 1.0);
        vec3 rungMix = mix(col1, col2, tAlong);
        rungCol = mix(rungCol, rungMix, 0.5);

        // max合成で“光るもの優先”
        col = max(col, col1 * bead1);
        col = max(col, col2 * bead2);
        col = max(col, rungCol * rung * 0.9);

        // α用マスク
        accumMask = max(accumMask, max(bead1, max(bead2, rung)));
    }

    // 軽いビネット（中央をちょっと強調）
    float vign = 1.0 - smoothstep(0.9, 1.2, length(p));
    col *= (0.6 + 0.4 * vign);

    // 仕上げトーン
    col = pow(col, vec3(0.95));

    float alpha = accumMask * uAlpha;
    gl_FragColor = vec4(col * uAlpha, alpha);
}