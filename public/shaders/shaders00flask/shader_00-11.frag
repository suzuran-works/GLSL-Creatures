#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;
uniform float uAlpha;
varying vec2 fragCoord;

// HSV→RGB変換
vec3 hsv2rgb(vec3 c) {
    vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0,
                     0.0,
                     1.0);
    rgb = rgb*rgb*(3.0-2.0*rgb);
    return c.z * mix(vec3(1.0), rgb, c.y);
}

// 点から線分への距離
float lineDistance(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h);
}

void main(void) {
    vec2 r = resolution;
    vec2 p = (fragCoord.xy * 2.0 - r) / min(r.x, r.y);
    float t = time * 0.6;

    // 全体を少し回転させる
    float rot = 0.3 * sin(t*0.5);
    mat2 m = mat2(cos(rot), -sin(rot), sin(rot), cos(rot));
    p = m * p;

    const int count = 8;
    vec3 finalColor = vec3(0.0);
    vec2 prev;

    for (int i = 0; i < count; i++) {
        float fi = float(i);

        // 螺旋の角度と半径（半径を揺らす）
        float angle = fi * 0.8 + t*0.7 + sin(t*0.3 + fi)*0.5;
        float radius = fi * 0.018 + 0.1 + 0.08 * sin(t*1.2 + fi*0.7);

        vec2 pos = vec2(cos(angle), sin(angle)) * radius;

        // 円の大きさもアニメーション
        float d = length(p - pos);
        float circleMask = 1.0 - smoothstep(0.025 + 0.01*sin(t+fi),
                                            0.035 + 0.01*sin(t+fi), d);

        // 色（紫をベースに hue が変化）
        float hue = 0.72 + 0.2 * sin(t*0.5 + fi*0.4);
        vec3 col = hsv2rgb(vec3(hue, 0.8, 1.0)) * circleMask;
        finalColor = max(finalColor, col);

        // 線でつなぐ（点滅効果付き）
        if (i > 0) {
            vec2 prevPos = prev;
            float ld = lineDistance(p, pos, prevPos);
            float lineMask = 1.0 - smoothstep(0.008, 0.012, ld);
            float flicker = 0.5 + 0.5*sin(t*3.0 + fi); // 点滅
            finalColor = max(finalColor, hsv2rgb(vec3(hue, 0.7, 0.9)) * lineMask * flicker);
        }

        prev = pos;
    }

    gl_FragColor = vec4(finalColor * uAlpha, uAlpha);
}