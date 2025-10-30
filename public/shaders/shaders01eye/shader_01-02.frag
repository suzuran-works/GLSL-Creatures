#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2  resolution;
uniform float uAlpha;
varying vec2  fragCoord;

// ===== HSV→RGB =====
vec3 hsv2rgb(vec3 c){
    vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0,0.0,1.0);
    rgb = rgb*rgb*(3.0-2.0*rgb);
    return c.z * mix(vec3(1.0), rgb, c.y);
}

// ===== 簡易 value noise =====
float hsh(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float vnoise(vec2 p){
    vec2 i=floor(p), f=fract(p);
    vec2 u=f*f*(3.0-2.0*f);
    float a=hsh(i+vec2(0,0)), b=hsh(i+vec2(1,0));
    float c=hsh(i+vec2(0,1)), d=hsh(i+vec2(1,1));
    return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
}

void main(){
    vec2 R = resolution;
    vec2 p = (fragCoord*2.0 - R) / min(R.x, R.y);
    float t = time;

    // ===== ゆっくり回転＋非整数比ズーム（比をズラす） =====
    float rot = 0.13 * t;                   // 回転
    float z   = 1.0 + 0.22 * sin(t * 0.233); // 呼吸ズーム（0.233 / 0.13 は非整数比）
    mat2 M = mat2(cos(rot), -sin(rot),
    sin(rot),  cos(rot));
    p = (M * p) * z;

    // ===== 万華鏡反射（細かさも少し時間変化） =====
    float tiles = 2.2 + 0.25*sin(t*0.11);
    p = abs(mod(p*tiles, 2.0) - 1.0);

    // ===== 極座標 & ドメインワープ =====
    float ang = atan(p.y, p.x);
    float rad = length(p);

    // ゆるいノイズで角度・半径をワープ（滑らか）
    float n1 = vnoise(vec2(ang*1.7, rad*2.4 + t*0.37));
    float n2 = vnoise(vec2(ang*2.3 - t*0.19, rad*1.6));
    float warpA = (n1*2.0-1.0)*0.35;
    float warpR = (n2*2.0-1.0)*0.25;

    float A = ang*10.0 + warpA + t*0.21;          // 放射方向の周波
    float Rr = rad*12.0 + warpR - t*0.47;         // 同心円方向の周波

    // 幾何×有機のハイブリッド模様
    float patt = sin(Rr) + cos(A) + sin(dot(p,p*4.0) - t*0.31);

    // ===== トゥーン段階化＋縁取り =====
    float steps = 3.2;                              // 段階数（増やすと繊細）
    float stepped = floor(patt * steps) / steps;    // トーン
    float edge = smoothstep(0.06, 0.0, abs(fract(patt*2.0)-0.5)); // 細縁

    // ===== カラーパレット（群青↔ターコイズ↔紫）＋金色エッジ =====
    float hue = fract(0.58 + 0.20*sin(t*0.12) + 0.17*stepped + 0.12*(n1-n2));
    float sat = 0.55 + 0.35*sin(t*0.18 + n2*6.0);
    float val = 0.88 + 0.08*sin(t*0.21 + rad*7.0);

    vec3 base = hsv2rgb(vec3(hue, sat, val));
    base *= (0.72 + 0.28*stepped);                 // 段階に応じて明暗

    // 縁を“ゴールド”寄りに明るく
    vec3 gold = vec3(1.0, 0.92, 0.65);
    vec3 col = mix(base, gold, edge*0.35);

    // ほんのりコントラスト
    col = pow(col, vec3(0.92));

    gl_FragColor = vec4(col * uAlpha, uAlpha);
}