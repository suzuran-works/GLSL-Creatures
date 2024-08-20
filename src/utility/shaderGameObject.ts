import Phaser from "phaser";


/**
 * シェーダーゲームオブジェクト
 */
export class ShaderGameObject extends Phaser.GameObjects.Container {

  private readonly shaderKey!: string;
  
  /**
   * コンストラクタ
   */
  constructor(scene: Phaser.Scene, width: number, height: number, shaderKey: string) {
    super(scene, 0, 0);
    scene.add.existing(this);
    
    // シェーダーキー
    this.shaderKey = shaderKey;

    // 自身のサイズ
    this.setSize(width, height);
    
    // シェーダーオブジェクト作成
    this.addShaderObject();
  }
  
  private addShaderObject() {
    const width = this.width;
    const height = this.height;
    const fragShaderText = this.scene.cache.text.get(this.shaderKey);
    const baseShaderKey = `baseShader${this.shaderKey}`;
    const baseShader = new Phaser.Display.BaseShader(baseShaderKey, fragShaderText);
    const shaderObject = this.scene.add.shader(baseShader, 0, 0, width, height);
    this.add(shaderObject);
  }
}