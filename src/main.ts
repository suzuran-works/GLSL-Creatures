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
    }
}

