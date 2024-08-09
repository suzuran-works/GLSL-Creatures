import Phaser from "phaser";

export class FlaskOutline {
  
  // 曲線配列
  public curveUnits: CurveUnit[];
  
  /**
   * コンストラクタ
   */
  constructor(curveCount: number, tempStartPos: {x: number,y: number}, tempEndPos: {x: number,y: number}) {
    this.curveUnits = [];
    
    const diffX = tempEndPos.x - tempStartPos.x;
    const diffY = tempEndPos.y - tempStartPos.y;
    const deltaX = diffX / curveCount;
    const deltaY = diffY / curveCount;
    
    const distance = Math.sqrt(diffX * diffX + diffY * diffY);
    const deltaDistance = distance / curveCount;
    
    let sPos = {x: tempStartPos.x, y: tempStartPos.y};
    for (let i = 0; i < curveCount; i++) {
      
      const ePos = {x: sPos.x + deltaX, y: sPos.y + deltaY};
      const cPos1 = {x: sPos.x - deltaDistance * 0.5, y: sPos.y};
      const cPos2 = {x: ePos.x + deltaDistance * 0.5, y: ePos.y};
      
      const curveUnit = new CurveUnit(sPos, cPos1, cPos2, ePos);
      this.curveUnits.push(curveUnit);
      
      sPos = {x: ePos.x, y: ePos.y};
    }
  }
  
  /**
   * 指定のGraphicsに描画
   */
  public draw(graphics: Phaser.GameObjects.Graphics) {
    for(let i = 0; i < this.curveUnits.length; i++) {
      this.curveUnits[i].curve.draw(graphics);
    }
  }
}

/**
 * 曲線単位
 */
class CurveUnit {
  public curve!: Phaser.Curves.CubicBezier;
  public startPoint!: Phaser.Math.Vector2;
  public controlPoint1!: Phaser.Math.Vector2;
  public controlPoint2!: Phaser.Math.Vector2;
  public endPoint!: Phaser.Math.Vector2;
  
  constructor(
    startPos: {x: number,y: number},
    controlPos1: {x: number,y: number},
    controlPos2: {x: number,y: number},
    endPoint: {x: number,y: number}) {
    this.startPoint = new Phaser.Math.Vector2(startPos.x, startPos.y);
    this.controlPoint1 = new Phaser.Math.Vector2(controlPos1.x, controlPos1.y);
    this.controlPoint2 = new Phaser.Math.Vector2(controlPos2.x, controlPos2.y);
    this.endPoint = new Phaser.Math.Vector2(endPoint.x, endPoint.y);
    this.curve = new Phaser.Curves.CubicBezier(
      this.startPoint,
      this.controlPoint1,
      this.controlPoint2,
      this.endPoint);
  }
}