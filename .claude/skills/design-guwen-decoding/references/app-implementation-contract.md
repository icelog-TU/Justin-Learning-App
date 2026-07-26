# 古文破譯家 App 實作交接規格

## 目錄

1. 適用範圍
2. 實作前輸入
3. 來源優先順序
4. 內容分類與顯示權限
5. 最小邏輯資料契約
6. 互動狀態與解鎖順序
7. 畫面與回饋規則
8. 古文硬限制與現代文提案邊界
9. 實作流程
10. 驗收測試
11. 交付報告
12. 建議交給 coding agent 的任務文字

## 1. 適用範圍

本文件用於把已經由教材設計者核准的古文 Markdown 教材放入既有 App。Coding agent 不得改寫古文原文或古文線索；但可以針對白話說明、題目形式與互動方式提出更好的方案，交由使用者決定。

若使用者仍在討論古文線索、選項、詳解或斷句，回到 curriculum design mode。可以繼續實作已核准的基準版本，但未核准的新方案不得直接進入 App。

## 2. 實作前輸入

開始修改程式以前，必須具備：

- 已核准的教材 Markdown；
- App 專案原始碼；
- 專案內的代理人指示，例如 `AGENTS.md`、開發規範或測試命令；
- 現有教材資料模型、題目元件、進度狀態與路由方式。

若缺少教材檔或 App 專案，停止並要求補充。不得僅憑 skill 中的範例重建正式教材。

## 3. 來源優先順序

發生衝突時依照以下順序判定：

1. 使用者在目前任務中的明確指示；
2. 已核准教材 Markdown 的古文原文、古文線索、事實內容與目前基準版本；
3. 本 skill 的教育與實作規則；
4. App 既有的程式架構與視覺慣例；
5. coding agent 自行提出的改善建議。

既有資料模型若無法表達教材需要，應擴充模型或增加轉接層，不得為了遷就模型而刪除古文證據鏈、未知邊界或白話驗證流程。

Coding agent 若認為現代中文或題目形式可以改善，必須把建議和基準版本分開呈現。建議本身的優先級低於已核准版本；只有使用者明確接受後，才能成為新的實作來源。

## 4. 內容分類與顯示權限

將 Markdown 內容分成以下類別：

| 類別 | 例子 | 孩子端顯示 |
|---|---|---|
| `article_metadata` | 篇名、原文、出處 | 依產品設計顯示 |
| `editorial_note` | 斷句分析、版本比較、教材判讀佐證 | 禁止顯示 |
| `evidence_question` | 兩條古文線索、假說選項、詳解 | 顯示 |
| `reconstruction_question` | 密碼鑰匙、整句組合 | 顯示 |
| `local_inference` | 由本篇情境補充的推論 | 顯示並標為推論 |
| `story_reasoning` | 事件順序、因果、證據邊界 | 顯示 |
| `translation_verification` | 破譯稿、白話驗證卷軸 | 完成全文後才顯示 |
| `implementation_constraint` | Claude Code 不得改動事項 | 禁止顯示 |

線索出處必須保留在資料中。是否在孩子主畫面直接展開，可依既有 UI 決定；至少應能在詳情、教師模式或資料層追溯。

## 5. 最小邏輯資料契約

優先使用專案既有型別。若既有型別不足，至少要能表達下列邏輯欄位；不要求照抄名稱或使用 TypeScript。

