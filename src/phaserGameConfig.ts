import Phaser from "phaser";
import GameConfig = Phaser.Types.Core.GameConfig;
import { MainScene } from "./main.ts";

const ScreenSize = {
    Width: 1080,
    Height: 1080
};

export const CustomFontFamily = "misaki_gothic_2nd";

const config: GameConfig = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: ScreenSize.Width,
        height: ScreenSize.Height,
    },
    scene: [MainScene/*, PlaneShaderExScene*/],
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x:0, y: 0 }
        }
    }
};

new Phaser.Game(config);