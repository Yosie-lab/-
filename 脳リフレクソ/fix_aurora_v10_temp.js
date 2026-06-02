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
    showerCtx.shadowColor = 'rgba(0, 255, 140, 0.35)';
    showerCtx.shadowBlur = 80;
    
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
        
        // 巻き込む折り畳みを廃止し、滑らかな水平 of うねり（サイン波）のみにする
        const wave = Math.sin(x * layer.frequency + t) * layer.amplitude;
        
        // メインのうねり位置
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
        // 上部5分の4（0〜80%）を暗い霧グラデーション、下部5分の1（80%〜）に発光部を配置し、白の輝度を3分の1に抑える
        const colorTop = "rgba(0, 0, 0, 0)"; // 上端：完全な透明
        const colorUpperDark = "rgba(0, 20, 15, " + (scaleAlpha * 0.01) + ")";    // 上部：ほぼ黒に近い暗闇
        const colorDarkMist = "rgba(0, 45, 30, " + (scaleAlpha * 0.08) + ")";      // 霧のように淡い深緑（60%付近）
        const colorTeal = "rgba(0, 100, 75, " + (scaleAlpha * 0.22) + ")";         // 中間：薄暗い青緑（80%の境界線まで、暗い霧グラデーション）
        const colorEmerald = "rgba(0, 220, 115, " + (scaleAlpha * 0.70) + ")";      // 下部5分の1：エメラルドグリーン発光開始
        const colorLightGreen = "rgba(80, 240, 160, " + (scaleAlpha * 0.78) + ")";  // 境界緩和用中間色
        const colorPeakWhite = "rgba(185, 255, 225, " + (scaleAlpha * 0.60) + ")";   // 輝度最大部：白に近いミント（不透明度を0.60に落とし、現在の3分の1へ抑制）
        const colorBottomGreen = "rgba(0, 150, 75, " + (scaleAlpha * 0.35) + ")";   // 下端手前：緩やかに薄くなる緑
        const colorEnd = "rgba(0, 10, 5, 0)"; // 最下端：なだらかに消える

        grad.addColorStop(0.0, colorTop);
        grad.addColorStop(0.40, colorUpperDark);   // 40%まで暗闇
        grad.addColorStop(0.60, colorDarkMist);    // 60%付近で暗い霧グラデーション開始
        grad.addColorStop(0.80, colorTeal);        // 80%付近まで「暗い霧グラデーション（5分の4）」を広げる
        grad.addColorStop(0.86, colorEmerald);     // 86%から発光開始（5分の1の発光部分）
        grad.addColorStop(0.91, colorLightGreen);  // 白へのなだらかな移行
        grad.addColorStop(0.93, colorPeakWhite);   // 白の発光ピーク（輝度と範囲を抑えて白浮きを3分の1に軽減）
        grad.addColorStop(0.95, colorLightGreen);  // 戻り用クッション
        grad.addColorStop(0.98, colorBottomGreen); // 下端付近でなだらかに減衰
        grad.addColorStop(1.0, colorEnd);          // 最下端で完全消滅
        
        showerCtx.strokeStyle = grad;
        // 線の太さを維持し、線同士を完全に重ね合わせて1枚の滑らかなベールにします
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
