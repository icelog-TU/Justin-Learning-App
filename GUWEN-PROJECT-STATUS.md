# 《古文破譯家》目前進度

> 只保存目前狀態、active 主檔與下一步。歷史變更由 Git history 查詢。
> 「草稿完成」不等於「使用者已核准」。
> 最近整理：2026-07-28

## 使用方式

- 新對話只讀本篇一列；不要每次全文載入。
- `active` 是唯一可繼續編寫、核准或交付 App 的版本。
- `archived` 是重寫前或舊上線版，只供追溯。
- `draft-rewrite` 是尚未正式取代 active 的重寫候選。
- 路徑標為「待確認」時停止寫作，請使用者指定 active；不得自行以日期、題數或資料夾位置判斷。

## 當前總覽

| 篇次 | 篇名 | Active 教材主檔 | 目前狀態 | 下一步 |
|---:|---|---|---|---|
| 1 | 王戎不取道旁李 | `lessons/01-guwen-wangrong-rewrite.md` | 20 題縮減重寫版已同步 App | 依實際使用回饋調整 |
| 2 | 司馬光破甕救友 | `02-guwen-simaguang-decoder-content.md` | 全文核准，精簡版 App 已上線 | 依 App 預覽與使用回饋調整 |
| 3 | 刻舟求劍 | `03-guwen-kezhouqiujian-decoder-content.md` | 新版全文 20 題、白話驗證卷軸與徽章收尾均已核准 | 交付正式 App 實作 |
| 4 | 守株待兔 | `04-guwen-shouzhudaitu-decoder-content.md` | 18 題重寫版、收尾與 App 驗收完成 | 依實際使用回饋調整 |
| 5 | 揠苗助長 | `05-guwen-yamiaozhuzhang-decoder-content.md` | 開場及第 1–9 題核准；第 10–12 題草稿待審 | 依序審核第 10–12 題 |
| 6 | 掩耳盜鐘 | `06-guwen-yanerdaozhong-decoder-content.md` | 以舊版為底逐題重審；第 1–2 題已核准，開場仍待審；第 3–5 題精簡修正版待審；第 6–21 題及收尾保留舊版待重審 | 審核第 3–5 題，再從第 6 題起依新規則壓到 20 題內 |
| 7 | 鄭人買履 | `07-guwen-zhengrenmailv-decoder-content.md` | 以舊版為底進行實測後重寫；第 1–2 題精簡草稿待審，第 3–20 題與收尾仍沿用原核准版本 | 審核第 1–2 題，再依孩子回饋繼續減量 |
| 8 | 長竿入城 | `08-guwen-changganrucheng-decoder-content.md` | 任務開場及第 1–9 題核准；第 10 題待審 | 審核第 10 題 |
| 9 | 楊氏之子 | `09-guwen-yangshizi-decoder-content.md` | 第 1–7 題核准；開場及第 8–9 題待審 | 審核開場、第 8–9 題 |

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
