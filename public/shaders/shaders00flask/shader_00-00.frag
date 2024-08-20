#ifdef GL_ES
precision mediump float;
#endif

// 円運動する光

// time
uniform float time;
// resolution
uniform vec2 resolution;
// pixel position (phaser game object)
varying vec2 fragCoord;

void main( void ) {
    float t = time;
    vec2 r = resolution;

    vec2 p = (fragCoord.xy * 2.0 - r) / min(r.x, r.y);

    float s = sin(t);
    float c = cos(t);
    mat2 m = mat2(c, -s, s, c);
    p *= m;

    vec2 q = vec2(p.x - 0.22, p.y);
    float f = 0.022 / length(q);
    
    // f を 1~0 の範囲に収める
    f = smoothstep(0.022, 1.0, f);
    
    vec3 color = vec3(0.0, f, f);
    
    gl_FragColor = vec4(color, 1.0);
}