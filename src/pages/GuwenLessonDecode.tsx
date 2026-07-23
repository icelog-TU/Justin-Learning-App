import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAppDataContext } from '../lib/AppDataContext';
import { findGuwenLesson, type GuwenLesson, type LessonStep, type RevealStep, type SequenceCard } from '../data/guwenLesson';

/** Every step type except RevealStep has a real question/options/correctIndex/retryHint to grade against. */
type GradedStep = Exclude<LessonStep, RevealStep>;
import { speak, speakSequence, pauseSpeech, resumeSpeech, cancelSpeech } from '../lib/speech';
import { playSuccessChime, playCoinSound, playStarSound, playRollTickSound } from '../lib/sound';
import {
  COIN_PER_GUWEN_WORD,
  STAR_PER_GUWEN_WORD,
  GUWEN_TEXT_COMPLETE_BONUS_COINS,
  GUWEN_TEXT_COMPLETE_BONUS_STARS,
  GUWEN_REDO_REWARD_MULTIPLIER,
} from '../lib/rewards';

type Phase = 'intro' | 'listening' | 'steps' | 'complete';
/** Which closing screen is showing. Not every lesson has all three (see closingStepsList below). */
type ClosingStageKind = 'ordering' | 'causal' | 'multiselect';

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
  } else if (step.type === 'reveal' && step.keys) {
    step.keys.forEach((k) => {
      lines.push(k.code, k.decodedEvidence);
    });
  }
  if (step.type !== 'reveal' && step.question !== step.intro) lines.push(step.question);
  return lines.filter(Boolean);
}

/** Highlights every 「...」-quoted span in `text` (quotes included) — used for a clue's vernacular gloss,
 * where the quoted span is the classical word/phrase the child just decoded, kept visible inside the
 * modern-Chinese sentence so it's easy to spot at a glance, matching how the classical text itself
 * highlights the same word via `highlightPhrase`. */
