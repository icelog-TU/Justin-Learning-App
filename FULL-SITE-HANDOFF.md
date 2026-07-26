# Justin 的中文練功房｜全站開發交接

> 給接手開發的 AI 助理與工程師。修改任何內容前必須完整閱讀本文件。
> Repo：`icelog-TU/Justin-Learning-App`
> 固定開發分支：`claude/chinese-learning-app-justin-yjcfam`
> 最近同步：2026-07-26

## 0. 接手前必做

1. Clone repo，切到既有的 `claude/chinese-learning-app-justin-yjcfam`；不要建立新分支。
2. 完整閱讀本文件。
3. 若工作涉及「古文破譯家」，再依序閱讀：
   - `GUWEN-WORKFLOW-SOP.md`
   - `GUWEN-PROJECT-STATUS.md`
   - `design-standard.md`
   - `guwen-decoder-learned-keys.md`
   - `.claude/skills/guwen-decoder/SKILL.md`
   - `.claude/skills/design-guwen-decoding/SKILL.md`
   - `.claude/skills/design-guwen-decoding/references/app-implementation-contract.md`
   - 本次涉及的唯一教材主檔
4. 若工作涉及朗讀或發音，完整閱讀 `src/lib/speech.ts` 中 `ttsSafe()` 上方的活文件註解。
5. 安裝鎖定版本依賴並確認基準：

   ```bash
   npm ci
   npx tsc -b
   ```

6. 修改前先檢查 `git status`，保留使用者既有變更。

## 1. 文件權威順序

發生衝突時依下列順序判斷：

1. 使用者在目前任務中的明確指示。
2. 固定開發分支上的現行程式碼、資料模型與部署設定。
3. 古文工作的 `GUWEN-WORKFLOW-SOP.md`、`GUWEN-PROJECT-STATUS.md`、當篇唯一教材主檔與明確核准紀錄。
4. 本文件。
5. `README.md` 與歷史交接文件。

本文件負責全站架構與共同開發慣例；古文內容的核准狀態仍以古文 SOP、進度表及教材主檔為準。

## 2. 產品與使用者

「Justin 的中文練功房」是給台灣國小三年級學生 Justin 使用的中文學習 Web App。主要使用者與需求提出者是 Justin 的家長，以繁體中文溝通。語音輸入可能產生同音錯字；可依上下文明確修正手誤，但不應自行改變需求。

主要模組依選單順序如下：

1. 成語接龍
2. 一字成語王
3. 古文破譯家
4. 成語卡片
5. 成語測驗
6. 成語造句
7. 錯別字測驗
8. 轉蛋
9. 角色收藏
10. 成語筆記本
11. 學習紀錄
12. 設定與雲端同步

## 3. 技術棧、路由與部署

- React 19
- TypeScript
- Vite 8
- Tailwind CSS 4
- React Router `HashRouter`
- Firebase Authentication 匿名登入
- Firebase Firestore 跨裝置同步
- GitHub Pages 靜態部署

路由集中在 `src/App.tsx`。網址使用 `/#/...` 格式。

`vite.config.ts` 使用 `base: './'`。本機 `vite preview` 必須從根網址開啟，例如：

```text
http://127.0.0.1:4173/#/
```

不要在本機網址加入 `/Justin-Learning-App/`。該前綴只屬於 GitHub Pages 部署路徑；本機誤加前綴可能讓資產請求被 SPA fallback 回傳成 `index.html`，造成白屏但 HTTP 仍顯示 200。

`.github/workflows/deploy-pages.yml` 只監聽固定開發分支。Push 到該分支後會：

1. `npm ci`
2. 寫入 `public/version.json`
3. `npm run build`
4. 部署 `dist/` 到 GitHub Pages

不主動建立 PR，除非使用者明確要求。

## 4. 資料持久化與雲端同步

### AppData

`src/lib/storage.ts` 的 `AppData` 是全站唯一的學習資料模型，使用 localStorage key：

