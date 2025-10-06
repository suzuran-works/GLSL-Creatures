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

// --- クラゲ傘＋長い触手（セグメント構造） ---
float jelly(vec2 p, vec2 pos, float t, float scale, float seed) {
    vec2 q = p - pos;
    float d = length(q);

    // 傘（上部）
    float body = smoothstep(0.3*scale, 0.25*scale, d);

    // --- 触手をセグメントで構成 ---
    float tentacle = 0.0;
    const int tentacleCount = 5;
    const int segments = 20; // ← これが長さに相当！
    const float segLen = 0.05; // 各節の間隔

    for (int i = 0; i < tentacleCount; i++) {
        float fi = float(i) - float(tentacleCount)/2.0;
        float offsetX = fi * 0.05 * scale;
        vec2 base = pos - vec2(offsetX, 0.25 * scale); // 出発点

        // セグメントで長く垂らす
        for (int s = 0; s < segments; s++) {
            float fs = float(s);
            // 各節の波打ち（左右揺れ）
            float phase = t * 2.5 + seed * 4.0 + fs * 0.4 + fi;
            vec2 segPos = base + vec2(
            sin(phase + fs*0.5) * 0.03,
            -fs * segLen * scale * 2.0
            );

            float td = length(p - segPos);
            float w = smoothstep(0.02 * scale, 0.01 * scale, td);
            tentacle += w * exp(-fs * 0.1); // 徐々に薄く
        }
    }

    return body + tentacle * 0.9;
}

void main(void) {
    vec2 r = resolution;
    vec2 p = (fragCoord.xy * 2.0 - r) / min(r.x, r.y);
    vec2 baseP = p;
    float t = time * 0.4;

    vec3 col = vec3(0.0, 0.0, 0.0); // 背景（深海）

    const int count = 10;
    for (int i = 0; i < count; i++) {
        float fi = float(i);
        float seed = hash(vec2(fi * 3.1, fi * 2.7));

        // クラゲ位置（中央周囲でふわふわ）
        float angle = seed * 6.283 + sin(t * 0.2 + seed) * 0.5;
        float radius = 0.35 + 0.05 * sin(t * 0.5 + seed * 5.0);
        vec2 pos = vec2(cos(angle), sin(angle)) * radius;
        pos.y += 0.1 * sin(t + fi);

        // 呼吸（傘のスケール）
        float scale = 0.25 + 0.05 * sin(t * 0.8 + fi * 1.7);

        // 描画
        float j = jelly(p, pos, t, scale, seed);

        // 青〜紫の生命的な発光
        float hue = 0.55 + 0.15 * sin(seed * 8.0 + t * 0.4);
        vec3 jcol = hsv2rgb(vec3(hue, 0.7, 1.0)) * j;
        col += jcol;
    }

    // 外側にフェードアウト
    float dist = length(baseP);
    float thresDist = 0.45;
    float fadeLength = 0.0025;
    col *= smoothstep(thresDist, thresDist - fadeLength, dist);

    col = pow(col, vec3(0.9));
    gl_FragColor = vec4(col * uAlpha, uAlpha);
}