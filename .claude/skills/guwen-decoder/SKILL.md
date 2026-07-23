---
name: guwen-decoder
description: Design spec and content-authoring guide for the "古文破譯家" (Ancient Text Decoder) feature in this repo — both the original word-puzzle format (src/data/guwen.ts, src/pages/GuwenDecode.tsx) and the newer evidence-clue lesson format (src/data/guwenLesson.ts, src/pages/GuwenLessonDecode.tsx). Use this whenever adding a new classical Chinese text, adding/editing a puzzle or lesson step, changing phase/screen behavior, or touching audio playback in this feature. This feature is meant to scale to hundreds of texts — always check this spec before improvising a new pattern, and update this file whenever the user establishes a new rule so future sessions don't have to re-derive it from scratch. For new-lesson *content design* specifically (choosing clues, writing hypotheses, the required curriculum-design workflow), also load the `design-guwen-decoding` skill — that one owns the pedagogical methodology, this one owns how it's implemented in this app's code.
---

# 古文破譯家 (Ancient Text Decoder) — Design Spec

## Standing instruction: keep this file current

The user has explicitly asked that every future requirement, fix, or rule they raise about this feature gets folded into this file **without being asked each time** — they don't want to have to judge what's "worth" documenting themselves. So: after resolving any guwen-decoder request (bug fix, new UX rule, content-authoring decision), update this file in the same session, before considering the task done. Err toward adding — a rule that turns out to be obvious in hindsight costs nothing sitting here; a rule that's missing gets silently violated by a future session with no memory of why it mattered. Keep entries concrete (what broke / what was asked, and the fix), not just abstract principles.

## Two coexisting content formats — know which one you're touching

This feature now has two structurally different implementations, both live in production simultaneously:

1. **Word-puzzle format** (`src/data/guwen.ts` + `src/pages/GuwenDecode.tsx`) — the original model. One text = a flat array of `GuwenWord` puzzles (`context` or `pattern` type), corpus evidence is often modern-Chinese sentences the app itself invents, and progress is a simple linear `wordIndex`. Currently powers `wangRongText` (王戎不取道旁李) only.
2. **Evidence-lesson format** (`src/data/guwenLesson.ts` + `src/pages/GuwenLessonDecode.tsx`) — a stricter, later methodology (see "Why this format exists" below). One text = a `GuwenLesson` with a `steps: LessonStep[]` prerequisite graph, cross-text clues must be **real classical excerpts** (never modern-Chinese sentences), and multi-part phrases get explicitly reconstructed from separately-decoded "decoding keys" before the full translation is ever revealed. Currently powers `simaGuangLesson` (司馬光破甕救友) only.

**Do not retrofit one format's content into the other's file/component without being asked.** They're kept as two parallel systems on purpose — the user introduced format 2 specifically to "重新打磨我們的做法" (re-refine the whole approach) starting from the second text, not to silently rewrite the first. If asked to add a *third* text, ask which format it should use rather than assuming; if unspecified, default to the evidence-lesson format since it's the more rigorous, currently-preferred one going forward.

Both formats share: `AppData.guwenProgress` (the same `{decodedWordIds, completedAt}` shape covers both — for a lesson, `decodedWordIds` just holds solved *step* ids instead of *word* ids, no schema change was needed), the same reward constants (`COIN_PER_GUWEN_WORD`/`STAR_PER_GUWEN_WORD`/`GUWEN_TEXT_COMPLETE_BONUS_*`), and — deliberately, so the feature feels like one app — the exact same pause-capable playback pattern and post-correct celebration sequence (praise line + coin/star roll-up), copied into `GuwenLessonDecode.tsx` rather than shared via a hook, since only one lesson-format text exists so far and factoring out the "right" shared abstraction before a second one exists would be guessing.

### Why the evidence-lesson format exists

The user reviewed the first text after building it and judged several things insufficiently rigorous: corpus "evidence" was often modern Chinese the app made up rather than real classical parallels, and there was no explicit mechanism for reconstructing a multi-word phrase from its solved parts before revealing what it means. They then collaborated with ChatGPT on a full design-and-implementation contract (delivered as a handoff zip: `CLAUDE-TASK.md` + a `design-guwen-decoding` skill package + a complete lesson markdown for 司馬光破甕救友) and had it implemented starting with the *second* text, explicitly as a refinement exercise rather than a retrofit of the first. That handoff package is now installed as the `design-guwen-decoding` skill (`.claude/skills/design-guwen-decoding/`) — **read that skill (and especially its `references/app-implementation-contract.md`) before writing a new evidence-lesson text**, not just this file. Key rules from it, condensed for this app's implementation:
- Cross-text clues must be **real, sourced classical excerpts** — never modern-Chinese sentences, never invented pseudo-classical text. Every `ClassicalClue` needs a traceable `source`.
- Classical text (the lesson's `fullText`, every clue's `text`) is **immutable once approved** — an implementing session must never modernize, paraphrase, reorder, or "improve" it. Modern-Chinese copy (intros, explanations, hints) may be improved, but only via an explicit before/after/reason proposal the user approves — never silently.
- Editorial-only content (segmentation/punctuation analysis for the curriculum designer) must **never** reach child-facing data or screens — keep it in the source markdown/skill files, not in `guwenLesson.ts`.
- A step only becomes available once every id in its `prerequisiteIds` is solved — real dependency resolution (`findCurrentStep` in `GuwenLessonDecode.tsx`), not just "the previous array index," so a lesson with genuine branching would still resolve correctly even though the one text built so far happens to be fully linear.
- The full vernacular translation stays locked (`finalVerification`) until every graded step is solved, and even then requires an explicit "打開白話驗證卷軸" tap — it's a verification scroll the child requests, not something that auto-reveals.

