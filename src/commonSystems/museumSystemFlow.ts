import {
  EmptyMuseumViewFactoryInterface,
  MuseumSystemBase,
  MuseumViewInterface
} from "./museumSystemBase.ts";
import Phaser from "phaser";
import {MuseumAnchorView} from "./museumAnchorView.ts";
import {smoothstep} from "../utility/mathUtility.ts";
import {Queue} from "../utility/queue.ts";
import {SimpleMessageArgInterface, SimpleMessageBroker} from "../utility/simpleMessageBroker.ts";
import {tweenAsync} from "../utility/tweenAsync.ts";
import {getLocalPos} from "../utility/transformUtility.ts";
import {BackButton} from "../commonViews/backButton.ts";
import {waitUntil} from "../utility/asyncUtility.ts";

/**
 * フォーカス時メッセージ
 */
export class SystemMessageArgOnFocus
  implements SimpleMessageArgInterface
{
  public static readonly KEY = "SystemMessageArgOnFocus";
  public readonly mappingKey = SystemMessageArgOnFocus.KEY;
  
  public isFocus: boolean;
  constructor(isFocus: boolean) {
    this.isFocus = isFocus;
  }
}

/**
 * 一覧表示設定
 */
export class MuseumSetting {
  public readonly displayCount: number;
  public readonly fadeDistance: number;
  public readonly transparentDistance: number;
  public readonly flowSpeed: number;

  constructor(
    displayCount: number,
    fadeDistance: number,
    transparentDistance: number,
    flowSpeed: number
  ) {
    this.displayCount = displayCount;
    this.fadeDistance = fadeDistance;
    this.transparentDistance = transparentDistance;
    this.flowSpeed = flowSpeed;
  }
}

/**
 * 一覧表示・ピックアップシステム(横に流れるver)
 */
export class MuseumSystemFlow extends MuseumSystemBase {

  protected readonly setting!: MuseumSetting;
  
  private isFocus = false;
  
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

    const width = canvas.width;
    const count = this.setting.displayCount;
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
  
  protected override async onClickAsync(view: MuseumViewInterface): Promise<void> {
    if (this.isFocus) return;
    console.log(`@@@ onClick: ${view.shaderIndex}`);
    this.isFocus = true;
    this.messageBroker.publish(new SystemMessageArgOnFocus(this.isFocus));

    const prevAlphas: number[] = [];
    const focusTasks: Promise<void>[] = [];
    const unFocusTasks: Promise<void>[] = [];

    // フォーカスされたもの以外を透明に
    for (let i = 0; i < this.museumAnchorViews.length; ++i) {
      const anchorView = this.museumAnchorViews[i];
      prevAlphas.push(anchorView.alpha);
      if (anchorView.contentView === view) continue;
      const task = tweenAsync(
        this.scene, {
          targets: anchorView,
          alpha: 0,
          duration: 500,
          ease: "Quint.easeOut",
        }
      );
      focusTasks.push(task);
    }
    
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
    focusTasks.push(focusTask);
    
    await Promise.all(focusTasks);
    
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
    unFocusTasks.push(unfocusTask);
    
    // 透明になったものをもとに戻す
    for (let i = 0; i < this.museumAnchorViews.length; ++i) {
      const anchorView = this.museumAnchorViews[i];
      const prevAlpha = prevAlphas[i];
      if (anchorView.contentView === view) continue;
      const task = tweenAsync(
        this.scene, {
          delay: 500,
          targets: anchorView,
          alpha: prevAlpha,
          duration: 200,
          ease: "Quint.easeOut",
        }
      );
      unFocusTasks.push(task);
    }
    
    await Promise.all(unFocusTasks);

    this.isFocus = false;
  }

  protected override updateViews(deltaTimeMs: number) {
    // ズーム中は移動停止
    const flowSpeed = this.isFocus ?  0 : this.setting.flowSpeed
    
    const transparentDistance = this.setting.fadeDistance;
    const canvasWidth = this.scene.game.canvas.width;
    const fadeThresBeginX = canvasWidth - transparentDistance;
    const fadeThresEndX = transparentDistance;
    const fadeDistance = this.setting.fadeDistance;
    for (let i = 0; i < this.positionRefs.length; ++i) {
      const posRef = this.positionRefs[i];
      posRef.x += -flowSpeed * deltaTimeMs;
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
      if (!this.isFocus) anchorView.setAlpha(alphaValue);
      if (isReset) this.linkOrCreate(anchorView);
      anchorView.updateView(deltaTimeMs);
    }
  }
}