import Phaser from 'phaser';
import {createConfig} from "../define.ts";
import {getShaderKey} from "../utility/assetResourceKeyUtility.ts";
import {AssetLoader} from "../utility/assetLoader.ts";
import {loadSingleShaderTextAsync} from "../utility/assetLoadUtility.ts";
import {
  BACK_BUTTON_ALPHA,
  BACK_BUTTON_COLOR,
  BACKGROUND_COLOR, CATEGORY,
  DefineDepth, DISPLAY_DURATION, IMAGE_KEY,
  LABEL_TEXT_COLOR, LABEL_TEXT_SIZE, SHADER_FOLDER, SHOWCASE_COUNT, TEXTURE_PATH,
  TITLE,
} from "./define.ts";
import {BackgroundView} from "../commonViews/backgroundView.ts";
import {
  MuseumSystemBase,
  MuseumViewInterface,
  SystemMessageArgClick,
  SystemMessageArgFocus
} from "../commonSystems/museumSystemBase.ts";
import {BackButton} from "../commonViews/backButton.ts";
import {TextLabel} from "../commonViews/textLabel.ts";
import {FpsView} from "../commonViews/fpsView.ts";
import {isLocalhost} from "../utility/localhostUtility.ts";
import {Queue} from "../utility/queue.ts";
import {waitMilliSeconds} from "../utility/asyncUtility.ts";
import {SimpleMessageBroker} from "../utility/simpleMessageBroker.ts";
import {SimpleDisposableInterface} from "../utility/simpleDisposableInterface.ts";
import {MuseumSetting, MuseumSystemSingleFade} from "../commonSystems/museumSystemSingleFade.ts";
import {EmptyViewFactory, EyeView} from "./eyeView.ts";


/**
 * SummaryScene
 */
export class SummaryScene extends Phaser.Scene {

  // シーンキー
  public static Key = 'SummaryScene';

  // メッセージブローカ
  private readonly messageBroker = new SimpleMessageBroker();

  // 戻るボタン
  private backButton!: BackButton;
  // テキストラベル
  private textLabel!: TextLabel;
  // 表示物キュー
  private readonly viewQueue: Queue<MuseumViewInterface> = new Queue<MuseumViewInterface>();

  // 表示システム
  private museumSystem!: MuseumSystemBase;

  // 表示フラグ
  private isShow = false;

  private readonly disposables: SimpleDisposableInterface[] = [];

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
    
    this.load.image(IMAGE_KEY, TEXTURE_PATH);
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
    this.backButton.setDepth(DefineDepth.UI);
    // テキストラベル
    this.textLabel = new TextLabel(this, LABEL_TEXT_COLOR, 1, LABEL_TEXT_SIZE);
    this.textLabel.setPosition(canvas.width/2, canvas.height * 0.95);
    this.textLabel.setDepth(DefineDepth.UI);
    this.textLabel.setTextAsync(TITLE).then();


    // フォーカス時テキストラベル更新処理
    const updateLabel = (arg: MuseumViewInterface) => {
      const shaderIndex = arg.shaderIndex;
      const msg = ` idx:${shaderIndex}`;
      this.textLabel.setTextAsync(TITLE + msg, 780).then();
    }

    // 初期フォーカス時
    this.disposables.push(
      this.messageBroker.subscribe(SystemMessageArgFocus.KEY, (a) => {
        const arg = a as SystemMessageArgFocus;
        updateLabel(arg.view);
      })
    );

    // クリック時
    this.disposables.push(
      this.messageBroker.subscribe(SystemMessageArgClick.KEY, (a) => {
        const arg = a as SystemMessageArgClick;
        updateLabel(arg.view);
      })
    );

    // 一覧に戻る時
    this.disposables.push(
      this.backButton.onClick.subscribe(() => {
        this.textLabel.setTextAsync(TITLE, 780).then();
      })
    );

    // FPS表示
    if (isLocalhost()) new FpsView(this);

    // 空のフラスコビューファクトリ
    const emptyViewFactory = new EmptyViewFactory(this, IMAGE_KEY);

    // 表示システム
    const museumSetting = new MuseumSetting(DISPLAY_DURATION);
    this.museumSystem = new MuseumSystemSingleFade(this, this.messageBroker, this.viewQueue, emptyViewFactory, this.backButton, museumSetting);

    // 表示物をロード
    this.loadMuseumViewsAsync(idx).then();
  }

  public dispose() {
    this.museumSystem.dispose();
    this.disposables.forEach(d => d.dispose());
  }

  /**
   * シェーダーロード失敗するまでロード
   */
  private async loadMuseumViewsAsync(idx: string | null) {
    const invalidNumber = -1;
    const initialFocusIndex = idx ? parseInt(idx, 10) : invalidNumber;
    let initialFocusView: MuseumViewInterface | undefined = undefined;
    let shaderIndex = 0;
    let createCount = 0;
    const debugMaxIndex: number | undefined = undefined;

    // シェーダーをロードしてビューを作成
    const loadAsync = async (sIndex: number) => {
      // シェーダーをロード
      const loadModel = await loadSingleShaderTextAsync(this, SHADER_FOLDER, CATEGORY, sIndex);
      // ロード失敗したらループを抜ける
      if (loadModel.failCount > 0) return {view: undefined, isFail: true};
      // ビューを作成
      const shaderKey = getShaderKey(CATEGORY, sIndex);
      const view = EyeView.Create(this, sIndex, shaderKey, IMAGE_KEY);
      this.viewQueue.enqueue(view);
      return {view:view, isFail: false};
    }

    // initialFocusIndexが指定されている場合はそのシェーダーをロード
    if (initialFocusIndex !== invalidNumber) {
      const loadInfo = await loadAsync(initialFocusIndex);
      if (!loadInfo.isFail) {
        createCount++;
        initialFocusView = loadInfo.view;
      }
    }

    // その他ロード
    while (true) {
      if (shaderIndex === initialFocusIndex) {
        shaderIndex++;
        continue;
      }

      const loadInfo = await loadAsync(shaderIndex);
      if (loadInfo.isFail) break;
      if (debugMaxIndex! && shaderIndex >= debugMaxIndex) break;
      await waitMilliSeconds(10);
      shaderIndex++;
      createCount++;
      
      // 指定個数まで作れたら陳列を表示
      if (createCount >= SHOWCASE_COUNT) this.tryShowAsync(initialFocusView).then();
    }
    // 指定個数まで作れていなかった場合を考慮
    if (createCount < SHOWCASE_COUNT) this.tryShowAsync(initialFocusView).then();

    console.log(`loadMuseumViewsAsync finish noLoadIndex: ${shaderIndex}`);
  }

  /**
   * 表示を試みる(表示済であれば早期終了)
   */
  private async tryShowAsync(initialFocusView?: MuseumViewInterface | undefined) {
    if (this.isShow) return;

    // 陳列を表示
    this.museumSystem.attachAll();
    // 初期フォーカス指定があればそれをフォーカスするメッセージを発行
    if (initialFocusView) this.messageBroker.publish(new SystemMessageArgFocus(initialFocusView));

    this.isShow = true;
  }

  update() {
    if (!this.isShow) return;

    // 前のフレームからの経過時間
    const deltaTimeMs = this.game.loop.delta;
    // 一覧表示システム更新
    this.museumSystem.systemUpdate(deltaTimeMs);
  }
}

new Phaser.Game(createConfig([SummaryScene, AssetLoader]));