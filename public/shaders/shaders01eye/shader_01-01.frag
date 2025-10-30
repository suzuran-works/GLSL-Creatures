#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;
uniform float uAlpha;
varying vec2 fragCoord;

// ==== HSV→RGB ====
vec3 hsv2rgb(vec3 c){
    vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0,0.0,1.0);
    return c.z * mix(vec3(1.0), rgb, c.y);
}

void main(void){
    vec2 r = resolution;
    vec2 p = (fragCoord.xy * 2.0 - r) / min(r.x, r.y);
    vec2 baseP = p;
    float t = time * 0.6;

    // ==== 極座標変換 ====
    float angle = atan(p.y, p.x);      // θ
    float radius = length(p);          // r

    // ==== 幾何パターン ====
    // 花びらとリングを混ぜたモジュレーション
    float petals = 12.0;
    float waves = sin(angle * petals + t * 1.5);
    float rings = cos(radius * 10.0 - t * 2.0);
    float pattern = waves * rings;

    // パターン強調
    float shape = smoothstep(0.1, 0.0, abs(pattern) - 0.3);

    // ==== カラフルなトゥーン配色 ====
    // 角度ベースで色相を虹色に展開
    float hue = fract((angle / 6.28318) + 0.5 + 0.1*sin(t*0.3));
    float sat = 0.6 + 0.3*sin(radius*4.0 - t);
    float val = 1.0;

    vec3 base = hsv2rgb(vec3(hue, sat, val));

    // トゥーン調に3段階化
    base = floor(base * 3.0) / 3.0;

    // 外側ほど暗くして立体感を演出
    base *= smoothstep(1.0, 0.3, radius);

    // 幾何形状をブレンド
    vec3 col = mix(vec3(0.95, 0.95, 0.98), base, shape);

    // リング輪郭（パターンの外周を少し強調）
    float edge = smoothstep(0.02, 0.0, abs(pattern) - 0.25);
    col = mix(col, vec3(0.15, 0.05, 0.25), edge * 0.5);

    // 背景：パステルグレー
    vec3 bg = vec3(0.96, 0.96, 0.98);
    col = mix(bg, col, smoothstep(1.2, 0.5, radius));

    // コントラストでパキッと
    col = pow(col, vec3(0.85));

    // 外側にフェードアウト
    //float dist = length(baseP);
    //float thresDist = 0.45;
    //float fadeLength = 0.25;
    //col *= smoothstep(thresDist, thresDist - fadeLength, dist);

    gl_FragColor = vec4(col * uAlpha, uAlpha);
}