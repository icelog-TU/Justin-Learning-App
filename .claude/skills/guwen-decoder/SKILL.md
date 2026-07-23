---
name: guwen-decoder
description: Design spec and content-authoring guide for the "古文破譯家" (Ancient Text Decoder) feature in this repo (src/data/guwen.ts, src/pages/GuwenHome.tsx, src/pages/GuwenDecode.tsx). Use this whenever adding a new classical Chinese text to decode, adding/editing a word puzzle, changing the intro/listening/decoding/complete page behavior, or touching audio playback in this feature. This feature is meant to scale to hundreds of texts — always check this spec before improvising a new pattern, and update this file whenever the user establishes a new rule so future sessions don't have to re-derive it from scratch.
---

# 古文破譯家 (Ancient Text Decoder) — Design Spec

## Standing instruction: keep this file current

The user has explicitly asked that every future requirement, fix, or rule they raise about this feature gets folded into this file **without being asked each time** — they don't want to have to judge what's "worth" documenting themselves. So: after resolving any guwen-decoder request (bug fix, new UX rule, content-authoring decision), update this file in the same session, before considering the task done. Err toward adding — a rule that turns out to be obvious in hindsight costs nothing sitting here; a rule that's missing gets silently violated by a future session with no memory of why it mattered. Keep entries concrete (what broke / what was asked, and the fix), not just abstract principles.

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
| `src/data/guwen.ts` | All content: `GuwenText`, `GuwenWord`, `GuwenCorpusOption`, `GuwenOccurrence` interfaces + the actual text data (`wangRongText`, `guwenTexts` array) |
| `src/lib/guwenGame.ts` | `tokenizeGuwenText` — splits `fullText` into tokens tagged with which `GuwenWord` (if any) they belong to, greedy-matching multi-char words like `信然` first |
| `src/lib/speech.ts` | `speak`, `speakSequence`, `pauseSpeech`, `resumeSpeech`, `cancelSpeech` — shared TTS wrapper, not guwen-specific but heavily used here |
| `src/pages/GuwenHome.tsx` | List of texts, each with a progress bar and a "reset this text" control |
| `src/pages/GuwenDecode.tsx` | The whole 4-phase flow (intro → listening → decoding → complete) for one text |
| `src/lib/storage.ts` | `AppData.guwenProgress`, `recordGuwenWordDecoded`, `recordGuwenTextCompleted`, `resetGuwenProgress` |
| `src/lib/rewards.ts` | `COIN_PER_GUWEN_WORD`, `STAR_PER_GUWEN_WORD`, `GUWEN_TEXT_COMPLETE_BONUS_COINS/STARS` |

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

#### Puzzle types

A word is **not** automatically a 3-choice comparison. Pick the type based on whether the word actually has discrete, arguable-between senses:

