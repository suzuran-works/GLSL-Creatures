#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;
uniform float uAlpha;
varying vec2 fragCoord;

// HSV→RGB
vec3 hsv2rgb(vec3 c) {
    vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0,
                     0.0,1.0);
    rgb = rgb*rgb*(3.0-2.0*rgb);
    return c.z * mix(vec3(1.0), rgb, c.y);
}

// 疑似ノイズ
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453);
}

// 距離に基づくクラゲ描画
float jelly(vec2 p, vec2 pos, float t, float scale) {
    vec2 q = p - pos;
    float d = length(q);

    // 傘の形
    float body = smoothstep(0.3*scale, 0.25*scale, d);

    // 触手 (縦方向に伸びるグロー)
    float tentacle = exp(-abs(q.x)*30.0) * smoothstep(0.3*scale, 0.0, q.y);

    return body + tentacle * 0.8;
}

void main(void) {
    vec2 r = resolution;
    vec2 p = (fragCoord.xy * 2.0 - r) / min(r.x, r.y);
    vec2 baseP = p;
    float t = time * 0.4;

    // 背景（深海の青）
    vec3 col = vec3(0.0);

    // クラゲ群
    const int count = 10;
    for (int i = 0; i < count; i++) {
        float fi = float(i);

        // 各クラゲの固有オフセット
        float seed = fi * 1.37;
        float phase = t * (0.3 + 0.1*hash(vec2(seed))) + seed;
        float x = sin(phase) * 0.4;
        float y = mod(phase*0.2 + hash(vec2(seed,seed))*3.0, 3.5) - 1.0; // 上昇ループ
        vec2 pos = vec2(x, y);

        float scale = 0.2 + 0.05*sin(t*1.2 + seed*2.0); // 呼吸

        float j = jelly(p, pos, t, scale);

        // 色（青紫〜緑がかったクラゲ）
        float hue = 0.6 + 0.15*sin(seed + t*0.2);
        vec3 jcol = hsv2rgb(vec3(hue, 0.7, 1.0)) * j;

        col += jcol;
    }

    // ソフトに発光
    col = pow(col, vec3(0.9));

    // 外側にフェードアウト
    float dist = length(baseP);
    float thresDist = 0.5;
    float fadeLength = 0.25;
    col *= smoothstep(thresDist, thresDist - fadeLength, dist);

    gl_FragColor = vec4(col * uAlpha, uAlpha);
}