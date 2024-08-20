import { Scene } from "phaser";
import {getAssetResourceKey} from "./assetResourceKeyUtility.ts";

/**
 * Phaserのシーン間データ受け渡しの型
 */
export type AssetLoaderSceneData = {
  sceneModel: AssetLoaderSceneModel;
};

/**
 * アセットローダシーンモデル
 */
export class AssetLoaderSceneModel {
  // 完了か
  public done = false;
  
  // シェーダーテキスト
  public readonly shaderTextPaths: string[] = [];
  // テクスチャ
  public readonly texturePaths: string[] = [];
  
  /**
   * コンストラクタ
   */
  constructor(shaderTextPaths: string[], texturePaths = new Array<string>()) {
    console.log("PokerLinesIngameSceneModel constructor");
    this.shaderTextPaths = shaderTextPaths;
    this.texturePaths = texturePaths
  }
}

/**
 * アセットローダー
 * PhaserはアセットリソースのロードはSceneのpreloadで行うためSceneを継承。
 */
export class AssetLoader extends Scene {
  // シーンキー
  public static Key = "assetLoaderScene";
  
  // シーンモデル
  private sceneModel!: AssetLoaderSceneModel;

  /**
   * コンストラクタ
   * (Phaserのゲームインスタンス生成タイミングでの実行)
   */
  constructor() {
    super(AssetLoader.Key);
    console.log("AssetLoader constructor");
  }

  /**
   * 初期化処理
   */
  init(data: AssetLoaderSceneData) {
    console.log("AssetLoader init");
    this.sceneModel = data.sceneModel;
  }

  /**
   * アセットリソース読み込み
   */
  preload() {
    console.log("AssetLoader preload");
    
    // シェーダーテキストロード
    for (const path of this.sceneModel.shaderTextPaths) {
      const key = getAssetResourceKey(path);
      this.load.text(key, path);
      console.log("shader text loaded  key:", key, path);
    }
    
    // テクスチャロード
    for (const path of this.sceneModel.texturePaths) {
      const key = getAssetResourceKey(path);
      this.load.image(key, path);
      console.log("texture loaded  key:", key, path);
    }
  }

  /**
   * ゲームオブジェクト初期化
   */
  create() {
    console.log("AssetLoader create");
    this.sceneModel.done = true;
  }
}