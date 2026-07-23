---
name: design-guwen-decoding
description: Design, revise, or implement elementary-school classical Chinese learning materials for the 古文破譯家 app. Use when selecting short ancient texts, deciding sentence boundaries, choosing target characters or phrases, finding authentic cross-text classical clues with already-known meanings, writing evidence-based multiple-choice hypotheses and explanations, sequencing phrase reconstruction, updating a Markdown lesson, or converting an approved lesson into app data and UI. Preserve authentic classical text exactly; modern-Chinese explanations, question wording, options, feedback, and interaction formats may be improved only through explicit proposals and user approval. Do not use dictionary-definition drills or modern-Chinese example matching as the primary reasoning task.
---

# Design Guwen Decoding

Create materials in which the child acts as a codebreaker. Treat ancient texts as evidence to compare, not content to translate immediately.

Before drafting or revising questions, read:

- [design-standard.md](references/design-standard.md) for the required workflow and quality rules.
- [canonical-example.md](references/canonical-example.md) when an exact model of the 「甕 → 登 → 一兒登甕」sequence is useful.

Before implementing an approved lesson in an app or preparing a coding-agent handoff, also read:

- [app-implementation-contract.md](references/app-implementation-contract.md) for source-of-truth rules, logical data fields, interaction states, visibility gates, and acceptance tests.

## Choose the operating mode

Use exactly one primary mode for each task:

1. **Curriculum design mode**: select texts, resolve segmentation, design clues, write questions, or revise explanations. Follow the required workflow below.
2. **Approved-content implementation mode**: convert a reviewed lesson into app data, components, routes, or tests. Preserve classical quotations exactly. Use the current modern-Chinese copy as the implementation baseline, while allowing clearly separated improvement proposals for user review.
3. **Mixed mode**: when the user explicitly requests both content changes and implementation, separate the work into two passes. Present proposed modern-copy or interaction changes for approval before adopting them. Never silently rewrite any content while adapting it to the app.

## Core contract

Preserve this learning relationship:

- AI finds and organizes evidence.
- The child compares known classical clues.
- Options express competing hypotheses.
- The child selects the hypothesis best supported by all clues.
- The child returns to the original text and reconstructs the phrase.
- A final vernacular translation appears only after the whole text is decoded.

Never make the primary task:

- recall a dictionary definition;
- match the target ancient word directly to three modern sentences;
- select a full translation before gathering evidence;
- infer from one clue when two short, independent clues are available;
- explain all possible meanings of a character before resolving the current sentence.

## Required workflow

### 1. Establish the original text

Record title, source, full text, and provisional sentence divisions. Keep the original wording unchanged unless the user explicitly requests a textual variant.

### 2. Resolve segmentation internally before word meaning

For each new span, first determine whether more than one plausible segmentation exists. Treat this as an editorial analysis step, not a child-facing learning task.

If it does:

1. Compare two or at most three plausible segmentations internally or with the adult curriculum designer.
2. Identify what grammatical role each segment would need to play.
3. Find short classical parallels for the disputed combinations.
4. Prefer the segmentation that explains the syntax and narrative with the fewest unsupported assumptions.
5. State confidence and preserve genuine uncertainty.

Do not ask elementary-school children to choose punctuation or segmentation unless the user explicitly requests an advanced activity. Resolve the boundary first, then give the child the already-decided target word or phrase to decode.

### 3. Choose the smallest useful target

Select only elements that block the child from constructing the scene or that unlock reusable ancient syntax. A target may be:

- one character, such as 甕 or 登;
- a fixed or tightly bound phrase;
- a pronoun reference;
- a causal or narrative relationship.

Do not turn every character into a question.

### 4. Gather authentic classical clues

Use two short ancient-text examples containing the target in the same relevant use. Verify wording and source when possible.

For every clue, provide a child-friendly meaning that is already known. This gloss unlocks the clue; it must not translate the target sentence.

Keep each clue short enough to scan quickly. Trim to the smallest grammatical unit without distorting the source.

### 5. Ask for a hypothesis

After the clues, ask what shared meaning or function can explain both.

Provide three options because the app requires a closed response. Design them as hypotheses, not trivia:

- one explanation fits every clue;
- one distractor fits a surface word or only one clue;
- one distractor has the wrong object, direction, role, or relation.