```text
justin-chinese-app-v1
```

新增任何 `AppData` 欄位時必須：

1. 更新型別。
2. 同步加入 `emptyData()`。
3. 確認 `normalizeAppData()` 能載入缺少新欄位的舊 localStorage／Firestore 快照。
4. 確認雲端同步與所有讀取端不會因舊資料崩潰。

目前 `normalizeAppData()` 採「空狀態預設值＋淺層合併」。新增巢狀結構時不能假設這種策略自然足夠。

### React 狀態安全慣例

`src/lib/useAppData.ts` 是把 `storage.ts` 純函式包裝成 React 操作的唯一入口。

若呼叫端需要在同一次操作中立刻取得 mutation 結果，例如：

- 轉蛋抽到哪個角色；
- 一字成語王是否第一次破解某字；
- 是否觸發里程碑；

必須直接以 `dataRef.current` 計算結果，再 `setData(nextData)`。不要試圖從 React functional updater `setData(prev => ...)` 外部同步讀取結果。

按鈕快速連點需要同步鎖時，使用 `useRef`；不能只依賴 state 更新後才生效的 `disabled`。

### Firebase

- `src/lib/firebase.ts`：初始化、匿名登入。
- `src/lib/syncCode.ts`：產生／正規化八碼同步代碼。
- 同步代碼使用獨立 localStorage key `justin-chinese-app-sync-code`。
- `src/lib/cloudSync.ts`：一次性讀取、寫入與即時監聽。
- Firestore 路徑：`families/{syncCode}`。
- 文件內容：`{ data: AppData, updatedAt: number }`。
- `hasPendingWrites` 用於排除本機寫入的即時回音。
- 雲端失敗時 App 必須仍可依靠 localStorage 運作。

Firebase Web 設定不是伺服器密鑰；真正存取控制必須由 Firebase Authentication 與 Firestore Security Rules 保護。

## 5. 獎勵與貨幣

所有獎勵常數的唯一來源是 `src/lib/rewards.ts`，不得在頁面重複寫死。

| 行為 | 金幣 | 星星 |
|---|---:|---:|
| 成語／錯別字答對 | 5 | 2 |
| 造句通過 | 8 | 5 |
| 測驗滿分 | 20 | 10 |
| 成語接龍每一鏈 | 8 | 4 |
| 接龍每 5 鏈里程碑 | `15 × 里程碑序號` | `8 × 里程碑序號` |
| 一字成語王每格 | 8 | 4 |
| 一字成語王四格完成 | 20 | 10 |
| 每 5 個不同破解字里程碑 | `20 × 里程碑序號` | `10 × 里程碑序號` |
| 古文每一破譯步驟 | 8 | 4 |
| 古文全文完成 | 80 | 40 |

古文重玩倍率為 `[1, 0.6, 0.3, 0.1]`；第五次起仍能重玩，但不再獲得貨幣。

- 轉蛋花費：10 金幣。
- 重複角色補償：5 星星。
- 給角色一顆愛心：3 星星。

實際發獎勵統一呼叫 `earnRewards()`，讓可用餘額、終身累積與每日收入一起更新。不得在新功能中只手動修改 `data.coins` 或 `data.stars`。

設計原則：

- 新模組原則上建立自己的基礎費率常數。
- 大任務完成獎勵要明顯高於單題。
- 里程碑逐級增長。
- 允許重玩；需要防刷分時使用遞減獎勵，不直接鎖死。

## 6. 轉蛋、角色與等級

### 目前角色池

`GACHA_BASES` 現為：

```text
2, 3, 5, 6, 7, 11, 12, 15
```

每個 base 有 46 個 exponent，共 368 隻既有次方角色。其後依序另有 `1²` 到 `50²` 的 50 隻平方角色，以及 `1³` 到 `50³` 的 50 隻三次方角色；總角色數由 `TOTAL_CHARACTER_SLOTS` 即時計算為 468，不要把 468 另寫成業務邏輯常數。

