const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'app.js');
let content = fs.readFileSync(targetFile, 'utf8');

// ヘルパー：指定した開始文字列と終了文字列の間を置換する
function replaceBetween(src, startStr, endStr, replacement) {
    const startIndex = src.indexOf(startStr);
    if (startIndex === -1) {
        throw new Error(`Start pattern not found: "${startStr}"`);
    }
    
    const endIndex = src.indexOf(endStr, startIndex + startStr.length);
    if (endIndex === -1) {
        throw new Error(`End pattern not found: "${endStr}"`);
    }
    
    return src.substring(0, startIndex) + replacement + src.substring(endIndex);
}

try {
    // 1. updateBubbles の gameActive 制限の解除（スポーン部分のみに制限）
    const startBubbles = "function updateBubbles(timestamp) {";
    const endBubbles = "    // 各泡の更新";
    const replacementBubbles = `function updateBubbles(timestamp) {
    // 新しい泡のスポーン（ゲームが進行中のみ）
    if (gameActive) {
        // フィーバー終了チェック
        if (feverActive && performance.now() > feverEndTime) {
            feverActive = false;
        }
        
        const limit = feverActive ? 60 : MAX_BUBBLES;
        const spawnMin = feverActive ? 250 : BUBBLE_SPAWN_MIN;
        const spawnMax = feverActive ? 550 : BUBBLE_SPAWN_MAX;
        
        if (timestamp >= nextSpawnTime && bubbles.length < limit) {
            createBubble();
            nextSpawnTime = timestamp + spawnMin + Math.random() * (spawnMax - spawnMin);
        }
    }
    
`;
    content = replaceBetween(content, startBubbles, endBubbles, replacementBubbles);

    // 2. updateMeteors の gameActive 制限の解除（既存の流星は消滅まで動かす）
    const startMeteors = "function updateMeteors() {";
    const endMeteors = "    for (let i = meteors.length - 1; i >= 0; i--) {";
    const replacementMeteors = `function updateMeteors() {
    // 既存 of 流星はゲーム終了後も画面外に消えるまで更新を続ける
    
`;
    content = replaceBetween(content, startMeteors, endMeteors, replacementMeteors);

    // 3. triggerMeteorBigExplosion 内の setTimeout 内の gameActive ガードを削除
    const startBigExplosion = "function triggerMeteorBigExplosion(originX, originY) {";
    const endBigExplosion = "// 爆発点から流星群を放出するヘルパー関数";
    const replacementBigExplosion = `function triggerMeteorBigExplosion(originX, originY) {
    // 最初の爆発音
    playMeteorBigExplosionSound(originX);
    
    const x = (originX !== undefined) ? originX : (showerCanvas ? showerCanvas.width / 2 : 0);
    const y = (originY !== undefined) ? originY : (showerCanvas ? showerCanvas.height / 2 : 0);
    
    // 1. メインの巨大大輪花火 (レッドとブルーを主体にし、シルバーを削減)
    createShowerParticles(x, y, 20, 210, true); // シルバー (40 -> 20に減量)
    createShowerParticles(x, y, 50, 349, true); // レッド (30 -> 50に大幅増量)
    createShowerRipple(x, y, 270, 3.2, 349); // 特大波紋をシルバーからレッド(349)に変更
    launchExplosionMeteors(x, y, 50, 60); // 50本の流星
    
    // 2. クライマックスの多重連鎖爆発 (時間差で色彩豊かな大輪が重なり合う)
    
    // 子爆発1: 0.12秒後 (左上にずれた青・紫の花火)
    setTimeout(() => {
        const cx = x - 130 + (Math.random() - 0.5) * 60;
        const cy = y - 90 + (Math.random() - 0.5) * 60;
        playFeverStartSound(cx); // チャイムスイープ音
        createShowerParticles(cx, cy, 20, 262, true); // 紫 (25 -> 20に減量)
        createShowerParticles(cx, cy, 35, 213, true); // 青 (20 -> 35に増量)
        createShowerRipple(cx, cy, 180, 3.8, 213); // 波紋を青(213)に変更
        launchExplosionMeteors(cx, cy, 25, 45);
    }, 120);
    
    // 子爆発2: 0.26秒後 (右上にずれた青・緑の花火)
    setTimeout(() => {
        const cx = x + 140 + (Math.random() - 0.5) * 60;
        const cy = y - 80 + (Math.random() - 0.5) * 60;
        playFeverStartSound(cx);
        createShowerParticles(cx, cy, 20, 148, true); // 緑 (25 -> 20に減量)
        createShowerParticles(cx, cy, 35, 213, true); // 青 (20 -> 35に増量)
        createShowerRipple(cx, cy, 180, 3.8, 213); // 波紋を青(213)に変更
        launchExplosionMeteors(cx, cy, 25, 45);
    }, 260);
    
    // 子爆発3: 0.40秒後 (少し下にずれた赤・紫の花火)
    setTimeout(() => {
        const cx = x - 40 + (Math.random() - 0.5) * 60;
        const cy = y + 100 + (Math.random() - 0.5) * 50;
        playFeverStartSound(cx);
        createShowerParticles(cx, cy, 35, 349, true); // 赤 (25 -> 35に増量)
        createShowerParticles(cx, cy, 20, 262, true); // 紫 (20枚維持)
        createShowerRipple(cx, cy, 190, 4.0, 349); // 波紋は赤(349)
        launchExplosionMeteors(cx, cy, 25, 45);
    }, 400);
    
    // 子爆発4: 0.52秒後 (右下にずれた青・シルバーの花火)
    setTimeout(() => {
        const cx = x + 110 + (Math.random() - 0.5) * 60;
        const cy = y + 80 + (Math.random() - 0.5) * 50;
        playFeverStartSound(cx);
        createShowerParticles(cx, cy, 10, 210, true); // シルバー (25 -> 10に大幅減量)
        createShowerParticles(cx, cy, 20, 213, true); // 青 (20本追加)
        createShowerParticles(cx, cy, 15, 148, true); // 緑 (20 -> 15に減量)
        createShowerRipple(cx, cy, 160, 4.0, 213); // 波紋を青(213)に変更
        launchExplosionMeteors(cx, cy, 20, 40);
    }, 520);
    
    // 最終フィナーレ特大花火: 0.68秒後 (中央上空のマルチカラー錦冠花火 ＋ 再度の大爆発音！)
    setTimeout(() => {
        const cx = x + (Math.random() - 0.5) * 40;
        const cy = y - 120 + (Math.random() - 0.5) * 40;
        playMeteorBigExplosionSound(cx); // 2回目の大爆発音でクライマックスの轟音を再現！
        createShowerParticles(cx, cy, 100, 'multi', true); // 豪華マルチカラー星屑 (重み付け適用で赤・青増量)
        createShowerRipple(cx, cy, 310, 4.5, 213); // 特大の波紋をシルバーからブルー(213)に変更してシルバーの支配度を低下
        createShowerRipple(cx, cy, 225, 5.2, 262); // 中サイズ波紋: 紫
        createShowerRipple(cx, cy, 170, 6.0, 210); // 小サイズ波紋をシルバー(210)に設定
        launchExplosionMeteors(cx, cy, 50, 70); // 最後の錦冠の火花
    }, 680);
}

`;
    content = replaceBetween(content, startBigExplosion, endBigExplosion, replacementBigExplosion);

    // 4. launchExplosionMeteors 内の setTimeout 内の gameActive ガードを削除
    const startLaunchExplosion = "function launchExplosionMeteors(cx, cy, count, duration) {";
    const endLaunchExplosion = "function createBigExplosionMeteor(hue, originX, originY) {";
    const replacementLaunchExplosion = `function launchExplosionMeteors(cx, cy, count, duration) {
    // 指定5色（シルバー: 210, 紫: 262, 青: 213, 緑: 148, 赤: 349）からシルバーを減らし、レッド・ブルーを増量した配色
    const colors = [210, 262, 262, 213, 213, 213, 148, 148, 349, 349, 349];
    for (let i = 0; i < count; i++) {
        const delayTime = (i / count) * duration + Math.random() * 4;
        setTimeout(() => {
            createBigExplosionMeteor(colors[i % colors.length], cx, cy);
        }, delayTime);
    }
}

`;
    content = replaceBetween(content, startLaunchExplosion, endLaunchExplosion, replacementLaunchExplosion);

    fs.writeFileSync(targetFile, content, 'utf8');
    console.log("Success: app.js has been updated to keep animation moving during clear!");
} catch (e) {
    console.error("Error during replacement:", e.message);
    process.exit(1);
}
