#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;
uniform float uAlpha;
varying vec2 fragCoord;

// HSV→RGB
vec3 hsv2rgb(vec3 c){
    vec3 rgb = clamp(abs(mod(c.x*6.0 + vec3(0.0,4.0,2.0),6.0)-3.0)-1.0,0.0,1.0);
    return c.z * mix(vec3(1.0), rgb, c.y);
}

// 花びらパターン（放射対称）
float petalMask(vec2 p, float angleOffset, float petals, float bloom){
    float a = atan(p.y, p.x) + angleOffset;
    float r = length(p);
    // bloomで花びらが開閉（1.0で開く・0.5で閉じる）
    float wave = abs(sin(a * petals * 0.5)) * bloom;
    return smoothstep(wave * 0.28, wave * 0.12, r);
}

void main(void){
    vec2 r = resolution;
    vec2 p = (fragCoord.xy * 2.0 - r) / min(r.x, r.y);
    vec2 baseP = p;
    float t = time * 0.5;

    // 回転アニメーション
    float rotation = t * 0.3;
    mat2 rot = mat2(cos(rotation), -sin(rotation), sin(rotation), cos(rotation));
    p = rot * p;

    float dist = length(p);

    // 花びらの開閉（呼吸のような動き）
    float bloom = 0.7 + 0.3 * sin(t * 1.3);

    // 花びら数
    const int petals = 14;
    vec3 col = vec3(0.0);

    // 背景（淡いパステル紫系）
    vec3 bg = mix(vec3(0.05, 0.02, 0.08), vec3(0.08, 0.0, 0.1), p.y*0.5+0.5);
    col = bg;

    // 各花びら
    for(int i=0; i<petals; i++){
        float fi = float(i);
        float angleOffset = fi * (6.2831853 / float(petals));

        float mask = petalMask(p, angleOffset, float(petals), bloom);

        // ペタルごとの色相
        float hue = fract(0.85 + fi / float(petals));
        float sat = 0.5 + 0.2*sin(t*0.3 + fi);
        float val = 1.0;
        vec3 petalColor = hsv2rgb(vec3(hue, sat, val));

        // トゥーン階調
        float shade = smoothstep(0.1, 0.45, dist);
        shade = floor(shade * 3.0) / 3.0;
        petalColor *= mix(1.0, 0.6, shade);

        // 花びら外輪郭
        float outline = smoothstep(0.04, 0.03, abs(mask - dist));
        vec3 outlineCol = vec3(0.25, 0.05, 0.15);

        vec3 blended = mix(petalColor, outlineCol, outline * 0.9);
        col = mix(col, blended, mask);
    }

    // 花芯
    float core = smoothstep(0.12, 0.0, dist);
    vec3 coreCol = mix(vec3(1.0, 0.9, 0.95), vec3(1.0, 0.8, 0.9), smoothstep(0.05, 0.15, dist));
    col = mix(col, coreCol, core);

    // 外側フェード
    float vign = smoothstep(1.2, 0.6, dist);
    col *= vign;

    // トゥーンらしいパキッと感
    col = pow(col, vec3(0.85));

    // 外側に向かってフェードアウト
    //float dist = length(baseP);
    float thresDist = 0.5;
    float fadeLength = 0.25;
    col *= smoothstep(thresDist, thresDist - fadeLength, dist);

    gl_FragColor = vec4(col * uAlpha, uAlpha);
}