#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2  resolution;
uniform float uAlpha;
varying vec2  fragCoord;

// 乱数
float hash(vec2 p){
    return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453);
}

// HSV→RGB（なめらか）
vec3 hsv2rgb(vec3 c){
    vec3 K = vec3(1.0, 2.0/3.0, 1.0/3.0);
    vec3 p = abs(fract(vec3(c.x)+K)*6.0 - 3.0);
    return c.z * mix(vec3(1.0), clamp(p-1.0,0.0,1.0), c.y);
}

void main(){
    vec2 R = resolution;
    vec2 p = (fragCoord*2.0 - R) / min(R.x, R.y);
    float t = time;

    // --- 極座標 ---
    float a = atan(p.y, p.x);   // 角度(-π..π)
    float r = length(p);        // 半径

    // --- 極タイル（セクタ×同心ストリップ） ---
    float sectors  = 6.0;                 // 角度分割
    float radPitch = 0.22;                 // 半径ピッチ
    float dAng     = 6.2831853 / sectors;

    // セル内相対座標
    float aCell = mod(a + 3.14159265, dAng) - 0.5*dAng;     // (-Δ/2..Δ/2)
    float rCell = mod(r + 0.5*radPitch, radPitch) - 0.5*radPitch; // (-pitch/2..pitch/2)

    // セルの整数インデックス（回転乱数の種）
    float sectorIdx = floor((a + 3.14159265) / dAng);
    float radialIdx = floor((r + 0.5*radPitch) / radPitch);

    // 弧長を使ってセル内を直交化（円の歪み防止）
    float yArc       = aCell * max(r, 1e-3);
    float cellAspect = radPitch / (dAng * max(r, 1e-3));
    vec2  g          = vec2(rCell, yArc * cellAspect); // セル内ローカル座標

    // --- 各セルごとにランダム回転（+ ランダム速度） ---
    float rnd   = hash(vec2(sectorIdx, radialIdx));             // 0..1
    float baseA = rnd * 6.2831853;                              // 基本角
    float speed = (rnd * 2.0 - 1.0) * 0.9;                      // -0.9..0.9
    float theta = baseA + speed * t;                            // 時間で回転

    float cs = cos(theta), sn = sin(theta);
    vec2  gr = mat2(cs, -sn, sn, cs) * g;                       // 回転後ローカル

    // --- 花弁調の方位依存で「回転が見える円輪」に ---
    float petals = 2.0 + floor(hash(vec2(sectorIdx+17.3, radialIdx-9.1)) * 4.0); // 2..5
    float angLocal = atan(gr.y, gr.x);
    float orient   = 0.6 + 0.4 * (0.5 + 0.5*cos(angLocal * petals)); // 0.6..1.0

    // --- 円輪（複数本） ---
    float ringR = 0.32 * radPitch;
    float lineW = 0.030;
    float edgeW = 0.010;

    float d0   = abs(length(gr) - ringR);
    float d1   = abs(length(gr) - ringR*0.62);

    float ring1 = 1.0 - smoothstep(lineW, lineW+edgeW, d0);
    float ring2 = 1.0 - smoothstep(lineW, lineW+edgeW, d1);
    float rings = max(ring1, ring2);

    // 方位依存を掛けて、回転の見え味を付与
    rings *= orient;

    // セル外縁の見切れを少し抑制
    float diskMask = 1.0 - smoothstep(0.5*radPitch, 0.5*radPitch+0.02, length(g));

    // --- ホログラム風カラー（角度＆インデックス依存） ---
    float grf = 0.55*(r / radPitch) + 0.55*(a / dAng)
    + 0.15*sin(t*0.35) + 0.10*hash(vec2(radialIdx, sectorIdx));
    float hue = fract(grf + 0.12*sin(6.2831*(r/radPitch) - t*0.8));
    vec3  holo = hsv2rgb(vec3(hue, 0.85, 1.0));

    // 軽いベース反射
    vec3 bg   = vec3(0.02, 0.03, 0.06);
    vec3 base = mix(bg, vec3(0.92), rings*0.30);

    // 虹＋回転模様
    vec3 col  = mix(base, holo, rings*0.70);

    // 枠外まで見せる（フェード無し）
    col = pow(col, vec3(0.95));

    gl_FragColor = vec4(col * uAlpha, uAlpha);
}