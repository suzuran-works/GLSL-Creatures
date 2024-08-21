import Phaser from "phaser";
import {MultiBezierCurve} from "./multiBezierCurve.ts";
import {getAssetResourceKey} from "./assetResourceKeyUtility.ts";

export type MultiBezierCurveData = {
  curveUnits: MultiBezierCurveUnitData[],
};

export type MultiBezierCurveUnitData = {
  startPoint: {x: number, y: number},
  controlPoint1: {x: number, y: number},
  controlPoint2: {x: number, y: number},
  endPoint: {x: number, y: number},
};

/**
 * マルチベジエカーブのデータを読み書きするためのクラス
 */
export class MultiBezierCurveFileAdapter {
  
  private readonly scene!: Phaser.Scene;
  private readonly exportFileName = "tempMultiBezierCurveData.json";
  private exportTarget?: MultiBezierCurve;
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    
    console.warn("sキー押下でデータをMultiBezierCurveデータダウンロード実行");
    const sKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    sKey.on("down", (_event: KeyboardEvent) => {
      this.exportData();
    });
  }
  
  /**
   * 読み込み
   */
  public createByImportData(jsonKey:string, fmtUnitCount:number) {
    const data:MultiBezierCurveData = this.scene.cache.json.get(getAssetResourceKey(jsonKey));
    const dataUnitCount = data.curveUnits.length;
    const addUnitCount = fmtUnitCount - dataUnitCount;
    const unitCount = dataUnitCount + addUnitCount;
    const target = new MultiBezierCurve(unitCount, {x:0, y:0}, {x:0, y:0});
    const curveUnits = target.curveUnits;
    for (let i = 0; i < unitCount; i++) {
      if (i >= curveUnits.length) break;
      const curveUnit = curveUnits[i];
      const unitData = data.curveUnits[i];
      curveUnit.startPoint.x = unitData.startPoint.x;
      curveUnit.startPoint.y = unitData.startPoint.y;
      curveUnit.controlPoint1.x = unitData.controlPoint1.x;
      curveUnit.controlPoint1.y = unitData.controlPoint1.y;
      curveUnit.controlPoint2.x = unitData.controlPoint2.x;
      curveUnit.controlPoint2.y = unitData.controlPoint2.y;
      curveUnit.endPoint.x = unitData.endPoint.x;
      curveUnit.endPoint.y = unitData.endPoint.y;
    }
    return target;
  }
  
  /**
   * 書き出し対象登録
   */
  public registerExportTarget(target:MultiBezierCurve) {
    this.exportTarget = target;
  }
  
  /**
   * 書き出し
   */
  private exportData() {
    console.warn("MultiBezierCurveデータエクスポート...");
    if (this.exportTarget === undefined) {
      console.error("exportTargetが未設定");
      return;
    }

    const curveUnits = this.exportTarget.curveUnits;
    const curveUnitDatas: MultiBezierCurveUnitData[] = [];
    for (let i = 0; i < curveUnits.length; i++) {
      const curveUnit = curveUnits[i];
      const unitData: MultiBezierCurveUnitData = {
        startPoint: {x: curveUnit.startPoint.x, y: curveUnit.startPoint.y},
        controlPoint1: {x: curveUnit.controlPoint1.x, y: curveUnit.controlPoint1.y},
        controlPoint2: {x: curveUnit.controlPoint2.x, y: curveUnit.controlPoint2.y},
        endPoint: {x: curveUnit.endPoint.x, y: curveUnit.endPoint.y},
      };
      curveUnitDatas.push(unitData);
    }
    const multiBezierCurveData: MultiBezierCurveData = {
      curveUnits: curveUnitDatas,
    };
    
    const jsonData = JSON.stringify(multiBezierCurveData, null, 2);
    downloadData(this.exportFileName, jsonData);
    
    console.log(jsonData);
    console.warn("MultiBezierCurveデータエクスポート完了");
  }
}

const downloadData = (fileName:string, data:string) => {
  const blob = new Blob([data], {type: "application/json"});
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
