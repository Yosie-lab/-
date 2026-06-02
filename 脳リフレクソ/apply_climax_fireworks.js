const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app.js');
let content = fs.readFileSync(filePath, 'utf8');

// 1. playPopSound の完全置換 (バグ修正)
const popStartKey = 'function playPopSound(combo = 1, originX) {';
const popEndKey = 'function playClearSound() {';
const idxPopStart = content.indexOf(popStartKey);
const idxPopEnd = content.indexOf(popEndKey);

if (idxPopStart !== -1 && idxPopEnd !== -1) {
    const cleanPopSoundCode = `function playPopSound(combo = 1, originX) {
    initAudio();
    if (!audioCtx) return;
    
    // ブラウザの自動再生ブロック対策
    if (audioCtx.state === 'suspended') {
        audioCtx.resume().then(() => {
            playPopSound(combo, originX);
        }).catch(() => {});
        return;
    }
    
    try {
        const now = audioCtx.currentTime;
        
        // 1. メインの「ピチョン」水滴音用のオシレーター
        const osc = audioCtx.createOscillator();
        const mainGain = audioCtx.createGain();
        
        // 2. 指先の物理的な質感「プチッ」を出すための超短音オシレーター
        const clickOsc = audioCtx.createOscillator();
        const clickGain = audioCtx.createGain();
        
        // ディレイ（エコー）回路の追加
        const delay = audioCtx.createDelay();
        const feedback = audioCtx.createGain();
        
        osc.connect(mainGain);
        mainGain.connect(audioCtx.destination);
        mainGain.connect(delay);
        
        clickOsc.connect(clickGain);
        clickGain.connect(audioCtx.destination);
        
        delay.delayTime.setValueAtTime(0.15, now);
        feedback.gain.setValueAtTime(0.20, now);
        
        delay.connect(feedback);
        feedback.connect(delay);
        delay.connect(audioCtx.destination);
        
        // --- 音色・パラメータ設定 ---
        osc.type = 'sine';
        // 美しいCメジャー・ペンタトニック・スケール
        const popScale = [261.63, 293.66, 329.63, 392.00, 440.00]; // C4, D4, E4, G4, A4
        
        // 画面幅に対してX座標がどの位置にあるかで音程（インデックス）を決める
        const xRatio = (originX !== undefined && showerCanvas) 
            ? Math.max(0, Math.min(0.99, originX / showerCanvas.width)) 
            : 0.5;
        const scaleIndex = Math.floor(xRatio * popScale.length);
        let baseFreq = popScale[scaleIndex];
        
        // コンボ数が上がると、オクターブが上昇する（4コンボごとに1オクターブ、最大2オクターブまでシフト）
        const octaveShift = Math.floor((combo - 1) / 4);
        baseFreq = baseFreq * Math.pow(2, Math.min(2, octaveShift));
        
        const targetFreq = baseFreq * 2.2;
        const duration = 0.08 + Math.min(combo - 1, 5) * 0.006;
        
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(targetFreq, now + duration * 0.85);
        
        mainGain.gain.setValueAtTime(0, now);
        mainGain.gain.linearRampToValueAtTime(0.3, now + 0.003); // 3msアタック
        mainGain.gain.exponentialRampToValueAtTime(0.0001, now + duration); // スムーズに消音
        
        // B. 物理的な「プチッ」音
        clickOsc.type = 'sine';
        const clickFreq = 1800 + Math.min(combo - 1, 8) * 120;
        clickOsc.frequency.setValueAtTime(clickFreq, now);
        
        clickGain.gain.setValueAtTime(0, now);
        clickGain.gain.linearRampToValueAtTime(0.12, now + 0.001);
        clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);
        
        osc.start(now);
        osc.stop(now + duration + 0.05);
        
        clickOsc.start(now);
        clickOsc.stop(now + 0.03);
        
        setTimeout(() => {
            try {
                osc.disconnect();
                mainGain.disconnect();
                clickOsc.disconnect();
                clickGain.disconnect();
                delay.disconnect();
                feedback.disconnect();
            } catch (e) {}
        }, 1200);
        
    } catch (e) {
        console.warn("効果音再生エラー:", e);
    }
}

`;
    content = content.substring(0, idxPopStart) + cleanPopSoundCode + content.substring(idxPopEnd);
    console.log('1. playPopSound runtime bug fixed.');
} else {
    console.warn('1. playPopSound targets not found!');
}

// 2. playFeverStartSound などの効果音関数の追加 (もし削除されていた場合)
// playPopSoundの終わりの直前にフィーバー開始チャイム音を追加（多重花火の音響として使用するため）
const clearSoundKey = 'function playClearSound() {';
const idxClearSound = content.indexOf(clearSoundKey);

