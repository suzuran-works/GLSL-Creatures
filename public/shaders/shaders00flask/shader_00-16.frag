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

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453);
}

// --- クラゲ本体＋流体触手 ---
float jelly(vec2 p, vec2 pos, float t, float scale, float seed) {
    vec2 q = p - pos;

    // --- 傘の波打ち形状 ---
    float angle = atan(q.y, q.x);
    float radius = length(q);
    float ripple = sin(angle * 6.0 + t * 1.5 + seed * 3.0) * 0.04; // 傘の縁を波打たせる
    float bodyShape = 0.25 * scale + ripple;

    // 傘の輪郭
    float bodyOuter = smoothstep(bodyShape + 0.02, bodyShape - 0.02, radius);
    float bodyInner = smoothstep(bodyShape * 0.7, bodyShape * 0.3, radius);

    // 傘の透明な層
    float translucentEdge = smoothstep(bodyShape, bodyShape - 0.03, radius) * 0.5;

    // 内部の有機的な模様（鼓動＋揺らぎ）
    float core = sin(radius * 20.0 - t * 3.0 + seed * 4.0) * 0.5 + 0.5;
    float coreMask = bodyInner * (0.6 + 0.4 * core);

    // 傘の合成（外側グロー＋内側コア）
    float body = (bodyOuter * 0.9 + coreMask * 0.7 + translucentEdge * 0.4);

    // --- 触手（長く・水流で揺らぐ） ---
    float tentacle = 0.0;
    const int tentacleCount = 5;
    const int segments = 25;
    const float segLen = 0.05;

    for (int i = 0; i < tentacleCount; i++) {
        float fi = float(i) - float(tentacleCount) / 2.0;
        float offsetX = fi * 0.05 * scale;
        vec2 base = pos - vec2(offsetX, bodyShape * 2.5);

        for (int s = 0; s < segments; s++) {
            float fs = float(s);

            // 水流と波打ちの組み合わせ
            float flow = sin((pos.y - fs * 0.05) * 2.0 + t * 0.8 + seed * 2.0) * 0.4;
            float phase = t * 1.5 + seed * 4.0 + fs * 0.4 + fi;
            vec2 segPos = base + vec2(
            sin(phase + fs * 0.5) * 0.03 + flow * 0.02,
            -fs * segLen * scale * 2.0
            );

            float td = length(p - segPos);
            float w = smoothstep(0.02 * scale, 0.008 * scale, td);
            tentacle += w * exp(-fs * 0.08);
        }
    }

    return body + tentacle * 0.8;
}

void main(void) {
    vec2 r = resolution;
    vec2 p = (fragCoord.xy * 2.0 - r) / min(r.x, r.y);
    vec2 baseP = p;
    float t = time * 0.4;

    // 背景
    vec3 col = vec3(0.0, 0.0, 0.0);

    const int count = 10;
    for (int i = 0; i < count; i++) {
        float fi = float(i);
        float seed = hash(vec2(fi * 3.1, fi * 2.7));

        // クラゲ位置（中央〜周囲）
        float angle = seed * 6.283 + sin(t * 0.2 + seed) * 0.5;
        float radius = 0.35 + 0.05 * sin(t * 0.4 + seed * 5.0);
        vec2 pos = vec2(cos(angle), sin(angle)) * radius;
        pos.y += 0.07 * sin(t * 0.8 + fi);

        // 呼吸スケール（傘が膨らむように）
        float scale = 0.2 + 0.05 * sin(t * 1.2 + fi * 1.7);

        // クラゲ描画
        float j = jelly(p, pos, t, scale, seed);

        // 色（青〜紫、発光感）
        float hue = 0.55 + 0.15 * sin(seed * 8.0 + t * 0.3);
        vec3 jcol = hsv2rgb(vec3(hue, 0.8, 1.0)) * j;
        col += jcol;
    }

    // 発光（やわらかく）
    col = pow(col, vec3(0.85));

    // 外側にフェードアウト
    float dist = length(baseP);
    float thresDist = 0.45;
    float fadeLength = 0.0025;
    col *= smoothstep(thresDist, thresDist - fadeLength, dist);
    
    gl_FragColor = vec4(col * uAlpha, uAlpha);
}