Vary the correct-answer position. Do not make incorrect options silly.

### 6. Explain through evidence

Write the explanation in this order:

1. What happens in clue one?
2. What happens in clue two?
3. What feature is shared?
4. Which hypothesis explains both?
5. Why does each distractor fail?
6. What can be concluded now?
7. What remains unknown?

Do not open with “這個字有……意思” or list dictionary senses.

### 7. Reconstruct the target phrase

After decoding the necessary parts, display the acquired “密碼鑰匙” and ask the child to combine them in original order.

Use distractors derived from earlier clue scenes when helpful. Explicitly distinguish “the other text used as evidence” from “what happens in the current story.”

### 8. Update the model with local context

Ask one short follow-up when the original story supplies new information that the cross-text clues could not establish. Label it as an additional inference, not part of the base definition.

Example: other texts establish that 甕 is a liquid container; 一兒登甕 additionally suggests that this particular 甕 is large enough to climb.

### 9. Return to continuous reading

After each phrase is reconstructed, place it back in the running original text. Avoid trapping the child in an endless sequence of isolated items.

## Output requirements

For each target, include:

- target and source sentence;
- learning goal;
- two classical clues and their unlocked meanings;
- one three-option hypothesis question;
- correct answer;
- concise correct feedback;
- one evidence-based retry hint;
- full reasoning explanation;
- clue sources;
- reconstructed phrase question when multiple decoded parts combine;
- optional local-context inference;
- unresolved questions or uncertainty.

When editing an ongoing Markdown master file, preserve completed sections and append or revise only the agreed scope. Mark unfinished portions explicitly.

Do not prepare implementation code while core educational content is still awaiting approval. After approval, implement from the approved master file. Preserve every classical quotation exactly. Do not silently simplify, paraphrase, reorder, or omit modern instructional content; propose improvements separately and adopt them only after user approval.

## Child-facing style

