import Phaser from "phaser";
import GameConfig = Phaser.Types.Core.GameConfig;
import { MainScene } from "./main.ts";
//import {PlaneShaderExScene} from "./shaderExSceneBase.ts";

const ScreenSize = {
    Width: 1080,
    Height: 1080
};

const windowAspect = window.innerWidth / window.innerHeight;

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