const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app.js');
let content = fs.readFileSync(filePath, 'utf8');

// 1. handleInteraction の置換
// createShowerParticles(clientX, clientY, 15); の直後に triggerHapticFeedback('miss'); を追加
const handleKey = 'createShowerParticles(clientX, clientY, 15);';
if (content.includes(handleKey)) {
    content = content.replace(handleKey, handleKey + '\n        triggerHapticFeedback(\'miss\');');
    console.log('1. handleInteraction fixed.');
} else {
    console.warn('1. handleInteraction key not found!');
}

// 2. tryPopBubble の置換
// playPopSound(comboCount); の直後に triggerHapticFeedback('pop'); を追加
const popKey = 'playPopSound(comboCount);';
if (content.includes(popKey)) {
    content = content.replace(popKey, popKey + '\n            triggerHapticFeedback(\'pop\');');
    console.log('2. tryPopBubble fixed.');
} else {
    console.warn('2. tryPopBubble key not found!');
}

// 3. triggerMeteorBigExplosion の置換
const startKey = 'function triggerMeteorBigExplosion(originX, originY) {';
const endKey = 'function createBigExplosionMeteor(hue, originX, originY) {';

const startIndex = content.indexOf(startKey);
const endIndex = content.indexOf(endKey);

if (startIndex !== -1 && endIndex !== -1) {
    const newExplosionCode = `function triggerMeteorBigExplosion(originX, originY) {
    playMeteorBigExplosionSound(originX);
    triggerHapticFeedback('explosion'); // 重厚な大爆発の触感
    
    const count = 100; // 流星の数を100本に大幅増
    const duration = 80; // 0.08秒間にすべてを放出
    const colors = [349, 35, 42, 148, 195, 213, 262];
    
    const x = (originX !== undefined) ? originX : (showerCanvas ? showerCanvas.width / 2 : 0);
    const y = (originY !== undefined) ? originY : (showerCanvas ? showerCanvas.height / 2 : 0);
    
    // 大爆発用の極上パーティクル（70個）を同時に発生
    createShowerParticles(x, y, 70, 42, true);
    
    // 大爆発用の極大波紋を同心円状に多重発生させる
    createShowerRipple(x, y, 220, 3.6, 42);
    setTimeout(() => {
        if (gameActive) createShowerRipple(x, y, 150, 4.2, 349);
    }, 100);
    setTimeout(() => {
        if (gameActive) createShowerRipple(x, y, 90, 5.0, 195);
    }, 200);
    
    for (let i = 0; i < count; i++) {
        const delayTime = (i / count) * duration + Math.random() * 5;
        setTimeout(() => {
            if (!gameActive) return;
            createBigExplosionMeteor(colors[i % colors.length], x, y);
        }, delayTime);
    }
}

`;
    content = content.substring(0, startIndex) + newExplosionCode + content.substring(endIndex);
    console.log('3. triggerMeteorBigExplosion fixed.');
} else {
    console.warn('3. triggerMeteorBigExplosion keys not found!');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Finished writing app.js');
