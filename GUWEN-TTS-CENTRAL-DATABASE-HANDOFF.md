# 《古文破譯家》多音字中央資料庫交接（歷史系統）

> 停用日期：2026-07-28
> 狀態：舊系統保留，但不再屬於教材或 App 的正式交付流程。

## 現行決策

使用者已取消「找多音字 → 建 catalog → 部署實聽台 → 逐句真人實聽 →
中央回傳 → 第二階段讀回」的獨立流程。

因此，新篇與既有篇章的日常工作：

- 不執行 `npm run tts:audit:pull` 或 `npm run tts:audit:reusable`；
- 不新增或更新 `src/data/guwenPronunciationAudit.ts`；
- 不要求開啟 `/#/tts-audit`；
- 不等待任何中央結果才實作、commit、push 或部署；
- 不把缺少候選、pending、stale、missing 或 orphan 視為交付阻礙。

## 取代流程

排版與發音直接在 `/#/guwen-draft-preview` 一起審核。預覽與正式 App
共用 `speak()`／`ttsSafe()`，並提供暫停、繼續與停止。發現實際念錯時，
以具體句子為範圍修正 TTS 行為、加入防誤傷測試，且不得更改孩子看到的
古文原文或真實古文線索。

## 歷史資料保留

舊 `/#/tts-audit`、catalog、Firestore `families/GUWENTTS-*` 文件、
本機離線備份、產生器、測試與 stage 報告暫不刪除，以免破壞既有紀錄。
除非使用者明確要求檢查、匯出、修復或移除該舊系統，agent 不得主動擴充
或重新啟動它。

舊 schema、提交與逐目標結果的完整技術歷史仍可由 Git 版本紀錄查閱；
本檔不再承載強制流程或驗收門檻。
