<a id="top"></a>

# 《古文破譯家》多音字中央資料庫與自動回傳｜Codex 工程交接

> 交接目的：把「多音字候選建檔、真實裝置實聽、自動回傳、中央讀回、教材決策」的後續工程，移交到固定的 Codex 桌機工作區。  
> Repository：`icelog-TU/Justin-Learning-App`  
> 固定工作分支：`claude/chinese-learning-app-justin-yjcfam`  
> 交接基準日期：2026-07-26  
> 中央資料庫工程基準：`5689cd4a164ae9e3cda3d347c910ec747a8d1e71`  
> 本交接已納入其後的第二篇並行更新：`0a4656f`

> 2026-07-26 Codex 接手更新：中央 schema 已升級為 v2，catalog 與 result 已加入
> exact display text／TTS input／target fingerprint。原有七筆沒有提交時指紋的 v1
> 結果完整保留作歷史證據，但不再產生教材結論；目前七筆均為「待複驗」。

---

## 零、使用者確認的總體目的（不可縮減）

這套網頁與資料庫不是一般的單字發音表，也不是讓 agent 猜 TTS 會怎麼念。每篇古文的全部孩子端文字寫完後，必須完成以下閉環：

1. Agent 掃描整篇所有會送入 TTS 的完整語音單元，抓出其中**全部多音字的每個具體出現位置**；不得只選 agent 覺得容易念錯的字。
2. Agent 把掃描結果整理成正式 catalog 並批次部署到實聽台。每個項目顯示多音字所在的完整整句；同一句有多個多音字時，整句只建一個 item、所有目標分列在 `targets[]`。
3. 使用者在孩子實際使用的裝置上，一句一句播放，並替整句中的每個多音字目標分別判斷「念對／念錯」。一句只需播放一次；GPT、Codex、程式測試與瀏覽器自動化不能聽見實際發音，絕對不能代替使用者標記結果。
4. 某一目標按「念對」：該目標在此 exact utterance 不在孩子端加注音。
5. 某一目標按「念錯」：孩子端每個受影響的朗讀位置，都在該完整整句正下方另加一行正確讀音提示；原句本身保持不變。同句其他念對目標仍不加註。
6. 每次判定連同完整顯示文字、實際 TTS 輸入、目標位置、指定讀音、voice／裝置、時間與回傳編號保存到中央資料庫，供後續教材決策與長期統計。

資料庫日後可以協助分析哪些字、句型或 voice 經常念對，但現階段不能因同一字在別句念對，就自動跳過新句。可沿用的最小單位仍是目前 exact utterance 與其有效指紋；若未來要建立跨句免測政策，必須另行設計、驗證並由使用者明確核准。

---

<a id="start-task"></a>

## 一、給新 Codex 對話的直接任務

請在已固定連接本 repository 的 Codex 桌機工作區接手，不要另建 repository、分支、Firebase 專案或第二套多音字資料庫。

開始時：

1. 使用 `$design-guwen-decoding`。
2. 切到既有分支 `claude/chinese-learning-app-justin-yjcfam`，先 `git fetch`，確認沒有落後遠端。
3. 依 `AGENTS.md` 的順序完整閱讀：
   - `FULL-SITE-HANDOFF.md`
   - `GUWEN-WORKFLOW-SOP.md`
   - `GUWEN-PROJECT-STATUS.md`
   - `design-standard.md`
   - `guwen-decoder-learned-keys.md`
   - `.claude/skills/guwen-decoder/SKILL.md`
   - `.claude/skills/design-guwen-decoding/SKILL.md`
   - `.claude/skills/design-guwen-decoding/references/app-implementation-contract.md`
   - 本交接檔
4. 執行：

   ```bash
   npm ci
   npm run tts:audit:pull
   npx tsc -b
   npm run build
   ```

5. 先回報中央資料庫實際讀回結果、目前正式候選數與未完成範圍；不要從聊天記憶猜。
6. 接續完成本檔「十二、後續工作清單」，優先處理 P0 與 P1。
7. 所有改動直接更新同一個固定分支；本專案不主動另開 PR。

---

<a id="decision"></a>

## 二、已決定的工作分工

