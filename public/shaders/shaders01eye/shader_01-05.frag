#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2  resolution;
uniform float uAlpha;
varying vec2  fragCoord;

// HSV→RGB（なめらか）
vec3 hsv2rgb(vec3 c){
    vec3 K = vec3(1., 2./3., 1./3.);
    vec3 p = abs(fract(vec3(c.x)+K)*6. - 3.);
    return c.z * mix(vec3(1.), clamp(p-1.,0.,1.), c.y);
}

void main(){
    vec2 R  = resolution;
    vec2 p  = (fragCoord*2.0 - R) / min(R.x, R.y);
    float t = time;

    // --- 極座標へ ---
    float a = atan(p.y, p.x);         // 角度 θ (-π..π)
    float r = length(p);              // 半径 r (0..)

    // --- 極タイル（角度セクタ×半径ストリップ） ---
    // セクタ数と半径方向のピッチ（見た目の細かさ）
    float sectors = 14.0;             // 角度分割（多いほど細かい）
    float radPitch = 0.22;            // 半径ピッチ（小さいほど詰む）

    // 角度セル内の相対角（-Δ/2..+Δ/2）
    float dAng = 6.2831853 / sectors;
    float aCell = mod(a + 3.14159265, dAng) - 0.5*dAng;

    // 半径セル内の相対半径（-radPitch/2..+radPitch/2）
    float rCell = mod(r + 0.5*radPitch, radPitch) - 0.5*radPitch;

    // --- セル内で“直交座標”に近似（yを弧長に）
    float yArc = aCell * max(r, 1e-3);        // 弧長 ≒ r*Δθ
    // セルの横縦比を揃える（yをスケール）
    float cellAspect = radPitch / (dAng * max(r, 1e-3));
    vec2  g = vec2(rCell, yArc * cellAspect); // 極セル内ローカル座標

    // --- 円の輪（リング）を描く（重なりは反復で自然発生） ---
    float ringR   = 0.32 * radPitch;   // リング半径（セル基準）
    float lineW   = 0.030;             // 線太さ
    float edgeW   = 0.010;             // エッジのやわらぎ
    float d       = length(g);
    float ring1   = 1.0 - smoothstep(lineW, lineW+edgeW, abs(d - ringR));
    float ring2   = 1.0 - smoothstep(lineW, lineW+edgeW, abs(d - ringR*0.62));
    float rings   = max(ring1, ring2);

    // 可視範囲（セル外縁を少し抑える）
    float diskMask = 1.0 - smoothstep(0.5*radPitch, 0.5*radPitch+0.02, length(g));

    // --- ホログラム風カラー（角度×位相で虹が走る） ---
    float gr = 0.55*(r / radPitch) + 0.55*(a / dAng) + 0.15*sin(t*0.35);
    float hue = fract(gr + 0.12*sin(6.2831*(r/radPitch) - t*0.8));
    float sat = 0.85;
    float val = 1.00;
    vec3 holo = hsv2rgb(vec3(hue, sat, val));

    // --- 反射筋（方向でチラッと光る） ---
    // セクタの“接線”を擬似法線にしてライトとドット
    vec2 L = normalize(vec2(cos(t*0.3), sin(t*0.23)));
    vec2 T = normalize(vec2(1.0, 0.35*cos(6.0*g.y + t*0.6)));
    float highlight = pow(abs(dot(T, L)), 18.0) * rings;

    // --- 合成 ---
    vec3 bg  = vec3(0.02, 0.03, 0.06);                  // ダーク地
    vec3 base= mix(bg, vec3(0.92), rings*0.30);         // 下地の白反射
    vec3 col = mix(base, holo, rings*0.70);             // 虹をのせる
    col += highlight * mix(vec3(1.0), holo, 0.4);       // 走る反射筋

    // 枠外までしっかり見せる（フェード無し）
    // 仕上げ
    col = pow(col, vec3(0.95));
    gl_FragColor = vec4(col * uAlpha, uAlpha);
}