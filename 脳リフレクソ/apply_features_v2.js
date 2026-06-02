const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app.js');
let content = fs.readFileSync(filePath, 'utf8');

// 4. createBubble の完全な差し替え
const startBubbleKey = 'function createBubble() {';
const endBubbleKey = 'function updateBubbles(timestamp) {';
const idxBubbleStart = content.indexOf(startBubbleKey);
const idxBubbleEnd = content.indexOf(endBubbleKey);

if (idxBubbleStart !== -1 && idxBubbleEnd !== -1) {
    const newBubbleCode = `function createBubble() {
    // フィーバー中は上限を60個まで拡大、通常時は MAX_BUBBLES (28)
    const limit = feverActive ? 60 : MAX_BUBBLES;
    if (!showerCanvas || bubbles.length >= limit) return;
    
    const colorInfo = BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)];
    let radius = 22 + Math.random() * 22; // 22〜44px
    
    // 泡の種類決定（通常時のみ特殊泡が発生する）
    let type = 'normal';
    if (!feverActive) {
        const rand = Math.random();
        if (rand < 0.035) {
            type = 'golden'; // 3.5%の確率でゴールデン泡
            radius *= 1.25; // ゴールデン泡は少し大きめに
        } else if (rand < 0.065) {
            type = 'star'; // 3%の確率で流れ星の泡
        }
    }
    
    if (type === 'star') {
        // 流れ星の泡は画面中央付近の高さから、左右の画面外から水平に高速移動する
        const fromLeft = Math.random() > 0.5;
        const x = fromLeft ? -radius - 10 : showerCanvas.width + radius + 10;
        const y = Math.random() * (showerCanvas.height * 0.5) + showerCanvas.height * 0.15; // 画面上部〜中部の高さ
        const vx = fromLeft ? (3.5 + Math.random() * 3.5) : -(3.5 + Math.random() * 3.5);
        const vy = (Math.random() - 0.5) * 0.8; // わずかな縦揺れ
        
        bubbles.push({
            type: type,
            x: x,
            y: y,
            radius: radius * 0.85, // 流れ星は少し小さく引き締まったサイズ
            color: '#ffffff',
            hue: 195, // 水色の星 of トレイル
            vx: vx,
            vy: vy,
            swayAmplitude: 0, // Swayはなし
            swaySpeed: 0,
            swayOffset: 0,
            alpha: 0.85 + Math.random() * 0.15,
            time: 0,
            popping: false,
            popFrame: 0,
            popMaxFrames: 18,
            popScale: 1,
            popTriggered: false
        });
    } else {
        // 通常泡 ＆ ゴールデン泡
        bubbles.push({
            type: type,
            x: radius + Math.random() * (showerCanvas.width - radius * 2),
            y: showerCanvas.height + radius + Math.random() * 40,
            radius: radius,
            color: type === 'golden' ? '#ffd700' : colorInfo.hex,
            hue: type === 'golden' ? 45 : colorInfo.hue,
            vx: 0,
            vy: type === 'golden' ? -(0.25 + Math.random() * 0.35) : -(0.3 + Math.random() * 0.5), // ゴールデンは少しゆったり上昇
            swayAmplitude: 0.3 + Math.random() * 0.5,
            swaySpeed: 0.008 + Math.random() * 0.02,
            swayOffset: Math.random() * Math.PI * 2,
            alpha: type === 'golden' ? 0.85 : 0.65 + Math.random() * 0.2,
            time: 0,
            popping: false,
            popFrame: 0,
            popMaxFrames: 18,
            popScale: 1,
            popTriggered: false
        });
    }
}

`;
    content = content.substring(0, idxBubbleStart) + newBubbleCode + content.substring(idxBubbleEnd);
    console.log('4. createBubble updated.');
} else {
    console.warn('4. createBubble targets not found!');
}

// 6. tryPopBubble の差し替え
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
            
            // 特殊泡またはフィーバーに応じた効果音再生
            if (b.type === 'golden') {
                // フィーバー開始
                feverActive = true;
                feverEndTime = now + 4000; // 4秒間
                playFeverStartSound(b.x);
                createShowerRipple(b.x, b.y, 200, 3.2, 45); // 特大の金色波紋
            } else if (b.type === 'star') {
                // 流れ星泡ポップ
                playStarSound(b.x);
                totalPops += 7; // 通常のタップ分の1回と合わせて計+8カウントにする
            } else {
                // 通常ポップ
                playPopSound(comboCount, b.x); // X座標を渡す
                
                // フィーバー中ならさらに追加のチャイム音をバックに薄く重ねる
                if (feverActive) {
                    playFeverChimeBackground(b.x);
                }
            }
            
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
    console.log('6. tryPopBubble updated.');
} else {
    console.warn('6. tryPopBubble targets not found!');
}

// 7. drawBubbles の差し替え
const startDrawBubblesKey = 'function drawBubbles() {';
const idxDrawBubblesStart = content.indexOf(startDrawBubblesKey);
const nextSectionIndex = content.indexOf('// =============================================================', idxDrawBubblesStart !== -1 ? idxDrawBubblesStart : 0);

