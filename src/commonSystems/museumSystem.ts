import Phaser from 'phaser';
import {MuseumAnchorView} from "./museumAnchorView.ts";
import {smoothstep} from "../utility/mathUtility.ts";

/**
 * 一覧表示・ピックアップシステム
 */
export class MuseumSystem {
  
  private readonly scene!: Phaser.Scene;
  
  private readonly museumAnchorViews: MuseumAnchorView[] = [];
  private readonly positionRefs: Phaser.Math.Vector2[] = [];
  
  private readonly SCROLL_SPEED = 0.022;
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createViews();
  }
  
  private createViews() {
    const scene = this.scene;
    const canvas = scene.game.canvas;

    const width = canvas.width;
    const count = 6;
    const margin = width / (count - 1);

    const startX = 0;

    for (let i = 0; i < count; i++) {
      const x = startX + margin * i;
      const y = canvas.height / 2;
      const posRef = new Phaser.Math.Vector2(x, y);
      this.positionRefs.push(posRef);

      const anchorView = new MuseumAnchorView(scene);
      anchorView.setPosition(posRef.x, posRef.y);
      this.museumAnchorViews.push(anchorView);
    }    
  }
  
  public systemUpdate(deltaTimeMs: number) {
    this.updateViews(deltaTimeMs);
  }
  
  /**
   * 表示更新
   */
  private updateViews(deltaTimeMs: number) {
    const transparentDistance = 78;
    const canvasWidth = this.scene.game.canvas.width;
    const fadeThresBeginX = canvasWidth - transparentDistance;
    const fadeThresEndX = transparentDistance;
    const fadeDistance = 22;
    for (let i = 0; i < this.positionRefs.length; ++i) {
      const posRef = this.positionRefs[i];
      posRef.x += -this.SCROLL_SPEED * deltaTimeMs;
      if (posRef.x < 0) posRef.x = this.scene.game.canvas.width;

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
    }
  }
}