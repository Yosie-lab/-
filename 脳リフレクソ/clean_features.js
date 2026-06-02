const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app.js');
let content = fs.readFileSync(filePath, 'utf8');

// 1. グローバル変数の削除
const feverGlobals = `// フィーバータイム管理用
let feverActive = false;
let feverEndTime = 0;
let feverHueOffset = 0;`;

if (content.includes(feverGlobals)) {
    content = content.replace(feverGlobals, '');
    console.log('1. Fever globals removed.');
} else {
    // 予期せぬ空白等がある場合のために代替の簡単な置換
    content = content.replace(/let feverActive = false;\s*let feverEndTime = 0;\s*let feverHueOffset = 0;/, '');
    console.log('1. Fever globals removed (alt).');
}

// 3. playFeverChimeBackground, playStarSound, playFeverStartSound の削除
const startSoundFunctionsKey = 'function playFeverChimeBackground(originX) {';
const endSoundFunctionsKey = 'function playClearSound() {';

const idxStart = content.indexOf(startSoundFunctionsKey);
const idxEnd = content.indexOf(endSoundFunctionsKey);

if (idxStart !== -1 && idxEnd !== -1) {
    content = content.substring(0, idxStart) + content.substring(idxEnd);
    console.log('3. Fever & Star sound functions removed.');
} else {
    console.warn('3. Fever & Star sound functions not found!');
}

// 4. createBubble の完全な復元
const startBubbleKey = 'function createBubble() {';
const endBubbleKey = 'function updateBubbles(timestamp) {';
const idxBubbleStart = content.indexOf(startBubbleKey);
const idxBubbleEnd = content.indexOf(endBubbleKey);

if (idxBubbleStart !== -1 && idxBubbleEnd !== -1) {
    const oldBubbleCode = `function createBubble() {
    if (!showerCanvas || bubbles.length >= MAX_BUBBLES) return;
    
    const colorInfo = BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)];
    const radius = 22 + Math.random() * 22; // 22〜44px
    
    bubbles.push({
        x: radius + Math.random() * (showerCanvas.width - radius * 2),
        y: showerCanvas.height + radius + Math.random() * 40, // 画面下端から出現
        radius: radius,
        color: colorInfo.hex,
        hue: colorInfo.hue,
        vy: -(0.3 + Math.random() * 0.5), // 上昇速度
        swayAmplitude: 0.3 + Math.random() * 0.5,
        swaySpeed: 0.008 + Math.random() * 0.02,
        swayOffset: Math.random() * Math.PI * 2,
        alpha: 0.65 + Math.random() * 0.2,
        time: 0,
        // ポップアニメーション用
        popping: false,
        popFrame: 0,
        popMaxFrames: 18,
        popScale: 1,
        popTriggered: false
    });
}

`;
    content = content.substring(0, idxBubbleStart) + oldBubbleCode + content.substring(idxBubbleEnd);
    console.log('4. createBubble restored to simple version.');
} else {
    console.warn('4. createBubble targets not found!');
}

// 5. updateBubbles の完全な復元
const startUpdateKey = 'function updateBubbles(timestamp) {';
const endUpdateKey = 'function drawBubbles() {';
const idxUpdateStart = content.indexOf(startUpdateKey);
const idxUpdateEnd = content.indexOf(endUpdateKey);

