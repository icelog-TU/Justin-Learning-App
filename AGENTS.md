# Repository instructions

Before changing any file, read `FULL-SITE-HANDOFF.md` completely.

Use the existing branch `claude/chinese-learning-app-justin-yjcfam`; do not create another branch. If the task touches 古文破譯家, also follow `GUWEN-WORKFLOW-SOP.md`, `GUWEN-PROJECT-STATUS.md`, the relevant lesson master file, and the two skills under `.claude/skills/`.

If the task adds or changes any child-facing spoken text, TTS behavior, pronunciation hint, or polyphonic-character audit data, read `GUWEN-TTS-CENTRAL-DATABASE-HANDOFF.md` completely before editing. Use the existing production audit page at `https://icelog-tu.github.io/Justin-Learning-App/#/tts-audit`; do not create a second audit page or database. Pull the central results with `npm run tts:audit:pull` before making pronunciation decisions.

Current code and the explicit instructions in the user's active task take precedence over stale historical documentation. Run the validation required by `FULL-SITE-HANDOFF.md` before delivery.
