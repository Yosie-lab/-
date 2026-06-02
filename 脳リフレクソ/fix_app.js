const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'app.js');
let code = fs.readFileSync(targetPath, 'utf8');

const startKey = 'function playMeteorBigExplosionSound(originX) {';
const endKey = 'function tryPopBubble(clientX, clientY) {';

const startIdx = code.indexOf(startKey);
const endIdx = code.indexOf(endKey);

if (startIdx !== -1 && endIdx !== -1) {
    let commentIdx = code.lastIndexOf('//', endIdx);
    if (commentIdx === -1 || commentIdx < startIdx) {
        commentIdx = endIdx;
    }
    
    const newFunc = `function playMeteorBigExplosionSound(originX) {
    initAudio();
    if (!audioCtx) return;
    
    // Web Audio APIの初期化/レジューム試行
    if (audioCtx.state === 'suspended') {
        audioCtx.resume().then(() => {
            // 再起呼び出しを避けるためここでは再生しない
        }).catch(() => {});
        return;
    }
    
    try {
        const now = audioCtx.currentTime;
        
        // 発生元のX座標から基準定位（パン）を計算（画面の左端＝-1.0、右端＝+1.0）
        const basePan = (originX !== undefined && showerCanvas) 
            ? Math.max(-1.0, Math.min(1.0, (originX / showerCanvas.width) * 2 - 1)) 
            : 0;
            
        // 1. 爆発の際の衝突音と重なる爽快な「スクラッチ音」
        // Q値を高めて、キラキラした周波数成分を強調
        const sweepOsc1 = audioCtx.createOscillator();
        const sweepOsc2 = audioCtx.createOscillator();
        const sweepFilter = audioCtx.createBiquadFilter();
        const sweepGain = audioCtx.createGain();
        
        sweepOsc1.type = 'triangle';
        sweepOsc1.frequency.setValueAtTime(600, now);
        sweepOsc1.frequency.exponentialRampToValueAtTime(2400, now + 0.25);
        
        sweepOsc2.type = 'sine';
        sweepOsc2.frequency.setValueAtTime(608, now);
        sweepOsc2.frequency.exponentialRampToValueAtTime(2415, now + 0.25);
        
        sweepFilter.type = 'bandpass';
        sweepFilter.Q.setValueAtTime(7.5, now);
        sweepFilter.frequency.setValueAtTime(1500, now);
        sweepFilter.frequency.exponentialRampToValueAtTime(8000, now + 0.20);
        
        sweepGain.gain.setValueAtTime(0, now);
        sweepGain.gain.linearRampToValueAtTime(0.08, now + 0.02);
        sweepGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
        
        sweepOsc1.connect(sweepFilter);
        sweepOsc2.connect(sweepFilter);
        sweepFilter.connect(sweepGain);
        
        let sweepPanner = null;
        try {
            if (audioCtx.createStereoPanner) {
                sweepPanner = audioCtx.createStereoPanner();
            }
        } catch (err) {
            sweepPanner = null;
        }
        if (sweepPanner) {
            sweepGain.connect(sweepPanner);
            sweepPanner.connect(audioCtx.destination);
            sweepPanner.pan.setValueAtTime(basePan, now);
            sweepPanner.pan.linearRampToValueAtTime(-basePan * 0.5, now + 0.25);
        } else {
            sweepGain.connect(audioCtx.destination);
        }
        
        sweepOsc1.start(now);
        sweepOsc1.stop(now + 0.35);
        sweepOsc2.start(now);
        sweepOsc2.stop(now + 0.35);

        // ベル音用の遅延フィードバック・エフェクトを作成
        const bellDelay = audioCtx.createDelay();
        const bellFeedback = audioCtx.createGain();
        const bellDelayFilter = audioCtx.createBiquadFilter();
        const bellDelayGain = audioCtx.createGain();
        
        bellDelay.delayTime.setValueAtTime(0.07, now);
        bellFeedback.gain.setValueAtTime(0.38, now);
        
        bellDelayFilter.type = 'highpass';
        bellDelayFilter.frequency.setValueAtTime(2500, now);
        
        bellDelayGain.gain.setValueAtTime(0.18, now);
        
        bellDelay.connect(bellDelayFilter);
        bellDelayFilter.connect(bellFeedback);
        bellFeedback.connect(bellDelay);
        
        bellDelayFilter.connect(bellDelayGain);
        bellDelayGain.connect(audioCtx.destination);

        // キラキラ感のあるベルのスケール
        const scale = [
            783.99, 880.00,                                // G5, A5 (中高音)
            1046.50, 1174.66, 1318.51, 1567.98, 1760.00,   // C6, D6, E6, G6, A6 (澄んだ高音)
            2093.00, 2349.32, 2637.02, 3135.96, 3520.00,   // C7, D7, E7, G7, A7 (煌めく超高音)
            4186.01, 4698.63, 5274.04, 6271.93             // C8, D8, E8, G8 (突き抜ける極高音)
        ];
        const starCount = 35;
        
        for (let i = 0; i < starCount; i++) {
            const timeOffset = (i / starCount) * 0.08 + Math.random() * 0.02;
            const freq = scale[Math.floor(Math.random() * scale.length)];
            
            let panner = null;
            try {
                if (audioCtx.createStereoPanner) {
                    panner = audioCtx.createStereoPanner();
                }
            } catch (err) {
                panner = null;
            }
            
            const destNode = panner ? panner : audioCtx.destination;
            if (panner) {
                panner.connect(audioCtx.destination);
                const spread = (Math.random() - 0.5) * 1.95; // 左右にパンを振らす
                panner.pan.setValueAtTime(Math.max(-1.0, Math.min(1.0, basePan + spread)), now + timeOffset);
            }
            
            const duration = 0.05 + Math.random() * 0.07;
            
            // A. 三角波
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(destNode);
            gain.connect(bellDelay); // ディレイバスへ送る
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + timeOffset);
            
            gain.gain.setValueAtTime(0, now + timeOffset);
            gain.gain.linearRampToValueAtTime(0.025, now + timeOffset + 0.0015);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + timeOffset + duration);
            
            // B. 非調和倍音 2.76倍
            const oscMetal = audioCtx.createOscillator();
            const gainMetal = audioCtx.createGain();
            oscMetal.connect(gainMetal);
            gainMetal.connect(destNode);
            gainMetal.connect(bellDelay);
            oscMetal.type = 'sine';
            oscMetal.frequency.setValueAtTime(freq * 2.76, now + timeOffset);
            
            const durMetal = duration * 0.70;
            gainMetal.gain.setValueAtTime(0, now + timeOffset);
            gainMetal.gain.linearRampToValueAtTime(0.015, now + timeOffset + 0.0015);
            gainMetal.gain.exponentialRampToValueAtTime(0.0001, now + timeOffset + durMetal);
            
            // C. 4倍音
            const oscHigh = audioCtx.createOscillator();
            const gainHigh = audioCtx.createGain();
            oscHigh.connect(gainHigh);
            gainHigh.connect(destNode);
            gainHigh.connect(bellDelay);
            oscHigh.type = 'sine';
            oscHigh.frequency.setValueAtTime(freq * 4.0, now + timeOffset);
            
            const durHigh = duration * 0.40;
            gainHigh.gain.setValueAtTime(0, now + timeOffset);
            gainHigh.gain.linearRampToValueAtTime(0.010, now + timeOffset + 0.001);
            gainHigh.gain.exponentialRampToValueAtTime(0.0001, now + timeOffset + durHigh);
            
            // D. 金属製アタック音 5.4倍音
            const hitOsc = audioCtx.createOscillator();
            const hitGain = audioCtx.createGain();
            hitOsc.connect(hitGain);
            hitGain.connect(destNode);
            hitOsc.type = 'sine';
            hitOsc.frequency.setValueAtTime(freq * 5.4, now + timeOffset);
            
            hitGain.gain.setValueAtTime(0, now + timeOffset);
            hitGain.gain.linearRampToValueAtTime(0.020, now + timeOffset + 0.0005);
            hitGain.gain.exponentialRampToValueAtTime(0.0001, now + timeOffset + 0.006);
            
            osc.start(now + timeOffset);
            osc.stop(now + timeOffset + duration + 0.02);
            
            oscMetal.start(now + timeOffset);
            oscMetal.stop(now + timeOffset + durMetal + 0.02);
            
            oscHigh.start(now + timeOffset);
            oscHigh.stop(now + timeOffset + durHigh + 0.02);
            
            hitOsc.start(now + timeOffset);
            hitOsc.stop(now + timeOffset + 0.02);
            
            setTimeout(() => {
                try {
                    osc.disconnect();
                    gain.disconnect();
                    oscMetal.disconnect();
                    gainMetal.disconnect();
                    oscHigh.disconnect();
                    gainHigh.disconnect();
                    hitOsc.disconnect();
                    hitGain.disconnect();
                    if (panner) panner.disconnect();
                } catch(e) {}
            }, (timeOffset + duration + 0.08) * 1000);
        }
        
        setTimeout(() => {
            try {
                sweepOsc1.disconnect();
                sweepOsc2.disconnect();
                sweepFilter.disconnect();
                sweepGain.disconnect();
                if (sweepPanner) sweepPanner.disconnect();
                bellDelay.disconnect();
                bellFeedback.disconnect();
                bellDelayFilter.disconnect();
                bellDelayGain.disconnect();
            } catch(e) {}
        }, 550);
        
    } catch (e) {
        console.warn("大爆発効果音再生エラー:", e);
    }
}`;

    const before = code.substring(0, startIdx);
    const after = code.substring(commentIdx);
    
    code = before + newFunc + '\n\n' + after;
    fs.writeFileSync(targetPath, code, 'utf8');
    console.log('Successfully replaced playMeteorBigExplosionSound index-based');
} else {
    console.error('Error: Indices not found!', { startIdx, endIdx });
}
