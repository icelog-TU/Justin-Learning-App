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

| 篇次 | 篇名 | Active 教材主檔 | 狀態依據（保留原紀錄） | 雙重 AI 審核 | 人工審核 | 正式 App | 下一步 |
|---:|---|---|---|---|---|---|---|
| 1 | 王戎不取道旁李 | `lessons/01-guwen-wangrong-rewrite.md` | 2026-07-29 最新核准版已同步正式 App | 現有紀錄未註明 | 現有紀錄未註明 | Active 最新核准版已上線 | 依實際使用回饋調整 |
| 2 | 司馬光破甕救友 | `02-guwen-simaguang-decoder-content.md` | 全文核准，最新重寫版 App 已上線 | 現有紀錄未註明 | 現有紀錄未註明 | Active 最新重寫版已上線 | 依 App 預覽與使用回饋調整 |
| 3 | 刻舟求劍 | `03-guwen-kezhouqiujian-decoder-content.md` | 2026-07-29 全篇完整通過；任務開場、第 1–20 題、白話驗證卷軸與徽章收尾均已核准並同步正式 App | 現有紀錄未註明 | 現有紀錄未註明 | Active 最新核准版已上線 | 依實際使用回饋調整 |
| 4 | 守株待兔 | `04-guwen-shouzhudaitu-decoder-content.md` | 新版任務開場、第 1–18 題、白話驗證卷軸與徽章收尾均已完成雙重 AI 審稿及使用者人工成人 APP 預覽測試，全文核准；新版已同步正式 App | 已完成 | 已完成（成人 App 預覽測試） | Active 最新核准版已上線 | 依正式 App 線上驗收與實際使用回饋調整 |
| 5 | 揠苗助長 | `05-guwen-yamiaozhuzhang-decoder-content.md` | 新版任務開場、第 1–17 題、白話驗證卷軸與完成徽章均已完成雙重 AI 審核及使用者人工成人 APP 預覽測試，全文核准；新版已同步正式 App | 已完成 | 已完成（成人 App 預覽測試） | Active 最新核准版已上線 | 依正式 App 線上驗收與實際使用回饋調整 |
| 6 | 掩耳盜鐘 | `06-guwen-yanerdaozhong-decoder-content.md` | 新版任務開場、第 1–20 題、白話驗證卷軸、完成鼓勵與徽章收尾均已完成雙重 AI 審核及使用者人工成人預覽 APP 測試，全文核准；Active 新版已接入正式 App，待 GitHub Pages 部署驗收 | 已完成 | 已完成（成人預覽 App 測試） | Active 最新核准版已接入正式 App | 依正式 App 線上驗收與實際使用回饋調整 |
| 7 | 鄭人買履 | `07-guwen-zhengrenmailv-decoder-content.md` | 新版任務開場、第 1–20 題、白話驗證卷軸與徽章收尾均已完成雙重 AI 審核及使用者人工審核，全文核准並同步正式 App | 已完成 | 已完成 | Active 最新核准版已上線 | 依實際使用回饋調整 |
| 8 | 長竿入城 | `08-guwen-changganrucheng-decoder-content.md` | 新版任務開場、第 1–20 題、白話驗證卷軸與徽章收尾均已完成雙重 AI 審核及使用者人工審核，全文核准並同步正式 App | 已完成 | 已完成 | Active 最新核准版已上線 | 依實際使用回饋調整 |
| 9 | 楊氏之子 | `09-guwen-yangshizi-decoder-content.md` | 重寫時間線已重啟；新版開場與第 1–20 題已完成獨立 AI 全文審稿並依意見修訂，全部仍待使用者人工審核 | 未完成（已完成一輪獨立 AI 全文審稿並修訂） | 未完成（待使用者逐題人工審核） | 尚未上線 | 使用成人預覽 App 逐題人工審核 |
| 10 | 自相矛盾 | `10-guwen-zixiangmaodun-decoder-content.md` | 全文草稿已完成一輪獨立 AI 全文審稿並依意見修訂；全部仍待使用者人工審核，尚未核准 | 未完成（已完成一輪獨立 AI 全文審稿並修訂） | 未完成（待使用者人工審核） | 尚未上線 | 使用成人預覽 App 逐題人工審核 |
| 11 | 愚人食鹽 | `11-guwen-yurenshiyan-decoder-content.md` | 依核准藍圖完成任務開場、第 1–21 題、白話驗證卷軸與徽章收尾的全文草稿；全部待審，尚未核准 | 未完成（全部待審） | 未完成 | 尚未上線 | 交由另一個 AI 全文獨立審稿，再依審稿意見修訂 |

### 三階段欄位判讀規則

- 三個階段都只描述該列 `Active 教材主檔` 的目前版本；舊版曾經通過或上線，不得算到重寫後的 Active 新版。
- `現有紀錄未註明` 表示目前資料不足，既不等於「已完成」，也不等於「未完成」。不得因為內容已核准或 App 已上線，反推雙重 AI 審核或人工審核已完成。
- `雙重 AI 審核` 只有在現有紀錄明確寫出雙重／兩個 AI 審核均完成時才能標為 `已完成`；只完成一輪獨立 AI 審稿仍標為 `未完成`，並在括號內保留實際進度。
- `人工審核` 只有在現有紀錄明確寫出使用者人工審核或成人 App 預覽測試完成時才能標為 `已完成`。
- `正式 App` 固定區分 `尚未上線`、`舊版已上線；Active 新版尚未上線`、`Active 最新核准版已上線`；不得只寫「已上線」而不說明是哪個版本。
- 宣布重寫或更換 Active 主檔時，為新版本重新判定三個階段；舊版可以繼續在線上，但只能記為舊版，不得沿用舊版的審核完成狀態。
- 更新拆分欄位時，同步保留或更新「狀態依據」與「下一步」，使後續對話能追查判定來源，不得只改勾選結果。

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