新增 base 前必須檢查冪次值是否會與現有角色重複。4、8、9、10 等數字曾因可與既有 base 產生冪次碰撞而排除。

轉蛋只抽目前尚未收集滿的第一個 base。每個 exponent 等機率。連續五次重複後，第六抽保證從目前 base 的未擁有角色中抽出新角色；抽到新角色即重設保底。

八組次方角色收集完成後解鎖平方角色區；平方角色完成後解鎖三次方角色區；全部 468 個角色收集完成後，轉蛋關閉。

### 角色資料

沒有獨立角色資料檔。角色由 `base^exponent` 算出：

- ID：`${base}^${exponent}`
- 數值：`BigInt(base) ** BigInt(exponent)`
- 愛心上限：既有次方角色使用 exponent；平方與三次方角色使用各自底數。因此 `1²／2²` 與 `1³／2³` 各有 1 種互動，`3²／4²` 與 `3³／4³` 各有 2 種，依序至 `49／50` 底數各有 25 種互動
- 色彩：依 exponent 在同一 base 中作 HSL 漸變

`CharacterDetailPage.tsx` 的 33 個互動模板和內容池透過確定性 seed 產生穩定的個人化內容。擴充最大 exponent 或互動格數時，必須重新確認模板數仍大於任何角色可能使用的互動格數，避免同角色重複模板。

`AssociationCharacterDetailPage.tsx` 是「一字成語王」的真實漢字破解紀錄，不是抽卡角色頁。

### 等級

目前共有 25 級，權威來源是 `src/lib/rewards.ts` 的 `LEVELS`。既有 Lv.1～Lv.22 門檻不可向後移動；三次方角色只在後面新增 Lv.23～Lv.25。

等級只依不同角色收藏數計算，不是 XP、金幣或星星。擴充角色池時：

- 不移動既有等級門檻；
- 只在後面新增等級；
- 確認最高級門檻與最新收藏池規模合理對齊。

## 7. 成語接龍

主要檔案：

- `src/pages/IdiomChainGame.tsx`
- `src/lib/chainGame.ts`
- `src/data/idiomChain.ts`
- `public/data/moe-idioms.json`
- `public/data/editorial-idioms.json`
- `src/pages/ChainLinksDetailPage.tsx`

四種資料來源統一為 `ChainEntry`：

1. 精選題庫
2. 教育部成語典
3. 民間編輯詞庫
4. 家庭自建成語

大型 JSON 在 mount 後非同步 fetch。完整詞庫載入前後的起始字更新必須尊重 `chainHistoryRef`：若孩子已開始遊戲，不得突然替換目標字。

比對分三級：

1. 完全同字
2. 完全同音同調
3. 去調後同音

品質也分三級：精選、常見、罕見。提示排序同時考慮匹配與品質；民間詞庫可作答案，但缺少可靠解釋時不可顯示為提示卡。

提示採完整候選清單分頁，不是每次隨機換一批。提示卡包含遮罩、發音、解釋、來源、收藏與 Google 搜尋。

接龍歷史最多保存 200 輪。`reconcileLongestChain()` 會在載入時用歷史修復舊版最長鏈紀錄。

## 8. 一字成語王

主要檔案：

- `src/pages/IdiomAssociationGame.tsx`
- `src/lib/chainGame.ts`
- `src/pages/AssociationCharacterDetailPage.tsx`

與接龍共用資料池，但增加「目標字位於第一至第四字」的位置維度。

每輪四格：

- 先掃描每個位置是否存在候選；
- 無解位置標記為可跳過；
- 每格答對發基礎獎勵；
- 四格完成或標記無解後才發完成獎勵；
- 只有第一次破解某個字才可能觸發不同字數里程碑。

提示使用手機友善浮層。開啟提示時用假的 history entry 承接手機返回手勢，避免返回手勢直接卸載整個遊戲頁並遺失輸入狀態。

