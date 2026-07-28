# Markdown v1 → `GuwenLesson` 對照

## 何時讀取

只在新增／重建 lesson data、檢查 Markdown 與 App 欄位一致性，或修改 parser／schema 時讀。一般 UI、TTS 或教材文案任務不讀。

先確認主檔通過 `GUWEN-MARKDOWN-FORMAT.md`；歷史別名只供 parser 相容，不得成為新教材輸出格式。

## 篇章欄位

| Markdown v1 | App 欄位 |
|---|---|
| `# 古文破譯家｜《篇名》教材主檔` | `title` |
| `## 篇名與出處` | `source` 與必要 metadata |
| `## 本課採用原文` | `fullText`，逐字保留 |
| `## 教材編輯用分句` | `sentences`；檢查接合後等於原文 |
| `### 第一頁｜請古文破譯家接受委託` | 任務接受畫面 |
| `### 第二頁｜聆聽本篇原文` | 原文聆聽畫面 |

## 題目共同欄位

| Markdown v1 | App 欄位 |
|---|---|
| `# 第 N 題（狀態）｜題名` | 一個或多個 step；依實際互動判斷 |
| `## 本輪處理的句子` | `targetSentence` |
| `## 孩子端｜麻煩古文破譯家幫忙` | `intro` |
| `## 請古文破譯家提交解法` | `question` |
| `## 選項` | `options`，照核准順序 |
| `## 正確答案` | `correctIndex`，轉為零起算 |
| `## 答對回饋` | `correctFeedback`；完整欄位即核心解答，不以空行切出詳解 |
| `## 第一次答錯提示` | `retryHint` |
| `## 詳解` | `explanation`；獨立、可跳過的補充內容 |
| `## 本題取得的密碼鑰匙（作答後才顯示）` | `keyAwarded` |
| `## 放回原文` | 必要時形成該 step 的 incremental `finalDraftLine` |
| `## 成人編輯備註（不進入孩子端、不朗讀）` | 不進 child-facing lesson data |

`本篇完整原文（成人審稿用）` 是每題的成人定位內容，不重複建立成 App step。

## 古文證據題

`### 線索一／二` 分別映射 `ClassicalClue`：

- blockquote 原文 → `text`
- 目標片語 → `highlight`
- `#### 已破解為` → `unlockedMeaning`
- `#### 出處（成人資料）` → `source`

若主檔刻意省略「已破解為」，省略 `unlockedMeaning` 欄位，不填空字串。不得因實作者覺得方便而補翻譯。

## 重建與 reveal

- 有選項、正解、答錯提示：`ReconstructionStep`。
- 明確說不另設作答、只有繼續按鈕：`RevealStep`。
- `## 已取得的密碼鑰匙` 表格 → `keys`，逐字複製核准文字。

不要只看「重建／組合」標題決定型別。

## 一題拆成多個 App step

若同一教材題號實際包含兩個獨立作答時刻，例如先比較跨篇線索、再回本篇應用，schema 的一個 step 無法表達兩組問題時，可以拆成兩個有 prerequisites 的 App step。這是畫面結構調整，不得改寫或省略核准文字。

## Closing

- 有拖放卡與唯一順序 → `sequenceOrderingClosing`
- 有單選正解，答對後才揭示因果鏈 → `causalChainClosing`
- 嚴格多選文章明寫內容 → `evidenceMultiSelectClosing`

一篇可有任意組合。若排序題答對後還要顯示因果說明，使用 `SequenceOrderingClosing.explanation`，不要為同一內容重建第二個 display-only closing。

## `finalDraftLine`

只保存本 step 新增加的句子片段，不保存每題累積全文。只有主檔實際提供「放回原文」且該步驟對完成敘事有新增內容時才設定。

## `finalVerification`

- `translation`：核准完整白話。
- `guideLine`：驗證提示與必須顯示的證據邊界。
- `comparisonRows`：使用已核准的古文片段與白話建立簡短對照，不新增教學結論。
- `completionFeedback`：使用核准短版鼓勵。
- prerequisites：所有必要 steps，再依序加入存在的 closing ids。

## 實作後核對

- `sentences` 與 `fullText` 字符一致；
- step id 唯一，prerequisite 無缺漏；
- 每個 graded step 的選項與正解一致；
- source、成人／孩子邊界與可播放邊界完整；
- `finalDraftLine` 無累積重複；
- 最終白話在完成前不可見。
