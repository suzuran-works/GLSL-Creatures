#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2  resolution;
uniform float uAlpha;
varying vec2  fragCoord;

// ==== 小さなユーティリティノイズ ==== 
float hash(vec2 p){
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float vnoise(vec2 p){
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f*f*(3.0 - 2.0*f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// fbm（フラクタルノイズ）
float fbm(vec2 p){
    float sum = 0.0;
    float amp = 0.5;
    mat2 m = mat2(1.6, -1.2,
    1.2,  1.6);
    for(int i = 0; i < 5; i++){
        sum += amp * vnoise(p);
        p = m * p * 1.3;
        amp *= 0.55;
    }
    return sum;
}

void main(){
    vec2 R = resolution;
    // -1..1 に正規化（縦横比を吸収）
    vec2 p = (fragCoord * 2.0 - R) / min(R.x, R.y);
    float t = time;

    // 画面下から上への座標（0 = 下, 1 = 上）
    vec2 uv;
    uv.x = p.x;
    uv.y = (p.y + 1.0) * 0.5; // -1..1 → 0..1

    // 炎の“上昇方向”ノイズサンプリング：yから時間を引くと模様が上に流れる
    float scrollSpeed = 1.3;
    vec2 npos = vec2(uv.x * 4.0, uv.y * 6.0 - t * scrollSpeed);

    // ベースのfbmノイズ
    float n = fbm(npos);

    // 横方向の揺らぎを追加して、炎の輪郭をメラメラに
    float warp = fbm(vec2(uv.y * 5.0 - t * 0.7, uv.x * 2.5));
    float xWarp = (warp - 0.5) * 0.6; // 左右に揺れる量
    float flameX = uv.x + xWarp;

    // 炎の基本形（横方向は中央ほど強く、縦方向は下ほど強く）
    float centerFalloff = 1.0 - smoothstep(0.0, 0.95, abs(flameX));     // 中央→端へ減衰
    float heightFalloff = smoothstep(0.0, 0.15, uv.y)                   // 地面から立ち上がり
    * (1.0 - smoothstep(0.55, 1.0, uv.y));          // 上に行きすぎると消える

    float shape = centerFalloff * heightFalloff;

    // ノイズと形状を混ぜて炎の“強度”を作る
    float intensity = shape * (0.6 + 0.9 * n);

    // ちょっと脈動（全体がわずかに強くなったり弱くなったり）
    float pulse = 0.85 + 0.15 * sin(t * 3.0 + uv.y * 5.0);
    intensity *= pulse;

    // 強度を0..1にクランプ
    intensity = clamp(intensity * 1.5, 0.0, 1.0);

    // ==== カラーマッピング（炎のグラデ）====
    // 0: 黒 → 深赤 → オレンジ → 黄 → 白 に寄せる
    float tCol = intensity;

    vec3 col;
    if(tCol < 0.3){
        // 黒 → 深赤
        float k = tCol / 0.3;
        col = mix(vec3(0.0, 0.0, 0.0),
                  vec3(0.4, 0.05, 0.0),
                  k);
    }else if(tCol < 0.6){
        // 深赤 → オレンジ
        float k = (tCol - 0.3) / 0.3;
        col = mix(vec3(0.4, 0.05, 0.0),
                  vec3(0.95, 0.45, 0.05),
                  k);
    }else if(tCol < 0.9){
        // オレンジ → 黄
        float k = (tCol - 0.6) / 0.3;
        col = mix(vec3(0.95, 0.45, 0.05),
                  vec3(1.0, 0.9, 0.3),
                  k);
    }else{
        // 黄 → ほぼ白（高温コアっぽい）
        float k = (tCol - 0.9) / 0.1;
        col = mix(vec3(1.0, 0.9, 0.3),
                  vec3(1.0, 0.98, 0.95),
                  k);
    }

    // 背景をちょっとだけ暗赤っぽく
    vec3 bg = vec3(0.02, 0.0, 0.01);
    col = mix(bg, col, intensity);

    // コントラストを少しだけ調整
    col = pow(col, vec3(0.95));

    // αは炎の強度に比例（外側は透過）
    float alpha = intensity * uAlpha;
    gl_FragColor = vec4(col * uAlpha, alpha);
}