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

    // 全体をゆっくり揺らす（生き物感）
    float rot = 0.2 * sin(t*0.3);
    mat2 m = mat2(cos(rot), -sin(rot), sin(rot), cos(rot));
    p = m * p;

    const int count = 24; // 円を増やして複雑に
    vec3 finalColor = vec3(0.0);

    vec2 prev[3]; // 直前の位置を複数保持（ネットワーク接続用）

    for (int i = 0; i < count; i++) {
        float fi = float(i);

        // 螺旋角度＋拍動
        float angle = fi * 0.5 + t*0.7 + sin(t*0.5 + fi*0.3)*0.8;
        float radius = fi * 0.01 + 0.15 + 0.05 * sin(t*1.5 + fi*0.6);

        vec2 pos = vec2(cos(angle), sin(angle)) * radius;

        // 円のマスク（拍動で大きさも変化）
        float d = length(p - pos);
        float size = 0.02 + 0.01*sin(t*2.0 + fi);
        float circleMask = 1.0 - smoothstep(size, size+0.01, d);

        // 紫〜青紫に変化
        float hue = 0.72 + 0.15 * sin(t*0.4 + fi*0.2);
        vec3 col = hsv2rgb(vec3(hue, 0.9, 1.0)) * circleMask;
        finalColor = max(finalColor, col);

        // 線の接続（1〜3個前の点とつなぐ）
        for (int j = 0; j < 3; j++) {
            if (i > j) {
                vec2 prevPos = vec2(prev[j].x, prev[j].y);
                float ld = lineDistance(p, pos, prevPos);
                float lineMask = 1.0 - smoothstep(0.008, 0.015, ld);
                float flicker = 0.6 + 0.4*sin(t*2.5 + fi*0.7 + float(j));
                finalColor = max(finalColor, hsv2rgb(vec3(hue, 0.7, 0.9)) * lineMask * flicker);
            }
        }

        // prev をシフト更新
        prev[2] = prev[1];
        prev[1] = prev[0];
        prev[0] = pos;
    }

    gl_FragColor = vec4(finalColor * uAlpha, uAlpha);
}