import Phaser from "phaser";
import {GetColorCodeByRGB} from "../utility/colorUtility.ts";
import {MultiBezierCurve} from "../utility/multiBezierCurve.ts";
import {MultiBezierCurveEditor} from "../utility/multiBezierCurveEditor.ts";
import {ShaderGameObject} from "../utility/shaderGameObject.ts";
import {MultiBezierCurveFileAdapter} from "../utility/multiBezierCurveFileAdapter.ts";
import {
  FLASK_OUTLINE_COLOR_VALUE,
  FLASK_OUTLINE_COLOR_VALUE_FLOATING,
  FLASK_OUTLINE_THICKNESS,
  FLASK_OUTLINE_THICKNESS_FLOATING,
  FLOATING_FLASK_VIEW_SCALE,
  IS_EDIT_MODE, PATH_JSONS
} from "./define.ts";
import {getParents} from "../utility/containerUtility.ts";
import {MuseumViewInterface} from "../commonSystems/museumSystem.ts";
import {inverseLerp} from "../utility/mathUtility.ts";
import {ReadonlyObservableInterface, SimpleObservable} from "../utility/simpleObservable.ts";

/**
 * フラスコビュー
 * ベジエ曲線で輪郭を描画する
 */
export class FlaskView extends Phaser.GameObjects.Container implements MuseumViewInterface{
  
  private parents?: Phaser.GameObjects.Container[];
  
  private flaskOutlineGraphics!: Phaser.GameObjects.Graphics;
  private flaskOutlineLeft!: MultiBezierCurve;
  private flaskOutlineRight!: MultiBezierCurve;
  
  private shaderGameObject?: ShaderGameObject;
  
  // @ts-ignore
  private flaskOutlineLeftEditor?: MultiBezierCurveEditor;
  // @ts-ignore
  private flaskOutlineLeftFileAdapter?: MultiBezierCurveFileAdapter;

  private readonly _onClick: SimpleObservable = new SimpleObservable();
  public onClick: ReadonlyObservableInterface = this._onClick;
  
  private prevScaleX = 1;
  
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
    if (shaderKey != "") this.addShaderObject(shaderKey, shaderObjectOffSetY);
    
    // フラスコの輪郭を描画
    this.addFlaskOutline(flaskLeftOutlineJsonKey);
    this.drawFlaskOutline();
    
    this.prevScaleX = this.scaleX;

    // デバッグビュー
    if (IS_EDIT_MODE) this.addDebugRectView(0,0, width, height);
    
    // ボタン領域追加
    this.addButtonRect();
  }
  
  public setParentTo(parent: Phaser.GameObjects.Container) {
    parent.add(this);
    this.setPosition(0, 0);
  }
  
  public removeParentFrom(parent: Phaser.GameObjects.Container) {
    parent.remove(this);
  }
  
  public setHidePosition() {
    const canvas = this.scene.game.canvas;
    this.setPosition(-canvas.width, -canvas.height);
  }

  private addButtonRect() {
    const color = GetColorCodeByRGB(255,255,255);
    const alpha = 0.1;
    const width = this.width * 0.6;
    const height = this.height;
    const rect = new Phaser.GameObjects.Rectangle(this.scene, 0, 0, width, height, color, alpha);
    this.add(rect);
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
    if (IS_EDIT_MODE) this.addDebugRectView(this.shaderGameObject.x, this.shaderGameObject.y, width * 0.5, height * 0.5)
  }
  
  private addFlaskOutline(jsonKey: string) {
    // Graphicsオブジェクトを作成
    this.flaskOutlineGraphics = this.scene.add.graphics();
    this.add(this.flaskOutlineGraphics);

    const isImportData = jsonKey != "";
    const isEditMode = IS_EDIT_MODE
    const curveUnitCount = 6;

    // アウトライン左側のデータ読み書きを用意
    this.flaskOutlineLeftFileAdapter = new MultiBezierCurveFileAdapter(this.scene, this);
    
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
    const {thickness, colorValue} = this.getFlaskOutlineThickness();
    this.flaskOutlineGraphics.lineStyle(thickness, GetColorCodeByRGB(colorValue,colorValue,colorValue), 1.0);
    this.flaskOutlineLeft.draw(this.flaskOutlineGraphics);
    this.flaskOutlineRight.drawLRFlip(this.flaskOutlineGraphics, this.flaskOutlineLeft);
  }
  
  /**
   * スケールに応じたアウトラインの太さと色を取得
   */
  private getFlaskOutlineThickness() {
    const scale = this.scaleX;
    const s01 = inverseLerp(FLOATING_FLASK_VIEW_SCALE, 1.0, scale);
    const thickness = Phaser.Math.Linear(FLASK_OUTLINE_THICKNESS_FLOATING, FLASK_OUTLINE_THICKNESS, s01);
    const colorValue = Phaser.Math.Linear(FLASK_OUTLINE_COLOR_VALUE_FLOATING, FLASK_OUTLINE_COLOR_VALUE, s01);
    
    return {thickness:thickness, colorValue:colorValue};
  }
  
  /**
   * フレーム更新
   */
  public updateView(_deltaTimeMs: number) {
    // 親階層取得
    if (!this.parents) this.parents = getParents(this);
    
    // alpha
    let alpha = this.alpha;
    for (const parent of this.parents) alpha *= parent.alpha;
    this.shaderGameObject?.setUniformAlpha(alpha);
    
    // 編集モード時更新
    if (this.flaskOutlineLeftEditor) this.drawFlaskOutline();
    // スケール変更時
    else if (this.scaleX != this.prevScaleX) this.drawFlaskOutline();
    
    this.prevScaleX = this.scaleX;
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

  /**
   * 作成(空)
   */
  public static CreateEmpty(scene: Phaser.Scene, flaskLeftOutlineJsonKey: string) {
    return FlaskView.Create(scene, "", flaskLeftOutlineJsonKey);
  }

  /**
   * 作成
   */
  public static Create(scene: Phaser.Scene, shaderKey: string, flaskLeftOutlineJsonKey: string): MuseumViewInterface {
    const canvas = scene.sys.game.canvas;
    const viewSize = {width: canvas.width, height: canvas.height};
    const initScale = FLOATING_FLASK_VIEW_SCALE;

    const view = new FlaskView(scene, viewSize.width, viewSize.height, shaderKey, flaskLeftOutlineJsonKey);
    view.setHidePosition();
    view.setScale(initScale, initScale);
    return view;
  }
}

/**
 * 空のフラスコビューファクトリ
 */
export class EmptyFlaskViewFactory {
  private readonly scene: Phaser.Scene;
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }
  
  public create(): MuseumViewInterface {
    return FlaskView.CreateEmpty(this.scene, PATH_JSONS.FLASK_LEFT_OUTLINE_A);
  }
}