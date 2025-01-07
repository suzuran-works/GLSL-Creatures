import Phaser from 'phaser';
import {createConfig} from "../define.ts";
import {EmptyFlaskViewFactory, FlaskView} from "./flaskView.ts";
import {getAssetResourceKey, getShaderKey} from "../utility/assetResourceKeyUtility.ts";
import {AssetLoader} from "../utility/assetLoader.ts";
import {loadSingleShaderTextAsync} from "../utility/assetLoadUtility.ts";
import {
  BACK_BUTTON_ALPHA,
  BACK_BUTTON_COLOR,
  BACKGROUND_COLOR,
  CATEGORY, DefineDepth,
  DISPLAY_COUNT,
  FADE_DISTANCE,
  FLOW_SPEED, LABEL_TEXT_COLOR, LABEL_TEXT_SIZE,
  PATH_JSONS,
  SHADER_FOLDER, TITLE,
  TRANSPARENT_DISTANCE
} from "./define.ts";
import {preloadJson} from "../utility/preloadUtility.ts";
import {BackgroundView} from "../commonViews/backgroundView.ts";
import {MuseumSystemBase, MuseumViewInterface} from "../commonSystems/museumSystemBase.ts";
import {BackButton} from "../commonViews/backButton.ts";
import {TextLabel} from "../commonViews/textLabel.ts";
import {FpsView} from "../commonViews/fpsView.ts";
import {isLocalhost} from "../utility/localhostUtility.ts";
import {Queue} from "../utility/queue.ts";
import {waitMilliSeconds} from "../utility/asyncUtility.ts";
import {MuseumSetting, MuseumSystemFlow, SystemMessageArgOnFocus} from "../commonSystems/museumSystemFlow.ts";
import {SimpleMessageBroker} from "../utility/simpleMessageBroker.ts";


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
  private museumSystem!: MuseumSystemBase;
  
  // メッセージブローカ
  private readonly messageBroker = new SimpleMessageBroker();

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
    new BackgroundView(this, BACKGROUND_COLOR);
    // 戻るボタン
    this.backButton = new BackButton(this, BACK_BUTTON_COLOR, BACK_BUTTON_ALPHA);
    // テキストラベル
    this.textLabel = new TextLabel(this, LABEL_TEXT_COLOR, 1, LABEL_TEXT_SIZE);
    this.textLabel.setPosition(canvas.width/2, canvas.height * 0.95);
    this.textLabel.setText(TITLE);
    this.textLabel.setDepth(DefineDepth.UI);
    // FPS表示
    if (isLocalhost()) new FpsView(this);
    
    // 空のフラスコビューファクトリ
    const emptyViewFactory = new EmptyFlaskViewFactory(this);
    
    // 表示システム
    const museumSetting = new MuseumSetting(DISPLAY_COUNT, FADE_DISTANCE, TRANSPARENT_DISTANCE, FLOW_SPEED)
    this.museumSystem = new MuseumSystemFlow(this, this.messageBroker, this.viewQueue, emptyViewFactory, this.backButton, museumSetting);
    
    // 戻る押下時
    this.backButton.onClick.subscribe(() => {
      if (isLocalhost()) console.log('onClick back button');
    });
    
    // フォーカス時
    this.messageBroker.subscribe(SystemMessageArgOnFocus.KEY, (a) => {
      const arg = a as SystemMessageArgOnFocus;
      if (isLocalhost()) console.log(`onFocus: ${arg.isFocus}`);
    });
    
    // 表示物をロード
    this.loadMuseumViewsAsync(idx).then();
  }

  /**
   * シェーダーロード失敗するまでロード
   */
  private async loadMuseumViewsAsync(idx: string | null) {
    const invalidNumber = -1;
    const initialFocusIndex = idx ? parseInt(idx, 10) : invalidNumber;
    let shaderIndex = 0;
    let createCount = 0;
    
    // シェーダーをロードしてビューを作成
    const loadAsync = async (sIndex: number) => {
      // シェーダーをロード
      const loadModel = await loadSingleShaderTextAsync(this, SHADER_FOLDER, CATEGORY, sIndex);
      // ロード失敗したらループを抜ける
      if (loadModel.failCount > 0) return {isFail: true};
      // ビューを作成
      const shaderKey = getShaderKey(CATEGORY, sIndex);
      const flaskOutlineJsonKey = getAssetResourceKey(PATH_JSONS.FLASK_LEFT_OUTLINE_A);
      const view = FlaskView.Create(this, sIndex, shaderKey, flaskOutlineJsonKey);
      this.viewQueue.enqueue(view);
      return {isFail: false};
    }
    
    // initialFocusIndexが指定されている場合はそのシェーダーをロード
    if (initialFocusIndex !== invalidNumber) {
      const loadInfo = await loadAsync(initialFocusIndex);
      if (!loadInfo.isFail) createCount++;
    }
    
    // その他ロード
    while (true) {
      if (shaderIndex === initialFocusIndex) {
        shaderIndex++;
        continue;
      }
      
      const loadInfo = await loadAsync(shaderIndex);
      if (loadInfo.isFail) break;
      await waitMilliSeconds(10);
      shaderIndex++;
      createCount++;

      // 指定個数まで作れたら陳列を表示
      if (createCount === DISPLAY_COUNT) this.museumSystem.attachAll();
    }
    // 指定個数まで作れていなかった場合を考慮
    if (createCount < DISPLAY_COUNT) this.museumSystem.attachAll();

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