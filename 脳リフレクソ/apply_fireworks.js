const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app.js');
let content = fs.readFileSync(filePath, 'utf8');

// 1. createShowerParticles 関数の置き換え
const particlesStart = 'function createShowerParticles(x, y, count, hueBase) {';
const particlesEnd = 'function createShowerRipple(x, y, maxR, speed, hue) {';

const idxPartStart = content.indexOf(particlesStart);
const idxPartEnd = content.indexOf(particlesEnd);

if (idxPartStart !== -1 && idxPartEnd !== -1) {
    const newParticlesCode = `function createShowerParticles(x, y, count, hueBase, isSpecialEvent = false) {
    for (let i = 0; i < count; i++) {
        let particleHue = (hueBase !== undefined && hueBase !== null)
            ? hueBase
            : (showerHue + 0.4) % 360;
        // 色相のわずかなゆらぎ
        particleHue = (particleHue + (Math.random() - 0.5) * 12) % 360;
        
        // 特殊イベント時は初速を大きく
        const speedScale = isSpecialEvent ? (1.5 + Math.random() * 4.5) : (0.6 + Math.random() * 1.8);
        const angle = Math.random() * Math.PI * 2;
        const vx = Math.cos(angle) * speedScale;
        const vy = Math.sin(angle) * speedScale - (isSpecialEvent ? 0.3 : 0.1);
        
        // 特殊イベント（大爆発・流れ星）時のみ十字星（sparkle）やリング（ring）を混ぜる
        let pType = 'circle';
        if (isSpecialEvent) {
            const rand = Math.random();
            pType = rand < 0.45 ? 'circle' : (rand < 0.85 ? 'sparkle' : 'ring');
        }
        
        showerParticles.push({
            x: x,
            y: y,
            vx: vx,
            vy: vy,
            size: Math.random() * (isSpecialEvent ? 3.8 : 2.5) + 1.2,
            maxLife: Math.random() * (isSpecialEvent ? 50 : 35) + (isSpecialEvent ? 30 : 15),
            life: 0,
            hue: particleHue,
            alpha: 0.95,
            type: pType,
            angle: Math.random() * Math.PI * 2,
            spin: (Math.random() - 0.5) * 0.1,
            gravity: isSpecialEvent ? 0.03 : 0.01,
            friction: isSpecialEvent ? 0.95 : 0.965 // 空気抵抗
        });
    }
}

`;
    content = content.substring(0, idxPartStart) + newParticlesCode + content.substring(idxPartEnd);
    console.log('1. createShowerParticles updated with physics and event variations.');
} else {
    console.warn('1. createShowerParticles targets not found!');
}

// 2. updateShower の粒子更新ループ置き換え
const updateStart = '    for (let i = showerParticles.length - 1; i >= 0; i--) {\n        const p = showerParticles[i];\n        p.life++;\n        p.x += p.vx;\n        p.y += p.vy;\n        \n        p.vx *= 0.985;\n        p.vy *= 0.985;\n        p.alpha = 0.9 * (1.0 - (p.life / p.maxLife));';
const updateEnd = '        if (p.life >= p.maxLife) {\n            showerParticles.splice(i, 1);\n        }\n    }';

const idxUpdateStart = content.indexOf(updateStart);
const idxUpdateEnd = content.indexOf(updateEnd);

if (idxUpdateStart !== -1 && idxUpdateEnd !== -1) {
    const endOffset = idxUpdateEnd + updateEnd.length;
    const newUpdateCode = `    for (let i = showerParticles.length - 1; i >= 0; i--) {
        const p = showerParticles[i];
        p.life++;
        
        // 物理演算（摩擦と重力を適用）
        p.vx *= (p.friction || 0.965);
        p.vy *= (p.friction || 0.965);
        p.vy += (p.gravity || 0.01); // 重力でゆっくり降下
        
        // 微細な気流揺らぎ（Sway）のシミュレーション
        p.vx += Math.sin(p.life * 0.08) * 0.02;
        
        p.x += p.vx;
        p.y += p.vy;
        
        // スピン回転
        if (p.angle !== undefined && p.spin !== undefined) {
            p.angle += p.spin;
        }
        
        // フェードアウトアルファ
        p.alpha = 0.95 * (1.0 - (p.life / p.maxLife));
        
        if (p.life >= p.maxLife) {
            showerParticles.splice(i, 1);
        }
    }`;
    content = content.substring(0, idxUpdateStart) + newUpdateCode + content.substring(endOffset);
    console.log('2. updateShower particle physics updated.');
} else {
    console.warn('2. updateShower particle physics targets not found!');
}

// 3. drawShower の粒子描画置き換え
const drawStart = '    // 邊貞ｭ舌謠冗判\n    showerParticles.forEach(p => {\n        const color = `hsla(${p.hue}, 85%, 72%, ${p.alpha})`;\n        showerCtx.fillStyle = color;\n        showerCtx.shadowColor = color;\n        showerCtx.shadowBlur = p.size * 2;\n        \n        showerCtx.beginPath();\n        showerCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);\n        showerCtx.fill();\n    });';
const idxDrawStart = content.indexOf(drawStart);

