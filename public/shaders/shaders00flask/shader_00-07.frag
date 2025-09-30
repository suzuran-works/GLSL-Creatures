#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;
uniform float uAlpha;
varying vec2 fragCoord;

vec3 hsv2rgb(vec3 c) {
    vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0,
                     0.0,
                     1.0);
    rgb = rgb*rgb*(3.0-2.0*rgb);
    return c.z * mix(vec3(1.0), rgb, c.y);
}

void main(void) {
    float t = time * 0.6;
    vec2 r = resolution;
    vec2 uv = fragCoord.xy / r;
    vec2 p = (fragCoord.xy * 2.0 - r) / min(r.x, r.y);
    vec2 baseP = p;

    // 幾何学模様っぽい折り返し
    p = abs(p);
    p = mod(p*6.0 - 1.0, 2.0) - 1.0;

    // 回転で動きをプラス
    float ang = t;
    float s = sin(ang);
    float c = cos(ang);
    mat2 rot = mat2(c, -s, s, c);
    p = rot * p;

    // パターン強調
    float d = length(p);
    float stripes = step(0.3 + 0.2*sin(t*2.0), fract(d*6.0));
    float rings = step(0.5, fract(d*3.0 + t*0.5));

    // 強いコントラストでON/OFF
    float mask = max(stripes, rings);

    // オレンジ〜赤寄りの色
    float hue = 0.08 + 0.02*sin(t*0.7);
    vec3 color = hsv2rgb(vec3(hue, 1.0, mask));

    // 中央から外側に向かってフェードアウト
    float dist = length(baseP);
    float thresDist = 0.46;
    float fadeLength = 0.2;
    color *= smoothstep(thresDist, thresDist - fadeLength, dist);

    gl_FragColor = vec4(color * uAlpha, 1.0);
}