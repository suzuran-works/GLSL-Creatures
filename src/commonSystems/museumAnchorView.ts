import {MuseumViewInterface} from "./museumSystem.ts";

/**
 * 一覧表示の個々のアンカー
 */
export class MuseumAnchorView extends Phaser.GameObjects.Container {

  private _contentView?: MuseumViewInterface | undefined;
  public get contentView(): MuseumViewInterface | undefined {
    return this._contentView;
  }
  
  
  /**
   * コンストラクタ
   */
  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);
    scene.add.existing(this);
    
    this.addDebugView();
  }
  
  private addDebugView() {
    const anchor = this.scene.add.circle(0, 0, 6, 0x00ff00, 0);
    this.add(anchor);
  }
  
  public setContentView(contentView: MuseumViewInterface | undefined) {
    this._contentView = contentView;
  }
  
  public updateView(deltaTimeMs: number) {
    this._contentView?.updateView(deltaTimeMs);
  }
}