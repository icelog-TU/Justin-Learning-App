# 古文破譯家：Markdown v1 教材 → `GuwenLesson` 建置模板

This is a field-by-field cheatsheet for turning an approved lesson-markdown document (GPT-collaborated,
"全文核准，可交付 App 實作") into a `GuwenLesson` object in `src/data/guwenLesson.ts`. It captures the
structural pattern that has now held across four source documents (司馬光, 刻舟求劍, 王戎, 守株待兔) — use it
to skip re-deriving the mapping from scratch every time, but it does **not** remove the judgment calls
flagged below; those still need a real read of the specific document.

Read `.claude/skills/design-guwen-decoding/SKILL.md` and the "Why the evidence-lesson format exists" /
"Authoring checklist for a new lesson" sections of `../SKILL.md` first — this file only covers the
mechanical markdown→field mapping, not the pedagogical design rules.

## 0. 唯一 Markdown 格式

所有新舊教材一律先符合 repo 根目錄的 `GUWEN-MARKDOWN-FORMAT.md` v1。本模板只解釋標準欄位如何
映射到 App schema，不再把歷史別名視為等價正式格式。禁止自行使用 `App 引導語`、`推理提問`、
`提交假說`、`正解`、`答錯提示`、`線索類型與來源` 等舊標題。

## 1. Section header → field mapping

| Markdown header | `GuwenLesson`/`LessonStep` field |
|---|---|
| `# 篇名` | `title` |
| `## 出處` | `source` |
| `## 本課採用原文` | `fullText` (verbatim, never reformatted) |
| `## 教材編輯用分句` | `sentences` — **verify** `sentences.join('') === fullText` with `node -e` before committing |
| `## App 開場白` | `introSpokenLine` — if the doc splits it into multiple `>` blocks, join with a space into one spoken line |
| `# 第N題｜破解「X」` | one `EvidenceStep`/`LocalInferenceStep`/`StoryReasoningStep` |
| `# 第N題｜把密碼放回「XYZ」` / `組合問題` | one `ReconstructionStep` (only if it also has `選項`/`正解` — see §3) |
| `## 待破解的目標句` | `targetSentence` — strip the `【】` brackets, keep the plain classical substring; it must literally appear inside (or contain) one entry of `sentences` — the app's "currently reading" highlight during full-text playback matches by substring, not by id |
| `## 孩子端｜麻煩古文破譯家幫忙` | `intro` |
| `### 線索一` / `二` | `clues: [ClassicalClue, ClassicalClue]` — `text` = the clue sentence verbatim, `highlight` = the bracketed substring, `source` = the nested `#### 出處（成人資料）` |
| `#### 已破解為` | `clue.unlockedMeaning` — **omit this field entirely** (not an empty string) whenever the doc itself omits it or marks it "故意不給白話翻譯" (see §4) |
| `## 請古文破譯家提交解法` | `question` |
| `## 選項` | `options` (array, in doc order) |
| `## 正確答案` | `correctIndex` (0-based index into `options`) |
| `## 答對回饋` | `correctFeedback` |
| `## 第一次答錯提示` | `retryHint` |
| `## 詳解` (+ any trailing `### 放回本篇`/`### 證據邊界`/`### 本題線索來源` paragraphs) | `explanation` — concatenate all of it with `\n\n` between paragraphs, in the doc's own order |
| `## 破解後放回原文` | `finalDraftLine` — **only the new incremental clause**, not the whole cumulative sentence (see §5) — and **only present when the doc has this section at all** (see §6) |
| `## 已知線索` / `## 已有的密碼鑰匙` (a table) | `keys: DecodingKey[]` on a `ReconstructionStep` — copy the table's own wording verbatim, do not add your own annotations (see §7) |
| `## 本題取得的密碼鑰匙（作答後才顯示）` | `keyAwarded: { code, decodedEvidence }` — copy verbatim; **never** let this text leak into `intro`/`question` (the doc's own "編輯提醒：不得出現在孩子作答前" is already enforced by the app only ever displaying `keyAwarded` after a correct answer) |
| A prose note like "「其」會把後面的東西連回前文中的人物" that isn't inside a formal `## 已有的密碼鑰匙` table | fold it as a sentence into that step's `intro`, ahead of the App 引導語 text — it's safe context (explains an *already-known* code), not an answer leak |
| A "已學密碼：直接調用，不重新教學" table at the top of the document (codes taught in a *previous* lesson) | do **not** create a step for these at all — just use the doc's own wording directly inside whichever `keys`/`intro` text references them later |

## 2. Two closing-screen headers that need judgment, not just mapping

A source doc's own section numbering may call something a "因果鏈"/"causal chain" even when it is actually a
**graded** reordering task, not a display-only summary. Check the actual interaction spec, not the header
name:

- **Graded** (child must arrange/answer something and can get it wrong, with a `retryHint` and an exact
  correct answer) → `sequenceOrderingClosing`. This is true even if the doc's own heading says "因果鏈" —
  守株待兔's 第十八題 is titled "完成全文因果鏈" but has real shuffled cards, a `正確順序`, and an explicit
  "答錯時保留孩子目前的排列，只顯示答錯提示；不得...公布完整順序" rule, i.e. it's graded → maps to
  `sequenceOrderingClosing`, **not** `causalChainClosing`, despite the name.
- **Display-only** (explicitly says "不需作答", no correct/incorrect state, just a continue button) →
  `causalChainClosing`.
- A lesson can use one, both, or neither — they're independent optional fields (see `../SKILL.md`'s "Three
  independent, individually-optional closing screens"). Don't force a lesson into using both just because an
  earlier lesson (刻舟求劍) did.
- If a *graded* sequence-ordering screen's post-solve content is more than just a one-line
  `correctFeedback` — e.g. it also needs to show an evidence table and/or an assembled causal-chain summary,
  the way 守株待兔's 第十八題 does — use `SequenceOrderingClosing.explanation` (optional field, added for
  this lesson) rather than inventing a redundant separate `causalChainClosing` screen right after it.
