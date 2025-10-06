#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;
uniform float uAlpha;
varying vec2 fragCoord;

// ==== Value Noise（1オクターブ）====
float hash(vec2 p){
    return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453);
}
float noise(vec2 p){
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f*f*(3.0-2.0*f);
    return mix(
        mix(hash(i+vec2(0.0,0.0)), hash(i+vec2(1.0,0.0)), u.x),
        mix(hash(i+vec2(0.0,1.0)), hash(i+vec2(1.0,1.0)), u.x),
        u.y
    );
}

// ==== HSV→RGB ====
vec3 hsv2rgb(vec3 c){
    vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0,0.0,1.0);
    rgb = rgb*rgb*(3.0-2.0*rgb);
    return c.z * mix(vec3(1.0), rgb, c.y);
}

void main(void){
    vec2 r = resolution;
    vec2 p = (fragCoord.xy * 2.0 - r) / min(r.x, r.y);
    vec2 baseP = p;
    float t = time * 0.6;

    // ===== 極座標 =====
    float angle = atan(p.y, p.x);
    float radius = length(p);

    // ===== 花びらノイズ波 =====
    float petals = 8.0;
    // 花びらの基本放射形
    float baseWave = abs(sin(angle * petals));
    // 花びらの形をノイズでランダムにゆらす
    float n = noise(vec2(angle*1.5, radius*2.0 + t*0.8));
    float bloom = 0.4 + 0.25 * sin(t + n*6.2831);
    float shape = smoothstep(baseWave * (0.25 + 0.15*n*bloom),
                             baseWave * (0.05 + 0.1*n*bloom),
                             radius);

    // ===== 色設計 =====
    // 色相を角度＋ノイズで揺らす（多色だけど調和的）
    float hue = 0.85 + 0.15*sin(angle*3.0 + n*3.0 + t*0.5);
    float sat = 0.5 + 0.3*n;
    float val = 0.9 - 0.3*radius;
    vec3 petalColor = hsv2rgb(vec3(hue, sat, val));

    // 花びらマスク
    vec3 col = petalColor * shape;

    // 中心の輝き（少しノイズで揺らぐ）
    float core = smoothstep(0.18 + 0.05*n, 0.0, radius);
    col += vec3(1.0, 0.9, 0.95) * core * 1.2;

    // 背景（やや青紫トーンで花が映える）
    vec3 bg = mix(vec3(0.05, 0.02, 0.08), vec3(0.08, 0.0, 0.1), p.y*0.5+0.5);
    col = mix(bg, col, shape + core*0.6);

    // 外周をフェード
    float vign = smoothstep(1.2, 0.6, radius);
    col *= vign;

    // コントラスト
    col = pow(col, vec3(0.9));

    // 外側に向かってフェードアウト
    float dist = length(baseP);
    float thresDist = 0.5;
    float fadeLength = 0.25;
    col *= smoothstep(thresDist, thresDist - fadeLength, dist);

    gl_FragColor = vec4(col * uAlpha, uAlpha);
}