```ts
type Lesson = {
  id: string;
  title: string;
  source: string;
  originalText: string;
  segments: string[];
  steps: LessonStep[];
  finalTranslation: string;
  finalVerification: FinalVerification;
};

type PronunciationAuditCatalogItem = {
  id: string;
  lessonId: string;
  questionId: string;
  speechUnitId: string;
  text: string;
  targets: Array<{
    character: string;
    occurrence: number;
    zhuyin: string;
    homophoneCue: string;
    usage: string;
  }>;
};

type StepBase = {
  id: string;
  type:
    | "evidence_question"
    | "reconstruction_question"
    | "local_inference"
    | "story_reasoning";
  order: number;
  prerequisiteIds: string[];
  sourceSentence?: string;
  goal: string;
  intro: string;
};

type ClassicalClue = {
  text: string;
  unlockedMeaning: string;
  source: string;
  isExcerpt: boolean;
};

type Option = {
  id: string;
  text: string;
};

type Question = {
  prompt: string;
  options: [Option, Option, Option];
  correctOptionId: string;
  correctFeedback: string;
  retryHint: string;
  explanation: string;
  uncertainty?: string;
};

type EvidenceQuestionStep = StepBase & {
  type: "evidence_question";
  target: string;
  clues: [ClassicalClue, ClassicalClue];
  question: Question;
  keysAwarded?: DecodingKey[];
};

type ReconstructionQuestionStep = StepBase & {
  type: "reconstruction_question";
  keys: DecodingKey[];
  question: Question;
};

type DecodingKey = {
  code: string;
  decodedEvidence: string;
};

type FinalVerification = {
  prerequisiteStepIds: string[];
  decodedDraft: string;
  unlockLabel: string;
  translation: string;
  comparisonRows?: Array<{
    decodedEvidence: string;
    vernacularExpression: string;
    relationship: string;
  }>;
  completionFeedback: string;
};
```

必要約束：

- `id` 唯一且穩定，不得用陣列索引代替；
- 每題恰有三個選項與一個正解；
- 正解使用 `correctOptionId`，不得依賴「第幾個選項」的硬編碼；
- 古文線索、已破解白話、來源與是否節錄必須分欄保存；
- `uncertainty` 必須可顯示，不能併入正解後遺失；
- 編輯者備註不得打包成孩子端 lesson step；
- 最終白話文必須是受條件控制的欄位，不能出現在初始畫面資料中而被 UI 提前渲染。
- 每題編寫時先掃描多音字；全篇所有孩子端朗讀文字完成後，再做一次獨立、完整的全篇掃描。正式 catalog 必須涵蓋每個 exact playable utterance 中全部多音字的每個具體出現位置，不得只收 agent 判斷可能念錯者。
- 全篇掃描結果要一次批次加入 `src/data/guwenPronunciationAudit.ts`；同一完整整句有多個多音字時建立一個 item、分列 `targets[]`。部署並開啟正式 `/#/tts-audit` 後，才算整批出現在網頁與中央 catalog。
- 每個待實聽語音單元先加入 `src/data/guwenPronunciationAudit.ts`，再交由 `/#/tts-audit` 在目標裝置播放；臨時貼入網頁的句子只算待分類，不算正式建檔。
- 實聽台選擇「念對／念錯」後必須寫入獨立的 Firestore 多音字資料庫並顯示回傳成功或失敗；localStorage 只作離線備份，不得當成唯一結果來源。
- 只有使用者可以在孩子實際裝置親耳聽完後選擇「念對／念錯」。Coding agent、自動測試與捕捉到的 TTS 文字都不能驗證可聽見的發音，不得代填結果。
- App 實作或教材交付前執行 `npm run tts:audit:pull`。中央確認念對者不建立孩子端提示；中央確認念錯者在每個受影響的朗讀位置，緊接完整整句另顯示一行正確讀音，不改寫原句。
- 完整語音文字、TTS 輸入或目標字出現位置改變時，舊實測紀錄失效，必須重新建檔與實聽。
- catalog 與 result 必須保存 exact `displayText`、`ttsInput`、`auditRevision`、`targetFingerprint` 與 `utteranceFingerprint`；只有全部相符的結果才可產生教材結論，舊結果保留但列為待複驗。
- 正式 App 與實聽台必須共用同一個 zh-TW voice 選擇函式；result 保存實際 voice name、voiceURI、lang 與 default。瀏覽器未提供 voice 清單時必須標記為未解析系統預設。
- 臨時貼入實聽台的「待分類」句子只作本機測試，不得寫入中央正式 catalog；先加入 `src/data/guwenPronunciationAudit.ts` 才能中央回傳。
- 中央歷史可以日後用來統計經常念對的字、句型或 voice，但目前不得形成跨句永久白名單。只有 exact utterance、TTS input、目標位置、revision 與適用語音環境相符的有效結果才能沿用；免測政策必須另行實作並由使用者核准。