- `## 哪些是古文明確寫出的？` (a multi-select "which of these does the text prove" task) →
  `evidenceMultiSelectClosing`. Its per-option `detail` comes from the doc's own "原文證據：..." annotations.
  A doc's separate "第二層｜有證據支持的合理推論" content (something that's *plausible* but isn't one of the
  yes/no options) has nowhere else to live in the schema — fold it into `finalNote` alongside the doc's own
  reminder line, exactly like the multi-layer reminder pattern already established for 王戎's 題17 (see
  `../SKILL.md`).

## 3. `ReconstructionStep` vs `RevealStep` — read the actual doc content, not the section title

A "把密碼放回「XYZ」"-titled section is **not automatically** a no-question `RevealStep`. Check whether it
has its own `## 選項`/`## 正解`/`## 答錯提示`:

- Has them → `ReconstructionStep` (a real graded step, `keys` from the "已知線索"/"已有的密碼鑰匙" table).
- Explicitly has none, and the doc says something like "不另設整句選擇題" → `RevealStep` (`keys`, `intro`,
  `continueLabel`, `correctFeedback`, `explanation`, no `question`/`options`/`correctIndex`/`retryHint`).

守株待兔 is a data point worth remembering: **every one of its "組合問題" reconstruction sections has real
options/正解/答錯提示** — it uses zero `RevealStep`s, unlike 刻舟求劍 which uses several. Don't assume a new
lesson needs `RevealStep` just because a previous one did; check this document's own sections.

## 4. When to omit `ClassicalClue.unlockedMeaning`

