const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'app.js');
let content = fs.readFileSync(targetFile, 'utf8');

// 褒める言葉の定義からshowComboの末尾までをキャプチャする正規表現
const regex = /\/\/ 褒める言葉の定義[\s\S]*?void el\.offsetWidth;[\s\S]*?el\.classList\.add\('show'\);\s*\}/;

if (!regex.test(content)) {
    console.error("Error: combo praise definition not found in app.js");
    process.exit(1);
}

const replacement = `// 褒める言葉の定義（日本語＋英語）
const COMBO_PRAISES = [
    { jp: "いいぞ！", en: "Nice!" },
    { jp: "すごい！", en: "Amazing!" },
    { jp: "その調子！", en: "Keep it up!" },
    { jp: "すてき！", en: "Lovely!" },
    { jp: "さすが！", en: "Brilliant!" },
    { jp: "お見事！", en: "Well done!" },
    { jp: "バッチリ！", en: "Perfect!" },
    { jp: "心地いい！", en: "So soothing!" },
    { jp: "癒やされる！", en: "So relaxing!" },
    { jp: "素晴らしい！", en: "Wonderful!" },
    { jp: "いい波きてる！", en: "Great flow!" },
    { jp: "天才！", en: "Genius!" },
    { jp: "気持ちいい！", en: "Feels great!" },
    { jp: "バツグン！", en: "Excellent!" }
];

const SPECIAL_PRAISES = [
    { jp: "✨奇跡的！✨", en: "✨Miraculous!✨" },
    { jp: "🌟超リフレッシュ！🌟", en: "🌟Super Refreshed!🌟" },
    { jp: "🎉パーフェクト！🎉", en: "🎉Perfect Combo!🎉" },
    { jp: "💖極上の癒やし！💖", en: "💖Ultimate Bliss!💖" },
    { jp: "🚀神業タップ！🚀", en: "🚀Godlike Tap!🚀" },
    { jp: "🌈ビューティフル！🌈", en: "🌈Beautiful!🌈" },
    { jp: "💫大宇宙の調和！💫", en: "💫Cosmic Harmony!💫" },
    { jp: "💎至高の輝き！💎", en: "💎Supreme Radiance!💎" },
    { jp: "🍀幸せいっぱい！🍀", en: "🍀Full of Happiness!🍀" }
];

let lastPraiseIdx = -1;
let lastSpecialPraiseIdx = -1;

// コンボ数に応じて褒める言葉（日本語＋英語）を画面中央に表示
function showCombo(count) {
    const el = document.getElementById('combo-display');
    if (!el) return;
    
    let praise = null;
    if (count % 10 === 0) {
        // 10タップごとの特別な言葉
        let idx;
        do {
            idx = Math.floor(Math.random() * SPECIAL_PRAISES.length);
        } while (idx === lastSpecialPraiseIdx && SPECIAL_PRAISES.length > 1);
        
        lastSpecialPraiseIdx = idx;
        praise = SPECIAL_PRAISES[idx];
        el.classList.add('special');
    } else {
        // 通常の褒める言葉
        let idx;
        do {
            idx = Math.floor(Math.random() * COMBO_PRAISES.length);
        } while (idx === lastPraiseIdx && COMBO_PRAISES.length > 1);
        
        lastPraiseIdx = idx;
        praise = COMBO_PRAISES[idx];
        el.classList.remove('special');
    }
    
    // HTML構造にして日本語と英語を併記
    el.innerHTML = \`<div class="combo-jp">\${praise.jp}</div><div class="combo-en">\${praise.en}</div>\`;
    
    el.classList.remove('show');
    // リフローを強制してアニメーションを再トリガー
    void el.offsetWidth;
    el.classList.add('show');
}`;

const updatedContent = content.replace(regex, replacement);
fs.writeFileSync(targetFile, updatedContent, 'utf8');
console.log("Success: app.js has been updated with English praises!");
