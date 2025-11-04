#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2  resolution;
uniform float uAlpha;
varying vec2  fragCoord;

// HSV→RGB（滑らか）
vec3 hsv2rgb(vec3 c){
    vec3 K = vec3(1., 2./3., 1./3.);
    vec3 p = abs(fract(vec3(c.x)+K)*6. - 3.);
    return c.z * mix(vec3(1.), clamp(p-1.,0.,1.), c.y);
}

// ソフト円SDF
float softCircle(vec2 p, float r, float w){
    float d = length(p) - r;
    return 1.0 - smoothstep(0.0, w, d);
}

// ソフトリング
float softRing(vec2 p, float r, float w, float blur){
    float d = abs(length(p) - r);
    return 1.0 - smoothstep(w, w+blur, d);
}

// 角度で半径が変わる“星形”の塗り（近似）：n=星の枚数, rOuter/rInner
float starFill(vec2 p, float n, float rOuter, float rInner, float edge){
    float r = length(p);
    float a = atan(p.y, p.x);
    // cos(n*θ)で外周半径を補間（内外半径の間を角度で遷移）
    float k  = 0.5 + 0.5*cos(a*n);
    float rr = mix(rInner, rOuter, k);
    // r <= rr なら内部
    return smoothstep(edge, 0.0, r - rr);
}

void main(){
    vec2 R = resolution;
    vec2 p = (fragCoord*2.0 - R) / min(R.x, R.y);
    float t = time;

    // ---- 目の座標系（横に広い楕円）----
    vec2 eyeP = p;
    eyeP.y *= 0.6;
    eyeP.x *= 0.6;
    // まぶたの微妙な傾き（ほんの少し回す）
    float rot = radians(4.0);
    mat2 M = mat2(cos(rot),-sin(rot),sin(rot),cos(rot));
    eyeP = M * eyeP;

    // ---- 白目（スキントーン寄りの白）----
    vec3 bgSkin = vec3(1.00, 0.96, 0.96);
    vec3 sclera = vec3(0.98, 0.98, 0.995);
    float eyeMask = softCircle(eyeP, 0.95, 0.02);
    vec3  col = mix(bgSkin, sclera, eyeMask);

    // ---- 虹彩座標（瞳の中心）----
    vec2 irisP = eyeP;
    // ごく弱い揺らぎ（呼吸）
    float wob = 0.008*sin(t*1.2);
    float irisR = 0.48 + wob;           // 虹彩外周
    float irisInnerR = 0.36 + wob*0.6;  // 虹彩内側（瞳孔の少し外）

    // ---- 虹彩のカラー：青紫〜ピンク寄りに回る（角度×半径）----
    float ang = atan(irisP.y, irisP.x);
    float rad = length(irisP);
    float hue = fract(0.78 + 0.10*sin(ang*2.0) + 0.08*sin(t*0.6) - 0.12*rad);
    float sat = 0.65 + 0.25*sin(t*0.8 + rad*6.0);
    float val = 0.90;
    vec3 irisGrad = hsv2rgb(vec3(hue, sat, val));

    // 虹彩のリング＆段階（トゥーン寄り）
    float rimOuter = softRing(irisP, irisR, 0.015, 0.015);
    float rimInner = softRing(irisP, irisInnerR, 0.010, 0.010);
    // 放射ストライプ（角度で薄い筋）
    float rays = 0.18 * (0.5 + 0.5*cos(ang*16.0 + 2.3*sin(t*0.7)));
    vec3 irisCol = irisGrad * (0.55 + 0.45*rays);
    irisCol = mix(irisCol, irisGrad*1.1, rimOuter*0.7);
    irisCol = mix(irisCol, irisGrad*0.85, rimInner*0.7);

    // 虹彩の塗り（白目に重ね）
    float irisFill = softCircle(irisP, irisR+0.012, 0.015);
    col = mix(col, irisCol, irisFill);

    // ---- 星形“瞳孔” ----
    // 枚数は 5 or 6 を時間でふわっと遷移（固定にしたいなら const に）
    float nStar = mix(5.0, 6.0, 0.5+0.5*sin(t*0.25));
    // 大きさを脈動
    float starOuter = 0.20 + 0.02*sin(t*1.1);
    float starInner = 0.08 + 0.01*sin(t*1.3 + 1.2);
    float star = starFill(irisP, nStar, starOuter, starInner, 0.006);
    // 瞳孔は濃い色（ほんのり紫寄りの黒）
    vec3 pupilCol = vec3(0.05, 0.03, 0.08);
    col = mix(col, pupilCol, star);

    // ---- きらめき（ハイライト）----
    // メインハイライト（右上）
    vec2 hl1 = irisP - vec2( 0.18, 0.14);
    float h1 = softCircle(hl1, 0.07, 0.06);
    // サブハイライト（左下）
    vec2 hl2 = irisP + vec2( 0.10, 0.10);
    float h2 = softCircle(hl2, 0.035, 0.04);
    // 小スパーク（リング上を流れる）
    float ringAng = atan(irisP.y, irisP.x);
    float sparkle = 0.0;
    const int K = 6;
    for(int i=0;i<K;i++){
        float fi = float(i);
        float a0 = fi*(6.2831853/float(K)) + t*0.6;
        vec2 sPos = vec2(cos(a0), sin(a0)) * (irisR*0.86);
        sparkle += softCircle(irisP - sPos, 0.02, 0.02);
    }
    vec3 hiCol = vec3(1.0, 0.97, 0.95);
    col = mix(col, hiCol, clamp(h1*0.9 + h2*0.6 + sparkle*0.35, 0.0, 1.0));

    // ---- まぶたの影（上側を少しシェード）----
    float lid = smoothstep(0.2, -0.25, eyeP.y + 0.15); // 上から落ちる影
    col *= mix(1.0, 0.88, lid);

    // ---- 目の外側フェザ（ごく薄く）----
    float vign = 1.0 - smoothstep(0.96, 1.06, length(eyeP));
    col = mix(bgSkin, col, clamp(vign + eyeMask*0.8, 0.0, 1.0));

    gl_FragColor = vec4(col * uAlpha, uAlpha);
}