#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;
uniform float uAlpha;
varying vec2 fragCoord;

// ==== HSV → RGB ====
vec3 hsv2rgb(vec3 c){
    vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0,0.0,1.0);
    return c.z * mix(vec3(1.0), rgb, c.y);
}

void main(void){
    vec2 r = resolution;
    vec2 p = (fragCoord.xy * 2.0 - r) / min(r.x, r.y);
    float t = time * 0.7;

    // ===== 極座標変換 =====
    float angle = atan(p.y, p.x);  // θ
    float radius = length(p);      // r

    // ===== 花びら状パターン（極座標関数） =====
    float petals = 10.0;
    float wave = sin(angle * petals + t); // 放射方向に波
    float ring = cos(radius * 15.0 - t * 2.0); // 同心円波

    // 花びらのマスク
    float petalShape = smoothstep(0.0, 0.2, wave * 0.6 + 0.4 - radius);
    float ringMask = smoothstep(0.5, 0.3, abs(ring));

    // 複合パターンで花の内外を形成
    float pattern = petalShape * ringMask;

    // ===== 色表現 =====
    float hue = 0.85 + 0.15*sin(angle*2.0 + t*0.3);
    float sat = 0.6 + 0.3*sin(radius*3.0 - t);
    float val = smoothstep(0.8, 0.1, radius) * (0.9 + 0.1*sin(t*1.5));

    vec3 color = hsv2rgb(vec3(hue, sat, val));

    // トゥーン段階化でくっきり
    color = floor(color * 3.0) / 3.0;

    // 花びら部分のみ表示
    color *= pattern;

    // 背景（淡いグラデ）
    vec3 bg = mix(vec3(0.05, 0.02, 0.1), vec3(0.1, 0.0, 0.12), p.y*0.5 + 0.5);
    color = mix(bg, color, pattern);

    // 外周をふんわりフェードアウト
    float vign = smoothstep(1.1, 0.6, radius);
    color *= vign;

    gl_FragColor = vec4(color * uAlpha, uAlpha);
}