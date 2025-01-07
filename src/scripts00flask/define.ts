import {isLocalhost} from "../utility/localhostUtility.ts";
import {GetColorCodeByRGB, GetColorCodeTextByRGB} from "../utility/colorUtility.ts";

// 編集モード
const EDIT_MODE = false;

export const IS_EDIT_MODE = EDIT_MODE && isLocalhost();

// タイトル
export const TITLE = "フラスコの中のGLSL";

// カテゴリー番号
export const CATEGORY = 0;

// シェーダーフォルダ名
export const SHADER_FOLDER = 'shaders00flask';

// jsonファイルパス
export const PATH_JSONS = {
  FLASK_LEFT_OUTLINE_A: `../jsons/jsons00flask/flaskLeftOutlineA.json`
}

/**
 * 表示オーダー
 */
export const DefineDepth = {
  BACKGROUND: -1,
  UI: 100,
}

// 羅列時のフラスコビューのスケール
export const FLOWING_FLASK_VIEW_SCALE = 0.22;

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
// 流れる速さ
export const FLOW_SPEED = 0.022;

// 背景色
export const BACKGROUND_COLOR = GetColorCodeByRGB(0, 0, 0);
// 戻るボタン色
export const BACK_BUTTON_COLOR = GetColorCodeByRGB(78, 78, 78);
// 戻るボタン透明度
export const BACK_BUTTON_ALPHA = 0.5;
// ラベルテキスト色
export const LABEL_TEXT_COLOR = GetColorCodeTextByRGB(180, 180, 180);
// ラベルテキストサイズ
export const LABEL_TEXT_SIZE = 30;