if (idxDrawStart !== -1) {
    const newDrawCode = `    // 粒子の描画（バリエーションとフェード効果）
    showerParticles.forEach(p => {
        const lifeRatio = p.life / p.maxLife;
        // 寿命に伴う色相と輝度の緩やかな変化
        const currentHue = (p.hue + lifeRatio * 15) % 360;
        const currentLightness = 72 + lifeRatio * 15;
        const color = \`hsla(\${currentHue}, 90%, \${currentLightness}%, \${p.alpha})\`;
        
        // 寿命に伴うサイズ縮小
        const currentSize = Math.max(0.4, p.size * (1.0 - lifeRatio));
        
        showerCtx.fillStyle = color;
        showerCtx.strokeStyle = color;
        showerCtx.shadowColor = color;
        // 星型はより強く光らせる
        showerCtx.shadowBlur = currentSize * (p.type === 'sparkle' ? 3.5 : 1.8);
        
        if (p.type === 'sparkle') {
            // 十字星（きらきら粒子）の描画
            showerCtx.save();
            showerCtx.translate(p.x, p.y);
            if (p.angle !== undefined) {
                showerCtx.rotate(p.angle);
            }
            
            showerCtx.beginPath();
            for (let j = 0; j < 4; j++) {
                showerCtx.rotate(Math.PI / 2);
                showerCtx.moveTo(0, 0);
                showerCtx.lineTo(currentSize * 2.5, 0);
                showerCtx.lineTo(0, currentSize * 0.35);
                showerCtx.lineTo(-currentSize * 2.5, 0);
                showerCtx.lineTo(0, -currentSize * 0.35);
            }
            showerCtx.fill();
            showerCtx.restore();
        } else if (p.type === 'ring') {
            // リング状粒子の描画
            showerCtx.lineWidth = 0.8;
            showerCtx.beginPath();
            showerCtx.arc(p.x, p.y, currentSize * 1.3, 0, Math.PI * 2);
            showerCtx.stroke();
        } else {
            // 通常の円形粒子
            showerCtx.beginPath();
            showerCtx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
            showerCtx.fill();
        }
    });`;
    content = content.replace(drawStart, newDrawCode);
    console.log('3. drawShower particle drawing updated.');
} else {
    // 文字化けの可能性を考慮して、コメントを省いた形で再度検索
    const drawStartAlt = '    showerParticles.forEach(p => {\n        const color = `hsla(${p.hue}, 85%, 72%, ${p.alpha})`;\n        showerCtx.fillStyle = color;\n        showerCtx.shadowColor = color;\n        showerCtx.shadowBlur = p.size * 2;\n        \n        showerCtx.beginPath();\n        showerCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);\n        showerCtx.fill();\n    });';
    const idxDrawAlt = content.indexOf(drawStartAlt);
    if (idxDrawAlt !== -1) {
        const newDrawCode = `    // 粒子の描画（バリエーションとフェード効果）
    showerParticles.forEach(p => {
        const lifeRatio = p.life / p.maxLife;
        const currentHue = (p.hue + lifeRatio * 15) % 360;
        const currentLightness = 72 + lifeRatio * 15;
        const color = \`hsla(\${currentHue}, 90%, \${currentLightness}%, \${p.alpha})\`;
        const currentSize = Math.max(0.4, p.size * (1.0 - lifeRatio));
        
        showerCtx.fillStyle = color;
        showerCtx.strokeStyle = color;
        showerCtx.shadowColor = color;
        showerCtx.shadowBlur = currentSize * (p.type === 'sparkle' ? 3.5 : 1.8);
        
        if (p.type === 'sparkle') {
            showerCtx.save();
            showerCtx.translate(p.x, p.y);
            if (p.angle !== undefined) {
                showerCtx.rotate(p.angle);
            }
            
            showerCtx.beginPath();
            for (let j = 0; j < 4; j++) {
                showerCtx.rotate(Math.PI / 2);
                showerCtx.moveTo(0, 0);
                showerCtx.lineTo(currentSize * 2.5, 0);
                showerCtx.lineTo(0, currentSize * 0.35);
                showerCtx.lineTo(-currentSize * 2.5, 0);
                showerCtx.lineTo(0, -currentSize * 0.35);
            }
            showerCtx.fill();
            showerCtx.restore();
        } else if (p.type === 'ring') {
            showerCtx.lineWidth = 0.8;
            showerCtx.beginPath();
            showerCtx.arc(p.x, p.y, currentSize * 1.3, 0, Math.PI * 2);
            showerCtx.stroke();
        } else {
            showerCtx.beginPath();
            showerCtx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
            showerCtx.fill();
        }
    });`;
        content = content.replace(drawStartAlt, newDrawCode);
        console.log('3. drawShower particle drawing updated (alt).');
    } else {
        console.warn('3. drawShower particle drawing targets not found!');
    }
}