if (idxClearSound !== -1 && !content.includes('function playFeverStartSound')) {
    const feverStartSoundCode = `
// フィーバー突入・花火連打時のチャイムスイープ音
function playFeverStartSound(originX) {
    initAudio();
    if (!audioCtx) return;
    
    if (audioCtx.state === 'suspended') {
        audioCtx.resume().then(() => {
            playFeverStartSound(originX);
        }).catch(() => {});
        return;
    }
    
    try {
        const now = audioCtx.currentTime;
        const xRatio = (originX !== undefined && showerCanvas) 
            ? Math.max(0, Math.min(0.99, originX / showerCanvas.width)) 
            : 0.5;
        const basePan = xRatio * 2 - 1;
        
        const chimeScale = [880.00, 1046.50, 1174.66, 1318.51, 1567.98, 1760.00, 2093.00];
        
        chimeScale.forEach((freq, idx) => {
            const timeOffset = idx * 0.04;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            
            let panner = null;
            try {
                if (audioCtx.createStereoPanner) {
                    panner = audioCtx.createStereoPanner();
                    panner.pan.setValueAtTime(Math.max(-1.0, Math.min(1.0, basePan + (Math.random() - 0.5) * 0.4)), now + timeOffset);
                }
            } catch (e) {}
            
            osc.connect(gain);
            const dest = panner ? panner : audioCtx.destination;
            if (panner) panner.connect(audioCtx.destination);
            gain.connect(dest);
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + timeOffset);
            
            gain.gain.setValueAtTime(0, now + timeOffset);
            gain.gain.linearRampToValueAtTime(0.04, now + timeOffset + 0.003);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + timeOffset + 0.5);
            
            osc.start(now + timeOffset);
            osc.stop(now + timeOffset + 0.55);
            
            setTimeout(() => {
                try {
                    osc.disconnect();
                    gain.disconnect();
                    if (panner) panner.disconnect();
                } catch(e) {}
            }, (timeOffset + 0.6) * 1000);
        });
    } catch(e) {
        console.warn("効果音再生エラー:", e);
    }
}

`;
    content = content.substring(0, idxClearSound) + feverStartSoundCode + content.substring(idxClearSound);
    console.log('2. playFeverStartSound added.');
} else {
    console.log('2. playFeverStartSound already exists or clear key not found.');
}

// 3. createShowerParticles の機能拡張 (通常時はシンプル、特殊時は物理バリエーション)
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
        particleHue = (particleHue + (Math.random() - 0.5) * 12) % 360;
        
        const speedScale = isSpecialEvent ? (1.5 + Math.random() * 4.5) : (0.5 + Math.random() * 1.2);
        const angle = Math.random() * Math.PI * 2;
        const vx = Math.cos(angle) * speedScale;
        const vy = Math.sin(angle) * speedScale - (isSpecialEvent ? 0.3 : 0.2);
        
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
            maxLife: Math.random() * (isSpecialEvent ? 55 : 45) + (isSpecialEvent ? 35 : 20),
            life: 0,
            hue: particleHue,
            alpha: 0.95,
            type: pType,
            angle: Math.random() * Math.PI * 2,
            spin: isSpecialEvent ? (Math.random() - 0.5) * 0.12 : 0,
            gravity: isSpecialEvent ? 0.035 : 0.005, // 通常時はごくわずかな重力（元の浮遊感）
            friction: isSpecialEvent ? 0.94 : 0.985 // 通常時は元の減衰率
        });
    }
}

