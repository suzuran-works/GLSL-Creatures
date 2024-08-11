import Phaser from 'phaser';
import {createConfig, FONT_SMARTFONTUI} from "../define.ts";
import {FlaskView} from "./flaskView.ts";
import {tweenAsync} from "../utility/tweenAsync.ts";
import {GetColorCodeTextByRGB} from "../utility/colorUtility.ts";


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
        this.load.image('logo', '../textures/suzuran_logo_withname.webp');
    }
    
    /**
     * ゲームオブジェクト初期化
     */
    create() {
        console.log('SummaryScene create');

        const canvas = this.game.canvas;

        // 画像
        //this.add.image(canvas.width/2, canvas.height/2, 'logo');

        // URLからパラメータを取得
        const params = new URLSearchParams(window.location.search);
        const idx = params.get('idx');

        // パラメータに基づいてゲームの設定を行う
        let msg = 'flask';
        if (idx) {
            console.log(`index: ${idx}`);
            msg = `フラスコの中の何か: ${idx}`;
        }

        // テキスト
        const text = this.add.text(0, 0, msg, {
            fontSize: 30,
            fontFamily: FONT_SMARTFONTUI,
        });
        text.setOrigin(0.5, 0.5);
        text.setFill(GetColorCodeTextByRGB(180, 180, 180));
        text.setPosition(canvas.width/2, canvas.height - 22);
        
        // フラスコ
        const flask = new FlaskView(this, 1000, 1000);
        flask.setPosition(canvas.width/2, canvas.height/2 -22);
        
        tweenAsync(this, {
            targets: flask,
            duration: 3000,
            x: 540,
            repeat: -1,
            yoyo: true,
            ease: 'Sine.easeInOut'
        }).then();
    }
}

new Phaser.Game(createConfig([SummaryScene]));