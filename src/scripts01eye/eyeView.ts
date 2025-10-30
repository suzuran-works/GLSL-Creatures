import Phaser from "phaser";
import {GetColorCodeByRGB} from "../utility/colorUtility.ts";
import {ShaderGameObject} from "../utility/shaderGameObject.ts";
import {getParents} from "../utility/containerUtility.ts";
import {MuseumViewInterface} from "../commonSystems/museumSystemBase.ts";
import {SimpleObservable} from "../utility/simpleObservable.ts";
import {ReadonlyObservableInterface} from "../utility/simpleDisposableInterface.ts";
import {IMAGE_TINT_COLOR, SHADER_OBJECT_OFFSET, SHADER_OBJECT_SIZE, SHOWCASE_VIEW_SCALE} from "./define.ts";

const IS_DEBUG = false;

/**
 * 目ビュー
 * 瞳の部分がアルファ抜きの画像を使う
 */
export class EyeView extends Phaser.GameObjects.Container implements MuseumViewInterface{
  
  private readonly _shaderIndex!: number; 
  public get shaderIndex() { return this._shaderIndex; }
  
  private parents?: Phaser.GameObjects.Container[];
  
  private shaderGameObject?: ShaderGameObject;

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
    shaderIndex: number,
    shaderKey: string,
    imageKey: string,
    shaderObjectOffset: {x:number, y:number},
    shaderObjectSize: {width:number, height:number},
  ) {
    super(scene, 0, 0);
    scene.add.existing(this);
    
    this._shaderIndex = shaderIndex;
    
    // 自身のサイズ
    this.setSize(width, height);
    
    // シェーダーオブジェクト作成
    if (shaderKey != "") this.addShaderObject(shaderKey, shaderObjectOffset, shaderObjectSize);
    
    // 画像
    this.addImage(imageKey);
    
    this.prevScaleX = this.scaleX;
    
    // ボタン領域追加
    if (shaderKey != "") this.addButtonRect();
  }
  
  /**
   * @inheritDoc
   */
  public setParentTo(parent: Phaser.GameObjects.Container) {
    parent.add(this);
    this.setPosition(0, 0);
    this.setActive(true);
    this.setVisible(true);
  }

  /**
   * @inheritDoc
   */
  public getParent() {
    return this.parentContainer;
  }

  /**
   * @inheritDoc
   */
  public removeParentFrom(parent: Phaser.GameObjects.Container) {
    parent.remove(this);
    this.parents = undefined;
  }

  /**
   * @inheritDoc
   */
  public setHidePosition() {
    const canvas = this.scene.game.canvas;
    this.setPosition(-canvas.width, -canvas.height);
    this.setActive(false);
    this.setVisible(false);
  }
  
  /**
   * @inheritDoc
   */
  public getScale() {
    return {x: this.scaleX, y: this.scaleY};
  }
  
  /**
   * @inheritDoc
   */
  public setCustomAlpha(alpha: number) {
    // alpha が 0~0.5
    if (alpha >= 0 && alpha < 0.5) {
      this.shaderGameObject?.setUniformAlpha(0);
      this.setAlpha(alpha * 2);
    } 
    // alpha が 0.5~1
    else {
      this.shaderGameObject?.setUniformAlpha((alpha - 0.5) * 2);
      this.setAlpha(1);
    }
  }

  /**
   * ボタン追加
   */
  private addButtonRect() {
    const color = GetColorCodeByRGB(255,255,255);
    const alpha = 0.0;
    const width = this.width * 0.6;
    const height = this.height;
    const rect = new Phaser.GameObjects.Rectangle(this.scene, 0, 0, width, height, color, alpha);
    this.add(rect);

    // 押下時イベント
    rect.setInteractive();
    rect.on('pointerdown', () => {
      const alpha = this.getApparentlyAlpha();
      if (alpha < 1) return;
      this._onClick.on(undefined);
    });
  }
  
  /**
   * シェーダーオブジェクト作成
   */
  private addShaderObject(shaderKey: string, shaderObjectOffset: {x:number, y:number}, shaderObjectSize: {width:number, height:number}) {
    const width = shaderObjectSize.width;
    const height = shaderObjectSize.height;
    this.shaderGameObject = new ShaderGameObject(this.scene, width, height, shaderKey);
    this.shaderGameObject.setPosition(shaderObjectOffset.x, shaderObjectOffset.y);
    this.add(this.shaderGameObject);
  }
  
  /**
   * 画像を表示
   */
  private addImage(imageKey: string) {
    const image = this.scene.add.image(0, 0, imageKey);
    image.setTint(IMAGE_TINT_COLOR);
    this.add(image);
    
    if (IS_DEBUG) {
      image.setAlpha(0.5);
    }
  }
  
  /**
   * フレーム更新
   */
  public updateView(_deltaTimeMs: number) {
    
    // 透明度(親階層考慮)
    //const alpha = this.getApparentlyAlpha();
    //this.shaderGameObject?.setUniformAlpha(alpha);
    
    // スケール変更時
    if (this.scaleX != this.prevScaleX) {
      
    }
    this.prevScaleX = this.scaleX;
  }
  
  /**
   * 親階層考慮の透明度取得
   */
  private getApparentlyAlpha() {
    // 親階層取得
    if (!this.parents) this.parents = getParents(this);

    // alpha
    let alpha = this.alpha;
    for (const parent of this.parents) alpha *= parent.alpha;
    
    return alpha;
  }
  
  /**
   * 自身のサイズと位置に基づいてデバッグビューを追加
   */
  /*
  private addDebugRectView(x:number, y:number, w:number, h:number) {
    const color = GetColorCodeByRGB(255,255,255);
    const alpha = 0.1;
    const rect = new Phaser.GameObjects.Rectangle(this.scene, x, y, w, h, color, alpha);
    this.add(rect);
  }
   */

  /**
   * 作成(空)
   */
  public static CreateEmpty(scene: Phaser.Scene, imageKey: string) {
    return EyeView.Create(scene, -1, "", imageKey);
  }

  /**
   * 作成
   */
  public static Create(scene: Phaser.Scene, shaderIndex: number, shaderKey: string, imageKey: string): MuseumViewInterface {
    const canvas = scene.sys.game.canvas;
    const viewSize = {width: canvas.width, height: canvas.height};
    const initScale = SHOWCASE_VIEW_SCALE;
    const shaderObjectSize = SHADER_OBJECT_SIZE;
    const shaderObjectOffset = SHADER_OBJECT_OFFSET;

    const view = new EyeView(
      scene,
      viewSize.width,
      viewSize.height,
      shaderIndex,
      shaderKey,
      imageKey,
      shaderObjectOffset,
      shaderObjectSize,
    );
    view.setHidePosition();
    view.setScale(initScale, initScale);
    return view;
  }
}

/**
 * 空のビューファクトリ
 */
export class EmptyViewFactory {
  private readonly scene: Phaser.Scene;
  private readonly imageKey: string;
  
  constructor(scene: Phaser.Scene, imageKey: string) {
    this.scene = scene;
    this.imageKey = imageKey;
  }
  
  public create(): MuseumViewInterface {
    return EyeView.CreateEmpty(this.scene, this.imageKey);
  }
}