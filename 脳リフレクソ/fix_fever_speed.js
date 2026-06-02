const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'app.js');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. updateShower の置換
const searchShower = `        // フィーバー中（オーロラ出現時）は、粒子の動きを少しゆっくり（0.8倍）にする
        const speedMultiplier = feverActive ? 0.80 : 1.0;
        p.x += p.vx * speedMultiplier;
        p.y += p.vy * speedMultiplier;`;

const replaceShower = `        p.x += p.vx;
        p.y += p.vy;`;

if (content.indexOf(searchShower) !== -1) {
    content = content.replace(searchShower, replaceShower);
    console.log("updateShower updated.");
} else {
    console.warn("Warning: updateShower block not found (might be already modified).");
}

// 2. updateMeteors の置換
const searchMeteors = `        // フィーバー中（オーロラ出現時）は、流星の動きを少しゆっくり（0.8倍）にする
        const speedMultiplier = feverActive ? 0.80 : 1.0;
        m.x += m.vx * speedMultiplier;
        m.y += m.vy * speedMultiplier;`;

const replaceMeteors = `        m.x += m.vx;
        m.y += m.vy;`;

if (content.indexOf(searchMeteors) !== -1) {
    content = content.replace(searchMeteors, replaceMeteors);
    console.log("updateMeteors updated.");
} else {
    console.warn("Warning: updateMeteors block not found (might be already modified).");
}

// 3. updateBubbles の置換
const searchBubbles1 = `            // フィーバー中（オーロラ出現時）は、上昇速度と揺れを少しゆっくり（0.8倍）にする
            const speedMultiplier = feverActive ? 0.80 : 1.0;
            b.y += b.vy * speedMultiplier;
            b.x += Math.sin(b.time * b.swaySpeed * speedMultiplier + b.swayOffset) * b.swayAmplitude;`;

const searchBubbles2 = `            const speedMultiplier = (feverActive || !gameActive) ? 0.80 : 1.0;
            b.y += b.vy * speedMultiplier;
            b.x += Math.sin(b.time * b.swaySpeed * speedMultiplier + b.swayOffset) * b.swayAmplitude;`;

const replaceBubbles = `            b.y += b.vy;
            b.x += Math.sin(b.time * b.swaySpeed + b.swayOffset) * b.swayAmplitude;`;

if (content.indexOf(searchBubbles1) !== -1) {
    content = content.replace(searchBubbles1, replaceBubbles);
    console.log("updateBubbles (type 1) updated.");
} else if (content.indexOf(searchBubbles2) !== -1) {
    content = content.replace(searchBubbles2, replaceBubbles);
    console.log("updateBubbles (type 2) updated.");
} else {
    console.error("Error: updateBubbles block not found");
    process.exit(1);
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log("Success: app.js speed variables updated successfully!");
