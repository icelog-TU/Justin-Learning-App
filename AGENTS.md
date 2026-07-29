# Repository instructions

Use the existing branch `claude/chinese-learning-app-justin-yjcfam`; do not create another branch. Before editing, fetch the remote branch, inspect `git status`, preserve existing work, and reread every target file from the remote latest version.

If a repository reader truncates a selected file, continue from the next unread line or range until EOF. When the missing content is recovered, do not interrupt the user with intermediate truncation reports; report only an unresolved inability to read the complete required file.

Choose one primary task path:

- **古文教材設計、撰寫或審稿**：read `GUWEN-WORKFLOW-SOP.md`, then use `.claude/skills/design-guwen-decoding/SKILL.md`. Read only the target lesson master, its row in `GUWEN-PROJECT-STATUS.md`, relevant entries in `guwen-decoder-learned-keys.md`, and conditional references named by the skill.
- **核准古文教材轉入正式 App、古文 UI、進度、獎勵或 TTS 實作**：read `FULL-SITE-HANDOFF.md`, `GUWEN-WORKFLOW-SOP.md`, then use `.claude/skills/implement-guwen-app/SKILL.md`. Treat the approved lesson master as immutable content.
- **只修教材 Markdown 結構或預覽解析**：also read `GUWEN-MARKDOWN-FORMAT.md`.
- **維護整個古文工作流程或 skill**：read both skills and the shared workflow files, but do not load lesson masters unless needed to verify a concrete conflict.

Do not load both skills for a single-path task. Use both only when the user explicitly requests content changes and App implementation together; handle those as separate approval and implementation passes.

Use GitHub as the coordination layer for concurrent chats. Before every modifying pass and again before commit or push, fetch the fixed branch and compare its HEAD with the last-seen SHA; reread only changed files relevant to the task, integrate remote work first, and never force-push. One primary chat owns each active lesson master. Ordinary lesson chats must not create or independently edit shared SOP, skill, handoff, or design-standard copies; route cross-lesson rule changes through the workflow-maintenance process in `GUWEN-WORKFLOW-SOP.md`.

Pronunciation is reviewed with layout in `/#/guwen-draft-preview` and again in the formal App after implementation. Do not start a separate polyphonic scan, build or update an audit catalog, ask for old listening-page decisions, pull central audit results, or make legacy audit state a gate for approval, implementation, commit, push, or deployment. Legacy audit files and cloud records are historical unless the user explicitly asks to maintain that system.

The user's active instruction has highest priority. Current code and the active lesson master outrank historical documents. Run task-appropriate validation before delivery.
