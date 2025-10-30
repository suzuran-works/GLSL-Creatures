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

void main(void){
    vec2 r = resolution;
    vec2 p = (fragCoord.xy * 2.0 - r) / min(r.x, r.y);
    vec2 baseP = p;
    float t = time * 0.6;

    // ==== 極座標 ====
    float angle = atan(p.y, p.x);
    float radius = length(p);

    // ==== リング（幅を5倍） ====
    float rings = 0.0;
    const int layers = 8;
    for(int i=0; i<layers; i++){
        float fi = float(i);
        float offset = fi * 0.15 + 0.2*sin(t*0.4 + fi*1.2);
        // “25.0”を変えずにsmoothstepの幅を5倍に広げる
        float wave = sin((radius - offset)*2.0 - t*2.0 + fi*1.1);
        float band = smoothstep(0.20, 0.0, abs(wave)); // ← 幅5倍
        rings += band * (0.8 + 0.2*sin(t + fi*2.0));
    }

    // ==== 放射ライン（6分割） ====
    float segments = 8.0;
    float segAngle = 3.14159265 * 2.0 / segments;
    float lineWidth = 0.015;

    // 角度をセグメントごとに折り返して、中心軸からの距離を取る
    float angMod = mod(angle, segAngle);
    float distToLine = min(angMod, segAngle - angMod);
    float lineMask = smoothstep(lineWidth, 0.0, distToLine);

    // ==== カラー設定 ====
    float hue = fract(angle / 6.28318 + 0.5 + 0.05*sin(t*0.5));
    float sat = 0.8;
    float val = 1.0;
    vec3 ringColor = hsv2rgb(vec3(hue, sat, val));

    // リング表示
    vec3 col = ringColor * rings * smoothstep(1.1, 0.3, radius);

    // ライン（ホワイトでくっきり）
    vec3 lineCol = vec3(1.0);
    col = mix(col, lineCol, lineMask * 0.8);

    // 背景（うすめの紫）
    vec3 bg = vec3(0.95, 0.92, 0.98);
    col = mix(bg, col, 0.8);

    // コントラスト補正
    col = pow(col, vec3(0.9));

    // 外側にフェードアウト
    float dist = length(baseP);
    float thresDist = 0.98;
    float fadeLength = 0.0022;
    col *= smoothstep(thresDist, thresDist - fadeLength, dist);

    gl_FragColor = vec4(col * uAlpha, uAlpha);
}