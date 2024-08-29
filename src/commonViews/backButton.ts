import {tweenAsync} from "../utility/tweenAsync.ts";
import {ReadonlyObservableInterface, SimpleObservable} from "../utility/simpleObservable.ts";

/**
 * 戻るボタン
 */
export class BackButton extends Phaser.GameObjects.Container {
  
  private readonly _onClick: SimpleObservable = new SimpleObservable();
  public onClick: ReadonlyObservableInterface = this._onClick;
  
  /**
   * コンストラクタ
   */
  constructor(scene: Phaser.Scene, color: number, alpha: number) {
    super(scene, 0, 0);
    scene.add.existing(this);

    const size = 78;
    this.setSize(size, size);
    
    //const debugColor = 0x00ff00;
    //const debugRect = scene.add.rectangle(0, 0, this.width, this.height, debugColor, 0.1);
    //this.add(debugRect);
    
    const ellipse = scene.add.ellipse(0, 0, this.width/3, this.height/3, color, alpha);
    this.add(ellipse);
    
    // 押下時イベント
    this.setInteractive();
    this.on('pointerdown', () => {
      if (this.alpha < 1) return;
      this._onClick.on(undefined);
    });
    
    // 左上に配置
    this.setPosition(this.width, this.height);
    
    // 初めは非表示
    this.setEnable(false);
  }
  
  /**
   * 有効化・無効化
   * alphaの値を利用する
   */
  public setEnable(isEnable: boolean) {
    this.alpha = isEnable ? 1 : 0;
  }
  
  /**
   * 表示
   */
  public async showAsync(delay = 0) {
    await tweenAsync(this.scene, {
      targets: this,
      alpha:1,
      delay: delay,
      duration: 780
    });
  }
  
  /**
   * 非表示(無効化)
   */
  public async hideAsync() {
    await tweenAsync(this.scene, {
      targets: this,
      alpha:0,
      duration: 220
    });
  }
}