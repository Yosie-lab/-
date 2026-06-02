const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app.js');
let code = fs.readFileSync(filePath, 'utf8');

const startToken = 'p.alpha = 0.95 * (1.0 - (p.life / p.maxLife));';
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

const keepBefore = code.substring(0, startIndex + startToken.length);
const keepAfter = code.substring(endIndex);

const newBlock = `

        if (p.life >= p.maxLife) {
            showerParticles.splice(i, 1);
        }
    }
}

function drawRealAuroraCurtain() {
    if (!showerCtx || !showerCanvas) return;
    auroraTime += 0.002; // ゆったりとした揺らめきの時間軸
    
    showerCtx.save();
    showerCtx.globalCompositeOperation = 'screen';
    
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
                     
        // 縦方向の光の筋（ひだ）をシャープに表現するための強弱係数
        // X座標と時間経過によるうねりを用いて明暗のスリットを作る
        const ribNoise = Math.sin(x * 0.06 + t * 0.5) * Math.cos(x * 0.015 - t * 0.2);
        const curtainRibs = 0.55 + 0.45 * Math.pow(Math.abs(ribNoise), 1.5);
        
        // 時間経過による全体のゆっくりとした明滅・揺らぎ ＆ ひだの強弱を掛ける
        const midAlpha = 0.70 * (0.85 + Math.sin(t * 1.5) * 0.15) * curtainRibs;
        
        // 縦方向の長さ（高さを長めに確保して、上から下へのグラデーションを滑らかに見せる）
        const curtainHeight = (450 + Math.sin(x * 0.003 - t) * 90) * z;
        
        // 縦方向の線状グラデーション（上端から下端へ）
        const grad = showerCtx.createLinearGradient(x, yBase, x, yBase + curtainHeight);
        
        // 手前（Zが大きい）ほど不透明度を高め、奥ほど薄くする
        const scaleAlpha = midAlpha * z;
        
        // グラデーションの色の配色：
        // 上部はほぼ完全に暗闇に溶け込み、中間から徐々にエメラルドに、下部で強く発光する構成
        const colorTop = \`rgba(0, 0, 0, 0)\`; // 上端：完全な透明
        const colorUpperGreen = \`rgba(0, 45, 30, \${scaleAlpha * 0.08})\`; // 上部〜中間：極めて淡く暗い深緑
        const colorMidGreen = \`rgba(0, 160, 100, \${scaleAlpha * 0.45})\`; // 中間：徐々に立ち上がるエメラルド
        const colorPeakGreen = \`rgba(0, 235, 110, \${scaleAlpha * 0.85})\`; // 発光部：鮮やかなエメラルドグリーン
        const colorMintWhite = \`rgba(215, 255, 235, \${scaleAlpha * 1.4})\`; // 輝度最大部：ミントホワイト（非常に明るく光るピーク）
        const colorBottomGreen = \`rgba(0, 200, 90, \${scaleAlpha * 0.6})\`; // 下端手前：緩やかに薄くなる緑
        const colorEnd = \`rgba(0, 20, 10, 0)\`; // 最下端：なだらかに消える

        grad.addColorStop(0.0, colorTop);
        grad.addColorStop(0.45, colorUpperGreen);  // 0.45まで暗い領域を長く維持（上側の緑は暗闇に紛れる）
        grad.addColorStop(0.70, colorMidGreen);    // 0.70から徐々に立ち上がる
        grad.addColorStop(0.86, colorPeakGreen);   // 0.86でエメラルドグリーンの最大発光
        grad.addColorStop(0.92, colorMintWhite);   // 0.92付近にミントホワイトのハイライト光を配置
        grad.addColorStop(0.97, colorBottomGreen); // 下端付近で再び緑に減衰
        grad.addColorStop(1.0, colorEnd);          // 最下端で完全消滅
        
        showerCtx.strokeStyle = grad;
        // 線の太さも遠近感（z）に合わせて変化させる
        showerCtx.lineWidth = (step + 0.8) * z;
        
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
console.log('Successfully fixed app.js!');
