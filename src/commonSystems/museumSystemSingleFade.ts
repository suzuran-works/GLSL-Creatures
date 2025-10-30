import {
  EmptyMuseumViewFactoryInterface,
  MuseumSystemBase,
  MuseumViewInterface
} from "./museumSystemBase.ts";
import Phaser from "phaser";
import {MuseumAnchorView} from "./museumAnchorView.ts";
import {smoothstep} from "../utility/mathUtility.ts";
import {Queue} from "../utility/queue.ts";
import {SimpleMessageBroker} from "../utility/simpleMessageBroker.ts";
import {tweenAsync} from "../utility/tweenAsync.ts";
import {getLocalPos} from "../utility/transformUtility.ts";
import {BackButton} from "../commonViews/backButton.ts";
import {waitUntil} from "../utility/asyncUtility.ts";

/**
 * 一覧表示設定
 */
export class MuseumSetting {
  public readonly displayDuration: number;

  constructor(
    displayDuration: number
  ) {
    this.displayDuration = displayDuration;
    if (this.displayDuration < 1) {
      console.warn("表示時間が短いので1秒に強制");
      this.displayDuration = 1;
    }
  }
}

/**
 * 一覧表示・ピックアップシステム(一つの表示が現れては消えるver)
 */
export class MuseumSystemSingleFade extends MuseumSystemBase {

  protected readonly setting!: MuseumSetting;
  
  private isFocus = false;
  
  private elapsedMs = 0;
  
  /**
   * コンストラクタ
   */
  constructor(
    scene: Phaser.Scene,
    messageBroker: SimpleMessageBroker,
    viewQueus: Queue<MuseumViewInterface>,
    emptyViewFactory: EmptyMuseumViewFactoryInterface,
    backButton: BackButton,
    setting: MuseumSetting,
  ) {
    super(scene, messageBroker, viewQueus, emptyViewFactory, backButton);
    this.setting = setting;
    this.createViews();
  }
  
  protected override createViews() {
    const scene = this.scene;
    const canvas = scene.game.canvas;
    
    // 一つだけ作れば良い
    const x = canvas.width/2;
    const y = canvas.height/2;
    const posRef = new Phaser.Math.Vector2(x, y);
    this.positionRefs.push(posRef);
    
    const anchorView = new MuseumAnchorView(scene);
    anchorView.setPosition(x, y);
    this.museumAnchorViews.push(anchorView);
  }
  
  protected override async onClickAsync(view: MuseumViewInterface): Promise<void> {
    if (this.isFocus) return;
    this.isFocus = true;
    
    await super.onClickAsync(view);
    
    const scaleUpTasks : Promise<void>[] = [];
    const scaleDownTasks: Promise<void>[] = [];

    // フォーカスされたものを拡大
    const prevScale = view.getScale();
    const canvas = this.scene.game.canvas;
    const centerPosition = getLocalPos(canvas.width/2, canvas.height/2, view.getParent());
    const focusTask = tweenAsync(
      this.scene,
      {
        targets: view,
        scaleX: 1.0,
        scaleY: 1.0,
        x: centerPosition.x,
        y: centerPosition.y,
        duration: 780,
        ease: "Quart.easeInOut",
      }
    )
    scaleUpTasks.push(focusTask);
    
    await Promise.all(scaleUpTasks);
    
    // 戻るボタンを表示する
    await tweenAsync(this.scene, {
      targets: this.backButton,
      alpha: 1,
      duration: 780,
    });
    
    let backClicked = false;
    const disposable = this.backButton.onClick.subscribe(() => {
      backClicked = true;
    });
    await  waitUntil(() => backClicked);
    disposable.dispose();
    
    // 戻るボタンを非表示に
    await tweenAsync(this.scene, {
      targets: this.backButton,
      alpha: 0,
      duration: 78,
    });
    
    // フォーカスされたものをもとの大きさに
    const unfocusTask = tweenAsync(
      this.scene,
      {
        targets: view,
        scaleX: prevScale.x,
        scaleY: prevScale.y,
        x: 0,
        y: 0,
        duration: 780,
        ease: "Quart.easeInOut",
      }
    );
    scaleDownTasks.push(unfocusTask);
    await Promise.all(scaleDownTasks);
    
    this.isFocus = false;
  }

  protected override updateViews(deltaTimeMs: number) {
    // ズーム中は早期リターン
    if (this.isFocus) {
      // ズームから戻った際に少し余裕をもたしてフェードアウトする
      this.elapsedMs = this.setting.displayDuration * 1000/2;
      return;
    }
    
    const anchorView = this.museumAnchorViews[0];
    let isReset = false;
    this.elapsedMs += deltaTimeMs;
    const displayDurMs = this.setting.displayDuration * 1000;
    if (this.elapsedMs > displayDurMs) {
      this.elapsedMs = 0;
      isReset = true;
    }
    let alphaValue = 0;
    const fadeInBeginAt = 220;
    const fadeInEndAt = 780;
    const fadeOutBeginAt = displayDurMs - 780;
    const fadeOutEndAt = displayDurMs - 220;
    if (this.elapsedMs < fadeInEndAt) {
      alphaValue = smoothstep(fadeInBeginAt, fadeInEndAt, this.elapsedMs);
    } else if (this.elapsedMs >= fadeInEndAt && this.elapsedMs < fadeOutBeginAt) {
      alphaValue = 1;
    } else if (this.elapsedMs >= fadeOutBeginAt) {
      alphaValue = 1 - smoothstep(fadeOutBeginAt, fadeOutEndAt, this.elapsedMs);
    } else {
      alphaValue = 0;
    }
    if (!this.isFocus) anchorView.contentView?.setCustomAlpha(alphaValue);
    if (isReset) {
      this.linkOrCreate(anchorView);
      anchorView.contentView?.setCustomAlpha(0);
    }
    anchorView.updateView(deltaTimeMs);
  }
}