- 教材逐題討論、句子修改與成人審稿，可以留在手機上的 ChatGPT 專案對話。
- GitHub 多檔案同步、React、Firebase、測試、部署、中央資料庫與 SOP 維護，集中到固定的 Codex 桌機工作區。
- 手機仍可遠端下指令與開啟實聽台，不需要坐在電腦前操作程式。
- Codex 必須以 GitHub 固定分支為唯一工程來源；聊天附件、ZIP、本機暫存與對話記憶都不是正式版本。

---

<a id="why"></a>

## 三、為什麼要建立中央資料庫

舊版實聽台只有瀏覽器 `localStorage`：

1. 使用者在網頁勾選「念對／念錯」後，結果只留在那台裝置。
2. AI／Codex 無法直接讀取，只能請使用者複製貼上。
3. 換裝置、清除瀏覽器資料或開新對話後，結果容易失去。
4. 教材主檔、App 提示與實聽結果容易各自形成不同版本。
5. 單純記錄「某個字念對」也不可靠；同一字換句子、語境、TTS 輸入、裝置或聲音後，讀法可能不同。

因此正式目標不是建立一張「字形白名單」，而是建立可追溯的語音單元資料庫：

> 篇章＋題號＋完整朗讀文字＋實際 TTS 輸入＋目標字具體出現位置＋指定讀音＋裝置／聲音＋實聽結果＋時間＋回傳編號

教材判準已確定：

- 掃描到多音字，只代表「候選」，不代表孩子端一定要顯示注音。
- 中央實測為「念對」：不加孩子端注音。
- 中央實測為「念錯」：才就近加入讀音提示，並視需要修正 TTS 輸入。
- 尚未實聽、回傳失敗或語音單元已改動：維持待測，不得假裝已確認。
- 判定單位是完整語音單元與具體出現位置，不是單一字形永久豁免。

---

<a id="target-flow"></a>

## 四、要完成的長期閉環

```text
每題孩子端文字完成時先掃描
→ 全篇全部孩子端文字完成後再做一次完整批次掃描
→ 抓出每個可播放整句中的全部多音字位置
→ 正式候選檔批次建立穩定 ID
→ 部署並讓整批正式候選出現在實聽台
→ 實聽台使用正式 App 的 speak()／ttsSafe()
→ 使用者在孩子實際裝置逐句親耳判定「念對／念錯」
→ 自動寫入 Firestore 並取得回傳編號
→ Codex 執行 npm run tts:audit:pull
→ 依中央最新有效結果更新教材與 App
→ 念對不加註；念錯就在該整句正下方另加一行正確讀音
→ 文字、TTS 輸入或目標位置改動時自動失效並重測
```

中央實測庫與孩子的答題進度、金幣、星星、徽章及同步碼必須完全分離。

---

<a id="completed"></a>

## 五、目前已完成並在 GitHub 上的部分

### 5.1 第一版實聽台

- 正式網址：`https://icelog-tu.github.io/Justin-Learning-App/#/tts-audit`
- 路由：`/#/tts-audit`
- 不放入孩子主選單，供教材編輯者直接開啟。
- 可逐句播放、連續播放，並替句內每個多音字目標分別標記念對／念錯／待確認；同句全部目標選完才回傳。
- 可貼入臨時句子、複製備份結果。
- 所有播放走正式 App 的 `speak()` 與 `ttsSafe()`。

### 5.2 中央回傳

- 單目標整句點選「念對／念錯」後立即寫入 Firestore；多目標整句必須逐目標全部選完，再一次寫入含 `targetResults[]` 的結果。
- 成功時顯示「已回傳中央資料庫」與回傳編號。
- 失敗時保留本機狀態，顯示失敗並可重新同步。
- 重新開頁可讀回中央資料。
- `localStorage` key `guwen-tts-audit-v1` 只作離線備份與待重送，不是正式資料庫。

### 5.3 正式候選檔

- 已建立 `src/data/guwenPronunciationAudit.ts`。
- 每筆包含篇章、題號、穩定語音單元 ID、完整文字、目標字、出現次序、注音、同音提示、句義與初始驗證資料。

### 5.4 固定讀回指令

```bash
npm run tts:audit:pull
```

此指令由 `scripts/read-tts-audit.mjs` 讀取 Firestore 中央索引及各篇資料，列出目前最新結果。

