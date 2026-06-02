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
    // 霧のように広く美しい光彩で全体を包み込み、色の境界を完全に溶かします
    showerCtx.shadowColor = 'rgba(0, 255, 140, 0.35)';
    showerCtx.shadowBlur = 80;
    
    // メインオーロラカーテンの設定
    const layer = {
        yOffset: showerCanvas.height * -0.05, // 画面最上端より上から配置して、薄い上部を画面外へ延伸
        amplitude: 55,                       // 基本うねりの幅（水平カーテンとしての美しさを保つためマイルドに）
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
        
        // メインの垂れ下がり位置（V字による引き込みを無くし、水平均一化）
        const yBase = layer.yOffset + wave;
                     
        // 縦方向の光の筋（ひだ）のコントラストを極限まで滑らかにし、シームレスな帯にします
        const ribNoise = Math.sin(x * 0.06 + t * 0.5) * Math.cos(x * 0.015 - t * 0.2);
        const curtainRibs = 0.90 + 0.10 * Math.pow(Math.abs(ribNoise), 1.2);
        
        // 時間経過による全体のゆっくりとした明滅・揺らぎ ＆ ひだの強弱を掛ける
        const midAlpha = 0.68 * (0.85 + Math.sin(t * 1.5) * 0.15) * curtainRibs;
        
        // 縦方向の長さ（カーテンの高さを水平方向に長く確保）
        const curtainHeight = (580 + Math.sin(x * 0.003 - t) * 80) * z;
        
        // 縦方向の線状グラデーション（上端から下端へ）
        const grad = showerCtx.createLinearGradient(x, yBase, x, yBase + curtainHeight);
        
        // 手前（Zが大きい）ほど不透明度を高め、奥ほど薄くする
        const scaleAlpha = midAlpha * z;
        
        // グラデーションの色の配色：
        // 上3分の2（0〜66%）は薄暗いグラデーション、下3分の1（66%〜）で強烈に発光する構成
        const colorTop = "rgba(0, 0, 0, 0)"; // 上端：完全な透明
        const colorUpperDark = "rgba(0, 30, 20, " + (scaleAlpha * 0.05) + ")";   // 上部3分の1付近：極めて薄く暗い深緑
        const colorUpperTeal = "rgba(0, 100, 75, " + (scaleAlpha * 0.20) + ")";   // 上部3分の2付近：薄暗い青緑（ここまで薄暗いグラデーション）
        const colorEmerald = "rgba(0, 225, 115, " + (scaleAlpha * 0.80) + ")";     // 下部3分の1の開始点：美しいエメラルド発光
        const colorPeakWhite = "rgba(215, 255, 238, " + (scaleAlpha * 1.00) + ")";  // 発光ピーク：白寄りの明るいミント
        const colorBottomGreen = "rgba(0, 160, 80, " + (scaleAlpha * 0.40) + ")";  // 下端手前：緩やかに薄くなる緑
        const colorEnd = "rgba(0, 10, 5, 0)"; // 最下端：なだらかに消える

        grad.addColorStop(0.0, colorTop);
        grad.addColorStop(0.35, colorUpperDark);   // 上部3分の1
        grad.addColorStop(0.66, colorUpperTeal);   // 上部3分の2（ここまで薄暗く、画面いっぱい広げる）
        grad.addColorStop(0.82, colorEmerald);     // 下部3分の1の立ち上がり（発光）
        grad.addColorStop(0.89, colorPeakWhite);   // 発光ピーク（白）
        grad.addColorStop(0.94, colorEmerald);     // 緑へのなだらかな戻り
        grad.addColorStop(1.0, colorEnd);          // 最下端で完全消滅
        
        showerCtx.strokeStyle = grad;
        // 線の太さをさらに太くし（36.0から45.0へ）、線同士を完全に重ね合わせて1枚の滑らかなベールにします
        showerCtx.lineWidth = (step + 45.0) * z;
        
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
