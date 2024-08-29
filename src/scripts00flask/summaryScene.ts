import Phaser from 'phaser';
import {createConfig} from "../define.ts";
import {FlaskView} from "./flaskView.ts";
import {GetColorCodeByRGB, GetColorCodeTextByRGB} from "../utility/colorUtility.ts";
import {getAssetResourceKey, getShaderKey} from "../utility/assetResourceKeyUtility.ts";
import {AssetLoader} from "../utility/assetLoader.ts";
import {loadSingleShaderTextAsync} from "../utility/assetLoadUtility.ts";
import {CATEGORY, PATH_JSONS, SHADER_FOLDER} from "./define.ts";
import {preloadJson} from "../utility/preloadUtility.ts";
import {tweenAsync} from "../utility/tweenAsync.ts";
import {BackgroundView} from "../commonViews/backgroundView.ts";
import {MuseumSystem} from "../commonSystems/museumSystem.ts";
import {BackButton} from "../commonViews/backButton.ts";
import {TextLabel} from "../commonViews/textLabel.ts";


/**
 * SummaryScene
 */
export class SummaryScene extends Phaser.Scene {

  // シーンキー
  public static Key = 'SummaryScene';
  
  // 戻るボタン
  private backButton!: BackButton;
  // テキストラベル
  private textLabel!: TextLabel;
  
  // 表示システム
  private museumSystem!: MuseumSystem;
  
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

    // URLからパラメータを取得
    const params = new URLSearchParams(window.location.search);
    const idx = params.get('idx');
    console.log(`idx: ${idx}`);

    const canvas = this.game.canvas;

    // 背景
    new BackgroundView(this, GetColorCodeByRGB(0, 0, 0));
    // 戻るボタン
    this.backButton = new BackButton(this, GetColorCodeByRGB(78,78,78), 0.5);
    // テキストラベル
    this.textLabel = new TextLabel(this, GetColorCodeTextByRGB(180, 180, 180), 1, 30);
    this.textLabel.setPosition(canvas.width/2, canvas.height * 0.95);
    this.textLabel.setText("フラスコの中のGLSL");
    
    // 表示システム
    this.museumSystem = new MuseumSystem(this);
    
    // パラメータ指定がある場合はそれを優先的に表示
    
    this.createAsync().then();

    // 戻る押下時
    this.backButton.onClick.subscribe(() => {
      console.log('onClick back button');
    });
  }

  private async createAsync() {
    // ビュー追加
    await this.addViewAsync();
    // 仮
    await this.backButton.showAsync(2000);

    // シェーダーをロード
    await loadSingleShaderTextAsync(this, SHADER_FOLDER, CATEGORY, 99);
    const shaderKey = getShaderKey(CATEGORY,99);
    const fragShaderText = this.cache.text.get(shaderKey);
    console.log(fragShaderText);
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
    // 前のフレームからの経過時間
    const deltaTimeMs = this.game.loop.delta;
    
    this.museumSystem.systemUpdate(deltaTimeMs);
    
    this.flaskView?.updateView();
  }
}

new Phaser.Game(createConfig([SummaryScene, AssetLoader]));