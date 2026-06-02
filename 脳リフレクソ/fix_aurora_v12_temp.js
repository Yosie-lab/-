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
    
    // 強烈に光り輝くグロー効果（ぼかし）の極大設定
    // 霧の部分も含めて光彩を極めて広く美しく拡散させ、幻想的なイメージを高めます
    showerCtx.shadowColor = 'rgba(0, 240, 115, 0.35)';
    showerCtx.shadowBlur = 95;
    
    // メインオーロラカーテンの設定
    const layer = {
        yOffset: showerCanvas.height * -0.05, // 画面最上端より上から配置して、薄い上部を画面外へ延伸
        amplitude: 55,                       // 基本うねりの幅
        frequency: 0.0015,                   // ゆったりとした波の周波数
        speed: 0.65
    };

    const step = 2; // 線同士の隙間によるモアレ（斜め線）を防ぐため解像度を高めに設定
    for (let x = 0; x < showerCanvas.width; x += step) {
        const t = auroraTime * layer.speed;
        
        // V字型（奥行きによる引き込み）を完全に無くし、水平均一にするためZは1.0に固定
        const z = 1.0; 
        
        // 巻き込む折り畳みを廃止し、滑らかな水平のうねり（サイン波）のみにする
        const wave = Math.sin(x * layer.frequency + t) * layer.amplitude;
        
        // メインのうねり位置
        const yBase = layer.yOffset + wave;
                     
        // 縦方向の光の筋（ひだ）のコントラストを極限まで滑らかにし、シームレスな帯にします
        const ribNoise = Math.sin(x * 0.06 + t * 0.5) * Math.cos(x * 0.015 - t * 0.2);
        const curtainRibs = 0.90 + 0.10 * Math.pow(Math.abs(ribNoise), 1.2);
        
        // 全体の発光量を現在の5分の1（不透明度基本値を0.68から0.14へ）に減らして全体を暗くします
        // 時間経過による全体のゆっくりとした明滅・揺らぎ ＆ ひだの強弱を掛ける
        const midAlpha = 0.14 * (0.85 + Math.sin(t * 1.5) * 0.15) * curtainRibs;
        
        // 縦方向の長さ（カーテンの高さを水平方向に長く確保）
        const curtainHeight = (580 + Math.sin(x * 0.003 - t) * 80) * z;
        
        // 縦方向の線状グラデーション（上端から下端へ）
        const grad = showerCtx.createLinearGradient(x, yBase, x, yBase + curtainHeight);
        
        // 手前（Zが大きい）ほど不透明度を高め、奥ほど薄くする
        const scaleAlpha = midAlpha * z;
        
        // グラデーションの色の配色：
        // 白を完全に廃止し、すべてエメラルドグリーンと深緑のみで構築
        const colorTop = "rgba(0, 0, 0, 0)"; // 上端：完全な透明
        const colorUpperDark = "rgba(0, 20, 10, " + (scaleAlpha * 0.01) + ")";     // 上部3分の1付近：極めて薄く暗い深緑
        const colorTealGreen = "rgba(0, 80, 50, " + (scaleAlpha * 0.18) + ")";      // 中間移行部：やや暗めの深緑（ティールグリーン）
        const colorEmerald = "rgba(0, 170, 75, " + (scaleAlpha * 0.50) + ")";      // 中間発光ベース：おだやかなエメラルドグリーン
        const colorPeakGreen = "rgba(0, 235, 110, " + (scaleAlpha * 0.70) + ")";     // 下部8分の1の発光部：純粋な明るいエメラルドグリーン（白は完全廃止）
        const colorBottomGreen = "rgba(0, 120, 55, " + (scaleAlpha * 0.25) + ")";   // 下端手前：緩やかに薄くなる緑
        const colorEnd = "rgba(0, 10, 5, 0)"; // 最下端：なだらかに消える

        grad.addColorStop(0.0, colorTop);
        grad.addColorStop(0.33, colorUpperDark);   // 上部3分の1（ここまで暗い霧グラデーション）
        grad.addColorStop(0.55, colorTealGreen);   // 0.55からなめらかな緑へ立ち上がり開始
        grad.addColorStop(0.75, colorEmerald);     // 穏やかなエメラルドグリーンのベース
        grad.addColorStop(0.875, colorEmerald);    // ここから下部8分の1の発光部スタート
        grad.addColorStop(0.93, colorPeakGreen);   // 発光の最大ピーク（白ではなく、純粋な明るいエメラルドグリーン）
        grad.addColorStop(0.98, colorBottomGreen); // 下端付近でなだらかに減衰
        grad.addColorStop(1.0, colorEnd);          // 最下端で完全消滅
        
        showerCtx.strokeStyle = grad;
        // 線の太さを極限まで太くし（45.0から55.0へ）、線同士をさらに重ね合わせて完全にシームレスな極光ベールにします
        showerCtx.lineWidth = (step + 55.0) * z;
        
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
