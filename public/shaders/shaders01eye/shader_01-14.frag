#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2  resolution;
uniform float uAlpha;
varying vec2  fragCoord;

// ========== HSV → RGB ==========
vec3 hsv2rgb(vec3 c){
    vec3 K = vec3(1.0, 2.0/3.0, 1.0/3.0);
    vec3 p = abs(fract(c.xxx + K) * 6.0 - 3.0);
    return c.z * mix(vec3(1.0), clamp(p - 1.0, 0.0, 1.0), c.y);
}

void main(void){
    vec2 r = resolution;
    // -1..1 に正規化
    vec2 p = (fragCoord * 2.0 - r) / min(r.x, r.y);
    float t = time;

    // 全体をちょっとだけ回転させて動きに表情をつける
    float globalRot = 0.25 * t;
    mat2 gRot = mat2(cos(globalRot), -sin(globalRot),
    sin(globalRot),  cos(globalRot));
    p = gRot * p;

    // 背景（暗めの紺〜紫）
    vec3 col = vec3(0.02, 0.03, 0.07);

    // ===== 極座標的 多本DNA螺旋 =====
    const int ARMS     = 6;    // 放射状の本数
    const int SEGMENTS = 14;   // 各アームのビーズ節数

    float accumMask = 0.0;     // α用マスク

    float rMin = 0.10;         // 中心からの最小距離
    float rMax = 1.10;         // 最大距離（画面端あたり）

    float helixAmp = 0.12;     // 軸からの横振れ幅
    float freq     = 10.0;     // ねじれの密度（半径方向）
    float speed    = 1.6;      // 時間によるねじれ速度

    for(int ai = 0; ai < ARMS; ai++){
        float armIndex = float(ai);
        // アームごとの基準角度
        float baseAngle = 6.2831853 * armIndex / float(ARMS);

        // このアームの軸方向ベクトル（中心→外側）
        vec2 u = vec2(cos(baseAngle), sin(baseAngle));
        // アームに対して直交する方向（左右のねじれ用）
        vec2 v = vec2(-u.y, u.x);

        for(int i = 0; i < SEGMENTS; i++){
            float fi = float(i);
            float tSeg = fi / float(SEGMENTS - 1);

            // 半径方向の位置（中心→外側）
            float rad = mix(rMin, rMax, tSeg);

            // 半径に応じたねじれ位相
            float phase = rad * freq + t * -speed + armIndex * 0.7;

            // 軸上の中心位置
            vec2 axisPos = u * rad;

            // 二重らせん：軸から左右に振れる
            float offset = sin(phase) * helixAmp;
            vec2 s1 = axisPos - v * offset;   // 片側ビーズ
            vec2 s2 = axisPos + v * offset;   // もう片側ビーズ

            // ビーズの大きさ
            float beadRadius = 0.04;
            float beadWidth  = 0.00002;

            float d1 = length(p - s1);
            float d2 = length(p - s2);

            float bead1 = 1.0 - smoothstep(beadRadius, beadRadius + beadWidth, d1);
            float bead2 = 1.0 - smoothstep(beadRadius, beadRadius + beadWidth, d2);

            // アーム＋節インデックスで色を決める（軽く時間変化）
            float hueBase = 0.10 * armIndex + 0.03 * fi;
            float hue1 = fract(0.55 + hueBase * 0.07 + 0.10 * sin(phase + 0.5));
            float hue2 = fract(0.85 + hueBase * 0.07 + 0.10 * sin(phase + 1.7));

            vec3 col1 = hsv2rgb(vec3(hue1, 0.7, 1.0));
            vec3 col2 = hsv2rgb(vec3(hue2, 0.7, 1.0));

            // 中心に近いほど明るく
            float centerBoost = 1.0 - clamp(rad / rMax, 0.0, 1.0);
            float boost = 0.5 + 0.7 * centerBoost;

            col1 *= boost;
            col2 *= boost;

            // ビーズをmax合成（光る粒が上書きされる感じ）
            col = max(col, col1 * bead1);
            col = max(col, col2 * bead2);

            // α用マスク
            accumMask = max(accumMask, max(bead1, bead2));
        }
    }

    // ほんのりビネット（中心を強調）
    float vign = 1.0 - smoothstep(0.95, 1.25, length(p));
    col *= (0.6 + 0.5 * vign);

    // 仕上げトーン
    col = pow(col, vec3(0.95));

    float alpha = accumMask * uAlpha;
    gl_FragColor = vec4(col * uAlpha, alpha);
}