每個字保留最近 50 次破解明細。

## 9. 成語、錯別字、造句與筆記本

- 傳統成語題庫：`src/data/idioms.ts`
- 成語卡片：`IdiomsBrowse.tsx`、`IdiomCard.tsx`
- 成語測驗：`IdiomsQuiz.tsx`
- 造句：`SentencePractice.tsx`、`sentenceCheck.ts`
- 錯別字：`src/data/confusables.ts`、`ConfusablesQuiz.tsx`
- 成語筆記本：`NotebookPage.tsx`

教育部資料的來源與授權標示必須保留。修改內容或資料管線前先確認該資料是否屬於不可改作或需署名的來源。

語音輸入由 `speechRecognition.ts` 包裝瀏覽器原生 Web Speech API，語言為 `zh-TW`；瀏覽器不支援時不顯示麥克風按鈕。

## 10. 古文破譯家

完整規格以古文 SOP、skill、進度表及教材主檔為準。本節只列全站接手摘要。

核心學習鏈：

```text
待破解古文
→ 查看真實古文線索
→ 比較證據
→ 提出假說
→ 取得密碼鑰匙
→ 放回原文
→ 更新故事畫面
→ 全文排序／因果／證據邊界
→ 解鎖白話驗證與徽章
```

硬限制：

- 古文全文、線索、出處、字詞與語序不得自行改寫。
- 未明確核准的教材不得實作成正式內容。
- 改善白話、選項、回饋或互動前，要列出目前版本、建議版本、理由、教學影響與實作影響，等使用者核准。
- 白話線索只保留當題目標字詞為未知；其他與目標無關的字詞必須正常翻譯。
- 成人編輯備註不能進入孩子畫面。
- 最終白話驗證必須在必要步驟完成後才解鎖。
- `finalDraftLine` 只能放在對應收尾因果鏈卡片的步驟。
- 課程編號由目前陣列順序 `index + 1` 推導，不另存寫死欄位。

目前 App 已包含七篇：

1. 司馬光破甕救友
2. 刻舟求劍
3. 王戎不取道旁李
4. 守株待兔
5. 揠苗助長
6. 掩耳盜鐘
7. 鄭人買履

《鄭人買履》已完成 App 實作與線上驗收。第八篇《長竿入城》與第九篇《楊氏之子》的最新教材核准邊界，以 `GUWEN-PROJECT-STATUS.md` 和各自唯一主檔為準；目前尚未加入 App 課程資料。

## 11. TTS 與音效

### TTS

`src/lib/speech.ts` 的 `ttsSafe()` 在送入 `SpeechSynthesisUtterance` 前做限定範圍的同音替換，修正瀏覽器選錯讀音。

新增規則時：

1. 不改畫面顯示原文。
2. 在 `ttsSafe()` 上方活文件註解記錄原因、正確注音、錯誤讀音、替代字、誤傷風險與 scope。
3. 優先使用 lookahead／lookbehind 或完整片語縮小範圍。
4. 同時驗證目標字串有替換，以及鄰近常見用法沒有被誤傷。
5. 不重複或隨意改動既有規則。

測試時可 monkey-patch `window.speechSynthesis.speak` 與 `cancel` 捕捉送出的文字；不要整個替換唯讀的 `speechSynthesis` 物件，也不要替換原生 `SpeechSynthesisUtterance` 建構子。

### 多音字 TTS 實聽台