function highlightQuoted(text: string): ReactNode[] {
  const parts = text.split(/(「[^」]*」)/);
  return parts.map((part, i) =>
    part.startsWith('「') && part.endsWith('」') ? (
      <span key={i} className="text-indigo-600 font-bold">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
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
  // Some lessons (刻舟求劍) have up to 3 closing screens — event ordering, then a causal-chain summary, then
  // an evidence multi-select — shown after every word/phrase step but before the final translation unlocks.
  // Each screen is its own independent, optional field on the lesson (王戎 only needs the multi-select), so
  // this list is built by checking each field's presence individually, in that fixed order. Lessons with none
  // (司馬光) get an empty list here, so `allClosingSolved` is vacuously true and behavior is unchanged from
  // before this feature existed.
  const closingStepsList: { kind: ClosingStageKind; id: string }[] = [
    ...(lesson?.sequenceOrderingClosing ? [{ kind: 'ordering' as const, id: lesson.sequenceOrderingClosing.id }] : []),
    ...(lesson?.causalChainClosing ? [{ kind: 'causal' as const, id: lesson.causalChainClosing.id }] : []),
    ...(lesson?.evidenceMultiSelectClosing ? [{ kind: 'multiselect' as const, id: lesson.evidenceMultiSelectClosing.id }] : []),
  ];
  const allClosingSolved = closingStepsList.every((c) => solvedIds.has(c.id));
  const readyForComplete = allStepsSolved && allClosingSolved;
  // A redo (this text has been fully completed at least once before, surviving any resets) still pays out,
  // just at a reduced rate — the very first clear stays the biggest payday, but replaying isn't worthless.
  // This is captured once per run (mount, or an explicit reset — see handleResetProgress), NOT derived fresh
  // every render: `progress.timesCompleted` itself gets bumped by *this* run's own completeGuwenText call,
  // so a reactive `(progress?.timesCompleted ?? 0) > 0` would flip true the instant a first-ever completion
  // lands, wrongly showing that same completion's own summary screen at the discounted redo rate.
  const [isRedo, setIsRedo] = useState(() => (progress?.timesCompleted ?? 0) > 0);
  const guwenCoinAmount = isRedo ? Math.round(COIN_PER_GUWEN_WORD * GUWEN_REDO_REWARD_MULTIPLIER) : COIN_PER_GUWEN_WORD;
  const guwenStarAmount = isRedo ? Math.round(STAR_PER_GUWEN_WORD * GUWEN_REDO_REWARD_MULTIPLIER) : STAR_PER_GUWEN_WORD;
  const completionCoinBonus = isRedo
    ? Math.round(GUWEN_TEXT_COMPLETE_BONUS_COINS * GUWEN_REDO_REWARD_MULTIPLIER)
    : GUWEN_TEXT_COMPLETE_BONUS_COINS;
  const completionStarBonus = isRedo
    ? Math.round(GUWEN_TEXT_COMPLETE_BONUS_STARS * GUWEN_REDO_REWARD_MULTIPLIER)
    : GUWEN_TEXT_COMPLETE_BONUS_STARS;

  const [phase, setPhase] = useState<Phase>(() => {
    if (alreadyComplete || readyForComplete) return 'complete';
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

  // Closing-sequence state (刻舟求劍-style lessons only). Which of the 3 screens is showing is its own state
  // — resumed once at mount from solvedIds, then advanced explicitly by each screen's own "continue" click —
  // for the same reason `activeStepId` above isn't derived live: reacting to solvedIds directly would jump
  // the screen the instant a correct answer lands, before the child sees the praise/explanation for it.
  const [closingStage, setClosingStage] = useState<ClosingStageKind>(() => {
    const firstUnsolved = closingStepsList.find((c) => !solvedIds.has(c.id));
    return firstUnsolved?.kind ?? 'multiselect';
  });
  const [orderingArrangement, setOrderingArrangement] = useState<string[]>(() =>
    lesson?.sequenceOrderingClosing ? lesson.sequenceOrderingClosing.cards.map((c) => c.id) : [],
  );
  const [orderingWrong, setOrderingWrong] = useState(false);
  const [orderingSolved, setOrderingSolved] = useState(() =>
    Boolean(lesson?.sequenceOrderingClosing && solvedIds.has(lesson.sequenceOrderingClosing.id)),
  );
  const [multiSelectChoice, setMultiSelectChoice] = useState<Set<number>>(new Set());
  const [multiSelectWrong, setMultiSelectWrong] = useState(false);
  const [multiSelectSolved, setMultiSelectSolved] = useState(() =>
    Boolean(lesson?.evidenceMultiSelectClosing && solvedIds.has(lesson.evidenceMultiSelectClosing.id)),
  );

  /** Advances past `fromKind` to whichever closing screen (if any) comes next in this lesson's actual
   * closingStepsList — not a hardcoded 'ordering'→'causal'→'multiselect' chain, since a lesson may only have
   * a subset of the three (王戎 has just the multi-select). Falls through to completion when there's nothing
   * left, so this same function works whether `fromKind` is the middle or the last screen present. */
  function advanceClosingStage(fromKind: ClosingStageKind) {
    const idx = closingStepsList.findIndex((c) => c.kind === fromKind);
    const next = closingStepsList[idx + 1];
    if (next) {
      setClosingStage(next.kind);
    } else {
      handleFinishClosingSequence();
    }
  }

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
  // every step (word/phrase steps *and* any closing sequence) was ALREADY solved before this page mounted,
  // but that button was never clicked (see the `allStepsSolved` comment above) — e.g. they left via the back
  // link right after the last correct answer. This must check the state present at *mount*, not react live
  // to `readyForComplete` on every render: a lesson with a closing sequence reaches `readyForComplete` the
  // instant the child finishes the multi-select through the completely normal, intended flow (the last
  // `recordGuwenWord` call updates `solvedIds` right there in the same session) — a reactive effect fired at
  // that exact moment, jumping straight to phase 'complete' before the child ever saw the multi-select's own
  // correct-feedback screen or clicked its own "開啟白話驗證卷軸" button. Caught via Playwright: solving the
  // multi-select correctly showed the app-wide completion-bonus celebration immediately, with no multi-select
  // feedback screen in between. `useRef`'s initializer argument is only evaluated on the first render, so
  // this ref permanently freezes exactly the "was it already fully done when I opened this page" snapshot.
  const wasReadyForCompleteOnMountRef = useRef(readyForComplete);
  const missedCompletionAwardedRef = useRef(false);
  useEffect(() => {
    if (missedCompletionAwardedRef.current) return;
    if (!lesson || alreadyComplete || !wasReadyForCompleteOnMountRef.current) return;
    missedCompletionAwardedRef.current = true;
    completeGuwenText(lesson.id);
    reward(completionCoinBonus, completionStarBonus, { big: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  const earnedCoins = solvedIds.size * guwenCoinAmount + (alreadyComplete ? completionCoinBonus : 0);
  const earnedStars = solvedIds.size * guwenStarAmount + (alreadyComplete ? completionStarBonus : 0);
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
    reward(guwenCoinAmount, guwenStarAmount);
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
    if (!currentStep || feedback === 'correct' || currentStep.type === 'reveal') return;
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
    if (next) {
      setActiveStepId(next.id);
      return;
    }
    // No regular word/phrase step left. `currentStep` is derived from `activeStepId`, not recomputed fresh,
    // so it must be cleared explicitly here — otherwise it would keep pointing at the just-solved last step
    // forever, and the closing-sequence / complete-phase branches below (which key off `!currentStep`) would
    // never take over.
    setActiveStepId(undefined);
    if (closingStepsList.length > 0 && !allClosingSolved) return; // hand off to the closing-sequence screens
    completeGuwenText(lesson!.id);
    reward(completionCoinBonus, completionStarBonus, { big: true });
    setVerificationOpen(false);
    setPhase('complete');
  }

  function moveOrderingCard(index: number, direction: -1 | 1) {
    setOrderingArrangement((cur) => {
      const next = [...cur];
      const target = index + direction;
      if (target < 0 || target >= next.length) return cur;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setOrderingWrong(false);
  }

  function handleSubmitOrdering() {
    const closing = lesson!.sequenceOrderingClosing!;
    const isCorrect =
      orderingArrangement.length === closing.correctOrder.length &&
      orderingArrangement.every((id, i) => id === closing.correctOrder[i]);
    if (!isCorrect) {
      setOrderingWrong(true);
      return;
    }
    recordGuwenWord(lesson!.id, closing.id);
    reward(guwenCoinAmount, guwenStarAmount);
    playSuccessChime();
    setOrderingWrong(false);
    setOrderingSolved(true);
  }

  function handleContinueFromOrdering() {
    advanceClosingStage('ordering');
  }

  function handleContinueFromCausalChain() {
    const closing = lesson!.causalChainClosing!;
    recordGuwenWord(lesson!.id, closing.id);
    reward(guwenCoinAmount, guwenStarAmount);
    playSuccessChime();
    advanceClosingStage('causal');
  }

  function toggleMultiSelectOption(i: number) {
    if (multiSelectSolved) return;
    setMultiSelectChoice((cur) => {
      const next = new Set(cur);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
    setMultiSelectWrong(false);
  }

  function handleSubmitMultiSelect() {
    const closing = lesson!.evidenceMultiSelectClosing!;
    const isCorrect = closing.options.every((opt, i) => opt.correct === multiSelectChoice.has(i));
    if (!isCorrect) {
      setMultiSelectWrong(true);
      return;
    }
    recordGuwenWord(lesson!.id, closing.id);
    reward(guwenCoinAmount, guwenStarAmount);
    playSuccessChime();
    setMultiSelectWrong(false);
    setMultiSelectSolved(true);
  }

  function handleFinishClosingSequence() {
    completeGuwenText(lesson!.id);
    reward(completionCoinBonus, completionStarBonus, { big: true });
    setVerificationOpen(false);
    setPhase('complete');
  }

  function handleResetProgress() {
    resetGuwenText(lesson!.id);
    // resetGuwenText doesn't touch timesCompleted (that's the point — it's meant to survive resets), so
    // re-reading it here is exactly "how many times was this cleared before *this* fresh attempt begins."
    setIsRedo((progress?.timesCompleted ?? 0) > 0);
    stopStepSpeech();
    setConfirmReset(false);
    setFeedback(null);
    setWrongIndex(null);
    setReviewStepId(null);
    setIsPlaying(false);
    setIsPaused(false);
    setVerificationOpen(false);
    setActiveStepId(lesson ? findCurrentStep(lesson, new Set())?.id : undefined);
    setClosingStage(closingStepsList[0]?.kind ?? 'ordering');
    setOrderingArrangement(lesson?.sequenceOrderingClosing ? lesson.sequenceOrderingClosing.cards.map((c) => c.id) : []);
    setOrderingWrong(false);
    setOrderingSolved(false);
    setMultiSelectChoice(new Set());
    setMultiSelectWrong(false);
    setMultiSelectSolved(false);
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
          <p className="text-xs text-gray-500">已破解為：{highlightQuoted(clue.unlockedMeaning)}</p>
        </div>
        <p className="text-[11px] text-gray-300 pl-1">出處：{clue.source}</p>
      </div>
    );
  }

  function renderOptions(step: GradedStep, readOnly: boolean) {
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

  function renderSequenceOrdering() {
    const closing = lesson!.sequenceOrderingClosing!;
    const cardsInOrder = orderingArrangement
      .map((id) => closing.cards.find((c) => c.id === id))
      .filter((c): c is SequenceCard => Boolean(c));
    return (
      <div className="bg-white rounded-2xl shadow p-5 space-y-4">
        <h3 className="font-bold text-gray-800">{closing.title}</h3>
        <p className="text-sm text-gray-600">{closing.intro}</p>
        <div className="space-y-2">
          {cardsInOrder.map((card, i) => (
            <div key={card.id} className="flex items-center gap-2 rounded-xl border-2 border-gray-200 bg-gray-50 px-3 py-2">
              <span className="font-bold text-gray-400 w-5 text-center shrink-0">{i + 1}</span>
              <p className="flex-1 text-sm text-gray-800">{card.text}</p>
              {!orderingSolved && (
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button
                    type="button"
                    disabled={i === 0}
                    onClick={() => moveOrderingCard(i, -1)}
                    aria-label="上移"
                    className="disabled:opacity-20 text-indigo-600 leading-none text-lg"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    disabled={i === cardsInOrder.length - 1}
                    onClick={() => moveOrderingCard(i, 1)}
                    aria-label="下移"
                    className="disabled:opacity-20 text-indigo-600 leading-none text-lg"
                  >
                    ▼
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        {!orderingSolved && orderingWrong && <p className="text-sm text-red-500 text-center">{closing.retryHint}</p>}
        {!orderingSolved && (
          <button
            type="button"
            onClick={handleSubmitOrdering}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl py-2.5"
          >
            送出順序
          </button>
        )}
        {orderingSolved && (
          <div className="bg-emerald-50 rounded-xl p-4 space-y-3">
            <p className="font-bold text-emerald-700">{closing.correctFeedback}</p>
            <button
              type="button"
              onClick={handleContinueFromOrdering}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl py-2.5"
            >
              繼續 →
            </button>
          </div>
        )}
      </div>
    );
  }

  function renderCausalChain() {
    const closing = lesson!.causalChainClosing!;
    return (
      <div className="bg-white rounded-2xl shadow p-5 space-y-4">
        <h3 className="font-bold text-gray-800">{closing.title}</h3>
        <p className="text-xs text-gray-400">{closing.displayNote}</p>
        <div className="space-y-1">
          {closing.nodes.map((node, i) => (
            <div key={i}>
              <p className="text-sm text-gray-800 bg-gray-50 rounded-lg px-3 py-2">{node}</p>
              {i < closing.nodes.length - 1 && <p className="text-center text-gray-300">↓</p>}
            </div>
          ))}
        </div>
        <div className="bg-amber-50 rounded-xl p-4">
          <p className="text-sm font-bold text-amber-700 whitespace-pre-line">{closing.coreSummary}</p>
        </div>
        {closing.evidenceBoundary && <p className="text-xs text-gray-400">{closing.evidenceBoundary}</p>}
        <button
          type="button"
          onClick={handleContinueFromCausalChain}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl py-2.5"
        >
          {closing.continueButtonLabel}
        </button>
      </div>
    );
  }

  function renderEvidenceMultiSelect() {
    const closing = lesson!.evidenceMultiSelectClosing!;
    return (
      <div className="bg-white rounded-2xl shadow p-5 space-y-4">
        <h3 className="font-bold text-gray-800">{closing.title}</h3>
        <p className="text-sm text-gray-600">{closing.intro}</p>
        <div className="space-y-2">
          {closing.options.map((opt, i) => (
            <label
              key={i}
              className={`flex items-start gap-2 rounded-xl border-2 px-3 py-2 ${
                multiSelectSolved ? 'cursor-default' : 'cursor-pointer'
              } ${multiSelectChoice.has(i) ? 'bg-indigo-50 border-indigo-300' : 'bg-gray-50 border-gray-200'}`}
            >
              <input
                type="checkbox"
                checked={multiSelectChoice.has(i)}
                disabled={multiSelectSolved}
                onChange={() => toggleMultiSelectOption(i)}
                className="mt-1"
              />
              <span className="text-sm text-gray-800">{opt.text}</span>
            </label>
          ))}
        </div>
        {!multiSelectSolved && multiSelectWrong && <p className="text-sm text-red-500 text-center">{closing.retryHint}</p>}
        {!multiSelectSolved && (
          <button
            type="button"
            onClick={handleSubmitMultiSelect}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl py-2.5"
          >
            提交判斷
          </button>
        )}
        {multiSelectSolved && (
          <div className="bg-emerald-50 rounded-xl p-4 space-y-3">
            <p className="font-bold text-emerald-700 whitespace-pre-line">{closing.correctFeedback}</p>
            <div className="space-y-1">
              {closing.options.map((opt, i) => (
                <p key={i} className="text-xs text-gray-600">
                  {opt.correct ? '✓' : '✗'} {opt.text} — {opt.detail}
                </p>
              ))}
            </div>
            <p className="text-xs text-gray-500 italic">{closing.finalNote}</p>
            <button
              type="button"
              onClick={handleFinishClosingSequence}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl py-2.5"
            >
              開啟白話驗證卷軸
            </button>
          </div>
        )}
      </div>
    );
  }

  function renderClosingSequence() {
    if (closingStepsList.length === 0) return null;
    if (closingStage === 'ordering') return renderSequenceOrdering();
    if (closingStage === 'causal') return renderCausalChain();
    return renderEvidenceMultiSelect();
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
        {reviewStep.type === 'reveal' && reviewStep.keys && renderKeyTable(reviewStep.keys)}
        {reviewStep.type !== 'reveal' && (
          <>
            <p className="text-sm font-semibold text-gray-700">{reviewStep.question}</p>
            {renderOptions(reviewStep, true)}
          </>
        )}
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
            {currentStep.type === 'reveal' && currentStep.keys && renderKeyTable(currentStep.keys)}

            {currentStep.type !== 'reveal' && (
              <>
                <p className="text-sm font-semibold text-center text-gray-700">{currentStep.question}</p>
                {feedback !== 'correct' && renderOptions(currentStep, false)}
                {wrongIndex !== null && feedback !== 'correct' && (
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-center text-sm text-red-500">{currentStep.retryHint}</p>
                    <button
                      type="button"
                      onClick={() => speak(currentStep.retryHint)}
                      aria-label="聽這段提示"
                      className="text-red-400 shrink-0"
                    >
                      🔊
                    </button>
                  </div>
                )}
              </>
            )}

            {currentStep.type === 'reveal' && feedback !== 'correct' && (
              <button
                type="button"
                onClick={() => markStepSolved(currentStep)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl py-2.5"
              >
                {currentStep.continueLabel ?? '揭曉這句話 →'}
              </button>
            )}

            {feedback === 'correct' && celebration && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl p-5 space-y-3 text-center">
                <p className="text-lg font-bold text-orange-700">
                  {celebration.stage === 'settled' ? '🎉 太棒了！' : '✨ 答對了！'}
                </p>
                <div className="flex items-center justify-center gap-6 text-2xl font-extrabold tabular-nums">
                  <span className="text-orange-600">
                    🪙 {Math.round((celebration.tick / CELEBRATION_TICKS) * guwenCoinAmount)}
                  </span>
                  <span className="text-amber-500">
                    ⭐ {Math.round((celebration.tick / CELEBRATION_TICKS) * guwenStarAmount)}
                  </span>
                </div>
                {celebration.stage === 'settled' && (
                  <p className="text-sm text-orange-600 font-semibold">
                    哇，得到 {guwenCoinAmount} 金幣、{guwenStarAmount} 星星！
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
                {solvedIds.size < totalSteps
                  ? '下一道密碼 →'
                  : closingStepsList.length > 0
                    ? '繼續 → 最後關卡'
                    : '🎉 完成！看看整篇文章'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Deliberately gated on `phase`/`currentStep` (both stable, changed only by explicit user action),
          never on `allClosingSolved` — that flips true the instant the multi-select's own recordGuwenWord
          call lands, which would otherwise yank this whole block away (including the multi-select's own
          correct-feedback screen) before the child ever saw it or clicked "開啟白話驗證卷軸" themselves. */}
      {phase === 'steps' && !currentStep && allStepsSolved && closingStepsList.length > 0 && (
        <div className="space-y-4">
          {renderPassage()}
          {renderClosingSequence()}
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
                <span className="text-gray-500">確定重來？（重來一樣有獎勵，約原本的六成）</span>
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
