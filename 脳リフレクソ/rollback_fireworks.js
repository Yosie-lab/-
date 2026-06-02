const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app.js');
let content = fs.readFileSync(filePath, 'utf8');

// 1. createShowerParticles の復元
const particlesStart = 'function createShowerParticles(x, y, count, hueBase, isSpecialEvent = false) {';
const particlesEnd = 'function createShowerRipple(x, y, maxR, speed, hue) {';

const idxPartStart = content.indexOf(particlesStart);
const idxPartEnd = content.indexOf(particlesEnd);

if (idxPartStart !== -1 && idxPartEnd !== -1) {
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
}

`;
    content = content.substring(0, idxPartStart) + oldParticlesCode + content.substring(idxPartEnd);
    console.log('1. createShowerParticles rolled back.');
} else {
    console.warn('1. createShowerParticles targets not found!');
}

// 2. updateShower の粒子更新ループ復元
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

// 3. drawShower の粒子描画復元
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
    // alt版も考慮
    const drawStartAlt = '    // 粒子の描画（バリエーションとフェード効果）\n    showerParticles.forEach(p => {\n        const lifeRatio = p.life / p.maxLife;';
    const idxDrawAlt = content.indexOf(drawStartAlt);
    if (idxDrawAlt !== -1 && idxDrawEnd !== -1) {
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
        content = content.substring(0, idxDrawAlt) + oldDrawCode + content.substring(endOffset);
        console.log('3. drawShower rolled back (alt).');
    } else {
        console.warn('3. drawShower targets not found!');
    }
}

// 4. updateBubbles の通常ポップの粒子生成呼び出し引数復元
const newPopTrigger = 'createShowerParticles(b.x, b.y, particleCount, b.hue, false);';
if (content.includes(newPopTrigger)) {
    content = content.replace(newPopTrigger, 'createShowerParticles(b.x, b.y, particleCount, b.hue);');
    console.log('4. updateBubbles pop trigger rolled back.');
} else {
    console.warn('4. updateBubbles pop trigger target not found!');
}

// 5. tryPopBubble の流れ星ポップ粒子生成削除
const starPopKey = 'playStarSound(b.x);\n                totalPops += 7;\n                createShowerParticles(b.x, b.y, 25, b.hue, true); // 流れ星は星屑を散らす';
if (content.includes(starPopKey)) {
    content = content.replace(starPopKey, 'playStarSound(b.x);\n                totalPops += 7;');
    console.log('5. tryPopBubble star pop particles removed.');
} else {
    console.warn('5. tryPopBubble star pop target not found!');
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
console.log('Finished rollback_fireworks.js');
