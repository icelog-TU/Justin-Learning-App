# Repository instructions

Before changing any file, read `FULL-SITE-HANDOFF.md` completely.

Use the existing branch `claude/chinese-learning-app-justin-yjcfam`; do not create another branch. If the task touches 古文破譯家, also follow `GUWEN-WORKFLOW-SOP.md`, `GUWEN-PROJECT-STATUS.md`, the relevant lesson master file, and the two skills under `.claude/skills/`.

If the task adds or changes any child-facing spoken text, TTS behavior, pronunciation hint, or polyphonic-character audit data, read `GUWEN-TTS-CENTRAL-DATABASE-HANDOFF.md` completely before editing. Use the existing production audit page at `https://icelog-tu.github.io/Justin-Learning-App/#/tts-audit`; do not create a second audit page or database. Pull the central results with `npm run tts:audit:pull` before making pronunciation decisions. When a lesson's full child-facing copy is complete, every polyphonic-character occurrence in every exact playable utterance must be batch-added to the formal audit catalog; an agent may discover and upload candidates but must never claim an audible TTS result. Only the user can mark each target occurrence `念對` or `念錯` after listening on the real device. A current target-level `念對` result means no cue for that target; a current target-level `念錯` result requires a nearby pronunciation line immediately after that utterance. If one sentence contains several polyphonic targets, store a separate decision for each target and do not submit until all have been judged.

When the user says a lesson is finalized and asks to start polyphonic-character listening, or says listening is complete and asks to apply the results, read and execute `GUWEN-POLYPHONIC-AUDIT-RUNBOOK.md`. Recognize the two short trigger sentences and equivalent natural wording; never require the user to paste the long workflow again.

Current code and the explicit instructions in the user's active task take precedence over stale historical documentation. Run the validation required by `FULL-SITE-HANDOFF.md` before delivery.