## North Star

> 真正的成就，不是 AI 把古文翻譯給孩子，而是孩子有一天驚訝地發現：「咦？我竟然可以自己讀懂古文了。」

AI is never the teacher handing over an answer — it's a research assistant supplying **corpus evidence** the child compares against. Every design decision in this feature gets checked against one question: *does this make the child do the reasoning, or does it do the reasoning for them?* If a UI element reveals the answer before the child has engaged with evidence, it's wrong, no matter how polished it looks.

Concretely this means:
- Modern-language translation (`modernTranslation`) is revealed **only after** every word is decoded — it's the reward for solving the puzzle, not the entry point.
- Explanations name the plausible-but-wrong meanings too, and argue for the right one from context — not "here's the definition."
- A puzzle never opens by stating the character's meaning. It opens with evidence to compare.

## File map

| File | Responsibility |
|---|---|
| `src/data/guwen.ts` | **Word-puzzle format.** `GuwenText`, `GuwenWord`, `GuwenCorpusOption`, `GuwenOccurrence` interfaces + the actual text data (`wangRongText`, `guwenTexts` array) |
| `src/lib/guwenGame.ts` | `tokenizeGuwenText` — splits `fullText` into tokens tagged with which `GuwenWord` (if any) they belong to, greedy-matching multi-char words like `信然` first. Word-puzzle format only. |
| `src/pages/GuwenDecode.tsx` | **Word-puzzle format** page: the 4-phase flow (intro → listening → decoding → complete) for one `GuwenText` |
| `src/data/guwenLesson.ts` | **Evidence-lesson format.** `GuwenLesson`, `LessonStep` (discriminated union: `evidence`/`reconstruction`/`local_inference`/`story_reasoning`), `ClassicalClue`, `DecodingKey`, `FinalVerification` interfaces + the actual lesson data (`simaGuangLesson`, `guwenLessons` array) |
| `src/pages/GuwenLessonDecode.tsx` | **Evidence-lesson format** page: intro → listening → steps (prerequisite-gated loop) → complete, for one `GuwenLesson`. Route `/guwen-lesson/:lessonId` (distinct from the word-puzzle format's `/guwen/:textId`) |
| `src/lib/speech.ts` | `speak`, `speakSequence`, `pauseSpeech`, `resumeSpeech`, `cancelSpeech` — shared TTS wrapper, not guwen-specific but heavily used by both formats |
| `src/pages/GuwenHome.tsx` | Lists **both** formats' texts as cards (`guwenTexts.map` then `guwenLessons.map`), each with its own progress bar and reset control, linking to the right route per format |
| `src/lib/storage.ts` | `AppData.guwenProgress`, `recordGuwenWordDecoded`, `recordGuwenTextCompleted`, `resetGuwenProgress` — fully generic over opaque `textId`/`wordId` strings, so both formats reuse it unchanged (a lesson's "wordId" is just a step id) |
| `src/lib/rewards.ts` | `COIN_PER_GUWEN_WORD`, `STAR_PER_GUWEN_WORD`, `GUWEN_TEXT_COMPLETE_BONUS_COINS/STARS` — shared by both formats |
| `.claude/skills/design-guwen-decoding/` | The curriculum-design methodology + implementation contract this evidence-lesson format follows, delivered as a user/ChatGPT handoff. Load it before authoring new evidence-lesson content. |

## The 4 phases (GuwenDecode.tsx)

Phase is local component state (`'intro' | 'listening' | 'decoding' | 'complete'`), not routed — one URL (`/guwen/:textId`) serves the whole flow. Initial phase is derived from saved progress at mount: `completedAt` set → `'complete'`; some words decoded → `'decoding'` (resume at first unsolved word); otherwise `'intro'`.

### 1. Intro phase

Purpose: tell the child this text hides N archaic-usage characters, and show them glowing in the full passage, before anything is interactive.

**Auto-plays on entering the phase** (one `speakSequence`, so each line only starts once the previous one truly finishes — never a fixed-delay timer guessing duration):
1. `text.introSpokenLine` — a per-text custom opening line naming the source (e.g. "我們來破解古文吧。這篇古文來自世說新語．雅量篇。")
2. `` 標題是《${text.title}》。 ``
3. `introParagraph(text)` — the generic "這篇文章裡...藏了 N 個古文字" paragraph (word count `text.words.length`, computed, not hand-written per text)
4. `INTRO_HINT` — generic constant, **the same for every text**: "上面發光的字，就是等一下要破解的古文字。按下按鈕，開始破譯吧！" — without this the auto-narration used to just stop after the explanation with no cue what to do next. Always keep this as the last line of the intro sequence for every text, forever.

Every one of those four lines has its own inline 🔊 replay button next to the visible text (source line, title, paragraph, hint) — every text block on this page must be independently replayable, not just the auto-play. This is a standing rule for the whole feature, not just the intro page.

The full passage (`renderPassage(null)`) is shown below the paragraph with every decode-target character in a pulsing violet glow (`guwen-glow` CSS animation) — this is what "上面發光的字" refers to, so it must render before the hint text that references it.

"🏺 開始破譯" button: speaks `INTRO_LINE` ("小學者，我們要一起破譯這些古文字！") and transitions to `'listening'`.

### 2. Listening phase

Purpose: let the child hear the whole classical passage once before decoding starts, explicitly framed as "you probably won't understand it yet, that's fine."

**Auto-plays on entering the phase** (one `speakSequence`):
1. `LISTEN_LEAD_IN` — "首先，跟我們一起聽一遍全文。"
2. `text.fullText` — the whole classical passage, uninterrupted
3. `LISTEN_PROMPT` — "你是不是完全聽不懂它在說什麼呢？沒關係，跟著我們一步一步破解..."

**Must have a pause/resume toggle** on the button driving this (`isPlaying`/`isPaused` state + `toggleFullPlayback()`/`playFullSequence()`) — label cycles `🔊 播放全文` → `⏸ 暫停播放` → `▶️ 繼續播放全文`. This was a direct fix for a real bug: a fixed `setTimeout` guessing how long the passage would take to speak used to fire early and cut the passage off mid-sentence, jumping straight to the prompt. **Never use a timer to sequence speech — always use `speakSequence`'s callback-chaining or a per-utterance `onEnd`.**

Below the passage, **every sentence in `text.sentences` gets its own standalone 🔊 button** ("或者一句一句聽") so the child can replay just one clause instead of the whole passage. `text.sentences` must concatenate back to exactly `text.fullText` (verified with a Node script when authoring — see Authoring Checklist below).

"開始破解第一個字 →" transitions to `'decoding'`.

### 3. Decoding phase — the puzzle loop

This is the core loop, one word at a time (`wordIndex` state), advancing via "下一個古文字 →" after each correct solve.

**Auto-plays every time a new word's puzzle appears** (mount into decoding, or advancing `wordIndex`): the target sentence immediately followed by that word's question prompt, as one utterance — see "Puzzle types" below for what the prompt text is per type. This is a hard rule established after the child got confused entering a puzzle with no idea what was being asked: **every puzzle must open by speaking itself**, not wait for a manual tap.

**Must be pausable.** The target-sentence "🔊 聽這句話" button and the prompt's inline 🔊 icon both drive the *same* shared toggle (id `` `puzzle-${word.id}` ``, via the generic `togglePlayback`/`playbackLabel` helpers — see "Shared pause-capable playback" below), so either one flips between 🔊/⏸/▶️ in sync and either one can pause the auto-play or resume it.

**`context`'s corpus options are never part of the auto-play** — they're individually tap-to-listen only, since they're the candidate *answers* the child is choosing between. **`pattern`'s examples are the opposite: they're evidence, not answers, so they ARE part of the auto-play** (see Puzzle types below) — only `patternOptions` (the actual multiple-choice answers) stay tap-to-listen-only, matching `context`'s corpus options.

Layout, top to bottom:
1. Passage (`renderPassage(currentWord.id)`) — current word pulses faster/brighter than not-yet-reached ones, solved ones are solid amber
2. Live scoreboard bar: `已破解 X / N` + running `🪙+earnedCoins ⭐+earnedStars` (both simply `decodedIds.size * COIN_PER_GUWEN_WORD` etc., no separate tracked state needed), plus a "全部破解完成再加碼 🪙+B ⭐+B" note while not yet complete
3. Word-chip row (`renderWordChips`) — solved words become clickable buttons opening the **review panel** for that word (see below); unsolved words show 🔒 except the current one
4. The puzzle card itself (target sentence + prompt + answer area, branches by `puzzleType` — see next section)
5. On correct: explanation card (own pause-capable 🔊), any `occurrences` comparison block, "下一個古文字 →" button

#### Puzzle units aren't always a single character

`char` (and therefore the tokenizer match, the puzzle, and the word-chip) doesn't have to be one character or even a fixed 2-character word like `信然` — it can be a whole 3-4+ character phrase that only makes sense (or gets misread) as one scene. `tokenizeGuwenText` already does greedy longest-match by length, so this needs **no code change**, only a content decision: if a run of characters forms one image/idea that a modern reader would misparse character-by-character, make it one `GuwenWord` for the whole phrase rather than separate single-char entries (or no entry at all).

**Watch for:** `renderWordChips` used to render every chip's label as `w.char[0]` — fine for a single character, silently wrong for a phrase (a solved `多子折枝` chip showed only "多", unrecognizable as the word it represents). Fixed by rendering the full `w.char` string in a `min-w-9`-not-`w-9` pill that grows with content instead of a fixed-size circle. If you add another chip/badge/label anywhere that shows `word.char`, default to the full string and a growable container, not `char[0]` — this codebase no longer assumes every `GuwenWord` is exactly one glyph wide.

**Real example:** `多子折枝` in 王戎不取道旁李 — read naively, `折` pulls toward "someone bends/picks the branch," so a child might guess "很多小孩子攀折樹枝" (kids climbing to snap branches) — a plausible misreading of the *phrase as a whole*, not any single character in it. Decoded as one 4-character `GuwenWord` (`id: 'duozizhezhi'`, `char: '多子折枝'`), not as separate puzzles for 多/子/折/枝.

#### Option count is a judgment call, not always 3

Neither `corpus`/`correctIndex` (`context`) nor `patternOptions`/`patternCorrectIndex` (`pattern`) are fixed-length — the rendering is plain `.map()` with no hardcoded index assumptions, so 2 options, 3 options, or (in principle) more all just work. **Only write as many options as there are genuinely plausible ways to misread the target** — padding to 3 with a throwaway "obviously wrong" third option is worse than 2 clean options, because an obviously-wrong distractor stops being reasoned-through and just gets eliminated by vibes. Same logic applies to `patternExamples`: 2 clue sentences are enough if 2 independent examples already make the shared pattern obvious.

**Real example:** `多子折枝`'s `pattern` puzzle uses only 2 clue sentences (`柿樹多子壓枝`, `葡萄多實垂架`) and 2 `patternOptions` (the "kids climbing branches" misreading vs. the correct "fruit's weight bent the branches") — a third option would have to be a materially different third misreading, and none existed that wasn't just a weaker restatement of one of the two.

#### Puzzle types

A word is **not** automatically a 3-choice comparison. Pick the type based on whether the word actually has discrete, arguable-between senses:

**`'context'`** (default when `puzzleType` is omitted) — the word has genuinely different possible meanings, so "which corpus sentence's usage matches the target sentence" is a real discrimination task. Fields: `corpus: GuwenCorpusOption[]` (2-3, see "Option count" above), `correctIndex`.
- Rendered as clickable option rows, one per `corpus` entry (`role="button"` divs, not `<button>`, so the inline 🔊 can be a nested real `<button>` with `stopPropagation` — a `<button>` can't validly nest another `<button>`)
- Wrong pick: red highlight + "再想想看，比一比上下文的意思～" (own 🔊). **Does not auto-clear on a timer** — it persists until the next pick (right or wrong) so there's actually time to read/hear it. (An earlier version auto-cleared after 700ms and the message would vanish before anyone could act on it.)
- Correct pick: green highlight, reward granted, then the **celebration sequence** plays (see below) before the explanation appears

Use this when: real corpus sentences that use the character in 2-3 genuinely distinguishable senses actually exist and read naturally in modern Chinese.

**`'pattern'`** — the word/phrase doesn't have a single corpus sentence that "matches" it; instead the child needs to weigh 2-3 pieces of outside evidence together and generalize or triangulate. This covers two related authoring situations:
  - A recurring grammatical/positional habit felt out from repetition (e.g. 諸 always marking "not just one" regardless of what noun follows) — forcing a "which single example is closest" question is dishonest here, since every example uses the word the same way.
  - A multi-character phrase that could be misread as a literal sum of its parts, disambiguated by analogous-imagery clue sentences rather than by other uses of the same word (e.g. 多子折枝 — see "Puzzle units aren't always a single character" above).

  Either way it must still be a **real quiz with a real wrong answer**, not a passive "read then click reveal" — an earlier version used a single "💡 我發現規律了，看看對不對 →" reveal button, and the user correctly called this out as not actually testing anything (a reveal button just shows the answer on demand, no reasoning required). Fields: `patternPrompt: string`, `patternExamples: string[]` (2-3, see "Option count" above), `patternQuestion: string`, `patternOptions: string[]` (2-3), `patternCorrectIndex`.
- The `patternExamples` are **part of the auto-play sequence now** (unlike `context`'s `corpus`, which is never auto-played) — the whole point is the child hears every example read aloud back-to-back before being asked to generalize, so the auto-play for a `pattern` puzzle is: `targetSentence → patternPrompt → example 1 → example 2 → (example 3 if present) → patternQuestion`, all one `speakSequence` (see `puzzleAutoPlayLines()` in `GuwenDecode.tsx`).
- Rendered top to bottom: prompt (own 🔊) → each example as a **read-only** row (own 🔊, no click-to-select — these are evidence, not choices) → `patternQuestion` (own 🔊) → then `patternOptions` as **clickable** option rows, visually and behaviorally identical to `context`'s corpus options (`role="button"` divs, red highlight + non-timed hint on wrong pick via `handlePatternSelect`, green highlight + reward + explanation on correct pick, per-option nested 🔊 button with `stopPropagation`).
- The correct option states the real reading (a grammatical pattern, e.g. "「諸」後面接的都是人或事物的名稱..."; or a scene interpretation, e.g. "果實結得太多、太重，把樹枝都壓彎了"). Every wrong option must be a **plausible-sounding overgeneralization or misreading**, not nonsense — and each must be refutable by checking it against all the evidence together, not just one piece. E.g. for 諸: "後面接的都是很多人組成的團體" sounds right if you only look at 諸位老師/諸國, but breaks on 諸小兒 (a handful of kids isn't really "a group/institution"). For 多子折枝: "很多小孩子攀折樹枝" sounds plausible alone, but breaks against both clue sentences (both use "壓/垂" — weight bending a branch, not a person breaking one) and would make the phrase redundant with the very next clause (諸兒競走取之 already covers "kids going for the fruit"). The explanation must name the exact refutation, not just assert the right answer.

**Real example this fixed (three rounds):** 諸's original `context` puzzle used 諸位/諸如/諸事 as three options that were all just "諸 = many/each," making "which is closest" unanswerable-but-for-guessing — that was the first fix, converting to `pattern`. `pattern`'s first implementation was then a passive reveal button, which the user rejected as not being a real question — fixed by turning the generalization into a real multiple-choice question with reasoned distractors. Later, 多子折枝 showed `pattern` also works for phrase-level scene disambiguation, and that only 2 examples/2 options were needed rather than forcing a third. **When authoring a new word: if your "distractor" corpus meanings are actually all the same meaning, switch to `pattern` — never implement it as a reveal-only interaction, and never pad the option/example count past what's genuinely plausible.**

A third puzzle type discussed but **not yet built**: a "pronoun-tracking" type for words like 之/其 that asks "who does this refer to?" per occurrence rather than "what does this mean?" — the current `occurrences` comparison block (below) covers some of this need in a lighter, reveal-after-solving form. Build the dedicated interactive version only if asked; don't invent it speculatively.

#### The post-correct celebration sequence

A correct pick doesn't jump straight to the explanation — it plays a short celebration first, because a bare "✅ 答對了！ 🪙+6 ⭐+3" banner that's gone in under a second (the app-wide `CelebrationOverlay` burst, ~1.45s) wasn't enough payoff for a word the child just worked to solve. The user's own framing: it should feel like "在玩拉霸" (playing a slot machine) — sound, then praise, then a slow visible count-up, *then* the explanation.

Sequence, driven by `markWordSolved` in `GuwenDecode.tsx`:
1. `reward()` fires immediately (real coins/stars are credited right away — the roll-up below is a *cosmetic* replay of that number, not a delayed credit) and `playSuccessChime()` plays.
2. A random line from `PRAISE_LINES` is spoken (`speak(praiseLine, onEnd)`), where `onEnd` marks `praiseDone: true` on the celebration state. A fallback timer (`armPraiseFallback`, `PRAISE_FALLBACK_MS` ≈ 4.5s) is armed at the same time, force-setting `praiseDone` if `onend` hasn't fired by then — see the pitfall below for why this fallback exists.
3. Simultaneously, a `celebration` state (`{ wordId, tick, praiseDone, stage: 'rolling' }`) starts ticking up via `tickCelebration` — a chain of `window.setTimeout`s (`CELEBRATION_TICKS` steps × `CELEBRATION_TICK_MS`, ~1.4s total), each step bumping `tick` and playing `playRollTickSound()`. The displayed coin/star numbers are `Math.round((tick / CELEBRATION_TICKS) * COIN_PER_GUWEN_WORD)` etc. — this is why the underlying reward amount doesn't need to be threaded through the roll separately, it's just a ratio of the same constant.
4. Only once *both* `tick >= CELEBRATION_TICKS` *and* `praiseDone` are true does a transition effect fire the settle sound (`playCoinSound()` + a delayed `playStarSound()`), flip `stage` to `'settled'`, and show the "🎉 哇，得到 X 金幣、Y 星星！" line. If the roll finishes first (the common case — the roll is ~1.4s, a praise line usually takes longer to speak), the visual just holds at the final numbers, still under the "✨ 答對了！" heading, until the praise line actually finishes. This holds for a fixed 700ms beat once both conditions are met (a deliberate pause, not a duration guess — see the "never guess a duration" rule, which is about *external* content like TTS length, not an animation's own timing).
5. After that beat, `celebration` clears and `scheduleExplanationFor` runs — the same 250ms-delay-then-speak the explanation used to do directly inside `markWordSolved` before this feature existed.

**Pausable, and always skippable.** A dedicated "⏸ 暫停播放" button on the celebration card (`toggleCelebrationPause`) pauses *both* halves at once — the praise-line TTS (`pauseSpeech()`) and the roll ticker (clears the pending tick timeout instead of scheduling the next one; resuming re-enters `tickCelebration` from the current `tick`) — and also clears/re-arms the praise fallback timer around the pause, so a long pause can't let the fallback fire while the (still genuinely paused) praise line hasn't actually finished. This needed to be bespoke rather than reusing `togglePlayback`, because `togglePlayback` only knows how to pause speech — it has no concept of a visual timer running alongside it. Separately, and just as important: **"下一個古文字" is rendered unconditionally whenever `feedback === 'correct'`, celebration or not** — it is never hidden behind the celebration card, so a child who doesn't want to wait can tap it immediately and jump straight to the next word mid-roll, no need to pause first. `stopPuzzleSpeech()` (already called at the top of `handleNextWord`/`handleResetProgress`) clears the roll's pending timeout, the praise fallback timeout, and the celebration state along with everything else it already cleared, so skipping is always instant and clean — verified by clicking "下一個古文字" ~150ms into a fresh celebration and confirming no leftover celebration/explanation audio bleeds into the next word's puzzle, even several seconds later (past when the fallback timer would otherwise have fired).

**Pitfall hit twice here — read both halves before touching this code:**
- **First version:** advanced to `'settled'` as soon as the roll finished, without waiting for the praise line at all. This shipped, then the user immediately caught it in real use: "剛剛去測試哦，可是做完一個題目之後，「太棒了。你破解一個古文....」，還沒有講完，就被中斷，然後詳解就開始播放了" — the praise line (~2.5-3s spoken) is longer than the roll (~1.4s), so the explanation's `speak()` call was cutting the praise line off mid-sentence via `speak()`'s built-in cancel-on-next-call behavior. **Lesson: "the next thing will cleanly cut off the previous thing" is true, but is not a substitute for actually waiting for the previous thing to finish when the two are supposed to be sequential to the listener.**
- **Second version (why the fallback exists):** the naive fix — gate the transition on *both* the roll finishing and the praise line's `onend` firing — regressed the *other* way: in Playwright verification, `utterance.onend` never fired at all in headless Chromium (no real TTS voices installed), so `praiseDone` stayed `false` forever and the celebration hung in `'rolling'` indefinitely, explanation never scheduled. **Lesson: gating forward progress purely on a speech-completion event is fragile (voices still loading, a real device's audio hiccup, a headless/CI environment) — pair any such gate with a generous, well-clear-of-normal-length fallback timer** (here `PRAISE_FALLBACK_MS`) that forces progress if the event never comes. The fallback should be long enough that in normal operation `onend` always wins first — it's a safety valve, not the expected path.

#### Explanation writing style (both puzzle types)

Never open with "「X」的意思是..." Instead: name the 2-3 meanings the character commonly has (matching real corpus options when `context`), then argue from the target sentence's specific grammar/scene which one fits and why the others don't — imagery and sentence-pattern comparison over dictionary-listing. Concretely:

> ❌ "「走」常見有三種意思：走路、跑、離開。這裡用「跑」來解釋最合理。"
> ✅ "請先想像故事畫面：大家看到滿樹李子，是慢慢走過去，還是立刻衝過去？... 因此古文裡的「走」在這裡不是今天的「走路」，而是：跑。"

Always end by restating the target phrase's plain meaning in one clause, e.g. "「嘗與諸小兒遊」就是「曾經和很多小朋友一起玩」."

**Fact-check every explanation against `fullText` and `modernTranslation` before shipping.** A ChatGPT-drafted batch once wrote "李子裡全部都是蟲" for 信然's explanation when the actual story says the plums were bitter (`此必苦李`), not wormy — a plausible-sounding but wrong detail that would have taught a wrong plot point. Re-derive story facts from the text itself, never trust a paraphrase.

#### `occurrences` (repeated-word comparison)

Optional field on `GuwenWord`: `{ sentence: string; note: string }[]`, listing every other spot in the same text where this exact word reappears, each with a one-line note on what it refers to / how it's used there. Shown in a panel after the word is solved (both live decoding and the review panel). Use this whenever a word appears 2+ times in the same text with the same core meaning but different referents/contexts — it lets the child verify the meaning actually stayed consistent instead of taking it on faith. (Established for 之, which appears 3 times referring alternately to 李子/王戎/李子.)

#### Review panel

Clicking any solved word-chip opens a card showing: the *original* target sentence, the corpus options (✓正解 marked) or pattern examples (read-only, matching whichever `puzzleType` it was), the meaning + explanation (with its own pause-capable 🔊), and `occurrences` if present. This is how "what did I answer for word N" stays inspectable after the fact — the app does **not** store which wrong options were tried (only the fact that the word is solved), since only the correct pick is ever recorded.

### 4. Complete phase

Shown once every word is solved. Auto-plays `text.fullText` after a 400ms delay (pause-capable, id `'full'`). Shows, in order: trophy + title, final `🪙/⭐` tally (words × per-word reward + the completion bonus, both from `rewards.ts`), full passage (all solved/amber now), `modernTranslation` (pause-capable 🔊, id `'translation'`) explicitly labeled "破解成功的獎勵", the open-ended `reflectionQuestion` (think first, click to reveal `reflectionAnswer` — never shown automatically), then "回古文破譯家" + "🔄 重新開始這篇" (with an inline confirm step — resets `guwenProgress` for this text only, keeps earned coins/stars).

## Shared pause-capable playback

One generic mechanism used everywhere a *longer* piece of text needs a stop control (full passage, translation, per-word explanation, per-puzzle auto-play) — don't reinvent this per button:

```ts
const [playbackId, setPlaybackId] = useState<string | null>(null);
const [playbackPaused, setPlaybackPaused] = useState(false);

function togglePlayback(id: string, content: string | string[]) {
  const startOrRestart = () => {
    setPlaybackId(id);
    setPlaybackPaused(false);
    const onDone = () => setPlaybackId((cur) => (cur === id ? null : cur));
    Array.isArray(content) ? speakSequence(content, onDone) : speak(content, onDone);
  };
  if (playbackId === id) {
    // Resume restarts from the top rather than calling resumeSpeech() — see the pitfall below.
    playbackPaused ? startOrRestart() : (pauseSpeech(), setPlaybackPaused(true));
  } else {
    startOrRestart();
  }
}
function playbackLabel(id, idleLabel, playingLabel, pausedLabel) {
  return playbackId !== id ? idleLabel : playbackPaused ? pausedLabel : playingLabel;
}
```

Rule of thumb for what needs this vs. a plain one-shot `speak()`: if it's more than ~1 short sentence, or it's something that auto-plays without the user asking, it needs pause. A single corpus option, a single pattern example, a single pattern option, or a single occurrence sentence doesn't (clicking any other 🔊 button just cancels-and-restarts via `speak()`'s own `cancel()` call, which is enough).

`togglePlayback` accepts `content: string | string[]` — pass an array (e.g. `puzzleAutoPlayLines(word)`) when the pause-capable content is actually several lines that must play in strict order (a `pattern` puzzle's target+prompt+examples+question); it internally routes to `speakSequence` instead of `speak`. This is how the same one toggle mechanism covers both a single explanation paragraph and a 6-line puzzle narration — don't build a second toggle function for the sequence case.

For queueing multiple *separate* lines back-to-back where each must fully finish before the next starts (page-entry narration), use `speakSequence(lines, onDone)` instead — it queues real separate utterances so the browser (not a guessed timer) decides when one ends and the next begins.

### Known pitfall: a delayed `speak()` needs its timer tracked, not just its speech cancelled

`scheduleExplanationFor` (called once the post-correct celebration finishes — see above) speaks the explanation via `window.setTimeout(..., 250)` (a short pause after the celebration fires feels better than speaking instantly). If the child clicks "下一個古文字" inside that 250ms window, `cancelSpeech()` alone does nothing — there's no speech playing *yet* to cancel, only a pending timer. The timeout still fires later, once the *next* word's screen is already showing, and hijacks whatever that screen is playing (a real bug the user hit: "我在第二題頁面還聽得到第一題的詳解語音").

The fix, and the general rule: **any `window.setTimeout` that leads to a `speak()` call must have its ID stored in a ref and explicitly cleared by every path that navigates away**, not just have `cancelSpeech()` called on the *already-started* utterance. Here that's `explainTimeoutRef`, cleared by a shared `stopPuzzleSpeech()` helper called from both `handleNextWord` and `handleResetProgress` (both places that change `wordIndex` or otherwise leave the current word behind). The celebration's own roll-up timer (`celebrationTimeoutRef`) follows the identical pattern and is cleared by the same `stopPuzzleSpeech()`. If a future puzzle type or feature adds another delayed-then-speak (or delayed-then-anything) call, route it through the same ref-and-clear pattern rather than trusting `cancelSpeech()` to cover it.

### Known pitfall: `speechSynthesis.resume()` is not reliable — treat "resume" as "restart"

A real bug the user hit: "念全文，唸到一半，我按暫停，它可以停下來，但是我再按一次播放，它不會繼續播放" — pausing worked (`pauseSpeech()`/`window.speechSynthesis.pause()` visibly stopped the audio), but clicking play again produced no sound. This is a known WebSpeech engine issue on some browsers: once paused for more than a moment, the underlying engine silently drops the utterance instead of continuing, and `resume()` becomes a no-op.

**Fix, and the standing rule for every pause-capable control in this feature (both `togglePlayback` and `toggleFullPlayback`, in both `GuwenDecode.tsx` and `GuwenLessonDecode.tsx`):** don't call `resumeSpeech()` on the resume branch at all — call the same start/restart logic used for "begin from idle" instead (re-run `speak()`/`speakSequence()` on the same content from the top). This means resuming always re-plays from the beginning of the current utterance/sequence rather than picking up mid-sentence — a real UX trade-off, but "restarts a sentence or two early" is a far better failure mode than "silently produces nothing," and it's guaranteed to work regardless of which underlying browser bug caused the stall (an explicit pause that won't resume, or Chrome's separate ~15s-continuous-speech auto-stop). `toggleCelebrationPause` (the roll-up celebration's pause button) still calls `resumeSpeech()` for the short praise line — that's a narrower, shorter-lived case that hasn't shown this failure in practice; apply the same restart fix there too if it's ever reported.

### Known pitfall: some characters need a TTS-only pronunciation override, never a text change

A real bug the user hit: "沒應該唸莫，他唸梅" — in "足跌沒水中"/"沒入水中", the child's TTS voice read 沒 as its far-more-common ㄇㄟˊ (méi, "沒有"-style negation) instead of the correct ㄇㄛˋ (mò, "submerged") the classical text needs here. The Web Speech API takes plain text only — no SSML, no phoneme tags — so there's no way to tell the engine "read this character differently" without changing what string it receives.

**Fix, and the rule for any future multi-reading-character (多音字) mispronunciation:** add a narrowly-scoped find/replace in `ttsSafe()` (`src/lib/speech.ts`, applied inside `speak()`/`speakSequence()` for every utterance app-wide) that substitutes a homophone-for-the-intended-reading character — e.g. `沒(?=[水入])` → `末` (末 is unambiguously mò) — **only in the string handed to the speech engine, never in any displayed or stored text.** The classical text and clues in `guwenLesson.ts`/`guwen.ts` must stay character-for-character faithful per the implementation contract; `ttsSafe()` is the one sanctioned place where "what's spoken" is allowed to diverge from "what's shown," and it must stay that way — never work around a mispronunciation by editing the source text itself. Scope every substitution as tightly as possible (a lookahead/lookbehind on the specific compound, not a blanket character swap) so it can't accidentally mis-fire on an unrelated, correctly-pronounced instance of the same character elsewhere in the app (confirmed here: `沒(?=[水入])` fixes 沒水中/沒入 without touching 沒有/沒關係/沒人, which are correctly méi and appear throughout this lesson's explanations).

### Known pitfall (evidence-lesson format): never derive "the current step" fresh from solvedIds every render

`GuwenLessonDecode.tsx`'s first draft computed `currentStep` directly as `findCurrentStep(lesson, solvedIds)` on every render, with no separate state. This looked reasonable but broke the instant the *last* step in a lesson was answered correctly: `recordGuwenWord` adds it to `solvedIds` immediately, so on the very next render `findCurrentStep` finds no unsolved step left and returns `undefined` — which made the entire steps-phase UI (celebration, explanation, and the "🎉 完成" button needed to advance) disappear before the child ever saw it, since it was all gated behind `currentStep &&`. This only surfaces on the *last* step, which made it easy to miss in a quick manual check but was caught immediately by a full Playwright run through all 18 steps.

The fix, and the rule for this format: **the on-screen step is its own piece of state (`activeStepId`), not a live derivation from `solvedIds`** — exactly like `wordIndex` in the older `GuwenDecode.tsx`, which is also independent state rather than computed from `decodedIds`. `activeStepId` only changes when `handleNextStep` explicitly advances it (by calling `findCurrentStep` itself, once, at the moment of navigating away — not on every render). A related off-by-one from the same first draft: the "is this the last step" check was `solvedIds.size + 1 >= totalSteps`, which is wrong because `solvedIds` **already includes** the step just answered by the time that code runs — the correct check is `solvedIds.size >= totalSteps`, with no `+ 1`. Watch for this exact mistake in any future step/word-index-like counter in this feature: always ask "does this collection already include the thing I just did, or not yet?" before writing a boundary condition against it.

## Rewards

`COIN_PER_GUWEN_WORD` / `STAR_PER_GUWEN_WORD` per solved word (context or pattern, same rate), `GUWEN_TEXT_COMPLETE_BONUS_COINS/STARS` once on full completion — both live in `rewards.ts`, both flow through the existing app-wide `reward()` call, which still fires the standard `CelebrationOverlay` burst + credits the ledger exactly like every other feature. **Never hand-roll a second source of truth for the coin/star numbers themselves** — always call `reward()` to actually credit them.

That said, per-word solves in this feature *do* layer a bespoke, longer celebration on top of that standard burst (see "The post-correct celebration sequence" above) — the praise line + slow roll-up + settle beat. This was an explicit user request ("要有一個滾動的效果...要讓它有當下就有一種我是在玩拉霸的快感") because the standard ~1.45s burst wasn't enough payoff for a puzzle the child had to actually reason through. So: keep using `reward()` for the ledger, but it's fine — expected, even — for this feature's *presentation* of a solve to be richer than the app-wide default, as long as it stays pausable and skippable per the pattern already established.

## Data persistence

`AppData.guwenProgress: Record<textId, { decodedWordIds: string[]; completedAt?: string }>`. `decodedWordIds` only ever grows (never records a wrong attempt). Loading old/cloud data that predates a new `AppData` field must go through `normalizeAppData()` (in `storage.ts`) — applying cloud data directly without it once caused a full white-screen crash when `guwenProgress` was entirely absent from an older snapshot.

## Authoring checklist for a new text

1. Pick source material per the established content strategy (see task #43 / conversation history): short narrative pieces from 世說新語/韓非子/列子 — story-driven, one clear point, works cut into 4-8 short clauses. Avoid 論語/孟子 for now (identifying every character doesn't guarantee the *idea* lands, which is a harder pedagogical problem than word-decoding).
2. Write `fullText` as one continuous string with real punctuation; split into `sentences: string[]` — **verify by concatenation** (`sentences.join('') === fullText`) before committing, exactly like this:
   ```js
   node -e "console.log(['s1','s2',...].join('') === 'fulltext')"
   ```
3. For each archaic-usage character/word (aim ~10-15 per text): decide `context` vs `pattern` per the test above, write 3 corpus options or 3 pattern examples in **natural, fully modern Chinese** — don't write corpus sentences that themselves lean on classical grammar just to shoehorn the target character in (e.g. avoid something like "李白嘗遊長安" as a *corpus* example — that's literary-flavored, not the natural modern sentence a distractor/match should be). It's fine for a corpus sentence's *subject matter* to reference history (e.g. "杜甫嘗住成都"), just not its *grammar*.
4. Write `introSpokenLine`, `modernTranslation`, `reflectionQuestion` + `reflectionAnswer` (the reflection should ask the child to explain the story's "why," not just restate the plot).
5. Write explanations per the style rules above; re-check every factual claim against `fullText`/`modernTranslation`.
6. Add the new `GuwenText` object to the `guwenTexts` array in `guwen.ts` — `GuwenHome.tsx` and routing pick it up automatically, no other wiring needed.
7. `npx tsc --noEmit && npm run build`, then manually verify with a temporary Playwright pass (see below) before considering it done.

## Verifying changes (this repo's established pattern)

This repo has no persistent Playwright dependency — install it temporarily, test, uninstall, so it never lingers in `package.json`:
```bash
npm install -D playwright
npm run preview -- --port <free-port> --host 127.0.0.1 &   # or run_in_background
# write a throwaway .mjs script under the repo root using `chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })`
node your_test.mjs
rm your_test.mjs
npm uninstall -D playwright
git diff --stat -- package.json package-lock.json   # must show nothing
```
Useful technique for asserting on speech without real audio: patch `window.SpeechSynthesisUtterance` in `page.addInitScript` to push each utterance's text into a `window.__speechCalls` array, then assert on that array's contents/order after driving the UI.

Known Playwright gotcha in this feature specifically: `page.click('text=開始破譯')` can ambiguously match the intro hint text too (it also contains "開始破譯吧") — use `page.click('button:has-text("開始破譯")')` or another button-scoped selector instead of a bare `text=` selector once multiple elements can contain the same substring.

## Open / pending decisions (check with the user before assuming)

As of this writing, for `simaGuangLesson` (司馬光破甕救友, evidence-lesson format):
- Full 18-step lesson implemented and verified end-to-end (all 4 step types, prerequisite gating, celebration, gated final verification) — done.
- Whether `wangRongText` should eventually be migrated/rewritten into the evidence-lesson format, or left permanently on the word-puzzle format — **not decided; don't touch it without asking.** The user's own framing was "用第二篇文章來重新打磨我們的做法" (use the second text to refine our approach), which reads as starting fresh going forward, not as a mandate to retrofit the first text.
- Whether a third text should default to the evidence-lesson format — this file's current guidance (see "Two coexisting content formats" above) is to default to it unless told otherwise, but that's this session's inference, not an explicit user decision — confirm if it matters.
- The `local_inference`/`story_reasoning` step types were implemented with the exact same visual/interaction shape as `evidence` (just without a clues/keys panel) — the design-guwen-decoding contract doesn't specify a *different* look for these, so this was a reasonable default rather than a confirmed choice; revisit if the user wants them visually distinguished.

As of this writing, for `wangRongText` (王戎不取道旁李, word-puzzle format):
- 諸 → converted to `pattern` type, real 3-choice question (done)
- 多子折枝 → added as a new 4-character phrase-level `GuwenWord` (`id: 'duozizhezhi'`), `pattern` type with 2 examples/2 options (done)
- 嘗, 與, 遊, 走, 之, 唯, 曰, 而, 信然 → revised to the "scene comparison" explanation style (done)
- 競 → **still on the old "常見有 N 種意思" explanation style**, and its keep-or-drop status was never confirmed — don't touch it without asking
- Whether to formalize a strict corpus-design rule (exactly "1 close match / 1 easy-to-misjudge / 1 totally different") across every `context` word, retroactively — discussed, not decided
- Dedicated "pronoun-tracking" puzzle type (type C, for 之/其) — discussed, not built