### 5.5 工作流程已寫入長期規範

中央建檔、回傳、讀回與「念錯才加註」規則已同步進：

- `FULL-SITE-HANDOFF.md`
- `GUWEN-WORKFLOW-SOP.md`
- `GUWEN-PROJECT-STATUS.md`
- `design-standard.md`
- `.claude/skills/guwen-decoder/SKILL.md`
- `.claude/skills/design-guwen-decoding/SKILL.md`
- `.claude/skills/design-guwen-decoding/references/app-implementation-contract.md`

### 5.6 相關正式提交

- `6fc5d85`：第一版多音字 TTS 實聽台上線。
- `9f13934`：建立正式候選檔、Firestore 中央實測庫、自動回傳、讀回指令與工作流程。
- `5689cd4`：修正中央回傳資料中 `undefined` 欄位造成的 Firestore 寫入問題。
- `0a4656f`：另一個教材對話把第二篇擴充為任務開場與第一至三題草稿；中央候選尚未隨之擴充。

---

<a id="cloud-state"></a>

## 六、2026-07-26 中央資料庫實際讀回狀態

已在交接時執行 `npm run tts:audit:pull`，成功讀回：

- 中央篇章數：1
- 篇章：第 3 篇《刻舟求劍》
- 正式語音單元：7
- 最新結論：7 個語音單元全部「念對／不需加註」

精確資料如下：

| ID | 位置 | 完整語音單元 | 目標 |
|---|---|---|---|
| `kezhou-q3-nan` | 第三題 App 引導語 | 下一句出現了其劍，這真的很難懂：它該怎麼接回前面的故事？ | 難：ㄋㄢˊ |
| `kezhou-q3-yi-classical` | 第三題古文線索一 | 楊布換黑衣而歸，其狗不知而吠之。 | 衣：ㄧ |
| `kezhou-q3-yi-modern` | 第三題線索一已破解白話 | 楊布換穿黑衣回家，其狗沒有認出自己的主人，就向他叫。 | 衣：ㄧ |
| `kezhou-q3-yu` | 第三題古文線索二 | 楚人賣盾與矛，又譽其矛曰：「吾矛之利，於物無不陷也。」 | 與：ㄩˇ |
| `kezhou-q3-jia` | 第三題推理提問 | 古文破譯家，哪一個假說能同時解開兩條線索中的其？ | 假：ㄐㄧㄚˇ |
| `kezhou-q4-zhong-original` | 第四題待破解目標句 | 其劍自舟中墜於水。 | 中：ㄓㄨㄥ |
| `kezhou-q4-zhong-di` | 第四題古文線索一 | 椀自手中墜地。 | 中：ㄓㄨㄥ；地：ㄉㄧˋ |

注意：

- 這是 7 個語音單元；最後一個單元同時有「中、地」兩個目標。
- 其中一筆已有真正網頁回傳的瀏覽器環境；其餘多數是把使用者先前明確確認「七項全部念對」遷入中央庫的 `editor_confirmation`。
- 這些遷入資料的裝置／實際聲音名稱仍是占位說明。它們在 v1 時點曾被視為可用；v2 指紋機制上線後已改列待複驗，必須由使用者在中央回傳版實聽台上用孩子的實際裝置重測這 7 項。

### 6.1 指紋機制上線後的有效狀態

2026-07-26 接手實作後再次執行 `npm run tts:audit:pull`：

- 中央 schema：v2
- 正式候選：7
- 有效念對：0
- 有效念錯：0
- 待複驗（中央只有無指紋的 v1 舊結果）：7
- 中央缺少：0
- 中央孤兒紀錄：0

這不是刪除或否定舊實聽紀錄。舊結果仍保存在每個 item 的 `results[]` 中供追溯；
只是 v1 結果沒有提交當時的 exact TTS input 與 target fingerprint，不能滿足新的有效性標準。
請在孩子實際裝置重新播放並勾選，取得包含 v2 指紋與實際 voice 的新回傳編號。

---

<a id="architecture"></a>

## 七、目前技術架構

### 7.1 Firestore 路徑

沿用既有 Firebase 與匿名登入，資料仍在 `families` collection，但使用獨立文件：