- 專用路由：`/#/tts-audit`；不放入孩子的主選單，由教材編輯者直接開啟。
- 頁面：`src/pages/TtsAuditPage.tsx`。
- 所有播放都呼叫正式 App 的 `speak()`，因此會經過同一套 `ttsSafe()` 修音規則。
- 正式候選資料：`src/data/guwenPronunciationAudit.ts`；每筆依篇章、題號、穩定語音單元 ID 與目標字具體出現位置建檔。
- 雲端讀寫：`src/lib/ttsAuditCloud.ts`。沿用既有匿名 Firebase Authentication，但使用獨立的 `families/GUWENTTS-*` 文件；不得併入孩子的 `AppData`。
- 點選「念對／念錯」後立即寫入中央資料庫，畫面必須顯示成功、失敗或重送狀態；成功寫入會產生回傳編號。另提供「重新同步全部結果」作為補送入口。
- 可一次貼入多行完整語音單元、逐句或依序播放，並複製包含裝置與可見 `zh-TW` 聲音資訊的備份。臨時加入者標為「待分類」，正式使用前要補進候選資料檔。
- 獨立 localStorage key `guwen-tts-audit-v1` 只作離線備份與舊版資料遷移；它不是正式資料庫，也不得同步到孩子的 Firestore 學習資料。
- 編輯代理開始多音字工作時先執行 `npm run tts:audit:pull`，讀回中央資料庫後再更新教材主檔與孩子端提示。
- `getTtsInput()` 只供成人測試頁查看實際送入語音引擎的文字；正式孩子畫面仍顯示原文。

### 音效

`src/lib/sound.ts` 使用 Web Audio oscillator 即時合成，沒有 mp3／wav 資產。新音效應沿用共用 AudioContext 與 `tone()`，並顧及瀏覽器必須由使用者互動解鎖音訊的限制。

## 12. 驗證流程

每次修改至少執行：

```bash
npx tsc -b
npm run build
git status --short
```

涉及互動、路由、TTS、localStorage、Firebase 狀態或手機行為時，另做瀏覽器端實際驗證。可使用一次性 Playwright 腳本，但：

- 腳本放 repo 根目錄，以便解析本地 `node_modules`；
- 使用本機根網址 `http://127.0.0.1:<port>/#/...`；
- 測試完移除腳本與暫時依賴；
- 確認 `package.json`、`package-lock.json` 未留下非必要變更；
- 停止 preview server；
- 再次檢查 git status。

目前沒有正式 Jest／Vitest 測試套件，不能把「build 通過」宣稱為完整互動驗收。

## 13. Git 與交付

- 固定使用 `claude/chinese-learning-app-justin-yjcfam`。
- 不 force push。
- 不使用 `git reset --hard` 清除使用者變更。
- 不操作其他分支。
- 不主動開 PR。
- Commit 訊息使用繁體中文，說明修改目的。
- 是否 commit／push 依使用者當次指示；「放到 GitHub」代表需要 commit 並 push。
- Push 前確認遠端没有新提交；必要時先安全同步，不覆蓋其他工作。
- 交付時簡短說明修改檔案、驗證結果、部署狀態與尚待確認事項。

## 14. 已知維護注意事項

1. `README.md` 可能落後於現行雲端同步與功能規模；本文件與程式碼優先。
2. Repo 目前有根目錄與 `lessons/` 下內容不同的《長竿入城》檔案，以及兩份內容不同的 design standard。處理古文前必須依 SOP、最新進度表與使用者確認唯一主檔，不得自行刪除或合併。
3. `GachaPage.tsx` 的部分靜態說明可能仍只提到 2 的 n 次方，但目前角色池已擴充至八個 base。
4. npm 依賴掃描可能回報安全風險；不要未經評估就執行 `npm audit fix --force`，因為它可能帶來破壞性升級。

## 15. 修改前最後檢查

- 我是否讀完本文件與任務相關的專門規範？
- 我是否確認固定分支與乾淨基準？
- 我是否找到唯一資料來源，而不是沿用過期 README 或平行副本？
- 我是否保留舊 localStorage／Firestore 相容性？
- 我是否避免寫死可由資料推導的數字？
- 我是否使用既有獎勵、mutation、同步、語音與音效慣例？
- 若涉及古文，我是否只使用已核准內容且逐字保留古文？
- 我是否準備好執行型別、建置與必要的實際互動驗證？
