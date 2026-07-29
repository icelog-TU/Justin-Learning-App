---
name: design-guwen-decoding
description: Design, write, revise, or review elementary-school 古文破譯家 lesson content and Markdown masters. Use for text selection, segmentation, target selection, authentic classical clues, hypotheses, options, feedback, reconstruction, evidence boundaries, lesson rewrites, and curriculum approval. Do not use for converting approved content into production App data, components, routes, rewards, persistence, deployment, or TTS code; use implement-guwen-app for those tasks.
---

# Design Guwen Decoding

Work only on curriculum content and adult review. The child is the 古文破譯家; the AI finds and organizes evidence, admits what remains uncertain, and asks the child to compare clues.

## Start

1. Read the repository `AGENTS.md` and `GUWEN-WORKFLOW-SOP.md`.
2. Read only the target lesson's `active` master from `GUWEN-PROJECT-STATUS.md`. If the path is unresolved, stop and ask which version is active.
3. For a new lesson, new target, teaching-method change, or full pedagogical review, read all of `../../../design-standard.md`.
4. For copy-only refinement of intros, questions, retry hints, or core answers, even across the whole lesson, read only the `孩子端文字：保留求助情境，刪除機械重複` section of `../../../design-standard.md` unless a concrete pedagogical conflict requires another section.
5. Search `../../../guwen-decoder-learned-keys.md` by target word, phrase, and lesson title. Do not read the whole registry unless maintaining it.
6. Read `../../../GUWEN-MARKDOWN-FORMAT.md` only when creating a master, changing structure, or fixing format validation.
7. Read [canonical-example.md](references/canonical-example.md) only when a concrete 「單字破解→組合→本篇推論」 model is needed.

In the same conversation, reuse unchanged files already read. Reread only when their remote blob changes, the task changes mode, or a conflict appears.

## Keep the task in this skill

Use this skill for:

- choosing or rewriting a lesson after child testing;
- resolving segmentation as an adult editorial decision;
- selecting the smallest useful targets;
- finding and checking authentic classical clues;
- writing child-facing prompts, options, feedback, hints, explanations, and reconstruction;
- reviewing answer leakage, cognitive load, evidence boundaries, sources, answer positions, or lesson length;
- updating the lesson master, its current status, and approved keys.

Do not edit production App data or UI. When the approved lesson is ready for implementation, hand it to `implement-guwen-app` without loading both skill bodies into an ordinary curriculum task.

## Work in small approved scopes

1. Confirm the active master, current approval boundary, target questions, and relevant old keys.
2. Preserve approved sections outside the agreed scope.
3. Mark new content as draft or pending review.
4. Before changing approved modern copy, present the current version, proposal, reason, and learning effect.
5. Never change the classical source text, authentic clues, attribution, wording, or order without explicit textual-review approval.
6. Treat a rewrite as a new approval timeline. Do not inherit old approval or key counts automatically.

## Choose the authoring rhythm

Two rhythms are valid. Follow the user's current instruction; do not treat either rhythm as permanent.

### A. Question-by-question or small-scope iteration

Use this when the user asks for one question, a few questions, or a local revision. Keep the agreed scope small, update only that scope, and do not continue writing the whole lesson just because surrounding files are available.

### B. Whole-lesson 20-question blueprint first

Use this when the user asks to plan a new lesson, rewrite a whole lesson, or discuss the whole lesson before drafting. First produce or revise a roughly 20-question blueprint for review before writing full Markdown question text.

The blueprint is not approved lesson content and must not be sent to implementation. It should list, at minimum: source segment, target, planned question type, clue/source-search direction, old-key use or reminder, reconstruction/sorting/causal/evidence-boundary role, expected new key, and risks.

Blueprint review checks whole-lesson structure before detailed drafting: total count near 20 and never over 22, sequence, difficulty curve, repeated targets, valid reconstruction points, old-key reuse, source-independence risk, answer-position distribution, and whether every planned question contributes to reading the story.

After blueprint review, revise the plan, then draft/update the active master as draft or pending review. The adult preview App remains the place for the user to review the actual child-facing text, states, and speech question by question. If the user decides the blueprint rhythm is not useful, switch back to rhythm A for the next scope without treating the blueprint as a binding approval.

## Escalate cross-lesson rules