- 中央索引：`families/GUWENTTS-INDEX-V1`
- 各篇資料：`families/GUWENTTS-{LESSON_ID_UPPERCASE}`

例如：

```text
families/GUWENTTS-03-KEZHOUQIUJIAN
```

不得併入孩子的 `families/{syncCode}` AppData 文件。

### 7.2 目前 schema

目前為 `schemaVersion: 3`；讀取端仍相容 v1／v2 歷史資料。v3 在整句結果中新增逐目標 `targetResults[]`，解決同一句一字念對、另一字念錯時無法分辨的問題。無 `targetResults[]` 的舊單目標結果可相容讀取；舊多目標整句必須待複驗。

中央索引保存：

- `kind`
- `schemaVersion`
- `lessonDocs`
- `updatedAt`

各篇文件保存：

- `lessonId`
- `lessonNumber`
- `lessonTitle`
- `items`
- `submissions`
- `updatedAt`

每個 item 保存：

- 正式 catalog 欄位
- `targets[]`
- `initialVerifications[]`
- `results[]`
- `displayText`
- `ttsInput`
- `auditRevision`
- `targetFingerprint`
- `utteranceFingerprint`

每個 result 保存：

- `resultId`
- `status`
- `note`
- `checkedAt`
- `receivedAt`
- `environment`
- `source`：`web_audit` 或 `editor_confirmation`
- 提交當時的 `displayText`、`ttsInput`、`auditRevision`、`targetFingerprint`、`utteranceFingerprint`

目前保留上限：

- 每篇最近 200 次 submissions。
- 每個 item 最近 20 筆 results。
- 同一裝置再次提交同一項時，以該裝置最新結果取代舊結果；其他裝置結果保留。

### 7.3 初始化與同步方式

- `fetchCentralAuditDatabase()` 會先呼叫 `ensureCentralCatalog()`。
- 正式候選第一次出現時，由網頁讀取流程把 catalog 補進中央篇章文件。
- `submitAuditResults()` 使用 Firestore transaction 寫入結果。
- CLI `scripts/read-tts-audit.mjs` 目前只讀中央索引，不會主動把本地新增 catalog 初始化到 Firestore；新增候選後仍需至少開啟一次線上實聽台，或另行補強 CLI 初始化能力。

---

<a id="files"></a>

## 八、關鍵檔案

| 檔案 | 責任 |
|---|---|
| `src/data/guwenPronunciationAudit.ts` | 正式候選目錄與穩定 ID |
| `src/pages/TtsAuditPage.tsx` | 實聽 UI、本機備份、中央讀回與自動送出 |
| `src/lib/ttsAuditCloud.ts` | Firestore schema、目錄初始化、查詢與 transaction 寫入 |
| `src/lib/speech.ts` | 正式 `speak()`、`getTtsInput()` 與 `ttsSafe()` 修音規則 |
| `scripts/read-tts-audit.mjs` | Codex／編輯代理的中央讀回指令 |
| `src/App.tsx` | `/#/tts-audit` 路由 |
| `03-guwen-kezhouqiujian-decoder-content.md` | 第三篇七項實聽表與「不需加註」結論 |
| `lessons/01-guwen-wangrong-rewrite.md` | 第一篇大量候選盤點；尚未遷入中央正式候選 |
| `02-guwen-simaguang-decoder-content.md` | 第二篇任務開場與第一至三題候選盤點；尚未遷入中央正式候選 |
| `GUWEN-WORKFLOW-SOP.md` | 每題編寫、送測、回傳、讀回與教材同步流程 |

---

<a id="workflow"></a>

## 九、以後每一篇的固定批次工作流程

一百篇古文對話的簡式啟動方式、第一階段停點、使用者實聽交接與第二階段完成回報，統一見 `GUWEN-POLYPHONIC-AUDIT-RUNBOOK.md`。該檔是操作入口，不另定 schema；本文件仍是中央資料庫與有效性規則的唯一詳細交接。

