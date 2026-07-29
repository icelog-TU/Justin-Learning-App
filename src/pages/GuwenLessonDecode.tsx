import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAppDataContext } from '../lib/AppDataContext';
import {
  findGuwenLesson,
  guwenLessons,
  totalGuwenLessonItems,
  type GuwenLesson,
  type ClassicalClue,
  type PronunciationCue,
  type LessonStep,
  type RevealStep,
  type SequenceCard,
} from '../data/guwenLesson';

/** Every step type except RevealStep has a real question/options/correctIndex/retryHint to grade against. */
type GradedStep = Exclude<LessonStep, RevealStep>;
import {
  speak,
  speakSequence,
  pauseSpeech,
  resumeSpeech,
  cancelSpeech,
  isSpeechSynthesisAvailable,
} from '../lib/speech';
import {
  playSuccessChime,
  playCoinSound,
  playStarSound,
  playRollTickSound,
  playGuwenLessonCompleteFanfare,
  playTwinkleSound,
  playBadgeAwardSound,
} from '../lib/sound';
import {
  COIN_PER_GUWEN_WORD,
  STAR_PER_GUWEN_WORD,
  GUWEN_TEXT_COMPLETE_BONUS_COINS,
  GUWEN_TEXT_COMPLETE_BONUS_STARS,
  guwenRedoMultiplier,
} from '../lib/rewards';
import { numberToChineseWords } from '../lib/chineseNumber';
import {
  GuwenAssistedAnswerButton,
  GuwenCausalNodes,
  GuwenChoiceList,
  GuwenClueList,
  GuwenCoreFeedbackBlock,
  GuwenExplanationBlock,
  GuwenKeyList,
  GuwenMultiSelectList,
  GuwenSequenceCardRow,
} from '../components/guwen/GuwenQuestionBlocks';
import { guwenSentenceMatchesTarget } from '../lib/guwenPassage';

type Phase = 'intro' | 'listening' | 'steps' | 'complete';
type CorrectFlowStage = 'reward' | 'core-feedback' | 'choices' | 'details';
type ClosingCorrectFlowStage = 'reward' | 'core-feedback' | 'done';
/** Which closing screen is showing. Not every lesson has all three (see closingStepsList below). */
type ClosingStageKind = 'ordering' | 'causal' | 'multiselect';

const INTRO_LINE = '小學者，我們要一起破譯這些古文字！';
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

interface OrderingDragState {
  cardId: string;
  pointerId: number;
  startY: number;
  currentY: number;
  startCenterY: number;
  targetIndex: number;
}

const FIREWORK_EMOJI = ['🎉', '🎆', '🎇', '✨', '⭐', '🌟', '🎊'];
const FIREWORK_WAVE_COUNT = 4;
const FIREWORK_WAVE_GAP_S = 0.55;
const FIREWORK_PARTICLE_DURATION_S = 0.95;
/** The child can skip effects after 0.9s; effects settle at 4.5s, but badge collection always waits. */
const COMPLETION_CEREMONY_TOTAL_MS = 4500;
const COMPLETION_CEREMONY_SKIP_MS = 900;
const COMPLETION_CEREMONY_ACTION_MS = 2100;
const BADGE_CLAIM_CELEBRATION_MS = 2300;

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

/** Four compact waves spread across the whole viewport. The previous six-wave version launched mainly from
 * the top third and lasted too long, which felt sparse on a tablet and delayed the result page. */
function buildFireworkParticles(): FireworkParticle[] {
  const particles: FireworkParticle[] = [];
  let id = 0;
  for (let wave = 0; wave < FIREWORK_WAVE_COUNT; wave++) {
    const waveDelay = wave * FIREWORK_WAVE_GAP_S;
    const count = 8 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      particles.push({
        id: id++,
        emoji: FIREWORK_EMOJI[Math.floor(Math.random() * FIREWORK_EMOJI.length)],
        left: `${5 + Math.random() * 90}%`,
        top: `${18 + Math.random() * 62}%`,
        tx: (Math.random() - 0.5) * 260,
        ty: (Math.random() - 0.58) * 260,
        rot: (Math.random() - 0.5) * 480,
        delay: waveDelay + Math.random() * 0.18,
      });
    }
  }
  return particles;
}

/** True whenever `intro`'s own trailing sentence already IS `question` verbatim — not just when the two
 * fields are fully equal. A source doc's "App引導語" often ends by asking the question outright (the setup
 * and the question are one continuous thought), which authors then copy into both fields; `intro` can also
 * have extra lead-in text before that shared final sentence. Either way, showing/speaking both fields
 * unmodified prints or reads the same sentence twice in a row — this catches both the exact-equal case and
 * the more common "intro ends with the question" case in one check, so no future step (in any lesson) needs
 * to avoid this phrasing pattern; the app handles it, not the content. */
function questionRepeatsIntro(intro: string, question: string): boolean {
  return intro.trim().endsWith(question.trim());
}

/** The portion of a step's `intro` that isn't just a restatement of `question` — i.e. `intro` with its
 * trailing question-sentence stripped off, if present (see `questionRepeatsIntro`). Use this for the plain
 * lead-in paragraph so only the non-redundant setup text shows; the bold `question` paragraph elsewhere
 * still renders the question itself exactly once. Returns the empty string when the two fields are fully
 * equal (nothing left to show as a separate lead-in) or the step has no `question` field at all (reveal). */
function stepIntroLeadIn(step: LessonStep): string {
  if (step.type === 'reveal') return step.intro;
  if (!questionRepeatsIntro(step.intro, step.question)) return step.intro;
  return step.intro.trim().slice(0, step.intro.trim().length - step.question.trim().length).trim();
}

function speechParagraphs(text: string): string[] {
  return text.split(/\n{2,}/).map((line) => line.trim()).filter(Boolean);
}

function coreFeedbackText(step: LessonStep, complete = false): string {
  return complete
    ? step.correctFeedback
    : speechParagraphs(step.correctFeedback)[0] ?? step.correctFeedback;
}

function detailSpeechLines(step: LessonStep, completeFeedbackAsCore = false): string[] {
  return [
    ...(completeFeedbackAsCore ? [] : speechParagraphs(step.correctFeedback).slice(1)),
    ...(step.pronunciationCues?.correctFeedback?.map((cue) => cue.speechText) ?? []),
    step.explanation.replace(/\n+/g, ' '),
  ].filter(Boolean);
}

/** The full auto-play script for a step, as separate lines (queued with speakSequence so each one fully
 * finishes before the next starts). Clues/keys are part of the auto-play here — the child needs to hear all
 * the evidence before the question makes sense, mirroring the guwen-decoder skill's 'pattern' puzzle rule. */
function stepAutoPlayLines(step: LessonStep): string[] {
  const lines: string[] = [
    step.targetSentence,
    ...(step.pronunciationCues?.targetSentence?.map((cue) => cue.speechText) ?? []),
    ...speechParagraphs(step.intro),
    ...(step.pronunciationCues?.intro?.map((cue) => cue.speechText) ?? []),
  ];
  if (step.type === 'evidence') {
    step.clues.forEach((c) =>
      lines.push(
        c.text,
        c.pronunciationCue?.speechText ?? '',
        c.unlockedMeaning ?? '',
        c.unlockedMeaningPronunciationCue?.speechText ?? '',
      ),
    );
  } else if (step.type === 'reconstruction') {
    step.keys.forEach((k) => {
      lines.push(k.code, k.decodedEvidence);
    });
  } else if (step.type === 'reveal' && step.keys) {
    step.keys.forEach((k) => {
      lines.push(k.code, k.decodedEvidence);
    });
  }
  if (step.type !== 'reveal' && !questionRepeatsIntro(step.intro, step.question)) {
    lines.push(
      step.question,
      ...(step.pronunciationCues?.question?.map((cue) => cue.speechText) ?? []),
    );
  }
  return lines.filter(Boolean);
}

