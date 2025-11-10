#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2  resolution;
uniform float uAlpha;
varying vec2  fragCoord;

// ===== Utilities =====
float hash(float n){ return fract(sin(n)*43758.5453123); }

// HSV -> RGB（なめらか）
vec3 hsv2rgb(vec3 c){
    vec3 K = vec3(1., 2./3., 1./3.);
    vec3 p = abs(fract(vec3(c.x)+K)*6. - 3.);
    return c.z * mix(vec3(1.), clamp(p-1.,0.,1.), c.y);
}

// 種iの“公転+自転”で動くシード座標（円+小さな周回）
vec2 seedPos(float i, float t){
    float g = 1.61803398875;               // 黄金比で位相を散らす
    float a = t*0.33 + i*g*3.1;            // ゆっくり回転
    float r = 0.62 + 0.06*sin(t*0.21 + i); // 半径が呼吸
    vec2  p = r*vec2(cos(a), sin(a));

    // 小さな衛星軌道でひっかき回す
    float a2 = t*1.15 + i*4.37;
    p += 0.12*vec2(cos(a2), sin(a2));

    // ランダムな楕円化
    float e = 0.35 + 0.25*hash(i*17.3+9.1);
    p.x *= mix(1.0, 1.0+e, 0.6);
    return p;
}

void main(){
    vec2 R = resolution;
    vec2 p = (fragCoord*2.0 - R) / min(R.x, R.y);
    float t = time;

    // ほんのり回転・ズーム（非整数比で止まりそうで止まらない）
    float rot = 0.11*t;
    float scl = 1.0 + 0.15*sin(0.237*t);
    mat2  M   = mat2(cos(rot), -sin(rot), sin(rot), cos(rot));
    p = (M*p)*scl;

    // ===== Moving Voronoi (F1, F2) =====
    const int N = 16;               // 細胞数（増やすと密）
    float d1 = 1e9, d2 = 1e9;       // 近傍/次近傍距離
    float id1 = 0.0, id2 = 0.0;     // それぞれのID

    for(int k=0;k<N;k++){
        float fi = float(k);
        vec2  s  = seedPos(fi, t);
        float d  = length(p - s);
        // 1位/2位を更新
        if(d < d1){
            d2 = d1; id2 = id1;
            d1 = d;  id1 = fi;
        }else if(d < d2){
            d2 = d;  id2 = fi;
        }
    }

    // 境界のシャープな指標（WorleyのF2-F1）
    float edge = d2 - d1;

    // ===== セル内部の“生きてる”感 =====
    // 近傍シードの位置を再取得（IDベースで決定的）
    vec2 s1 = seedPos(id1, t);

    // リング波（胞子の脈動）：中心から外へ走る波
    float ring = 0.5 + 0.5*sin(8.0*d1 - t*2.3 + id1*0.7);

    // 軌跡の方向性：境界に沿った流れ（勾配近似）
    vec2  dir = normalize(p - s1);
    float flow = 0.5 + 0.5*sin(dot(dir, vec2(cos(t*0.6), sin(t*0.47)))*6.0 + t*1.3);

    // 境界発光（細め/太めの二重ライン）
    float borderThin = 1.0 - smoothstep(0.020, 0.040, edge);
    float borderWide = 1.0 - smoothstep(0.060, 0.120, edge);

    // ===== カラー設計 =====
    // セルごとに基調色をジッター、時間でも少し回す
    float hueBase = fract(0.15*hash(id1*3.1+5.7) + 0.10*sin(0.2*t) + id1*0.037);
    float hue     = fract(hueBase + 0.08*sin(6.2831*ring + id1));
    float sat     = 0.70 + 0.20*flow;
    float val     = 0.90;

    vec3 cellCol  = hsv2rgb(vec3(hue, sat, val));
    // セル内の階調（リング×フロー）で奥行き
    cellCol *= 0.70 + 0.30*ring*flow;

    // 境界は明るく、かつ色も少しホロ寄り
    vec3 edgeCol  = hsv2rgb(vec3(fract(hue+0.12), 0.85, 1.0));

    // ===== 合成 =====
    // 背景は暗めでコントラストを確保
    vec3 bg = vec3(0.02, 0.03, 0.06);
    vec3 col = mix(bg, cellCol, 1.0 - smoothstep(0.7, 1.2, length(p))); // 軽いビネット省略可
    col = mix(col, edgeCol, borderThin*0.55 + borderWide*0.25);         // 境界を光らせる

    // 仕上げ
    col = pow(col, vec3(0.93));
    gl_FragColor = vec4(col * uAlpha, uAlpha);
}