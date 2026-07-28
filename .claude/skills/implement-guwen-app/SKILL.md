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
- `src/lib/speech.ts`: shared `speak()` / `speakSequence()` / `ttsSafe()` path.
- `src/lib/rewards.ts` and storage hooks: rewards and persistence.

Do not restore the deleted word-puzzle format. Reuse shared types and components before adding lesson-specific branches.

## Implementation rules

1. Use stable ids and explicit prerequisites; never use array position as persistent identity.
2. Preserve authored option order when the master fixes or audits it.
3. Represent evidence, reconstruction, reveal, local inference, story reasoning, and closing interactions according to their actual behavior, not their heading alone.
4. Keep the final vernacular verification locked until every required step and closing is solved.
5. Preserve progress compatibility or add an explicit revision/migration strategy.
6. Use shared reward constants and mutation paths; do not hard-code page-local rewards.
7. Keep one low-pressure mission-acceptance screen and a separate full-text listening screen unless approved content says otherwise.
8. Make sequence ordering touch-friendly with the existing drag handle, edge scrolling, position feedback, and keyboard fallback.

## Correct-answer sequence

For a regular graded step:

1. Hide options and show the complete `correctFeedback` field as an independent core-answer card.
2. Auto-play the complete core answer. While it plays, provide the contract-defined skip action; a deliberate skip counts as completing the core playback.
3. Keep the core card visible; only then show rewards underneath and run the reward animation.
4. After rewards settle, add a separate `詳解` card containing only `explanation`; never move extra `correctFeedback` paragraphs into it.
5. Start detail playback at `explanation`; never replay the core answer.
6. Show keys and the next-step action when the detail card appears. Detail reading or playback is optional and must never gate the next step.
7. If the child chooses the next step while detail audio is playing, cancel that playback and advance immediately.

Track and clear delayed playback or fallback timers. Guard reward writes so speech `onend` and a fallback cannot grant twice.

## Speech boundary

Review pronunciation in the normal draft preview and formal App. Do not scan all polyphonic characters, build audit catalogs, open the old listening page, pull central audit results, or wait for a legacy audit stage.

Fix demonstrated problems through the shared speech path, preserve displayed classical text, scope substitutions to the exact phrase or justified locale-wide case, and test nearby text that must remain unchanged.

## Validate

Run at least:

```bash
npx tsc -b
npm run build
git status --short
```

Also run task-specific format, preview-parser, TTS, data, or browser interaction checks from the contract. A successful build is not a complete interaction test.

Before delivery, compare the implementation back to the approved master, confirm no unapproved copy change, fetch the remote branch again, integrate safely, push, and remotely verify the result.
