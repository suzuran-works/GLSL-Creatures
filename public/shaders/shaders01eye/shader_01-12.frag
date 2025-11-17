#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2  resolution;
uniform float uAlpha;
varying vec2  fragCoord;

// HSV → RGB
vec3 hsv2rgb(vec3 c){
    vec3 K = vec3(1.0, 2.0/3.0, 1.0/3.0);
    vec3 p = abs(fract(c.xxx + K) * 6.0 - 3.0);
    return c.z * mix(vec3(1.0), clamp(p - 1.0, 0.0, 1.0), c.y);
}

// 円のソフトな輪郭
float circleRing(vec2 p, vec2 center, float radius, float width){
    float d = length(p - center);
    return 1.0 - smoothstep(radius, radius + width, d);
}

void main(void){
    vec2 R = resolution;
    // -1..1 に正規化
    vec2 p = (fragCoord * 2.0 - R) / min(R.x, R.y);
    float t = time;

    // 極座標（背景にちょっとだけ使う）
    float r = length(p);
    float a = atan(p.y, p.x); // -π..π

    // ほんのり背景グラデ（中心明るめ）
    float bgRad = smoothstep(1.2, 0.0, r);
    vec3 bgCol = mix(vec3(0.02, 0.03, 0.08), vec3(0.05, 0.08, 0.15), bgRad);

    vec3 col = bgCol;

    // 複数の円（軌道運動するリング）
    const int N = 10; // 円の数

    for(int i = 0; i < N; i++){
        float fi = float(i);

        // 円の軌道：極座標で中心位置を決める
        float baseAngle = fi * 0.6;
        float angle = baseAngle + t * (0.4 + 0.08 * fi); // それぞれ微妙に速度違い
        float orbitR = 0.3 + 0.3 * sin(t * 0.5 + fi * 0.9); // 軌道半径も呼吸する

        vec2 center = vec2(cos(angle), sin(angle)) * orbitR;

        // 半径も時間でふわふわ
        float radius = 0.10 + 0.03 * sin(t * 0.9 + fi * 1.7);
        float width  = 0.015;

        float ringMask = circleRing(p, center, radius, width);

        // 円ごとに色相をずらす（極座標の角度も少し混ぜる）
        float hue = fract(0.1 * fi + 0.05 * sin(a * 3.0 + fi) + 0.1 * t);
        float sat = 0.7 + 0.2 * sin(t * 0.3 + fi);
        float val = 0.8 + 0.2 * sin(t * 0.4 + fi * 0.5);

        vec3 ringCol = hsv2rgb(vec3(hue, sat, val));

        // 中央ほど明るく、外側の円は少し落とす
        float centerBoost = smoothstep(0.0, 0.6, 1.0 - length(center));
        ringCol *= (0.6 + 0.6 * centerBoost);

        // 重ねるときは max で“光”っぽく
        col = max(col, ringCol * ringMask);
    }

    // 真ん中にちょっとだけ発光コア
    float core = exp(-r * 10.0);
    vec3 coreCol = hsv2rgb(vec3(0.55 + 0.1 * sin(t * 0.7), 0.4, 1.0));
    col = mix(col, coreCol, core);

    // 軽くガンマ
    col = pow(col, vec3(0.95));

    gl_FragColor = vec4(col * uAlpha, uAlpha);
}