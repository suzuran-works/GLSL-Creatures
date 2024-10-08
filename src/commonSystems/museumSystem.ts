import Phaser from 'phaser';
import {MuseumAnchorView} from "./museumAnchorView.ts";
import {smoothstep} from "../utility/mathUtility.ts";
import {Queue} from "../utility/queue.ts";
import {DISPLAY_COUNT, FADE_DISTANCE, TRANSPARENT_DISTANCE} from "../scripts00flask/define.ts";
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

export interface EmptyMuseumViewFactoryInterface {
  
  /**
   * 作成
   */
  create(): MuseumViewInterface;
}

/**
 * 一覧表示・ピックアップシステム
 */
export class MuseumSystem {
  
  private readonly scene!: Phaser.Scene;
  private readonly viewQueue!: Queue<MuseumViewInterface>;
  private readonly emptyViewFactory!: EmptyMuseumViewFactoryInterface;
  
  private readonly museumAnchorViews: MuseumAnchorView[] = [];
  private readonly positionRefs: Phaser.Math.Vector2[] = [];
  
  private readonly SCROLL_SPEED = 0.022;
  
  /**
   * コンストラクタ
   */
  constructor(
    scene: Phaser.Scene,
    viewQueus: Queue<MuseumViewInterface>,
    emptyViewFactory: EmptyMuseumViewFactoryInterface
  ) {
    this.scene = scene;
    this.viewQueue = viewQueus;
    this.emptyViewFactory = emptyViewFactory;
    this.createViews();
  }
  
  /**
   * ビュー作成
   */
  private createViews() {
    const scene = this.scene;
    const canvas = scene.game.canvas;

    const width = canvas.width;
    const count = DISPLAY_COUNT;
    const margin = width / (count - 1);

    const startX = 0;

    for (let i = 0; i < count - 1; i++) {
      const x = startX + margin * i;
      const y = canvas.height / 2;
      const posRef = new Phaser.Math.Vector2(x, y);
      this.positionRefs.push(posRef);

      const anchorView = new MuseumAnchorView(scene);
      anchorView.setPosition(posRef.x, posRef.y);
      this.museumAnchorViews.push(anchorView);
    }    
  }
  
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
  private linkOrCreate(anchorView: MuseumAnchorView) {
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
  private updateViews(deltaTimeMs: number) {
    const transparentDistance = TRANSPARENT_DISTANCE;
    const canvasWidth = this.scene.game.canvas.width;
    const fadeThresBeginX = canvasWidth - transparentDistance;
    const fadeThresEndX = transparentDistance;
    const fadeDistance = FADE_DISTANCE;
    for (let i = 0; i < this.positionRefs.length; ++i) {
      const posRef = this.positionRefs[i];
      posRef.x += -this.SCROLL_SPEED * deltaTimeMs;
      let isReset = false;
      if (posRef.x < 0) {
        posRef.x = this.scene.game.canvas.width;
        isReset = true;
      }

      let alphaValue = 1;
      if (posRef.x > canvasWidth/2) {
        if (posRef.x > fadeThresBeginX) alphaValue = 0;
        else alphaValue = smoothstep(fadeThresBeginX, fadeThresBeginX - fadeDistance, posRef.x);
      } else {
        if (posRef.x < fadeThresEndX) alphaValue = 0;
        else alphaValue = smoothstep(fadeThresEndX, fadeThresEndX + fadeDistance, posRef.x);
      }

      const anchorView = this.museumAnchorViews[i];
      anchorView.setPosition(posRef.x, posRef.y);
      anchorView.setAlpha(alphaValue);
      if (isReset) this.linkOrCreate(anchorView);
      anchorView.updateView(deltaTimeMs);
    }
  }
}