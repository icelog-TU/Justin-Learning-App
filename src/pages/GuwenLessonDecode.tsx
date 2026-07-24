import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAppDataContext } from '../lib/AppDataContext';
import {
  findGuwenLesson,
  totalGuwenLessonItems,
  type GuwenLesson,
  type LessonStep,
  type RevealStep,
  type SequenceCard,
} from '../data/guwenLesson';

/** Every step type except RevealStep has a real question/options/correctIndex/retryHint to grade against. */
type GradedStep = Exclude<LessonStep, RevealStep>;
import { speak, speakSequence, pauseSpeech, resumeSpeech, cancelSpeech } from '../lib/speech';
import { playSuccessChime, playCoinSound, playStarSound, playRollTickSound, playGuwenLessonCompleteFanfare, playTwinkleSound } from '../lib/sound';
import {
  COIN_PER_GUWEN_WORD,
  STAR_PER_GUWEN_WORD,
  GUWEN_TEXT_COMPLETE_BONUS_COINS,
  GUWEN_TEXT_COMPLETE_BONUS_STARS,
  guwenRedoMultiplier,
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

/** Spoken once, right when the whole lesson finishes — the biggest moment in this feature, so it gets its
 * own grand line rather than reusing one of the per-step PRAISE_LINES. */
const LESSON_COMPLETE_PRAISE_LINE = '恭喜你，把整篇古文都破解成功了！讓我們一起把整段古文，還有你自己拼出來的故事，再讀一次。';

const FIREWORK_EMOJI = ['🎉', '🎆', '🎇', '✨', '⭐', '🌟', '🎊'];
const FIREWORK_WAVE_COUNT = 6;
const FIREWORK_WAVE_GAP_S = 0.8;
const FIREWORK_PARTICLE_DURATION_S = 1.3;
/** Total time the overlay stays mounted — last wave's start + its own animation + a little settle time. */
const FIREWORK_TOTAL_MS = (FIREWORK_WAVE_COUNT - 1) * FIREWORK_WAVE_GAP_S * 1000 + FIREWORK_PARTICLE_DURATION_S * 1000 + 700;

interface FireworkParticle {
  id: number;
  emoji: string;
  left: string;
  top: string;
  tx: number;
  ty: number;
  rot: number;
  delay: number;
}

/** Several staggered "waves" of particles across a few seconds — reuses the same `burst-particle` keyframe
 * as the app-wide reward burst (see CelebrationOverlay.tsx), just spread over a much longer, repeated
 * timeline and launched from random spots across the top of the screen instead of one fixed point, so it
 * reads as sustained fireworks rather than one quick burst. */
function buildFireworkParticles(): FireworkParticle[] {
  const particles: FireworkParticle[] = [];
  let id = 0;
  for (let wave = 0; wave < FIREWORK_WAVE_COUNT; wave++) {
    const waveDelay = wave * FIREWORK_WAVE_GAP_S;
    const count = 7 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      particles.push({
        id: id++,
        emoji: FIREWORK_EMOJI[Math.floor(Math.random() * FIREWORK_EMOJI.length)],
        left: `${5 + Math.random() * 90}%`,
        top: `${10 + Math.random() * 35}%`,
        tx: (Math.random() - 0.5) * 320,
        ty: -(100 + Math.random() * 220),
        rot: (Math.random() - 0.5) * 480,
        delay: waveDelay + Math.random() * 0.3,
      });
    }
  }
  return particles;
}

/** The full auto-play script for a step, as separate lines (queued with speakSequence so each one fully
 * finishes before the next starts). Clues/keys are part of the auto-play here — the child needs to hear all
 * the evidence before the question makes sense, mirroring the guwen-decoder skill's 'pattern' puzzle rule. */