## 6. 互動狀態與解鎖順序

每個題目至少支援以下狀態：

```text
locked → available → attempted_wrong → solved
```

行為規則：

1. `locked`：先備題尚未完成，不可進入。
2. `available`：先顯示引導語與兩條古文線索，再顯示問題與選項。
3. `attempted_wrong`：顯示 `retryHint`，保留三個選項供再次比較；不得直接標示正解。
4. `solved`：顯示 `correctFeedback`，允許展開完整 `explanation`，並發放密碼鑰匙。
5. 完成目前短句後，把破解結果放回連續原文，再解鎖下一步。
6. 只有 `finalVerification.prerequisiteStepIds` 全部完成，才能解鎖白話驗證卷軸。

若現有 App 支援作答次數上限，達上限後的行為仍不得跳過證據解釋。可以在完整比較後提供協助，但不能在第一次答錯時直接公布答案。

## 7. 畫面與回饋規則

- 一個畫面只完成一個推理動作。
- 題目難度來自比較古文，不來自長指令或同屏塞入過多文字。
- 古文線索必須出現在選項之前。
- 已破解白話只解鎖線索句，不得提前翻譯目標句。
- 詳解先分析兩條線索的畫面，再談共同特徵，最後才命名暫定意思。
- `retryHint` 指向應重新比較的證據，不說答案。
- 正解位置依教材原順序保存，不因元件習慣而全部移到同一位置。
- 不用顏色、ARIA 標籤、測試屬性或 DOM 順序提前洩漏正解。
- 成人斷句討論、品質備註與實作限制不能出現在孩子畫面。
- 白話文不是一般答案頁；它是全文完成後的驗證卷軸。
- 使用 AI 角色文字時，讓 AI 表示「我找到線索，需要你比較」，不要假裝已知答案卻故意考孩子。

## 8. 古文硬限制與現代文提案邊界

### 8.1 不可自行改寫的古文內容

以下內容屬於硬限制：

- 古文全文的字詞與語序；
- 跨文本古文線索的字詞與語序；
- 古文出處、作者、篇名與是否節錄的事實；
- 已確認的文本版本；
- 古文證據真正能支持的意思與推論邊界。

實作時可以做字串跳脫、換行、Markdown 轉換與不改變文字的段落拆分。不得把古文改成較容易的古文、仿古文、現代文，或用同義詞替換。

若懷疑古文有錯字、異文、斷句或來源問題：

1. 保留目前基準版本；
2. 提供可查證的版本證據；
3. 清楚標示這是文本校勘建議；
4. 等待使用者決定，不得自行換字。

### 8.2 可以提出改善建議的內容

Coding agent 可以主動檢視並提出：

- 已破解線索的白話說明；
- App 引導語；
- 題幹與問題呈現方式；
- 選項與干擾項；
- 答對回饋、答錯提示與詳解；
- 密碼鑰匙的現代中文表達；
- 全文破譯稿與最終白話文；
- 題目拆屏、順序、動畫、互動與回饋形式；
- 無障礙、閱讀負荷與兒童操作體驗。

所有提案仍必須遵守核心教育模型：先看其他古文證據、再形成假說、放回原文重建，最後才用白話文驗證。

### 8.3 提案與核准流程

不得直接以「我覺得更好」為理由覆蓋基準版本。使用以下格式提出重要修改：

| 欄位 | 內容 |
|---|---|
| 位置 | 題目 ID、畫面或教材段落 |
| 目前版本 | 現行白話、題目或互動 |
| 建議版本 | 完整的新文字或新形式 |
| 理由 | 可理解性、推理強度、閱讀負荷或互動問題 |
| 教學影響 | 是否改變證據鏈、難度、正解或解鎖順序 |
| 實作影響 | 需要修改的資料欄位、元件或狀態 |

