# 第四篇《守株待兔》多音字第二階段正式結案

> lessonId：`shou-zhu-dai-tu`
> 教材主檔：`04-guwen-shouzhudaitu-decoder-content.md`
> 完成日期：2026-07-27

## 中央讀回

- 正式 catalog：35 個完整代表句、71 個不重複讀音群組。
- 中央結果：35／35 個句項完成。
- target 結果：71／71 念對、0 念錯。
- pending：0。
- stale：0。
- missing：0。
- orphan：0。
- 實聽環境：Android Chrome 150、系統預設 `zh-TW` voice；中央紀錄中的 voice 名稱為 `unresolved_default`。

## 正式教材結論

- 71 個讀音群組全部不加注音。
- 沒有需要加入孩子端的讀音提示或 TTS 修音。
- 本階段不修改第四篇教材主檔，也不提前進行第四篇完整 App 實作。

## 後續跨篇免重聽

使用者於本篇實聽完成後核准跨篇減量：未來篇章先以
`npm run tts:audit:reusable` 讀取中央有效念對群組。只有字形、指定讀音、
影響讀音的詞義／詞組用法、`ttsBehavior` 與 voice／裝置條件全部相同時，
才可記為「跨篇沿用／免重聽」。

本篇既有 35 筆真人實聽結果完整保留。跨篇沿用只會減少未來新篇送到實聽台
的候選，不會偽造新篇的真人回傳；任一群組或環境條件改變即重新送測。
