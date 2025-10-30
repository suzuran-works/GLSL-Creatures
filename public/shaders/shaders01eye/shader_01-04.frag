#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2  resolution;
uniform float uAlpha;
varying vec2  fragCoord;

// ちいさめノイズ（ラメ＆質感）
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float vnoise(vec2 p){
    vec2 i=floor(p), f=fract(p);
    vec2 u=f*f*(3.0-2.0*f);
    float a=hash(i), b=hash(i+vec2(1,0));
    float c=hash(i+vec2(0,1)), d=hash(i+vec2(1,1));
    return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
}

// HSV→RGB（滑らか）
vec3 hsv2rgb(vec3 c){
    vec3 K = vec3(1.0, 2.0/3.0, 1.0/3.0);
    vec3 p = abs(fract(vec3(c.x)+K)*6.0 - 3.0);
    vec3 rgb = c.z * mix(vec3(1.0), clamp(p-1.0,0.0,1.0), c.y);
    return rgb;
}

void main(){
    vec2 R = resolution;
    vec2 p = (fragCoord*2.0 - R) / min(R.x, R.y);
    float t = time;

    // --- 斜め配置（ホロ箔の角度） ---
    float rot = radians(-24.0);
    mat2 M = mat2(cos(rot), -sin(rot),
    sin(rot),  cos(rot));
    vec2 q = M * p;

    // --- ベース波（斜めストライプ） ---
    float f0   = 9.5;                                // ストライプ密度
    float warp = 0.35 * sin(q.y*3.0 + t*0.7);        // 横うねり
    float phase= q.x*(f0 + 1.7*warp) - t*1.25;
    float s    = sin(phase);                         // -1..1

    // 厚い帯／薄い帯（ホロ箔のベース明暗）
    float bandWide = 1.0 - smoothstep(0.24, 0.55, abs(s));
    float bandThin = 1.0 - smoothstep(0.08, 0.18, abs(s));

    // --- ホログラム色（疑似回折：角度×位相→色相） ---
    // grating = 入射角に相当する量（斜め方向の成分＋うねり）
    float grating = q.x*2.2 + 0.6*sin(q.y*2.8 + t*0.6);
    // 虹色：時間でわずかに揺れる
    float hue = fract(grating*0.65 + s*0.12 + 0.05*sin(t*0.33));
    float sat = 0.85;
    float val = 1.00;

    vec3 holoRGB = hsv2rgb(vec3(hue, sat, val));

    // --- 反射ハイライト（走る筋） ---
    // 擬似光源方向（ゆっくり回転）
    vec2 L = normalize(vec2(cos(t*0.31), sin(t*0.23)));
    // 波の“法線”の代わりに、筋の向きベクトルを作る
    vec2 T = normalize(vec2(1.0, 0.4*cos(q.y*3.0 + t*0.7))); // ストライプ接線の近似
    float aniso = pow(abs(dot(T, L)), 18.0);                 // アニソ反射
    // ストライプ中心ほど反射が強いように
    float mid = 1.0 - smoothstep(0.0, 0.28, abs(s));
    float highlight = aniso * mid;

    // --- 微細ラメ ---
    float glitter = vnoise(q*min(R.x,R.y)*0.28 + vec2(t*0.45, -t*0.37));
    glitter = smoothstep(0.80, 1.0, glitter) * 0.35;

    // --- 配色合成 ---
    // 背景（ダークネイビー）
    vec3 bg = vec3(0.02, 0.03, 0.06);

    // まずベースの明暗を作る（厚帯＝明るめ、薄帯＝やや明）
    vec3 baseTone = mix(bg, vec3(0.92), bandWide*0.80);
    baseTone = mix(baseTone, vec3(0.35), (1.0-bandWide)*0.2);  // 影の帯

    // 虹色を重ねる：薄帯で軽く、厚帯で強め
    vec3 col = mix(baseTone, holoRGB, bandThin*0.55 + bandWide*0.35);

    // 走るホロ反射筋
    col += highlight * mix(vec3(1.0), holoRGB, 0.35);

    // ラメを控えめに
    col += glitter * 0.12;

    // ほんの少しガンマで締め
    col = pow(col, vec3(0.95));

    gl_FragColor = vec4(col * uAlpha, uAlpha);
}