
// 編集モード
import {isLocalhost} from "../utility/localhostUtility.ts";

const EDIT_MODE = false;

export const IS_EDIT_MODE = EDIT_MODE && isLocalhost();

// カテゴリー番号
export const CATEGORY = 0;

// シェーダーフォルダ名
export const SHADER_FOLDER = 'shaders00flask';

// jsonファイルパス
export const PATH_JSONS = {
  FLASK_LEFT_OUTLINE_A: `../jsons/jsons00flask/flaskLeftOutlineA.json`
}

// 羅列時のフラスコビューのスケール
export const FLOATING_FLASK_VIEW_SCALE = 0.22;

// フラスコビューのアウトライン太さ(スケール1)
export const FLASK_OUTLINE_THICKNESS = 4;
// フラスコビューのアウトライン太さ(羅列時)
export const FLASK_OUTLINE_THICKNESS_FLOATING = 16;
// フラスコビューのアウトライン色(スケール1)
export const FLASK_OUTLINE_COLOR_VALUE = 122;
// フラスコビューのアウトライン色(羅列時)
export const FLASK_OUTLINE_COLOR_VALUE_FLOATING = 78;

// 陳列個数
export const DISPLAY_COUNT = 7;
// 透明距離
export const TRANSPARENT_DISTANCE = 78;
// フェード距離
export const FADE_DISTANCE = 78;
