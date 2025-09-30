import Phaser from 'phaser';
import {MuseumAnchorView} from "./museumAnchorView.ts";
import {Queue} from "../utility/queue.ts";
import {ReadonlyObservableInterface, SimpleDisposableInterface} from "../utility/simpleDisposableInterface.ts";
import {SimpleMessageArgInterface, SimpleMessageBroker} from "../utility/simpleMessageBroker.ts";
import {BackButton} from "../commonViews/backButton.ts";

/**
 * コンテンツビューインターフェース
 */
export interface MuseumViewInterface {

  /**
   * シェーダインデックス
   */
  shaderIndex: number;
  
  /**
   * クリック時処理
   */
  onClick: ReadonlyObservableInterface;
  
  /**
   * 指定親階層へぶら下げる
   */
  setParentTo(parent: Phaser.GameObjects.Container): void;

  /**
   * 指定親階層から外す
   */
  removeParentFrom(parent: Phaser.GameObjects.Container): void;

  /**
   * 親階層取得
   */
  getParent(): Phaser.GameObjects.Container;
  
  /**
   * 隠す位置へ移動
   */
  setHidePosition(): void;
  
  /**
   * フレーム更新
   */
  updateView(deltaTimeMs: number): void;
  
  /**
   * スケール取得
   */
  getScale(): {x: number, y: number};
}

/**
 * 空ビュー作成ファクトリインターフェース
 */
export interface EmptyMuseumViewFactoryInterface {
  
  /**
   * 作成
   */
  create(): MuseumViewInterface;
}

/**
 * 初期フォーカスメッセージ
 */
export class SystemMessageArgFocus
  implements SimpleMessageArgInterface
{
  public static readonly KEY = "SystemMessageArgFocus";
  public readonly mappingKey = SystemMessageArgFocus.KEY;

  public readonly view: MuseumViewInterface;
  constructor(view: MuseumViewInterface) {
    this.view = view;
  }
}

/**
 * クリック時メッセージ
 */
export class SystemMessageArgClick
  implements SimpleMessageArgInterface {
  public static readonly KEY = "SystemMessageArgClick";
  public readonly mappingKey = SystemMessageArgClick.KEY;
  
  public readonly view: MuseumViewInterface;
  constructor(view: MuseumViewInterface) {
    this.view = view;
  }
}
  

/**
 * 一覧表示・ピックアップシステム
 * 現状MuseumViewは表示個数のみを生成するわけではなく、作られるだけ作られる。
 */
export abstract class MuseumSystemBase {
  
  protected readonly scene!: Phaser.Scene;
  protected readonly viewQueue!: Queue<MuseumViewInterface>;
  protected readonly emptyViewFactory!: EmptyMuseumViewFactoryInterface;
  protected readonly backButton!: BackButton;
  
  protected readonly museumAnchorViews: MuseumAnchorView[] = [];
  protected readonly positionRefs: Phaser.Math.Vector2[] = [];
  
  protected readonly viewDisposableMap: Map<MuseumViewInterface, SimpleDisposableInterface>
  = new Map<MuseumViewInterface, SimpleDisposableInterface>();

  protected readonly disposables: SimpleDisposableInterface[] = [];
  
  protected readonly messageBroker!: SimpleMessageBroker;
  
  /**
   * コンストラクタ
   */
  protected constructor(
    scene: Phaser.Scene,
    messageBroker: SimpleMessageBroker,
    viewQueus: Queue<MuseumViewInterface>,
    emptyViewFactory: EmptyMuseumViewFactoryInterface,
    backButton: BackButton
  ) {
    this.scene = scene;
    this.messageBroker = messageBroker;
    this.viewQueue = viewQueus;
    this.emptyViewFactory = emptyViewFactory;
    this.backButton = backButton;
    
    // フォーカス指定メッセージ購読
    this.disposables.push(
      messageBroker.subscribe(SystemMessageArgFocus.KEY, (a) => {
        const arg = a as SystemMessageArgFocus;
        this.onClickAsync(arg.view).then();
      })
    )
  }
  
  /**
   * ビュー作成
   */
  protected abstract createViews(): void;
  
  /**
   * すべてのアンカーにアタッチ
   */
  public attachAll() {
    for (let i = 0; i < this.museumAnchorViews.length; ++i) {
      const anchorView = this.museumAnchorViews[i];
      this.linkOrCreate(anchorView);
    }
  }
  
  /**
   * 指定アンカーにビューを付与(無ければ作成して付与)
   */
  protected linkOrCreate(anchorView: MuseumAnchorView) {
    // 既にアンカーがぶら下げていたら外す
    const showingView = anchorView.contentView;
    if (showingView) {
      showingView.removeParentFrom(anchorView);
      showingView.setHidePosition();
      anchorView.setContentView(undefined);
      this.viewQueue.enqueue(showingView);
    }

    // キューからビューを取り出してアンカーにぶら下げる
    const view = this.viewQueue.dequeue();
    if (view) {
      view.setParentTo(anchorView);
      anchorView.setContentView(view);
      if (!this.viewDisposableMap.has(view)) {
        const disposable = view.onClick.subscribe(() => this.onClickAsync(view).then());
        this.viewDisposableMap.set(view, disposable);
      }
    } else {
      const emptyView = this.emptyViewFactory.create();
      emptyView.setParentTo(anchorView);
      anchorView.setContentView(emptyView);
    }
  }
  
  /**
   * 押下時
   */
  protected onClickAsync(view: MuseumViewInterface) : Promise<void> {
    this.messageBroker.publish(new SystemMessageArgClick(view));
    return Promise.resolve();
  }
  
  /**
   * システムフレーム更新
   */
  public systemUpdate(deltaTimeMs: number) {
    this.updateViews(deltaTimeMs);
  }
  
  /**
   * 表示更新
   */
  protected abstract updateViews(deltaTimeMs: number) : void;
  
  /**
   * 破棄
   */
  public dispose() {
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.disposables.length = 0;
    
    for (const disposable of this.viewDisposableMap.values()) {
      disposable.dispose();
    }
    this.viewDisposableMap.clear();
  }
}