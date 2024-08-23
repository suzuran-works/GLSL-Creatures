import Phaser from "phaser";
import {GetColorCodeByRGB} from "../utility/colorUtility.ts";
import {MultiBezierCurve} from "../utility/multiBezierCurve.ts";
import {MultiBezierCurveEditor} from "../utility/multiBezierCurveEditor.ts";
import {ShaderGameObject} from "../utility/shaderGameObject.ts";
import {isLocalhost} from "../utility/localhostUtility.ts";
import {MultiBezierCurveFileAdapter} from "../utility/multiBezierCurveFileAdapter.ts";
import {EDIT_MODE} from "./define.ts";

/**
 * フラスコビュー
 * ベジエ曲線で輪郭を描画する
 */
export class FlaskView extends Phaser.GameObjects.Container {
  
  private flaskOutlineGraphics!: Phaser.GameObjects.Graphics;
  private flaskOutlineLeft!: MultiBezierCurve;
  private flaskOutlineRight!: MultiBezierCurve;
  
  private shaderGameObject!: ShaderGameObject;
  
  // @ts-ignore
  private flaskOutlineLeftEditor?: MultiBezierCurveEditor;
  // @ts-ignore
  private flaskOutlineLeftFileAdapter?: MultiBezierCurveFileAdapter;
  
  /**
   * コンストラクタ
   */
  constructor(
    scene: Phaser.Scene,
    width: number,
    height: number,
    shaderKey: string,
    flaskLeftOutlineJsonKey:string,
    shaderObjectOffSetY: number = 180
  ) {
    
    super(scene, 0, 0);
    scene.add.existing(this);
    
    // 自身のサイズ
    this.setSize(width, height);
    
    // シェーダーオブジェクト作成
    this.addShaderObject(shaderKey, shaderObjectOffSetY);
    
    // フラスコの輪郭を描画
    this.addFlaskOutline(flaskLeftOutlineJsonKey);
    this.drawFlaskOutline();

    // デバッグビュー
    if (EDIT_MODE) this.addDebugRectView(0,0,width,height);
  }
  
  /**
   * シェーダーオブジェクト作成
   */
  private addShaderObject(shaderKey: string, offsetY:number) {
    const width = this.width;
    const height = this.height;
    this.shaderGameObject = new ShaderGameObject(this.scene, width, height, shaderKey);
    this.shaderGameObject.setPosition(0, offsetY);
    this.add(this.shaderGameObject);
    
    // デバッグビュー
    if (EDIT_MODE) this.addDebugRectView(this.shaderGameObject.x, this.shaderGameObject.y, width * 0.5, height * 0.5)
  }
  
  private addFlaskOutline(jsonKey: string) {
    // Graphicsオブジェクトを作成
    this.flaskOutlineGraphics = this.scene.add.graphics();
    this.add(this.flaskOutlineGraphics);

    const isImportData = jsonKey != "";
    const isEditMode = isLocalhost() && EDIT_MODE;
    const curveUnitCount = 6;

    // アウトライン左側のデータ読み書きを用意
    this.flaskOutlineLeftFileAdapter = new MultiBezierCurveFileAdapter(this.scene);
    
    // 新規作成
    if (!isImportData) {
      // アウトライン左側
      this.flaskOutlineLeft = new MultiBezierCurve(
        curveUnitCount,
        {x:0, y:this.height/2},
        {x:0, y:-this.height/2}
      );      
    }
    // データ読み込み
    else {
      this.flaskOutlineLeft = this.flaskOutlineLeftFileAdapter.createByImportData(jsonKey, curveUnitCount);
    }
    
    // 書き出し対象登録
    this.flaskOutlineLeftFileAdapter.registerExportTarget(this.flaskOutlineLeft);
    
    // ローカルホストの場合はエディタを有効化
    if (isEditMode) {
      this.flaskOutlineLeftEditor = new MultiBezierCurveEditor(this.scene, this, this.flaskOutlineLeft);
    }
    
    // アウトライン右側(コピー)
    this.flaskOutlineRight = this.flaskOutlineLeft.deepCopy();
  }
  
  /**
   * フラスコ線を描画
   */
  private drawFlaskOutline() {
    this.flaskOutlineGraphics.clear();
    this.flaskOutlineGraphics.lineStyle(4, GetColorCodeByRGB(122,122,122), 1.0);
    this.flaskOutlineLeft.draw(this.flaskOutlineGraphics);
    this.flaskOutlineRight.drawLRFlip(this.flaskOutlineGraphics, this.flaskOutlineLeft);
  }
  
  /**
   * フレーム更新
   */
  public updateView() {
    this.shaderGameObject.setUniformAlpha(this.alpha);
    if (this.flaskOutlineLeftEditor) this.drawFlaskOutline();
  }
  
  /**
   * 自身のサイズと位置に基づいてデバッグビューを追加
   */
  private addDebugRectView(x:number, y:number, w:number, h:number) {
    const color = GetColorCodeByRGB(255,255,255);
    const alpha = 0.1;
    const rect = new Phaser.GameObjects.Rectangle(this.scene, x, y, w, h, color, alpha);
    this.add(rect);
  }
}