import Phaser from 'phaser';
import {BackgroundContainer} from "./background.ts";
import {MainText} from "./mainText.ts";
import {InputManager} from "./inputManager.ts";
import CustomMultiPipeline from "./customMultiPipeline.ts";
import {GetColorCodeOfWhite} from "./colorUtil.ts";
import {ExButton} from "./exButton.ts";
import {PlaneSceneModel, PlaneShaderExScene, PlaneShaderExSceneData} from "./shaderExSceneBase.ts";

/**
 * テストシーン
 */
export class MainScene extends Phaser.Scene {
    
    public static Key = 'mainScene';
    
    private inputManager?: InputManager;

    private pipeline!: Phaser.Renderer.WebGL.WebGLPipeline;
    private elapsedTimeMsForShader = 0;
    
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
        // add.shaderしたい時のロードの方式
        this.load.glsl('fireball', './src/sampleShaders/shader0.frag');
        this.load.glsl('confusion', './src/sampleShaders/shader1.frag');
        this.load.glsl('dna', './src/sampleShaders/shader2.frag');
        // カスタムパイプラインへのシェーダーの受け渡しは文字列なのでテキストロード(gpt提案だが動いた)
        this.load.text('grayScaleShaderText', './src/sampleShaders/gray.glsl');
        this.load.text('rainbowRotShaderText', './src/sampleShaders/rainbowRot.glsl');
        this.load.text('vertShakeText', './src/sampleShaders/vertShake.glsl');
        // サンプルで画像をロード
        this.load.image('dotpic', './src/assets/dotpic256.png');
        
        //console.log('MainScene preload');
    }
    
    /**
     * ゲームオブジェクト初期化
     */
    create() {
        //console.log('MainScene create');
        
        // シーンへゲームオブジェクト作成してのシェーダー付与
        //const canvasWidth = this.sys.canvas.width;
        //const canvasHeight = this.sys.canvas.height;
        //const sg = this.add.shader('fireball', canvasWidth/2, canvasHeight/2, canvasWidth, canvasHeight);
        
        // こんな感じで描画に対してphysicsを付与できたりもする(が、扱いやすさ的にはイマイチか?)
        const sampleBlock = this.add.shader('confusion', 50, 256 + 128, 100, 100);
        this.physics.add.existing(sampleBlock, false);
        sampleBlock!.body!.velocity.x = 100;
        
        // Imageに対して
        const dotpicImg1 = this.add.image(128, 128, 'dotpic');
        const grayScaleShaderText = this.cache.text.get('grayScaleShaderText');
        const renderer = this.game.renderer as Phaser.Renderer.WebGL.WebGLRenderer;
        renderer.pipelines.remove('gs');
        const gs = renderer.pipelines.add('gs', new CustomMultiPipeline(this.game, grayScaleShaderText));
        dotpicImg1.setPipeline(gs);
        
        const dotpicImg2 = this.add.image(256 + 128, 128, 'dotpic');
        const rainbowRotShaderText = this.cache.text.get('rainbowRotShaderText');
        const vertShakeText = this.cache.text.get('vertShakeText');
        renderer.pipelines.remove('rr');
        this.pipeline = renderer.pipelines.add('rr', new CustomMultiPipeline(this.game, rainbowRotShaderText, vertShakeText));
        dotpicImg2.setPipeline(this.pipeline);
        
        // 入力管理
        this.inputManager = new InputManager(this);
        
        // 背景オブジェクト生成
        new BackgroundContainer(this);
        // テキスト
        new MainText(this, "シェーダー実験場", GetColorCodeOfWhite(), 36);
        
        // 遷移用のボタンを配置
        const beginx = 100;
        const beginy = 520;
        const dy = 60;
        const dx = 120;
        const retsu = 2;
        const gyo = 20;
        for (let j = 0; j < retsu; j++) {
            for (let i = 0; i < gyo; i++) {
                const index = j * gyo + i;
                const num =String(index).padStart(2, "0");
                const msg = "Ex" + num;
                const f = () => {
                    const sceneModel = new PlaneSceneModel();
                    sceneModel.ShaderFilePath = `./src/exShaders/shader${num}.frag`;
                    sceneModel.ShaderKey = `shader${num}`;
                    const sceneData : PlaneShaderExSceneData = {SceneModel: sceneModel};
                    this.scene.start(PlaneShaderExScene.Key, sceneData);
                }
                const b = new ExButton(this, msg, f);
                b.setPosition(beginx + j * dx,beginy + i * dy);
            }
        }
        
        // 即時デバッグ対象シェーダー
        const testShaderNum = 11;
        
        const testFn = () => {
            const num = String(testShaderNum).padStart(2, "0");
            const sceneModel = new PlaneSceneModel();
            sceneModel.ShaderFilePath = `./src/exShaders/shader${num}.frag`;
            sceneModel.ShaderKey = `shader${num}`;
            const sceneData : PlaneShaderExSceneData = {SceneModel: sceneModel}; 
            this.scene.start(PlaneShaderExScene.Key, sceneData);
        }
        const testButton = new ExButton(this, 'test', testFn);
        testButton.setPosition(beginx, beginy - dy);
        
        // 即時表示
        //testFn();
    }
    
    /**
     * 更新
     */
    update(_time: number, _delta: number) {
        
        // 入力制御更新
        this.inputManager?.update();

        // 前のフレームからの経過時間
        const deltaTimeMs = this.game.loop.delta;

        // シェーダーに時間を渡す
        this.elapsedTimeMsForShader += deltaTimeMs * 0.001;
        const period = Math.PI * 1000;
        if (this.elapsedTimeMsForShader > period) this.elapsedTimeMsForShader *= -1;
        this.pipeline.set1f("uuTime", this.elapsedTimeMsForShader, this.pipeline.currentShader);
    }
}

