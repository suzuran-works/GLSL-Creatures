import Phaser from 'phaser';
import {createConfig} from "../define.ts";
import {EmptyFlaskViewFactory, FlaskView} from "./flaskView.ts";
import {GetColorCodeByRGB, GetColorCodeTextByRGB} from "../utility/colorUtility.ts";
import {getAssetResourceKey, getShaderKey} from "../utility/assetResourceKeyUtility.ts";
import {AssetLoader} from "../utility/assetLoader.ts";
import {loadSingleShaderTextAsync} from "../utility/assetLoadUtility.ts";
import {CATEGORY, DISPLAY_COUNT, PATH_JSONS, SHADER_FOLDER} from "./define.ts";
import {preloadJson} from "../utility/preloadUtility.ts";
import {BackgroundView} from "../commonViews/backgroundView.ts";
import {MuseumSystem, MuseumViewInterface} from "../commonSystems/museumSystem.ts";
import {BackButton} from "../commonViews/backButton.ts";
import {TextLabel} from "../commonViews/textLabel.ts";
import {FpsView} from "../commonViews/fpsView.ts";
import {isLocalhost} from "../utility/localhostUtility.ts";
import {Queue} from "../utility/queue.ts";
import {waitMilliSeconds} from "../utility/asyncUtility.ts";


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
  
  // 表示物キュー
  private readonly viewQueue: Queue<MuseumViewInterface> = new Queue<MuseumViewInterface>();
  // 表示システム
  private museumSystem!: MuseumSystem;

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
    // FPS表示
    if (isLocalhost()) new FpsView(this);
    
    // 空のフラスコビューファクトリ
    const emptyViewFactory = new EmptyFlaskViewFactory(this);
    
    // 表示システム
    this.museumSystem = new MuseumSystem(this, this.viewQueue, emptyViewFactory);
    
    // パラメータ指定がある場合はそれを優先的に表示
    // TODO:

    // 戻る押下時
    this.backButton.onClick.subscribe(() => {
      console.log('onClick back button');
    });
    
    // 表示物をロード
    this.loadMuseumViewsAsync().then();
  }

  /**
   * シェーダーロード失敗するまでロード
   */
  private async loadMuseumViewsAsync() {
    let shaderIndex = 0;
    
    while (true) {
      // シェーダーをロード
      const loadModel = await loadSingleShaderTextAsync(this, SHADER_FOLDER, CATEGORY, shaderIndex);
      
      // ロード失敗したらループを抜ける
      if (loadModel.failCount > 0) break;

      // ビューを作成
      const shaderKey = getShaderKey(CATEGORY, shaderIndex);
      const flaskOutlineJsonKey = getAssetResourceKey(PATH_JSONS.FLASK_LEFT_OUTLINE_A);
      const view = FlaskView.Create(this, shaderKey, flaskOutlineJsonKey);
      this.viewQueue.enqueue(view);
      
      await waitMilliSeconds(10);
      shaderIndex++;

      // 指定個数まで作れたら陳列を表示
      if (shaderIndex == DISPLAY_COUNT) this.museumSystem.attachAll();
    }
    // 指定個数まで作れていなかった場合を考慮
    if (shaderIndex < DISPLAY_COUNT) this.museumSystem.attachAll();

    console.log(`loadMuseumViewsAsync finish noLoadIndex: ${shaderIndex}`);
  }
  
  update() {
    // 前のフレームからの経過時間
    const deltaTimeMs = this.game.loop.delta;
    // 一覧表示システム更新
    this.museumSystem.systemUpdate(deltaTimeMs);
  }
}

new Phaser.Game(createConfig([SummaryScene, AssetLoader]));