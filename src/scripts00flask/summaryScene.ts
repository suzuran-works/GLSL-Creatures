import Phaser from 'phaser';
import {CreateConfig} from "../define.ts";

/**
 * SummaryScene
 */
export class SummaryScene extends Phaser.Scene {
    
    public static Key = 'SummaryScene';
    
    /**
     * コンストラクタ
     */
    constructor() {
        super(SummaryScene.Key);
        console.log('SummaryScene constructor');
    }
    
    /**
     * プリロード
     */
    preload() {
        console.log('SummaryScene preload');

        // サンプルで画像をロード
        this.load.image('logo', '../public/textures/suzuran_logo_withname.webp');
    }
    
    /**
     * ゲームオブジェクト初期化
     */
    create() {
        console.log('SummaryScene create');

        const canvas = this.game.canvas;

        // 画像
        this.add.image(canvas.width/2, canvas.height/2, 'logo');

        // テキスト
        const text = this.add.text(0, 0, "frask", {fontSize: 30});
        text.setOrigin(0.5, 0.5);
        text.setFill('#ffffff');
        text.setPosition(canvas.width/2, canvas.height/2 + 200);
    }
}

new Phaser.Game(CreateConfig([SummaryScene]));