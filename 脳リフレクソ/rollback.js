const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app.js');
let content = fs.readFileSync(filePath, 'utf8');

// 1. triggerHapticFeedback 関数の削除と createShowerParticles の復元
const searchStart = '// モバイル端末用の微細な振動（ハプティクス）をトリガーする';
const searchEnd = 'friction: isBigExplosion ? 0.945 : 0.965 // 空気抵抗\n        });\n    }\n}';

const idxStart = content.indexOf(searchStart);
const idxEnd = content.indexOf(searchEnd);

if (idxStart !== -1 && idxEnd !== -1) {
    const endOffset = idxEnd + searchEnd.length;
    const oldParticlesCode = `function createShowerParticles(x, y, count, hueBase) {
    for (let i = 0; i < count; i++) {
        showerHue = (hueBase !== undefined && hueBase !== null)
            ? hueBase
            : (showerHue + 0.4) % 360;
        showerParticles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5 - 0.25,
            size: Math.random() * 5 + 2,
            maxLife: Math.random() * 90 + 70,
            life: 0,
            hue: showerHue,
            alpha: 0.9
        });
    }
}`;
    content = content.substring(0, idxStart) + oldParticlesCode + content.substring(endOffset);
    console.log('1. triggerHapticFeedback removed and createShowerParticles rolled back.');
} else {
    console.warn('1. triggerHapticFeedback / createShowerParticles targets not found!');
}

// 2. updateShower の復元
const updateStart = '    for (let i = showerParticles.length - 1; i >= 0; i--) {\n        const p = showerParticles[i];\n        p.life++;\n        \n        // 物理演算（摩擦と重力を適用）';
const updateEnd = '        if (p.life >= p.maxLife) {\n            showerParticles.splice(i, 1);\n        }\n    }';

const idxUpdateStart = content.indexOf(updateStart);
const idxUpdateEnd = content.indexOf(updateEnd);

if (idxUpdateStart !== -1 && idxUpdateEnd !== -1) {
    const endOffset = idxUpdateEnd + updateEnd.length;
    const oldUpdateCode = `    for (let i = showerParticles.length - 1; i >= 0; i--) {
        const p = showerParticles[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        
        p.vx *= 0.985;
        p.vy *= 0.985;
        p.alpha = 0.9 * (1.0 - (p.life / p.maxLife));
        
        if (p.life >= p.maxLife) {
            showerParticles.splice(i, 1);
        }
    }`;
    content = content.substring(0, idxUpdateStart) + oldUpdateCode + content.substring(endOffset);
    console.log('2. updateShower rolled back.');
} else {
    console.warn('2. updateShower targets not found!');
}

// 3. drawShower の復元
const drawStart = '    // 粒子の描画（バリエーションとフェード効果）\n    showerParticles.forEach(p => {';
const drawEnd = '        } else {\n            // 通常の円形粒子\n            showerCtx.beginPath();\n            showerCtx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);\n            showerCtx.fill();\n        }\n    });';

const idxDrawStart = content.indexOf(drawStart);
const idxDrawEnd = content.indexOf(drawEnd);

if (idxDrawStart !== -1 && idxDrawEnd !== -1) {
    const endOffset = idxDrawEnd + drawEnd.length;
    const oldDrawCode = `    showerParticles.forEach(p => {
        const color = \`hsla(\${p.hue}, 85%, 72%, \${p.alpha})\`;
        showerCtx.fillStyle = color;
        showerCtx.shadowColor = color;
        showerCtx.shadowBlur = p.size * 2;
        
        showerCtx.beginPath();
        showerCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        showerCtx.fill();
    });`;
    content = content.substring(0, idxDrawStart) + oldDrawCode + content.substring(endOffset);
    console.log('3. drawShower rolled back.');
} else {
    console.warn('3. drawShower targets not found!');
}

// 4. handleInteraction の復元
const missKey = '        createShowerParticles(clientX, clientY, 15);\n        triggerHapticFeedback(\'miss\');';
if (content.includes(missKey)) {
    content = content.replace(missKey, '        createShowerParticles(clientX, clientY, 15);');
    console.log('4. handleInteraction rolled back.');
} else {
    console.warn('4. handleInteraction target not found!');
}

// 5. tryPopBubble の復元
const popKey = '            playPopSound(comboCount);\n            triggerHapticFeedback(\'pop\');';
if (content.includes(popKey)) {
    content = content.replace(popKey, '            playPopSound(comboCount);');
    console.log('5. tryPopBubble rolled back.');
} else {
    console.warn('5. tryPopBubble target not found!');
}

// 6. triggerMeteorBigExplosion の復元
const startExplosionKey = 'function triggerMeteorBigExplosion(originX, originY) {';
const endExplosionKey = 'function createBigExplosionMeteor(hue, originX, originY) {';

const idxExpStart = content.indexOf(startExplosionKey);
const idxExpEnd = content.indexOf(endExplosionKey);

if (idxExpStart !== -1 && idxExpEnd !== -1) {
    const oldExplosionCode = `function triggerMeteorBigExplosion(originX, originY) {
    playMeteorBigExplosionSound(originX); // 音源パン設定のためにX座標を引き渡す
    
    const count = 100; // 流星の数を100本に大幅増
    const duration = 80; // 0.08秒間という一瞬（約5フレーム）の間にすべてを放出
    const colors = [349, 35, 42, 148, 195, 213, 262]; // 一連の虹色
    
    const x = (originX !== undefined) ? originX : (showerCanvas ? showerCanvas.width / 2 : 0);
    const y = (originY !== undefined) ? originY : (showerCanvas ? showerCanvas.height / 2 : 0);
    
    for (let i = 0; i < count; i++) {
        const delayTime = (i / count) * duration + Math.random() * 5;
        setTimeout(() => {
            if (!gameActive) return;
            createBigExplosionMeteor(colors[i % colors.length], x, y);
        }, delayTime);
    }
}

`;
    content = content.substring(0, idxExpStart) + oldExplosionCode + content.substring(idxExpEnd);
    console.log('6. triggerMeteorBigExplosion rolled back.');
} else {
    console.warn('6. triggerMeteorBigExplosion targets not found!');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Rollback complete.');
