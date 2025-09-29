#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;
uniform float uAlpha;
varying vec2 fragCoord;

vec3 hsv2rgb(vec3 c) {
    vec3 rgb = clamp( abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),
                              6.0)-3.0)-1.0,
                      0.0,
                      1.0 );
    rgb = rgb*rgb*(3.0-2.0*rgb);
    return c.z * mix(vec3(1.0), rgb, c.y);
}

void main(void) {
    float t = time * 0.3; // ゆるやかに動く
    vec2 r = resolution;
    vec2 p = (fragCoord.xy * 2.0 - r) / min(r.x, r.y);

    vec2 firstP = p;
    
    // 幾何学模様のベース: 折り返しで対称性を作る
    p = abs(p);
    p = mod(p*9.0 + 1.0, 2.0) - 1.0;

    float f = 0.0;
    for (float i = 0.0; i < 5.0; i++) {
        float rad = t * (i + 1.0);
        float s = sin(rad);
        float c = cos(rad);
        mat2 m = mat2(c, -s, s, c);
        vec2 q = m * p;

        q.x += 0.2 * sin(t + i*1.5);
        q.y += 0.2 * cos(t + i*1.5);

        f += 0.015 / length(q);
    }

    // 輝きを整える
    f = pow(f, 1.1) * 2.2;

    // 暖色系: Hを0.0〜0.15に固定
    float hue = mod(0.05 + 0.1*sin(t + length(p)*2.0), 0.15);
    vec3 color = hsv2rgb(vec3(hue, 1.0, f));

    // 中央から外側に向かってフェードアウト
    float dist = length(firstP);
    color *= smoothstep(0.6, 0.0, dist);

    gl_FragColor = vec4(color * uAlpha, 1.0);
}