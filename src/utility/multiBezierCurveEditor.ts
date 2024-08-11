import Phaser from "phaser";
import {MultiBezierCurve} from "./multiBezierCurve.ts";
import {GetColorCodeByRGB} from "./colorUtility.ts";

/**
 * マルチベジエカーブエディタ
 */
export class MultiBezierCurveEditor {
  
  private readonly scene: Phaser.Scene;
  private readonly container: Phaser.GameObjects.Container;
  private readonly multiBezierCurve: MultiBezierCurve;
  
  private touchablecircleSets: TouchableCircleSet[] = [];
  
  /**
   * コンストラクタ
   */
  constructor(scene: Phaser.Scene, container: Phaser.GameObjects.Container, multiBezierCurve: MultiBezierCurve) {
    this.scene = scene;
    this.container = container;
    this.multiBezierCurve = multiBezierCurve;
    
    this.drawCirclePoints();
    this.linkStartAndEndPoints();
  }
  
  private drawCirclePoints() {
    for (let i = 0; i < this.multiBezierCurve.curveUnits.length; i++) {
      const curveUnit = this.multiBezierCurve.curveUnits[i];
      const circleS = new TouchableCircle(this.scene, curveUnit.startPoint, GetColorCodeByRGB(0,255,0));
      this.container.add(circleS);

      const circleC1 = new TouchableCircle(this.scene, curveUnit.controlPoint1, GetColorCodeByRGB(255,0,255));
      this.container.add(circleC1);

      const circleC2 = new TouchableCircle(this.scene, curveUnit.controlPoint2, GetColorCodeByRGB(0,255,255));
      this.container.add(circleC2);
      
      const circleE = new TouchableCircle(this.scene, curveUnit.endPoint, GetColorCodeByRGB(255,255,255));
      this.container.add(circleE);
      
      const set = new TouchableCircleSet(circleS, circleC1, circleC2, circleE);
      this.touchablecircleSets.push(set);
    }
  }
  
  private linkStartAndEndPoints() {
    for (let i = 1; i < this.touchablecircleSets.length; i++) {
      const set = this.touchablecircleSets[i];
      const prevSet = this.touchablecircleSets[i-1];
      set.cs.link(prevSet.ce);
    }
  }
}

class TouchableCircleSet {
  public cs!: TouchableCircle;
  public cc1!: TouchableCircle;
  public cc2!: TouchableCircle;
  public ce!: TouchableCircle;
  
  constructor(cs: TouchableCircle, cc1: TouchableCircle, cc2: TouchableCircle, ce: TouchableCircle) {
    this.cs = cs;
    this.cc1 = cc1;
    this.cc2 = cc2;
    this.ce = ce;
  }
}

class TouchableCircle extends Phaser.GameObjects.Container {
  private readonly point!: Phaser.Math.Vector2;
  private readonly circle!: Phaser.GameObjects.Arc;
  private linkedOther?: TouchableCircle;
  
  /**
   * コンストラクタ
   */
  constructor(scene: Phaser.Scene, point: Phaser.Math.Vector2, color: number) {
    super(scene, point.x, point.y);
    scene.add.existing(this);
    
    // 対象を参照
    this.point = point;

    // 円
    const radius = 10;
    const alpha = 0.5;
    this.circle = scene.add.circle(0, 0, radius, color, alpha);
    this.add(this.circle);
    
    // 円のサイズに自身をセット
    this.setSize(radius*2, radius*2);
    
    // 自身をタッチ可能に
    this.setInteractive();
    // ドラッグ可能に
    this.scene.input.setDraggable(this);
    
    // ドラッグ開始時
    this.on("dragstart", (_pointer: Phaser.Input.Pointer) => {
      this.circle.setFillStyle(color, 1);
    });
    
    // ドラッグ中
    this.on("drag", (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      this.updatePosition(dragX, dragY);
      if (this.linkedOther) this.linkedOther.updatePosition(dragX, dragY);
    });
    
    // ドラッグ終了時
    this.on("dragend", (_pointer: Phaser.Input.Pointer) => {
      this.circle.setFillStyle(color, alpha);
    });
  }
  
  public link(other: TouchableCircle) {
    this.linkedOther = other;
  }
  
  public updatePosition(x: number, y: number) {
    this.setPosition(x, y);
    this.point.set(x, y);
  }
}