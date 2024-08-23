import Phaser from 'phaser';
import {createConfig, FONT_SMARTFONTUI} from "../define.ts";
import {FlaskView} from "./flaskView.ts";
import {GetColorCodeByRGB, GetColorCodeTextByRGB} from "../utility/colorUtility.ts";
import {getAssetResourceKey, getShaderKey} from "../utility/assetResourceKeyUtility.ts";
import {AssetLoader} from "../utility/assetLoader.ts";
import {loadSingleShaderTextAsync} from "../utility/assetLoadUtility.ts";
import {CATEGORY, PATH_JSONS, SHADER_FOLDER} from "./define.ts";
import {preloadJson} from "../utility/preloadUtility.ts";
import {tweenAsync} from "../utility/tweenAsync.ts";
import {BackgroundView} from "../utility/backgroundView.ts";


/**
 * SummaryScene
 */
export class SummaryScene extends Phaser.Scene {

  // シーンキー
  public static Key = 'SummaryScene';


  private flaskView?: FlaskView;

  /**
   * コンストラクタ
   */
  constructor() {
    super(SummaryScene.Key);
    console.log('SummaryScene constructor');
  }

  /**
   * プリロード
   */
  preload() {
    console.log('SummaryScene preload');

    // フラスコ用Jsonロード
    preloadJson(this, PATH_JSONS.FLASK_LEFT_OUTLINE_A);
  }

  /**
   * ゲームオブジェクト初期化
   */
  create() {
    console.log('SummaryScene create');

    // 背景
    new BackgroundView(this, GetColorCodeByRGB(0, 0, 0));
    
    // パラメータ指定がある場合はそれを優先的に表示
    
    this.createAsync().then();
  }

  private async createAsync() {
    const canvas = this.game.canvas;

    // URLからパラメータを取得
    const params = new URLSearchParams(window.location.search);
    const idx = params.get('idx');

    // パラメータに基づいてゲームの設定を行う
    let msg = 'flask';
    if (idx) {
      console.log(`index: ${idx}`);
      msg = `フラスコの中の何か: ${idx}`;
    }
    
    // ビュー追加
    await this.addViewAsync();

    // テキスト
    const text = this.add.text(0, 0, msg, {
      fontSize: 30,
      fontFamily: FONT_SMARTFONTUI,
    });
    text.setOrigin(0.5, 0.5);
    text.setFill(GetColorCodeTextByRGB(180, 180, 180));
    text.setPosition(canvas.width/2, canvas.height * 0.95);
  }

  private async addViewAsync() {
    // シェーダーをロード
    await loadSingleShaderTextAsync(this, SHADER_FOLDER, CATEGORY, 0);

    // フラスコ
    const canvas = this.game.canvas;
    const width = canvas.width;
    const height = canvas.height;
    const shaderKey = getShaderKey(CATEGORY,0);
    const jsonKey = getAssetResourceKey(PATH_JSONS.FLASK_LEFT_OUTLINE_A);
    this.flaskView = new FlaskView(this, width, height, shaderKey, jsonKey);
    this.flaskView.setPosition(canvas.width/2, canvas.height/2);

    tweenAsync(this, {
        targets: this.flaskView,
        duration: 2000,
        //scaleX: 0.3,
        //scaleY: 0.3,
        alpha: 1,
        repeat: -1,
        yoyo: true,
        ease: 'Sine.easeInOut'
    }).then();
  }

  update() {
    this.flaskView?.updateView();
  }
}

new Phaser.Game(createConfig([SummaryScene, AssetLoader]));