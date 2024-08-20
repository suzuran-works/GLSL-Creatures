import Phaser from 'phaser';
import {createConfig, FONT_SMARTFONTUI} from "../define.ts";
import {FlaskView} from "./flaskView.ts";
import {tweenAsync} from "../utility/tweenAsync.ts";
import {GetColorCodeTextByRGB} from "../utility/colorUtility.ts";
import {getShaderKey} from "../utility/assetResourceKeyUtility.ts";
import {AssetLoader, AssetLoaderSceneModel} from "../utility/assetLoader.ts";
import {waitUntil} from "../utility/asyncUtility.ts";


/**
 * SummaryScene
 */
export class SummaryScene extends Phaser.Scene {
    
    public static Key = 'SummaryScene';
    
    private flaskView?: FlaskView;
    
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
        
        // ビュー追加
        this.addViewAsync().then();
    }
    
    private async addViewAsync() {
        
        const assetLoaderSceneModel = new AssetLoaderSceneModel([
            '../shaders/shaders00flask/shader_00-00.frag',
        ]);
        const sceneData = { sceneModel: assetLoaderSceneModel };
        this.scene.launch(AssetLoader.Key, sceneData);
        
        await waitUntil(() => assetLoaderSceneModel.done);
        this.scene.remove(AssetLoader.Key);
        
        // フラスコ
        const canvas = this.game.canvas;
        const key = getShaderKey(0,0);
        this.flaskView = new FlaskView(this, 1000, 1000, key);
        this.flaskView.setPosition(canvas.width/2, canvas.height/2 -22);

        tweenAsync(this, {
            targets: this.flaskView,
            duration: 3000,
            x: 540,
            repeat: -1,
            yoyo: true,
            ease: 'Sine.easeInOut'
        }).then();
    }
    
    update() {
        this.flaskView?.updateView();
    }
}

new Phaser.Game(createConfig([SummaryScene, AssetLoader]));