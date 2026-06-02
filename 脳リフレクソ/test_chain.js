const fs = require('fs');
const path = require('path');

// モック環境の構築
global.window = {};
global.document = {
    readyState: 'complete',
    addEventListener: function() {},
    getElementById: function() {
        return {
            style: {},
            classList: { add: function() {}, remove: function() {} },
            textContent: ''
        };
    }
};
global.showerCanvas = { width: 1000, height: 800 };
global.showerCtx = {
    save: function() {},
    restore: function() {},
    beginPath: function() {},
    arc: function() {},
    fill: function() {},
    stroke: function() {},
    translate: function() {},
    rotate: function() {},
    setLineDash: function() {},
    createRadialGradient: function() {
        return { addColorStop: function() {} };
    }
};

// サウンド・エフェクト関連関数のモック
global.initAudio = function() {};
const popSounds = [];
global.playPopSound = function(combo, x) {
    console.log(`[Sound] playPopSound called - Combo: ${combo}, X: ${x}`);
    popSounds.push({ combo, x });
};
global.playFeverStartSound = function() {};
global.createShowerRipple = function(x, y, r, s, h) {
    console.log(`[Visual] Ripple created at (${x}, ${y}) - Radius: ${r}, Hue: ${h}`);
};
global.createShowerParticles = function(x, y, c, h) {
    console.log(`[Visual] Particles created at (${x}, ${y}) - Count: ${c}`);
};
global.updateRefreshGauge = function() {};
global.showCombo = function(c) {
    console.log(`[UI] showCombo called: ${c}`);
};
global.endGame = function() {
    console.log('[Game] endGame triggered');
};
global.BUBBLE_COLORS = [{ hex: '#81c3d7', hue: 195 }];

// タイマー遅延の計測用配列
const scheduledDelays = [];
const originalSetTimeout = global.setTimeout;
global.setTimeout = function(callback, delay) {
    console.log(`[Timer] setTimeout scheduled with delay: ${delay}ms`);
    scheduledDelays.push(delay);
    callback();
};

// app.js をパースするために読み込む
const appJsPath = path.join(__dirname, 'app.js');
let appJsCode = fs.readFileSync(appJsPath, 'utf8');

// 自動実行を防ぐ
appJsCode = appJsCode.replace(/initApp\(\);/g, '// initApp();');

// 変数宣言を global マップに置換
appJsCode = appJsCode.replace(/let bubbles = \[\];/g, 'global.bubbles = [];');
appJsCode = appJsCode.replace(/let comboCount = 0;/g, 'global.comboCount = 0;');
appJsCode = appJsCode.replace(/let totalPops = 0;/g, 'global.totalPops = 0;');
appJsCode = appJsCode.replace(/let refreshProgress = 0;/g, 'global.refreshProgress = 0;');
appJsCode = appJsCode.replace(/let feverActive = false;/g, 'global.feverActive = false;');
appJsCode = appJsCode.replace(/let gameActive = false;/g, 'global.gameActive = false;');
appJsCode = appJsCode.replace(/let showerCanvas = null;/g, 'global.showerCanvas = null;');
appJsCode = appJsCode.replace(/const BUBBLE_COLORS =/g, 'global.BUBBLE_COLORS =');
appJsCode = appJsCode.replace(/document\./g, 'global.document.');

// app.js の実行
eval(appJsCode);

// テスト変数の初期化
global.gameActive = true;
global.feverActive = true;
global.bubbles = [];
global.comboCount = 0;
global.totalPops = 0;
global.refreshProgress = 0;
global.showerCanvas = { width: 1000, height: 800 };

console.log('--- 金色連鎖バブル（ドミノ破裂・1個制限）テスト開始 ---');
try {
    // 1. 金色連鎖バブルの出現数制限テスト
    console.log('連鎖バブルが既に画面にある場合のスポーン制限をテストします...');
    const originalRandom = Math.random;
    Math.random = () => 0.1; // 本来はchainバブルが生成される条件
    
    // 画面に chain バブルを追加
    global.bubbles.push({
        type: 'chain',
        x: 100,
        y: 100,
        radius: 25,
        popping: false
    });
    
    // スポーンを試みる
    createBubble();
    
    // 生成されたバブル（インデックス1）のタイプが normal に制限されているか検証
    const nextSpawned = global.bubbles[1];
    if (nextSpawned && nextSpawned.type === 'normal') {
        console.log(`成功: 画面に既に連鎖バブルがあるため、通常バブルが生成されました (タイプ: ${nextSpawned.type})`);
    } else {
        throw new Error('バブル出現数の制限が機能していません。生成されたタイプ: ' + (nextSpawned ? nextSpawned.type : 'なし'));
    }
    
    Math.random = originalRandom;

    // 2. ドミノ倒し（1個ずつ順次）破裂テスト
    console.log('ドミノ倒し（シーケンシャルなディレイ時間）をテストします...');
    global.bubbles = [];
    popSounds.length = 0;
    scheduledDelays.length = 0;

    // 親バブル (500, 400)
    const parentChain = {
        type: 'chain',
        x: 500,
        y: 400,
        radius: 30,
        hue: 45,
        popping: false,
        popTriggered: false
    };
    global.bubbles.push(parentChain);
    
    // 泡A (距離 100px)
    const bubbleA = {
        type: 'normal',
        x: 500,
        y: 500,
        radius: 25,
        hue: 195,
        popping: false,
        popTriggered: false
    };
    global.bubbles.push(bubbleA);

    // 泡B (距離 200px)
    const bubbleB = {
        type: 'normal',
        x: 500,
        y: 600,
        radius: 25,
        hue: 195,
        popping: false,
        popTriggered: false
    };
    global.bubbles.push(bubbleB);
    
    // 連鎖の実行
    triggerChainReaction(parentChain);
    
    // ディレイの順序アサーション
    if (scheduledDelays.length !== 2) {
        throw new Error(`ディレイのスケジュール数が正しくありません。期待値: 2, 実際: ${scheduledDelays.length}`);
    }
    
    // 近い方（bubbleA = 100px）が先にスケジュールされ、遅延は 90ms と 180ms であるべき
    console.log('スケジュールされたディレイ時間:', scheduledDelays);
    if (scheduledDelays[0] !== 90 || scheduledDelays[1] !== 180) {
        throw new Error('ドミノの破裂ディレイ（90ms間隔）が正しく設定されていません。');
    }
    console.log('成功: ドミノのように1個ずつ (90ms, 180ms) 順次破裂するスケジュールが確認されました。');
    
    global.setTimeout = originalSetTimeout;
    
    console.log('--- 全てのテストに成功しました ---');
    process.exit(0);
} catch (error) {
    console.error('テスト失敗:', error);
    process.exit(1);
}
