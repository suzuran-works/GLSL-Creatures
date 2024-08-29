
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