`;
    content = content.substring(0, idxPartStart) + newParticlesCode + content.substring(idxPartEnd);
    console.log('3. createShowerParticles updated with conditional variations.');
} else {
    console.warn('3. createShowerParticles targets not found!');
}

// 4. updateShower の粒子物理演算追加
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
        p.vy += (p.gravity || 0.005);
        
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
    console.log('4. updateShower particle physics updated.');
} else {
    console.warn('4. updateShower targets not found!');
}

// 5. drawShower 内の粒子描画置き換え (十字星・リング対応)
const drawStart = '    // 邊貞ｭ舌謠冗判\n    showerParticles.forEach(p => {\n        const color = `hsla(${p.hue}, 85%, 72%, ${p.alpha})`;\n        showerCtx.fillStyle = color;\n        showerCtx.shadowColor = color;\n        showerCtx.shadowBlur = p.size * 2;\n        \n        showerCtx.beginPath();\n        showerCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);\n        showerCtx.fill();\n    });';
const idxDrawStart = content.indexOf(drawStart);

if (idxDrawStart !== -1) {
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
    content = content.replace(drawStart, newDrawCode);
    console.log('5. drawShower particle drawing updated.');
} else {
    console.warn('5. drawShower targets not found!');
}

// 6. updateBubbles と tryPopBubble 内の通常ポップの粒子生成呼び出し引数更新
const oldPopTrigger = 'createShowerParticles(b.x, b.y, particleCount, b.hue);';
if (content.includes(oldPopTrigger)) {
    content = content.replace(oldPopTrigger, 'createShowerParticles(b.x, b.y, particleCount, b.hue, false);');
    console.log('6. updateBubbles pop trigger updated.');
} else {
    console.warn('6. updateBubbles pop trigger target not found!');
}

// 7. triggerMeteorBigExplosion を多重・色彩豊かな連鎖爆発に差し替え
const startExplosionKey = 'function triggerMeteorBigExplosion(originX, originY) {';
const endExplosionKey = 'function createBigExplosionMeteor(hue, originX, originY) {';

const idxExpStart = content.indexOf(startExplosionKey);
const idxExpEnd = content.indexOf(endExplosionKey);

if (idxExpStart !== -1 && idxExpEnd !== -1) {
    const newExplosionCode = `function triggerMeteorBigExplosion(originX, originY) {
    // 最初の爆発音
    playMeteorBigExplosionSound(originX);
    
    const x = (originX !== undefined) ? originX : (showerCanvas ? showerCanvas.width / 2 : 0);
    const y = (originY !== undefined) ? originY : (showerCanvas ? showerCanvas.height / 2 : 0);
    
    // 1. メインの巨大大輪花火 (ゴールド/オレンジ系)
    createShowerParticles(x, y, 60, 42, true); // ゴールド
    createShowerRipple(x, y, 220, 3.2, 42);
    launchExplosionMeteors(x, y, 50, 60); // 50本の流星
    
    // 2. クライマックスの多重連鎖爆発 (時間差で色彩豊かな大輪が重なり合う)
    
    // 子爆発1: 0.12秒後 (左上にずれた水色の花火)
    setTimeout(() => {
        if (!gameActive) return;
        const cx = x - 130 + (Math.random() - 0.5) * 60;
        const cy = y - 90 + (Math.random() - 0.5) * 60;
        playFeverStartSound(cx); // チャイムスイープ音
        createShowerParticles(cx, cy, 40, 195, true); // 水色 (十字星・リング混在)
        createShowerRipple(cx, cy, 140, 3.8, 195);
        launchExplosionMeteors(cx, cy, 25, 45);
    }, 120);
    
    // 子爆発2: 0.26秒後 (右上にずれたピンク・紫の花火)
    setTimeout(() => {
        if (!gameActive) return;
        const cx = x + 140 + (Math.random() - 0.5) * 60;
        const cy = y - 80 + (Math.random() - 0.5) * 60;
        playFeverStartSound(cx);
        createShowerParticles(cx, cy, 40, 349, true); // ピンク・紫系
        createShowerRipple(cx, cy, 140, 3.8, 349);
        launchExplosionMeteors(cx, cy, 25, 45);
    }, 260);
    
    // 子爆発3: 0.40秒後 (少し下にずれたエメラルドグリーンの花火)
    setTimeout(() => {
        if (!gameActive) return;
        const cx = x - 40 + (Math.random() - 0.5) * 60;
        const cy = y + 100 + (Math.random() - 0.5) * 50;
        playFeverStartSound(cx);
        createShowerParticles(cx, cy, 40, 148, true); // エメラルドグリーン系
        createShowerRipple(cx, cy, 150, 4.0, 148);
        launchExplosionMeteors(cx, cy, 25, 45);
    }, 400);
    
    // 子爆発4: 0.52秒後 (右下にずれたラベンダーの花火)
    setTimeout(() => {
        if (!gameActive) return;
        const cx = x + 110 + (Math.random() - 0.5) * 60;
        const cy = y + 80 + (Math.random() - 0.5) * 50;
        playFeverStartSound(cx);
        createShowerParticles(cx, cy, 40, 262, true); // ラベンダー系
        createShowerRipple(cx, cy, 130, 4.0, 262);
        launchExplosionMeteors(cx, cy, 20, 40);
    }, 520);
    
    // 最終フィナーレ特大花火: 0.68秒後 (中央上空のマルチカラー錦冠花火 ＋ 再度の大爆発音！)
    setTimeout(() => {
        if (!gameActive) return;
        const cx = x + (Math.random() - 0.5) * 40;
        const cy = y - 120 + (Math.random() - 0.5) * 40;
        playMeteorBigExplosionSound(cx); // 2回目の大爆発音でクライマックスの轟音を再現！
        createShowerParticles(cx, cy, 80, 42, true); // 豪華マルチカラー星屑
        createShowerRipple(cx, cy, 250, 4.5, 42); // 特大の白い衝撃波
        createShowerRipple(cx, cy, 180, 5.2, 195);
        launchExplosionMeteors(cx, cy, 50, 70); // 最後の錦冠の火花
    }, 680);
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
    console.log('7. triggerMeteorBigExplosion updated to multi-firework climax.');
} else {
    console.warn('7. triggerMeteorBigExplosion targets not found!');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Finished apply_climax_fireworks.js');
