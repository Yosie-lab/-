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
    
    // 強烈に光り輝くグロー効果（ぼかし）の維持
    // 霧のように広く美しい光彩を表現します
    showerCtx.shadowColor = 'rgba(0, 255, 140, 0.35)';
    showerCtx.shadowBlur = 80;
    
    // メインオーロラカーテンの設定
    const layer = {
        yOffset: showerCanvas.height * -0.05, // 画面最上端より上から配置して、薄い上部を画面外へ延伸
        amplitude: 75,                       // 基本うねりの幅（やや広げて滑らかさを強調）
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
                     
        // 縦方向の光の筋（ひだ）のコントラストを極限まで滑らかに (0.88〜1.0)
        // 線同士の境界を消し去り、シームレスな帯にします
        const ribNoise = Math.sin(x * 0.06 + t * 0.5) * Math.cos(x * 0.015 - t * 0.2);
        const curtainRibs = 0.88 + 0.12 * Math.pow(Math.abs(ribNoise), 1.2);
        
        // 時間経過による全体のゆっくりとした明滅・揺らぎ ＆ ひだの強弱を掛ける
        const midAlpha = 0.68 * (0.85 + Math.sin(t * 1.5) * 0.15) * curtainRibs;
        
        // 縦方向の長さ（高さをさらに伸ばし、幅広いダイナミックなベールを構成）
        const curtainHeight = (580 + Math.sin(x * 0.003 - t) * 120) * z;
        
        // 縦方向の線状グラデーション（上端から下端へ）
        const grad = showerCtx.createLinearGradient(x, yBase, x, yBase + curtainHeight);
        
        // 手前（Zが大きい）ほど不透明度を高め、奥ほど薄くする
        const scaleAlpha = midAlpha * z;
        
        // グラデーションの色の配色：
        // 0.70（全体の70%）まで完全に暗闇とし、発光部分（エメラルド〜白）の幅を10%強に狭める構成
        const colorTop = "rgba(0, 0, 0, 0)"; // 上端：完全な透明
        const colorUpperGreen = "rgba(0, 20, 15, " + (scaleAlpha * 0.01) + ")";   // 上部：ほぼ黒に近い暗闇（70%まで維持）
        const colorTeal = "rgba(0, 130, 110, " + (scaleAlpha * 0.25) + ")";       // 中間上部：シアン・ティール系
        const colorEmerald = "rgba(0, 210, 115, " + (scaleAlpha * 0.70) + ")";     // 中間：メインのエメラルドグリーン
        const colorLightGreen = "rgba(60, 235, 150, " + (scaleAlpha * 0.80) + ")"; // 境界緩和用中間色
        const colorPeakWhite = "rgba(210, 255, 235, " + (scaleAlpha * 0.90) + ")";  // 輝度最大部：白寄りの明るいミント
        const colorBottomGreen = "rgba(0, 150, 80, " + (scaleAlpha * 0.35) + ")";  // 下端手前：緩やかに薄くなる緑
        const colorEnd = "rgba(0, 10, 5, 0)"; // 最下端：なだらかに消える

        grad.addColorStop(0.0, colorTop);
        grad.addColorStop(0.70, colorUpperGreen);  // 0.70（全体の70%）まで暗い領域を大幅拡大
        grad.addColorStop(0.82, colorTeal);        // 0.82からなめらかに開始（立ち上がりの開始位置を下げる）
        grad.addColorStop(0.88, colorEmerald);     // エメラルドグリーン
        grad.addColorStop(0.91, colorLightGreen);  // なだらかなクッション
        grad.addColorStop(0.93, colorPeakWhite);   // 0.93のピーク部分（白の幅を狭める）
        grad.addColorStop(0.95, colorLightGreen);  // 戻り用クッション
        grad.addColorStop(0.98, colorBottomGreen); // 下端付近でなだらかに減衰
        grad.addColorStop(1.0, colorEnd);          // 最下端で完全消滅
        
        showerCtx.strokeStyle = grad;
        // 線の太さをさらに太くし（24.0から36.0へ）、個々の線から「さらに幅広の極光の面」にします
        showerCtx.lineWidth = (step + 36.0) * z;
        
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
