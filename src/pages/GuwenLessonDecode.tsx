import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAppDataContext } from '../lib/AppDataContext';
import { findGuwenLesson, type GuwenLesson, type LessonStep } from '../data/guwenLesson';
import { speak, speakSequence, pauseSpeech, resumeSpeech, cancelSpeech } from '../lib/speech';
import { playSuccessChime, playCoinSound, playStarSound, playRollTickSound } from '../lib/sound';
import {
  COIN_PER_GUWEN_WORD,
  STAR_PER_GUWEN_WORD,
  GUWEN_TEXT_COMPLETE_BONUS_COINS,
  GUWEN_TEXT_COMPLETE_BONUS_STARS,
} from '../lib/rewards';

type Phase = 'intro' | 'listening' | 'steps' | 'complete';

const INTRO_LINE = '小學者，我們要一起破譯這些古文字！';
const INTRO_HINT = '上面發光的字，就是等一下要破解的古文句。按下按鈕，開始破譯吧！';
const LISTEN_LEAD_IN = '首先，跟我們一起聽一遍全文。';
const LISTEN_PROMPT =
  '你是不是完全聽不懂它在說什麼呢？沒關係，跟著我們一步一步比對古文線索，把每個密碼都破解完之後，你就會自然看懂這整篇文章了！';

const PRAISE_LINES = [
  '太棒了！你破解了一個古文密碼，這真的很不容易！',
  '答對了！這條線索不好比對，你竟然想通了！',
  '厲害！你又破解了一個古文的秘密！',
];

const CELEBRATION_TICKS = 10;
const CELEBRATION_TICK_MS = 140;
const PRAISE_FALLBACK_MS = 4500;

interface CelebrationState {
  stepId: string;
  tick: number;
  praiseDone: boolean;
  stage: 'rolling' | 'settled';
}

/** The full auto-play script for a step, as separate lines (queued with speakSequence so each one fully
 * finishes before the next starts). Clues/keys are part of the auto-play here — the child needs to hear all
 * the evidence before the question makes sense, mirroring the guwen-decoder skill's 'pattern' puzzle rule. */
function stepAutoPlayLines(step: LessonStep): string[] {
  const lines: string[] = [step.targetSentence, step.intro];
  if (step.type === 'evidence') {
    lines.push(step.clues[0].text, step.clues[0].unlockedMeaning, step.clues[1].text, step.clues[1].unlockedMeaning);
  } else if (step.type === 'reconstruction') {
    step.keys.forEach((k) => {
      lines.push(k.code, k.decodedEvidence);
    });
  }
  if (step.question !== step.intro) lines.push(step.question);
  return lines.filter(Boolean);
}

/** Splits `sentence` on every occurrence of `phrase`, highlighting each match. */
function highlightPhrase(sentence: string, phrase: string): ReactNode[] {
  if (!phrase || !sentence.includes(phrase)) return [<span key="t">{sentence}</span>];
  const parts = sentence.split(phrase);
  const nodes: ReactNode[] = [];
  parts.forEach((part, i) => {
    if (i > 0) {
      nodes.push(
        <span key={`h-${i}`} className="text-indigo-600 font-bold">
          {phrase}
        </span>,
      );
    }
    nodes.push(<span key={`t-${i}`}>{part}</span>);
  });
  return nodes;
}

/** A sentence chunk of the full passage counts as solved once every step targeting it (or a phrase inside
 * it) has been solved — a lesson step's target is usually a sub-phrase of one `sentences` entry. */
function isSentenceSolved(sentence: string, lesson: GuwenLesson, solvedIds: Set<string>): boolean {
  const relevant = lesson.steps.filter(
    (s) => sentence.includes(s.targetSentence) || s.targetSentence.includes(sentence),
  );
  if (relevant.length === 0) return false;
  return relevant.every((s) => solvedIds.has(s.id));
}

/** The first step whose prerequisites are all solved but which isn't solved itself yet — steps are
 * evaluated in lesson-authored order, so a linear lesson (every step's prerequisite is just the one before
 * it) naturally proceeds top to bottom, while a lesson with real branching would still resolve correctly. */
function findCurrentStep(lesson: GuwenLesson, solvedIds: Set<string>): LessonStep | undefined {
  return lesson.steps.find((s) => !solvedIds.has(s.id) && s.prerequisiteIds.every((id) => solvedIds.has(id)));
}