function stepAutoPlayLines(step: LessonStep): string[] {
  const lines: string[] = [step.targetSentence, step.intro];
  if (step.type === 'evidence') {
    step.clues.forEach((c) => lines.push(c.text, c.unlockedMeaning ?? ''));
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
  // A redo (this text has been fully completed at least once before, surviving any resets) still pays out —
  // redoing is unlimited, never blocked — but at a stepped-down rate per attempt number (see
  // GUWEN_REDO_REWARD_TIERS): 100% the first time, 60%/30%/10% for the next three redos, then 0 from the
  // 5th attempt on, so grinding the same text stops paying out while still being replayable for practice.
  // This is captured once per run (mount, or an explicit reset — see handleResetProgress), NOT derived fresh
  // every render: `progress.timesCompleted` itself gets bumped by *this* run's own completeGuwenText call,
  // so a reactive read would flip to the next tier down the instant a completion lands, wrongly discounting
  // that same completion's own summary screen.
  const [attemptMultiplier, setAttemptMultiplier] = useState(() => guwenRedoMultiplier(progress?.timesCompleted ?? 0));
  const guwenCoinAmount = Math.round(COIN_PER_GUWEN_WORD * attemptMultiplier);
  const guwenStarAmount = Math.round(STAR_PER_GUWEN_WORD * attemptMultiplier);
  const completionCoinBonus = Math.round(GUWEN_TEXT_COMPLETE_BONUS_COINS * attemptMultiplier);
  const completionStarBonus = Math.round(GUWEN_TEXT_COMPLETE_BONUS_STARS * attemptMultiplier);

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
  // The grand, sustained "you finished the whole lesson" celebration — distinct from (and much bigger than)
  // the per-step roll-up above. Fireworks particles are pre-built for the whole timeline up front (see
  // buildFireworkParticles) rather than pushed wave-by-wave into state, so a single unmount/cleanup covers
  // the entire multi-second sequence.
  const [showLessonCelebration, setShowLessonCelebration] = useState(false);
  const [fireworkParticles, setFireworkParticles] = useState<FireworkParticle[]>([]);
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

  // The grand completion celebration — fireworks, a bright fanfare, and narration reading out the full
  // classical text plus the child's own reconstructed 破譯稿 lines. Fires exactly once, only for a
  // completion that happens *during this visit* (freshly finishing the last step/closing screen, or the
  // missed-completion retroactive grant right above) — never when simply reopening a lesson finished in a
  // past session, which would make the fanfare feel like it fires at random on every revisit. Frozen at
  // mount for the same reason `wasReadyForCompleteOnMountRef` is above: `alreadyComplete` itself flips to
  // true reactively the moment `completeGuwenText` lands, so checking it live inside the effect would always
  // see "already complete" and never fire.
  const wasAlreadyCompleteOnMountRef = useRef(alreadyComplete);
  const lessonCelebrationFiredRef = useRef(false);
  useEffect(() => {
    if (phase !== 'complete' || !lesson) return;
    if (wasAlreadyCompleteOnMountRef.current || lessonCelebrationFiredRef.current) return;
    lessonCelebrationFiredRef.current = true;
    setFireworkParticles(buildFireworkParticles());
    setShowLessonCelebration(true);
    playGuwenLessonCompleteFanfare();
    const twinkleTimers: number[] = [];
    for (let wave = 1; wave < FIREWORK_WAVE_COUNT; wave++) {
      twinkleTimers.push(window.setTimeout(() => playTwinkleSound(), wave * FIREWORK_WAVE_GAP_S * 1000));
    }
    const finalDraftLines = lesson.steps.filter((s) => s.finalDraftLine).map((s) => s.finalDraftLine!);
    speakSequence([LESSON_COMPLETE_PRAISE_LINE, lesson.fullText, ...finalDraftLines]);
    const hideTimer = window.setTimeout(() => setShowLessonCelebration(false), FIREWORK_TOTAL_MS);
    return () => {
      window.clearTimeout(hideTimer);
      twinkleTimers.forEach((id) => window.clearTimeout(id));
      cancelSpeech();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    if (phase !== 'complete' || !lesson || !verificationOpen) return;
    const timer = window.setTimeout(() => {
      setPlaybackId('translation');
      setPlaybackPaused(false);
      // Reads the translation, then the completionFeedback encouragement line right after it — both are
      // already shown together on the open scroll, so they read as one continuous moment rather than the
      // child having to separately notice and tap a second 🔊 button for the encouragement paragraph.
      speakSequence(
        [lesson.finalVerification.translation, lesson.finalVerification.completionFeedback],
        () => setPlaybackId((cur) => (cur === 'translation' ? null : cur)),
      );
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

  // Auto-plays the "what am I supposed to do here" line for whichever closing screen is showing — the
  // sequence-ordering intro, the causal-chain displayNote, or the multi-select intro — every time
  // `closingStage` changes (including the very first time `currentStep` becomes undefined and the closing
  // block takes over). Per-card/node/option text is deliberately NOT auto-played here, only available via
  // its own 🔊 button — matching how a step's own corpus/pattern options are tap-to-listen-only, not part
  // of the auto-play (see "Puzzle types" history in this file).
  useEffect(() => {
    if (phase !== 'steps' || currentStep || !allStepsSolved || closingStepsList.length === 0) return;
    const line =
      closingStage === 'ordering'
        ? lesson?.sequenceOrderingClosing?.intro
        : closingStage === 'causal'
          ? lesson?.causalChainClosing?.displayNote
          : lesson?.evidenceMultiSelectClosing?.intro;
    if (!line) return;
    const id = `closing-intro-${closingStage}`;
    setPlaybackId(id);
    setPlaybackPaused(false);
    speak(line, () => setPlaybackId((cur) => (cur === id ? null : cur)));
    return () => {
      cancelSpeech();
      setPlaybackId((cur) => (cur === id ? null : cur));
      setPlaybackPaused(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentStep, allStepsSolved, closingStage]);

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
  // Word steps + every closing screen this lesson has — the number a child actually expects when they see
  // "已破解 X/Y" (they count the closing screens as things to finish too), unlike `totalSteps` above, which
  // stays word-steps-only on purpose for the "is this the last word step" button-label decision below.
  const totalGradableItems = totalGuwenLessonItems(lesson);
  const earnedCoins = solvedIds.size * guwenCoinAmount + (alreadyComplete ? completionCoinBonus : 0);
  const earnedStars = solvedIds.size * guwenStarAmount + (alreadyComplete ? completionStarBonus : 0);
  const reviewStep = reviewStepId ? lesson.steps.find((s) => s.id === reviewStepId) : undefined;

  /** One circle per word/phrase step, PLUS one more for each closing screen this lesson actually has
   * (ordering/causal/multiselect) — the closing screens are their own locks to unlock too, not something
   * that happens "outside" the step chain, so they need to show up in the same row. Closing chips are
   * display-only (no click-to-review — the closing screens don't have a review-panel renderer the way
   * graded steps do), but otherwise follow the exact same solved/current/locked visual rules. */
  function renderStepChips() {
    const totalWordSteps = lesson!.steps.length;
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
        {closingStepsList.map((c, i) => {
          const solved = solvedIds.has(c.id);
          const isCurrent = !currentStep && allStepsSolved && closingStage === c.kind;
          const label = totalWordSteps + i + 1;
          return (
            <span
              key={c.id}
              aria-label={`第 ${label} 關（收尾任務）`}
              className={`w-9 h-9 flex items-center justify-center rounded-full font-bold text-sm border-2 ${
                solved
                  ? 'bg-amber-100 border-amber-400 text-amber-700'
                  : isCurrent
                    ? 'bg-indigo-100 border-indigo-500 text-indigo-700'
                    : 'bg-gray-50 border-gray-200 text-gray-300'
              }`}
            >
              {solved || isCurrent ? label : '🔒'}
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
    // Auto-plays the encouragement line the instant the child gets the order right — called directly here
    // (a real user action), not via a useEffect keyed on orderingSolved, because that state starts `true`
    // on every remount of an already-solved lesson (see its useState initializer above) and would replay
    // the encouragement on every reopen instead of only right after a fresh solve.
    speak(closing.correctFeedback);
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
    // Called directly here (a real user action), not via a useEffect keyed on multiSelectSolved — same
    // reload-replay pitfall as handleSubmitOrdering's identical comment above: that state's initializer
    // already returns true on mount for an already-solved lesson.
    speak(closing.correctFeedback);
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
    setAttemptMultiplier(guwenRedoMultiplier(progress?.timesCompleted ?? 0));
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

  function renderClue(clue: { text: string; highlight: string; unlockedMeaning?: string; source: string }, i: number) {
    return (
      <div key={i} className="rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 space-y-1.5">
        <div className="flex items-start gap-2">
          <button type="button" onClick={() => speak(clue.text)} aria-label="聽這句古文線索" className="text-sky-500 shrink-0">
            🔊
          </button>
          <p className="text-gray-800 font-medium">{highlightPhrase(clue.text, clue.highlight)}</p>
        </div>
        {/* Some clues deliberately omit unlockedMeaning — the child is meant to compare bare clues and
            induce the pattern themselves, so translating one here would hand over the answer. */}
        {clue.unlockedMeaning && (
          <div className="flex items-start gap-2 pl-1">
            <button
              type="button"
              onClick={() => speak(clue.unlockedMeaning!)}
              aria-label="聽這句白話"
              className="text-sky-500 shrink-0 text-xs"
            >
              🔊
            </button>
            <p className="text-xs text-gray-500">已破解為：{highlightQuoted(clue.unlockedMeaning)}</p>
          </div>
        )}
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
        <div className="flex items-start gap-2">
          <h3 className="font-bold text-gray-800 flex-1">{closing.title}</h3>
          <button
            type="button"
            onClick={() => togglePlayback(`closing-intro-ordering`, closing.intro)}
            aria-label="聽這段說明"
            className="text-sky-500 shrink-0"
          >
            {playbackLabel(`closing-intro-ordering`, '🔊', '⏸', '▶️')}
          </button>
        </div>
        <p className="text-sm text-gray-600">{closing.intro}</p>
        <div className="space-y-2">
          {cardsInOrder.map((card, i) => (
            <div key={card.id} className="flex items-center gap-2 rounded-xl border-2 border-gray-200 bg-gray-50 px-3 py-2">
              <span className="font-bold text-gray-400 w-5 text-center shrink-0">{i + 1}</span>
              <button type="button" onClick={() => speak(card.text)} aria-label="聽這張畫面" className="text-sky-500 shrink-0">
                🔊
              </button>
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
            <div className="flex items-start gap-2">
              <p className="font-bold text-emerald-700 flex-1">{closing.correctFeedback}</p>
              <button
                type="button"
                onClick={() => speak(closing.correctFeedback)}
                aria-label="聽這段回饋"
                className="text-emerald-600 shrink-0"
              >
                🔊
              </button>
            </div>
            {closing.explanation && (
              <div className="flex items-start gap-2">
                <p className="text-xs text-emerald-700 whitespace-pre-line flex-1">{closing.explanation}</p>
                <button
                  type="button"
                  onClick={() => togglePlayback(`closing-explanation-${closing.id}`, closing.explanation!.replace(/\n+/g, ' '))}
                  aria-label="聽這段說明"
                  className="text-emerald-600 shrink-0"
                >
                  {playbackLabel(`closing-explanation-${closing.id}`, '🔊', '⏸', '▶️')}
                </button>
              </div>
            )}
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
        <div className="flex items-start gap-2">
          <h3 className="font-bold text-gray-800 flex-1">{closing.title}</h3>
          <button
            type="button"
            onClick={() => togglePlayback(`closing-intro-causal`, closing.displayNote)}
            aria-label="聽這段說明"
            className="text-sky-500 shrink-0"
          >
            {playbackLabel(`closing-intro-causal`, '🔊', '⏸', '▶️')}
          </button>
        </div>
        <p className="text-xs text-gray-400">{closing.displayNote}</p>
        <div className="space-y-1">
          {closing.nodes.map((node, i) => (
            <div key={i}>
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                <button type="button" onClick={() => speak(node)} aria-label="聽這個階段" className="text-sky-500 shrink-0">
                  🔊
                </button>
                <p className="flex-1 text-sm text-gray-800">{node}</p>
              </div>
              {i < closing.nodes.length - 1 && <p className="text-center text-gray-300">↓</p>}
            </div>
          ))}
        </div>
        <div className="bg-amber-50 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <p className="text-sm font-bold text-amber-700 whitespace-pre-line flex-1">{closing.coreSummary}</p>
            <button
              type="button"
              onClick={() => togglePlayback(`closing-summary-${closing.id}`, closing.coreSummary)}
              aria-label="聽這段結論"
              className="text-amber-600 shrink-0"
            >
              {playbackLabel(`closing-summary-${closing.id}`, '🔊', '⏸', '▶️')}
            </button>
          </div>
        </div>
        {closing.evidenceBoundary && (
          <div className="flex items-start gap-2">
            <p className="text-xs text-gray-400 flex-1">{closing.evidenceBoundary}</p>
            <button
              type="button"
              onClick={() => speak(closing.evidenceBoundary!)}
              aria-label="聽這段證據邊界"
              className="text-gray-400 shrink-0"
            >
              🔊
            </button>
          </div>
        )}
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
        <div className="flex items-start gap-2">
          <h3 className="font-bold text-gray-800 flex-1">{closing.title}</h3>
          <button
            type="button"
            onClick={() => togglePlayback(`closing-intro-multiselect`, closing.intro)}
            aria-label="聽這段說明"
            className="text-sky-500 shrink-0"
          >
            {playbackLabel(`closing-intro-multiselect`, '🔊', '⏸', '▶️')}
          </button>
        </div>
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
              <span className="text-sm text-gray-800 flex-1">{opt.text}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  speak(opt.text);
                }}
                aria-label="聽這個選項"
                className="text-sky-500 shrink-0"
              >
                🔊
              </button>
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
            <div className="flex items-start gap-2">
              <p className="font-bold text-emerald-700 whitespace-pre-line flex-1">{closing.correctFeedback}</p>
              <button
                type="button"
                onClick={() => togglePlayback(`closing-feedback-${closing.id}`, closing.correctFeedback)}
                aria-label="聽這段回饋"
                className="text-emerald-600 shrink-0"
              >
                {playbackLabel(`closing-feedback-${closing.id}`, '🔊', '⏸', '▶️')}
              </button>
            </div>
            <div className="space-y-1">
              {closing.options.map((opt, i) => (
                <div key={i} className="flex items-start gap-2">
                  <p className="text-xs text-gray-600 flex-1">
                    {opt.correct ? '✓' : '✗'} {opt.text} — {opt.detail}
                  </p>
                  <button
                    type="button"
                    onClick={() => speak(`${opt.text}${opt.detail}`)}
                    aria-label="聽這一項"
                    className="text-gray-400 shrink-0"
                  >
                    🔊
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-start gap-2">
              <p className="text-xs text-gray-500 italic flex-1">{closing.finalNote}</p>
              <button
                type="button"
                onClick={() => speak(closing.finalNote)}
                aria-label="聽這段提醒"
                className="text-gray-400 shrink-0"
              >
                🔊
              </button>
            </div>
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
        {/* Same dedupe as the live step render above — some local_inference/story_reasoning steps' intro
            and question are the identical sentence. */}
        {(reviewStep.type === 'reveal' || reviewStep.intro !== reviewStep.question) && (
          <p className="text-sm text-gray-600">{reviewStep.intro}</p>
        )}
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
      {showLessonCelebration && (
        <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
          {fireworkParticles.map((p) => (
            <span
              key={p.id}
              className="absolute text-3xl"
              style={
                {
                  left: p.left,
                  top: p.top,
                  '--tx': `${p.tx}px`,
                  '--ty': `${p.ty}px`,
                  '--rot': `${p.rot}deg`,
                  animation: `burst-particle ${FIREWORK_PARTICLE_DURATION_S}s ease-out ${p.delay}s forwards`,
                } as React.CSSProperties
              }
            >
              {p.emoji}
            </span>
          ))}
          <div
            className="absolute left-1/2 top-[16%] -translate-x-1/2 whitespace-nowrap text-xl sm:text-2xl font-extrabold text-white bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 px-6 py-3 rounded-full shadow-2xl"
            style={{ animation: `pop-text ${FIREWORK_TOTAL_MS / 1000}s ease-out forwards` }}
          >
            🏆 全文破譯成功！太厲害了！
          </div>
        </div>
      )}

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
              已破解 {solvedIds.size} / {totalGradableItems}
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

            {/* Some local_inference/story_reasoning steps' intro IS the question (one continuous sentence in
                the source doc, since there's no clues panel to lead into) — rendering both paragraphs then
                shows the exact same sentence twice. Skip the plain intro line in that case and let the bold
                question paragraph below carry it once, mirroring stepAutoPlayLines' existing audio-side
                dedupe (which already skips pushing `question` when it equals `intro`). */}
            {(currentStep.type === 'reveal' || currentStep.intro !== currentStep.question) && (
              <p className="text-sm text-center text-gray-600">{currentStep.intro}</p>
            )}

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
          {renderStepChips()}
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
