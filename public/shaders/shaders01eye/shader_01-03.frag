#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2  resolution;
uniform float uAlpha;
varying vec2  fragCoord;

// 淡い藍〜群青のパレット
vec3 waveColor(float t){
    // 0..1 -> 青系グラデ
    float h = 0.58 + 0.05*sin(t*0.2);
    float s = 0.45 + 0.10*sin(t*0.33);
    float v = 0.95;
    // HSV->RGB 簡易
    vec3 k = vec3(1.0, 2.0/3.0, 1.0/3.0);
    vec3 p = abs(fract(vec3(h)+k) * 6.0 - 3.0);
    vec3 rgb = v * mix(vec3(1.0), clamp(p-1.0,0.0,1.0), s);
    return rgb;
}

void main(){
    vec2 R = resolution;
    // 正規化座標(-1..1) ただし縦横比を吸収
    vec2 p = (fragCoord*2.0 - R) / min(R.x, R.y);
    float t = time;

    // -------- 青海波タイル座標 --------
    // タイル密度（数値↑で波が細かく）
    float density = 4.0;
    // 少し横方向へ流す（うねり）
    p.x += 0.05 * sin(t*0.7 + p.y*6.0);

    // 行ごとに半目ずらし（千鳥）
    vec2 uv = p * density;
    float row = floor(uv.y);
    float shift = mod(row, 2.0) * 0.5;
    uv.x += shift;

    // タイル内のローカル座標（x: -0.5..0.5, y: 0..1）
    vec2 f = fract(uv) - vec2(0.5, 0.0);
    // 半円の中心はタイル下辺中央(0,0)
    vec2 q = f;

    // 動的ドリフト：行ごとにゆらぎ（波が流れる）
    q.x += 0.08 * sin(t*0.8 + row*1.7);

    // -------- 同心アーチを引く --------
    // アーチの間隔と太さ
    float stepR   = 0.33;  // 同心半径間隔
    float lineW   = 0.045; // 線の太さ
    float edgeW   = 0.010; // エッジのやわらぎ

    // 半径
    float r = length(q);
    // 下半分だけ（半円）：q.y >= 0 のみ有効
    float hemi = step(0.0, q.y);

    // アーチを複数足し合わせる（WebGL1対応で固定ループ）
    const int ARC_COUNT = 4;
    float arcs = 0.0;
    for(int i=0; i<ARC_COUNT; i++){
        float fi = float(i) + 1.0;
        // 時間で半径をほんのり呼吸
        float rr = fi * stepR + 0.015 * sin(t*0.9 + fi*1.8 + row*0.7);
        float d = abs(r - rr);
        // 線バンド（太く）
        float band = 1.0 - smoothstep(lineW, lineW + edgeW, d);
        arcs = max(arcs, band);
    }
    arcs *= hemi; // 半円マスク適用

    // -------- 塗りと線の合成 --------
    // 背景（明るい生成り色）
    vec3 bg = vec3(0.98, 0.975, 0.96);

    // 波の塗り（淡い藍色）
    vec3 fillCol = mix(vec3(0.86,0.90,0.96), vec3(0.78,0.86,0.95), 0.5 + 0.5*sin(row*0.5 + t*0.2));

    // ライン色（群青〜紺をゆっくり変化）
    vec3 lineCol = mix(vec3(0.08,0.20,0.45), vec3(0.02,0.12,0.30), 0.5 + 0.5*sin(t*0.25 + row*0.8));

    // タイル内で、半円の内側は淡い塗り、アーチ部は濃い線
    float disc = smoothstep(0.0, stepR*float(ARC_COUNT)+0.02, r); // 外側マスク（見切れ抑制）
    vec3 base = mix(fillCol, lineCol, arcs);

    // タイル外は背景へ（千鳥の隙間も自然に）
    vec3 col = mix(bg, base, hemi * (1.0 - disc) + arcs);

    // ほんの少しだけコントラストを落としつつ締める
    col = pow(col, vec3(0.95));

    gl_FragColor = vec4(col * uAlpha, uAlpha);
}