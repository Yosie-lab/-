const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app.js');
let code = fs.readFileSync(filePath, 'utf8');

const startToken = 'function drawRealAuroraCurtain() {';
const endToken = 'function drawShower() {';

const startIndex = code.indexOf(startToken);
const endIndex = code.indexOf(endToken);

if (startIndex === -1) {
    console.error('startToken not found!');
    process.exit(1);
}
if (endIndex === -1) {
    console.error('endToken not found!');
    process.exit(1);
}

const keepBefore = code.substring(0, startIndex);
const keepAfter = code.substring(endIndex);

const newBlock = `function drawRealAuroraCurtain() {
    if (!showerCtx || !showerCanvas) return;
    auroraTime += 0.002; // ゆったりとした揺らめきの時間軸
    
    showerCtx.save();
    showerCtx.globalCompositeOperation = 'screen';
    
    // 強烈に光り輝くグロー効果（ぼかし）の極大化 (45から80へ引き上げ)
    // 霧のように広く美しい光彩を表現します
    showerCtx.shadowColor = 'rgba(0, 255, 140, 0.35)';
    showerCtx.shadowBlur = 80;
    
    // メインオーロラカーテンの設定
    const layer = {
        yOffset: showerCanvas.height * -0.05, // 画面最上端より上から配置して、薄い上部を画面外へ延伸
        amplitude: 70,                       // 基本うねりの幅
        frequency: 0.0018,                   // ゆったりとした波の周波数
        speed: 0.65
    };

    const step = 2; // 線同士の隙間によるモアレ（斜め線）を防ぐため解像度を高めに設定
    for (let x = 0; x < showerCanvas.width; x += step) {
        const t = auroraTime * layer.speed;
        
        // Z座標（奥行き）のシミュレーション
        const centerDist = (x - showerCanvas.width * 0.65) / (showerCanvas.width * 0.5);
        const zBase = Math.exp(-centerDist * centerDist * 1.8);
        const z = 0.35 + zBase * 0.55 + Math.sin(x * 0.003 - t) * 0.08; // 0.35 〜 1.0 のスケール値
        
        // 折り畳み形状（巻き込む波）のシミュレーション
        const wave1 = Math.sin(x * layer.frequency + t) * layer.amplitude;
        const wave2 = Math.cos(x * 0.0045 - t * 0.5) * (layer.amplitude * 0.4);
        const fold = Math.sin(x * 0.001 - t * 0.25); // 折り畳み効果の係数
        
        // メインのうねり（遠近感と折り畳み効果を反映）
        const yBase = layer.yOffset 
                     + (1.0 - z) * -60 // 奥にあるものは画面上部へ引っ込む
                     + (wave1 + wave2) * z * (1.2 + fold * 0.4);
                     
        // 縦方向の光の筋（ひだ）のコントラストを極限まで滑らかに (0.70〜1.0から0.88〜1.0へ)
        // 線同士の境界を消し去り、シームレスな帯にします
        const ribNoise = Math.sin(x * 0.06 + t * 0.5) * Math.cos(x * 0.015 - t * 0.2);
        const curtainRibs = 0.88 + 0.12 * Math.pow(Math.abs(ribNoise), 1.2);
        
        // 時間経過による全体のゆっくりとした明滅・揺らぎ ＆ ひだの強弱を掛ける
        const midAlpha = 0.68 * (0.85 + Math.sin(t * 1.5) * 0.15) * curtainRibs;
        
        // 縦方向の長さ（高さをさらに伸ばし、幅広いダイナミックなベールを構成）
        const curtainHeight = (560 + Math.sin(x * 0.003 - t) * 120) * z;
        
        // 縦方向の線状グラデーション（上端から下端へ）
        const grad = showerCtx.createLinearGradient(x, yBase, x, yBase + curtainHeight);
        
        // 手前（Zが大きい）ほど不透明度を高め、奥ほど薄くする
        const scaleAlpha = midAlpha * z;
        
        // グラデーションの色の配色：
        // 0.60（全体の60%）まで完全に暗闇とし、下部を強烈に発光させる構成
        const colorTop = "rgba(0, 0, 0, 0)"; // 上端：完全な透明
        const colorUpperGreen = "rgba(0, 20, 15, " + (scaleAlpha * 0.01) + ")";   // 上部：ほぼ黒に近い暗闇（60%まで維持）
        const colorTeal = "rgba(0, 130, 110, " + (scaleAlpha * 0.25) + ")";       // 中間上部：シアン・ティール系
        const colorEmerald = "rgba(0, 210, 115, " + (scaleAlpha * 0.70) + ")";     // 中間：メインのエメラルドグリーン
        const colorLightGreen = "rgba(60, 235, 150, " + (scaleAlpha * 0.80) + ")"; // 境界緩和用中間色
        const colorPeakWhite = "rgba(210, 255, 235, " + (scaleAlpha * 0.90) + ")";  // 輝度最大部：白寄りの明るいミント（馴染ませ徹底）
        const colorBottomGreen = "rgba(0, 150, 80, " + (scaleAlpha * 0.35) + ")";  // 下端手前：緩やかに薄くなる緑
        const colorEnd = "rgba(0, 10, 5, 0)"; // 最下端：なだらかに消える

        grad.addColorStop(0.0, colorTop);
        grad.addColorStop(0.60, colorUpperGreen);  // 0.60まで暗い領域を長く維持（上部は暗闇に紛れる）
        grad.addColorStop(0.76, colorTeal);        // 0.76からなめらかに開始
        grad.addColorStop(0.86, colorEmerald);     // エメラルドグリーン
        grad.addColorStop(0.90, colorLightGreen);  // なだらかなクッション
        grad.addColorStop(0.92, colorPeakWhite);   // 0.92のピーク部分（白）
        grad.addColorStop(0.94, colorLightGreen);  // 戻り用クッション
        grad.addColorStop(0.97, colorBottomGreen); // 下端付近でなだらかに減衰
        grad.addColorStop(1.0, colorEnd);          // 最下端で完全消滅
        
        showerCtx.strokeStyle = grad;
        // 線の太さを極限まで太くし（5.5から24.0へ）、個々の線から「超幅広の極光の面」にします
        showerCtx.lineWidth = (step + 24.0) * z;
        
        showerCtx.beginPath();
        showerCtx.moveTo(x, yBase);
        showerCtx.lineTo(x, yBase + curtainHeight);
        showerCtx.stroke();
    }
    
    showerCtx.restore();
}

`;

const finalCode = keepBefore + newBlock + keepAfter;
fs.writeFileSync(filePath, finalCode, 'utf8');
console.log('Successfully updated drawRealAuroraCurtain in app.js!');
