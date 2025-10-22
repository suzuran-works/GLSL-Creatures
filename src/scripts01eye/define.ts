import {GetColorCodeByRGB, GetColorCodeTextByRGB} from "../utility/colorUtility.ts";

// タイトル
export const TITLE = "GLSL EYE";

// カテゴリー番号
export const CATEGORY = 1;

// シェーダーフォルダ名
export const SHADER_FOLDER = 'shaders01eye';

/**
 * 表示オーダー
 */
export const DefineDepth = {
  BACKGROUND: -1,
  UI: 100,
}

// 一覧表示の際の表示時間
export const DISPLAY_DURATION = 7.8;
// 一覧表示個数
export const SHOWCASE_COUNT = 1;

// 画像イメージキー
export const IMAGE_KEY = "view_image"
// 画像パス
export const TEXTURE_PATH = "./../textures/01eye.webp";
// イメージオブジェクトのTintカラー
export const IMAGE_TINT_COLOR = GetColorCodeByRGB(78, 78, 78);

// 羅列時のビューのスケール
export const SHOWCASE_VIEW_SCALE = 0.78;

// シェーダーオブジェクトサイズ
export const SHADER_OBJECT_SIZE = {width: 320, height: 320};
// シェーダーオブジェクトオフセット
export const SHADER_OBJECT_OFFSET = {x: 8, y: 0};

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