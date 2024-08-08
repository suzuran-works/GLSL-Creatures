import Phaser from "phaser";

/**
 * スクリーンサイズ
 */
export const ScreenSize = {
  Width: 1080,
  Height: 1080
};

/**
 * Phaserコンフィグ作成
 */
export const CreateConfig = (scenes: Phaser.Types.Scenes.SceneType[]) => {
  return {
    type: Phaser.AUTO,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: ScreenSize.Width,
      height: ScreenSize.Height,
    },
    scene: scenes,
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x:0, y: 0 }
      }
    }
  }
}