/** Highlights every 「...」-quoted span in `text` (quotes included) — used for a clue's vernacular gloss,
 * where the quoted span is the classical word/phrase the child just decoded, kept visible inside the
 * modern-Chinese sentence so it's easy to spot at a glance. */
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

/** A sentence chunk of the full passage counts as solved once every step targeting it (or a phrase inside
 * it) has been solved — a lesson step's target is usually a sub-phrase of one `sentences` entry. */
function isSentenceSolved(sentence: string, lesson: GuwenLesson, solvedIds: Set<string>): boolean {
  const relevant = lesson.steps.filter((s) => guwenSentenceMatchesTarget(sentence, s.targetSentence));
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

  const storedProgress = lesson ? data.guwenProgress[lesson.id] : undefined;
  const progress =
    lesson?.contentRevision && storedProgress?.contentRevision !== lesson.contentRevision
      ? undefined
      : storedProgress;
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
  const [correctFlowStage, setCorrectFlowStage] = useState<CorrectFlowStage | null>(null);
  const [wrongIndex, setWrongIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [reviewStepId, setReviewStepId] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [playbackId, setPlaybackId] = useState<string | null>(null);
  const [playbackPaused, setPlaybackPaused] = useState(false);
  const [celebration, setCelebration] = useState<CelebrationState | null>(null);
  const [celebrationPaused, setCelebrationPaused] = useState(false);
  // Short full-screen completion ceremony. Effects stop automatically at 4.5 seconds, and the child can
  // skip them after 0.9 seconds. Neither path claims the badge: only the explicit claim button may do that.
  const [showLessonCelebration, setShowLessonCelebration] = useState(false);
  const [fireworkParticles, setFireworkParticles] = useState<FireworkParticle[]>([]);
  const [ceremonyCanSkip, setCeremonyCanSkip] = useState(false);
  const [ceremonyActionReady, setCeremonyActionReady] = useState(false);
  const [badgeClaiming, setBadgeClaiming] = useState(false);
  const ceremonyTimersRef = useRef<number[]>([]);
  const badgeClaimSubmittedRef = useRef(false);
  const celebrationTimeoutRef = useRef<number | null>(null);
  const celebrationPraiseFallbackRef = useRef<number | null>(null);
  const rewardStartedForStepRef = useRef<string | null>(null);
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
  const orderingCardRefs = useRef(new Map<string, HTMLDivElement>());
  const orderingDragRef = useRef<OrderingDragState | null>(null);
  const [orderingDrag, setOrderingDrag] = useState<OrderingDragState | null>(null);
  const [orderingWrong, setOrderingWrong] = useState(false);
  const [orderingSolved, setOrderingSolved] = useState(() =>
    Boolean(lesson?.sequenceOrderingClosing && solvedIds.has(lesson.sequenceOrderingClosing.id)),
  );
  const [causalChoice, setCausalChoice] = useState<number | null>(null);
  const [causalWrong, setCausalWrong] = useState(false);
  const [causalSolved, setCausalSolved] = useState(() =>
    Boolean(lesson?.causalChainClosing && solvedIds.has(lesson.causalChainClosing.id)),
  );
  const [multiSelectChoice, setMultiSelectChoice] = useState<Set<number>>(new Set());
  const [multiSelectWrong, setMultiSelectWrong] = useState(false);
  const [multiSelectSolved, setMultiSelectSolved] = useState(() =>
    Boolean(lesson?.evidenceMultiSelectClosing && solvedIds.has(lesson.evidenceMultiSelectClosing.id)),
  );
  const [closingCorrectFlow, setClosingCorrectFlow] = useState<{
    id: string;
    stage: ClosingCorrectFlowStage;
  } | null>(null);

  /** Advances past `fromKind` to whichever closing screen (if any) comes next in this lesson's actual
   * closingStepsList — not a hardcoded 'ordering'→'causal'→'multiselect' chain, since a lesson may only have
   * a subset of the three (王戎 has just the multi-select). Falls through to completion when there's nothing
   * left, so this same function works whether `fromKind` is the middle or the last screen present. */
  function advanceClosingStage(fromKind: ClosingStageKind) {
    stopStepSpeech();
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
    speakSequence(
      [
        LISTEN_LEAD_IN,
        ...(lesson?.fullTextPronunciationCues?.map((cue) => cue.speechText) ?? []),
        fullText,
        LISTEN_PROMPT,
        ...(lesson?.introClosingLine ? [lesson.introClosingLine] : []),
      ],
      () => setIsPlaying(false),
    );
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
    speakSequence([
      ...(lesson.splitIntroSpeechParagraphs
        ? speechParagraphs(lesson.introSpokenLine)
        : [lesson.introSpokenLine]),
      ...(lesson.introPronunciationCues?.map((cue) => cue.speechText) ?? []),
      `標題是《${lesson.title}》。`,
    ]);
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

  function clearCeremonyTimers() {
    ceremonyTimersRef.current.forEach((id) => window.clearTimeout(id));
    ceremonyTimersRef.current = [];
  }

  function settleLessonCeremony() {
    clearCeremonyTimers();
    setFireworkParticles([]);
    setCeremonyCanSkip(false);
    setCeremonyActionReady(true);
  }

  function finishBadgeClaimCelebration() {
    clearCeremonyTimers();
    cancelSpeech();
    setFireworkParticles([]);
    setBadgeClaiming(false);
    setShowLessonCelebration(false);
    setCeremonyCanSkip(false);
    setCeremonyActionReady(false);
  }

  function claimBadge() {
    if (badgeClaimSubmittedRef.current) return;
    badgeClaimSubmittedRef.current = true;
    clearCeremonyTimers();
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (!alreadyComplete) {
      completeGuwenText(lesson!.id, lesson!.contentRevision);
      reward(completionCoinBonus, completionStarBonus, { big: true, celebrate: false });
    }
    setBadgeClaiming(true);
    setCeremonyCanSkip(false);
    setFireworkParticles(reduceMotion ? [] : buildFireworkParticles());
    playBadgeAwardSound();
    speak(`恭喜你得到第${numberToChineseWords(badgeNumber)}枚徽章！`);
    ceremonyTimersRef.current = [
      window.setTimeout(finishBadgeClaimCelebration, reduceMotion ? 1700 : BADGE_CLAIM_CELEBRATION_MS),
    ];
  }

  function launchLessonCeremony() {
    clearCeremonyTimers();
    cancelSpeech();
    badgeClaimSubmittedRef.current = false;
    setBadgeClaiming(false);
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    setFireworkParticles(reduceMotion ? [] : buildFireworkParticles());
    setCeremonyCanSkip(reduceMotion);
    setCeremonyActionReady(reduceMotion);
    setShowLessonCelebration(true);
    playGuwenLessonCompleteFanfare();
    ceremonyTimersRef.current = [
      ...(!reduceMotion ? [window.setTimeout(() => playTwinkleSound(), 700)] : []),
      window.setTimeout(() => setCeremonyCanSkip(true), reduceMotion ? 0 : COMPLETION_CEREMONY_SKIP_MS),
      window.setTimeout(() => {
        setCeremonyActionReady(true);
      }, reduceMotion ? 100 : COMPLETION_CEREMONY_ACTION_MS),
      window.setTimeout(() => settleLessonCeremony(), reduceMotion ? 1500 : COMPLETION_CEREMONY_TOTAL_MS),
    ];
  }

  function claimBadgeFromVerificationScroll() {
    if (alreadyComplete) return;
    launchLessonCeremony();
    claimBadge();
  }

  // Fires exactly once for a completion earned during this visit, never when reopening an old lesson.
  // The single coordinated ceremony replaces the generic reward burst. Long automatic TTS is deliberately
  // absent here: the result page offers separate listen buttons, while forcing the ancient text, draft and
  // translation to play in one queue lasted far beyond the visual climax.
  const wasAlreadyCompleteOnMountRef = useRef(alreadyComplete);
  const lessonCelebrationFiredRef = useRef(false);
  useEffect(() => {
    if (phase !== 'complete' || !lesson || lesson.badgeClaimMode === 'scroll-end') return;
    if (wasAlreadyCompleteOnMountRef.current || lessonCelebrationFiredRef.current) return;
    lessonCelebrationFiredRef.current = true;
    launchLessonCeremony();
    return () => {
      clearCeremonyTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Reopening an already-finished lesson (or finishing it just now) must land on the top of the trophy
  // screen — "🏆 全文破譯成功！" — not wherever the window happened to be scrolled to. React Router doesn't
  // reset scroll position on navigation by itself, and finishing the lesson via the multi-select closing
  // screen's own button leaves the page scrolled near that button, i.e. near the bottom of the *old* content.
  // Without this, the child arrives already scrolled past the header, straight down near the claim-badge
  // button, before ever seeing the congratulations. Runs on every arrival at 'complete', not just a fresh
  // completion, since the scroll-position problem exists either way.
  useEffect(() => {
    if (phase === 'complete') window.scrollTo(0, 0);
  }, [phase]);

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
      setCorrectFlowStage(null);
      setClosingCorrectFlow(null);
      rewardStartedForStepRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentStep?.id]);

  // Auto-plays the "what am I supposed to do here" line(s) for whichever closing screen is showing — the
  // sequence-ordering intro, the causal-chain intro + question (this is a real graded question now, so both
  // lines matter, same as a regular step's auto-play), or the multi-select intro — every time `closingStage`
  // changes (including the very first time `currentStep` becomes undefined and the closing block takes
  // over). Per-card/node/option text is deliberately NOT auto-played here, only available via its own 🔊
  // button — matching how a step's own corpus/pattern options are tap-to-listen-only, not part of the
  // auto-play (see "Puzzle types" history in this file).
  useEffect(() => {
    if (phase !== 'steps' || currentStep || !allStepsSolved || closingStepsList.length === 0) return;
    const lines =
      closingStage === 'ordering'
        ? lesson?.sequenceOrderingClosing
          ? [lesson.sequenceOrderingClosing.intro]
          : undefined
        : closingStage === 'causal'
          ? lesson?.causalChainClosing
            ? [lesson.causalChainClosing.intro, lesson.causalChainClosing.question]
            : undefined
          : lesson?.evidenceMultiSelectClosing
            ? [lesson.evidenceMultiSelectClosing.intro]
            : undefined;
    if (!lines || lines.length === 0) return;
    const id = `closing-intro-${closingStage}`;
    setPlaybackId(id);
    setPlaybackPaused(false);
    speakSequence(lines, () => setPlaybackId((cur) => (cur === id ? null : cur)));
    return () => {
      cancelSpeech();
      setPlaybackId((cur) => (cur === id ? null : cur));
      setPlaybackPaused(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentStep, allStepsSolved, closingStage]);

  // Give the immediate success reward first. Once it settles, show and play the core answer,
  // while also allowing an adult or returning learner to continue without waiting for TTS.
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
        const step = lesson?.steps.find((item) => item.id === stepId);
        if (step) {
          setCorrectFlowStage('core-feedback');
          playCoreFeedback(step);
          return;
        }
        const closingFeedback = getClosingFeedback(stepId);
        if (!closingFeedback) return;
        setClosingCorrectFlow({ id: stepId, stage: 'core-feedback' });
        playClosingCoreFeedback(stepId, closingFeedback);
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
  const feedbackSpeechUnits = (text: string) =>
    lesson.splitFeedbackParagraphs ? text.split(/\n{2,}/).filter(Boolean) : [text];
  const completionRewardReached = alreadyComplete || readyForComplete;
  const earnedCoins = solvedIds.size * guwenCoinAmount + (completionRewardReached ? completionCoinBonus : 0);
  const earnedStars = solvedIds.size * guwenStarAmount + (completionRewardReached ? completionStarBonus : 0);
  const reviewStep = reviewStepId ? lesson.steps.find((s) => s.id === reviewStepId) : undefined;
  const finalDraftLines = lesson.steps.filter((s) => s.finalDraftLine).map((s) => s.finalDraftLine!);
  // 1-based position in `guwenLessons` — stable per lesson, not tied to completion order, and never
  // hardcoded against a fixed total (see ProgressPage.tsx's 徽章蒐集區, which sizes itself the same way).
  const badgeNumber = guwenLessons.findIndex((l) => l.id === lesson.id) + 1;
  const nextLesson = guwenLessons[badgeNumber];

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
          const isCurrentChunk = currentStep
            ? guwenSentenceMatchesTarget(sentence, currentStep.targetSentence)
            : false;
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

  function startRewardCelebration(stepId: string) {
    const praiseLine = PRAISE_LINES[Math.floor(Math.random() * PRAISE_LINES.length)];
    setCelebrationPaused(false);
    setCelebration({ stepId, tick: 0, praiseDone: false, stage: 'rolling' });
    speak(praiseLine, () => {
      setCelebration((cur) => (cur && cur.stepId === stepId ? { ...cur, praiseDone: true } : cur));
    });
    armPraiseFallback(stepId);
    tickCelebration(stepId, 0);
  }

  function beginStepReward(step: LessonStep) {
    if (rewardStartedForStepRef.current === step.id) return;
    rewardStartedForStepRef.current = step.id;
    recordGuwenWord(lesson!.id, step.id, lesson!.contentRevision);
    reward(guwenCoinAmount, guwenStarAmount);
    playSuccessChime();
    setCorrectFlowStage('reward');
    startRewardCelebration(step.id);
  }

  function playCoreFeedback(step: LessonStep) {
    const coreFeedback = coreFeedbackText(step, lesson!.completeCorrectFeedbackAsCore);
    const id = `core-feedback-${step.id}`;
    setPlaybackId(id);
    setPlaybackPaused(false);
    if (isSpeechSynthesisAvailable()) {
      speakSequence(speechParagraphs(coreFeedback), () => completeCoreFeedback(step));
    }
  }

  function completeCoreFeedback(step: LessonStep) {
    setPlaybackId((cur) => (cur === `core-feedback-${step.id}` ? null : cur));
    setPlaybackPaused(false);
    setCorrectFlowStage('choices');
  }

  function getClosingFeedback(id: string): string | undefined {
    if (lesson?.sequenceOrderingClosing?.id === id) return lesson.sequenceOrderingClosing.correctFeedback;
    if (lesson?.causalChainClosing?.id === id) return lesson.causalChainClosing.correctFeedback;
    if (lesson?.evidenceMultiSelectClosing?.id === id) return lesson.evidenceMultiSelectClosing.correctFeedback;
    return undefined;
  }

  function playClosingCoreFeedback(id: string, text: string) {
    setPlaybackId(`closing-core-${id}`);
    setPlaybackPaused(false);
    if (isSpeechSynthesisAvailable()) {
      speakSequence(feedbackSpeechUnits(text), () => completeClosingCoreFeedback(id));
    }
  }

  function completeClosingCoreFeedback(id: string) {
    setPlaybackId((cur) => (cur === `closing-core-${id}` ? null : cur));
    setPlaybackPaused(false);
    setClosingCorrectFlow({ id, stage: 'done' });
  }

  function toggleClosingCoreFeedback(id: string, text: string) {
    const playback = `closing-core-${id}`;
    if (closingCorrectFlow?.id !== id || closingCorrectFlow.stage !== 'core-feedback') {
      togglePlayback(playback, feedbackSpeechUnits(text));
      return;
    }
    if (playbackId === playback && !playbackPaused) {
      pauseSpeech();
      setPlaybackPaused(true);
      return;
    }
    playClosingCoreFeedback(id, text);
  }

  function beginClosingReward(id: string): boolean {
    if (rewardStartedForStepRef.current === id) return false;
    rewardStartedForStepRef.current = id;
    setClosingCorrectFlow({ id, stage: 'reward' });
    reward(guwenCoinAmount, guwenStarAmount);
    playSuccessChime();
    startRewardCelebration(id);
    return true;
  }

  function markStepSolved(step: LessonStep) {
    setFeedback('correct');
    rewardStartedForStepRef.current = null;
    beginStepReward(step);
  }

  function toggleCoreFeedback(step: LessonStep) {
    const id = `core-feedback-${step.id}`;
    if (correctFlowStage !== 'core-feedback') {
      togglePlayback(id, coreFeedbackText(step, lesson!.completeCorrectFeedbackAsCore));
      return;
    }
    if (playbackId === id && !playbackPaused) {
      pauseSpeech();
      setPlaybackPaused(true);
      return;
    }
    playCoreFeedback(step);
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
    setCorrectFlowStage(null);
    setClosingCorrectFlow(null);
    rewardStartedForStepRef.current = null;
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
    setCorrectFlowStage(null);
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

  function updateOrderingDrag(next: OrderingDragState | null) {
    orderingDragRef.current = next;
    setOrderingDrag(next);
  }

  function handleOrderingPointerDown(cardId: string, index: number, event: ReactPointerEvent<HTMLButtonElement>) {
    if (orderingSolved || (event.pointerType === 'mouse' && event.button !== 0)) return;
    const card = orderingCardRefs.current.get(cardId);
    if (!card) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const rect = card.getBoundingClientRect();
    updateOrderingDrag({
      cardId,
      pointerId: event.pointerId,
      startY: event.clientY,
      currentY: event.clientY,
      startCenterY: rect.top + rect.height / 2,
      targetIndex: index,
    });
    setOrderingWrong(false);
  }

  function handleOrderingPointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = orderingDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();

    const draggedCenterY = drag.startCenterY + (event.clientY - drag.startY);
    const otherCards = orderingArrangement.filter((id) => id !== drag.cardId);
    const targetIndex = otherCards.reduce((position, id) => {
      const rect = orderingCardRefs.current.get(id)?.getBoundingClientRect();
      return rect && draggedCenterY > rect.top + rect.height / 2 ? position + 1 : position;
    }, 0);

    updateOrderingDrag({ ...drag, currentY: event.clientY, targetIndex });

    // Keep long lists usable on a phone: dragging near a viewport edge gently scrolls the page.
    const edgeSize = 72;
    if (event.clientY < edgeSize) window.scrollBy({ top: -12, behavior: 'auto' });
    else if (event.clientY > window.innerHeight - edgeSize) window.scrollBy({ top: 12, behavior: 'auto' });
  }

  function finishOrderingDrag(event: ReactPointerEvent<HTMLButtonElement>, commit: boolean) {
    const drag = orderingDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (commit) {
      setOrderingArrangement((current) => {
        const next = current.filter((id) => id !== drag.cardId);
        next.splice(drag.targetIndex, 0, drag.cardId);
        return next;
      });
      setOrderingWrong(false);
    }
    updateOrderingDrag(null);
  }

  function handleOrderingKeyDown(index: number, event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    event.preventDefault();
    moveOrderingCard(index, event.key === 'ArrowUp' ? -1 : 1);
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
    if (!beginClosingReward(closing.id)) return;
    recordGuwenWord(lesson!.id, closing.id, lesson!.contentRevision);
    setOrderingWrong(false);
    setOrderingSolved(true);
  }

  function revealOrderingAnswer() {
    const closing = lesson!.sequenceOrderingClosing!;
    if (!beginClosingReward(closing.id)) return;
    setOrderingArrangement([...closing.correctOrder]);
    recordGuwenWord(lesson!.id, closing.id, lesson!.contentRevision);
    setOrderingWrong(false);
    setOrderingSolved(true);
  }

  function handleContinueFromOrdering() {
    advanceClosingStage('ordering');
  }

  function handleSelectCausal(i: number) {
    const closing = lesson!.causalChainClosing!;
    if (i !== closing.correctIndex) {
      setCausalChoice(i);
      setCausalWrong(true);
      return;
    }
    if (!beginClosingReward(closing.id)) return;
    recordGuwenWord(lesson!.id, closing.id, lesson!.contentRevision);
    setCausalChoice(i);
    setCausalWrong(false);
    setCausalSolved(true);
  }

  function revealCausalAnswer() {
    const closing = lesson!.causalChainClosing!;
    if (!beginClosingReward(closing.id)) return;
    setCausalChoice(closing.correctIndex);
    recordGuwenWord(lesson!.id, closing.id, lesson!.contentRevision);
    setCausalWrong(false);
    setCausalSolved(true);
  }

  function handleContinueFromCausalChain() {
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
    if (!beginClosingReward(closing.id)) return;
    recordGuwenWord(lesson!.id, closing.id, lesson!.contentRevision);
    setMultiSelectWrong(false);
    setMultiSelectSolved(true);
  }

  function revealMultiSelectAnswer() {
    const closing = lesson!.evidenceMultiSelectClosing!;
    if (!beginClosingReward(closing.id)) return;
    setMultiSelectChoice(new Set(
      closing.options.flatMap((option, index) => option.correct ? [index] : []),
    ));
    recordGuwenWord(lesson!.id, closing.id, lesson!.contentRevision);
    setMultiSelectWrong(false);
    setMultiSelectSolved(true);
  }

  function handleFinishClosingSequence() {
    stopStepSpeech();
    setPhase('complete');
  }

  /** Replays the short ceremony without awarding currency or completion a second time. */
  function handleReplayCelebration() {
    launchLessonCeremony();
  }

  function handleResetProgress() {
    resetGuwenText(lesson!.id, lesson!.contentRevision);
    // resetGuwenText doesn't touch timesCompleted (that's the point — it's meant to survive resets), so
    // re-reading it here is exactly "how many times was this cleared before *this* fresh attempt begins."
    setAttemptMultiplier(guwenRedoMultiplier(progress?.timesCompleted ?? 0));
    stopStepSpeech();
    setConfirmReset(false);
    setFeedback(null);
    setCorrectFlowStage(null);
    setClosingCorrectFlow(null);
    setWrongIndex(null);
    setReviewStepId(null);
    setIsPlaying(false);
    setIsPaused(false);
    setActiveStepId(lesson ? findCurrentStep(lesson, new Set())?.id : undefined);
    setClosingStage(closingStepsList[0]?.kind ?? 'ordering');
    setOrderingArrangement(lesson?.sequenceOrderingClosing ? lesson.sequenceOrderingClosing.cards.map((c) => c.id) : []);
    updateOrderingDrag(null);
    setOrderingWrong(false);
    setOrderingSolved(false);
    setCausalChoice(null);
    setCausalWrong(false);
    setCausalSolved(false);
    setMultiSelectChoice(new Set());
    setMultiSelectWrong(false);
    setMultiSelectSolved(false);
    setPhase('intro');
  }

  function renderPronunciationCues(cues?: PronunciationCue[]) {
    if (!cues?.length) return null;
    return (
      <div className="space-y-1.5">
        {cues.map((cue, index) => (
          <div
            key={`${cue.displayText}-${index}`}
            className="flex items-start gap-2 rounded-lg bg-amber-50 px-2.5 py-2 text-amber-800"
          >
            <button
              type="button"
              onClick={() => speak(cue.speechText)}
              aria-label="聽讀音提示"
              className="shrink-0 text-xs text-sky-600"
            >
              🔊
            </button>
            <p className="text-xs font-medium">{cue.displayText}</p>
          </div>
        ))}
      </div>
    );
  }

  function excludeAlreadyDisplayedPronunciationCues(
    cues?: PronunciationCue[],
    alreadyDisplayed?: PronunciationCue[],
  ) {
    if (!cues?.length) return undefined;
    const displayedTexts = new Set(alreadyDisplayed?.map((cue) => cue.displayText) ?? []);
    return cues.filter((cue) => !displayedTexts.has(cue.displayText));
  }

  function renderClue(clue: ClassicalClue, i: number) {
    return (
      <GuwenClueList
        key={i}
        startIndex={i}
        clues={[{
          text: clue.text,
          highlight: clue.highlight,
          pronunciationCue: clue.pronunciationCue ? (
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-2.5 py-2 text-amber-800">
            <button
              type="button"
              onClick={() => speak(clue.pronunciationCue!.speechText)}
              aria-label="聽發音提示"
              className="shrink-0 text-xs text-sky-600"
            >
              🔊
            </button>
            <p className="text-xs font-medium">{clue.pronunciationCue.displayText}</p>
          </div>
          ) : undefined,
          meaning: clue.unlockedMeaning ? (
          <div className="space-y-1.5">
            <div className="flex items-start gap-2 pl-1">
              <button
                type="button"
                onClick={() =>
                  speakSequence([
                    clue.unlockedMeaning!,
                    ...(clue.unlockedMeaningPronunciationCue
                      ? [clue.unlockedMeaningPronunciationCue.speechText]
                      : []),
                  ])
                }
                aria-label="聽這句白話"
                className="text-sky-500 shrink-0 text-xs"
              >
                🔊
              </button>
              <p className="text-xs text-gray-500">已破解為：{highlightQuoted(clue.unlockedMeaning)}</p>
            </div>
            {renderPronunciationCues(
              clue.unlockedMeaningPronunciationCue
                ? [clue.unlockedMeaningPronunciationCue]
                : undefined,
            )}
          </div>
          ) : undefined,
          source: clue.source,
        }]}
        onPlayClue={() =>
          speakSequence([clue.text, ...(clue.pronunciationCue ? [clue.pronunciationCue.speechText] : [])])
        }
      />
    );
  }

  function renderOptions(step: GradedStep, readOnly: boolean) {
    return (
      <GuwenChoiceList
        options={step.options}
        correctIndex={step.correctIndex}
        wrongIndex={readOnly ? null : wrongIndex}
        revealCorrect={readOnly || feedback === 'correct'}
        readOnly={readOnly || feedback === 'correct'}
        onChoose={readOnly ? undefined : handleSelect}
        onPlay={(option) => speak(option)}
      />
    );
  }

  function renderKeyTable(keys: { code: string; decodedEvidence: string }[]) {
    return (
      <GuwenKeyList keys={keys} onPlay={(key) => speakSequence([key.code, key.decodedEvidence])} />
    );
  }

  function renderClosingReward(id: string) {
    if (closingCorrectFlow?.id !== id || closingCorrectFlow.stage !== 'reward' || celebration?.stepId !== id) {
      return null;
    }
    return (
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
    );
  }

  function renderClosingCore(id: string, text: string) {
    if (closingCorrectFlow?.id !== id || closingCorrectFlow.stage !== 'core-feedback') return null;
    return (
      <GuwenCoreFeedbackBlock
        action={(
          <button
            type="button"
            onClick={() => toggleClosingCoreFeedback(id, text)}
            aria-label="暫停或重新播放核心解說"
            className="shrink-0 text-emerald-600"
          >
            {playbackLabel(`closing-core-${id}`, '🔊', '⏸', '▶️')}
          </button>
        )}
      >
        <p className="whitespace-pre-line">{text}</p>
        <p className="mt-3 text-xs font-semibold text-emerald-600">
          可以聽完、暫停或重播，也可以直接繼續。
        </p>
      </GuwenCoreFeedbackBlock>
    );
  }

  function closingCoreIsComplete(id: string): boolean {
    return closingCorrectFlow?.id !== id || closingCorrectFlow.stage !== 'reward';
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
        <p className="text-sm text-gray-600 whitespace-pre-line">{closing.intro}</p>
        {!orderingSolved && (
          <p className="rounded-lg bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-700">
            按住每張卡片右側的 ⠿，上下拖曳到想放的位置，再放開手指。
          </p>
        )}
        <div className="space-y-2">
          {cardsInOrder.map((card, i) => {
            const isDragging = orderingDrag?.cardId === card.id;
            return (
            <GuwenSequenceCardRow
              key={card.id}
              outerRef={(element) => {
                if (element) orderingCardRefs.current.set(card.id, element);
                else orderingCardRefs.current.delete(card.id);
              }}
              position={i + 1}
              text={card.text}
              active={isDragging}
              onPlay={() => speak(card.text)}
              style={
                isDragging
                  ? { transform: `translateY(${orderingDrag.currentY - orderingDrag.startY}px)` }
                  : undefined
              }
              handle={!orderingSolved ? (
                <button
                  type="button"
                  aria-label={`拖曳第 ${i + 1} 張卡片重新排序`}
                  aria-keyshortcuts="ArrowUp ArrowDown"
                  onPointerDown={(event) => handleOrderingPointerDown(card.id, i, event)}
                  onPointerMove={handleOrderingPointerMove}
                  onPointerUp={(event) => finishOrderingDrag(event, true)}
                  onPointerCancel={(event) => finishOrderingDrag(event, false)}
                  onKeyDown={(event) => handleOrderingKeyDown(i, event)}
                  className={`flex h-11 w-11 shrink-0 touch-none items-center justify-center rounded-xl border-2 text-2xl leading-none ${
                    isDragging
                      ? 'cursor-grabbing border-indigo-500 bg-indigo-600 text-white'
                      : 'cursor-grab border-indigo-200 bg-white text-indigo-600 active:bg-indigo-100'
                  }`}
                >
                  ⠿
                </button>
              ) : undefined}
            />
          )})}
        </div>
        {!orderingSolved && orderingDrag && (
          <p aria-live="polite" className="text-center text-sm font-bold text-indigo-600">
            放開後會移到第 {orderingDrag.targetIndex + 1} 位
          </p>
        )}
        {!orderingSolved && orderingWrong && <p className="text-sm text-red-500 text-center">{closing.retryHint}</p>}
        {!orderingSolved && orderingWrong && (
          <GuwenAssistedAnswerButton label="幫我排出正確順序" onReveal={revealOrderingAnswer} />
        )}
        {!orderingSolved && (
          <button
            type="button"
            onClick={handleSubmitOrdering}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl py-2.5"
          >
            送出順序
          </button>
        )}
        {orderingSolved && renderClosingReward(closing.id)}
        {orderingSolved && renderClosingCore(closing.id, closing.correctFeedback)}
        {orderingSolved && closingCoreIsComplete(closing.id) && (
          <div className="bg-emerald-50 rounded-xl p-4 space-y-3">
            {closingCorrectFlow?.stage === 'done' && (
              <div className="flex items-start gap-2">
                <p className="font-bold text-emerald-700 flex-1">{closing.correctFeedback}</p>
                <button
                  type="button"
                  onClick={() => speakSequence(feedbackSpeechUnits(closing.correctFeedback))}
                  aria-label="聽這段回饋"
                  className="text-emerald-600 shrink-0"
                >
                  🔊
                </button>
              </div>
            )}
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
            onClick={() => togglePlayback(`closing-intro-causal`, `${closing.intro} ${closing.question}`)}
            aria-label="聽這段說明"
            className="text-sky-500 shrink-0"
          >
            {playbackLabel(`closing-intro-causal`, '🔊', '⏸', '▶️')}
          </button>
        </div>
        <p className="text-sm text-gray-600 whitespace-pre-line">{closing.intro}</p>
        <p className="font-medium text-gray-800">{closing.question}</p>
        <GuwenChoiceList
          options={closing.options}
          correctIndex={closing.correctIndex}
          wrongIndex={!causalSolved && causalWrong ? causalChoice : null}
          revealCorrect={causalSolved}
          readOnly={causalSolved}
          labels="letter"
          onChoose={handleSelectCausal}
        />
        {!causalSolved && causalWrong && <p className="text-sm text-red-500 text-center">{closing.retryHint}</p>}
        {!causalSolved && causalWrong && (
          <GuwenAssistedAnswerButton label="幫我選出正確答案" onReveal={revealCausalAnswer} />
        )}
        {causalSolved && renderClosingReward(closing.id)}
        {causalSolved && renderClosingCore(closing.id, closing.correctFeedback)}
        {causalSolved && closingCoreIsComplete(closing.id) && (
          <div className="space-y-4">
            {closingCorrectFlow?.stage === 'done' && (
              <div className="flex items-start gap-2">
                <p className="font-bold text-emerald-700 flex-1">{closing.correctFeedback}</p>
                <button
                  type="button"
                  onClick={() => speakSequence(feedbackSpeechUnits(closing.correctFeedback))}
                  aria-label="聽這段回饋"
                  className="text-emerald-600 shrink-0"
                >
                  🔊
                </button>
              </div>
            )}
            <GuwenCausalNodes nodes={closing.nodes} onPlay={(node) => speak(node)} />
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
        )}
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
        <p className="text-sm text-gray-600 whitespace-pre-line">{closing.intro}</p>
        <GuwenMultiSelectList
          options={closing.options}
          selected={multiSelectChoice}
          solved={multiSelectSolved}
          onToggle={toggleMultiSelectOption}
          onPlay={(option) => speak(option)}
        />
        {!multiSelectSolved && multiSelectWrong && <p className="text-sm text-red-500 text-center">{closing.retryHint}</p>}
        {!multiSelectSolved && multiSelectWrong && (
          <GuwenAssistedAnswerButton label="幫我勾出正確答案" onReveal={revealMultiSelectAnswer} />
        )}
        {!multiSelectSolved && (
          <button
            type="button"
            onClick={handleSubmitMultiSelect}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl py-2.5"
          >
            {closing.submitButtonLabel ?? '提交判斷'}
          </button>
        )}
        {multiSelectSolved && renderClosingReward(closing.id)}
        {multiSelectSolved && renderClosingCore(closing.id, closing.correctFeedback)}
        {multiSelectSolved && closingCoreIsComplete(closing.id) && (
          <div className="bg-emerald-50 rounded-xl p-4 space-y-3">
            {closingCorrectFlow?.stage === 'done' && (
              <div className="flex items-start gap-2">
                <p className="font-bold text-emerald-700 whitespace-pre-line flex-1">{closing.correctFeedback}</p>
                <button
                  type="button"
                  onClick={() =>
                    togglePlayback(`closing-feedback-${closing.id}`, feedbackSpeechUnits(closing.correctFeedback))
                  }
                  aria-label="聽這段回饋"
                  className="text-emerald-600 shrink-0"
                >
                  {playbackLabel(`closing-feedback-${closing.id}`, '🔊', '⏸', '▶️')}
                </button>
              </div>
            )}
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
            ends with (or fully equals) the question sentence; stepIntroLeadIn strips the redundant part. */}
        {stepIntroLeadIn(reviewStep) && (
          <p className="text-sm text-gray-600 whitespace-pre-line">{stepIntroLeadIn(reviewStep)}</p>
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
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`全文破譯成功：${lesson.title}`}
          className="fixed inset-0 z-[60] overflow-hidden bg-[radial-gradient(circle_at_center,_#155e75_0%,_#164e63_42%,_#082f49_100%)] text-white flex items-center justify-center p-5"
          style={{ animation: 'ceremony-backdrop 0.35s ease-out both' }}
        >
          <div className="absolute inset-0 pointer-events-none">
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
          </div>

          {ceremonyCanSkip && !badgeClaiming && (
            <button
              type="button"
              onClick={settleLessonCeremony}
              className="absolute right-4 top-4 rounded-full bg-white/15 px-3 py-1.5 text-sm font-medium text-white/90 backdrop-blur hover:bg-white/25"
            >
              跳過動畫
            </button>
          )}

          <div className="relative z-10 w-full max-w-md text-center space-y-3">
            <div
              className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-4 border-amber-300 bg-amber-500/20 text-4xl shadow-[0_0_45px_rgba(251,191,36,0.75)]"
              style={{ animation: 'ceremony-seal 0.7s cubic-bezier(.2,.9,.25,1.25) both' }}
            >
              🏆
            </div>
            <div style={{ animation: 'ceremony-rise 0.55s ease-out 0.35s both' }}>
              <p className="text-xs font-bold tracking-[0.28em] text-amber-200">古文破譯家</p>
              <h2 className="mt-1 text-3xl font-black text-white drop-shadow-lg">全文破譯成功！</h2>
              <p className="mt-1 text-xl font-bold text-amber-200">《{lesson.title}》</p>
            </div>

            <div
              className="mx-auto grid max-w-sm grid-cols-3 gap-2 rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur"
              style={{ animation: 'ceremony-rise 0.5s ease-out 0.85s both' }}
            >
              <div>
                <p className="text-xl font-black">{totalGradableItems}</p>
                <p className="text-[11px] text-cyan-100">道密碼</p>
              </div>
              <div>
                <p className="text-xl font-black text-amber-200">🪙 {earnedCoins}</p>
                <p className="text-[11px] text-cyan-100">金幣</p>
              </div>
              <div>
                <p className="text-xl font-black text-yellow-200">⭐ {earnedStars}</p>
                <p className="text-[11px] text-cyan-100">星星</p>
              </div>
            </div>

            <div
              className="relative mx-auto pt-1"
              style={{
                animation: badgeClaiming
                  ? 'ceremony-claim-badge 1.05s cubic-bezier(.2,.9,.3,1.3) both'
                  : 'ceremony-badge 0.7s cubic-bezier(.2,.9,.3,1.3) 1.65s both',
              }}
            >
              {badgeClaiming && (
                <>
                  <span
                    aria-hidden="true"
                    className="absolute left-1/2 top-1/2 h-20 w-20 rounded-full border-2 border-yellow-200"
                    style={{ animation: 'ceremony-sparkle-ring 1.2s ease-out both' }}
                  />
                  <span
                    aria-hidden="true"
                    className="absolute left-1/2 top-1/2 h-20 w-20 rounded-full border border-white"
                    style={{ animation: 'ceremony-sparkle-ring 1.2s ease-out 0.25s both' }}
                  />
                </>
              )}
              <p className="relative z-10 text-6xl drop-shadow-[0_0_18px_rgba(253,224,71,0.9)]">🏅</p>
              <p className="mt-1 font-bold text-amber-100">
                第 {badgeNumber} 枚徽章：{lesson.badgeName ?? lesson.title}
              </p>
            </div>

            {badgeClaiming ? (
              <div
                role="status"
                aria-live="assertive"
                className="rounded-2xl border border-amber-200/70 bg-amber-300/20 px-4 py-3 shadow-[0_0_28px_rgba(253,224,71,0.35)]"
                style={{ animation: 'ceremony-claim-message 0.45s cubic-bezier(.2,.9,.3,1.2) both' }}
              >
                <p className="text-xl font-black text-yellow-100">
                  {lesson.badgeClaimSuccessMessage ?? `恭喜你得到第 ${badgeNumber} 枚徽章！`}
                </p>
                <p className="mt-1 text-sm font-medium text-cyan-100">徽章已加入你的收藏</p>
              </div>
            ) : ceremonyActionReady ? (
              <button
                type="button"
                onClick={claimBadge}
                className="w-full rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-3.5 text-lg font-black text-white shadow-xl transition-transform hover:scale-[1.02]"
                style={{ animation: 'ceremony-rise 0.35s ease-out both' }}
              >
                🏅 收下徽章，查看我的破譯成果
              </button>
            ) : (
              <p className="h-[52px] pt-3 text-sm font-medium text-cyan-100">正在鑄造你的破譯徽章……</p>
            )}
          </div>

          <div className="absolute inset-x-0 bottom-0 h-1.5 bg-white/15">
            <div
              className="h-full origin-left bg-gradient-to-r from-amber-300 to-pink-400"
              style={{ animation: `ceremony-progress ${COMPLETION_CEREMONY_TOTAL_MS}ms linear both` }}
            />
          </div>
        </div>
      )}

      <Link to="/guwen" className="text-teal-600 text-sm font-medium">
        ← 回古文破譯家
      </Link>

      {phase === 'intro' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow p-5 space-y-3">
            {lesson.introHeadline && (
              <p className="font-bold text-teal-700">{lesson.introHeadline}</p>
            )}
            <h2 className="text-xl font-bold text-gray-800">{lesson.title}</h2>
            <p className="text-xs text-gray-400">{lesson.source}</p>
            <p className="text-gray-600 whitespace-pre-line">{lesson.introSpokenLine}</p>
            {renderPronunciationCues(lesson.introPronunciationCues)}
          </div>
          <button
            type="button"
            onClick={() => {
              speak(INTRO_LINE);
              setPhase('listening');
            }}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl py-3"
          >
            🏺 {lesson.acceptMissionLabel ?? '接受破譯任務'}
          </button>
        </div>
      )}

      {phase === 'listening' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow p-5 space-y-3">
            <p className="font-bold text-teal-700">{LISTEN_LEAD_IN}</p>
            <p className="text-lg leading-relaxed text-gray-800">{lesson.fullText}</p>
            {renderPronunciationCues(lesson.fullTextPronunciationCues)}
            <button type="button" onClick={toggleFullPlayback} className="text-sm text-sky-600 font-medium">
              {!isPlaying ? '🔊 播放全文' : isPaused ? '▶️ 繼續播放' : '⏸ 暫停播放'}
            </button>
            <div className="pt-2 border-t border-gray-100 space-y-1.5">
              <p className="text-xs text-gray-400">或者一句一句聽：</p>
              {lesson.sentences.map((s, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        speakSequence([
                          s,
                          ...(lesson.sentencePronunciationCues?.[i]?.map((cue) => cue.speechText) ?? []),
                        ])
                      }
                      aria-label="聽這句話"
                      className="text-sky-500 shrink-0"
                    >
                      🔊
                    </button>
                    <span className="text-sm text-gray-600">{s}</span>
                  </div>
                  {renderPronunciationCues(
                    excludeAlreadyDisplayedPronunciationCues(
                      lesson.sentencePronunciationCues?.[i],
                      lesson.fullTextPronunciationCues,
                    ),
                  )}
                </div>
              ))}
            </div>
            {lesson.introClosingLine && (
              <p className="pt-2 text-sm text-gray-500">{lesson.introClosingLine}</p>
            )}
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
              {renderPronunciationCues(currentStep.pronunciationCues?.targetSentence)}
              <button
                type="button"
                onClick={() => togglePlayback(`step-${currentStep.id}`, stepAutoPlayLines(currentStep))}
                className="text-xs text-sky-600"
              >
                {playbackLabel(`step-${currentStep.id}`, '🔊 聽這句話', '⏸ 暫停播放', '▶️ 繼續播放')}
              </button>
            </div>

            {/* Some local_inference/story_reasoning steps' intro ends with (or fully equals) the question
                sentence — one continuous thought in the source doc, since there's no clues panel to lead
                into. Rendering both paragraphs unmodified would then print that sentence twice in a row.
                stepIntroLeadIn strips the redundant trailing part (or the whole intro, if fully equal),
                leaving only real lead-in text here; the bold question paragraph below still carries the
                question itself exactly once. Mirrors stepAutoPlayLines' identical audio-side dedupe. */}
            {stepIntroLeadIn(currentStep) && (
              <div className="space-y-2">
                <p className="text-sm text-center text-gray-600 whitespace-pre-line">{stepIntroLeadIn(currentStep)}</p>
                {renderPronunciationCues(currentStep.pronunciationCues?.intro)}
              </div>
            )}

            {currentStep.type === 'evidence' && (
              <div className="space-y-2">{currentStep.clues.map((c, i) => renderClue(c, i))}</div>
            )}
            {currentStep.type === 'reconstruction' && renderKeyTable(currentStep.keys)}
            {currentStep.type === 'reveal' && currentStep.keys && renderKeyTable(currentStep.keys)}

            {currentStep.type !== 'reveal' && (
              <>
                <p className="text-sm font-semibold text-center text-gray-700">{currentStep.question}</p>
                {renderPronunciationCues(currentStep.pronunciationCues?.question)}
                {feedback !== 'correct' && renderOptions(currentStep, false)}
                {wrongIndex !== null && feedback !== 'correct' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <p className="text-center text-sm text-red-500">{currentStep.retryHint}</p>
                      <button
                        type="button"
                        onClick={() =>
                          speakSequence([
                            currentStep.retryHint,
                            ...(currentStep.pronunciationCues?.retryHint?.map((cue) => cue.speechText) ?? []),
                          ])
                        }
                        aria-label="聽這段提示"
                        className="text-red-400 shrink-0"
                      >
                        🔊
                      </button>
                    </div>
                    {renderPronunciationCues(currentStep.pronunciationCues?.retryHint)}
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

            {feedback === 'correct' && correctFlowStage !== 'reward' && (
              <GuwenCoreFeedbackBlock
                action={(
                  <button
                    type="button"
                    onClick={() => toggleCoreFeedback(currentStep)}
                    aria-label="暫停或重新播放核心解說"
                    className="shrink-0 text-emerald-600"
                  >
                    {playbackLabel(`core-feedback-${currentStep.id}`, '🔊', '⏸', '▶️')}
                  </button>
                )}
              >
                <p className="whitespace-pre-line">
                  {coreFeedbackText(currentStep, lesson.completeCorrectFeedbackAsCore)}
                </p>
                {correctFlowStage === 'core-feedback' && (
                  <p className="mt-3 text-xs font-semibold text-emerald-600">
                    可以聽完、暫停或重播，也可以直接查看詳解或進入下一題。
                  </p>
                )}
              </GuwenCoreFeedbackBlock>
            )}
            {feedback === 'correct' && correctFlowStage === 'reward' && celebration && (
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
            {feedback === 'correct'
              && (correctFlowStage === 'core-feedback'
                || correctFlowStage === 'choices'
                || correctFlowStage === 'details')
              && !celebration && (
              <>
                <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-3 text-center text-sm font-bold text-amber-700">
                  🪙 已獲得 {guwenCoinAmount} 金幣　⭐ 已獲得 {guwenStarAmount} 星星
                </div>
                {currentStep.keyAwarded && (
                  <p className="rounded-lg bg-amber-50 p-3 text-sm font-bold text-amber-700">
                    🔑 你破解了一把新密碼：{currentStep.keyAwarded.code} ＝ {currentStep.keyAwarded.decodedEvidence}
                  </p>
                )}
                {(correctFlowStage === 'core-feedback' || correctFlowStage === 'choices') && (
                  <button
                    type="button"
                    onClick={() => setCorrectFlowStage('details')}
                    className="w-full rounded-xl border-2 border-sky-300 bg-sky-50 py-2.5 font-bold text-sky-700 hover:bg-sky-100"
                  >
                    📖 點我看詳解
                  </button>
                )}
                {correctFlowStage === 'details' && (
                  <GuwenExplanationBlock
                    action={(
                      <button
                        type="button"
                        onClick={() =>
                          togglePlayback(
                            `explain-${currentStep.id}`,
                            detailSpeechLines(currentStep, lesson.completeCorrectFeedbackAsCore),
                          )
                        }
                        aria-label="聽這段說明"
                        className="text-sky-600 shrink-0"
                      >
                        {playbackLabel(`explain-${currentStep.id}`, '🔊', '⏸', '▶️')}
                      </button>
                    )}
                  >
                    {!lesson.completeCorrectFeedbackAsCore
                      && speechParagraphs(currentStep.correctFeedback).slice(1).map((paragraph) => (
                        <p key={paragraph} className="font-bold text-sky-800">{paragraph}</p>
                      ))}
                    {renderPronunciationCues(currentStep.pronunciationCues?.correctFeedback)}
                    <p className="text-sm text-sky-800 whitespace-pre-line">{currentStep.explanation}</p>
                  </GuwenExplanationBlock>
                )}
              </>
            )}
            {feedback === 'correct'
              && (correctFlowStage === 'core-feedback'
                || correctFlowStage === 'choices'
                || correctFlowStage === 'details') && (
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
            {renderPronunciationCues(lesson.fullTextPronunciationCues)}
            <button
              type="button"
              onClick={() =>
                togglePlayback('complete-full-text', [
                  ...(lesson.fullTextPronunciationCues?.map((cue) => cue.speechText) ?? []),
                  lesson.fullText,
                ])
              }
              className="text-sm font-medium text-sky-600"
            >
              {playbackLabel('complete-full-text', '🔊 聽古文全文', '⏸ 暫停播放', '▶️ 重新播放')}
            </button>
          </div>

          {/* 我的破譯稿 and 白話驗證 are always shown together now — no "打開白話驗證卷軸" gate button in
              between. The child already did the real verification work back on the multi-select closing
              screen (judging which claims the text actually proves); asking them to press a second,
              near-identically-labeled button here to reveal content that's already earned was redundant and
              self-contradictory, and the user caught it via screenshot ("居然出現兩次"). */}
          <div className="bg-white rounded-2xl shadow p-5 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-semibold text-gray-500">📜 我的破譯稿</p>
              <button
                type="button"
                onClick={() => togglePlayback('complete-draft', finalDraftLines)}
                className="text-xs font-medium text-sky-600"
              >
                {playbackLabel('complete-draft', '🔊 聽破譯稿', '⏸ 暫停播放', '▶️ 重新播放')}
              </button>
            </div>
            <div className="space-y-1.5">
              {lesson.steps
                .filter((s) => s.finalDraftLine)
                .map((s) => (
                  <p key={s.id} className="text-gray-700 text-sm">
                    {s.finalDraftLine}
                  </p>
                ))}
            </div>
          </div>

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
            <p className="text-xs text-gray-500 whitespace-pre-line">{lesson.finalVerification.guideLine}</p>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{lesson.finalVerification.translation}</p>

            {lesson.finalVerification.comparisonRows.length > 0 && (
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
            )}

            {lesson.finalVerification.evidenceBoundary && (
              <div className="rounded-xl bg-amber-50 p-4">
                <p className="mb-2 text-sm font-bold text-amber-800">白話文證據邊界</p>
                <ul className="list-disc space-y-1 pl-5 text-xs text-amber-900">
                  {lesson.finalVerification.evidenceBoundary.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-emerald-50 rounded-xl p-4">
              <p className="text-sm font-bold text-emerald-700 whitespace-pre-line">
                {lesson.finalVerification.completionFeedback}
              </p>
            </div>

            {lesson.badgeClaimMode === 'scroll-end' && (
              <button
                type="button"
                onClick={claimBadgeFromVerificationScroll}
                disabled={alreadyComplete}
                className="w-full rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-3.5 text-lg font-black text-white shadow-lg disabled:cursor-default disabled:from-gray-300 disabled:to-gray-400"
              >
                🏅 {alreadyComplete ? '已收集' : lesson.badgeClaimLabel ?? '收集破譯徽章'}
              </button>
            )}
          </div>

          {/* Badge ownership already comes from completedAt, so the first-time ceremony and the badge claim
              are one climax instead of two celebrations separated by a long report. Reopening a completed
              lesson shows the owned badge immediately and offers a replay that awards nothing twice. */}
          {(lesson.badgeClaimMode !== 'scroll-end' || alreadyComplete) && (
          <div className="bg-white rounded-2xl shadow p-6 text-center space-y-2">
            <p className="text-5xl">🏅</p>
            <p className="font-bold text-gray-800">
              第 {badgeNumber} 枚徽章：{lesson.badgeName ?? lesson.title}
            </p>
            <p className="text-xs text-gray-400">已經收進「學習紀錄」的古文徽章蒐集區了</p>
            <button
              type="button"
              onClick={handleReplayCelebration}
              className="mt-2 text-sm font-semibold text-amber-600 hover:text-amber-700"
            >
              🎉 再看一次完成慶祝
            </button>
          </div>
          )}

          <div className="flex items-center justify-between">
            <Link to="/guwen" className="text-teal-600 font-medium text-sm">
              返回文章列表
            </Link>
            {alreadyComplete && nextLesson && (
              <Link to={`/guwen-lesson/${nextLesson.id}`} className="text-teal-600 font-medium text-sm">
                挑戰下一篇
              </Link>
            )}
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
