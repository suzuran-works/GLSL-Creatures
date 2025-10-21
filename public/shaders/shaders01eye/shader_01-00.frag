#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;
uniform float uAlpha;
varying vec2 fragCoord;

// ==== HSV→RGB ====
vec3 hsv2rgb(vec3 c){
    vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0,0.0,1.0);
    rgb = rgb*rgb*(3.0-2.0*rgb);
    return c.z * mix(vec3(1.0), rgb, c.y);
}

// ==== ノイズ（単純ハッシュ） ====
float hash(float n){ return fract(sin(n)*43758.5453123); }

void main(void){
    vec2 r = resolution;
    vec2 p = (fragCoord.xy * 2.0 - r) / min(r.x, r.y);
    float t = time * 0.6;

    // ===== 極座標 =====
    float angle = atan(p.y, p.x);
    float radius = length(p);

    // ===== 複数の波リングを生成 =====
    float rings = 0.0;
    const int layers = 8;
    for(int i=0; i<layers; i++){
        float fi = float(i);
        float offset = fi * 0.15 + 0.2*sin(t*0.4 + fi*1.2);
        float wave = sin((radius - offset)*25.0 - t*2.0 + fi*1.1);
        float band = smoothstep(0.04, 0.0, abs(wave)); // 細めのリング線
        rings += band * (0.8 + 0.2*sin(t + fi*2.0));
    }

    // ===== カラフルな虹色 =====
    float hue = fract(angle / 6.28318 + 0.5 + 0.05*sin(t*0.5));
    float sat = 0.8;
    float val = 1.0;
    vec3 color = hsv2rgb(vec3(hue, sat, val));

    // ===== リングのマスクを適用 =====
    color *= rings * smoothstep(1.1, 0.3, radius);

    // ===== 背景 =====
    vec3 bg = mix(vec3(0.05,0.0,0.08), vec3(0.1,0.0,0.1), p.y*0.5+0.5);
    color = mix(bg, color, rings);

    // ===== コントラスト調整 =====
    color = pow(color, vec3(0.9));

    gl_FragColor = vec4(color * uAlpha, uAlpha);
}