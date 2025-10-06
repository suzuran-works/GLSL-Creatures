#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2  resolution;
uniform float uAlpha;
varying vec2  fragCoord;

// ---------- 調整ノブ ----------
const int   NODE_COUNT  = 14;
const int   DEGREE      = 2;
const float R_BASE      = 0.55;
const float R_JITTER    = 0.08;
const float ROT_SPEED   = 0.12;
const float PULSE_SPEED = 0.65;
const float LINE_WIDTH  = 0.009; // 少し太めでくっきり

// ---------- ユーティリティ ----------
vec3 hsv2rgb(vec3 c){
    vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0,0.0,1.0);
    rgb = rgb*rgb*(3.0-2.0*rgb);
    return c.z * mix(vec3(1.0), rgb, c.y);
}
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }

float lineDistParam(vec2 p, vec2 a, vec2 b, out float h){
    vec2 ba = b - a;
    float L2 = max(dot(ba,ba), 1e-6);
    h = clamp(dot(p-a, ba)/L2, 0.0, 1.0);
    vec2 q = a + ba*h;
    return length(p - q);
}

vec2 nodePos(float i, float t){
    float ang = (i/float(NODE_COUNT))*6.2831853 + t*ROT_SPEED;
    float rad = R_BASE
    + R_JITTER * sin(t*0.7 + i*1.7)
    + 0.02     * sin(t*2.3 + i*3.1);
    vec2 p = vec2(cos(ang), sin(ang)) * rad;
    p += 0.015*vec2(sin(t*1.3 + i*2.0), cos(t*1.1 + i*2.7));
    return p;
}

// くっきりトゥーン（4段階）
vec3 toonize(vec3 col){
    float v = max(max(col.r,col.g),col.b);
    float band = (v<0.25)?0.12 : (v<0.45)?0.35 : (v<0.7)?0.65 : 1.0;
    // 彩度を少し上げて“ポップ”に
    vec3 nrm = normalize(col + 1e-6);
    nrm = mix(nrm, nrm*vec3(1.05,1.05,1.05), 0.25);
    return nrm * band;
}

// ---------- 背景の簡易Voronoi（細胞組織・くっきり） ----------
float voronoi(vec2 uv, out float edge){
    vec2 g = floor(uv), f = fract(uv);
    float d1 = 1e9, d2 = 1e9;
    for(int j=-1;j<=1;j++){
        for(int i=-1;i<=1;i++){
            vec2 o = vec2(float(i), float(j));
            vec2 h = vec2(hash(g+o), hash(g+o+7.31));
            vec2 pt = o + h;
            float d = length(f - pt);
            if(d < d1){ d2=d1; d1=d; }
            else if(d < d2){ d2=d; }
        }
    }
    // くっきり境界（狭い幅）
    edge = smoothstep(0.015, 0.0, d2 - d1);
    return d1;
}

void main(){
    vec2 R = resolution;
    vec2 p = (fragCoord*2.0 - R)/min(R.x,R.y);
    float t = time;

    // 背景はやや明るめのグレー紺でパステルを映えさせる
    vec3 col = vec3(0.06, 0.07, 0.09);

    // --- パステル組織（薄く敷くが、輪郭はくっきり） ---
    float edge;
    float d1 = voronoi(p*3.5 + vec2(sin(t*0.2), cos(t*0.17))*0.2, edge);
    // パステル色（ピーチ／ミント／ラベンダー／スカイ）
    vec3 peach     = hsv2rgb(vec3(0.97, 0.28, 0.98));
    vec3 mint      = hsv2rgb(vec3(0.46, 0.30, 0.98));
    vec3 lavender  = hsv2rgb(vec3(0.78, 0.25, 0.98));
    vec3 sky       = hsv2rgb(vec3(0.58, 0.25, 0.98));
    vec3 tissue    = mix(mix(peach, mint,   0.5+0.5*sin(t*0.30)),
                         mix(lavender, sky, 0.5+0.5*cos(t*0.27)),
                         0.5);
    // 境界は少し暗めのパステルで締める
    vec3 membrane  = mix(lavender*0.8, sky*0.8, 0.5);
    col = mix(col, tissue, 0.35) + membrane * edge * 0.8;

    // --- 神経回路：ノード＆配線（パステル・くっきり） ---
    for(int i=0;i<NODE_COUNT;i++){
        float fi = float(i);
        vec2  pi = nodePos(fi, t);

        // 細胞体（輪郭くっきり＋内部パステル）
        float dNode = length(p - pi);
        float somaR = 0.048 + 0.014*sin(t*1.6 + fi*1.3);
        float somaMask = 1.0 - smoothstep(somaR, somaR+0.012, dNode); // 狭めてシャープに
        float outlineMask = smoothstep(somaR+0.015, somaR+0.008, dNode)
        * (1.0 - smoothstep(somaR+0.008, somaR+0.006, dNode));

        vec3 somaFill = mix(mint, peach, 0.5+0.5*sin(t*0.5 + fi*0.9));
        vec3 outline  = mix(lavender*0.6, sky*0.6, 0.5);
        col += somaFill*somaMask*0.95 + outline*outlineMask*0.9;

        // 近傍ノードへ配線
        for(int k=1;k<=DEGREE;k++){
            // WebGL1 wrap
            int j = int(mod(float(i+k), float(NODE_COUNT)));
            float fj = float(j);
            vec2  pj = nodePos(fj, t);

            float h;
            float ld = lineDistParam(p, pi, pj, h);

            // ベース線：輪郭くっきり（幅の遷移をさらに狭める）
            float w = 1.0 - smoothstep(LINE_WIDTH, LINE_WIDTH+0.006, ld);

            // パステル線色（通常：スカイ、パルス：ピーチ）
            vec3 lineBase  = sky*0.95;
            vec3 linePulse = peach;

            // スパイクが走る（2本）
            float phase0 = fract(t*PULSE_SPEED + fi*0.13);
            float phase1 = fract(t*PULSE_SPEED*0.83 + fj*0.17 + 0.33);
            float pulse0 = 1.0 - smoothstep(0.05, 0.0, abs(h - phase0));
            float pulse1 = 1.0 - smoothstep(0.05, 0.0, abs(h - phase1));
            float pulses = clamp(pulse0 + pulse1, 0.0, 1.0);

            // パルス通過時の増量（太さ・明るさ）
            float widen = mix(0.0, 1.0, pulses);
            float wGlow = 1.0 - smoothstep(LINE_WIDTH+0.01*widen, LINE_WIDTH+0.025*widen, ld);

            vec3 lineCol = mix(lineBase, linePulse, pulses);
            col += lineBase*w*0.75 + lineCol*wGlow*(0.7 + 0.3*pulses);

            // シナプス端点をパステルで点滅
            float synI = 1.0 - smoothstep(0.028, 0.05, length(p - pi));
            float synJ = 1.0 - smoothstep(0.028, 0.05, length(p - pj));
            float blink = 0.5 + 0.5*sin(t*3.0 + fi + fj);
            col += linePulse*(synI + synJ)*0.12*blink;
        }
    }

    // トゥーン仕上げ（段階化のみ。ブルーム系のpowを外してくっきり）
    col = toonize(col);

    gl_FragColor = vec4(col * uAlpha, uAlpha);
}