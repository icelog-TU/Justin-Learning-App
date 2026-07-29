# 古文 App TTS 規則

## 何時讀取

只在修改朗讀內容、播放控制、發音提示、語音計時器或 `src/lib/speech.ts` 的 `ttsSafe()` 時讀。

## 現行流程

- 在 `/#/guwen-draft-preview` 與排版一起實聽。
- 正式實作後在孩子 App 複核相同播放路徑。
- 不掃描全文多音字、不建 catalog、不開舊實聽台、不拉中央結果、不執行第一／第二階段。

## 播放邊界

- 只播放孩子端核准為可播放的欄位。
- 出處、成人資料與只顯示內容不朗讀。
- 切換篇目、題目、狀態或離頁時，取消目前語音與尚未觸發的延遲 timer。
- 長段提供暫停、重新開始與停止。瀏覽器 resume 不可靠時，從當前單元開頭重新播放。
- 選項各自提供播放按鈕，但不必加入題幹自動播放序列。

## 發音修正

1. 先記錄實際送入 TTS 的完整句子與錯誤位置。
2. 保留畫面與資料中的古文原字。
3. 在 `ttsSafe()` 或該核准播放單元中，以完整片語縮小替換範圍。
4. 優先用 lookaround 或完整詞語；只有目標 locale 中沒有合法例外時才考慮全字替換。
5. 同時測試目標句與不應受影響的常見用法。
6. 在 `ttsSafe()` 活註解記錄原因、正確讀音、錯誤讀音、替代字與 scope。

## Pronunciation cue

`PronunciationCue` and `StepPronunciationCues` are legacy side-note fields. Do not add them for new guwen lesson implementation.

As of 2026-07-29, pronunciation explanations belong only in the core answer (`correctFeedback`) as normal approved text. Do not extract "念作／唸作／發音同" phrases or Zhuyin from Markdown into separate cue cards, per-sentence annotations, or extra playback lines. If the core answer contains a pronunciation explanation, display and play it once as part of the core answer.

TTS-only fixes still belong in `ttsSafe()` or the shared speech path. Keep those fixes invisible, narrow in scope, and covered by nearby regression checks.

## 答對後語音

- 答對後立即播放短成功音效及獎勵，獎勵效果結束才自動播放完整核心解答。
- 核心播放中可暫停、繼續、重新開始，或直接進入下一題；詳解與下一題不得被語音播放鎖住。
- 語音不可用或未正常結束時，核心文字與後續按鈕仍照常顯示，不要求人工讀完確認。
- 詳解只在孩子選擇查看後展開，不自動播放；詳解播放只包含 `explanation`。
- 不重播核心解答。
- 以 step id 防止答對事件重複發獎；`onend` 不得發獎或控制後續操作。換題時清除語音與相關 timer。