// 4. updateBubbles の通常ポップの粒子生成呼び出しの引数更新 (isSpecialEvent = false)
const oldPopTrigger = 'createShowerParticles(b.x, b.y, particleCount, b.hue);';
if (content.includes(oldPopTrigger)) {
    content = content.replace(oldPopTrigger, 'createShowerParticles(b.x, b.y, particleCount, b.hue, false);');
    console.log('4. updateBubbles pop trigger updated.');
} else {
    console.warn('4. updateBubbles pop trigger target not found!');
}

// 5. tryPopBubble の流れ星ポップに星屑粒子生成を追加 (isSpecialEvent = true)
const starPopKey = 'playStarSound(b.x);\n                totalPops += 7;';
if (content.includes(starPopKey)) {
    content = content.replace(starPopKey, 'playStarSound(b.x);\n                totalPops += 7;\n                createShowerParticles(b.x, b.y, 25, b.hue, true); // 流れ星は星屑を散らす');
    console.log('5. tryPopBubble star pop particles added.');
} else {
    console.warn('5. tryPopBubble star pop target not found!');
}

// 6. triggerMeteorBigExplosion を多重花火クライマックスに差し替え
const startExplosionKey = 'function triggerMeteorBigExplosion(originX, originY) {';
const endExplosionKey = 'function createBigExplosionMeteor(hue, originX, originY) {';

const idxExpStart = content.indexOf(startExplosionKey);
const idxExpEnd = content.indexOf(endExplosionKey);

if (idxExpStart !== -1 && idxExpEnd !== -1) {
    const newExplosionCode = `function triggerMeteorBigExplosion(originX, originY) {
    playMeteorBigExplosionSound(originX);
    
    const x = (originX !== undefined) ? originX : (showerCanvas ? showerCanvas.width / 2 : 0);
    const y = (originY !== undefined) ? originY : (showerCanvas ? showerCanvas.height / 2 : 0);
    
    // 1. メインの爆発演出
    createShowerParticles(x, y, 55, 42, true); // 特殊パーティクル（星型・リング含む）
    createShowerRipple(x, y, 220, 3.5, 42); // メイン波紋
    
    // メインの流星群を0.06秒で放出
    launchExplosionMeteors(x, y, 60, 60);
    
    // 2. 子爆発の連鎖（花火のクライマックス風に時間差で周囲に花開く）
    // 子爆発1 (0.15秒後、左上にずれた位置)
    setTimeout(() => {
        if (!gameActive) return;
        const cx = x - 120 + (Math.random() - 0.5) * 50;
        const cy = y - 80 + (Math.random() - 0.5) * 50;
        playFeverStartSound(cx); // ベルチャイムのきらきらスイープ音
        createShowerParticles(cx, cy, 35, 195, true); // 水色の星屑
        createShowerRipple(cx, cy, 140, 4.0, 195);
        launchExplosionMeteors(cx, cy, 25, 40);
    }, 150);
    
    // 子爆発2 (0.32秒後、右上にずれた位置)
    setTimeout(() => {
        if (!gameActive) return;
        const cx = x + 130 + (Math.random() - 0.5) * 50;
        const cy = y - 90 + (Math.random() - 0.5) * 50;
        playFeverStartSound(cx);
        createShowerParticles(cx, cy, 35, 349, true); // ピンクの星屑
        createShowerRipple(cx, cy, 140, 4.0, 349);
        launchExplosionMeteors(cx, cy, 25, 40);
    }, 320);
    
    // 子爆発3 (0.48秒後、中央より少し下、または真上)
    setTimeout(() => {
        if (!gameActive) return;
        const cx = x + (Math.random() - 0.5) * 80;
        const cy = y + 70 + (Math.random() - 0.5) * 50;
        playFeverStartSound(cx);
        createShowerParticles(cx, cy, 40, 45, true); // 金色の星屑
        createShowerRipple(cx, cy, 160, 4.2, 45);
        launchExplosionMeteors(cx, cy, 30, 50);
    }, 480);
}

// 爆発点から流星群を放出するヘルパー関数
function launchExplosionMeteors(cx, cy, count, duration) {
    const colors = [349, 35, 42, 148, 195, 213, 262];
    for (let i = 0; i < count; i++) {
        const delayTime = (i / count) * duration + Math.random() * 4;
        setTimeout(() => {
            if (!gameActive) return;
            createBigExplosionMeteor(colors[i % colors.length], cx, cy);
        }, delayTime);
    }
}

`;
    content = content.substring(0, idxExpStart) + newExplosionCode + content.substring(idxExpEnd);
    console.log('6. triggerMeteorBigExplosion updated to multi-firework climax.');
} else {
    console.warn('6. triggerMeteorBigExplosion targets not found!');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Finished apply_fireworks.js');
