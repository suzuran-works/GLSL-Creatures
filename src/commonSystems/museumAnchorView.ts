
/**
 * 一覧表示の個々のアンカー
 */
export class MuseumAnchorView extends Phaser.GameObjects.Container {

  /**
   * コンストラクタ
   */
  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);
    scene.add.existing(this);
    
    this.addDebugView();
  }
  
  private addDebugView() {
    const anchor = this.scene.add.circle(0, 0, 10, 0x00ff00);
    this.add(anchor);
  }
}