**`'context'`** (default when `puzzleType` is omitted) — the word has genuinely different possible meanings, so "which corpus sentence's usage matches the target sentence" is a real discrimination task. Fields: `corpus: GuwenCorpusOption[]` (exactly 3), `correctIndex`.
- Rendered as 3 clickable option rows (`role="button"` divs, not `<button>`, so the inline 🔊 can be a nested real `<button>` with `stopPropagation` — a `<button>` can't validly nest another `<button>`)
- Wrong pick: red highlight + "再想想看，比一比上下文的意思～" (own 🔊). **Does not auto-clear on a timer** — it persists until the next pick (right or wrong) so there's actually time to read/hear it. (An earlier version auto-cleared after 700ms and the message would vanish before anyone could act on it.)
- Correct pick: green highlight, reward granted, explanation auto-plays after a 250ms delay

Use this when: real corpus sentences that use the character in 2-3 genuinely distinguishable senses actually exist and read naturally in modern Chinese.

**`'pattern'`** — the word doesn't decompose into discrete senses; it's a grammatical/positional habit that has to be felt out from repetition, not chosen between. Forcing a 3-choice "which is closest" question here is dishonest — all 3 corpus sentences would use it the same way, and the child is left guessing which one the answer key considers "closest" for no real reason. But this must still be a **real quiz with a real wrong answer**, not a passive "read then click reveal" — an earlier version used a single "💡 我發現規律了，看看對不對 →" reveal button, and the user correctly called this out as not actually testing anything (a reveal button just shows the answer on demand, no reasoning required). Fields: `patternPrompt: string`, `patternExamples: string[]` (typically 3), `patternQuestion: string`, `patternOptions: string[]` (exactly 3), `patternCorrectIndex`.
- The `patternExamples` are **part of the auto-play sequence now** (unlike `context`'s `corpus`, which is never auto-played) — the whole point is the child hears all 3 examples read aloud back-to-back before being asked to generalize, so the auto-play for a `pattern` puzzle is: `targetSentence → patternPrompt → example 1 → example 2 → example 3 → patternQuestion`, all one `speakSequence` (see `puzzleAutoPlayLines()` in `GuwenDecode.tsx`).
- Rendered top to bottom: prompt (own 🔊) → each example as a **read-only** row (own 🔊, no click-to-select — these are evidence, not choices) → `patternQuestion` (own 🔊) → then `patternOptions` as 3 **clickable** option rows, visually and behaviorally identical to `context`'s corpus options (`role="button"` divs, red highlight + non-timed hint on wrong pick via `handlePatternSelect`, green highlight + reward + explanation on correct pick, per-option nested 🔊 button with `stopPropagation`).
- The correct option states the real grammatical pattern (e.g. "「諸」後面接的都是人或事物的名稱，「諸」本身沒有特別意思，只是表示後面的東西不只一個"). The 2 wrong options must each be a **plausible-sounding overgeneralization**, not nonsense — and each must be refutable by checking it against all 3 examples together, not just one. E.g. for 諸: "後面接的都是很多人組成的團體" sounds right if you only look at 諸位老師/諸國, but breaks on 諸小兒 (a handful of kids isn't really "a group/institution"); "後面接的東西一定要用敬語稱呼" also breaks on 諸小兒 (kids aren't an honorific-requiring referent). The explanation must name this exact refutation, not just assert the right answer.

**Real example this fixed (two rounds):** 諸's original `context` puzzle used 諸位/諸如/諸事 as three options that were all just "諸 = many/each," making "which is closest" unanswerable-but-for-guessing — that was the first fix, converting to `pattern`. But `pattern`'s first implementation was a passive reveal button, which the user then also rejected as not being a real question. The final design (above) keeps the "read 3 examples, generalize the rule" structure but turns the generalization itself into a 3-choice question with reasoned distractors. **When authoring a new word: if your 3 "distractor" corpus meanings are actually all the same meaning, switch to `pattern` — but never implement `pattern` as a reveal-only interaction; it must always end in a real multiple-choice question about the pattern.**

A third puzzle type discussed but **not yet built**: a "pronoun-tracking" type for words like 之/其 that asks "who does this refer to?" per occurrence rather than "what does this mean?" — the current `occurrences` comparison block (below) covers some of this need in a lighter, reveal-after-solving form. Build the dedicated interactive version only if asked; don't invent it speculatively.

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
  if (playbackId === id) {
    playbackPaused ? (resumeSpeech(), setPlaybackPaused(false)) : (pauseSpeech(), setPlaybackPaused(true));
  } else {
    setPlaybackId(id);
    setPlaybackPaused(false);
    const onDone = () => setPlaybackId((cur) => (cur === id ? null : cur));
    Array.isArray(content) ? speakSequence(content, onDone) : speak(content, onDone);
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

`markWordSolved` speaks the explanation via `window.setTimeout(..., 250)` (a short pause after the reward fires feels better than speaking instantly). If the child clicks "下一個古文字" inside that 250ms window, `cancelSpeech()` alone does nothing — there's no speech playing *yet* to cancel, only a pending timer. The timeout still fires later, once the *next* word's screen is already showing, and hijacks whatever that screen is playing (a real bug the user hit: "我在第二題頁面還聽得到第一題的詳解語音").

The fix, and the general rule: **any `window.setTimeout` that leads to a `speak()` call must have its ID stored in a ref and explicitly cleared by every path that navigates away**, not just have `cancelSpeech()` called on the *already-started* utterance. Here that's `explainTimeoutRef`, cleared by a shared `stopPuzzleSpeech()` helper called from both `handleNextWord` and `handleResetProgress` (both places that change `wordIndex` or otherwise leave the current word behind). If a future puzzle type or feature adds another delayed-then-speak call, route it through the same ref-and-clear pattern rather than trusting `cancelSpeech()` to cover it.

## Rewards

`COIN_PER_GUWEN_WORD` / `STAR_PER_GUWEN_WORD` per solved word (context or pattern, same rate), `GUWEN_TEXT_COMPLETE_BONUS_COINS/STARS` once on full completion — both live in `rewards.ts`, both flow through the existing app-wide `reward()` call so the standard coin/star burst animation + sound effects fire automatically. Never hand-roll a separate celebration for this feature.

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

As of this writing, for `wangRongText`:
- 諸 → converted to `pattern` type (done)
- 嘗, 與, 遊, 走, 之, 唯, 曰, 而, 信然 → revised to the "scene comparison" explanation style (done)
- 競 → **still on the old "常見有 N 種意思" explanation style**, and its keep-or-drop status was never confirmed — don't touch it without asking
- Whether to formalize a strict corpus-design rule (exactly "1 close match / 1 easy-to-misjudge / 1 totally different") across every `context` word, retroactively — discussed, not decided
- Dedicated "pronoun-tracking" puzzle type (type C, for 之/其) — discussed, not built
