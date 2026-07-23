import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAppDataContext } from '../lib/AppDataContext';
import { findGuwenText, type GuwenText, type GuwenWord } from '../data/guwen';
import { tokenizeGuwenText } from '../lib/guwenGame';
import { speak, speakSequence, pauseSpeech, resumeSpeech, cancelSpeech } from '../lib/speech';
import { playSuccessChime, playCoinSound, playStarSound, playRollTickSound } from '../lib/sound';
import {
  COIN_PER_GUWEN_WORD,
  STAR_PER_GUWEN_WORD,
  GUWEN_TEXT_COMPLETE_BONUS_COINS,
  GUWEN_TEXT_COMPLETE_BONUS_STARS,
} from '../lib/rewards';

type Phase = 'intro' | 'listening' | 'decoding' | 'complete';

const INTRO_LINE = '小學者，我們要一起破譯這些古文字！';
const INTRO_HINT = '上面發光的字，就是等一下要破解的古文字。按下按鈕，開始破譯吧！';
const LISTEN_LEAD_IN = '首先，跟我們一起聽一遍全文。';
const LISTEN_PROMPT =
  '你是不是完全聽不懂它在說什麼呢？沒關係，跟著我們一步一步破解，每一個字都破解完之後，你就會自然看懂這整篇文章了！';

/** Spoken the moment a word is solved, before the coin/star roll-up — picked at random so it doesn't feel
 * robotic across the dozens of words in one text. */
const PRAISE_LINES = [
  '太棒了！你破解了一個古文字，這真的很不容易！',
  '答對了！這個字不好懂，你竟然想通了！',
  '厲害！你又破解了一個古文的秘密！',
];

/** Steps in the post-correct coin/star roll-up animation, and the delay between each step — slow enough to
 * feel like a deliberate "count-up," not an instant number swap. Total duration ≈ CELEBRATION_TICKS *
 * CELEBRATION_TICK_MS (currently ~1.4s), independent of how long the praise line takes to speak — the
 * explanation only starts once *both* are done (see the celebration-transition effect below). */
const CELEBRATION_TICKS = 10;
const CELEBRATION_TICK_MS = 140;

/** Safety-valve upper bound for how long the celebration will wait on the praise line's speech-`onend`
 * event before just moving on anyway — comfortably longer than any real PRAISE_LINES entry takes to speak,
 * so in normal operation `onend` always fires first and this timer never actually matters. */
const PRAISE_FALLBACK_MS = 4500;

function introParagraph(text: GuwenText): string {
  return `這篇文章裡，很多字看起來像你平常認識的漢字，對不對？但其實裡面藏了 ${text.words.length} 個「古文字」——它們的意思，跟現在完全不一樣！`;
}

const CONTEXT_PROMPT_TEXT = (word: GuwenWord) =>
  `「${word.char}」在這句話裡是什麼意思？比比看，下面哪一句語料的用法跟它最接近？`;

/**
 * The full auto-play script for a word's puzzle, as separate lines (queued with speakSequence so each
 * one fully finishes before the next starts). Differs by puzzleType:
 * - 'context': target sentence, then the comparison question.
 * - 'pattern': target sentence, the opening prompt, every example in order, then the closing question —
 *   the examples are part of the auto-play here (unlike 'context' corpus options, which are never
 *   auto-played and stay tap-to-listen only), because the child needs to hear all of them before the
 *   pattern-recognition question makes sense.
 * Shared by the auto-play effect and every manual replay button for this puzzle, so they never drift apart.
 */
function puzzleAutoPlayLines(word: GuwenWord): string[] {
  if (word.puzzleType === 'pattern') {
    return [word.targetSentence, word.patternPrompt ?? '', ...(word.patternExamples ?? []), word.patternQuestion ?? ''].filter(
      Boolean,
    );
  }
  return [word.targetSentence, CONTEXT_PROMPT_TEXT(word)];
}

/** The post-correct "coin/star roll-up" celebration, in progress for at most one word at a time.
 * 'rolling': the counter is ticking up from 0 while the praise line speaks alongside it. The transition to
 * 'settled' needs *both* the roll to reach its target tick *and* `praiseDone` to be true — advancing on the
 * roll alone cut the praise line off mid-sentence in practice (a real bug the user hit: "太棒了，你破解一個
 * 古文...還沒有講完，就被中斷"). `praiseDone` is normally set by the praise line's speech-`onend` callback,
 * but that alone would risk hanging forever if `onend` never fires on some device/browser (voices not
 * loaded, etc.) — so `markWordSolved` also arms a generous fallback timer (`PRAISE_FALLBACK_MS`, well past
 * any real praise line's spoken length) that force-sets `praiseDone` if `onend` hasn't fired by then. In
 * normal operation `onend` always wins first; the fallback is a safety valve, not the common path.
 * 'settled': the counter has reached its target and the "哇，得到 X 金幣 Y 星星" line is showing — a brief,
 * fixed pause (not tied to any external content, so it's not the "never guess a duration" timer pitfall)
 * before the explanation begins. */
interface CelebrationState {
  wordId: string;
  tick: number;
  praiseDone: boolean;
  stage: 'rolling' | 'settled';
}

/** Splits `sentence` on every occurrence of `char`, highlighting each match — used for both the target
 * sentence and the corpus example sentences, so the character under study always stands out the same way. */