1. 編題前先更新固定分支並執行 `npm run tts:audit:pull`。
2. 每題完成時先掃描該題所有可能播放的文字，不只掃古文原文。
3. 全篇孩子端文字完成後，重新從頭掃描所有 exact playable utterances，抓出全部多音字的每個出現位置；不得按「agent 猜測是否容易念錯」篩掉任何多音字。只顯示而確定不播放的成人來源資料可排除。
4. 每個完整語音單元建立穩定 ID；同一句中多個目標放入同一 item 的 `targets[]`，同字在不同整句或不同位置仍分別追蹤。
5. 一次把全篇正式候選批次加入 `src/data/guwenPronunciationAudit.ts`；不得把實聽台臨時貼入的「待分類」句當成正式上傳。
6. 提交、部署後至少開啟一次正式實聽台，確認整批候選已顯示並同步到中央 catalog。
7. 使用者用孩子實際使用的手機／平板／電腦逐句播放。Agent 只能準備句子，不能代替使用者用耳朵判斷。
8. 使用者聽完每句後，替該句每個多音字目標分別點「念對」或「念錯」；全部目標選完才回傳。
9. 每次都必須看到「已回傳中央資料庫」及回傳編號；只看到本機勾選不算完成。
10. Codex 再執行 `npm run tts:audit:pull`，確認中央可以讀回。
11. 同步更新：
    - 中央 Firestore 結果
    - 正式候選檔
    - 教材主檔實聽表
    - 孩子端提示或 TTS 修音
12. `npm run tts:audit:pull` 逐目標列出決策：念對目標不顯示注音；念錯目標在每個受影響的孩子端朗讀位置，緊接完整整句另加一行正確讀音提示與建議文字。
13. 只要完整顯示文字、`ttsSafe()` 輸入、目標字位置、指定讀音、revision 或適用 voice 條件改動，舊結果失效並重測。

該篇古文對話的固定讀回命令：

```bash
npm run tts:audit:pull -- --lesson <lessonId>
```

`<lessonId>` 也可換成篇次或完整篇名。文字輸出與 `--json` 都會逐目標提供狀態、教材動作及念錯時的建議加註；對話必須以這份中央讀回資料修改教材，不得要求使用者重新口述結果。

---

<a id="boundaries"></a>

## 十、不可破壞的邊界

- 不得把「某字在某句念對」擴張成該字永久免測。
- 不得只上傳「看起來容易念錯」的多音字；全篇最終批次必須涵蓋全部多音字位置。
- 不得由 agent、自動測試或文字輸出推測可聽見的結果；只有使用者真人實聽可以按「念對／念錯」。
- 不得讓 `localStorage` 再次成為唯一資料來源。
- 不得把中央實聽資料寫進孩子的學習進度。
- 不得因修音而改變孩子看到的古文原文或真實古文線索。
- 不得在尚未實測前就大量顯示注音。
- 不得因中央有舊結果，就忽略語音單元文字已變動。
- 不得把「待分類」的臨時貼入句當成正式候選。
- 不得把聊天室中的口頭確認當成唯一、不可追溯的長期紀錄。
- 不得用羅馬拼音；孩子端讀音提示使用臺灣注音與熟悉同音漢字。
- 技術代理不得自行修改仍待審的教材文字。

---

<a id="known-gaps"></a>

## 十一、已知缺口與風險

### 11.1 第一、二篇尚未中央化

- 第一篇主檔已有第 1–12 題多音字盤點與大量讀音提示，但尚未拆成「完整語音單元」逐筆加入正式 catalog。
- 第二篇任務開場與第一至三題已有候選表，但仍是草稿待審，也尚未加入正式 catalog。
- 不能把兩篇現有表格的一行直接視為一個 item；同一讀音可能分散在多個實際播放句，必須回到完整語音單元逐筆建檔。
- 第一篇 App 尚未實作新版；測試文字必須與未來實際送入 `speak()` 的完整文字一致。
- `GUWEN-PROJECT-STATUS.md` 在 `0a4656f` 後尚未同步第二篇的最新題數；目前應以第二篇教材主檔的「任務開場＋第一至三題草稿待審」為準，接手後先核對並修正共用進度表。

### 11.2 已完成：舊結果自動失效

已加入 `displayText`、`ttsInput`、`auditRevision`、`targetFingerprint` 與
`utteranceFingerprint`。result 會保存提交時的完整指紋資料；UI 與 CLI 只有在五項完全相符時
才採用結果。文字、`ttsSafe()` 輸出、目標位置／注音或 revision 改動後，舊結果保留但自動列為
「待複驗」。

