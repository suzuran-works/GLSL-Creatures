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
    }
    
    /**
     * ゲームオブジェクト初期化
     */
    create() {
        console.log('MainScene create');

        // テキスト
        const text = this.add.text(0, 0, "GLSL Creatures", {fontSize: 30});
        text.setOrigin(0.5, 0.5);
        text.setFill('#ffffff');

        // 座標を設定
        const canvas = this.game.canvas;
        text.setPosition(canvas.width/2, canvas.height/2);
    }
}

