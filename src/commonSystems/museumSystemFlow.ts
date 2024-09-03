import {
  EmptyMuseumViewFactoryInterface,
  MuseumSystemBase,
  MuseumViewInterface
} from "./museumSystemBase.ts";
import Phaser from "phaser";
import {MuseumAnchorView} from "./museumAnchorView.ts";
import {smoothstep} from "../utility/mathUtility.ts";
import {Queue} from "../utility/queue.ts";

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
  
  /**
   * コンストラクタ
   */
  constructor(
    scene: Phaser.Scene,
    viewQueus: Queue<MuseumViewInterface>,
    emptyViewFactory: EmptyMuseumViewFactoryInterface,
    setting: MuseumSetting,
  ) {
    super(scene, viewQueus, emptyViewFactory);
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
  
  protected override updateViews(deltaTimeMs: number) {
    const transparentDistance = this.setting.fadeDistance;
    const canvasWidth = this.scene.game.canvas.width;
    const fadeThresBeginX = canvasWidth - transparentDistance;
    const fadeThresEndX = transparentDistance;
    const fadeDistance = this.setting.fadeDistance;
    for (let i = 0; i < this.positionRefs.length; ++i) {
      const posRef = this.positionRefs[i];
      posRef.x += -this.setting.flowSpeed * deltaTimeMs;
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