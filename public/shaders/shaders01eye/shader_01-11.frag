#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2  resolution;
uniform float uAlpha;
varying vec2  fragCoord;

// ちょっとした value noise
float hash(vec2 p){
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float vnoise(vec2 p){
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f*f*(3.0 - 2.0*f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// 軽いfbmで水面ゆらぎ
float fbm(vec2 p){
    float s = 0.0;
    float amp = 0.5;
    mat2 m = mat2(1.6, -1.2, 1.2, 1.6);
    for(int i = 0; i < 3; i++){
        s += amp * vnoise(p);
        p = m * p * 1.8;
        amp *= 0.55;
    }
    return s;
}

void main(void){
    vec2 R = resolution;
    // -1..1 に正規化
    vec2 p = (fragCoord * 2.0 - R) / min(R.x, R.y);
    float t = time;

    // ちょっと全体を回転＆縮尺（単調にならない程度に）
    float rot = 0.05 * t;
    mat2 rotM = mat2(cos(rot), -sin(rot), sin(rot), cos(rot));
    p = rotM * p;

    // 中央からの距離
    float r = length(p);

    // --- 水面のゆらぎ（ドメインワープ） ---
    vec2 warp;
    warp.x = fbm(p * 3.0 + vec2( 0.3 * t, 0.0));
    warp.y = fbm(p * 3.0 + vec2(-0.2 * t, 0.5));
    vec2 pw = p + (warp - 0.5) * 0.15;  // ゆるく水面を曲げる

    float rw = length(pw);

    // --- 中央から外へ流れる波紋 ---
    float speed1 = 3.5;
    float speed2 = 5.7;

    // 時間とともに外側へ流れていくサイン波
    float wave1 = sin(18.0 * rw - speed1 * t);
    float wave2 = sin(32.0 * rw - speed2 * t);

    // 重ねてちょっと複雑に
    float ripple = wave1 * 0.6 + wave2 * 0.4;

    // 波紋の強さを 0..1 に正規化
    float ripNorm = ripple * 0.5 + 0.5;

    // 中央の“湧き出し”感：中心ほど強く＆脈動
    float springCore = exp(-rw * 8.0);
    float pulse = 0.5 + 0.5 * sin(t * 3.0);
    float spring = springCore * (0.7 + 0.6 * pulse);

    // 全体の水の強度
    float waterStrength = clamp(ripNorm * 0.7 + spring, 0.0, 1.2);

    // --- カラーリング（水の色） ---
    // 深い青〜シアン〜ハイライト白
    vec3 deep  = vec3(0.02, 0.08, 0.18);  // 外側の深い水
    vec3 mid   = vec3(0.05, 0.40, 0.80);  // 中間の青
    vec3 light = vec3(0.70, 0.95, 1.00);  // ハイライト（泡/反射）

    // 半径方向のグラデーション（中心明るく、外側暗く）
    float radT = smoothstep(0.0, 0.9, rw);
    vec3 baseCol = mix(mid, deep, radT);

    // 波紋による明るさ変化
    float rippleHighlight = smoothstep(0.6, 1.0, ripNorm);
    vec3 waveCol = mix(baseCol, light, rippleHighlight * 0.8);

    // 中央の湧き出し部分を明るく
    vec3 col = waveCol + light * spring * 0.8;

    // 水面の細かいきらめき
    float sparkle = fbm(pw * 8.0 + vec2(t * 1.5, -t * 1.2));
    float sparkMask = smoothstep(0.78, 1.0, sparkle);
    col += light * sparkMask * 0.15;

    // 外側をフェードアウト（丸い水たまりみたいに）
    float mask = 1.0 - smoothstep(0.9, 1.1, r);
    col *= mask;

    // ちょいトーン調整
    col = pow(col, vec3(0.95));

    float alpha = mask * uAlpha;
    gl_FragColor = vec4(col * uAlpha, alpha);
}