if (idxUpdateStart !== -1 && idxUpdateEnd !== -1) {
    const oldUpdateCode = `function updateBubbles(timestamp) {
    if (!gameActive) return;
    
    // 新しい泡のスポーン
    if (timestamp >= nextSpawnTime && bubbles.length < MAX_BUBBLES) {
        createBubble();
        nextSpawnTime = timestamp + BUBBLE_SPAWN_MIN + Math.random() * (BUBBLE_SPAWN_MAX - BUBBLE_SPAWN_MIN);
    }
    
    // 各泡の更新
    for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        
        if (b.popping) {
            // ポップアニメーション
            b.popFrame++;
            const progress = b.popFrame / b.popMaxFrames;
            
            // スケール: 膨張 -> 収縮
            if (progress < 0.25) {
                b.popScale = 1 + 0.35 * (progress / 0.25);
            } else {
                b.popScale = 1.35 * (1 - ((progress - 0.25) / 0.75));
            }
            
            // ピーク時に波紋と粒子を発生
            if (!b.popTriggered && progress >= 0.25) {
                b.popTriggered = true;
                
                // コマンドに応じた波紋サイズと粒子数
                const rippleSize = 80 + Math.min(comboCount, 12) * 18;
                const particleCount = 10 + Math.min(comboCount, 12) * 4;
                const rippleSpeed = 2.5 + Math.min(comboCount, 12) * 0.25;
                
                createShowerRipple(b.x, b.y, rippleSize, rippleSpeed, b.hue);
                createShowerParticles(b.x, b.y, particleCount, b.hue);
            }
            
            // アニメーション完了で削除
            if (b.popFrame >= b.popMaxFrames) {
                bubbles.splice(i, 1);
                continue;
            }
        } else {
            // 通常の浮遊更新
            b.time++;
            b.y += b.vy;
            b.x += Math.sin(b.time * b.swaySpeed + b.swayOffset) * b.swayAmplitude;
            
            // 画面端で折り返し
            if (b.x - b.radius < 0) {
                b.x = b.radius;
            }
            if (showerCanvas && b.x + b.radius > showerCanvas.width) {
                b.x = showerCanvas.width - b.radius;
            }
            
            // 画面の上に抜けたら削除
            if (b.y + b.radius < -30) {
                bubbles.splice(i, 1);
            }
        }
    }
}

`;
    content = content.substring(0, idxUpdateStart) + oldUpdateCode + content.substring(idxUpdateEnd);
    console.log('5. updateBubbles restored to simple version.');
} else {
    console.warn('5. updateBubbles targets not found!');
}

// 6. tryPopBubble の復元（1の即興演奏は維持）
const startTryPopKey = 'function tryPopBubble(clientX, clientY) {';
const endTryPopKey = '            if (popColorHistory.length === 10) {';
const idxTryPopStart = content.indexOf(startTryPopKey);
const idxTryPopEnd = content.indexOf(endTryPopKey);

if (idxTryPopStart !== -1 && idxTryPopEnd !== -1) {
    const newTryPopCode = `function tryPopBubble(clientX, clientY) {
    if (!gameActive) return false;
    
    // 手前（後から描画された）泡から判定
    for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        if (b.popping) continue;
        
        const dx = clientX - b.x;
        const dy = clientY - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // 半径の1.2倍を判定範囲にして触りやすく
        if (dist <= b.radius * 1.2) {
            b.popping = true;
            
            // コンボ管理
            const now = performance.now();
            if (now - lastPopTime < COMBO_WINDOW) {
                comboCount++;
            } else {
                comboCount = 1;
            }
            lastPopTime = now;
            
            // ポップ音の再生（ピチョン音 ＋ プチッ音）に X 座標を引き渡す
            playPopSound(comboCount, b.x);
            
            // 同色3連続タップの判定
            tappedColorHistory.push(b.color);
            if (tappedColorHistory.length > 3) {
                tappedColorHistory.shift();
            }
            if (tappedColorHistory.length === 3 &&
                tappedColorHistory[0] === tappedColorHistory[1] &&
                tappedColorHistory[1] === tappedColorHistory[2]) {
                triggerMeteorShower(b.x, b.y);
                tappedColorHistory = []; // トリガー後の履歴をリセット
            }
            
            // 大爆発判定用の履歴管理 (直近10タップ分)
            popColorHistory.push(b.color);
            if (popColorHistory.length > 10) {
                popColorHistory.shift();
            }
            
`;
    content = content.substring(0, idxTryPopStart) + newTryPopCode + content.substring(idxTryPopEnd);
    console.log('6. tryPopBubble restored to simple pop sound with X coordinate.');
} else {
    console.warn('6. tryPopBubble targets not found!');
}

// 7. drawBubbles の完全な復元
const startDrawBubblesKey = 'function drawBubbles() {';
const nextSectionIndex = content.indexOf('// =============================================================', content.indexOf(startDrawBubblesKey));

