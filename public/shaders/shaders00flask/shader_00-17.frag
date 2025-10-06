#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2  resolution;
uniform float uAlpha;
varying vec2  fragCoord;

// ==== Utils ====
vec3 hsv2rgb(vec3 c){
    vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0,0.0,1.0);
    rgb = rgb*rgb*(3.0-2.0*rgb);
    return c.z * mix(vec3(1.0), rgb, c.y);
}
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float vnoise(vec2 p){ // value noise 1 octave
                      vec2 i = floor(p), f = fract(p);
                      vec2 u = f*f*(3.0-2.0*f);
                      float a = hash(i + vec2(0,0));
                      float b = hash(i + vec2(1,0));
                      float c = hash(i + vec2(0,1));
                      float d = hash(i + vec2(1,1));
                      return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
}

// 距離をシャープに帯化する補助
float band(float x, float w){
    return 1.0 - smoothstep(w, w+0.006, abs(x));
}

void main(){
    vec2 R = resolution;
    vec2 p = (fragCoord*2.0 - R) / min(R.x, R.y);   // 正規化(-1..1)
    vec2 baseP = p;
    float t = time;

    // 背景：夜空の深い青
    vec3 col = vec3(0.0, 0.0, 0.0);

    // 奥行き感を出すための遠近スケール
    float depthVignette = smoothstep(1.2, 0.2, length(p));

    // ===== Aurora Ribbons =====
    // 定数本数・WebGL1対応
    const int RIBS = 7;
    for(int i=0; i<RIBS; i++){
        float fi = float(i);

        // それぞれの帯のパラメータ
        float layer  = mix(0.5, 1.8, fi/float(RIBS-1));   // 奥行き層（遠いほど小さく）
        vec2  q      = p * layer;

        // ドメインワープでうねりを作る
        float n1 = vnoise(vec2(q.x*1.2 + fi*1.37, q.y*0.8 + t*0.15));
        float n2 = vnoise(vec2(q.x*0.6 + t*0.09,   q.y*1.3 + fi*0.7));
        float warp = (n1*2.0-1.0)*0.35 + (n2*2.0-1.0)*0.25;

        // 帯の中心曲線（sine + warp）
        float center = 0.5*sin(q.x*2.2 + t*0.7 + fi*0.9) + warp;

        // 帯の太さ（層で変える）
        float width = mix(0.11, 0.045, fi/float(RIBS-1));

        // 帯マスク（シャープ目）
        float m = band(q.y - center, width);

        // 色相：層と位置・時間で微変化（オーロラ系）
        float hue = fract(0.55 + 0.18*sin(t*0.2 + fi*0.6) + 0.08*q.x);
        float sat = 0.9;
        float val = 0.65 + 0.35*depthVignette;

        vec3 ribbon = hsv2rgb(vec3(hue, sat, val)) * m;

        // 帯のエッジに光の縁取り（内側グロー）
        float edge = smoothstep(width*1.2, width*0.7, abs(q.y - center));
        ribbon += hsv2rgb(vec3(hue, 0.5, 1.0)) * edge * 0.25;

        // 層の遠近減衰（遠い層は暗く＆青に寄る）
        float fade = mix(0.45, 1.0, 1.0 - fi/float(RIBS-1));
        ribbon *= fade;

        // 合成（最大値で光を拾う）
        col = max(col, ribbon);
    }

    // ほんの少しだけコントラスト
    col = pow(col, vec3(0.95));

    // 外側にフェードアウト
    float dist = length(baseP);
    float thresDist = 0.45;
    float fadeLength = 0.0025;
    col *= smoothstep(thresDist, thresDist - fadeLength, dist);

    gl_FragColor = vec4(col * uAlpha, uAlpha);
}