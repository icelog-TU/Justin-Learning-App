# 《古文破譯家》目前進度

> 只保存目前狀態、active 主檔與下一步。歷史變更由 Git history 查詢。
> 「草稿完成」不等於「使用者已核准」。
> 最近整理：2026-07-30

## 使用方式

- 新對話只讀本篇一列；不要每次全文載入。
- `active` 是唯一可繼續編寫、核准或交付 App 的版本。
- `archived` 是重寫前或舊上線版，只供追溯。
- `draft-rewrite` 是尚未正式取代 active 的重寫候選。
- 路徑標為「待確認」時停止寫作，請使用者指定 active；不得自行以日期、題數或資料夾位置判斷。

## 當前總覽

| 篇次 | 篇名 | Active 教材主檔 | 目前狀態 | 下一步 |
|---:|---|---|---|---|
| 1 | 王戎不取道旁李 | `lessons/01-guwen-wangrong-rewrite.md` | 2026-07-29 最新核准版已同步正式 App | 依實際使用回饋調整 |
| 2 | 司馬光破甕救友 | `02-guwen-simaguang-decoder-content.md` | 全文核准，最新重寫版 App 已上線 | 依 App 預覽與使用回饋調整 |
| 3 | 刻舟求劍 | `03-guwen-kezhouqiujian-decoder-content.md` | 2026-07-29 全篇完整通過；任務開場、第 1–20 題、白話驗證卷軸與徽章收尾均已核准並同步正式 App | 依實際使用回饋調整 |
| 4 | 守株待兔 | `04-guwen-shouzhudaitu-decoder-content.md` | 新版任務開場、第 1–18 題、白話驗證卷軸與徽章收尾均已完成雙重 AI 審稿及使用者人工成人 APP 預覽測試，全文核准；正式 App 目前仍為既有版本 | 將新版已核准教材建置上傳至正式 App |
| 5 | 揠苗助長 | `05-guwen-yamiaozhuzhang-decoder-content.md` | Claude Code 第一輪全文審稿後修訂稿：第 1–9 題已統一標準欄位，第 6 題《韓非子・初見秦》引文已逐字修正，正解位置已小幅調整；仍屬草稿待審 | 交由 Claude Code 複審本輪修改，再交使用者人工審核 |
| 6 | 掩耳盜鐘 | `06-guwen-yanerdaozhong-decoder-content.md` | 新版 20 題藍圖已核准並完成全篇草稿；第 1–5 題及第 7–12 題已核准，第 6 題、開場、第 13–20 題與收尾待審；正式 App 維持既有版本 | 交由 Claude Code 進行全篇獨立 AI 審稿，再依審稿意見修訂 |
| 7 | 鄭人買履 | `07-guwen-zhengrenmailv-decoder-content.md` | 新版任務開場、第 1–20 題、白話驗證卷軸與徽章收尾均已完成雙重 AI 審核及使用者人工審核，全文核准並同步正式 App | 依實際使用回饋調整 |
| 8 | 長竿入城 | `08-guwen-changganrucheng-decoder-content.md` | 新版任務開場、第 1–20 題、白話驗證卷軸與徽章收尾均已完成雙重 AI 審核及使用者人工審核，全文核准並同步正式 App | 依實際使用回饋調整 |
| 9 | 楊氏之子 | `09-guwen-yangshizi-decoder-content.md` | 重寫時間線已重啟；依核准藍圖完成新版開場與第 1–20 題全文草稿，全部待審 | 交由 Claude Code 全文審稿，再依審稿意見修訂 |

## 已知版本關係

### 第一篇

- `lessons/01-guwen-wangrong-rewrite.md` 是目前 active 重寫版。
- 更早題數與舊 App 版本只作歷史比較，不得倒灌核准狀態或鑰匙。

### 第二篇

- `02-guwen-simaguang-decoder-content.md` 是 active 主檔。
- 早期 skill 交接副本已從活躍 skill 移除；不得用歷史副本取代 active 主檔。

### 第八篇

- `08-guwen-changganrucheng-decoder-content.md` 是 active 主檔。
- 原 `lessons/` 副本的較新教材內容已遷入 active 主檔並轉為 Markdown v1；重複副本已移除。

## 共用資料狀態

| 資料 | 現況 |
|---|---|
| Markdown 格式 | `GUWEN-MARKDOWN-FORMAT.md` v1 |
| 教材設計標準 | `design-standard.md` |
| 鑰匙庫 | `guwen-decoder-learned-keys.md`；按篇名或字詞搜尋 |
| 教材設計 skill | `.claude/skills/design-guwen-decoding/SKILL.md` |
| App 實作 skill | `.claude/skills/implement-guwen-app/SKILL.md` |
| 多音字獨立 audit | 已取消；歷史資料不得作交付門檻 |

## 更新規則

只在以下事件更新本檔：

- 建立新篇或宣布重寫；
- active／archived／draft-rewrite 身分改變；
- 核准邊界、下一步或 App 狀態改變；
- 教材主檔路徑改變。

不要在本檔貼完整題目、逐題討論、catalog 統計、中央回傳結果或長篇更新紀錄。
