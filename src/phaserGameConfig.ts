import Phaser from "phaser";
import GameConfig = Phaser.Types.Core.GameConfig;
import { MainScene } from "./main.ts";
import {PlaneShaderExScene} from "./shaderExSceneBase.ts";

const ScreenSize = {
    Width: 1080,
    Height: 1920
};

const windowAspect = window.innerHeight / window.innerWidth;

export const CustomFontFamily = "misaki_gothic_2nd";

const config: GameConfig = {
    type: Phaser.AUTO,
    scale: {
        mode:
          windowAspect > ScreenSize.Width / ScreenSize.Height
            ? Phaser.Scale.HEIGHT_CONTROLS_WIDTH
            : Phaser.Scale.WIDTH_CONTROLS_HEIGHT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: ScreenSize.Width,
        height: ScreenSize.Height,
    },
    scene: [MainScene, PlaneShaderExScene],
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x:0, y: 0 }
        }
    }
};

new Phaser.Game(config);