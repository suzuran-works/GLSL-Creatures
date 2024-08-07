import Phaser from 'phaser';


/**
 * テストシーン
 */
export class MainScene extends Phaser.Scene {
    
    public static Key = 'mainScene';
    
    /**
     * コンストラクタ
     */
    constructor() {
        super(MainScene.Key);
        console.log('MainScene constructor');
    }
    
    /**
     * プリロード
     */
    preload() {
        console.log('MainScene preload');

        // サンプルで画像をロード
        //this.load.image('logo', './textures/suzuran_logo_withname.webp');
    }
    
    /**
     * ゲームオブジェクト初期化
     */
    create() {
        console.log('MainScene create');

        const canvas = this.game.canvas;

        // 画像
        //this.add.image(canvas.width/2, canvas.height/2, 'logo');

        // テキスト
        const text = this.add.text(0, 0, "GLSL Creatures", {fontSize: 30});
        text.setOrigin(0.5, 0.5);
        text.setFill('#ffffff');
        text.setPosition(canvas.width/2, canvas.height/2 + 200);
    }
}

