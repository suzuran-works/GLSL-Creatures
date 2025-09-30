#ifdef GL_ES
precision mediump float;
#endif

// time
uniform float time;
// resolution
uniform vec2 resolution;
// alpha(custom)
uniform float uAlpha;
// pixel position (phaser game object)
varying vec2 fragCoord;

void main( void ) {
    float t = time;
    vec2 r = resolution;

    vec2 p = (fragCoord.xy * 2.0 - r) / min(r.x, r.y);
    vec2 baseP = p;
    
    float f = 0.0;
    for (float i = 0.0; i < 6.0; i++) {
        float rad = t * (i + 1.0);
        // iが偶数なら1.0 奇数なら-1.0
        float coef = mod(i, 2.0) * 2.0 - 1.0;
        float s = sin(rad);
        float c = cos(rad);
        mat2 m = mat2(c * coef, -s * coef, s, c);
        p *= m;

        vec2 q = vec2(p.x - (0.033 * (6.0 - i)), p.y);
        f += 0.011 / length(q);
    }
    
    // f を 1~0 の範囲に収める
    f = smoothstep(0.06, 1.0, f);
    
    vec3 color = vec3(f, f, f);

    // 中央から外側に向かってフェードアウト
    float dist = length(baseP);
    float thresDist = 0.46;
    float fadeLength = 0.2;
    color *= smoothstep(thresDist, thresDist - fadeLength, dist);
    
    // 正しくは以下か？colorへの乗算と透明度の指定
    gl_FragColor = vec4(color * uAlpha, uAlpha);
}