function highlightChar(sentence: string, char: string): ReactNode[] {
  const parts = sentence.split(char);
  const nodes: ReactNode[] = [];
  parts.forEach((part, i) => {
    if (i > 0) {
      nodes.push(
        <span key={`h-${i}`} className="text-indigo-600 font-bold">
          {char}
        </span>,
      );
    }
    nodes.push(<span key={`t-${i}`}>{part}</span>);
  });
  return nodes;
}

export default function GuwenDecode() {
  const { textId } = useParams<{ textId: string }>();
  const text = textId ? findGuwenText(textId) : undefined;
  const { data, reward, recordGuwenWord, completeGuwenText, resetGuwenText } = useAppDataContext();

  const progress = text ? data.guwenProgress[text.id] : undefined;
  const decodedIds = useMemo(() => new Set(progress?.decodedWordIds ?? []), [progress]);
  const alreadyComplete = Boolean(progress?.completedAt);

  const [phase, setPhase] = useState<Phase>(() => {
    if (alreadyComplete) return 'complete';
    if (decodedIds.size > 0) return 'decoding';
    return 'intro';
  });
  const [wordIndex, setWordIndex] = useState(() => {
    if (!text) return 0;
    const firstUnsolved = text.words.findIndex((w) => !decodedIds.has(w.id));
    return firstUnsolved === -1 ? 0 : firstUnsolved;
  });
  const [feedback, setFeedback] = useState<'correct' | null>(null);
  const [wrongIndex, setWrongIndex] = useState<number | null>(null);
  const [revealAnswer, setRevealAnswer] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [reviewWordId, setReviewWordId] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  // Generic pause-capable playback for any longer piece of text (full-text/translation replays, per-word
  // explanations) — `id` distinguishes which button is currently "owning" playback so its label can toggle.
  const [playbackId, setPlaybackId] = useState<string | null>(null);
  const [playbackPaused, setPlaybackPaused] = useState(false);
  // The explanation auto-speaks 250ms after the celebration finishes (scheduleExplanationFor). If the child
  // advances to the next word before that timer fires, it must be cancelled — otherwise it fires late, on
  // the *next* word's screen, and hijacks whatever is playing there.
  const explainTimeoutRef = useRef<number | null>(null);
  // The coin/star roll-up celebration that plays automatically right after a correct answer, before the
  // explanation. `celebration` is null once it's finished (or been skipped) and the normal explanation UI
  // takes over. See `markWordSolved`, `tickCelebration`, and the celebration-transition effect below.
  const [celebration, setCelebration] = useState<CelebrationState | null>(null);
  const [celebrationPaused, setCelebrationPaused] = useState(false);
  const celebrationTimeoutRef = useRef<number | null>(null);
  const celebrationPraiseFallbackRef = useRef<number | null>(null);

  function playFullSequence(fullText: string) {
    setIsPlaying(true);
    setIsPaused(false);
    speakSequence([LISTEN_LEAD_IN, fullText, LISTEN_PROMPT], () => setIsPlaying(false));
  }

  function toggleFullPlayback() {
    if (!text) return;
    if (!isPlaying) {
      playFullSequence(text.fullText);
    } else if (isPaused) {
      resumeSpeech();
      setIsPaused(false);
    } else {
      pauseSpeech();
      setIsPaused(true);
    }
  }

  function playOneSentence(sentence: string) {
    setIsPlaying(false);
    setIsPaused(false);
    speak(sentence);
  }

  function togglePlayback(id: string, content: string | string[]) {
    if (playbackId === id) {
      if (playbackPaused) {
        resumeSpeech();
        setPlaybackPaused(false);
      } else {
        pauseSpeech();
        setPlaybackPaused(true);
      }
    } else {
      setPlaybackId(id);
      setPlaybackPaused(false);
      const onDone = () => setPlaybackId((cur) => (cur === id ? null : cur));
      if (Array.isArray(content)) {
        speakSequence(content, onDone);
      } else {
        speak(content, onDone);
      }
    }
  }

  /** Label for a togglePlayback-controlled button: shows the pause/resume state only while it owns playback. */
  function playbackLabel(id: string, idleLabel: string, playingLabel: string, pausedLabel: string): string {
    if (playbackId !== id) return idleLabel;
    return playbackPaused ? pausedLabel : playingLabel;
  }

  useEffect(() => {
    if (phase !== 'intro' || !text) return;
    speakSequence([text.introSpokenLine, `標題是《${text.title}》。`, introParagraph(text), INTRO_HINT]);
    return () => cancelSpeech();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, text]);

  useEffect(() => {
    if (phase !== 'listening' || !text) return;
    playFullSequence(text.fullText);
    return () => {
      cancelSpeech();
      setIsPlaying(false);
      setIsPaused(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, text]);

  useEffect(() => {
    if (phase !== 'complete' || !text) return;
    const timer = window.setTimeout(() => {
      setPlaybackId('full');
      setPlaybackPaused(false);
      speak(text.fullText, () => setPlaybackId((cur) => (cur === 'full' ? null : cur)));
    }, 400);
    return () => {
      window.clearTimeout(timer);
      cancelSpeech();
      setPlaybackId(null);
      setPlaybackPaused(false);
    };
  }, [phase, text]);

  // Auto-plays the target sentence + question every time a new puzzle comes up, so reading isn't required —
  // but it's fully pause-able (via the shared playbackId/playbackPaused toggle) for a child who wants to
  // read it themselves instead, or just needs a moment.
  useEffect(() => {
    if (phase !== 'decoding' || !text) return;
    const word = text.words[wordIndex];
    if (!word) return;
    const id = `puzzle-${word.id}`;
    setPlaybackId(id);
    setPlaybackPaused(false);
    speakSequence(puzzleAutoPlayLines(word), () => setPlaybackId((cur) => (cur === id ? null : cur)));
    return () => {
      cancelSpeech();
      setPlaybackId((cur) => (cur === id ? null : cur));
      setPlaybackPaused(false);
      if (explainTimeoutRef.current !== null) {
        window.clearTimeout(explainTimeoutRef.current);
        explainTimeoutRef.current = null;
      }
      if (celebrationTimeoutRef.current !== null) {
        window.clearTimeout(celebrationTimeoutRef.current);
        celebrationTimeoutRef.current = null;
      }
      if (celebrationPraiseFallbackRef.current !== null) {
        window.clearTimeout(celebrationPraiseFallbackRef.current);
        celebrationPraiseFallbackRef.current = null;
      }
      setCelebration(null);
      setCelebrationPaused(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, text, wordIndex]);

  // Once the roll-up reaches its target *and* the praise line is done (real onend, or the fallback safety
  // timer — see markWordSolved), settle for a brief beat (long enough to read "哇，得到 X 金幣 Y 星星"),
  // then hand off to the explanation. The roll-up and the settle beat are both fixed, deliberate delays —
  // not guesses about external content duration — so they're a different class of timer than the ones the
  // "never guess a duration" rule is about; only the praise line itself is externally-timed, which is why
  // its completion is tracked via a real event (onend) rather than a guessed delay.
  useEffect(() => {
    if (!celebration) return;
    if (celebration.stage === 'rolling' && celebration.tick >= CELEBRATION_TICKS && celebration.praiseDone) {
      playCoinSound();
      window.setTimeout(() => playStarSound(), 120);
      setCelebration((cur) => (cur && cur.wordId === celebration.wordId ? { ...cur, stage: 'settled' } : cur));
      return;
    }
    if (celebration.stage === 'settled') {
      const wordId = celebration.wordId;
      const timer = window.setTimeout(() => {
        setCelebration(null);
        scheduleExplanationFor(wordId);
      }, 700);
      return () => window.clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [celebration]);

  if (!text) {
    return (
      <div className="space-y-4">
        <p className="text-gray-500">找不到這篇古文。</p>
        <Link to="/guwen" className="text-teal-600 font-medium">
          ← 回古文破譯家
        </Link>
      </div>
    );
  }

  const tokens = tokenizeGuwenText(text.fullText, text.words);
  const currentWord: GuwenWord | undefined = text.words[wordIndex];
  const reviewWord = reviewWordId ? text.words.find((w) => w.id === reviewWordId) : undefined;
  const earnedCoins = decodedIds.size * COIN_PER_GUWEN_WORD + (alreadyComplete ? GUWEN_TEXT_COMPLETE_BONUS_COINS : 0);
  const earnedStars = decodedIds.size * STAR_PER_GUWEN_WORD + (alreadyComplete ? GUWEN_TEXT_COMPLETE_BONUS_STARS : 0);

  function renderWordChips(activeText: GuwenText, highlightCurrent: boolean) {
    return (
      <div className="flex flex-wrap justify-center gap-2">
        {activeText.words.map((w, i) => {
          const solved = decodedIds.has(w.id);
          const isCurrent = highlightCurrent && i === wordIndex;
          if (solved) {
            return (
              <button
                key={w.id}
                type="button"
                onClick={() => setReviewWordId((cur) => (cur === w.id ? null : w.id))}
                aria-label={`複習「${w.char}」`}
                className={`min-w-9 h-9 px-2 flex items-center justify-center rounded-full font-bold text-sm border-2 ${
                  reviewWordId === w.id
                    ? 'bg-amber-400 border-amber-500 text-white'
                    : 'bg-amber-100 border-amber-400 text-amber-700 hover:bg-amber-200'
                }`}
              >
                {w.char}
              </button>
            );
          }
          return (
            <span
              key={w.id}
              className={`min-w-9 h-9 px-2 flex items-center justify-center rounded-full font-bold text-sm border-2 ${
                isCurrent
                  ? 'bg-indigo-100 border-indigo-500 text-indigo-700'
                  : 'bg-gray-50 border-gray-200 text-gray-300'
              }`}
            >
              {isCurrent ? w.char : '🔒'}
            </span>
          );
        })}
      </div>
    );
  }

  function renderReviewPanel() {
    if (!reviewWord) return null;
    return (
      <div className="bg-white rounded-2xl shadow p-5 space-y-4 border-2 border-amber-300">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-amber-600">複習：「{reviewWord.char}」當時是怎麼破解的</p>
          <button
            type="button"
            onClick={() => setReviewWordId(null)}
            aria-label="關閉複習"
            className="text-gray-400 hover:text-gray-600 text-sm"
          >
            ✕ 關閉
          </button>
        </div>
        <div className="text-center space-y-1">
          <p className="text-xs text-gray-400">當時的目標句</p>
          <p className="text-lg font-semibold text-gray-800 leading-relaxed">
            {highlightChar(reviewWord.targetSentence, reviewWord.char)}
          </p>
          <button type="button" onClick={() => speak(reviewWord.targetSentence)} className="text-xs text-sky-600">
            🔊 聽這句話
          </button>
        </div>
        {reviewWord.puzzleType === 'pattern' ? (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">{reviewWord.patternPrompt}</p>
            {reviewWord.patternExamples?.map((ex, i) => (
              <div key={i} className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 flex items-start gap-2">
                <button
                  type="button"
                  onClick={() => speak(ex)}
                  aria-label="聽這句話"
                  className="text-sky-500 shrink-0"
                >
                  🔊
                </button>
                <p className="text-gray-800 flex-1">{highlightChar(ex, reviewWord.char)}</p>
              </div>
            ))}
            <p className="text-sm text-gray-600 font-semibold pt-1">{reviewWord.patternQuestion}</p>
            {reviewWord.patternOptions?.map((opt, i) => {
              const isAnswer = i === reviewWord.patternCorrectIndex;
              return (
                <div
                  key={i}
                  className={`w-full text-left rounded-xl border-2 px-4 py-3 flex items-start gap-2 ${
                    isAnswer ? 'bg-emerald-50 border-emerald-400' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => speak(opt)}
                    aria-label="聽這個選項"
                    className="text-sky-500 shrink-0"
                  >
                    🔊
                  </button>
                  <p className="text-gray-800 flex-1">{opt}</p>
                  {isAnswer && <span className="text-emerald-600 text-xs font-bold shrink-0">✓ 正解</span>}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {reviewWord.corpus?.map((c, i) => {
              const isAnswer = i === reviewWord.correctIndex;
              return (
                <div
                  key={i}
                  className={`w-full text-left rounded-xl border-2 px-4 py-3 flex items-start gap-2 ${
                    isAnswer ? 'bg-emerald-50 border-emerald-400' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => speak(c.sentence)}
                    aria-label="聽這句語料"
                    className="text-sky-500 shrink-0"
                  >
                    🔊
                  </button>
                  <p className="text-gray-800 flex-1">{highlightChar(c.sentence, reviewWord.char)}</p>
                  {isAnswer && <span className="text-emerald-600 text-xs font-bold shrink-0">✓ 正解</span>}
                </div>
              );
            })}
          </div>
        )}
        <div className="bg-emerald-50 rounded-xl p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <p className="font-bold text-emerald-700">
              「{reviewWord.char}」＝ {reviewWord.meaning}
            </p>
            <button
              type="button"
              onClick={() =>
                togglePlayback(
                  `review-${reviewWord.id}`,
                  `「${reviewWord.char}」的意思是${reviewWord.meaning}。${reviewWord.explanation}`,
                )
              }
              aria-label="聽這段說明"
              className="text-emerald-600 shrink-0"
            >
              {playbackLabel(`review-${reviewWord.id}`, '🔊', '⏸', '▶️')}
            </button>
          </div>
          <p className="text-sm text-emerald-700">{reviewWord.explanation}</p>
        </div>
        {reviewWord.occurrences && reviewWord.occurrences.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <p className="text-xs font-semibold text-gray-600">
              這篇文章裡「{reviewWord.char}」出現了 {reviewWord.occurrences.length} 次：
            </p>
            {reviewWord.occurrences.map((occ, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <button
                  type="button"
                  onClick={() => speak(occ.sentence)}
                  aria-label="聽這句話"
                  className="text-sky-500 shrink-0"
                >
                  🔊
                </button>
                <div>
                  <p className="text-gray-800">{highlightChar(occ.sentence, reviewWord.char)}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{occ.note}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderPassage(currentWordId: string | null) {
    return (
      <p className="text-xl sm:text-2xl leading-loose tracking-wide text-center">
        {tokens.map((token, i) => {
          if (!token.wordId) return <span key={i}>{token.text}</span>;
          const solved = decodedIds.has(token.wordId);
          if (solved) {
            return (
              <span key={i} className="text-amber-600 font-bold">
                {token.text}
              </span>
            );
          }
          const isCurrent = token.wordId === currentWordId;
          return (
            <span
              key={i}
              className={isCurrent ? 'text-indigo-600 font-bold' : 'text-violet-400 font-bold'}
              style={{ animation: `guwen-glow ${isCurrent ? 1.4 : 2.4}s ease-in-out infinite` }}
            >
              {token.text}
            </span>
          );
        })}
      </p>
    );
  }

  /** One step of the post-correct coin/star roll-up: bumps `tick`, plays a soft click, and schedules the
   * next step — unless paused (toggleCelebrationPause clears celebrationTimeoutRef instead of letting this
   * reschedule). Stale-callback safe: if the word changes (skip/reset) before this fires, the `wordId` guard
   * inside the state updater makes it a no-op. */
  function tickCelebration(wordId: string, tick: number) {
    celebrationTimeoutRef.current = window.setTimeout(() => {
      celebrationTimeoutRef.current = null;
      const nextTick = tick + 1;
      playRollTickSound();
      setCelebration((cur) => (cur && cur.wordId === wordId ? { ...cur, tick: nextTick } : cur));
      if (nextTick < CELEBRATION_TICKS) {
        tickCelebration(wordId, nextTick);
      }
    }, CELEBRATION_TICK_MS);
  }

  /** Schedules the meaning+explanation speech, exactly as markWordSolved used to do immediately — now
   * called once the celebration (praise line + roll-up) has fully finished. Kept as a 250ms grace delay
   * (an intentional short pause, not a duration guess) so the explanation doesn't start mid-breath after
   * the celebration's own audio. */
  function scheduleExplanationFor(wordId: string) {
    const word = text?.words.find((w) => w.id === wordId);
    if (!word) return;
    const id = `explain-${wordId}`;
    explainTimeoutRef.current = window.setTimeout(() => {
      explainTimeoutRef.current = null;
      setPlaybackId(id);
      setPlaybackPaused(false);
      speak(`「${word.char}」的意思是${word.meaning}。${word.explanation}`, () =>
        setPlaybackId((cur) => (cur === id ? null : cur)),
      );
    }, 250);
  }

  function markWordSolved(word: GuwenWord) {
    setFeedback('correct');
    recordGuwenWord(text!.id, word.id);
    reward(COIN_PER_GUWEN_WORD, STAR_PER_GUWEN_WORD);
    playSuccessChime();
    const praiseLine = PRAISE_LINES[Math.floor(Math.random() * PRAISE_LINES.length)];
    setCelebrationPaused(false);
    setCelebration({ wordId: word.id, tick: 0, praiseDone: false, stage: 'rolling' });
    speak(praiseLine, () => {
      setCelebration((cur) => (cur && cur.wordId === word.id ? { ...cur, praiseDone: true } : cur));
    });
    // Safety net in case `onend` above never fires on some device/browser — see the CelebrationState doc
    // comment. Harmless no-op if `onend` already won (the `!cur.praiseDone` guard keeps it idempotent).
    armPraiseFallback(word.id);
    tickCelebration(word.id, 0);
  }

  /** (Re)arms the praiseDone safety-net timer for `wordId` — see the CelebrationState doc comment. Called
   * once when the celebration starts, and again on resume-from-pause (a paused fallback is cleared, so it
   * needs re-arming, or a long pause could let it fire while the praise line is genuinely still mid-sentence
   * once resumed). */
  function armPraiseFallback(wordId: string) {
    celebrationPraiseFallbackRef.current = window.setTimeout(() => {
      celebrationPraiseFallbackRef.current = null;
      setCelebration((cur) => (cur && cur.wordId === wordId && !cur.praiseDone ? { ...cur, praiseDone: true } : cur));
    }, PRAISE_FALLBACK_MS);
  }

  /** Pauses/resumes both halves of the celebration at once (the praise-line speech and the roll-up ticker)
   * — the shared togglePlayback only knows about speech, so it can't cover the roll-up's visual timer too. */
  function toggleCelebrationPause() {
    if (!celebration) return;
    if (celebrationPaused) {
      setCelebrationPaused(false);
      resumeSpeech();
      if (celebration.tick < CELEBRATION_TICKS) {
        tickCelebration(celebration.wordId, celebration.tick);
      }
      if (!celebration.praiseDone) {
        armPraiseFallback(celebration.wordId);
      }
    } else {
      setCelebrationPaused(true);
      pauseSpeech();
      if (celebrationPraiseFallbackRef.current !== null) {
        window.clearTimeout(celebrationPraiseFallbackRef.current);
        celebrationPraiseFallbackRef.current = null;
      }
      if (celebrationTimeoutRef.current !== null) {
        window.clearTimeout(celebrationTimeoutRef.current);
        celebrationTimeoutRef.current = null;
      }
    }
  }

  /** Stops anything the puzzle flow might be speaking/queued to speak — call before navigating away from
   * the current word (next word, reset), so a stray explanation never plays over the next screen. Also
   * cuts short any in-progress celebration, since skipping ahead must always work immediately. */
  function stopPuzzleSpeech() {
    if (explainTimeoutRef.current !== null) {
      window.clearTimeout(explainTimeoutRef.current);
      explainTimeoutRef.current = null;
    }
    if (celebrationTimeoutRef.current !== null) {
      window.clearTimeout(celebrationTimeoutRef.current);
      celebrationTimeoutRef.current = null;
    }
    if (celebrationPraiseFallbackRef.current !== null) {
      window.clearTimeout(celebrationPraiseFallbackRef.current);
      celebrationPraiseFallbackRef.current = null;
    }
    cancelSpeech();
    setPlaybackId(null);
    setPlaybackPaused(false);
    setCelebration(null);
    setCelebrationPaused(false);
  }

  function handleSelect(index: number) {
    if (!currentWord || feedback === 'correct') return;
    setWrongIndex(null);
    if (index === currentWord.correctIndex) {
      markWordSolved(currentWord);
    } else {
      setWrongIndex(index);
    }
  }

  function handlePatternSelect(index: number) {
    if (!currentWord || feedback === 'correct') return;
    setWrongIndex(null);
    if (index === currentWord.patternCorrectIndex) {
      markWordSolved(currentWord);
    } else {
      setWrongIndex(index);
    }
  }

  function handleNextWord() {
    stopPuzzleSpeech();
    setFeedback(null);
    setWrongIndex(null);
    if (wordIndex + 1 >= text!.words.length) {
      completeGuwenText(text!.id);
      reward(GUWEN_TEXT_COMPLETE_BONUS_COINS, GUWEN_TEXT_COMPLETE_BONUS_STARS, { big: true });
      setPhase('complete');
    } else {
      setWordIndex((i) => i + 1);
    }
  }

  function handleResetProgress() {
    resetGuwenText(text!.id);
    stopPuzzleSpeech();
    setConfirmReset(false);
    setFeedback(null);
    setWrongIndex(null);
    setRevealAnswer(false);
    setReviewWordId(null);
    setIsPlaying(false);
    setIsPaused(false);
    setWordIndex(0);
    setPhase('intro');
  }

  return (
    <div className="space-y-4">
      {phase !== 'intro' && (
        <div className="flex items-center justify-between">
          <Link to="/guwen" className="text-sm text-gray-400 hover:text-gray-600">
            ← 回古文破譯家
          </Link>
          {(phase === 'decoding' || phase === 'complete') && (
            <span className="text-sm font-semibold text-amber-600 flex items-center gap-2">
              <span>
                已破解 {decodedIds.size} / {text.words.length}
              </span>
              <span className="text-orange-600">🪙+{earnedCoins}</span>
              <span className="text-amber-500">⭐+{earnedStars}</span>
            </span>
          )}
        </div>
      )}

      {phase === 'intro' && (
        <div className="bg-white rounded-2xl shadow p-6 space-y-4 text-center">
          <Link to="/guwen" className="block text-left text-sm text-gray-400 hover:text-gray-600">
            ← 回古文破譯家
          </Link>
          <div className="flex items-center justify-center gap-1.5">
            <p className="text-xs text-amber-600 font-semibold">{text.source}</p>
            <button
              type="button"
              onClick={() => speak(text.introSpokenLine)}
              aria-label="聽這段介紹"
              className="text-amber-500"
            >
              🔊
            </button>
          </div>
          <div className="flex items-center justify-center gap-2">
            <h2 className="text-2xl font-bold text-gray-800">{text.title}</h2>
            <button
              type="button"
              onClick={() => speak(`標題是《${text.title}》。`)}
              aria-label="聽標題"
              className="text-amber-500 text-lg"
            >
              🔊
            </button>
          </div>
          <div className="flex items-start justify-center gap-2">
            <p className="text-sm text-gray-500">{introParagraph(text)}</p>
            <button
              type="button"
              onClick={() => speak(introParagraph(text))}
              aria-label="聽這段說明"
              className="text-amber-500 shrink-0 mt-0.5"
            >
              🔊
            </button>
          </div>
          <div className="py-2">{renderPassage(null)}</div>
          <div className="flex items-center justify-center gap-2">
            <p className="text-xs text-gray-400">上面發光的字，就是等一下要破解的古文字。按下按鈕，開始破譯吧！</p>
            <button
              type="button"
              onClick={() => speak(INTRO_HINT)}
              aria-label="聽這段提示"
              className="text-amber-500 shrink-0"
            >
              🔊
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              speak(INTRO_LINE);
              setPhase('listening');
            }}
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl px-6 py-3"
          >
            🏺 開始破譯
          </button>
        </div>
      )}

      {phase === 'listening' && (
        <div className="bg-white rounded-2xl shadow p-6 space-y-4 text-center">
          <h2 className="text-lg font-bold text-gray-800">先聽聽看這篇文章……</h2>
          <div className="py-2">{renderPassage(null)}</div>
          <button
            type="button"
            onClick={toggleFullPlayback}
            className="bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl px-5 py-2.5 flex items-center justify-center gap-2 mx-auto"
          >
            {isPlaying ? (isPaused ? '▶️ 繼續播放全文' : '⏸ 暫停播放') : '🔊 播放全文'}
          </button>

          <div className="text-left space-y-2">
            <p className="text-xs text-gray-400 text-center">或者一句一句聽</p>
            {text.sentences.map((sentence, i) => (
              <button
                key={i}
                type="button"
                onClick={() => playOneSentence(sentence)}
                className="w-full flex items-center gap-2 bg-gray-50 hover:bg-sky-50 rounded-xl px-4 py-2.5"
              >
                <span className="text-sky-500 shrink-0">🔊</span>
                <span className="text-gray-700 text-sm sm:text-base">{sentence}</span>
              </button>
            ))}
          </div>

          <div className="bg-amber-50 rounded-xl p-4 text-sm text-amber-800">{LISTEN_PROMPT}</div>
          <button
            type="button"
            onClick={() => setPhase('decoding')}
            className="bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl px-6 py-3"
          >
            開始破解第一個字 →
          </button>
        </div>
      )}

      {phase === 'decoding' && currentWord && (
        <>
          <div className="bg-white rounded-2xl shadow p-5">{renderPassage(currentWord.id)}</div>

          <div className="bg-white rounded-xl shadow-sm px-4 py-2.5 flex items-center justify-between text-sm">
            <span className="font-semibold text-gray-600">
              已破解 {decodedIds.size} / {text.words.length}
            </span>
            <span className="flex items-center gap-2 font-bold">
              <span className="text-orange-600">🪙 +{earnedCoins}</span>
              <span className="text-amber-500">⭐ +{earnedStars}</span>
            </span>
          </div>
          {!alreadyComplete && (
            <p className="text-xs text-gray-400 text-center -mt-2">
              全部破解完成再加碼 🪙+{GUWEN_TEXT_COMPLETE_BONUS_COINS} ⭐+{GUWEN_TEXT_COMPLETE_BONUS_STARS}
            </p>
          )}

          {renderWordChips(text, true)}
          {renderReviewPanel()}

          <div className="bg-white rounded-2xl shadow p-5 space-y-4">
            <div className="text-center space-y-1">
              <p className="text-xs text-gray-400">待破解的目標句</p>
              <p className="text-lg font-semibold text-gray-800 leading-relaxed">
                {highlightChar(currentWord.targetSentence, currentWord.char)}
              </p>
              <button
                type="button"
                onClick={() => togglePlayback(`puzzle-${currentWord.id}`, puzzleAutoPlayLines(currentWord))}
                className="text-xs text-sky-600"
              >
                {playbackLabel(`puzzle-${currentWord.id}`, '🔊 聽這句話', '⏸ 暫停朗讀', '▶️ 繼續朗讀')}
              </button>
            </div>

            {currentWord.puzzleType === 'pattern' ? (
              <>
                <div className="flex items-start justify-center gap-2">
                  <p className="text-sm text-center text-gray-600">{currentWord.patternPrompt}</p>
                  <button
                    type="button"
                    onClick={() => togglePlayback(`puzzle-${currentWord.id}`, puzzleAutoPlayLines(currentWord))}
                    aria-label="聽這段說明"
                    className="text-sky-500 shrink-0 mt-0.5"
                  >
                    {playbackLabel(`puzzle-${currentWord.id}`, '🔊', '⏸', '▶️')}
                  </button>
                </div>

                <div className="space-y-2">
                  {currentWord.patternExamples?.map((ex, i) => (
                    <div
                      key={i}
                      className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 flex items-start gap-2"
                    >
                      <button
                        type="button"
                        onClick={() => speak(ex)}
                        aria-label="聽這句話"
                        className="text-sky-500 shrink-0"
                      >
                        🔊
                      </button>
                      <p className="text-gray-800">{highlightChar(ex, currentWord.char)}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-start justify-center gap-2">
                  <p className="text-sm text-center text-gray-600 font-semibold">{currentWord.patternQuestion}</p>
                  <button
                    type="button"
                    onClick={() => currentWord.patternQuestion && speak(currentWord.patternQuestion)}
                    aria-label="聽這段說明"
                    className="text-sky-500 shrink-0 mt-0.5"
                  >
                    🔊
                  </button>
                </div>

                <div className="space-y-2">
                  {currentWord.patternOptions?.map((opt, i) => {
                    const isWrong = wrongIndex === i;
                    const isCorrectPick = feedback === 'correct' && i === currentWord.patternCorrectIndex;
                    return (
                      <div
                        key={i}
                        role="button"
                        tabIndex={0}
                        onClick={() => handlePatternSelect(i)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handlePatternSelect(i);
                          }
                        }}
                        className={`w-full text-left rounded-xl border-2 px-4 py-3 transition-colors flex items-start gap-2 ${
                          feedback === 'correct' ? 'cursor-default' : 'cursor-pointer'
                        } ${
                          isCorrectPick
                            ? 'bg-emerald-50 border-emerald-400'
                            : isWrong
                              ? 'bg-red-50 border-red-300'
                              : 'bg-gray-50 border-gray-200 hover:border-indigo-300'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            speak(opt);
                          }}
                          aria-label="聽這個選項"
                          className="text-sky-500 shrink-0"
                        >
                          🔊
                        </button>
                        <p className="text-gray-800">{opt}</p>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start justify-center gap-2">
                  <p className="text-sm text-center text-gray-600">
                    「<span className="font-bold text-indigo-600">{currentWord.char}</span>
                    」在這句話裡是什麼意思？比比看，下面哪一句「語料」的用法跟它最接近？
                  </p>
                  <button
                    type="button"
                    onClick={() => togglePlayback(`puzzle-${currentWord.id}`, puzzleAutoPlayLines(currentWord))}
                    aria-label="聽這段說明"
                    className="text-sky-500 shrink-0 mt-0.5"
                  >
                    {playbackLabel(`puzzle-${currentWord.id}`, '🔊', '⏸', '▶️')}
                  </button>
                </div>

                <div className="space-y-2">
                  {currentWord.corpus?.map((c, i) => {
                    const isWrong = wrongIndex === i;
                    const isCorrectPick = feedback === 'correct' && i === currentWord.correctIndex;
                    return (
                      <div
                        key={i}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleSelect(i)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleSelect(i);
                          }
                        }}
                        className={`w-full text-left rounded-xl border-2 px-4 py-3 transition-colors flex items-start gap-2 ${
                          feedback === 'correct' ? 'cursor-default' : 'cursor-pointer'
                        } ${
                          isCorrectPick
                            ? 'bg-emerald-50 border-emerald-400'
                            : isWrong
                              ? 'bg-red-50 border-red-300'
                              : 'bg-gray-50 border-gray-200 hover:border-indigo-300'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            speak(c.sentence);
                          }}
                          aria-label="聽這句語料"
                          className="text-sky-500 shrink-0"
                        >
                          🔊
                        </button>
                        <p className="text-gray-800">{highlightChar(c.sentence, currentWord.char)}</p>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {feedback === 'correct' && celebration && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl p-5 space-y-3 text-center">
                <p className="text-lg font-bold text-orange-700">
                  {celebration.stage === 'settled' ? '🎉 太棒了！' : '✨ 答對了！'}
                </p>
                <div className="flex items-center justify-center gap-6 text-2xl font-extrabold tabular-nums">
                  <span className="text-orange-600">
                    🪙 {Math.round((celebration.tick / CELEBRATION_TICKS) * COIN_PER_GUWEN_WORD)}
                  </span>
                  <span className="text-amber-500">
                    ⭐ {Math.round((celebration.tick / CELEBRATION_TICKS) * STAR_PER_GUWEN_WORD)}
                  </span>
                </div>
                {celebration.stage === 'settled' && (
                  <p className="text-sm text-orange-600 font-semibold">
                    哇，得到 {COIN_PER_GUWEN_WORD} 金幣、{STAR_PER_GUWEN_WORD} 星星！
                  </p>
                )}
                <button type="button" onClick={toggleCelebrationPause} className="text-sm text-orange-500 underline">
                  {celebrationPaused ? '▶️ 繼續播放' : '⏸ 暫停播放'}
                </button>
              </div>
            )}
            {feedback === 'correct' && !celebration && (
              <div className="bg-emerald-50 rounded-xl p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold text-emerald-700">
                    ✅ 破解成功！「{currentWord.char}」＝ {currentWord.meaning}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      togglePlayback(
                        `explain-${currentWord.id}`,
                        `「${currentWord.char}」的意思是${currentWord.meaning}。${currentWord.explanation}`,
                      )
                    }
                    aria-label="聽這段說明"
                    className="text-emerald-600 shrink-0"
                  >
                    {playbackLabel(`explain-${currentWord.id}`, '🔊', '⏸', '▶️')}
                  </button>
                </div>
                <p className="text-sm text-emerald-700">{currentWord.explanation}</p>

                {currentWord.occurrences && currentWord.occurrences.length > 0 && (
                  <div className="bg-white/70 rounded-lg p-3 space-y-2">
                    <p className="text-xs font-semibold text-emerald-700">
                      這篇文章裡「{currentWord.char}」出現了 {currentWord.occurrences.length} 次，來比較看看：
                    </p>
                    {currentWord.occurrences.map((occ, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <button
                          type="button"
                          onClick={() => speak(occ.sentence)}
                          aria-label="聽這句話"
                          className="text-sky-500 shrink-0"
                        >
                          🔊
                        </button>
                        <div>
                          <p className="text-gray-800">{highlightChar(occ.sentence, currentWord.char)}</p>
                          <p className="text-gray-500 text-xs mt-0.5">{occ.note}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {feedback === 'correct' && (
              <button
                type="button"
                onClick={handleNextWord}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl py-2.5"
              >
                {wordIndex + 1 >= text.words.length ? '🎉 完成！看看整篇文章' : '下一個古文字 →'}
              </button>
            )}
            {wrongIndex !== null && feedback !== 'correct' && (
              <div className="flex items-center justify-center gap-2">
                <p className="text-center text-sm text-red-500">
                  {currentWord.puzzleType === 'pattern'
                    ? '再想想看，這個規律能不能解釋每一句例句～'
                    : '再想想看，比一比上下文的意思～'}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    speak(
                      currentWord.puzzleType === 'pattern'
                        ? '再想想看，這個規律能不能解釋每一句例句。'
                        : '再想想看，比一比上下文的意思。',
                    )
                  }
                  aria-label="聽這段提示"
                  className="text-red-400 shrink-0"
                >
                  🔊
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {phase === 'complete' && (
        <div className="bg-white rounded-2xl shadow p-6 space-y-4 text-center">
          <p className="text-3xl">🏆</p>
          <h2 className="text-xl font-bold text-gray-800">恭喜！你破解了整篇《{text.title}》！</h2>
          <p className="text-sm font-bold">
            <span className="text-orange-600">🪙 共得 {earnedCoins} 金幣</span>
            <span className="text-gray-400"> ・ </span>
            <span className="text-amber-500">⭐ 共得 {earnedStars} 星星</span>
          </p>
          <p className="text-xs text-gray-400">
            （含全部破解加碼 🪙+{GUWEN_TEXT_COMPLETE_BONUS_COINS} ⭐+{GUWEN_TEXT_COMPLETE_BONUS_STARS}）
          </p>
          <div className="py-2">{renderPassage(null)}</div>
          <button
            type="button"
            onClick={() => togglePlayback('full', text.fullText)}
            className="text-sm text-sky-600 flex items-center justify-center gap-1 mx-auto"
          >
            {playbackLabel('full', '🔊 再聽一次全文', '⏸ 暫停播放', '▶️ 繼續播放全文')}
          </button>

          {renderWordChips(text, false)}
          {renderReviewPanel()}

          <div className="bg-amber-50 rounded-xl p-4 text-left space-y-2">
            <p className="text-xs font-semibold text-amber-600">白話文（破解成功的獎勵）</p>
            <p className="text-sm text-gray-700 leading-relaxed">{text.modernTranslation}</p>
            <button
              type="button"
              onClick={() => togglePlayback('translation', text.modernTranslation)}
              className="text-xs text-sky-600"
            >
              {playbackLabel('translation', '🔊 聽白話文', '⏸ 暫停播放', '▶️ 繼續播放')}
            </button>
          </div>

          <div className="bg-indigo-50 rounded-xl p-4 text-left space-y-2">
            <p className="text-xs font-semibold text-indigo-600">💭 再想一想</p>
            <p className="text-sm text-gray-700">{text.reflectionQuestion}</p>
            {revealAnswer ? (
              <p className="text-sm text-indigo-700">{text.reflectionAnswer}</p>
            ) : (
              <button
                type="button"
                onClick={() => setRevealAnswer(true)}
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
              >
                我想到答案了，看看對不對 →
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/guwen"
              className="inline-block bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl px-6 py-3"
            >
              回古文破譯家
            </Link>
            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="text-sm text-gray-400 hover:text-gray-600 underline"
              >
                🔄 重新開始這篇（清空重來）
              </button>
            ) : (
              <div className="w-full flex items-center justify-center gap-3 text-sm">
                <span className="text-gray-600">確定要清空重來嗎？已賺的金幣星星不會收回。</span>
                <button
                  type="button"
                  onClick={handleResetProgress}
                  className="bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg px-3 py-1.5"
                >
                  確定重來
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  取消
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
