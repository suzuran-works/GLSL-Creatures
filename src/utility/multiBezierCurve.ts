import Phaser from "phaser";

export class MultiBezierCurve {
  
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
   * 複製
   */
  public deepCopy() {
    const startPoint = this.curveUnits[0].startPoint;
    const endPoint = this.curveUnits[this.curveUnits.length - 1].endPoint;
    const newMultiBezierCurve = new MultiBezierCurve(
      this.curveUnits.length, 
      {x: startPoint.x, y: startPoint.y},
      {x: endPoint.x, y: endPoint.y}
    );
    for(let i = 0; i < this.curveUnits.length; i++) {
      newMultiBezierCurve.curveUnits[i] = this.curveUnits[i].deepCopy();
    }
    return newMultiBezierCurve;
  }
  
  /**
   * 指定のMultiBezierCurveの左右反転で描画
   */
  public drawLRFlip(graphics: Phaser.GameObjects.Graphics, from:MultiBezierCurve) {
    const fromCurveUnits = from.curveUnits;
    for (let i = 0; i < this.curveUnits.length; i++) {
      if (i >= fromCurveUnits.length) break;
      
      const myCurveUnit = this.curveUnits[i];
      const fromCurveUnit = fromCurveUnits[i];
      const sx = fromCurveUnit.startPoint.x * -1;
      const sy = fromCurveUnit.startPoint.y;
      const c1x = fromCurveUnit.controlPoint1.x * -1;
      const c1y = fromCurveUnit.controlPoint1.y;
      const c2x = fromCurveUnit.controlPoint2.x * -1;
      const c2y = fromCurveUnit.controlPoint2.y;
      const ex = fromCurveUnit.endPoint.x * -1;
      const ey = fromCurveUnit.endPoint.y;
      myCurveUnit.startPoint.set(sx, sy);
      myCurveUnit.controlPoint1.set(c1x, c1y);
      myCurveUnit.controlPoint2.set(c2x, c2y);
      myCurveUnit.endPoint.set(ex, ey);
    }
    
    this.draw(graphics);
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
  
  /**
   * 複製
   */
  public deepCopy() {
    return new CurveUnit(
      {x: this.startPoint.x, y: this.startPoint.y},
      {x: this.controlPoint1.x, y: this.controlPoint1.y},
      {x: this.controlPoint2.x, y: this.controlPoint2.y},
      {x: this.endPoint.x, y: this.endPoint.y}
    );
  }
}