import Phaser from 'phaser';
import {MuseumAnchorView} from "./museumAnchorView.ts";
import {Queue} from "../utility/queue.ts";
import {ReadonlyObservableInterface} from "../utility/simpleObservable.ts";

/**
 * コンテンツビューインターフェース
 */
export interface MuseumViewInterface {

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
   * 隠す位置へ移動
   */
  setHidePosition(): void;
  
  /**
   * フレーム更新
   */
  updateView(deltaTimeMs: number): void;
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
 * 一覧表示・ピックアップシステム
 */
export abstract class MuseumSystemBase {
  
  protected readonly scene!: Phaser.Scene;
  protected readonly viewQueue!: Queue<MuseumViewInterface>;
  protected readonly emptyViewFactory!: EmptyMuseumViewFactoryInterface;
  
  protected readonly museumAnchorViews: MuseumAnchorView[] = [];
  protected readonly positionRefs: Phaser.Math.Vector2[] = [];
  
  /**
   * コンストラクタ
   */
  protected constructor(
    scene: Phaser.Scene,
    viewQueus: Queue<MuseumViewInterface>,
    emptyViewFactory: EmptyMuseumViewFactoryInterface
  ) {
    this.scene = scene;
    this.viewQueue = viewQueus;
    this.emptyViewFactory = emptyViewFactory;
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
    } else {
      const emptyView = this.emptyViewFactory.create();
      emptyView.setParentTo(anchorView);
      anchorView.setContentView(emptyView);
    }
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
}