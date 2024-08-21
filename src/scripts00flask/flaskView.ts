import Phaser from "phaser";
import {GetColorCodeByRGB} from "../utility/colorUtility.ts";
import {MultiBezierCurve} from "../utility/multiBezierCurve.ts";
import {MultiBezierCurveEditor} from "../utility/multiBezierCurveEditor.ts";
import {ShaderGameObject} from "../utility/shaderGameObject.ts";
import {isLocalhost} from "../utility/localhostUtility.ts";
import {MultiBezierCurveFileAdapter} from "../utility/multiBezierCurveFileAdapter.ts";

/**
 * フラスコビュー
 * ベジエ曲線で輪郭を描画する
 */
export class FlaskView extends Phaser.GameObjects.Container {
  
  private flaskOutlineGraphics!: Phaser.GameObjects.Graphics;
  private flaskOutlineLeft!: MultiBezierCurve;
  private flaskOutlineRight!: MultiBezierCurve;
  
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
    flaskLeftOutlineJsonKey:string
  ) {
    
    super(scene, 0, 0);
    scene.add.existing(this);
    
    // 自身のサイズ
    this.setSize(width, height);
    
    // シェーダーオブジェクト作成
    this.addShaderObject(shaderKey);
    
    // フラスコの輪郭を描画
    this.addFlaskOutline(flaskLeftOutlineJsonKey);
    this.drawFlaskOutline();

    // デバッグビュー
    this.addBaseDebugView();
  }
  
  /**
   * シェーダーオブジェクト作成
   */
  private addShaderObject(shaderKey: string) {
    const width = this.width;
    const height = this.height;
    const shaderObject = new ShaderGameObject(this.scene, width, height, shaderKey);
    this.add(shaderObject);
  }
  
  private addFlaskOutline(jsonKey: string) {
    // Graphicsオブジェクトを作成
    this.flaskOutlineGraphics = this.scene.add.graphics();
    this.add(this.flaskOutlineGraphics);

    const isImportData = jsonKey != "";
    const isEditMode = isLocalhost();
    const curveUnitCount = 4;

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
    this.flaskOutlineGraphics.lineStyle(4, GetColorCodeByRGB(155,155,155), 1);
    this.flaskOutlineLeft.draw(this.flaskOutlineGraphics);
    this.flaskOutlineRight.drawLRFlip(this.flaskOutlineGraphics, this.flaskOutlineLeft);
  }
  
  /**
   * フレーム更新
   */
  public updateView() {
    if (!this.flaskOutlineLeftEditor) return;
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