### 11.3 已完成程式補強，待真實裝置重測

目前 `SpeechSynthesisUtterance` 只設定 `lang = 'zh-TW'`，沒有指定 `utterance.voice`。

中央環境只保存「裝置可見的所有 zh-TW 聲音名稱」，不一定能知道瀏覽器實際選了哪一個聲音。因此：

- 不同裝置或系統更新後，結果可能改變。
- 即使同一裝置同時有多個 zh-TW 聲音，也無法精確追溯實際使用者。

正式 App 與實聽台現共用確定性的 `selectZhTwVoice()`，並明確設定
`SpeechSynthesisUtterance.voice`。result 保存實際 voice name／voiceURI／lang／default；
瀏覽器若未提供 voice 清單，會明確保存 `unresolved_default`，不假稱已解析聲音。

### 11.4 舊七項多數缺少完整裝置資訊

七項中央結論都存在，但多數由聊天中的明確確認遷入，環境欄位是占位值。建議在中央回傳版實聽台上用孩子真實裝置重新測一次，以產生原生 `web_audit` 紀錄。

### 11.5 中央資料庫權限尚未在 repository 內留下規則證據

Repository 中沒有看到 Firestore Security Rules 檔案。現有匿名讀寫已成功，但接手者仍需到 Firebase 專案核對實際 rules：

- 是否只允許必要的 `GUWENTTS-*` 文件。
- 是否任何匿名使用者都能覆寫中央資料。
- 是否需要 App Check、編輯者權杖、Cloud Function 或其他防濫用機制。

不得在未核對 rules 前宣稱中央資料庫已具備完善權限防護。

### 11.6 CLI 只有讀取，沒有 catalog 初始化與機器可判斷的同步報告

- 新增 catalog 後，通常要先開網頁才會寫入中央目錄。
- CLI 雖支援 `--json`，但還沒有驗證「本地 catalog 與中央 items 是否一致」、列出 orphan／missing／stale items 或以非零 exit code 阻止交付。

後續可把它升級成真正的同步稽核工具。

---

<a id="next"></a>

## 十二、後續工作清單

### P0｜先證明固定工作區基準正確

- [ ] `git fetch`，確認固定分支沒有落後。
- [ ] `npm ci`
- [ ] `npm run tts:audit:pull`
- [ ] `npx tsc -b`
- [ ] `npm run build`
- [ ] 打開線上 `/#/tts-audit`，確認中央讀回、播放、送出、回傳編號與重新同步均正常。

### P1｜補強資料有效性，避免錯用舊結果

- [x] 為 catalog 與 result 加入 exact utterance／TTS input fingerprint 或 revision。
- [x] 只有 fingerprint 相符的 result 才能產生「念對免加註／念錯需處理」結論。
- [x] 文字或 `ttsSafe()` 輸出改動時，自動顯示「待複驗」。
- [x] `npm run tts:audit:pull` 明確列出 stale／missing／orphan records。

### P1｜把第一、二篇正式遷入中央流程

- [ ] 從第一篇目前已核准範圍的完整孩子端語音單元建立正式 catalog；待審文字若先建檔，必須標記草稿 revision，修改後自動失效。
- [ ] 從第二篇任務開場與第一至三題建立候選；因內容仍待審，核准後再確認最終 exact text。
- [ ] 不要把主檔現有「首次位置」摘要直接當成完整 item 清單。
- [ ] 部署後把第一、二篇候選交給使用者在實際裝置測試。
- [ ] 確認每一筆都有中央回傳編號，並由 CLI 讀回。
- [ ] 依中央結果移除不必要的既有注音；只有念錯單元保留就近提示。

### P1｜補齊實際聲音環境

- [x] 決定以確定性規則選取瀏覽器提供的 zh-TW voice；無清單時明確標為未解析系統預設。
- [x] 正式 App 與實聽台共用同一語音選擇函式。
- [x] result 保存實際 voice name、voiceURI、lang 與是否 default。
- [ ] 用孩子的真實裝置重測第三篇既有七項，取代／補充占位環境。

### P2｜提升中央庫可靠性