if (content.indexOf(startDrawBubblesKey) !== -1 && nextSectionIndex !== -1) {
    const oldDrawBubblesCode = `function drawBubbles() {
    if (!showerCtx) return;
    
    bubbles.forEach(b => {
        const drawRadius = b.radius * b.popScale;
        if (drawRadius <= 0.5) return;
        
        showerCtx.save();
        
        // ポップ中はフェードアウト
        const alphaMultiplier = b.popping ? Math.max(0, b.popScale) : 1;
        showerCtx.globalAlpha = b.alpha * alphaMultiplier;
        
        // 通常の泡の外光（ぼんやり光る後光）
        const glowGrad = showerCtx.createRadialGradient(
            b.x, b.y, drawRadius * 0.5,
            b.x, b.y, drawRadius * 1.8
        );
        glowGrad.addColorStop(0, \`hsla(\${b.hue}, 70%, 75%, 0.12)\`);
        glowGrad.addColorStop(1, \`hsla(\${b.hue}, 70%, 75%, 0)\`);
        showerCtx.fillStyle = glowGrad;
        showerCtx.beginPath();
        showerCtx.arc(b.x, b.y, drawRadius * 1.8, 0, Math.PI * 2);
        showerCtx.fill();
        
        // メインの泡本体
        const bodyGrad = showerCtx.createRadialGradient(
            b.x - drawRadius * 0.2, b.y - drawRadius * 0.2, drawRadius * 0.08,
            b.x, b.y, drawRadius
        );
        bodyGrad.addColorStop(0, \`hsla(\${b.hue}, 80%, 88%, 0.9)\`);
        bodyGrad.addColorStop(0.4, \`hsla(\${b.hue}, 70%, 72%, 0.55)\`);
        bodyGrad.addColorStop(0.85, \`hsla(\${b.hue}, 60%, 58%, 0.2)\`);
        bodyGrad.addColorStop(1, \`hsla(\${b.hue}, 50%, 50%, 0.08)\`);
        showerCtx.fillStyle = bodyGrad;
        showerCtx.beginPath();
        showerCtx.arc(b.x, b.y, drawRadius, 0, Math.PI * 2);
        showerCtx.fill();
        
        // 縁のリング
        showerCtx.strokeStyle = \`hsla(\${b.hue}, 65%, 82%, 0.25)\`;
        showerCtx.lineWidth = 1;
        showerCtx.beginPath();
        showerCtx.arc(b.x, b.y, drawRadius - 0.8, 0, Math.PI * 2);
        showerCtx.stroke();
        
        // ハイライト
        const hlX = b.x - drawRadius * 0.3;
        const hlY = b.y - drawRadius * 0.3;
        const hlR = drawRadius * 0.22;
        const hlGrad = showerCtx.createRadialGradient(hlX, hlY, 0, hlX, hlY, hlR);
        hlGrad.addColorStop(0, 'rgba(255, 255, 255, 0.75)');
        hlGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        showerCtx.fillStyle = hlGrad;
        showerCtx.beginPath();
        showerCtx.arc(hlX, hlY, hlR, 0, Math.PI * 2);
        showerCtx.fill();
        
        showerCtx.restore();
    });
}

`;
    content = content.substring(0, content.indexOf(startDrawBubblesKey)) + oldDrawBubblesCode + content.substring(nextSectionIndex);
    console.log('7. drawBubbles restored to simple version.');
} else {
    console.warn('7. drawBubbles targets not found!');
}

// 8. drawShower 内のオーロラ背景演出の削除
// オーロラ背景追加部分を探して削除
const startAurora = '    // フィーバータイム中のオーロラ背景演出';
const endAurora = '        showerCtx.restore();\n    }';

const idxAuroraStart = content.indexOf(startAurora);
const idxAuroraEnd = content.indexOf(endAurora, idxAuroraStart);

if (idxAuroraStart !== -1 && idxAuroraEnd !== -1) {
    const endOffset = idxAuroraEnd + endAurora.length;
    content = content.substring(0, idxAuroraStart) + content.substring(endOffset);
    console.log('8. Aurora background effect removed.');
} else {
    console.warn('8. Aurora background target not found!');
}

// 9. startGame のフィーバーリセット削除
const feverResets = '\n    feverActive = false;\n    feverEndTime = 0;\n    feverHueOffset = 0;';
if (content.includes(feverResets)) {
    content = content.replace(feverResets, '');
    console.log('9. startGame fever resets removed.');
} else {
    console.warn('9. startGame fever resets not found!');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Finished clean_features.js');