export default function GuwenLessonDecode() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const lesson = lessonId ? findGuwenLesson(lessonId) : undefined;
  const { data, reward, recordGuwenWord, completeGuwenText, resetGuwenText } = useAppDataContext();

  const progress = lesson ? data.guwenProgress[lesson.id] : undefined;
  const solvedIds = useMemo(() => new Set(progress?.decodedWordIds ?? []), [progress]);
  const alreadyComplete = Boolean(progress?.completedAt);
  // Every step can be solved without `completedAt` ever being recorded — that field is only set when the
  // child clicks the final "🎉 完成" button, so leaving via "← 回古文破譯家" right after the last correct
  // answer skips it. Treat "nothing left to solve" the same as "explicitly completed" everywhere below,
  // otherwise re-opening the lesson lands on phase 'steps' with no current step (findCurrentStep finds none
  // left) — none of the four phase branches match, and the page renders nothing but the back link.
  const allStepsSolved = Boolean(lesson) && lesson!.steps.length > 0 && solvedIds.size >= lesson!.steps.length;

  const [phase, setPhase] = useState<Phase>(() => {
    if (alreadyComplete || allStepsSolved) return 'complete';
    if (solvedIds.size > 0) return 'steps';
    return 'intro';
  });
  const [feedback, setFeedback] = useState<'correct' | null>(null);
  const [wrongIndex, setWrongIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [reviewStepId, setReviewStepId] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [verificationOpen, setVerificationOpen] = useState(alreadyComplete);
  const [playbackId, setPlaybackId] = useState<string | null>(null);
  const [playbackPaused, setPlaybackPaused] = useState(false);
  const explainTimeoutRef = useRef<number | null>(null);
  const [celebration, setCelebration] = useState<CelebrationState | null>(null);
  const [celebrationPaused, setCelebrationPaused] = useState(false);
  const celebrationTimeoutRef = useRef<number | null>(null);
  const celebrationPraiseFallbackRef = useRef<number | null>(null);
  // Which step is on screen right now — deliberately its own state (not derived fresh from solvedIds on
  // every render, the way `wordIndex` in GuwenDecode.tsx is separate state too). If this were computed as
  // `findCurrentStep(lesson, solvedIds)` directly, the *instant* the last step's answer is recorded,
  // solvedIds would include it and findCurrentStep would return undefined (no unsolved step left) — making
  // the entire steps-phase UI, including the just-earned celebration and the "complete" button, vanish
  // before the child ever sees them. `activeStepId` only changes when handleNextStep explicitly advances it.
  const [activeStepId, setActiveStepId] = useState<string | undefined>(() =>
    lesson ? findCurrentStep(lesson, solvedIds)?.id : undefined,
  );

  const currentStep = lesson?.steps.find((s) => s.id === activeStepId);

  function playFullSequence(fullText: string) {
    setIsPlaying(true);
    setIsPaused(false);
    speakSequence([LISTEN_LEAD_IN, fullText, LISTEN_PROMPT], () => setIsPlaying(false));
  }

  function toggleFullPlayback() {
    if (!lesson) return;
    if (!isPlaying || isPaused) {
      // speechSynthesis.resume() is unreliable on some browsers once paused for more than a moment — the
      // engine silently drops the utterance instead of continuing (a real bug the user hit: pause worked,
      // but pressing play again produced no sound). Restarting the whole sequence from the top is a small
      // UX compromise but guarantees sound actually resumes, covering both "starting fresh" and "resuming".
      playFullSequence(lesson.fullText);
    } else {
      pauseSpeech();
      setIsPaused(true);
    }
  }

  function togglePlayback(id: string, content: string | string[]) {
    const startOrRestart = () => {
      setPlaybackId(id);
      setPlaybackPaused(false);
      const onDone = () => setPlaybackId((cur) => (cur === id ? null : cur));
      if (Array.isArray(content)) {
        speakSequence(content, onDone);
      } else {
        speak(content, onDone);
      }
    };
    if (playbackId === id) {
      if (playbackPaused) {
        // Same resume-is-unreliable issue as toggleFullPlayback — restart from the top instead of trusting
        // speechSynthesis.resume().
        startOrRestart();
      } else {
        pauseSpeech();
        setPlaybackPaused(true);
      }
    } else {
      startOrRestart();
    }
  }

  function playbackLabel(id: string, idleLabel: string, playingLabel: string, pausedLabel: string): string {
    if (playbackId !== id) return idleLabel;
    return playbackPaused ? pausedLabel : playingLabel;
  }

  useEffect(() => {
    if (phase !== 'intro' || !lesson) return;
    speakSequence([lesson.introSpokenLine, `標題是《${lesson.title}》。`, INTRO_HINT]);
    return () => cancelSpeech();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, lesson]);

  useEffect(() => {
    if (phase !== 'listening' || !lesson) return;
    playFullSequence(lesson.fullText);
    return () => {
      cancelSpeech();
      setIsPlaying(false);
      setIsPaused(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, lesson]);

  // Grants the completion bonus the child would have gotten from clicking "🎉 完成", for the case where
  // every step is already solved but that button was never clicked (see the `allStepsSolved` comment above).
  // The ref guards against re-firing on every render once `completeGuwenText` lands and `alreadyComplete`
  // flips true — without it, this would otherwise still be eligible to run again on remounts before that
  // state change is reflected.
  const missedCompletionAwardedRef = useRef(false);
  useEffect(() => {
    if (missedCompletionAwardedRef.current) return;
    if (!lesson || alreadyComplete || !allStepsSolved) return;
    missedCompletionAwardedRef.current = true;
    completeGuwenText(lesson.id);
    reward(GUWEN_TEXT_COMPLETE_BONUS_COINS, GUWEN_TEXT_COMPLETE_BONUS_STARS, { big: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson, alreadyComplete, allStepsSolved]);

  useEffect(() => {
    if (phase !== 'complete' || !lesson || !verificationOpen) return;
    const timer = window.setTimeout(() => {
      setPlaybackId('translation');
      setPlaybackPaused(false);
      speak(lesson.finalVerification.translation, () => setPlaybackId((cur) => (cur === 'translation' ? null : cur)));
    }, 400);
    return () => {
      window.clearTimeout(timer);
      cancelSpeech();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, lesson, verificationOpen]);

  // Auto-plays the target sentence + intro + evidence/keys + question every time a new step comes up.
  useEffect(() => {
    if (phase !== 'steps' || !currentStep) return;
    const id = `step-${currentStep.id}`;
    setPlaybackId(id);
    setPlaybackPaused(false);
    speakSequence(stepAutoPlayLines(currentStep), () => setPlaybackId((cur) => (cur === id ? null : cur)));
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
  }, [phase, currentStep?.id]);

  // Once the roll-up reaches its target *and* the praise line is done (real onend, or the fallback safety
  // timer), settle for a brief beat, then hand off to the explanation.
  useEffect(() => {
    if (!celebration) return;
    if (celebration.stage === 'rolling' && celebration.tick >= CELEBRATION_TICKS && celebration.praiseDone) {
      playCoinSound();
      window.setTimeout(() => playStarSound(), 120);
      setCelebration((cur) => (cur && cur.stepId === celebration.stepId ? { ...cur, stage: 'settled' } : cur));
      return;
    }
    if (celebration.stage === 'settled') {
      const stepId = celebration.stepId;
      const timer = window.setTimeout(() => {
        setCelebration(null);
        scheduleExplanationFor(stepId);
      }, 700);
      return () => window.clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [celebration]);

  if (!lesson) {
    return (
      <div className="space-y-4">
        <p className="text-gray-500">找不到這篇古文。</p>
        <Link to="/guwen" className="text-teal-600 font-medium">
          ← 回古文破譯家
        </Link>
      </div>
    );
  }

  const totalSteps = lesson.steps.length;
  const earnedCoins = solvedIds.size * COIN_PER_GUWEN_WORD + (alreadyComplete ? GUWEN_TEXT_COMPLETE_BONUS_COINS : 0);
  const earnedStars = solvedIds.size * STAR_PER_GUWEN_WORD + (alreadyComplete ? GUWEN_TEXT_COMPLETE_BONUS_STARS : 0);
  const reviewStep = reviewStepId ? lesson.steps.find((s) => s.id === reviewStepId) : undefined;

  function renderStepChips() {
    return (
      <div className="flex flex-wrap justify-center gap-2">
        {lesson!.steps.map((s, i) => {
          const solved = solvedIds.has(s.id);
          const isCurrent = currentStep?.id === s.id;
          if (solved) {
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setReviewStepId((cur) => (cur === s.id ? null : s.id))}
                aria-label={`複習第 ${i + 1} 個密碼`}
                className={`w-9 h-9 flex items-center justify-center rounded-full font-bold text-sm border-2 ${
                  reviewStepId === s.id
                    ? 'bg-amber-400 border-amber-500 text-white'
                    : 'bg-amber-100 border-amber-400 text-amber-700 hover:bg-amber-200'
                }`}
              >
                {i + 1}
              </button>
            );
          }
          return (
            <span
              key={s.id}
              className={`w-9 h-9 flex items-center justify-center rounded-full font-bold text-sm border-2 ${
                isCurrent ? 'bg-indigo-100 border-indigo-500 text-indigo-700' : 'bg-gray-50 border-gray-200 text-gray-300'
              }`}
            >
              {isCurrent ? i + 1 : '🔒'}
            </span>
          );
        })}
      </div>
    );
  }

  function renderPassage() {
    return (
      <p className="text-lg font-semibold text-gray-800 leading-relaxed text-center">
        {lesson!.sentences.map((sentence, i) => {
          const solved = isSentenceSolved(sentence, lesson!, solvedIds);
          const isCurrentChunk = currentStep && sentence.includes(currentStep.targetSentence);
          return (
            <span
              key={i}
              className={
                solved
                  ? 'text-amber-600 font-bold'
                  : isCurrentChunk
                    ? 'text-indigo-600 font-bold guwen-glow'
                    : 'text-gray-300'
              }
            >
              {sentence}
            </span>
          );
        })}
      </p>
    );
  }

  function tickCelebration(stepId: string, tick: number) {
    celebrationTimeoutRef.current = window.setTimeout(() => {
      celebrationTimeoutRef.current = null;
      const nextTick = tick + 1;
      playRollTickSound();
      setCelebration((cur) => (cur && cur.stepId === stepId ? { ...cur, tick: nextTick } : cur));
      if (nextTick < CELEBRATION_TICKS) {
        tickCelebration(stepId, nextTick);
      }
    }, CELEBRATION_TICK_MS);
  }

  function armPraiseFallback(stepId: string) {
    celebrationPraiseFallbackRef.current = window.setTimeout(() => {
      celebrationPraiseFallbackRef.current = null;
      setCelebration((cur) => (cur && cur.stepId === stepId && !cur.praiseDone ? { ...cur, praiseDone: true } : cur));
    }, PRAISE_FALLBACK_MS);
  }

  function scheduleExplanationFor(stepId: string) {
    const step = lesson!.steps.find((s) => s.id === stepId);
    if (!step) return;
    const id = `explain-${stepId}`;
    explainTimeoutRef.current = window.setTimeout(() => {
      explainTimeoutRef.current = null;
      setPlaybackId(id);
      setPlaybackPaused(false);
      speak(step.explanation.replace(/\n+/g, ' '), () => setPlaybackId((cur) => (cur === id ? null : cur)));
    }, 250);
  }

  function markStepSolved(step: LessonStep) {
    setFeedback('correct');
    recordGuwenWord(lesson!.id, step.id);
    reward(COIN_PER_GUWEN_WORD, STAR_PER_GUWEN_WORD);
    playSuccessChime();
    const praiseLine = PRAISE_LINES[Math.floor(Math.random() * PRAISE_LINES.length)];
    setCelebrationPaused(false);
    setCelebration({ stepId: step.id, tick: 0, praiseDone: false, stage: 'rolling' });
    speak(praiseLine, () => {
      setCelebration((cur) => (cur && cur.stepId === step.id ? { ...cur, praiseDone: true } : cur));
    });
    armPraiseFallback(step.id);
    tickCelebration(step.id, 0);
  }

  function toggleCelebrationPause() {
    if (!celebration) return;
    if (celebrationPaused) {
      setCelebrationPaused(false);
      resumeSpeech();
      if (celebration.tick < CELEBRATION_TICKS) {
        tickCelebration(celebration.stepId, celebration.tick);
      }
      if (!celebration.praiseDone) {
        armPraiseFallback(celebration.stepId);
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

  function stopStepSpeech() {
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
    if (!currentStep || feedback === 'correct') return;
    setWrongIndex(null);
    if (index === currentStep.correctIndex) {
      markStepSolved(currentStep);
    } else {
      setWrongIndex(index);
    }
  }

  function handleNextStep() {
    stopStepSpeech();
    setFeedback(null);
    setWrongIndex(null);
    // solvedIds already includes the just-solved step (recordGuwenWord already landed), so this looks up
    // whichever step should come after it — or nothing, if that was the last one.
    const next = lesson ? findCurrentStep(lesson, solvedIds) : undefined;
    if (!next) {
      completeGuwenText(lesson!.id);
      reward(GUWEN_TEXT_COMPLETE_BONUS_COINS, GUWEN_TEXT_COMPLETE_BONUS_STARS, { big: true });
      setVerificationOpen(false);
      setPhase('complete');
    } else {
      setActiveStepId(next.id);
    }
  }

  function handleResetProgress() {
    resetGuwenText(lesson!.id);
    stopStepSpeech();
    setConfirmReset(false);
    setFeedback(null);
    setWrongIndex(null);
    setReviewStepId(null);
    setIsPlaying(false);
    setIsPaused(false);
    setVerificationOpen(false);
    setActiveStepId(lesson ? findCurrentStep(lesson, new Set())?.id : undefined);
    setPhase('intro');
  }

  function renderClue(clue: { text: string; highlight: string; unlockedMeaning: string; source: string }, i: number) {
    return (
      <div key={i} className="rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 space-y-1.5">
        <div className="flex items-start gap-2">
          <button type="button" onClick={() => speak(clue.text)} aria-label="聽這句古文線索" className="text-sky-500 shrink-0">
            🔊
          </button>
          <p className="text-gray-800 font-medium">{highlightPhrase(clue.text, clue.highlight)}</p>
        </div>
        <div className="flex items-start gap-2 pl-1">
          <button
            type="button"
            onClick={() => speak(clue.unlockedMeaning)}
            aria-label="聽這句白話"
            className="text-sky-500 shrink-0 text-xs"
          >
            🔊
          </button>
          <p className="text-xs text-gray-500">已破解為：{clue.unlockedMeaning}</p>
        </div>
        <p className="text-[11px] text-gray-300 pl-1">出處：{clue.source}</p>
      </div>
    );
  }

  function renderOptions(step: LessonStep, readOnly: boolean) {
    return (
      <div className="space-y-2">
        {step.options.map((opt, i) => {
          const isWrong = !readOnly && wrongIndex === i;
          const isCorrectPick = (readOnly || feedback === 'correct') && i === step.correctIndex;
          return (
            <div
              key={i}
              role={readOnly ? undefined : 'button'}
              tabIndex={readOnly ? undefined : 0}
              onClick={readOnly ? undefined : () => handleSelect(i)}
              onKeyDown={
                readOnly
                  ? undefined
                  : (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelect(i);
                      }
                    }
              }
              className={`w-full text-left rounded-xl border-2 px-4 py-3 transition-colors flex items-start gap-2 ${
                readOnly || feedback === 'correct' ? 'cursor-default' : 'cursor-pointer'
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
              {isCorrectPick && <span className="ml-auto text-emerald-600 text-xs font-bold shrink-0">✓ 正解</span>}
            </div>
          );
        })}
      </div>
    );
  }

  function renderKeyTable(keys: { code: string; decodedEvidence: string }[]) {
    return (
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-500">🔑 已取得的密碼鑰匙</p>
        {keys.map((k, i) => (
          <div key={i} className="flex items-center gap-2 rounded-xl border-2 border-amber-200 bg-amber-50 px-4 py-2">
            <button type="button" onClick={() => speak(k.code)} aria-label="聽這個密碼" className="text-sky-500 shrink-0">
              🔊
            </button>
            <span className="font-bold text-amber-700 shrink-0">{k.code}</span>
            <span className="text-gray-400 shrink-0">＝</span>
            <span className="text-gray-700 text-sm">{k.decodedEvidence}</span>
          </div>
        ))}
      </div>
    );
  }

  function renderReviewPanel() {
    if (!reviewStep) return null;
    return (
      <div className="bg-white rounded-2xl shadow p-5 space-y-4 border-2 border-amber-300">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-800">📖 複習：{reviewStep.targetSentence}</h3>
          <button type="button" onClick={() => setReviewStepId(null)} className="text-gray-400 hover:text-gray-600 text-sm">
            ✕
          </button>
        </div>
        <p className="text-sm text-gray-600">{reviewStep.intro}</p>
        {reviewStep.type === 'evidence' && (
          <div className="space-y-2">{reviewStep.clues.map((c, i) => renderClue(c, i))}</div>
        )}
        {reviewStep.type === 'reconstruction' && renderKeyTable(reviewStep.keys)}
        <p className="text-sm font-semibold text-gray-700">{reviewStep.question}</p>
        {renderOptions(reviewStep, true)}
        <div className="bg-emerald-50 rounded-xl p-3 space-y-1">
          <p className="text-sm font-bold text-emerald-700">{reviewStep.correctFeedback}</p>
          <p className="text-sm text-emerald-700 whitespace-pre-line">{reviewStep.explanation}</p>
        </div>
        {reviewStep.keyAwarded && (
          <p className="text-xs text-amber-600">
            🔑 密碼鑰匙：{reviewStep.keyAwarded.code} ＝ {reviewStep.keyAwarded.decodedEvidence}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link to="/guwen" className="text-teal-600 text-sm font-medium">
        ← 回古文破譯家
      </Link>

      {phase === 'intro' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow p-5 space-y-3">
            <h2 className="text-xl font-bold text-gray-800">{lesson.title}</h2>
            <p className="text-xs text-gray-400">{lesson.source}</p>
            <p className="text-gray-600">{lesson.introSpokenLine}</p>
            {renderPassage()}
            <p className="text-sm text-gray-400">{INTRO_HINT}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              speak(INTRO_LINE);
              setPhase('listening');
            }}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl py-3"
          >
            🏺 開始破譯
          </button>
        </div>
      )}

      {phase === 'listening' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow p-5 space-y-3">
            <p className="text-lg leading-relaxed text-gray-800">{lesson.fullText}</p>
            <button type="button" onClick={toggleFullPlayback} className="text-sm text-sky-600 font-medium">
              {!isPlaying ? '🔊 播放全文' : isPaused ? '▶️ 繼續播放' : '⏸ 暫停播放'}
            </button>
            <div className="pt-2 border-t border-gray-100 space-y-1.5">
              <p className="text-xs text-gray-400">或者一句一句聽：</p>
              {lesson.sentences.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <button type="button" onClick={() => speak(s)} aria-label="聽這句話" className="text-sky-500 shrink-0">
                    🔊
                  </button>
                  <span className="text-sm text-gray-600">{s}</span>
                </div>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPhase('steps')}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl py-3"
          >
            開始破解第一道密碼 →
          </button>
        </div>
      )}

      {phase === 'steps' && currentStep && (
        <div className="space-y-4">
          {renderPassage()}
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold text-teal-600">
              已破解 {solvedIds.size} / {totalSteps}
            </span>
            <span className="text-orange-600">🪙+{earnedCoins}</span>
            <span className="text-amber-500">⭐+{earnedStars}</span>
          </div>
          {renderStepChips()}
          {renderReviewPanel()}

          <div className="bg-white rounded-2xl shadow p-5 space-y-4">
            <div className="text-center space-y-1">
              <p className="text-xs text-gray-400">待破解的目標句</p>
              <p className="text-lg font-semibold text-gray-800 leading-relaxed">
                <span className="text-indigo-600 font-bold">{currentStep.targetSentence}</span>
              </p>
              <button
                type="button"
                onClick={() => togglePlayback(`step-${currentStep.id}`, stepAutoPlayLines(currentStep))}
                className="text-xs text-sky-600"
              >
                {playbackLabel(`step-${currentStep.id}`, '🔊 聽這句話', '⏸ 暫停播放', '▶️ 繼續播放')}
              </button>
            </div>

            <p className="text-sm text-center text-gray-600">{currentStep.intro}</p>

            {currentStep.type === 'evidence' && (
              <div className="space-y-2">{currentStep.clues.map((c, i) => renderClue(c, i))}</div>
            )}
            {currentStep.type === 'reconstruction' && renderKeyTable(currentStep.keys)}

            <p className="text-sm font-semibold text-center text-gray-700">{currentStep.question}</p>

            {feedback !== 'correct' && renderOptions(currentStep, false)}

            {wrongIndex !== null && feedback !== 'correct' && (
              <div className="flex items-center justify-center gap-2">
                <p className="text-center text-sm text-red-500">{currentStep.retryHint}</p>
                <button type="button" onClick={() => speak(currentStep.retryHint)} aria-label="聽這段提示" className="text-red-400 shrink-0">
                  🔊
                </button>
              </div>
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
                  <p className="font-bold text-emerald-700">{currentStep.correctFeedback}</p>
                  <button
                    type="button"
                    onClick={() => togglePlayback(`explain-${currentStep.id}`, currentStep.explanation.replace(/\n+/g, ' '))}
                    aria-label="聽這段說明"
                    className="text-emerald-600 shrink-0"
                  >
                    {playbackLabel(`explain-${currentStep.id}`, '🔊', '⏸', '▶️')}
                  </button>
                </div>
                <p className="text-sm text-emerald-700 whitespace-pre-line">{currentStep.explanation}</p>
                {currentStep.keyAwarded && (
                  <p className="text-xs text-amber-600 bg-white/70 rounded-lg p-2">
                    🔑 你破解了一把新密碼：{currentStep.keyAwarded.code} ＝ {currentStep.keyAwarded.decodedEvidence}
                  </p>
                )}
              </div>
            )}
            {feedback === 'correct' && (
              <button
                type="button"
                onClick={handleNextStep}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl py-2.5"
              >
                {solvedIds.size >= totalSteps ? '🎉 完成！看看整篇文章' : '下一道密碼 →'}
              </button>
            )}
          </div>
        </div>
      )}

      {phase === 'complete' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow p-6 text-center space-y-3">
            <p className="text-4xl">🏆</p>
            <h2 className="text-xl font-bold text-gray-800">全文破譯成功！</h2>
            <p className="text-sm text-gray-500">
              🪙 共得 {earnedCoins} 金幣　⭐ 共得 {earnedStars} 星星
            </p>
            {renderPassage()}
          </div>

          {!verificationOpen ? (
            <div className="bg-white rounded-2xl shadow p-5 space-y-3">
              <p className="text-xs font-semibold text-gray-500">📜 我的破譯稿</p>
              <div className="space-y-1.5">
                {lesson.steps
                  .filter((s) => s.finalDraftLine)
                  .map((s) => (
                    <p key={s.id} className="text-gray-700 text-sm">
                      {s.finalDraftLine}
                    </p>
                  ))}
              </div>
              <button
                type="button"
                onClick={() => setVerificationOpen(true)}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl py-3"
              >
                📜 {lesson.finalVerification.unlockButtonLabel}
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow p-5 space-y-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-gray-800">白話驗證卷軸</h3>
                <button
                  type="button"
                  onClick={() => togglePlayback('translation', lesson.finalVerification.translation)}
                  aria-label="聽白話文"
                  className="text-sky-500 shrink-0"
                >
                  {playbackLabel('translation', '🔊', '⏸', '▶️')}
                </button>
              </div>
              <p className="text-gray-700 leading-relaxed">{lesson.finalVerification.translation}</p>
              <p className="text-xs text-gray-400">{lesson.finalVerification.guideLine}</p>

              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="text-gray-400 text-left">
                      <th className="pb-1 pr-2">破譯時取得的證據</th>
                      <th className="pb-1 pr-2">白話文中的表達</th>
                      <th className="pb-1">關係</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lesson.finalVerification.comparisonRows.map((row, i) => (
                      <tr key={i} className="border-t border-gray-100">
                        <td className="py-1.5 pr-2 text-gray-700">{row.decodedEvidence}</td>
                        <td className="py-1.5 pr-2 text-gray-700">{row.vernacularExpression}</td>
                        <td className="py-1.5 text-gray-400">{row.relationship}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-emerald-50 rounded-xl p-4">
                <p className="text-sm font-bold text-emerald-700">{lesson.finalVerification.completionFeedback}</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <Link to="/guwen" className="text-teal-600 font-medium text-sm">
              回古文破譯家
            </Link>
            {confirmReset ? (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">確定重來？</span>
                <button
                  type="button"
                  onClick={handleResetProgress}
                  className="bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg px-2.5 py-1"
                >
                  確定重來
                </button>
                <button type="button" onClick={() => setConfirmReset(false)} className="text-gray-400 hover:text-gray-600 text-xs">
                  取消
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="text-xs text-gray-400 hover:text-gray-600 underline"
              >
                🔄 重新開始這篇
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
