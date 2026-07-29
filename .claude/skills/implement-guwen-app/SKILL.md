---
name: implement-guwen-app
description: Implement already-approved 古文破譯家 lessons and maintain their production App data, components, routes, interaction states, rewards, persistence, preview behavior, accessibility, and TTS. Use when converting an approved lesson master into the formal App or fixing the existing 古文破譯家 implementation. Do not use for selecting texts, sourcing clues, writing or approving curriculum content; use design-guwen-decoding for those tasks.
---

# Implement Guwen App

Implement approved content faithfully. Adapt code to the lesson; do not rewrite the lesson to fit the schema.

## Start

1. Read `../../../AGENTS.md`, `../../../FULL-SITE-HANDOFF.md`, and `../../../GUWEN-WORKFLOW-SOP.md`.
2. Resolve the lesson's `active` path and approval boundary from `../../../GUWEN-PROJECT-STATUS.md`.
3. Read the complete approved active master and [app-implementation-contract.md](references/app-implementation-contract.md).
4. Inspect current types, lesson data, shared page, progress state, rewards, speech wrapper, routes, and tests before editing.
5. Read [schema-map.md](references/schema-map.md) only when mapping or auditing Markdown against `GuwenLesson`.
6. Read [tts.md](references/tts.md) only for speech, playback controls, pronunciation cues, or `ttsSafe()` work.

Do not load the curriculum-design skill unless the user also requests content changes. In a mixed task, separate proposed curriculum changes from implementation and obtain approval before adopting them.

## Source and scope

- Use exactly one `active` lesson master. Stop if status lists an unresolved pair.
- Preserve every approved classical character, authentic clue, source, modern copy, option order, key, hint, explanation, and unlock boundary.
- Keep adult-only notes out of child-facing data and playback.
- Treat lesson-specific archived files, skill examples, old catalogs, and conversation attachments as non-authoritative.
- Preserve unrelated local and remote work.

## Current App architecture

The only active lesson format is the evidence lesson model:

- `src/data/guwenLesson.ts` and lesson modules: data and types.
- `src/pages/GuwenLessonDecode.tsx`: shared lesson UI and state flow.
- `src/pages/GuwenDraftPreview.tsx`: adult GitHub-MD preview.
- `src/components/guwen/GuwenQuestionBlocks.tsx`: question-type presentation shared by the child App and adult preview.
- `src/lib/speech.ts`: shared `speak()` / `speakSequence()` / `ttsSafe()` path.
- `src/lib/rewards.ts` and storage hooks: rewards and persistence.

Do not restore the deleted word-puzzle format. Reuse shared types and components before adding lesson-specific branches. A new or changed question type must update the shared question blocks; do not recreate its layout independently in either page.

## Implementation rules

1. Use stable ids and explicit prerequisites; never use array position as persistent identity.
2. Preserve authored option order when the master fixes or audits it.
3. Represent evidence, reconstruction, reveal, local inference, story reasoning, and closing interactions according to their actual behavior, not their heading alone.
4. Keep the final vernacular verification locked until every required step and closing is solved.
5. Preserve progress compatibility or add an explicit revision/migration strategy.
6. Use shared reward constants and mutation paths; do not hard-code page-local rewards.
7. Keep one low-pressure mission-acceptance screen and a separate full-text listening screen unless approved content says otherwise.
8. Make sequence ordering touch-friendly with the existing drag handle, edge scrolling, position feedback, and keyboard fallback.
9. For complex closing questions, provide the contract-defined assisted completion after the first incorrect attempt.

## Correct-answer sequence

Follow the authoritative sequence in [app-implementation-contract.md](references/app-implementation-contract.md):

- Preserve immediate once-only reward feedback.
- Show and auto-play the independent core answer after the reward, with optional detail and next-step actions available immediately.
- Never let speech availability or completion gate navigation; cancel active speech when advancing.

## Speech boundary

Review pronunciation in the normal draft preview and formal App. Do not scan all polyphonic characters, build audit catalogs, open the old listening page, pull central audit results, or wait for a legacy audit stage.

As of 2026-07-29, the App implementation must not mine Markdown fields for separate pronunciation side notes. Do not populate new `pronunciationCues`, amber cue cards, per-sentence Zhuyin annotations, or extra playback lines from the target sentence, intro, question, clues, options, retry hint, or correct feedback. If the approved master explains pronunciation inside the core answer, keep that explanation in `correctFeedback` as normal text and do not duplicate it elsewhere.

Fix demonstrated TTS problems through the shared speech path, preserve displayed classical text, scope substitutions to the exact phrase or justified locale-wide case, and test nearby text that must remain unchanged.

## Validate

Run at least:

```bash
npx tsc -b
npm run build
git status --short
```

Also run task-specific format, preview-parser, TTS, data, or browser interaction checks from the contract. A successful build is not a complete interaction test.

Before delivery, compare the implementation back to the approved master, confirm no unapproved copy change, fetch the remote branch again, integrate safely, push, and remotely verify the result.
