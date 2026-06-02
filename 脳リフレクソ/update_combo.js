const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'app.js');
let content = fs.readFileSync(targetFile, 'utf8');

// 正規表現で元のshowCombo定義を検索
const regex = /function showCombo\s*\(\s*count\s*\)\s*\{[\s\S]*?void el\.offsetWidth;[\s\S]*?el\.classList\.add\('show'\);\s*\}/;

if (!regex.test(content)) {
    console.error("Error: showCombo function not found in app.js");
    process.exit(1);
}

const replacement = `// 褒める言葉の定義
const COMBO_PRAISES = [
    "いいぞ！", "すごい！", "その調子！", "すてき！", "さすが！",
    "お見事！", "バッチリ！", "心地いい！", "癒やされる！", "素晴らしい！",
    "いい波きてる！", "天才！", "気持ちいい！", "バツグン！"
];

const SPECIAL_PRAISES = [
    "✨奇跡的！✨", "🌟超リフレッシュ！🌟", "🎉パーフェクト！🎉",
    "💖極上の癒やし！💖", "🚀神業タップ！🚀", "🌈ビューティフル！🌈",
    "💫大宇宙の調和！💫", "💎至高の輝き！💎", "🍀幸せいっぱい！🍀"
];

let lastPraiseIdx = -1;
let lastSpecialPraiseIdx = -1;

// コンボ数に応じて褒める言葉を画面中央に表示
function showCombo(count) {
    const el = document.getElementById('combo-display');
    if (!el) return;
    
    let text = "";
    if (count % 10 === 0) {
        // 10タップごとの特別な言葉
        let idx;
        do {
            idx = Math.floor(Math.random() * SPECIAL_PRAISES.length);
        } while (idx === lastSpecialPraiseIdx && SPECIAL_PRAISES.length > 1);
        
        lastSpecialPraiseIdx = idx;
        text = SPECIAL_PRAISES[idx];
        el.classList.add('special');
    } else {
        // 通常の褒める言葉
        let idx;
        do {
            idx = Math.floor(Math.random() * COMBO_PRAISES.length);
        } while (idx === lastPraiseIdx && COMBO_PRAISES.length > 1);
        
        lastPraiseIdx = idx;
        text = COMBO_PRAISES[idx];
        el.classList.remove('special');
    }
    
    el.textContent = text;
    el.classList.remove('show');
    // リフローを強制してアニメーションを再トリガー
    void el.offsetWidth;
    el.classList.add('show');
}`;

const updatedContent = content.replace(regex, replacement);
fs.writeFileSync(targetFile, updatedContent, 'utf8');
console.log("Success: app.js has been updated successfully!");