Omit the field (delete it, don't set `''`) whenever:
- the doc explicitly has no `### 已破解為` block for that clue, or
- the doc's own editorial note says something like "故意不給白話翻譯" / the clue pair exists specifically so
  the child compares two *bare* clues and induces a positional pattern themselves.

When you do write one, wrap the decoded word/phrase in `「」` — `highlightQuoted()` in
`GuwenLessonDecode.tsx` picks up `「...」` spans and highlights them, matching the highlighted classical text
above it. This was a standing user request across every lesson: every `unlockedMeaning` line's echoed
classical term must be quoted and highlighted, not just quoted.

## 5. `finalDraftLine` is an incremental delta, not the cumulative sentence

The doc's own `## 破解後放回原文` section shows the **whole story so far** (e.g. "宋國有一位耕田的人...兔子奔跑時
撞上了樹樁"). `finalDraftLine` on that step must hold only **the newly added clause** — the part contributed
by *this* step — because `GuwenLessonDecode.tsx`'s lesson-complete celebration narrates
`[...lesson.steps.filter(s => s.finalDraftLine).map(s => s.finalDraftLine)]` in step order; storing the full
cumulative text on every step would repeat every earlier clause over and over in that narration. Diff the
current step's "放回原文" text against the *previous* finalDraftLine-bearing step's cumulative text and keep
only the new part.

## 6. Not every step has a `finalDraftLine` — and that's correct, not a gap

Only steps whose doc section actually includes `## 破解後放回原文` get one. A step that only decodes a single
character in isolation (e.g. 守株待兔's 第八題 "把密碼放回「釋其耒」") can legitimately have **no**
`finalDraftLine` at all if the doc doesn't narrate that intermediate clause — don't invent one to "fill the
gap." The final assembled story is still complete because a *later* step's `finalDraftLine` picks up the
accumulated text including that clause.

## 7. Keys tables: copy the doc's wording verbatim, don't add your own annotations

Earlier lessons' code sometimes appended a "（舊鑰匙）" marker to a `DecodingKey.decodedEvidence` string when
the code was taught in an *earlier* lesson (e.g. 刻舟求劍's `{ code: '於水', decodedEvidence: '到水裡（舊鑰匙）' }`).
**Only do this if the source doc's own table already contains that annotation or the equivalent wording.**
An approved lesson doc's own `已知線索`/`已有的密碼鑰匙` table text is the implementation baseline per the
app-implementation-contract ("已核准的現代中文文案作為 App 實作基準...不得直接覆蓋") — copy it exactly, and
don't retrofit a previous lesson's decorative convention onto new content the user hasn't reviewed with that
addition.

## 8. `finalVerification`

- `translation` = the doc's `## 完整白話文`, joined into one paragraph (or kept as the doc's own line breaks
  if it explicitly separates by sentence group).
- `guideLine` = the doc's `## 驗證提示`; if the doc also has a `## 白話文證據邊界` paragraph, append it after
  the guideLine text (with `\n\n`) rather than dropping it — there's no separate field for it, but it must
  still reach the child per the "must-display" rule.
- `comparisonRows` — not usually given as a ready-made table in the source doc; build 4-6 rows yourself,
  pairing each already-decoded classical clause with its vernacular line and a short `relationship` label
  ("同一事件"/"同一結果"/etc.), covering the whole text without needing one row per step.
- `completionFeedback` — prefer the doc's own "可選短版" encouragement line if one exists (it's the right
  length for this field); the doc's full-length "給孩子的鼓勵" essay belongs in the grand lesson-complete
  celebration's narration instead (`lesson.fullText` + every `finalDraftLine`), not here — don't duplicate
  the whole essay into both places.
- `prerequisiteStepIds` = every step id in order, followed by every present closing screen's id
  (`sequenceOrderingClosing.id`, then `causalChainClosing.id`, then `evidenceMultiSelectClosing.id`, whichever exist).

## 9. A source doc's own "全文破解完成｜給孩子的鼓勵" choreography section is informational, not a spec to rebuild per-lesson

Some docs (守株待兔's included) describe a bespoke completion choreography in more detail than the app
currently implements per-lesson (e.g. a named badge graphic, a specific sound-tier build-up, an explicit
reduced-motion requirement). The app already has one **generic, shared** grand celebration
(`showLessonCelebration` in `GuwenLessonDecode.tsx` — see `../SKILL.md`'s "whole-lesson completion screen"
section) that every lesson gets automatically, no per-lesson code needed. Default to reusing it as-is rather
than building bespoke per-lesson celebration assets — flag the gap to the user explicitly (don't silently
under- or over-deliver) if a doc's spec asks for something the generic celebration doesn't cover (e.g. a
lesson-specific badge image, or the reduced-motion accessibility toggle, which is not yet implemented for
this feature at all).

## 10. Final steps

1. Add the new `GuwenLesson` object to `guwenLessons` in `guwenLesson.ts` (no other wiring needed —
   `GuwenHome.tsx` and routing pick it up automatically).
2. `npx tsc -b && npm run build`.
3. Verify every step in order plus any closing screens with a temporary Playwright pass (see `../SKILL.md`'s
   "Verifying changes" section for the install/test/uninstall pattern).
4. Update `../SKILL.md` with anything this lesson's document needed that this template didn't already cover.