When one lesson exposes a rule that should govern other lessons, fix only the user-approved current scope and prepare a proposal with the problem, candidate rule, canonical file, future-only or retroactive scope, and likely affected lessons. Route the proposal through the workflow-maintenance process in `../../../GUWEN-WORKFLOW-SOP.md`; do not create or independently edit shared SOP, skill, handoff, or design-standard copies from an ordinary lesson task.

## Core lesson sequence

For each useful target:

1. Establish the unchanged original text and resolve segmentation internally.
2. Select one observable meaning, function, reference, relation, or narrative feature.
3. Search real classical usage first. Verify wording, continuation, attribution, excerpt boundary, and independence from the target lesson's source story. Do not use the target text, same story, same episode, retelling, quotation, alternate wording, or near-paraphrase as an independent clue.
4. Give two short clues in the same relevant use when two independent clues are useful.
5. Translate surrounding information while keeping the target visible and untranslated.
6. Ask for a neutral hypothesis; do not preview the answer or option shapes.
7. Explain through the two evidence scenes, their shared feature, the supported hypothesis, failed distractors, and remaining uncertainty.
8. Award a concise decoding key after success.
9. Add a reconstruction question only when combining keys creates a new relation, direction, cause, sequence, or evidence-boundary judgment.
10. Return the result to continuous reading and unlock the final vernacular verification only after required work is complete.

## Final checks for each question

- The child needs evidence rather than dictionary recall or an obvious option.
- The intro, glosses, question, retry hint, imagery, and audio do not state the answer literally or indirectly.
- The target remains quoted in the clue gloss instead of being translated, deleted, or replaced by a revealing synonym.
- Clues are short, source-traceable, grammatically sufficient, and use the target compatibly.
- Every AI-written or hybrid classical clue sentence has a real source backbone recorded in adult/source notes; do not write classical-sounding sentences from impression alone.
- Clue sources are not the target text, same story, same episode, retelling, quotation, alternate wording, or near-paraphrase of the lesson's source.
- Options are short, parallel, plausible, and test one thing.
- The intro asks for help naturally, the question asks for one judgment, and neither repeats the same request or clue summary.
- Necessary clue synthesis is brief and functional; repeated uncertainty or pleas do not substitute for evidence.
- Remove repeated greetings, role pleas, and operating instructions, not purposeful learning reinforcement. A target meaning, relation, or reasoning principle may reappear in `答對回饋`, return-to-text reconstruction, and later review when the repetition supports memory.
- The full lesson's correct-position sequence has no easy pattern.
- `答對回饋` is one concise, independently understandable core-answer paragraph that immediately states the judgment or acquired key.
- Evidence comparison, distractor analysis, and other optional elaboration belong only in `詳解`; follow the exact boundary in `../../../GUWEN-MARKDOWN-FORMAT.md`.
- Adult/source notes remain outside child-facing playback.
- The lesson stays near 20 questions and never exceeds 22.

## Pronunciation boundary

Mark which child-facing fields are playable and review their actual speech together with layout in `/#/guwen-draft-preview`. Do not perform a separate polyphonic scan, create audit candidates or catalogs, use the old listening page, pull central results, or wait for legacy audit completion. Never alter displayed classical text to fix speech.

As of 2026-07-29, pronunciation explanations are authored only inside the core answer (`答對回饋` / `核心解答`). Do not add Zhuyin, homophone cues, or "念作／唸作／發音同" notes to the target sentence, original text, clues, clue glosses, intro, question, options, or retry hint. If a pronunciation explanation is pedagogically needed, write it once as part of the core answer sentence, where it can be read in context after the child answers.

## Finish a review batch

1. Save new material in the same active master as draft or pending review; never label it approved early.
2. Update only the target row in `GUWEN-PROJECT-STATUS.md` when its approval boundary or next step changed.
3. Update the key registry only for approved new keys or reminders that actually occurred.
4. Run `npm run check:guwen:master-format` when Markdown structure or formal content changed.
5. Commit, push, and reread the remote result before asking for review.
6. Return only the review scope, two to five change highlights, approval state, validation result, and commit SHA; do not paste the full question or lesson.
7. Provide both links required by `../../../GUWEN-WORKFLOW-SOP.md`: the fixed-branch GitHub MD link at the first target question and the adult preview link at that human question number with `state=answering`. Add `state=wrong` or `state=correct` only when that state changed.
8. Follow the SOP's authoring boundary: verify the link parameters from repository sources, but do not open the preview page, request browser permission, or block delivery because browser access is unavailable.