使用者可以接受、拒絕或要求調整。只有明確接受的方案才可寫入 App。未回覆時，以目前核准版本繼續，不得自行採用。

## 9. 實作流程

1. 閱讀專案指示與核准教材。
2. 找到現有課程資料、題目元件、路由、進度保存和測試位置。
3. 建立「Markdown 章節 → App step」對照表。
4. 判斷既有 schema 是否完整支援兩條線索、提示、詳解、未知邊界、先備題與白話鎖定。
5. 若不足，做最小且可重用的 schema 擴充；避免與本課無關的大型重構。
6. 將古文原文與古文線索逐字轉入資料層，區分 child-facing 與 adult-only 內容；現代中文先使用目前核准版本。
7. 實作狀態、先備條件、答錯提示、答對詳解及全文驗證鎖。
8. 加入資料驗證與互動測試。
9. 執行專案既有的格式檢查、型別檢查與測試。
10. 逐項核對核准 Markdown，確認古文沒有任何改寫，現代中文也沒有未經核准的變更。

## 10. 驗收測試

至少驗證：

### 資料完整性

- 所有 step ID 唯一；
- 題目順序與 Markdown 一致；
- 每個 evidence question 有兩條古文線索；
- 每題恰有三個選項、且只有一個正解；
- 所有古文來源、節錄標記與未知邊界均被保存；
- 古文原文與線索逐字符合核准 Markdown；
- 現代中文若有變更，每一項都有可追溯的使用者核准；
- 先備條件存在且沒有循環；
- 成人備註未進入孩子端資料。

### 互動

- 未完成先備題時，後續題目保持鎖定；
- 答錯只顯示提示，不直接公布正解；
- 答對後顯示短回饋，詳解可展開；
- 密碼鑰匙只在對應步驟完成後取得；
- 返回課程時能恢復已完成進度；
- 全文白話文在全部必要步驟完成前不可見；
- 完成後可並列破譯稿與白話文，而不是把破譯稿標成錯誤。

### 防止答案洩漏

- 初始資料或畫面沒有正解樣式；
- 螢幕閱讀器文字不會念出「正確答案」；
- 測試 ID、CSS class 與可讀 DOM 屬性不含正解提示；
- 鎖定前的白話文不會因預載元件、折疊區或路由參數而被看見。

### 回歸

- 既有課程仍可開啟與作答；
- 新增 schema 欄位具有明確相容策略；
- 現有進度資料不因 migration 遺失；
- 專案格式、型別與測試命令全部通過。

## 11. 交付報告

完成後只需清楚報告：

- 修改了哪些檔案或模組；
- 新增或擴充哪些資料欄位與互動狀態；
- 執行了哪些測試及結果；
- 是否存在尚未實作或需要教材設計者確認的事項；
- 古文是否有任何文字偏差。正常情況應回答「沒有」；
- 現代中文或互動是否採用了使用者核准的改善方案，並逐項列出。

不要只說「已完成」，也不要貼出大量程式碼取代驗證結果。

## 12. 建議交給 coding agent 的任務文字

> Use `$design-guwen-decoding`. Read the complete skill and `references/app-implementation-contract.md`. Treat every original classical passage and cross-text classical clue in the attached lesson as immutable text: do not modernize, paraphrase, reorder, or replace any character. Use the approved modern-Chinese copy and interaction as the implementation baseline. If you have a better idea for a vernacular explanation, question wording, options, feedback, detailed explanation, screen sequence, or interaction, present the current version, proposed version, reason, learning impact, and implementation impact for discussion; do not adopt it until the user explicitly approves it. First inspect the existing app architecture, repository instructions, lesson data model, progress state, routing, and tests. Implement the approved baseline with the smallest reusable changes, preserve adult-only visibility rules and the final-translation lock, run all relevant checks and tests, and report classical-text fidelity plus any user-approved modern-copy changes.