if (idxDrawBubblesStart !== -1 && nextSectionIndex !== -1) {
    const newDrawBubblesCode = `function drawBubbles() {
    if (!showerCtx) return;
    
    bubbles.forEach(b => {
        const drawRadius = b.radius * b.popScale;
        if (drawRadius <= 0.5) return;
        
        showerCtx.save();
        
        // ポップ中はフェードアウト
        const alphaMultiplier = b.popping ? Math.max(0, b.popScale) : 1;
        showerCtx.globalAlpha = b.alpha * alphaMultiplier;
        
        if (b.type === 'golden') {
            // ゴールデン泡の外光（金色の輝き）
            const glowGrad = showerCtx.createRadialGradient(
                b.x, b.y, drawRadius * 0.5,
                b.x, b.y, drawRadius * 2.0
            );
            glowGrad.addColorStop(0, 'rgba(255, 215, 0, 0.25)');
            glowGrad.addColorStop(1, 'rgba(255, 215, 0, 0)');
            showerCtx.fillStyle = glowGrad;
            showerCtx.beginPath();
            showerCtx.arc(b.x, b.y, drawRadius * 2.0, 0, Math.PI * 2);
            showerCtx.fill();
            
            // メインの金色の球体
            const bodyGrad = showerCtx.createRadialGradient(
                b.x - drawRadius * 0.2, b.y - drawRadius * 0.2, drawRadius * 0.08,
                b.x, b.y, drawRadius
            );
            bodyGrad.addColorStop(0, '#ffffff');
            bodyGrad.addColorStop(0.35, '#ffe57f');
            bodyGrad.addColorStop(0.8, '#ffd700');
            bodyGrad.addColorStop(1, '#ffb300');
            showerCtx.fillStyle = bodyGrad;
            showerCtx.beginPath();
            showerCtx.arc(b.x, b.y, drawRadius, 0, Math.PI * 2);
            showerCtx.fill();
            
            // 金色の輪郭
            showerCtx.strokeStyle = 'rgba(255, 235, 120, 0.45)';
            showerCtx.lineWidth = 1.2;
            showerCtx.beginPath();
            showerCtx.arc(b.x, b.y, drawRadius - 0.5, 0, Math.PI * 2);
            showerCtx.stroke();
        } else if (b.type === 'star') {
            // 流れ星の尾（彗星のトレイル）を移動方向と逆向きに描画
            if (b.vx !== 0) {
                const tailLen = drawRadius * 2.5;
                const tailX = b.x - (b.vx > 0 ? 1 : -1) * tailLen;
                const tailGrad = showerCtx.createLinearGradient(b.x, b.y, tailX, b.y);
                tailGrad.addColorStop(0, 'rgba(255, 255, 255, 0.65)');
                tailGrad.addColorStop(0.3, \`hsla(\${b.hue}, 90%, 82%, 0.45)\`);
                tailGrad.addColorStop(1, \`hsla(\${b.hue}, 90%, 50%, 0)\`);
                
                showerCtx.strokeStyle = tailGrad;
                showerCtx.lineWidth = drawRadius * 0.6;
                showerCtx.lineCap = 'round';
                showerCtx.beginPath();
                showerCtx.moveTo(b.x, b.y);
                showerCtx.lineTo(tailX, b.y);
                showerCtx.stroke();
            }
            
            // 流れ星本体（非常に透き通った白い光球）
            const bodyGrad = showerCtx.createRadialGradient(
                b.x, b.y, 0,
                b.x, b.y, drawRadius
            );
            bodyGrad.addColorStop(0, '#ffffff');
            bodyGrad.addColorStop(0.4, 'rgba(235, 250, 255, 0.7)');
            bodyGrad.addColorStop(1, 'rgba(180, 230, 255, 0.15)');
            showerCtx.fillStyle = bodyGrad;
            showerCtx.beginPath();
            showerCtx.arc(b.x, b.y, drawRadius, 0, Math.PI * 2);
            showerCtx.fill();
            
            // 星のハイライト（十字）
            showerCtx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
            showerCtx.lineWidth = 1.5;
            showerCtx.beginPath();
            showerCtx.moveTo(b.x - drawRadius * 0.75, b.y);
            showerCtx.lineTo(b.x + drawRadius * 0.75, b.y);
            showerCtx.moveTo(b.x, b.y - drawRadius * 0.75);
            showerCtx.lineTo(b.x, b.y + drawRadius * 0.75);
            showerCtx.stroke();
        } else {
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
        }
        
        showerCtx.restore();
    });
}

`;
    content = content.substring(0, idxDrawBubblesStart) + newDrawBubblesCode + content.substring(nextSectionIndex);
    console.log('7. drawBubbles updated.');
} else {
    console.warn('7. drawBubbles targets not found!');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('All modifications applied successfully.');
