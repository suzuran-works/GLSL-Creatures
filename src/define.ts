import Phaser from "phaser";

/**
 * スクリーンサイズ
 */
export const SCREEN_SIZE = {
  WIDTH: 1080,
  HEIGHT: 1080
};

/**
 * フォントファミリー
 */
export const FONT_SMARTFONTUI = "smartfontui";

/**
 * Phaserコンフィグ作成
 */
export const createConfig = (scenes: Phaser.Types.Scenes.SceneType[]) => {
  return {
    type: Phaser.AUTO,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: SCREEN_SIZE.WIDTH,
      height: SCREEN_SIZE.HEIGHT,
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