- Use Traditional Chinese.
- Keep one screen focused on one reasoning move.
- Prefer short sentences and concrete verbs.
- Use “找到線索、比較、假說、證據、破解、放回原文” language.
- Let difficulty come from reasoning, not from long instructions or obscure clue sentences.
- Never claim the AI already knows the answer while role-playing uncertainty. Say that it found clues and needs the child to compare them.
- Keep punctuation and segmentation analysis out of the App-facing content unless explicitly requested.
- **Never pre-reveal the answer shape before the question.** This has recurred three times across this lesson, so treat it as a standing rule, not a one-off fix:
  - **Intro/prompt text must stay neutral.** Ask what a word/phrase or action *is*, never phrase it as a yes/no or either/or check against specific candidate readings. Real examples the user caught: 足跌's intro asked "這表示他已經整個摔倒了嗎？" (does this mean he's already fully fallen down?) — essentially distractor option 1 read aloud as yes/no; de_huo's intro offered "這是得到一樣東西，還是危險之後出現的新結果？" — directly presenting two of the three options as a binary choice; chi_shi_ji_weng's intro asked "到底是拿石頭敲甕，還是拿甕敲石頭？" — stating the correct reading and its reverse-direction distractor as the only two candidates, before the child had seen either clue. All three were fixed to a neutral "這是甚麼意思呢？" / "這到底是什麼動作？" form. When drafting or reviewing an intro line, check it doesn't echo the wording of *any* option (correct or distractor); if it does, generalize it.
  - **Never render a pre-answer breakdown table.** chi_shi_ji_weng's source lesson included a "線索零件表" (clue breakdown: clue → tool used → target hit) positioned *before* the question — if shown to the child at that point it hands over exactly the relationship the question is testing. This app never encoded that table as its own rendered field; the same tool/target breakdown only appears inside `explanation`, which the UI already gates to after a correct answer. Keep it that way: any "here's how the evidence breaks down" table belongs in `explanation` (or a post-solve review), never in `intro`/`clues`/`question`.
  - **Prefer asking about the actual target sentence over an abstracted pattern placeholder.** chi_shi_ji_weng's first version asked about an abstract "持Ａ擊Ｂ" pattern with options like "拿著Ａ，去敲打Ｂ" — correct in substance, but it skipped the "放回原文" (return to the original text) step of the required workflow, deferring it to the post-answer explanation instead. Rewritten so the question and options are about the real target sentence ("「持石擊甕」到底是什麼動作？" with options like "拿著石頭敲打甕"), so "放回原文" happens *in* the graded question, not just in the explanation afterward.
  - **A clue's `unlockedMeaning` must never translate the target word itself — keep it quoted, untranslated, inside an otherwise-modern-Chinese gloss.** design-standard.md already states this rule (§4, the canonical 抱【甕】而出灌 example keeps "「甕」" quoted), but it's easy to violate by accident, especially for function words: 眾's first draft glossed both clues as "大家都討厭一個人的時候..." and "...跟一大群人一起聽音樂..." — "大家" and "一大群人" *are* the correct option's wording, so the child never had to infer anything, just pattern-match the gloss to the option. 皆's first draft had the same problem more subtly: "項羽身邊的人全都哭了" and "陳勝和吳廣兩人都..." — "全都"/"都" are themselves a translation of 皆 into "entirely/all", not a neutral description of the surrounding scene. Both were fixed by keeping the target character quoted and untranslated in the gloss (e.g. "人數少的一方不能戰勝「眾」" — the relationship is translated, 眾 itself is not) — the same technique already used correctly everywhere else in this lesson (甕/登/足跌/沒水中/迸/得活/之). **Before shipping any evidence-type step, check every `unlockedMeaning` for the target character/phrase itself in translated (non-quoted) form — if it's there, the clue is leaking, not comparing.**
  - **Don't dodge the leak by hiding the target phrase behind a vague deictic either — that's a different bug, not a fix.** chi_shi_ji_weng's second draft avoided directly translating "持石擊地"/"持杖擊之" by writing "做完這串動作後..." instead — this technically stopped the leak, but it also broke the established convention (used correctly by every other step) of keeping the target phrase *quoted and visible inline* within the gloss, e.g. "有人有時會「持石擊地」，聲音便從遠處傳入磚中...". The child should always see the exact classical phrase they're decoding sitting inside the translated sentence — glossing around it with "這個動作"/"這串動作" instead removes a piece of the puzzle (which classical phrase does this evidence actually belong to?) that isn't the same as removing the leak. The fix is always: translate everything *except* the target phrase, and keep the target phrase itself in place, quoted.
  - **Fact-check a clue's continuation before writing its gloss — don't assume how a classical anecdote ends.** chi_shi_ji_weng's clue 2 ("某歸聞之，怒，持杖擊之") originally glossed as "...眼前的鬼挨了一下" (the ghost got hit) — invented without checking the source's actual next clause, which is "鬼出沒四隅，變化倏忽，杖莫能中" (the ghost dodges everywhere; the stick can never hit it) — the *opposite* of what was glossed. The user caught this because the fabricated ending happened to also match what a plausible-sounding gloss would say, which is exactly why it's dangerous: a wrong outcome that "sounds right" doesn't get caught by re-reading your own prose, only by checking the primary source's actual continuation. Fixed by extending the clue's quoted `text` to include the real continuation and glossing that faithfully. **Rule: before writing a clue's `unlockedMeaning`, know (from an actual source, not a guess) what happens in the clause(s) immediately following the target phrase — never infer or invent the outcome just because the target phrase implies a plausible one.**

## Source integrity

Search authoritative or primary sources when wording, attribution, or punctuation is uncertain. Distinguish exact quotation from an excerpt. Do not invent classical examples or force modern meanings into pseudo-classical sentences.

## Approved-content implementation boundary

When the task is to put a completed lesson into the app:

- inspect the existing repository, instructions, content model, navigation, and tests before editing;
- use the approved Markdown lesson as the content source of truth;
- keep adult-only editorial analysis out of child-facing screens;
- preserve prerequisite order, retry hints, uncertainty boundaries, and the locked final translation;
- adapt code and data structures to the content instead of rewriting content to fit an inadequate schema;
- add or update validation and interaction tests required by the implementation contract;
- preserve original classical texts and cross-text classical clues character-for-character; do not modernize, paraphrase, or fabricate them;
- when a better modern explanation, question form, option set, feedback message, or interaction is possible, present the current version, proposed version, reason, and learning impact for approval;
- implement the current approved version until a proposal is accepted; never treat a suggestion as permission to change the product copy.
