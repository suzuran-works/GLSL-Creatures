import Phaser from "phaser";
import {GetColorCodeByRGB} from "../utility/colorUtility.ts";
import {MultiBezierCurve} from "../utility/multiBezierCurve.ts";
import {MultiBezierCurveEditor} from "../utility/multiBezierCurveEditor.ts";

/**
 * フラスコビュー
 * ベジエ曲線で輪郭を描画する
 */
export class FlaskView extends Phaser.GameObjects.Container {
  
  private flaskOutlineGraphics!: Phaser.GameObjects.Graphics;
  private flaskOutlineLeft!: MultiBezierCurve;
  private flaskOutlineLeftEditor!: MultiBezierCurveEditor;
  
  private isEditMode = true;
  
  /**
   * コンストラクタ
   */
  constructor(scene: Phaser.Scene, width: number, height: number) {
    super(scene, 0, 0);
    scene.add.existing(this);
    
    // 自身のサイズ
    this.setSize(width, height);
   
    // デバッグビュー
    this.addBaseDebugView();
    
    // フラスコの輪郭を描画
    this.drawFlaskOutline();
  }
  
  private drawFlaskOutline() {
    if (this.flaskOutlineGraphics === undefined) {
      // Graphicsオブジェクトを作成
      this.flaskOutlineGraphics = this.scene.add.graphics();
      this.add(this.flaskOutlineGraphics); 
      
      // アウトライン左側
      this.flaskOutlineLeft = new MultiBezierCurve(
        2,
        {x:0, y:this.height/2},
        {x:0, y:-this.height/2}
      );
      if (this.isEditMode) this.flaskOutlineLeftEditor = new MultiBezierCurveEditor(this.scene, this, this.flaskOutlineLeft);
    }
    
    this.flaskOutlineGraphics.clear();
    this.flaskOutlineGraphics.lineStyle(4, GetColorCodeByRGB(155,155,155), 1);
    this.flaskOutlineLeft.draw(this.flaskOutlineGraphics);
  }
  
  public updateView() {
    if (!this.isEditMode) return;
    this.drawFlaskOutline();
  }
  
  /**
   * 自身のサイズと位置に基づいてデバッグビューを追加
   */
  private addBaseDebugView() {
    const color = GetColorCodeByRGB(255,255,255);
    const alpha = 0.0;
    const rect = new Phaser.GameObjects.Rectangle(this.scene, 0, 0, this.width, this.height, color, alpha);
    this.add(rect);
  }
}