- [ ] 核對 Firestore Security Rules 與匿名寫入範圍。
- [ ] 為中央提交加入基本防濫用與 schema validation。
- [ ] 明確定義多裝置結果衝突時的有效結論：按指定主要裝置、最新結果，或逐環境分開判定。
- [ ] 對裝置／OS／瀏覽器／voice 明顯更新建立「待複驗」規則。
- [ ] 增加資料庫 schema migration 策略，不直接假設永遠是 `schemaVersion: 1`。

### P2｜把流程嵌入日常編題

- [ ] 每篇／每批開始時自動執行 central pull。
- [ ] 建立 catalog 與教材主檔的交叉驗證。
- [ ] 在 CI 或交付腳本中阻止「有候選但沒有有效中央結果，卻已經加入孩子端提示或宣稱驗收完成」。
- [ ] 每輪 GitHub 交付報告列出：新增候選、待測、念對、念錯、stale、中央回傳編號。

---

<a id="acceptance"></a>

## 十三、完成驗收標準

這個功能只有在下列條件全部成立時才算真正完成：

1. 每個候選都先有正式 catalog item 與穩定 ID。
2. 實聽台播放的 exact TTS input 與正式 App 相同。
3. 使用者點選後實際寫入 Firestore，而不是只寫 localStorage。
4. 每筆成功結果有回傳編號、接收時間與環境資料。
5. Codex 可用固定指令獨立讀回，不需要使用者複製貼上。
6. 舊結果與目前 display text／TTS input／target occurrence fingerprint 相符才有效。
7. 念對者不加註；念錯者才加入就近提示與必要修音。
8. 第一、二、三篇都能在中央總覽按篇查看；後續篇章沿用同一套資料庫。
9. 裝置、系統、瀏覽器或 voice 改變時不會把舊結果誤當永久保證。
10. Firestore 權限與防濫用邊界已有可稽核紀錄。
11. 型別檢查、正式建置、線上路由、真實裝置播放、中央寫入與獨立讀回全部通過。

---

<a id="validation"></a>

## 十四、開發與交付命令

```bash
git status -sb
git fetch origin
npm ci
npm run tts:audit:pull
npx tsc -b
npm run build
git status --short
```

涉及網頁／Firebase 行為時，不能只用 TypeScript 與 build 代替實際驗收；必須在線上或本機瀏覽器驗證登入、讀取、寫入、回傳編號、重送及重新讀回。

提交前再次確認遠端沒有其他對話的新提交。固定分支不 force push，不覆蓋其他篇章的平行進度。

---

<a id="links"></a>

## 十五、常用入口

- Repository：<https://github.com/icelog-TU/Justin-Learning-App>
- 固定分支：<https://github.com/icelog-TU/Justin-Learning-App/tree/claude/chinese-learning-app-justin-yjcfam>
- 多音字 TTS 實聽台：<https://icelog-tu.github.io/Justin-Learning-App/#/tts-audit>
- 中央資料庫建立提交：<https://github.com/icelog-TU/Justin-Learning-App/commit/9f1393496e404342d33c6a991a0b5240f78e5ca3>
- Firestore 欄位修正提交：<https://github.com/icelog-TU/Justin-Learning-App/commit/5689cd4a164ae9e3cda3d347c910ec747a8d1e71>

---

## 十六、交接結論

中央資料庫、自動回傳、正式候選檔、網頁讀回與 Codex pull 指令已經存在，並已在 GitHub 固定分支上。第三篇七個語音單元仍保留舊版實聽歷史，但在 schema v3 下目前都是「待複驗」，尚不能形成「念對／不需加註」結論。

後續重點不是重做第一版，而是把它變成長期可靠的工程制度：

1. 先補上 exact utterance／TTS input 的結果失效機制。
2. 把第一、二篇完整遷入同一中央資料庫。
3. 紀錄真正使用的 voice 與真實裝置環境。
4. 核對 Firestore 權限。
5. 把中央差異檢查納入每次編題與交付。

完成這些以後，使用者在手機或平板上的實聽選擇，才會穩定地成為 Codex 後續編寫教材時可直接讀取、可追溯、不會誤套用的正式依據。

[↑ 返回頂部](#top)
