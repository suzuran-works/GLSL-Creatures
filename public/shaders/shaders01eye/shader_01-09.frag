#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2  resolution;
uniform float uAlpha;
varying vec2  fragCoord;

// ===== util =====
float hash(float n){ return fract(sin(n)*43758.5453123); }
float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }

// value noise
float vnoise(vec2 p){
    vec2 i=floor(p), f=fract(p);
    vec2 u=f*f*(3.0-2.0*f);
    float a=h2(i), b=h2(i+vec2(1,0));
    float c=h2(i+vec2(0,1)), d=h2(i+vec2(1,1));
    return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
}

// fractal Brownian motion
float fbm(vec2 p){
    float a = 0.0, amp = 0.5;
    for(int i=0;i<5;i++){
        a += amp * vnoise(p);
        p = mat2(0.8, -0.6, 0.6, 0.8) * p * 1.85;
        amp *= 0.55;
    }
    return a;
}

// HSV→RGB
vec3 hsv2rgb(vec3 c){
    vec3 K=vec3(1.,2./3.,1./3.), p=abs(fract(vec3(c.x)+K)*6.-3.);
    return c.z * mix(vec3(1.), clamp(p-1.,0.,1.), c.y);
}

// 動くシード（星雲の“結節点”）
vec2 seedPos(float i, float t){
    float g = 1.61803398875;
    float a = t*0.22 + i*g*3.1;
    float r = 0.62 + 0.08*sin(t*0.17 + i);
    vec2  p = r*vec2(cos(a), sin(a));
    float a2 = t*0.9 + i*4.37;
    p += 0.12*vec2(cos(a2), sin(a2));
    return p;
}

void main(){
    vec2 R = resolution;
    vec2 p = (fragCoord*2.0 - R) / min(R.x, R.y);
    float t = time;

    // ゆっくり回転ズーム（非整数比）
    float rot=0.09*t, sc=1.0+0.18*sin(0.213*t);
    mat2 M=mat2(cos(rot),-sin(rot),sin(rot),cos(rot));
    p = (M*p)*sc;

    // ドメインワープ（星雲の“煙”）
    vec2 nw = vec2(fbm(p*1.4 + vec2(t*0.07, -t*0.05)),
    fbm(p*1.2 - vec2(t*0.05,  t*0.06)));
    vec2 q = p + (nw-0.5)*0.6;  // 形をゆるく撓ませる

    // Moving Voronoi (F1, F2)
    const int N=16;
    float d1=1e9, d2=1e9; float id1=0.0;
    for(int k=0;k<N;k++){
        float fi=float(k);
        vec2 s = seedPos(fi, t);
        float d = length(q - s);
        if(d<d1){ d2=d1; d1=d; id1=fi; }
        else if(d<d2){ d2=d; }
    }
    float edge = d2 - d1;           // 境界っぽさ（フィラメント基）
    float fil  = exp(-edge*12.0);   // 細い糸をガス風に

    // ガス密度：fBm煙 × フィラメント × 中心減衰
    float smoke = fbm(q*2.2 + nw*2.0);
    float core  = exp(-length(p)*0.8);
    float dens  = clamp(0.25*smoke + 0.9*fil + 0.35*core, 0.0, 1.5);

    // 色（星雲パレット：群青→紫→ピンク）
    float hue   = 0.63 + 0.12*fbm(q*1.1 + vec2(t*0.05, -t*0.04));
    float sat   = 0.6 + 0.35*fbm(q*3.0);
    float val   = 0.8 + 0.2*fbm(q*2.0 + nw*3.0);
    vec3  neb   = hsv2rgb(vec3(fract(hue), clamp(sat,0.0,1.0), val));

    // 発光コア（密度に応じて加算っぽく）
    vec3 glow = neb * (dens*1.1);
    glow += vec3(0.8,0.6,1.0) * pow(dens, 2.4) * 0.35; // ピンク寄りハイライト

    // 星（ランダム瞬き）
    vec2 sp  = q * (min(R.x,R.y)*0.12);
    float sA = step(0.997, vnoise(floor(sp))); // 疑似ドット星
    float tw = 0.5 + 0.5*sin(t*6.0 + vnoise(sp*3.1)*6.2831);
    vec3  star = vec3(1.0,0.95,0.9) * sA * (0.25 + 0.75*tw);

    // 境界沿いの帯電発光（細/太）
    float rimThin = 1.0 - smoothstep(0.020, 0.040, edge);
    float rimWide = 1.0 - smoothstep(0.060, 0.120, edge);
    vec3  rimCol  = hsv2rgb(vec3(fract(hue+0.07), 0.9, 1.0));
    vec3  rim = rimCol * (rimThin*0.65 + rimWide*0.25);

    // 合成
    vec3 bg = vec3(0.02,0.02,0.05);
    vec3 col = bg;
    col = mix(col, glow, clamp(dens,0.0,1.0));
    col += rim * 0.6;
    col += star;

    // ソフトなガンマ
    col = pow(col, vec3(0.92));

    gl_FragColor = vec4(col * uAlpha, uAlpha);
}