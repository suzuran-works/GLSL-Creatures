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
    rgb = rgb*rgb*(3.0-2.0*rgb); // smooth
    return c.z * mix(vec3(1.0), rgb, c.y);
}

void main(void) {
    float t = time * 0.5;
    vec2 r = resolution;
    vec2 p = (fragCoord.xy * 2.0 - r) / min(r.x, r.y);

    // 万華鏡効果: 角度を折り返して対称模様に
    float angle = atan(p.y, p.x);
    float radius = length(p);
    angle = mod(angle, 3.14159/3.0); // 6分割
    p = vec2(cos(angle), sin(angle)) * radius;

    float f = 0.0;
    for (float i = 0.0; i < 6.0; i++) {
        float rad = t * (i + 1.0);
        float s = sin(rad);
        float c = cos(rad);
        mat2 m = mat2(c, -s, s, c);
        p *= m;

        vec2 q = vec2(p.x - (0.05 * (6.0 - i)), p.y);
        f += 0.02 / length(q);
    }

    f = smoothstep(0.05, 1.0, f);

    // 色相を時間と座標で回す
    vec3 color = hsv2rgb(vec3(0.3 + 0.2*sin(t+radius*3.0),
                         0.8,
                         f));

    gl_FragColor = vec4(color * uAlpha, 1.0);
}