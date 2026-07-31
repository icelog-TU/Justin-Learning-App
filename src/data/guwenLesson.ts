import { zhengRenMaiLuLesson } from './zhengRenMaiLuLesson';
import { changGanRuChengLesson } from './changGanRuChengLesson';
import { wangRongLesson } from './wangRongLesson';
import { simaGuangLesson } from './simaGuangLesson';
import { shouZhuDaiTuLesson } from './shouZhuDaiTuLesson';
import { yaMiaoZhuZhangLesson } from './yaMiaoZhuZhangLesson';
import { yanErDaoZhongLesson } from './yanErDaoZhongLesson';
import { approvedKeZhouQiuJianLesson } from './keZhouQiuJianLesson';
import { yangShiZhiZiLesson } from './yangShiZhiZiLesson';
import { ziXiangMaoDunLesson } from './ziXiangMaoDunLesson';
import { yuRenShiYanLesson } from './yuRenShiYanLesson';

/**
 * 古文破譯家 — "Lesson" format: a stricter evidence-based methodology than the original GuwenWord model in
 * guwen.ts. Cross-text clues here must be REAL classical excerpts (never modern-Chinese sentences), each
 * with a pre-unlocked vernacular gloss and a traceable source, and the child reconstructs multi-part
 * phrases from separately-decoded "decoding keys" before the full text's translation is ever revealed.
 * See .claude/skills/design-guwen-decoding/SKILL.md for curriculum rules and
 * .claude/skills/implement-guwen-app/SKILL.md for the production implementation contract.
 * This is the only active classical-text lesson model in the app.
 */

export interface PronunciationCue {
  /** Legacy-only side note. New guwen lessons keep pronunciation explanations inside correctFeedback text. */
  displayText: string;
  /** Equivalent Chinese-only wording sent to TTS so punctuation/Zhuyin are not read aloud. */
  speechText: string;
}

export interface StepPronunciationCues {
  targetSentence?: PronunciationCue[];
  intro?: PronunciationCue[];
  question?: PronunciationCue[];
  retryHint?: PronunciationCue[];
  correctFeedback?: PronunciationCue[];
}

/** One real classical-text excerpt used as comparison evidence for a target word/phrase. */
export interface ClassicalClue {
  /** The exact classical excerpt, character-for-character — never modernized, paraphrased, or invented. */
  text: string;
  /** The exact substring of `text` to visually highlight (the word/phrase this clue is evidence for). */
  highlight: string;
  /** Child-facing vernacular gloss for this clue sentence only — unlocks the clue, never the target sentence.
   * Deliberately omitted ENTIRELY for a clue whose whole point is a structural/positional pattern the child
   * must induce by comparing two bare clues side by side (e.g. "入海求神藥"/"入林求木" for 入水求之) — spelling
   * out the translation there would directly hand over the "入X求Y＝進入X，尋找Y" pattern the question is
   * testing, not just gloss a word. Only omit the whole field for this reason, never just to save authoring
   * effort.
   * When the target is instead a single pronoun/referent inside an otherwise-safe-to-translate sentence
   * (e.g. what "之" points to), do NOT omit the field — translate the rest of the sentence normally and
   * leave just that one word as the untranslated classical character in 「」 (e.g. '...下車拉住了「之」。'),
   * with no parenthetical naming the referent and no added trailing context that would name it either. A
   * real bug: 王戎's 之 step originally had both `「之」（元方）` in the gloss AND a follow-up clause naming
   * 元方 right after — deleting the whole gloss overcorrected (the user explicitly wants the vernacular
   * translation of the rest of the sentence kept, just not the pronoun's answer). Full omission is for when
   * the ENTIRE clue is the pattern; partial omission (translate everything but the one word) is for when
   * only a piece of it is. */
  unlockedMeaning?: string;
  /** Traceable source (author/work), preserved verbatim from the approved lesson content. */
  source: string;
  /** Legacy-only child-facing pronunciation note for this exact clue unit. */
  pronunciationCue?: PronunciationCue;
  /** Legacy-only note for the playable unlocked-meaning line. */
  unlockedMeaningPronunciationCue?: PronunciationCue;
}

/** A previously-decoded piece of meaning, reusable in a later reconstruction step's "密碼鑰匙" table. */
export interface DecodingKey {
  code: string;
  decodedEvidence: string;
}

export type LessonStepType = 'evidence' | 'reconstruction' | 'local_inference' | 'story_reasoning';

interface LessonStepBase {
  id: string;
  type: LessonStepType;
  /** Step ids that must all be solved before this step becomes available. */
  prerequisiteIds: string[];
  /** The classical sentence/phrase this step is decoding — shown above the question. */
  targetSentence: string;
  /** App 引導語 — spoken/shown before the clues and question. */
  intro: string;
  /** 破譯問題 */
  question: string;
  options: string[];
  correctIndex: number;
  /** 答對回饋 — short praise line shown right after a correct pick, before the full explanation. */
  correctFeedback: string;
  /** 答錯提示 — points at which evidence to re-compare, never the answer. */
  retryHint: string;
  /** 破譯詳解 — the full reasoning explanation. */
  explanation: string;
  /** Legacy-only side-note TTS corrections. New lessons explain pronunciation inline in correctFeedback. */
  pronunciationCues?: StepPronunciationCues;
  /** 已取得的密碼鑰匙 — approved lessons may show this table before any scored question type. */
  keys?: DecodingKey[];
  /** This step's contribution to the final assembled draft ("我的破譯稿"), only set on the 7 steps whose
   * solved meaning becomes one line of the reconstructed story (see 全文密碼地圖 in the source lesson). */
  finalDraftLine?: string;
  /** The decoding key this step contributes to a later reconstruction step's key table, if any. */
  keyAwarded?: DecodingKey;
  /** Approved lessons may award more than one distinct key from the same solved interaction. */
  keysAwarded?: DecodingKey[];
}

export interface EvidenceStep extends LessonStepBase {
  type: 'evidence';
  clues: [ClassicalClue, ClassicalClue];
}

export interface ReconstructionStep extends LessonStepBase {
  type: 'reconstruction';
  /** 已取得的密碼鑰匙 — shown as a table before the question. */
  keys: DecodingKey[];
}

export interface LocalInferenceStep extends LessonStepBase {
  type: 'local_inference';
}

export interface StoryReasoningStep extends LessonStepBase {
  type: 'story_reasoning';
}

/** A reveal-only checkpoint — no question, no distractors, just an automatic "this word cluster is now fully
 * assembled" screen with a single continue button. Some source lessons (刻舟求劍) explicitly ask that certain
 * multi-word combinations NOT get their own multiple-choice question ("不另設整句選擇題") since forcing a fake
 * choice with no real distractor would just be busywork — but the combination still deserves its own paced
 * screen and its own decodedWordIds entry so progress resumes correctly mid-lesson. Unlike ReconstructionStep,
 * this has no `question`/`options`/`correctIndex`/`retryHint` — there is nothing to get wrong. */
export interface RevealStep {
  id: string;
  type: 'reveal';
  prerequisiteIds: string[];
  targetSentence: string;
  intro: string;
  /** 已取得的密碼鑰匙 table, if this reveal combines previously-decoded keys. */
  keys?: DecodingKey[];
  continueLabel?: string;
  /** Short praise line shown once the child taps continue. */
  correctFeedback: string;
  /** The assembled sentence/narrative shown after tapping continue. */
  explanation: string;
  pronunciationCues?: StepPronunciationCues;
  finalDraftLine?: string;
  keyAwarded?: DecodingKey;
  keysAwarded?: DecodingKey[];
}

export type LessonStep =
  | EvidenceStep
  | ReconstructionStep
  | LocalInferenceStep
  | StoryReasoningStep
  | RevealStep;

/** 收尾一：touch-friendly sequence-ordering checkpoint. The child drags each shuffled story-beat card
 * vertically and drops it into the intended position; the drag handle also supports ArrowUp/ArrowDown as
 * a keyboard-accessible fallback. This replaced the original visible up/down buttons after real child use
 * showed that repeated arrow tapping was inconvenient. */
export interface SequenceCard {
  id: string;
  text: string;
}

export interface SequenceOrderingClosing {
  id: string;
  title: string;
  intro: string;
  /** Cards in their initial (shuffled, not-yet-correct) display order. */
  cards: SequenceCard[];
  /** The correct order, as an array of card ids. */
  correctOrder: string[];
  correctFeedback: string;
  retryHint: string;
  /** Optional post-solve reasoning (an evidence table and/or the assembled causal chain) shown once the
   * child gets the order right, right after `correctFeedback` — for a source lesson whose own "詳解"/"完成的
   *因果鏈"/"證據邊界" content must display after this screen but that has no separate causalChainClosing
   * screen of its own (a display-only causal-chain screen would be redundant here, since this screen is
   * already the graded causal-ordering task). Omit when `correctFeedback` alone is enough. */
  explanation?: string;
}

/** 收尾二：a graded single-choice reasoning question asking the child to explain, using the clues already
 * decoded, why the story's central problem happened — NOT a display-only summary. An earlier version of
 * this screen just narrated the causal chain with `displayNote: '這一段是全文理解摘要，不需作答。'` and no
 * question at all; the user caught this directly ("這一頁其實是故事最後的推理題，而不是閱讀摘要...最大的問題就
 * 是它直接告訴孩子答案了") — from the "古文破譯家" child-as-codebreaker angle, telling the child the causal
 * chain before asking anything defeats the whole exercise. Now the chain (`nodes`/`coreSummary`/
 * `evidenceBoundary`) only appears *after* a correct answer, serving as the reasoning explanation for why
 * that option is right — same shape as `SequenceOrderingClosing.explanation`, just always present here
 * rather than optional. */
export interface CausalChainClosing {
  id: string;
  title: string;
  /** Shown before the question — sets up the task, must not hint at any option's wording. */
  intro: string;
  question: string;
  options: string[];
  correctIndex: number;
  /** Short praise line shown immediately on a correct pick, before the causal-chain reasoning below it. */
  correctFeedback: string;
  /** Points at which evidence to re-compare on a wrong pick — never the answer. */
  retryHint: string;
  /** Post-answer reasoning only — the causal chain that explains why the correct option is right. */
  nodes: string[];
  coreSummary: string;
  evidenceBoundary?: string;
  continueButtonLabel: string;
}

/** 收尾三：a multi-select "which of these does the text actually prove" checkpoint. The child must check
 * every option the text supports and none it doesn't — a single wrong toggle (missing or extra) fails it. */
export interface MultiSelectOption {
  text: string;
  correct: boolean;
  /** Shown in the post-answer detail table on whichever side (supported/unsupported) it belongs to. */
  detail: string;
}

export interface EvidenceMultiSelectClosing {
  id: string;
  title: string;
  intro: string;
  options: MultiSelectOption[];
  correctFeedback: string;
  retryHint: string;
  finalNote: string;
  submitButtonLabel?: string;
}

export interface ComparisonRow {
  decodedEvidence: string;
  vernacularExpression: string;
  relationship: string;
}

export interface FinalVerification {
  /** Step ids that must all be solved before the verification scroll unlocks. */
  prerequisiteStepIds: string[];
  guideLine: string;
  translation: string;
  /** Approved evidence-boundary notes shown below the translation when the source lesson uses a list. */
  evidenceBoundary?: string[];
  comparisonRows: ComparisonRow[];
  completionFeedback: string;
}

export interface GuwenLesson {
  id: string;
  /** Changes only when approved lesson content is replaced; prevents stale progress unlocking a new edition. */
  contentRevision?: string;
  title: string;
  source: string;
  introHeadline?: string;
  /** App 開場白 — spoken on the intro screen. */
  introSpokenLine: string;
  /** Optional approved line shown after the full text on the listening screen. */
  introClosingLine?: string;
  /** Preserves blank-line-separated opening paragraphs as distinct audited TTS utterances. */
  splitIntroSpeechParagraphs?: boolean;
  /** Legacy-only side-note field. New lessons keep pronunciation explanations inside correctFeedback. */
  introPronunciationCues?: PronunciationCue[];
  acceptMissionLabel?: string;
  fullText: string;
  /** Legacy-only side-note field. New lessons keep pronunciation explanations inside correctFeedback. */
  fullTextPronunciationCues?: PronunciationCue[];
  /** fullText split into individually-readable sentences (concatenating these reproduces fullText exactly). */
  sentences: string[];
  /** Legacy-only side-note corrections for the corresponding individually playable entry in `sentences`. */
  sentencePronunciationCues?: Partial<Record<number, PronunciationCue[]>>;
  steps: LessonStep[];
  /** Optional whole-lesson wrap-up screens shown (in this fixed order — whichever are present) after every
   * step is solved, before the final translation unlocks. Independent and each individually optional — not
   * every lesson needs all three. 刻舟求劍 uses all three (event-sequencing, then a causal-chain summary,
   * then an evidence-boundary multi-select); 王戎不取道旁李 uses only the multi-select, since its causal-chain
   * reasoning is already a regular scored `story_reasoning` step and it has no card-reordering task. */
  sequenceOrderingClosing?: SequenceOrderingClosing;
  causalChainClosing?: CausalChainClosing;
  evidenceMultiSelectClosing?: EvidenceMultiSelectClosing;
  finalVerification: FinalVerification;
  badgeName?: string;
  badgeClaimLabel?: string;
  badgeClaimSuccessMessage?: string;
  /** Places the first badge-claim action after the completed verification scroll instead of in an auto dialog. */
  badgeClaimMode?: 'scroll-end';
  /** Keeps the source lesson's audited option sequence instead of applying the legacy balancing adapter. */
  preserveAuthoredOptionOrder?: boolean;
  /** Plays each blank-line-separated feedback paragraph as the exact independently audited utterance. */
  splitFeedbackParagraphs?: boolean;
  /** Treats every approved correctFeedback paragraph as the core answer instead of legacy detail overflow. */
  completeCorrectFeedbackAsCore?: boolean;
}

export const legacySimaGuangLesson: GuwenLesson = {
  id: 'sima-guang-po-weng',
  title: '司馬光破甕救友',
  source: '《宋史．司馬光傳》',
  introSpokenLine: '我找到一篇古文，可是第一句就藏著幾個我不認識的古文密碼。你願意當古文破譯家，陪我找線索嗎？',
  fullText: '群兒戲於庭，一兒登甕，足跌沒水中。眾皆棄去，光持石擊甕破之，水迸，兒得活。',
  sentences: ['群兒戲於庭，', '一兒登甕，', '足跌沒水中。', '眾皆棄去，', '光持石擊甕破之，', '水迸，', '兒得活。'],
  steps: [
    {
      id: 'xi_yu_ting',
      type: 'evidence',
      prerequisiteIds: [],
      targetSentence: '群兒戲於庭',
      intro: '故事一開始寫「群兒戲於庭」。「戲」和「庭」之間的「於」，把它們接成了什麼關係？我找到兩句已經破解的古文，我們來比對看看。',
      clues: [
        {
          text: '虞舜耕於歷山。',
          highlight: '耕於',
          unlockedMeaning: '虞舜「耕於」歷山，也就是在歷山耕作。',
          source: '干寶《搜神記》卷八。',
        },
        {
          text: '子路宿於石門。',
          highlight: '宿於',
          unlockedMeaning: '子路「宿於」石門，也就是在石門過夜。',
          source: '《論語．憲問》。',
        },
      ],
      question: '「耕於歷山」是在歷山耕作，「宿於石門」是在石門過夜。依照相同的排列方式，「群兒戲於庭」最可能是哪一幅畫面？',
      options: ['一群孩子從庭院離開後才開始玩', '一群孩子把庭院當成玩具搬動', '一群孩子在庭院裡玩耍'],
      correctIndex: 2,
      correctFeedback: '開場破解成功！動作放在「於」前，地點放在「於」後。',
      retryHint: '比較兩條線索：「歷山」是耕作發生的地方，「石門」是過夜發生的地方。那麼「庭」會是什麼？',
      explanation:
        '先看第一條線索。虞舜做的動作是「耕」，這個動作發生在「歷山」。\n\n再看第二條線索。子路做的動作是「宿」，也就是過夜；這件事發生在「石門」。\n\n兩條線索都有相同的排列方式：\n\n動作／於／地點\n\n因此，目前可以推得：\n\n「戲於庭」表示在庭院裡玩耍。\n\n第一個選項把「於庭」誤解成離開庭院；第二個選項把地點誤當成被搬動的東西。只有第三個選項符合兩條古文線索提供的句型。\n\n把「群兒」也放回來，整句就是：\n\n一群孩子在庭院裡玩耍。\n\n我們現在只知道孩子們正在庭院玩，還不知道他們玩什麼，也不知道危險將怎麼發生。要繼續讀下一句，才能更新故事畫面。',
      finalDraftLine: '一群孩子在庭院裡玩耍',
    },
    {
      id: 'weng',
      type: 'evidence',
      prerequisiteIds: ['xi_yu_ting'],
      targetSentence: '一兒登甕',
      intro: '「甕」是什麼？我還不能確定。我找到兩句已經破解的古文，我們來比對看看。',
      clues: [
        {
          text: '抱甕而出灌。',
          highlight: '甕',
          unlockedMeaning: '有人抱著「甕」走出來，用它澆水。',
          source: '《莊子．天地》',
        },
        {
          text: '瀉熱脂於甕中。',
          highlight: '甕',
          unlockedMeaning: '把熱油倒進「甕」裡。',
          source: '《齊民要術．塗甕》',
        },
      ],
      question: '比較兩條古文線索，「甕」最可能是什麼？',
      options: ['一種可以裝水或油的容器', '一種用來挖土的工具', '一塊用來種菜的土地'],
      correctIndex: 0,
      correctFeedback: '破解成功！兩句古文都告訴我們：「甕」裡可以裝液體。',
      retryHint: '再比對一次：水可以用它來澆，熱油也可以倒進它的裡面。哪個選項同時符合這兩條線索？',
      explanation:
        '先看第一條線索。有人抱著「甕」去澆水，表示「甕」應該能夠裝水。\n\n再看第二條線索。熱油可以被倒進「甕」裡，表示「甕」的內部有空間，也能盛裝液體。\n\n兩條古文線索提供了相同的證據：\n\n水或油可以放進「甕」裡。\n\n因此，目前可以破解出：\n\n「甕」是一種可以盛裝水或油的容器。\n\n第一個選項能同時解釋兩條線索。第二個選項雖然和澆水、種菜的畫面有關，卻無法解釋為什麼熱油可以倒進它的「裡面」；第三個選項也不能被人抱起來，更不能用來裝熱油。\n\n現在還不能只靠這兩條線索確定故事裡的甕有多大。古文破譯家要保留這個問題，回到故事尋找新的證據。',
      keyAwarded: { code: '甕', decodedEvidence: '可以盛裝水或油的容器' },
    },
    {
      id: 'deng',
      type: 'evidence',
      prerequisiteIds: ['weng'],
      targetSentence: '一兒登甕',
      intro: '我們知道「甕」是一種容器了。可是孩子對它做了什麼？接著破解「登」。',
      clues: [
        {
          text: '登高而招。',
          highlight: '登',
          unlockedMeaning: '做完「登」這個動作後，人在高處揮手。',
          source: '《荀子．勸學》',
        },
        {
          text: '登泰山而小天下。',
          highlight: '登',
          unlockedMeaning: '做完「登」這個動作後，人在泰山上，覺得天下都變小了。',
          source: '《孟子．盡心上》',
        },
      ],
      question: '兩句中的人做完「登」這個動作後，位置都發生了什麼變化？',
      options: ['從較高的地方移到較低的地方', '從較低的地方移到較高的地方', '人留在原地，把手上的東西舉高'],
      correctIndex: 1,
      correctFeedback: '破解成功！兩句中的人做完「登」之後，都從較低的地方移到了較高的地方。',
      retryHint: '第一個人最後在高處，第二個人最後在泰山上。改變位置的是「人」，還是他手上的東西？',
      explanation:
        '第一條線索中，做完「登」這個動作後，人到了高處。\n\n第二條線索中，做完「登」這個動作後，人到了泰山上。\n\n兩條線索共同顯示：改變位置的是人，而且人的位置變高了。\n\n如果覺得是「從較高的地方移到較低的地方」，方向恰好和兩條線索相反——兩個人最後都到了更高的地方，不是更低。如果覺得「人留在原地，把手上的東西舉高」，那要問：兩條線索裡改變位置的，是人本身，還是他手上拿的東西？兩句都沒有提到有什麼東西被舉起來，改變位置的明明是人自己。\n\n因此，目前可以推得：\n\n「登」會讓人從較低的地方移到較高的地方。',
      keyAwarded: { code: '登', decodedEvidence: '向上爬到某個地方' },
    },
    {
      id: 'yi_er_deng_weng',
      type: 'reconstruction',
      prerequisiteIds: ['weng', 'deng'],
      targetSentence: '一兒登甕',
      intro: '兩個古文密碼都破解了。現在把線索放回故事，你能破解整句嗎？',
      keys: [
        { code: '甕', decodedEvidence: '可以盛裝水或油的容器' },
        { code: '登', decodedEvidence: '向上爬到某個地方' },
      ],
      question: '把兩把密碼鑰匙依照原句順序組合，「一兒登甕」最可能是哪一幅畫面？',
      options: ['一個孩子抱著甕走出去', '一個孩子把熱油倒進甕裡', '一個孩子爬到甕上面'],
      correctIndex: 2,
      correctFeedback: '整句破解成功！「一兒」是一個孩子，「登」是向上爬，「甕」是可以裝液體的容器。',
      retryHint: '不要只看哪一句曾經出現過。請把兩把密碼鑰匙接起來：「登」是什麼動作？「甕」又是什麼？',
      explanation:
        '目前已經找到兩把密碼鑰匙：\n\n「登」表示向上爬到某個地方。\n「甕」表示可以盛裝液體的容器。\n\n把它們依照原句的順序組合：\n\n一兒／登／甕\n一個孩子／向上爬到／甕上\n\n因此，「一兒登甕」表示：\n\n一個孩子爬到甕上面。\n\n第一、第二個選項都取自前面的古文線索，但那是幫助破解單字的其他故事，不是目前原句發生的事。只有第三個選項同時使用了「登」和「甕」的破解結果。\n\n這個答案不是直接由白話翻譯配對得來，而是先分別破解兩個古文密碼，再把它們放回原句組合出來。',
      finalDraftLine: '一個孩子爬到甕上',
    },
    {
      id: 'weng_size_inference',
      type: 'local_inference',
      prerequisiteIds: ['yi_er_deng_weng'],
      targetSentence: '一兒登甕',
      intro: '「一兒登甕」破解成功了。這個甕，可能有什麼我們原本不知道的特徵呢？',
      question: '一個孩子能夠爬到甕上面。故事裡的甕最可能是……',
      options: ['很小，只能放在手掌上', '有一定的大小，孩子可以攀爬', '薄得像一張紙'],
      correctIndex: 1,
      correctFeedback: '找到新證據了！這個甕不只可以裝水，還大到讓孩子爬上去。',
      retryHint: '想想看：手掌大小或紙一樣薄的東西，孩子爬得上去嗎？',
      explanation:
        '前兩條古文線索只能證明「甕」是一種能裝液體的容器，沒有告訴我們它有多大。\n\n回到故事後，「一兒登甕」又提供了一條新證據：一個孩子能夠爬到它上面。因此，故事裡的甕不會是只能放在手掌上的小容器，而應該有一定的大小。\n\n這一步讓我們理解：其他古文幫助我們破解一個字的基本意思；原文情境則會繼續補充這個字在故事裡的具體樣子。',
    },
    {
      id: 'zu_die',
      type: 'evidence',
      prerequisiteIds: ['weng_size_inference'],
      targetSentence: '足跌沒水中',
      intro: '孩子爬上甕後，接著發生了「足跌」。這是甚麼意思呢？我們找其他古文比對看看。',
      clues: [
        {
          text: '危梁慮足跌。',
          highlight: '足跌',
          unlockedMeaning: '走過危險的橋時，很擔心自己會發生「足跌」。',
          source: '唐．皇甫曾〈遇風雨作〉',
        },
        {
          text: '足跌，仆於地。',
          highlight: '足跌',
          unlockedMeaning: '他先發生「足跌」，接著整個身體倒在地上。',
          source: '節錄自《宋會要輯稿》所記曾公亮事；原文連寫作「足跌仆於地」，此處依事件層次加上現代標點。',
        },
      ],
      question: '第二條線索先寫「足跌」，接著才寫整個人倒地。你推測「足跌」最接近哪個畫面？',
      options: ['整個身體已經摔倒在地', '腳下不穩，身體失去平衡', '用腳用力踩住地面'],
      correctIndex: 1,
      correctFeedback: '破解成功！發生「足跌」時，人先失去平衡；整個身體倒下，是接著才可能發生的事。',
      retryHint: '再看第二條線索：古文為什麼在「足跌」之後，還要接著寫「仆於地」？這可能是前後兩個階段。',
      explanation:
        '先看第一條線索。古人在走過危險的橋時，擔心「足跌」。這個危險從腳下開始：腳如果沒有踩穩，身體就可能失去平衡。\n\n再看第二條線索。句子先寫「足跌」，接著才寫「仆於地」。其中「仆於地」是整個身體倒在地上。如果「足跌」本身就已經表示整個人摔倒，後面便不需要再說一次「仆於地」。\n\n兩條線索合起來，可以看出事件的先後：\n\n腳下不穩、失去支撐 → 身體可能接著倒下\n\n因此，目前可以破解出：\n\n「足跌」表示腳下不穩，使身體失去平衡。\n\n第一個選項描述的是後面的「仆於地」，不是「足跌」剛發生的階段。第三個選項表示把腳踩穩，反而和危險橋上的情況相反。只有第二個選項能同時解釋兩條古文線索。\n\n現在把破解結果放回故事：孩子站在甕上，突然「足跌」，也就是腳下失去支撐、身體失去平衡。至於他接著掉到哪裡、發生什麼事，還要繼續破解後面的「沒水中」。',
      keyAwarded: { code: '足跌', decodedEvidence: '腳下失去支撐，身體失去平衡' },
    },
    {
      id: 'mo_shui_zhong',
      type: 'evidence',
      prerequisiteIds: ['zu_die'],
      targetSentence: '足跌沒水中',
      intro: '孩子失去平衡後，「沒水中」了。「沒」在這裡不是「沒有」，讀作ㄇㄛˋ。我們找兩條古文線索來破解。',
      clues: [
        {
          text: '鼎沒水中。',
          highlight: '沒水中',
          unlockedMeaning: '一座大鼎發生了「沒水中」；後來人們必須進到水裡尋找，仍然沒有找到它。',
          source: '節錄自王充《論衡．儒增》「鼎沒水中彭城下」。',
        },
        {
          text: '太宗徵遼碑，半沒水中。',
          highlight: '沒水中',
          unlockedMeaning: '這塊石碑只有一半「沒水中」；人們還能摸讀露在外面的碑文。',
          source: '《太平廣記》卷七十引《北夢瑣言》。',
        },
      ],
      question: '一座鼎「沒水中」，一塊石碑則只有一半「沒水中」。你推測「沒水中」最可能是什麼？',
      options: ['從水裡被拉回岸上', '停在水面上漂浮', '進入水裡，被水蓋住'],
      correctIndex: 2,
      correctFeedback: '破解成功！整個「沒水中」會被水蓋住；「半沒水中」則只有一半在水面下。',
      retryHint: '再看石碑的線索：它只有「半沒水中」，所以一半在水面下，另一半還能露在哪裡？',
      explanation:
        '先看第一條線索。一座鼎「沒水中」後，人們必須進到水裡尋找，表示鼎已經進入水面以下，不再露在水面上。\n\n再看第二條線索。石碑只有「半沒水中」，所以石碑的一半在水面下，另一半仍然露在水面上。這個「半」幫助我們看清楚「沒」和水面的關係。\n\n兩條線索共同呈現的畫面是：\n\n物體越過水面，進入水裡，被水蓋住。\n\n因此，目前可以破解出：\n\n「沒水中」表示進入水裡，被水蓋住。\n\n第一個選項的方向相反，是從水裡回到岸上。第二個選項仍然停留在水面，沒有進入水面以下。只有第三個選項能同時解釋整座鼎「沒水中」和石碑「半沒水中」的差別。\n\n現在把破解結果放回故事：孩子發生「足跌」後，身體進入甕裡的水中，被水蓋住。\n\n僅憑「沒水中」，我們只能知道孩子的身體沒入水裡，不能直接說他已經淹死。故事還要繼續讀，才能知道後來發生什麼事。',
      keyAwarded: { code: '沒水中', decodedEvidence: '進入水裡，被水蓋住' },
    },
    {
      id: 'zu_die_mo_shui_zhong',
      type: 'reconstruction',
      prerequisiteIds: ['zu_die', 'mo_shui_zhong'],
      targetSentence: '足跌沒水中',
      intro: '兩個密碼都破解了。現在依照古文的順序，把事情接起來。',
      keys: [
        { code: '足跌', decodedEvidence: '腳下失去支撐，身體失去平衡' },
        { code: '沒水中', decodedEvidence: '進入水裡，被水蓋住' },
      ],
      question: '依照原文順序組合兩把密碼鑰匙，「足跌沒水中」最可能是哪一幅畫面？',
      options: ['孩子腳下不穩、失去平衡，接著沒入水中', '孩子站穩在甕上，接著浮在水面上', '孩子從水裡回到岸上，接著爬上甕'],
      correctIndex: 0,
      correctFeedback: '整句破解成功！孩子先失去平衡，接著身體沒入水中。',
      retryHint: '按照原句順序排列兩把密碼鑰匙：「足跌」先發生，接著才是「沒水中」。',
      explanation:
        '我們已經取得兩把密碼鑰匙：\n\n「足跌」表示腳下失去支撐，身體失去平衡。\n「沒水中」表示進入水裡，被水蓋住。\n\n把它們依照原文順序接起來：\n\n足跌／沒水中\n腳下不穩、失去平衡／接著身體沒入水中\n\n因此，「足跌沒水中」表示：\n\n孩子腳下不穩、失去平衡，接著身體沒入水中。\n\n第二個選項把「足跌」和「沒」都改成相反的畫面；第三個選項不但方向相反，事件順序也和原文不同。只有第一個選項能依照古文順序組合兩把密碼鑰匙。',
      finalDraftLine: '孩子腳下不穩、失去平衡，接著沒入水中',
    },
    {
      id: 'zhong',
      type: 'evidence',
      prerequisiteIds: ['zu_die_mo_shui_zhong'],
      targetSentence: '眾皆棄去',
      intro: '孩子沒入水中之後，古文接著寫「眾皆棄去」。「眾」是指誰呢？我找到兩句已經破解的古文，我們來比對看看。',
      clues: [
        {
          text: '寡固不可以敵眾。',
          highlight: '眾',
          unlockedMeaning: '人數少的一方不能戰勝「眾」。',
          source: '《孟子．梁惠王上》',
        },
        {
          text: '與少樂樂，與眾樂樂，孰樂？',
          highlight: '眾',
          unlockedMeaning: '跟少數人一起聽音樂比較快樂，還是跟「眾」一起聽音樂比較快樂？',
          source: '《孟子．梁惠王下》',
        },
      ],
      question: '第一條線索把人數少的一方和「眾」放在交戰的兩邊；第二條線索把少數人和「眾」放在比較的兩邊。「眾」最可能指什麼？',
      options: ['人數比「少、寡」更多的一群人', '比「少、寡」人數更少的人', '一個沒有人的地方'],
      correctIndex: 0,
      correctFeedback: '破解成功！兩條線索都把「眾」放在「少、寡」的對面，「眾」是人數比較多的那一邊。',
      retryHint: '兩條線索裡，「眾」都是跟「少」或「寡」放在一起比較。「少」「寡」是人數多還是人數少？「眾」又是哪一邊？',
      explanation:
        '第一條線索「寡固不可以敵眾」，把人數少的一方（寡）放在打不贏的那一邊，「眾」放在對面。\n\n第二條線索「與少樂樂，與眾樂樂」，把「少」（少數人）和「眾」放在一起比較，問哪一種比較快樂。\n\n兩條線索共同顯示：\n\n「眾」都是跟「少」「寡」相對放在一起，而「少」「寡」都是指人數少的一方。\n\n因此，目前可以推得：\n\n「眾」是跟「少、寡」相對、人數比較多的一群人。\n\n第二個選項把「眾」誤會成人數更少，方向剛好相反。第三個選項提到「沒有人的地方」，但兩條線索講的都是「人數多寡的比較」，沒有講到地方或空間。只有第一個選項符合兩條線索共同呈現的對比關係。',
      keyAwarded: { code: '眾', decodedEvidence: '跟「少、寡」相對、人數比較多的一群人' },
    },
    {
      id: 'jie',
      type: 'evidence',
      prerequisiteIds: ['zhong'],
      targetSentence: '眾皆棄去',
      intro: '「眾」是一大群人了，那「皆」又是什麼意思呢？我找到兩句已經破解的古文，我們來比對看看。',
      clues: [
        {
          text: '左右皆泣，莫能仰視。',
          highlight: '皆',
          unlockedMeaning: '項羽身邊的人「皆」哭了，沒有人能抬起頭看他。',
          source: '《史記．項羽本紀》',
        },
        {
          text: '陳勝、吳廣皆次當行，為屯長。',
          highlight: '皆',
          unlockedMeaning: '陳勝和吳廣「皆」被編在同一批要去戍守的隊伍裡，一起擔任隊長。',
          source: '《史記．陳涉世家》',
        },
      ],
      question: '兩條線索裡的「皆」都在說什麼？',
      options: ['全部，沒有例外', '只有一部分，不是全部', '只有其中一個人，不是很多人'],
      correctIndex: 0,
      correctFeedback: '破解成功！「皆」表示全部都是這樣，沒有例外。',
      retryHint: '第一條線索裡，項羽身邊的人是「一部分」哭了，還是「全部」都哭了？',
      explanation:
        '先看第一條線索。「左右皆泣，莫能仰視」是說，項羽身邊的人全都哭了，沒有人能抬頭看他——不是有些人哭、有些人沒哭，而是全部的人都一樣。\n\n再看第二條線索。「陳勝、吳廣皆次當行，為屯長」是說，陳勝和吳廣兩個人都被編進同一批隊伍、一起當隊長，沒有誰是例外。\n\n兩條線索共同顯示：\n\n只要用「皆」，就表示全部都是同一種情況，沒有例外。\n\n因此，目前可以推得：\n\n「皆」表示全部，沒有例外。\n\n第二個選項說「只有一部分」，但兩條線索講的都是全部的人，不是一部分。第三個選項把範圍縮小成一個人，但兩條線索都至少有兩個以上的人，方向完全相反。只有第一個選項符合兩條線索。',
      keyAwarded: { code: '皆', decodedEvidence: '全部，沒有例外' },
    },
    {
      id: 'qi_qu',
      type: 'evidence',
      prerequisiteIds: ['jie'],
      targetSentence: '眾皆棄去',
      intro: '「眾」和「皆」都破解了。這一大群孩子看見有人沒入水中，接著「棄去」了。這是甚麼意思呢？我們找古文線索比對。',
      clues: [
        {
          text: '長者加以金銀華美之服，輒羞赧棄去之。',
          highlight: '棄去',
          unlockedMeaning: '大人替司馬光穿上華麗的衣服，他覺得很不好意思，立刻把衣服「棄去」。',
          source: '司馬光〈訓儉示康〉。',
        },
        {
          text: '醫皆棄去。女見醫去，更益驚惶。',
          highlight: '棄去',
          unlockedMeaning: '醫生們全都「棄去」；女子看見醫生離開，變得更加害怕。',
          source: '《根本說一切有部毘奈耶雜事》卷三十。',
        },
      ],
      question: '司馬光不再穿那件華服，醫生們也不再留下來醫治。你推測「棄去」最接近哪一種意思？',
      options: ['把眼前的人或東西留下，不再理會', '把人或東西帶在身邊一起走', '留在原地繼續照顧或使用'],
      correctIndex: 0,
      correctFeedback: '破解成功！「棄去」不只是離開，還有把人或東西留下、不再理會的意思。',
      retryHint: '比較兩條線索：華服後來沒有繼續穿，醫生也沒有繼續留下來治療。他們共同停止了什麼？',
      explanation:
        '先看第一條線索。大人替年幼的司馬光穿上華麗衣服，他覺得不好意思，便把衣服「棄去」。這件衣服沒有被繼續穿著，而是被放下、不再使用。\n\n再看第二條線索。醫生們「棄去」後，女子看見醫生離開，變得更加害怕。這表示醫生不再留下來治療，把她和眼前的問題留在原處。\n\n兩條線索共同呈現的是：\n\n把眼前的人或東西留下，不再繼續照顧、處理或使用。\n\n因此，目前可以破解出：\n\n「棄去」表示丟下不管，離開或不再理會。\n\n第二個選項表示把人或東西一起帶走，和兩條線索都相反。第三個選項表示繼續留下來照顧或使用，也無法解釋華服被放下、醫生離開的畫面。只有第一個選項能同時解釋兩條古文線索。\n\n現在把破解結果放回故事：其他孩子看見同伴沒入水中，卻把他留在那裡，不再理會，並且離開了現場。\n\n僅憑「棄去」，我們還不能確定其他孩子為什麼離開。可能是害怕，也可能想去找人幫忙；原文沒有說明，所以不能把原因當成已經破解的事實。',
      keyAwarded: { code: '棄去', decodedEvidence: '把人或東西留下，不再理會，並且離開' },
    },
    {
      id: 'zhong_jie_qi_qu',
      type: 'reconstruction',
      prerequisiteIds: ['qi_qu', 'zhong', 'jie'],
      targetSentence: '眾皆棄去',
      intro: '「眾」「皆」「棄去」都破解了。現在把三把密碼鑰匙放進故事，看看有多少孩子離開。',
      keys: [
        { code: '眾', decodedEvidence: '跟「少、寡」相對、人數比較多的一群人' },
        { code: '皆', decodedEvidence: '全部，沒有例外' },
        { code: '棄去', decodedEvidence: '把人或東西留下，不再理會，並且離開' },
      ],
      question: '把三把密碼鑰匙依照原文順序組合，「眾皆棄去」最可能是哪一幅畫面？',
      options: ['只有一個孩子離開，其他人留下幫忙', '其他孩子全都把落水的孩子丟下，離開現場', '所有孩子一起把甕搬離庭院'],
      correctIndex: 1,
      correctFeedback: '整句破解成功！其他孩子全都離開了，沒有人留下來幫忙。',
      retryHint: '注意「皆」：它表示全部，不是只有一個，也不是其中幾個。',
      explanation:
        '這句有三把密碼鑰匙：\n\n「眾」是人數比較多的一群人。\n「皆」表示全部，沒有例外。\n「棄去」表示把人留下、不再理會，並且離開。\n\n回到故事：「群兒戲於庭」告訴我們，在場的本來就是一群一起玩耍的孩子；扣掉沒入水中的那個孩子，「眾」在這裡指的就是其他在場的那群孩子。\n\n把三把鑰匙依照原文順序組合：\n\n眾／皆／棄去\n其他孩子們／全部／把同伴丟下並離開\n\n因此，「眾皆棄去」表示：\n\n其他孩子全都把落水的孩子丟下，離開現場。\n\n第一個選項把「皆」誤解成只有一個人；第三個選項雖然保留了「所有孩子」，卻把「棄去」的對象錯換成甕，也增加了原文沒有的搬運動作。只有第二個選項符合三把密碼鑰匙。\n\n下一句馬上出現「光持石……」，表示司馬光沒有跟著離開。這裡的「眾」是在司馬光之外、先行離去的其他孩子。',
      finalDraftLine: '其他孩子全都把他留下並離開',
    },
    {
      id: 'chi_shi_ji_weng',
      type: 'evidence',
      prerequisiteIds: ['zhong_jie_qi_qu'],
      targetSentence: '光持石擊甕破之',
      intro: '司馬光沒有跟著其他孩子離開。古文寫他「持石擊甕」。這到底是什麼動作？',
      clues: [
        {
          text: '人或持石擊地，自遠至磚中，則磚中若雞棲之聲。',
          highlight: '持石擊地',
          unlockedMeaning: '有人有時會「持石擊地」，聲音便從遠處傳入磚中，磚裡發出像雞棲息時的聲音。',
          source: '郎瑛《七修類稿》卷二。',
        },
        {
          text: '某歸聞之，怒，持杖擊之。鬼出沒四隅，變化倏忽，杖莫能中。',
          highlight: '持杖擊之',
          unlockedMeaning: '那個人回來聽見這件事，非常生氣，便「持杖擊之」；鬼在四周迅速閃避，木杖怎麼也打不中它。',
          source: '徐鉉《稽神錄》卷三。',
        },
      ],
      question: '比較兩條古文線索，再回到原文：「持石擊甕」到底是什麼動作？',
      options: ['把石頭放進甕裡', '拿著甕去撞石頭', '拿著石頭敲打甕'],
      correctIndex: 2,
      correctFeedback: '破解成功！兩條線索都顯示：前面的東西被使用，動作是朝著後面的對象進行的。',
      retryHint: '第一條中，發出聲音的是地面；第二條中，木杖想要打中的是鬼。看看「擊」後面接的是哪個對象。',
      explanation:
        '第一條線索中，做完「持石擊地」後，地面與磚中傳出聲音。這表示動作落在「地」上，而石頭是人使用的東西。\n\n第二條線索中，做完「持杖擊之」時，木杖一直無法打中鬼。這表示木杖是被使用的東西，而「之」所指的鬼是動作想要擊中的對象——即使沒打中，木杖朝向的目標仍然是鬼，不是別的東西。\n\n兩條線索共同呈現：\n\n持／使用的東西／擊／動作指向的對象\n\n放回原文：\n\n持／石／擊／甕\n\n因此，「持石擊甕」最可能表示：\n\n拿著石頭敲打甕。\n\n第一個選項「把石頭放進甕裡」沒有出現在兩條線索的畫面裡——兩條線索都是「打」的動作，不是「放進去」。第二個選項「拿著甕去撞石頭」把工具和目標的位置整個對調，跟兩條線索呈現的方向相反。只有第三個選項同時符合兩條線索「前面是使用的東西、後面是動作指向的對象」的關係。\n\n目前只破解到司馬光用石頭敲甕；甕後來是否破掉，還要繼續破解後面的「破之」。',
      keyAwarded: { code: '持石擊甕', decodedEvidence: '拿著石頭敲打甕' },
    },
    {
      id: 'zhi_reference',
      type: 'evidence',
      prerequisiteIds: ['chi_shi_ji_weng'],
      targetSentence: '光持石擊甕破之',
      intro: '「光持石擊甕破之」最後出現一個「之」。「之」沒有說出名字，我們得沿著前文追查它指的是誰。',
      clues: [
        {
          text: '屠暴起，以刀劈狼首，又數刀斃之。',
          highlight: '之',
          unlockedMeaning: '屠夫突然起身，先用刀劈狼的頭，又砍了幾刀，使「之」死去。',
          source: '蒲松齡《聊齋志異．狼三則》。',
        },
        {
          text: '康肅笑而遣之。',
          highlight: '之',
          unlockedMeaning: '賣油翁說完話後，陳康肅笑著讓「之」離開。',
          source: '歐陽修《歸田錄．賣油翁》。',
        },
      ],
      question: '回到「光持石擊甕破之」：石頭是工具，甕是被敲打的目標，而且「之」接在「破」後面。這個「之」最可能指向什麼？',
      options: ['石頭', '甕', '落水的孩子'],
      correctIndex: 1,
      correctFeedback: '指向破解成功！「之」指回前面的甕，也就是司馬光把甕打破了。',
      retryHint: '看「破」這個動作接續在哪個目標後面：司馬光用石頭敲的是什麼？',
      explanation:
        '先看第一條線索。句子沒有再次寫「狼」，而用「之」承接。因為前面被刀劈、後面被殺死的都是同一隻狼，所以「之」指回狼。\n\n再看第二條線索。陳康肅面前的人是賣油翁；最後被他送走的人也應該是賣油翁，所以「之」指回賣油翁。\n\n兩條線索共同告訴我們：\n\n「之」可以不重複名稱，而指回前文已經出現、又能承受後面動作的人或物。\n\n回到故事，句子先寫「擊甕」，接著寫「破之」。被石頭敲打、也能被打破的對象是甕，因此：\n\n「之」指的是甕。\n\n第一個選項的石頭是敲打工具，不是這一串動作中的目標。第三個選項的孩子雖然在前文出現，卻不是司馬光敲打或打破的對象。只有第二個選項符合動作關係。\n\n僅憑這句，我們知道甕被打破，但還不知道破口多大，也不知道水會怎麼移動。下一句會提供新的結果。',
      keyAwarded: { code: '之（破之）', decodedEvidence: '指回甕' },
    },
    {
      id: 'guang_breaks_weng',
      type: 'reconstruction',
      prerequisiteIds: ['chi_shi_ji_weng', 'zhi_reference'],
      targetSentence: '光持石擊甕破之',
      intro: '工具、目標和「之」的指向都找到了。現在把四把鑰匙依照原文順序接起來。',
      keys: [
        { code: '光', decodedEvidence: '司馬光' },
        { code: '持石擊甕', decodedEvidence: '拿著石頭敲打甕' },
        { code: '破', decodedEvidence: '打破' },
        { code: '之', decodedEvidence: '指回甕' },
      ],
      question: '把四把密碼鑰匙依照原文順序組合，「光持石擊甕破之」最可能是哪一幅畫面？',
      options: ['司馬光拿起甕敲石頭，結果石頭破了', '司馬光拿著石頭敲打甕，把甕打破', '司馬光拿著石頭敲打孩子，再把甕搬走'],
      correctIndex: 1,
      correctFeedback: '救援動作破解成功！司馬光使用石頭，把困住水的甕打破。',
      retryHint: '先確認兩件事：「持」後面是哪個工具？「之」又指回哪個目標？',
      explanation:
        '我們已經取得四把鑰匙：\n\n「光」是司馬光。\n「持石擊甕」是拿著石頭敲甕。\n「破」是打破。\n「之」指回甕。\n\n把它們接起來：\n\n光／持石擊甕／破之\n司馬光／拿石頭敲甕／把甕打破\n\n因此，整句表示：\n\n司馬光拿著石頭敲打甕，把甕打破。\n\n第一個選項顛倒了工具與目標，也把「之」錯指成石頭。第三個選項把孩子變成敲打目標，還增加了原文沒有的搬運動作。只有第二個選項使用了全部密碼鑰匙。',
      finalDraftLine: '司馬光拿石頭敲甕，把甕打破',
    },
    {
      id: 'beng',
      type: 'evidence',
      prerequisiteIds: ['guang_breaks_weng'],
      targetSentence: '水迸',
      intro: '甕破了，下一句只有兩個字：「水迸」，讀作ㄅㄥˋ。水做了什麼？我們找兩個水的畫面來比對。',
      clues: [
        {
          text: '銀瓶乍破水漿迸。',
          highlight: '迸',
          unlockedMeaning: '詩句想像一個銀瓶突然破裂；瓶裡的液體隨即「迸」。',
          source: '白居易〈琵琶行〉。',
        },
        {
          text: '院東泉水迸出，因甃為方池。',
          highlight: '迸出',
          unlockedMeaning: '院子東邊的泉水「迸出」，人們因此砌了一座方形水池來承接。',
          source: '潛說友《咸淳臨安志》。',
        },
      ],
      question: '一個瓶子突然破裂後液體「迸」，一處泉水「迸出」後需要水池承接。你推測「迸」最接近哪個畫面？',
      options: ['水留在原處，完全沒有移動', '水突然向外湧出、四散', '水慢慢結成堅硬的冰'],
      correctIndex: 1,
      correctFeedback: '破解成功！「水迸」不是水靜止，而是水突然向外湧出。',
      retryHint: '注意兩個結果：瓶子已經破了，泉水還需要一座池子承接。水的移動方向會是哪裡？',
      explanation:
        '先看第一條線索。銀瓶突然破裂，原本被瓶子裝住的液體不再留在裡面，而是向外衝出。\n\n再看第二條線索。泉水「迸出」後，人們特地砌水池承接，表示水從原來的位置向外湧出，而且不是完全靜止的。\n\n兩條線索共同呈現的畫面是：\n\n液體突然離開原本的位置，向外湧出或四散。\n\n因此，目前可以破解出：\n\n「迸」表示突然向外湧出、四散。\n\n第一個選項無法解釋破瓶中的水和需要承接的泉水。第三個選項描述液體變成冰，兩條古文都沒有提供低溫或結冰的證據。只有第二個選項符合兩個畫面。\n\n把它放回故事：\n\n甕被打破後，裡面的水突然向外湧出。\n\n古文沒有說水量有多少、流了多久；目前只能確定水不再被完整的甕困住，而是從破口向外流出。',
      finalDraftLine: '水突然向外湧出',
    },
    {
      id: 'de_huo',
      type: 'evidence',
      prerequisiteIds: ['beng'],
      targetSentence: '兒得活',
      intro: '水湧出去後，古文說「兒得活」。這是甚麼意思呢？',
      clues: [
        {
          text: '幾死，眾救得活。',
          highlight: '得活',
          unlockedMeaning: '一個人本來幾乎要死了，經過眾人救援後「得活」。',
          source: '陶宗儀《輟耕錄》卷九；教材只節錄生死與救援的必要部分。',
        },
        {
          text: '常歲活人以四五十計，不十年而得活者四五百人矣。',
          highlight: '得活',
          unlockedMeaning: '救援船每年救下數十名遇險者；不到十年，已有四五百人「得活」。',
          source: '姜宸英〈京口義渡贍產碑記〉，亦見《江南通志》卷二十六。',
        },
      ],
      question: '兩條線索中的人都曾接近死亡，經過救援後才「得活」。這個結果最可能是什麼？',
      options: ['完全沒有受傷，立刻恢復原狀', '得到食物或獎品', '保住性命，活了下來'],
      correctIndex: 2,
      correctFeedback: '最後一道密碼破解成功！孩子從危險中活了下來。',
      retryHint: '比較危險前後：兩條線索都先接近死亡，後來沒有死去。哪個選項只說出證據能確定的結果？',
      explanation:
        '先看第一條線索。那個人原本「幾死」，也就是幾乎要死；眾人救援後，他「得活」。前後最明顯的改變是性命被保住。\n\n再看第二條線索。救援船幫助在江上遇險的人，數年之間有四五百人「得活」。這些人沒有成為溺水死者，而是經由救援活了下來。\n\n兩條線索共同提供的結果是：\n\n原本面臨死亡的人，經過救援後保住性命。\n\n因此，目前可以破解出：\n\n「得活」表示活下來、保住性命。\n\n第一個選項說得太多。「得活」只能證明沒有死亡，不能證明完全沒受傷或立刻恢復。第二個選項把「得」理解成收到物品，無法解釋兩條線索中的生死危險。只有第三個選項符合全部證據。\n\n把它放回故事：\n\n「兒得活」表示那個沒入水中的孩子最後活了下來。\n\n古文沒有繼續描述孩子是否受傷、是否需要休息，因此不能把這些未知情況自行補進答案。',
      finalDraftLine: '孩子保住性命、活了下來',
    },
    {
      id: 'full_text_reconstruction',
      type: 'reconstruction',
      prerequisiteIds: ['de_huo'],
      targetSentence: '群兒戲於庭，一兒登甕，足跌沒水中。眾皆棄去，光持石擊甕破之，水迸，兒得活。',
      intro: '所有短句都破解了。最後一次任務：哪一條事件鏈完全符合古文的順序？',
      keys: [
        { code: '群兒戲於庭', decodedEvidence: '一群孩子在庭院裡玩耍' },
        { code: '一兒登甕', decodedEvidence: '一個孩子爬到甕上' },
        { code: '足跌沒水中', decodedEvidence: '孩子腳下不穩、失去平衡，接著沒入水中' },
        { code: '眾皆棄去', decodedEvidence: '其他孩子全都把他留下並離開' },
        { code: '光持石擊甕破之', decodedEvidence: '司馬光拿石頭敲甕，把甕打破' },
        { code: '水迸', decodedEvidence: '水突然向外湧出' },
        { code: '兒得活', decodedEvidence: '孩子保住性命、活了下來' },
      ],
      question: '哪一條事件鏈完全符合古文的順序？',
      options: [
        '孩子沒入水中 → 水先自己流出 → 司馬光才打破甕 → 孩子活下來',
        '孩子爬上甕 → 失去平衡、沒入水中 → 其他孩子離開 → 司馬光打破甕 → 水湧出 → 孩子活下來',
        '司馬光先打破甕 → 孩子再爬上甕 → 其他孩子把水倒回去 → 孩子活下來',
      ],
      correctIndex: 1,
      correctFeedback: '全文重建成功！你不是背出翻譯，而是用九把密碼鑰匙還原了整個事件。',
      retryHint: '回到原文逐句核對：危險先發生，還是甕先被打破？「水迸」又出現在「破之」之前還是之後？',
      explanation:
        '第二個選項依照原文逐步前進：\n\n1. 孩子先爬上甕。\n2. 接著腳下失去支撐，沒入水中。\n3. 其他孩子全都離開。\n4. 司馬光留下來，用石頭打破甕。\n5. 水從破口向外湧出。\n6. 孩子因此活下來。\n\n第一個選項把「水迸」放在打破甕以前，破壞了原文的事件順序。第三個選項不但倒置開頭，還增加「把水倒回去」這個古文沒有的動作。只有第二個選項能使用所有已破解的證據。',
    },
    {
      id: 'rescue_causal_chain',
      type: 'story_reasoning',
      prerequisiteIds: ['full_text_reconstruction'],
      targetSentence: '足跌沒水中 → 光持石擊甕破之 → 水迸',
      intro: '已破解的三個畫面是「孩子沒水中」→「甕破之」→「水迸」。哪一條因果推論最有證據？',
      question: '哪一條因果推論最有證據？',
      options: ['甕破後，水向外湧出，孩子不再一直被困在甕裡的水中', '甕破後，孩子爬到另一個更高的甕上', '石頭碰到甕後，水立刻變成冰'],
      correctIndex: 0,
      correctFeedback: '因果關係破解成功！甕破、水出，孩子才不再被困住。',
      retryHint: '這三個已破解的畫面裡，完全沒有出現另一個甕，也沒有出現結冰的線索。',
      explanation:
        '孩子面臨的危險是身體沒入甕中的水。司馬光打破甕後，緊接著出現「水迸」，說明水從破口向外流出。水離開甕，孩子也就不再一直被困在原來的水中。\n\n第二個選項增加了另一個甕，第三個選項增加了結冰；兩者都沒有古文證據。第一個選項把三個已破解畫面連成一條合理的因果鏈。',
    },
    {
      id: 'evidence_boundary_sima_guang',
      type: 'story_reasoning',
      prerequisiteIds: ['rescue_causal_chain'],
      targetSentence: '眾皆棄去，光持石擊甕破之',
      intro: '下面哪一件事可以直接從古文確定，而不是我們替司馬光猜測的內心？',
      question: '下面哪一件事可以直接從古文確定，而不是我們替司馬光猜測的內心？',
      options: ['司馬光完全不害怕', '司馬光早就知道甕一定會一次打破', '司馬光沒有隨其他孩子離開，而且採取了救援行動'],
      correctIndex: 2,
      correctFeedback: '證據邊界判斷成功！你分清楚了「文字寫的」和「我們猜的」。',
      retryHint: '古文有沒有直接寫出司馬光「不害怕」，或「早就知道會成功」？找找看原文裡到底寫了什麼。',
      explanation:
        '原文寫「眾皆棄去」，下一句卻是「光持石擊甕破之」。這能直接證明：其他孩子離開時，司馬光仍留在現場，並拿石頭打破甕。\n\n但是，古文沒有寫司馬光心裡是否害怕，也沒有寫他動手前能不能確定一次成功。第一、第二個選項都把沒有出現在文字裡的內心狀態當成事實。第三個選項只使用原文可見的行動證據。\n\n這一題想讓我們分清楚「文字直接提供的證據」與「讀者可能做出的想像」，避免把合理猜測誤認為原文事實。',
    },
  ],
  finalVerification: {
    prerequisiteStepIds: [
      'xi_yu_ting',
      'weng',
      'deng',
      'yi_er_deng_weng',
      'weng_size_inference',
      'zu_die',
      'mo_shui_zhong',
      'zu_die_mo_shui_zhong',
      'qi_qu',
      'zhong',
      'jie',
      'zhong_jie_qi_qu',
      'chi_shi_ji_weng',
      'zhi_reference',
      'guang_breaks_weng',
      'beng',
      'de_huo',
      'full_text_reconstruction',
      'rescue_causal_chain',
      'evidence_boundary_sima_guang',
    ],
    guideLine: '比一比：白話文有沒有改變故事的順序？哪些地方和你的破譯相同？哪些只是換了一種比較順的現代說法？',
    translation:
      '一群孩子在庭院裡玩耍。其中一個孩子爬上大甕，腳下失去支撐，身體沒入甕裡的水中。其他孩子全都丟下他跑開了，司馬光拿起石頭，把甕打破。水湧了出來，那個孩子因此得救了。',
    comparisonRows: [
      { decodedEvidence: '戲於庭', vernacularExpression: '在庭院裡玩耍', relationship: '同一畫面' },
      { decodedEvidence: '登甕', vernacularExpression: '爬上大甕', relationship: '「大」來自孩子能攀爬的本篇情境' },
      {
        decodedEvidence: '足跌沒水中',
        vernacularExpression: '腳下失去支撐，身體沒入甕裡的水中',
        relationship: '白話文把原因與結果說得更順',
      },
      { decodedEvidence: '眾皆棄去', vernacularExpression: '其他孩子全都丟下他跑開', relationship: '同一事件' },
      { decodedEvidence: '持石擊甕破之', vernacularExpression: '拿起石頭，把甕打破', relationship: '省略重複的敲打過程，保留結果' },
      { decodedEvidence: '水迸', vernacularExpression: '水湧了出來', relationship: '同一方向與動態' },
      { decodedEvidence: '兒得活', vernacularExpression: '孩子因此得救', relationship: '同一生存結果' },
    ],
    completionFeedback:
      '驗證完成！你先用其他古文找線索，再把密碼放回原文，最後才讀白話文核對。這篇古文不是別人翻譯給你的，是你一步一步破解出來的。',
  },
};

export const legacyKeZhouQiuJianLesson: GuwenLesson = {
  id: 'ke-zhou-qiu-jian',
  title: '刻舟求劍',
  source: '《呂氏春秋．察今》',
  introSpokenLine: '我找到一篇古文，說的是一位渡江的楚國人和他掉進水裡的劍。你願意當古文破譯家，陪我找線索嗎？',
  fullText:
    '楚人有涉江者，其劍自舟中墜於水，遽契其舟曰：「是吾劍之所從墜。」舟止，從其所契者入水求之。舟已行矣，而劍不行，求劍若此，不亦惑乎？',
  sentences: [
    '楚人有涉江者，',
    '其劍自舟中墜於水，',
    '遽契其舟曰：「是吾劍之所從墜。」',
    '舟止，從其所契者入水求之。',
    '舟已行矣，而劍不行，',
    '求劍若此，不亦惑乎？',
  ],
  steps: [
    {
      id: 'she_jiang',
      type: 'evidence',
      prerequisiteIds: [],
      targetSentence: '楚人有涉江者',
      intro: '故事一開始出現一位「涉江者」。「涉江」到底形成什麼畫面？先查看兩條已經破解一部分的古文線索。',
      clues: [
        {
          text: '送子涉淇，至于頓丘。',
          highlight: '涉淇',
          unlockedMeaning: '（淇是一條河的名字。）我陪你「涉淇」，一直送到頓丘。',
          source: '《詩經．衛風．氓》',
        },
        {
          text: '子惠思我，褰裳涉溱。',
          highlight: '涉溱',
          unlockedMeaning: '（溱水是一條河的名字。）如果你想念我，就提起衣裳，「涉溱」來找我。',
          source: '《詩經．鄭風．褰裳》',
        },
      ],
      question:
        '第一條線索中，淇是一條河；一行人「涉淇」後，又繼續到了頓丘。第二條線索中，人先提起衣裳，再到溱水邊「涉溱」來找對方。比較兩條線索，「涉」最可能造成哪一種位置變化？',
      options: ['從水域的一邊移動到另一邊', '停在水邊，不再繼續前進', '沿著岸邊往原來的方向走回去'],
      correctIndex: 0,
      correctFeedback: '破解成功！兩條線索都顯示，人不是停在水邊，而是要通過水域，繼續前往後面的目的地。',
      retryHint: '再看一次人物前後的位置：一個人最後到了頓丘；另一個人提起衣裳，準備到對方那裡。如果只停在水邊，能完成這兩件事嗎？',
      explanation:
        '先看第一條線索的移動路線：說話的人送對方來到淇水，陪他涉淇，最後又送到頓丘。涉淇不會只是停在淇水旁邊，否則人物無法繼續到達後面的地點。\n\n再看第二條線索的準備動作：想去找對方的人先褰裳，也就是提起衣裳，接著才要涉溱。提起衣裳和溱水同時出現，表示接下來的移動會經過水域，而不是沿著岸邊折返。\n\n兩條線索的共同證據是：\n\n人物面前都有一條水域；\n人物都要繼續前往另一個目的地；\n「涉」位在接近水域之後、繼續前進之前。\n\n因此，「涉」在這些句子裡表示通過水域，從一邊往另一邊移動。「江」是河流，所以「涉江」形成的畫面是越過一條河。\n\n目前古文只讓我們確定「越過河流」這件事，還沒有單靠這四個字說明使用哪一種工具。後文出現「舟」，才會補上故事中的交通方式。破譯時不能把後來才知道的情報，偷偷塞回眼前的古文裡。\n\n「停在水邊」無法解釋第一條線索為何接著到達頓丘，也無法完成第二條線索中前去找人的目的。「沿岸走回去」與兩條線索持續朝目的地前進的方向相反，而且不能解釋為什麼要先提起衣裳。',
    },
    {
      id: 'chu_ren_you_she_jiang_zhe',
      type: 'local_inference',
      prerequisiteIds: ['she_jiang'],
      targetSentence: '楚人有涉江者',
      intro:
        '「涉江」已經破解了；「楚人」是楚國人。「有……者」不必另外背一把密碼鑰匙。現在請你親手把線索放回原句：故事一開始出現了什麼人？',
      question:
        '「涉江」已經破解了；「楚人」是楚國人。「有……者」不必另外背一把密碼鑰匙。現在請你親手把線索放回原句：故事一開始出現了什麼人？',
      options: ['有一位楚國人正在越過一條河', '有一位楚國人站在岸邊看別人渡河', '有一位楚國人在河裡尋找掉落的東西'],
      correctIndex: 0,
      correctFeedback:
        '整句重建成功！「楚人有涉江者」表示：有一位楚國人正在越過一條河。古文目前只讓我們知道他正在渡河，還沒有說他為什麼渡河。',
      retryHint: '先抓住已破解的「涉江」：這個人正在通過一條河。哪個選項沒有偷偷加入「看別人」或「找東西」？',
      explanation:
        '「楚人」指出人物來自楚國；已破解的「涉江」表示通過一條河。把兩項證據依照原文組合，便能重建為「有一位楚國人正在越過一條河」。\n\n第二個選項把「涉江」改成站在岸邊觀看；第三個選項加入後文才會出現的尋找動作，都不符合眼前這句古文。\n\n回到連續原文：楚人有涉江者。\n\n目前讀懂的故事：有一位楚國人正在越過一條河。\n\n證據邊界：這句沒有交代渡河的目的，也沒有說他使用什麼方式渡河；後文出現「舟」後，才能知道故事裡有船。',
      finalDraftLine: '有一位楚國人正在越過一條河',
    },
    {
      id: 'qi_jian',
      type: 'evidence',
      prerequisiteIds: ['chu_ren_you_she_jiang_zhe'],
      targetSentence: '其劍自舟中墜於水',
      intro: '新的句子出現「其劍」。這把劍和前面哪個人有關？先看看其他古文中的「其」會怎麼指路。',
      clues: [
        {
          text: '梁國楊氏子，九歲，甚聰惠。孔君平詣其父。',
          highlight: '其',
          unlockedMeaning: '梁國楊家的孩子九歲，非常聰明。孔君平前去拜訪「其」父親。',
          source: '《世說新語．言語》',
        },
        {
          text: '曾子之妻之市，其子隨之而泣。',
          highlight: '其',
          unlockedMeaning: '曾子的妻子前往市場，「其」兒子跟在後面哭泣。',
          source: '《韓非子．外儲說左上》',
        },
      ],
      question: '比較兩條線索，「其」最可能在做什麼？',
      options: ['提醒我們回頭找前面已經提到的人', '提醒我們往後找一個還沒出現的人', '表示這裡同時出現了很多人'],
      correctIndex: 0,
      correctFeedback: '破解成功！看到「其」，可以回頭找前面提過的人，看看後面的親屬或物品和誰有關。',
      retryHint: '第一條線索先寫楊家的孩子，再寫「其父」；第二條線索先寫曾子的妻子，再寫「其子」。兩次都要往哪個方向尋找？',
      explanation:
        '第一條線索先介紹楊家的孩子，接著才說孔君平拜訪其父。這位父親和前面剛出現的楊家孩子有關。\n\n第二條線索先寫曾子的妻子前往市場，接著出現其子。這個孩子和前面剛出現的曾子妻子有關。\n\n兩條線索的共同排列方式是：\n\n前面先出現一個人；\n後面再出現「其＋親屬」；\n「其」提醒讀者回頭尋找前面的人，確定後面的親屬和誰有關。\n\n所以，第一個假說能同時解釋兩條線索。「往後找陌生人」與兩句的先後順序相反；「很多人」也無法說明父親或兒子與前文人物的關係。\n\n目前可以破解：「其」在這些句子裡會指回前面已經提到的人，可以理解為「他的、她的或它的」。但究竟指向誰，不能只看「其」本身，仍要回到每一句的前文尋找。\n\n放回本篇原文，前文只出現一位正在過河的楚國人。因此，「其劍」指的就是前面那位楚國人的劍。',
      keyAwarded: { code: '其', decodedEvidence: '指回前面已經提到的人' },
    },
    {
      id: 'zhui',
      type: 'evidence',
      prerequisiteIds: ['qi_jian'],
      targetSentence: '其劍自舟中墜於水',
      intro: '我們知道這是楚國人的劍，也知道它最後到了水中。「墜」讓劍發生了什麼移動？先比較兩條古文線索。',
      clues: [
        {
          text: '又好上高，極其力不已，至墜地死。',
          highlight: '墜',
          unlockedMeaning: '這種小蟲又喜歡往高處爬，用盡力氣也不停，最後「墜」到地面死去。',
          source: '柳宗元〈蝜蝂傳〉',
        },
        {
          text: '手中算囊遂墜於水。',
          highlight: '墜',
          unlockedMeaning: '他乘船時，手中的算袋便「墜」於水。',
          source: '《酉陽雜俎．事感》',
        },
      ],
      question:
        '第一條線索中，小蟲原本爬到高處，後來到了地面。第二條線索中，算袋原本拿在手中，後來到了水裡。兩條線索中的「墜」都造成哪一種移動？',
      options: ['從原來的位置往下移動', '留在原來的位置完全不動', '從低處往更高的地方移動'],
      correctIndex: 0,
      correctFeedback: '破解成功！小蟲從高處到地面，算袋從手中到水裡；兩樣東西都往下移動了。',
      retryHint: '比一比前後的位置：高處到地面、手中到水裡，是往哪個方向？',
      explanation:
        '第一條線索裡，小蟲先不斷往高處爬，最後卻墜到地面，而且因此死去。牠的位置從高處移到了下面的地面。\n\n第二條線索裡，算袋原本在人的手中，後來墜於水。算袋離開手中，到了下面的水裡。\n\n兩條線索共同呈現的變化是：\n\n墜發生前，東西位在較高的位置；\n墜發生後，東西到了下面的地面或水中。\n\n因此，第一個假說可以同時解釋兩條線索。留在原處與兩次位置改變不合；往更高處移動則和兩次移動的方向相反。\n\n目前可以破解：墜表示物體從原來的位置往下移動。它有時是意外發生，有時會造成受傷或死亡；但這些結果不是墜本身每次都必須包含的意思，仍要回到各篇故事判斷。\n\n放回本篇原文，這把劍原本在船中，墜之後到了水裡。因此，它是從船中往下移動到水裡。',
      keyAwarded: { code: '墜', decodedEvidence: '從原來的位置往下移動' },
    },
    {
      id: 'reveal_qi_jian_zhui',
      type: 'reconstruction',
      prerequisiteIds: ['zhui'],
      targetSentence: '其劍自舟中墜於水',
      intro: '四把密碼鑰匙都亮起了。這次不能讓 App 替你拼好；請你自己判斷，究竟是誰從哪裡移動到哪裡。',
      keys: [
        { code: '其劍', decodedEvidence: '前面那位楚國人的劍' },
        { code: '自舟中', decodedEvidence: '從船裡' },
        { code: '墜', decodedEvidence: '從原來的位置往下移動' },
        { code: '於水', decodedEvidence: '到水裡' },
      ],
      question: '把四把鑰匙依照原文順序組合，「其劍自舟中墜於水」形成哪一幅畫面？',
      options: ['那位楚國人的劍從船裡掉進水中', '那位楚國人從水裡撿起自己的劍', '船載著那位楚國人的劍一起沉進水中'],
      correctIndex: 0,
      correctFeedback:
        '整句重建成功！移動的是「其劍」，起點是「舟中」，方向是往下，終點是「水」。所以整句表示：那位楚國人的劍從船裡掉進水中。',
      retryHint: '先找出句子裡移動的主角，再比較「自舟中」和「於水」：哪裡是起點，哪裡是終點？',
      explanation:
        '「其劍」是前面那位楚國人的劍；「自舟中」交代起點在船裡；「墜」表示往下移動；舊鑰匙「於水」指出到達水裡。四項證據共同形成「劍從船裡掉進水中」的畫面。\n\n第二個選項顛倒了移動方向，也把移動者換成楚國人；第三個選項則把「劍墜」偷換成整艘船下沉。\n\n回到連續原文：楚人有涉江者，其劍自舟中墜於水。\n\n目前讀懂的故事：有一位楚國人正在渡河。他的劍從船裡掉進水中。',
      finalDraftLine: '他的劍從船裡掉進水中',
    },
    {
      id: 'ju',
      type: 'evidence',
      prerequisiteIds: ['reveal_qi_jian_zhui'],
      targetSentence: '遽契其舟曰',
      intro: '劍掉進水裡後，楚國人接著「遽契其舟」。「遽」告訴我們：他隔了多久便採取動作？先比較兩條古文線索。',
      clues: [
        {
          text: '公仲之謁者以告公仲，公仲遽起而見之。',
          highlight: '遽',
          unlockedMeaning: '（公仲原本不肯接見顏率。）公仲的門人把顏率的話轉告給他，公仲便「遽」起身接見顏率。',
          source: '《戰國策．顏率見公仲》',
        },
        {
          text: '帝驚，遽起持昭儀曰。',
          highlight: '遽',
          unlockedMeaning: '（昭儀突然倒在地上。）皇帝吃了一驚，便「遽」起身扶住她說話。',
          source: '《趙飛燕別傳》',
        },
      ],
      question:
        '第一條線索中，公仲聽完門人的轉告便起身見客；第二條線索中，皇帝看到昭儀倒地便起身扶她。「遽」最可能為後面的動作加上哪一種速度？',
      options: ['立刻、急忙接著做', '過了很久才慢慢做', '最後完全沒有去做'],
      correctIndex: 0,
      correctFeedback: '破解成功！兩個人遇到新的情況後，都沒有等待，馬上接著採取動作。',
      retryHint: '兩條線索都寫「聽到或看到一件事」後，人物緊接著便起身。中間有沒有等很久？',
      explanation:
        '第一條線索裡，公仲原本不肯接見顏率。門人轉告顏率的話以後，公仲遽起身接見他。新的消息一到，公仲的行動緊接著就發生。\n\n第二條線索裡，昭儀突然倒在地上，皇帝受到驚嚇，遽起身扶她。這也不是等待很久後才做的動作。\n\n兩條線索的共同順序是：\n\n先出現一個新的消息或突然的情況；\n人物沒有等待；\n「遽」後面的動作緊接著發生。\n\n因此，第一個假說可以同時解釋兩條線索。過了很久和兩件事緊接發生的順序不合；完全沒有做則與兩人都已經起身行動的畫面不合。\n\n目前可以破解：遽表示立刻、急忙接著行動。至於楚國人立刻做了什麼，還要繼續破解契其舟。\n\n放回本篇原文，劍掉進水裡後，楚國人遽契其舟——劍一掉進水裡，楚國人立刻採取了一個動作。動作內容仍未破解。',
      keyAwarded: { code: '遽', decodedEvidence: '立刻、急忙接著做' },
    },
    {
      id: 'qi_qi_zhou',
      type: 'evidence',
      prerequisiteIds: ['ju'],
      targetSentence: '遽契其舟曰',
      intro: '楚國人立刻「契其舟」。這究竟是在船上做什麼？比較兩條古文線索：動作分別發生在什麼表面？完成後又留下了什麼？',
      clues: [
        {
          text: '故胡人彈骨，越人契臂，中國歃血也。',
          highlight: '契',
          unlockedMeaning:
            '古代不同地方的人用不同儀式表示信用：北方人彈動骨頭，越地人「契」手臂，中原人把牲血塗在嘴邊。（越地人完成這個儀式後，手臂表面會留下痕跡。）',
          source: '《淮南子．齊俗訓》',
        },
        {
          text: '爰始爰謀，爰契我龜。',
          highlight: '契',
          unlockedMeaning: '（古人占卜時，會觀察龜甲上的裂紋。）人們開始商量，接著「契」自己的龜甲，最後決定在這裡建造房屋。',
          source: '《詩經．大雅．緜》',
        },
      ],
      question:
        '第一條線索在手臂上「契」，完成後手臂表面留下痕跡；第二條線索在龜甲上「契」，接著觀察龜甲上的裂紋。楚國人「契其舟」，最可能是在做什麼？',
      options: ['在他乘坐的船身上刻下一個記號', '把整艘船推得更快', '把掉落的劍綁在船上'],
      correctIndex: 0,
      correctFeedback: '破解成功！手臂和龜甲的線索都顯示，「契」會在物體表面留下可觀察的痕跡；回到原文，這個表面換成了船身。',
      retryHint: '比較手臂與龜甲：兩次「契」之後，人們都要看見表面發生的變化。三個選項中，哪個動作也會讓船身表面出現可見的痕跡？',
      explanation:
        '第一條線索寫越地人用契臂作為表示信用的儀式。完成這個儀式後，手臂表面會留下痕跡。\n\n第二條線索寫人們商量居住地點，接著契龜甲進行占卜。古人會觀察龜甲表面的裂紋，再根據結果作出決定。\n\n兩條線索的共同畫面是：\n\n契都作用在一個物體的表面；\n完成後，表面會出現可供人觀察的痕跡；\n人們會利用這些痕跡完成後面的儀式或判斷。\n\n回到本篇，契後面的對象從臂換成其舟。既然同一個動作現在發生在船身上，就應該在船的表面留下痕跡。\n\n因此，第一個假說能同時解釋兩條線索：楚國人在自己乘坐的船身上刻下一個記號。推船只會改變船的位置，不能解釋手臂與龜甲表面的痕跡；把劍綁在船上也不可能發生，因為劍已經掉進水中。\n\n目前可以破解：契其舟表示在他的船上刻下記號。但他為什麼要刻這個記號、認為記號代表什麼，必須繼續讀他接著說的話。\n\n（本段舊鑰匙：「其」已在「其劍」中破解為指回前面的人，這次「其舟」指前面那位楚國人乘坐的船，不再出題。）',
      keyAwarded: { code: '契其舟', decodedEvidence: '在他乘坐的船上刻下記號' },
    },
    {
      id: 'reveal_ju_qi_qi_zhou',
      type: 'reconstruction',
      prerequisiteIds: ['qi_qi_zhou'],
      targetSentence: '遽契其舟曰',
      intro: '「遽」「契其舟」「曰」都已經知道了。請你把三把鑰匙組回原句，判斷楚國人接著做了什麼。',
      keys: [
        { code: '遽', decodedEvidence: '立刻、急忙接著做' },
        { code: '契其舟', decodedEvidence: '在他乘坐的船上刻下記號' },
        { code: '曰', decodedEvidence: '說' },
      ],
      question: '「遽契其舟曰」形成哪一串動作？',
      options: ['他立刻在自己乘坐的船上刻下記號，接著說話', '他先說了一句話，才慢慢把船推向岸邊', '他立刻跳進水裡，把劍刻上一個記號'],
      correctIndex: 0,
      correctFeedback: '整句重建成功！「遽」表示立刻接著做，「契其舟」是在他的船上刻記號，「曰」是接著說話。',
      retryHint: '原文的順序是「遽／契其舟／曰」。哪個選項保留了相同的人物、地點和動作順序？',
      explanation:
        '楚國人的劍剛掉進水裡，他便「遽」做下一件事；「契其舟」是在自己乘坐的船上刻記號；「曰」引出他接著說的話。第一個選項完整保留了原文的先後順序。\n\n回到連續原文：楚人有涉江者，其劍自舟中墜於水，遽契其舟曰……\n\n目前讀懂的故事：有一位楚國人正在渡河。他的劍從船裡掉進水中，他立刻在自己乘坐的船上刻下一個記號，接著說……',
      finalDraftLine: '他立刻在自己乘坐的船上刻下一個記號，接著說',
    },
    {
      id: 'shi',
      type: 'evidence',
      prerequisiteIds: ['reveal_ju_qi_qi_zhou'],
      targetSentence: '是吾劍之所從墜',
      intro: '楚國人在船上刻下記號，接著說：「是吾劍之所從墜。」句子一開始的「是」，正在指向哪裡？先比較兩條古文線索。',
      clues: [
        {
          text: '是鳥也，海運則將徙於南冥。',
          highlight: '是',
          unlockedMeaning: '（前文正在說一隻名叫鵬的大鳥。）「是」鳥遇到海上大風時，就要遷往南方的大海。',
          source: '《莊子．逍遙遊》',
        },
        {
          text: '是日也，天朗氣清，惠風和暢。',
          highlight: '是',
          unlockedMeaning: '（前文正在說蘭亭聚會的那一天。）「是」日天空晴朗，空氣清新，微風和暖舒暢。',
          source: '王羲之〈蘭亭集序〉',
        },
      ],
      question: '第一條線索先寫鵬鳥，接著說「是鳥」；第二條線索先寫蘭亭聚會的日子，接著說「是日」。兩句中的「是」都在指什麼？',
      options: ['眼前或前文剛提到的這一個', '很久以後才會出現的另一個', '所有同類的事物'],
      correctIndex: 0,
      correctFeedback: '破解成功！「是鳥」指剛提到的那隻鳥，「是日」指剛提到的那一天；「是」會把目光指向這一個。',
      retryHint: '先回頭找：第一句前面已經出現鵬鳥，第二句前面已經出現蘭亭聚會的日子。「是」有沒有帶我們去找很遠以後的東西？',
      explanation:
        '第一條線索的前文已經介紹鵬鳥，接著才出現是鳥。這裡不是忽然換成另一隻鳥，而是繼續說剛才那隻鵬鳥。\n\n第二條線索的前文正在記錄蘭亭聚會，接著用是日描寫當天的天氣。這裡也不是泛指所有日子，而是指那一次聚會的這一天。\n\n兩條線索的共同排列方式是：\n\n前文或眼前先有一個明確的對象；\n「是」接在那個對象的名稱前面；\n後文繼續說這一個對象。\n\n因此，「是」在這兩句中最可能表示「這、這一個」。它不是現代中文裡用來連接「誰是什麼」的「是」，而是在指向一個已經出現的對象。\n\n放回本篇原文，楚國人剛在船身上刻下一個記號，接著說「是吾劍之所從墜」。在這個故事位置中，「是」把注意力指向剛剛刻下記號的這個地方，可以先破解為「這裡」。\n\n目前更新的話語：「這裡……」楚國人認為「這裡」和他的劍有什麼關係，還要繼續破解。',
      keyAwarded: { code: '是', decodedEvidence: '這、這一個（指向眼前或前文提到的對象）' },
    },
    {
      id: 'wu',
      type: 'evidence',
      prerequisiteIds: ['shi'],
      targetSentence: '是吾劍之所從墜',
      intro: '楚國人說的是「吾劍」。「吾」指的是誰？比較兩條古文線索，看看說話的人在講誰的事。',
      clues: [
        {
          text: '吾十有五而志于學。',
          highlight: '吾',
          unlockedMeaning: '（這是孔子回想自己人生時說的話。）孔子說：「吾」十五歲時立志學習。',
          source: '《論語．為政》',
        },
        {
          text: '吾楯之堅，莫能陷也。',
          highlight: '吾',
          unlockedMeaning: '（「楯」就是盾牌，說話的人正在販賣武器。）賣武器的人誇口說：「吾」楯非常堅固，沒有東西能刺穿它。',
          source: '《韓非子．難一》',
        },
      ],
      question:
        '第一條線索中，孔子正在回想自己十五歲時做的事；第二條線索中，賣武器的人正在誇耀自己拿來販賣的盾牌。兩句中的「吾」最可能指誰？',
      options: ['每一句中正在說話的人自己', '每一句中正在聽話的對方', '句子裡提到的所有人'],
      correctIndex: 0,
      correctFeedback: '破解成功！說話的人用「吾」指自己。回到「吾劍」，就是說話者自己的劍。',
      retryHint: '第一個人談自己十五歲時的經歷，第二個人談自己正在販賣的盾牌。兩次都是誰正在開口說話？',
      explanation:
        '第一條線索是孔子回顧自己的人生。他說吾十有五而志于學，句中的年齡和立志學習的經歷都屬於正在說話的孔子。\n\n第二條線索是賣武器的人誇耀盾牌。他說吾楯之堅，後面的盾牌正是他拿來販賣、正在介紹的武器。\n\n兩條線索中，說話的人都用吾談自己的經歷或眼前和自己有關的物品。因此，「吾」指正在說話的人自己。它不是指聽話的人，也沒有把所有十五歲的孩子都包括進來。\n\n回到本篇，說出「是吾劍之所從墜」的人，是那位劍掉進水中的楚國人。因此，「吾劍」就是他自己的劍。\n\n目前更新的話語：「這裡是我的劍……」還差「之所從墜」，才能知道楚國人認為這個記號代表什麼。',
      keyAwarded: { code: '吾', decodedEvidence: '說話的人自己' },
    },
    {
      id: 'suo_cong_zhui',
      type: 'evidence',
      prerequisiteIds: ['wu'],
      targetSentence: '是吾劍之所從墜',
      intro:
        '「墜」已經破解為從原來的位置往下移動。但「所從墜」不是只說劍掉了下去。這串密碼還在尋找一個位置。先看「所從來」怎麼使用，再把「墜」換進相同的位置。',
      clues: [
        {
          text: '見漁人，乃大驚，問所從來，具答之。',
          highlight: '所從來',
          unlockedMeaning: '（桃花源中的村民第一次看見外來的漁人。）村民看見漁人，非常驚訝，便問他「所從來」；漁人一一回答。',
          source: '陶淵明〈桃花源記〉',
        },
        {
          text: '術丐乞者，不知所從來。',
          highlight: '所從來',
          unlockedMeaning: '有一位表演法術的乞討者，大家不知道他「所從來」；他只說自己姓胡，名叫媚兒。',
          source: '《太平廣記．胡媚兒》',
        },
      ],
      question:
        '桃花源的村民詢問漁人「所從來」；看見表演法術的乞討者時，大家也不知道他「所從來」。兩條線索都在追查「來」這個移動從哪裡開始。現在把已破解的「墜」放進相同位置：「所從墜」最可能在追查什麼？',
      options: ['劍從哪個地方掉下去', '劍最後被誰撿到', '船準備往哪個方向前進'],
      correctIndex: 0,
      correctFeedback: '破解成功！「所從來」追查從哪裡來；換成「所從墜」，就是追查從哪個地方掉下去。',
      retryHint: '保留「所從」，只替換最後的動作：「來」換成已破解的「墜」。問題應該跟哪一個動作的起點有關？',
      explanation:
        '第一條線索中，桃花源的村民第一次看見外來的漁人，不知道他從哪裡來，所以問他所從來。漁人接著回答。\n\n第二條線索中，表演法術的乞討者突然出現，大家不知所從來，後文只知道他自稱姓胡。\n\n兩條線索中的人物都出現在陌生人面前，而其他人不知道他原先從哪裡出發。因此，所從來正在追查「來」這個移動的起點。\n\n回到本篇，所從後面的動作換成已破解的墜：\n\n所從來——「來」是從哪裡開始\n所從墜——「墜」是從哪裡開始\n\n劍已經從船中掉進水裡，所以吾劍之所從墜是在說「我的劍從哪個地方掉下去」。\n\n這裡記錄的是劍離開船時的起點，不是劍進入水中後永遠不動的固定位置。至於船和劍接下來會不會保持同樣的位置關係，原文目前還沒有說完，不能先替故事下結論。\n\n（編輯說明：這裡的「之」把「吾劍」和「所從墜」連在一起，功能和上一篇「回指前文某件事物」的「之」不同，因此不套用舊鑰匙，也不為「之」單獨出題，直接在整句重建時讓孩子看見它連接前後兩部分的作用。）',
      keyAwarded: { code: '之所從墜', decodedEvidence: '從這個地方掉下去' },
    },
    {
      id: 'reveal_shi_wu_suo_cong_zhui',
      type: 'reconstruction',
      prerequisiteIds: ['suo_cong_zhui'],
      targetSentence: '是吾劍之所從墜',
      intro: '楚國人刻完記號後，指著它說了一句話。請把「是」「吾劍」「之所從墜」組合起來，看他認為這個記號代表哪裡。',
      keys: [
        { code: '是', decodedEvidence: '這裡、這一個地方' },
        { code: '吾劍', decodedEvidence: '說話者自己的劍' },
        { code: '之所從墜', decodedEvidence: '從這個地方掉下去' },
      ],
      question: '「是吾劍之所從墜」最接近楚國人的哪一句話？',
      options: ['「這裡是我的劍掉下去的地方。」', '「這裡是我剛才撿到劍的地方。」', '「這把劍會跟著船上的記號移動。」'],
      correctIndex: 0,
      correctFeedback:
        '整句重建成功！「是」指這裡，「吾劍」是我的劍，「之所從墜」說明劍從這個地方掉下去。楚國人正在說明記號代表什麼。',
      retryHint: '古文只寫劍「墜」，還沒有寫他撿到劍，也沒有寫記號能帶著劍移動。哪個選項只使用眼前已有的證據？',
      explanation:
        '「是」指向船上的這個地方；「吾劍」是說話者自己的劍；「之所從墜」連起「我的劍」和「從這裡掉下去」這件事。因此，楚國人是在說：「這裡是我的劍掉下去的地方。」\n\n回到連續原文：楚人有涉江者，其劍自舟中墜於水，遽契其舟曰：「是吾劍之所從墜。」\n\n目前讀懂的故事：有一位楚國人正在渡河。他的劍從船裡掉進水中，他立刻在自己乘坐的船上刻下一個記號，說：「這裡是我的劍掉下去的地方。」\n\n證據邊界：這句只能確定楚國人認為記號記下了「劍從船上掉落的地方」。它還不能證明這個記號最後是否能幫他找回劍，也沒有直接說出楚國人的個性或內心。',
      finalDraftLine: '「這裡是我的劍掉下去的地方。」',
    },
    {
      id: 'ru_shui_qiu_zhi',
      type: 'evidence',
      prerequisiteIds: ['reveal_shi_wu_suo_cong_zhui'],
      targetSentence: '從其所契者入水求之',
      intro:
        '船抵達目的地後停下來了。接著，楚人做出「入水求之」這串動作。我找到兩句古文線索。看完以後，你覺得「入水求之」是一幅什麼畫面？',
      clues: [
        {
          text: '方士徐市等入海求神藥。',
          highlight: '入海求神藥',
          // 故意不給白話翻譯：這條線索要考的正是「入X求Y」這個位置關係本身，翻成白話等於直接告訴孩子答案。
          source: '《史記．秦始皇本紀》',
        },
        {
          text: '與數人入林求木。',
          highlight: '入林求木',
          // 故意不給白話翻譯，理由同上一條——兩句放在一起比較，是要讓孩子自己看出「入X求Y」的排列方式。
          source: '《太平廣記．楊溥》引《紀聞》',
        },
      ],
      question: '看完兩條古文線索，你覺得「入水求之」最可能是哪一幅畫面？',
      options: ['楚人進入水中，尋找那把劍', '楚人離開水面，回到船上尋找那把劍', '楚人把劍放進水中，自己留在船上'],
      correctIndex: 0,
      correctFeedback: '破解成功！兩條線索都是「進入某處，再尋找某物」。「入水求之」也照著相同順序組成一幅畫面。',
      retryHint: '再看兩條線索：人先進入哪裡，接著又尋找什麼？把海換成水，把神藥換成「之」所指的東西，再試一次。',
      explanation:
        '第一條線索中，徐市等人先進入海中，接著尋找神奇的藥。\n\n第二條線索中，幾個人先進入樹林，接著尋找木材。\n\n兩條線索的地點和尋找的東西不同，動作的排列卻相同：\n\n入海求神藥——進入海中 → 尋找神藥\n入林求木——進入樹林 → 尋找木材\n\n回到本篇，入水求之也沿用這個排列：\n\n入水——進入水中\n求之——尋找「之」指向的東西\n\n這裡的「之」喚回孩子先前取得的代詞鑰匙，指向前文掉進水裡的劍。因此，整串動作表示楚人進入水中，尋找那把劍。\n\n這一題破解的不是四個分開的字義，而是四個字共同形成的動作順序。',
      keyAwarded: { code: '入水求之', decodedEvidence: '進入水中，尋找那把劍' },
    },
    {
      id: 'reveal_zhou_zhi_ru_shui',
      type: 'reconstruction',
      prerequisiteIds: ['ru_shui_qiu_zhi'],
      targetSentence: '舟止，從其所契者入水求之。',
      intro:
        '船繼續航行，抵達目的地後停了下來。楚國人這才開始找劍。「其」「契」「之」都是舊鑰匙，「入水求之」也已破解。請你親手重建他找劍的完整動作。',
      keys: [
        { code: '舟止', decodedEvidence: '船抵達目的地後停下來' },
        { code: '從其所契者', decodedEvidence: '從他刻記號的地方' },
        { code: '入水求之', decodedEvidence: '進入水中，尋找那把劍' },
      ],
      question: '「舟止，從其所契者入水求之」形成哪一幅完整畫面？',
      options: [
        '船抵達目的地停下後，他從船上刻記號的地方進入水中找劍',
        '船還在航行時，他從劍掉落的水面位置立刻下水找劍',
        '船抵達目的地後，他把刻有記號的船推進水裡找劍',
      ],
      correctIndex: 0,
      correctFeedback: '整句重建成功！船先抵達目的地停下來；楚國人再從自己刻記號的地方進入水中，尋找那把劍。',
      retryHint: '注意兩件事：「舟止」發生在前；「其所契者」是船上刻記號的地方。哪個選項沒有改動時間和位置？',
      explanation:
        '「舟止」表示船完成這一段航程、抵達目的地後停下；「從其所契者」指出楚國人從自己在船上刻記號的地方行動；「入水求之」是進入水中尋找前文的劍。三部分依照原文先後組成第一個選項。\n\n回到連續原文：楚人有涉江者，其劍自舟中墜於水，遽契其舟曰：「是吾劍之所從墜。」舟止，從其所契者入水求之。\n\n目前讀懂的故事：有一位楚國人正在渡河。他的劍從船裡掉進水中，他立刻在自己乘坐的船上刻下一個記號，說：「這裡是我的劍掉下去的地方。」船抵達目的地後停下來，他從自己刻記號的地方進入水中，尋找那把劍。\n\n證據邊界：這句只寫出楚人從船上刻記號的地方進入水中找劍。它還沒有說他是否找得到，也沒有說明他的做法錯在哪裡；這些必須等待後文提供證據。',
      finalDraftLine: '船抵達目的地後停下來，他從自己刻記號的地方進入水中，尋找那把劍',
    },
    {
      id: 'xing',
      type: 'evidence',
      prerequisiteIds: ['reveal_zhou_zhi_ru_shui'],
      targetSentence: '舟已行矣，而劍不行',
      intro: '同一個「行」，一次跟在「舟」後面，一次跟在「劍」後面。我找到兩句古文線索。比較「行」前後發生了什麼。',
      clues: [
        {
          text: '子墨子聞之，起於齊，行十日十夜而至於郢。',
          highlight: '行',
          unlockedMeaning: '墨子聽到消息，從齊國出發，「行」了十天十夜，最後抵達楚國的郢都。',
          source: '《墨子．公輸》',
        },
        {
          text: '四鼓，解舟行，至西興鎮。',
          highlight: '行',
          unlockedMeaning: '天還沒亮，他們解開船纜，讓船「行」，後來抵達西興鎮。',
          source: '陸游《入蜀記》',
        },
      ],
      question: '兩條線索裡，人或船在「行」以前和以後，位置發生了什麼變化？',
      options: ['從原來的位置移到別處', '留在原處，位置沒有改變', '掉進水裡，沉到下面'],
      correctIndex: 0,
      correctFeedback: '破解成功！墨子從齊國抵達郢都，船也從解開纜繩的地方抵達西興鎮。兩次「行」都伴隨位置改變。',
      retryHint: '找出每條線索中的起點和終點：墨子從哪裡出發、到了哪裡？船解開纜繩後，又到了哪裡？',
      explanation:
        '第一條線索中，墨子從齊國出發。經過十天十夜的行，他抵達郢都。開始和結束時，他所在的地方不同。\n\n第二條線索中，人們先解開船纜，讓船行，後來船抵達西興鎮。這一次的主角不是用腳走路的人，而是一艘船；但船開始和結束時的位置同樣不同。\n\n兩條線索共同留下的證據是：\n\n行以前：墨子在齊國／船解開纜繩準備出發\n行以後：墨子抵達郢都／船抵達西興鎮\n\n因此，目前可以推得：行描述人或物體離開原來的位置，前往別處。\n\n第二個選項說位置沒有改變，無法解釋墨子為什麼從齊國到了郢都，也無法解釋船為什麼後來到了西興鎮。第三個選項只借用了本篇前面劍墜於水的畫面，兩條線索都沒有東西掉進水裡，因此不能解釋行。\n\n回到本篇：舟已行矣，而劍不行。這時可以先確定，船已經沿著原本的航程繼續往目的地開去，位置已經改變；劍卻沒有跟著船一起改變位置。句中的矣還沒有破解，所以暫時保留，下一題再查。\n\n證據邊界：兩條線索只能幫我們確定行涉及位置改變，不能單獨告訴我們船移動了多遠，也不能解釋為什麼劍沒有跟著船走。這些要回到本篇的前後文判斷。',
      keyAwarded: { code: '行', decodedEvidence: '離開原來的位置，前往別處' },
    },
    {
      id: 'yi',
      type: 'evidence',
      prerequisiteIds: ['xing'],
      targetSentence: '舟已行矣，而劍不行',
      intro: '「行」已經破解了：船沿著原本的航程繼續往目的地開去，位置發生了改變。可是句尾為什麼還要放一個「矣」？比較兩句古文線索看看。',
      clues: [
        {
          text: '臣之壯也，猶不如人；今老矣，無能為也已。',
          highlight: '矣',
          unlockedMeaning: '我年輕力壯時，尚且比不上別人；如今老「矣」，已經不能做什麼了。',
          source: '《左傳．僖公三十年》',
        },
        {
          text: '骨已盡矣，而兩狼之並驅如故。',
          highlight: '矣',
          unlockedMeaning: '屠夫能丟給狼的骨頭已經用盡「矣」，可是兩隻狼仍像先前一樣一起追趕。',
          source: '蒲松齡《聊齋志異．狼三則》其二',
        },
      ],
      question: '兩條線索中的「矣」，都放在什麼樣的情況後面？',
      options: ['前面的事情只是一個還沒有實現的打算', '前面的情況已經出現，現在已經如此', '說話者不確定，所以正在向別人提問'],
      correctIndex: 1,
      correctFeedback: '破解成功！燭之武如今已經老了，屠夫的骨頭也已經用盡了。「矣」把讀者帶到事情已經如此的這一刻。',
      retryHint: '看看兩句中的時間變化：燭之武現在還年輕嗎？屠夫現在還有骨頭可以丟嗎？',
      explanation:
        '第一條線索先比較燭之武的過去和現在：從前他曾經年輕力壯，如今卻老矣。衰老這個情況現在已經出現。\n\n第二條線索中，屠夫原本還有骨頭可以丟給狼。丟了幾次之後，骨頭已盡矣。骨頭用完這件事現在已經成為事實。\n\n兩條線索的內容不同，但矣都把讀者帶到一個已經出現的新情況：\n\n今老矣——從前曾經年輕力壯，現在已經老了\n骨已盡矣——原本還有骨頭，現在骨頭已經用盡\n\n因此，在這兩句裡，矣不是說一件尚未實現的打算，也不是用來提問；它提醒讀者，前面的情況已經出現，現在已經如此。\n\n回到本篇：舟已行矣，而劍不行。前一題已經破解行是離開原來的位置、前往別處。放回正在渡江的航程，舟已行矣表示船已經繼續往目的地開去了。可是，劍並沒有跟著船一起改變位置。',
      keyAwarded: { code: '矣', decodedEvidence: '前面的情況已經出現，現在已經如此' },
    },
    {
      id: 'reveal_xing_yi',
      type: 'reconstruction',
      prerequisiteIds: ['yi'],
      targetSentence: '舟已行矣，而劍不行。',
      intro: '同一個「行」分別放在船和劍後面。請把「矣」與表示對照的「而」一起放回去，看看船和劍發生了什麼不同。',
      keys: [
        { code: '舟已行矣', decodedEvidence: '船已經繼續往目的地開去，離開原來的位置' },
        { code: '而', decodedEvidence: '前後出現轉折或對照' },
        { code: '劍不行', decodedEvidence: '劍沒有跟著改變位置' },
      ],
      question: '「舟已行矣，而劍不行」說明船和劍出現了哪一種位置變化？',
      options: [
        '船已繼續往目的地開去，可是劍沒有跟著船一起移動',
        '船和劍一起往目的地移動，位置始終相同',
        '船停在劍掉落的位置，只有劍繼續往前移動',
      ],
      correctIndex: 0,
      correctFeedback:
        '整句重建成功！「舟已行矣」表示船已經往前開走；「而」把相反的情況接進來：劍沒有跟著船移動。船和劍的位置已經分開了。',
      retryHint: '前半句是「舟行」，後半句卻是「劍不行」。哪個選項保留了這個相反的對照？',
      explanation:
        '前半句說船已經繼續往目的地航行；「而」轉到相反的情況，劍卻沒有跟著船移動。因此，船上的記號會隨船前進，水中的劍不會；兩者的位置關係已經改變。\n\n回到連續原文：楚人有涉江者，其劍自舟中墜於水，遽契其舟曰：「是吾劍之所從墜。」舟止，從其所契者入水求之。舟已行矣，而劍不行。\n\n目前讀懂的故事：有一位楚國人正在渡河。他的劍從船裡掉進水中，他立刻在自己乘坐的船上刻下一個記號，說：「這裡是我的劍掉下去的地方。」船繼續往目的地開去；抵達目的地後，船停了下來，他才從自己刻記號的地方進入水中，尋找那把劍。可是船早已離開劍掉落的位置，沉在水中的劍並沒有跟著船一起移動。\n\n證據邊界：這裡可以確定船與劍的位置關係已經改變。原文還沒有直接說出作者對楚人的評價；必須繼續破解最後一句，不能先替作者補上「愚蠢」或其他判斷。',
      finalDraftLine: '船已經繼續往目的地開去了，可是劍沒有跟著船一起移動',
    },
    {
      id: 'ruo_ci',
      type: 'evidence',
      prerequisiteIds: ['reveal_xing_yi'],
      targetSentence: '求劍若此，不亦惑乎？',
      intro: '作者沒有重新說一遍楚人怎麼找劍，只寫「求劍若此」。「若此」究竟指向哪裡？比較兩句古文線索看看。',
      clues: [
        {
          text: '公今受俸不少，而自奉若此。',
          highlight: '若此',
          unlockedMeaning: '（張文節當了宰相，吃穿仍和以前一樣簡單。）有人勸他：『您現在領的薪水不少，怎麼還把日子過得「若此」？可以讓自己過得好一點呀！』',
          source: '司馬光〈訓儉示康〉',
        },
        {
          text: '求聞之若此，不若無聞也。',
          highlight: '若此',
          unlockedMeaning: '（某人想打聽消息卻完全弄錯。）打聽消息卻「若此」，還不如沒聽到。',
          source: '《呂氏春秋．察傳》',
        },
      ],
      question: '兩句中的「若此」，都要回頭對照什麼？',
      options: ['假如以後改用另一種方法', '像前面剛剛描述的那樣', '與前面的做法完全相反'],
      correctIndex: 1,
      correctFeedback: '破解成功！「自奉若此」指回張文節前面那種簡單的生活；「求聞之若此」也指回前面打聽消息卻弄錯的情況。',
      retryHint: '把「若此」圈起來，再往前找：第一句前面剛描述了張文節怎樣生活？第二句前面剛描述了怎樣打聽消息？',
      explanation:
        '第一條線索先交代張文節當了宰相，吃穿仍和以前一樣簡單。有人看見這種生活方式，勸他說：「您現在領的俸祿不少，而自奉若此。」這裡沒有再把他怎樣吃、怎樣穿說一遍，而是用若此請讀者回頭對照前面描述的生活。\n\n第二條線索先交代某人想打聽消息，結果卻完全弄錯。後面的求聞之若此沒有重述他怎樣弄錯，而是指回剛剛描述的打聽情況。\n\n兩條線索共同留下的證據是：\n\n自奉若此——前面剛描述的簡單生活\n求聞之若此——前面剛描述的錯誤打聽情況\n\n因此，目前可以推得：若此會指回前面剛剛描述的情況，表示像前面所說的那樣。\n\n第一個選項把若誤認成假如，但兩句都不是在談尚未發生的另一種可能。第三個選項說意思完全相反，也無法解釋為什麼作者要先描述生活方式和打聽消息的情況。\n\n回到本篇：求劍若此，不亦惑乎？若此指回楚人前面尋劍的方法：他把記號刻在會移動的船上，等船繼續往目的地開去、抵達目的地後停下來，再從記號所在的地方進入水中找劍。因此，求劍若此是在說「像前面那樣尋找劍」。\n\n證據邊界：若此只負責指回前面那套尋劍方法，本身還沒有說這個方法是聰明、糊塗或可笑。作者的判斷藏在後面的不亦惑乎，必須繼續破解。\n\n（版本註記：「求聞之若此」是現行常見教材採用的文字；《中國哲學書電子化計劃》所據《四部叢刊初編》本顯示為「求能之若此」。本課鎖定常見教材版本，若日後統一底本，須重新確認此線索文字。）',
      keyAwarded: { code: '若此', decodedEvidence: '像前面剛剛描述的那樣' },
    },
    {
      id: 'bu_yi',
      type: 'evidence',
      prerequisiteIds: ['ruo_ci'],
      targetSentence: '求劍若此，不亦惑乎？',
      intro: '「若此」已破解：作者正在說楚人像前面那樣尋找劍。接著出現「不亦」。說話的人心裡是怎麼想的？比較兩句古文線索看看。',
      clues: [
        {
          text: '學而時習之，不亦說乎？',
          highlight: '不亦',
          unlockedMeaning: '學過以後常常練習，「不亦」令人高興嗎？',
          source: '《論語．學而》',
        },
        {
          text: '有朋自遠方來，不亦樂乎？',
          highlight: '不亦',
          unlockedMeaning: '有朋友從遠方來看你，「不亦」令人快樂嗎？',
          source: '《論語．學而》',
        },
      ],
      question: '兩句都用「不亦」來提問。說話的人真正想表達什麼？',
      options: ['「我不知道。」真的在等待別人告訴答案', '「千萬不要！」正在阻止這件事發生', '「當然是啊！」用問句加強自己的看法'],
      correctIndex: 2,
      correctFeedback: '破解成功！孔子並不是不知道學習和朋友來訪是否令人快樂，而是用「不亦」問句加強自己的看法。',
      retryHint: '想一想：孔子說「學過再練習」和「朋友從遠方來」時，心裡真的完全不知道這是不是好事嗎？',
      explanation:
        '第一條線索先說學過以後常常練習，再問不亦說乎。孔子並不是在等待別人告訴他這是否令人高興；他的問句裡已經帶著肯定的看法。\n\n第二條線索先說朋友從遠方來，再問不亦樂乎。朋友前來相聚本來就是令人快樂的事，說話者同樣不是完全不知道答案。\n\n兩條線索共同留下的證據是：\n\n學而時習之，不亦說乎——學過以後常常練習，認為這令人高興\n有朋自遠方來，不亦樂乎——朋友從遠方前來，認為這令人快樂\n\n因此，目前可以推得：不亦放進這類問句時，不是在表示「我不知道」，而是說話者心中已有判斷，用問句加強語氣，請對方同意。\n\n第一個選項把這兩句當成真的疑問，但孔子已經表明自己對學習和朋友來訪的看法。第二個選項表示阻止，兩條線索卻都在肯定前面所說的事情。只有第三個選項能同時解釋兩句。\n\n回到本篇：求劍若此，不亦惑乎？若此已經指回楚人前面的尋劍方法。現在加入不亦，可以知道作者不是完全不知道該怎麼評價這種方法，而是心中已經有了判斷，正用問句請讀者同意。\n\n證據邊界：不亦只能讓我們知道作者已有判斷，並用問句加強語氣；這個判斷的內容是什麼，還要繼續破解惑。句尾的乎也將在後面的題目中確認。',
      keyAwarded: { code: '不亦', decodedEvidence: '說話者心中已有判斷，用問句加強語氣' },
    },
    {
      id: 'huo',
      type: 'evidence',
      prerequisiteIds: ['bu_yi'],
      targetSentence: '求劍若此，不亦惑乎？',
      intro: '「不亦」已破解：作者心中已經有了判斷，正用問句請我們同意。這個判斷藏在「惑」裡。比較兩句古文線索看看。',
      clues: [
        {
          text: '知者不惑，仁者不憂，勇者不懼。',
          highlight: '惑',
          unlockedMeaning: '有智慧的人不會「惑」，有仁德的人不會憂愁，勇敢的人不會害怕。',
          source: '《論語．子罕》',
        },
        {
          text: '惑而不從師，其為惑也，終不解矣。',
          highlight: '惑',
          unlockedMeaning: '心中有了「惑」卻不向老師請教，這個「惑」到最後仍然無法解開。',
          source: '韓愈〈師說〉',
        },
      ],
      question: '兩條線索中的「惑」，最可能是哪一種狀態？',
      options: ['已經把事情想得清清楚楚', '心裡有不明白、沒有想通的地方', '因為事情成功而非常高興'],
      correctIndex: 1,
      correctFeedback: '破解成功！有智慧的人不會「惑」，遇到「惑」則需要請教、解開。它指向心裡尚未弄明白的地方。',
      retryHint: '第二條線索說「惑」可以向老師請教，也可能一直「不解」。什麼東西才需要被解開？',
      explanation:
        '第一條線索把三種人並排在一起：有智慧的人不會惑，有仁德的人不會憂愁，勇敢的人不會害怕。憂和懼都是心裡的狀態，因此惑也應該是與思考有關的狀態。它又與有智慧相反，表示還沒有把事情看清楚。\n\n第二條線索說，心中有了惑卻不向老師請教，這個惑最後仍然無法解開。這表示惑不是高興，也不是事情已經想通，而是心裡仍有不明白的地方。\n\n兩條線索共同留下的證據是：\n\n知者不惑——有智慧的人不會陷入這種狀態\n其為惑也，終不解矣——這種狀態需要請教、解開\n\n因此，目前可以推得：惑表示心裡有不明白、沒有想通的地方。\n\n第一個選項說事情已經想得清清楚楚，與終不解矣相反。第三個選項說非常高興，卻無法解釋為什麼有智慧的人不會如此，也無法解釋為什麼需要向老師請教。只有第二個選項能同時解釋兩條線索。\n\n回到本篇：求劍若此，不亦惑乎？楚人把記號刻在會移動的船上，卻沒有想通：船已經繼續往目的地開去，劍落水的位置並不會跟著船一起移動。因此，本篇的惑不只是有一個問題不懂，更是在批評他沒有看清船與劍的位置關係，做法很糊塗。\n\n證據邊界：兩條古文線索先幫我們確定惑與不明白、沒有想通有關；「很糊塗」這一層評價，則是放回《刻舟求劍》的行動與前面已破解的因果關係後，才能進一步確定。',
      keyAwarded: { code: '惑', decodedEvidence: '心裡有不明白、沒有想通的地方（本篇是在批評做法糊塗）' },
    },
    {
      id: 'hu',
      type: 'evidence',
      prerequisiteIds: ['huo'],
      targetSentence: '求劍若此，不亦惑乎？',
      intro: '「若此」「不亦」「惑」都破解了，句尾還有一個「乎」。「乎」放在句尾做了什麼？比較兩句古文線索看看。',
      clues: [
        {
          text: '壯士！能復飲乎？',
          highlight: '乎',
          unlockedMeaning: '項王對樊噲說：『勇士！你還能再喝一杯酒「乎」？』',
          source: '司馬遷《史記．項羽本紀》',
        },
        {
          text: '學詩乎？',
          highlight: '乎',
          unlockedMeaning: '孔子對兒子說：『你學過《詩經》「乎」？』兒子回答：『還沒有。』',
          source: '《論語．季氏》',
        },
      ],
      question: '兩句在句尾加上「乎」後，讀起來共同變成什麼？',
      options: ['一個正在提問的句子', '一個命令別人行動的句子', '一個只陳述事情已經發生的句子'],
      correctIndex: 0,
      correctFeedback: '破解成功！兩句的「乎」都放在句尾，讓整句成為問句，作用接近現在使用的「嗎」或「呢」。',
      retryHint: '先把兩句大聲讀一遍，再看看句尾的標點：說話的人是在說完一件事，還是在提出問題？',
      explanation:
        '第一條線索中，項王剛看見樊噲喝下一大杯酒，接著問他還能不能再喝。句尾放著乎，樊噲隨後開口回答。\n\n第二條線索中，孔子問兒子有沒有學過《詩經》，兒子馬上回答還沒有。句尾同樣放著乎。\n\n兩條線索共同留下的證據是：\n\n壯士！能復飲乎——問還能不能再喝\n學詩乎——問有沒有學過《詩經》\n\n因此，目前可以推得：乎放在這類句子的末尾，會讓整句成為問句，作用接近現代中文句尾的「嗎」或「呢」。\n\n第二個選項說這是命令，但兩句都沒有要求別人採取行動。第三個選項說只是陳述，卻無法解釋兩句為什麼都在提出問題。只有第一個選項能同時解釋兩條線索。\n\n回到本篇：求劍若此，不亦惑乎？現在四把密碼鑰匙都已經取得，依照原文順序組合，可以暫時重建為：「像這樣尋找劍，不是很糊塗嗎？」這不是作者真的不知道答案，而是作者認為楚人的做法很糊塗，用問句請讀者一起確認。\n\n證據邊界：古文中的乎不只一種用法。這兩條線索與本篇只能幫我們確認：在目前這三個句子裡，乎都放在句尾表示提問。其他用法要遇到新的古文時再重新蒐集證據。',
      keyAwarded: { code: '乎', decodedEvidence: '放在句尾，讓整句成為問句' },
    },
    {
      id: 'reveal_ruo_ci_bu_yi_huo_hu',
      type: 'reconstruction',
      prerequisiteIds: ['hu'],
      targetSentence: '求劍若此，不亦惑乎？',
      intro: '最後四把密碼鑰匙都亮起了。作者把自己的判斷寫成問句；請你親手重建他真正想表達的意思。',
      keys: [
        { code: '若此', decodedEvidence: '像前面剛剛描述的那樣' },
        { code: '不亦', decodedEvidence: '說話者心中已有判斷，用問句加強語氣' },
        { code: '惑', decodedEvidence: '沒有想通；本篇是在批評做法糊塗' },
        { code: '乎', decodedEvidence: '放在句尾，讓整句成為問句' },
      ],
      question: '「求劍若此，不亦惑乎」最接近作者的哪一句話？',
      options: ['像這樣尋找劍，不是很糊塗嗎？', '像這樣尋找劍，最後找到劍了嗎？', '尋找劍時，是不是一定要先在船上刻記號？'],
      correctIndex: 0,
      correctFeedback:
        '全句重建成功！「若此」指像前面那樣，「不亦惑乎」用問句請讀者同意：這樣做不是很糊塗嗎？作者不是不知道答案，而是在批評楚人的做法。',
      retryHint: '「惑」已破解為沒有想通、做法糊塗。哪個選項保留了作者的這個判斷，而不是改成詢問有沒有找到劍？',
      explanation:
        '「求劍若此」指像前文那樣，從隨船移動的記號處下水找劍；「不亦」帶出說話者心中已有的判斷；「惑」批評做法糊塗；句尾「乎」讓整句成為問句。合起來就是：「像這樣尋找劍，不是很糊塗嗎？」\n\n這不是作者真的不知道答案，而是用問句請讀者同意他的判斷。\n\n證據邊界：古文中的「乎」不只一種用法。這兩條線索與本篇只能幫我們確認：在目前這三個句子裡，「乎」都放在句尾表示提問。其他用法要遇到新的古文時再重新蒐集證據。',
      finalDraftLine: '像這樣尋找劍，不是很糊塗嗎？',
    },
  ],
  sequenceOrderingClosing: {
      id: 'closing_sequence_order',
      title: '最後一關：把破解畫面排回故事',
      intro: '所有古文密碼都破解了，但五張故事畫面被打亂了。請依照古文發生的順序，把它們重新排好。',
      cards: [
        { id: 'A', text: '船抵達目的地後停下來，楚人從船上刻記號的地方進入水中找劍。' },
        { id: 'B', text: '楚人乘船渡江，他的劍從船上掉進水裡。' },
        { id: 'C', text: '作者問：像這樣尋找劍，不是很糊塗嗎？' },
        { id: 'D', text: '楚人立刻在船上刻下記號，說：「這是我的劍掉下去的地方。」' },
        { id: 'E', text: '船繼續往目的地開去，劍卻沒有跟著船一起移動。' },
      ],
      correctOrder: ['B', 'D', 'E', 'A', 'C'],
      correctFeedback: '全文破解成功！你已經把五個畫面依照古文順序接回去了。',
      retryHint: '先找故事的起點：劍是在刻記號以前掉進水裡，還是在刻記號以後？',
  },
  causalChainClosing: {
      id: 'closing_causal_chain',
      title: '破譯任務：楚人的方法為什麼很糊塗？',
      intro: '我們已經成功破解全文了。現在請利用剛才得到的線索，破解作者真正想表達的意思。',
      question: '作者說楚人這樣找劍很糊塗，為什麼呢？',
      options: [
        '他把會跟著船移動的記號，當成不會改變的位置，所以方法本身就錯了。',
        '東西掉進水裡，就會被沖走，一定找不回來。',
        '坐船的時候，不該攜帶寶劍這種貴重的東西。',
        '船身不能刻記號。',
      ],
      correctIndex: 0,
      correctFeedback: '🔓 破解成功！我們一起整理剛才發生的事情。',
      retryHint: '想一想：船上的記號會不會跟著船一起移動？掉進水裡的劍呢？兩者的位置後來還會一樣嗎？',
      nodes: [
        '劍從船上掉進水裡。',
        '楚人在船邊刻了一個記號。',
        '船繼續往前航行。',
        '船上的記號跟著船一起移動。',
        '掉進水裡的劍沒有跟著船移動。',
        '所以船上的記號，已經不能代表劍掉下去的位置。',
      ],
      coreSummary: '真正的問題不是沒有做記號，而是把記號留在會移動的船上。',
      evidenceBoundary:
        '原文最後用「不亦惑乎」這句反問，直接說楚人的做法很糊塗；但「記號跟著船移動、劍卻沒有跟著移動」這個具體原因，原文並沒有另外用一句話講清楚，是我們從整段因果鏈整理出來的。',
      continueButtonLabel: '開始證據判讀',
  },
  evidenceMultiSelectClosing: {
      id: 'closing_evidence_multiselect',
      title: '最後一關：哪些真的寫在古文裡？',
      intro:
        '讀完故事後，我們常會想到更多細節。可是，想到的事情不一定是古文明確寫出的事情。下面哪些事情能在古文中找到明確證據？可以選不只一項。有明確證據的才打勾；沒有明確證據的不要打勾。',
      options: [
        { text: '劍從船上掉進水裡。', correct: true, detail: '原文證據：「其劍自舟中墜於水」' },
        { text: '楚人在船上刻下記號。', correct: true, detail: '原文證據：「遽契其舟」' },
        { text: '船繼續往目的地開去，劍沒有跟著船移動。', correct: true, detail: '原文證據：「舟已行矣，而劍不行」' },
        {
          text: '船抵達目的地後停下來，楚人從刻記號的地方進入水中找劍。',
          correct: true,
          detail: '原文證據：「舟止，從其所契者入水求之」',
        },
        { text: '楚人一定是太緊張，才沒有想到船正在移動。', correct: false, detail: '古文沒有寫楚人當時的心情。' },
        { text: '船上的其他人一定勸過楚人，可是他不肯聽。', correct: false, detail: '古文沒有寫其他人勸告他，也沒有寫他拒絕勸告。' },
        { text: '楚人最後一定沒有找到劍。', correct: false, detail: '古文只寫他進入水中找劍，沒有交代最後的結果。' },
      ],
      correctFeedback:
        '證據判讀成功！前四件事都能在古文中找到明確證據。後三件事雖然可能聽起來合理，卻是讀者補出的想法，古文沒有明說。你已經能分清楚：「古文告訴我們的事」和「我們根據故事作出的推測」。',
      retryHint: '還有選項沒有判斷準確。再問自己一次：這件事能不能在古文中找到直接對應的句子？如果只是「可能如此」，卻找不到原句，就不能打勾。',
      finalNote: '我們可以根據故事提出推測；但是當我們說「古文告訴我們」時，必須能在原文中找到證據。',
  },
  finalVerification: {
    prerequisiteStepIds: [
      'she_jiang',
      'chu_ren_you_she_jiang_zhe',
      'qi_jian',
      'zhui',
      'reveal_qi_jian_zhui',
      'ju',
      'qi_qi_zhou',
      'reveal_ju_qi_qi_zhou',
      'shi',
      'wu',
      'suo_cong_zhui',
      'reveal_shi_wu_suo_cong_zhui',
      'ru_shui_qiu_zhi',
      'reveal_zhou_zhi_ru_shui',
      'xing',
      'yi',
      'reveal_xing_yi',
      'ruo_ci',
      'bu_yi',
      'huo',
      'hu',
      'reveal_ruo_ci_bu_yi_huo_hu',
      'closing_sequence_order',
      'closing_causal_chain',
      'closing_evidence_multiselect',
    ],
    guideLine:
      '這段白話沒有告訴你新的答案。「劍掉進水裡」「立刻刻下記號」「船繼續開往目的地」「船抵達目的地後停下」「從記號處進入水中找劍」——這些畫面，都是你剛才自己一段一段破解出來的。',
    translation:
      '有一位楚國人乘船渡江。他的劍從船上掉進水裡，他立刻在自己乘坐的船上刻下一個記號，說：「這裡是我的劍掉下去的地方。」船繼續往目的地開去，抵達目的地後停了下來。楚人從自己刻記號的地方進入水中，尋找那把劍。可是，船已經離開劍掉進水裡的位置，劍並沒有跟著船一起移動。像這樣尋找劍，不是很糊塗嗎？',
    comparisonRows: [
      { decodedEvidence: '楚人有涉江者', vernacularExpression: '有一位楚國人乘船渡江', relationship: '同一畫面' },
      { decodedEvidence: '其劍自舟中墜於水', vernacularExpression: '他的劍從船上掉進水裡', relationship: '同一事件' },
      {
        decodedEvidence: '遽契其舟曰：是吾劍之所從墜',
        vernacularExpression: '他立刻在船上刻下記號，說：「這裡是我的劍掉下去的地方。」',
        relationship: '同一畫面與話語',
      },
      {
        decodedEvidence: '舟止，從其所契者入水求之',
        vernacularExpression: '船抵達目的地後停下來，楚人從刻記號的地方進入水中找劍',
        relationship: '同一事件',
      },
      {
        decodedEvidence: '舟已行矣，而劍不行',
        vernacularExpression: '船已經離開劍掉進水裡的位置，劍並沒有跟著船一起移動',
        relationship: '同一因果關係',
      },
      { decodedEvidence: '求劍若此，不亦惑乎', vernacularExpression: '像這樣尋找劍，不是很糊塗嗎？', relationship: '同一反問' },
    ],
    completionFeedback:
      '這篇古文，是你自己看懂的。你把一個字、一個詞、一幅畫面，拿去和其他古文線索比對，再用證據一步一步推理，最後把整篇故事接了起來。你完全沒有靠背誦字義，也沒有先偷看白話答案。太了不起了，古文破譯家！',
  },
};

export { wangRongLesson };

export const keZhouQiuJianLesson = approvedKeZhouQiuJianLesson;

export const legacyShouZhuDaiTuLesson: GuwenLesson = {
  id: 'shou-zhu-dai-tu',
  title: '守株待兔',
  source: '《韓非子・五蠹》',
  introSpokenLine:
    '我找到一篇農夫和兔子的故事。一隻兔子意外送上門之後，農夫做了一個決定。這個決定最後有沒有成功？我們從古文留下的線索開始破解。',
  fullText: '宋人有耕者，田中有株。兔走觸株，折頸而死。因釋其耒而守株，冀復得兔。兔不可復得，而身為宋國笑。',
  sentences: ['宋人有耕者，田中有株。', '兔走觸株，折頸而死。', '因釋其耒而守株，冀復得兔。', '兔不可復得，而身為宋國笑。'],
  steps: [
    {
      id: 'zhu',
      type: 'evidence',
      prerequisiteIds: [],
      targetSentence: '田中有株',
      intro: '農夫的田裡有一個「株」。我找到兩句古文。比較它們，你覺得「株」最可能是哪一類東西？',
      clues: [
        {
          text: '猶朽株枯樹，逢風則仆。',
          highlight: '株',
          unlockedMeaning: '就像腐朽的「株」和枯樹，遇到風吹便會倒下。',
          source: '《意林・正部十卷》',
        },
        {
          text: '枯株倒向溪邊爛，留待明年木耳生。',
          highlight: '株',
          unlockedMeaning: '枯「株」倒在溪邊，慢慢腐爛；等到明年，上面會長出木耳。',
          source: '錢澄之《白鹿坪贈寶惜庵主》（其六）',
        },
      ],
      question:
        '一條線索把「株」和枯樹放在一起；另一條線索說，枯「株」倒在溪邊腐爛，上面還會長出木耳。回到農夫的田裡，「株」最可能是什麼？',
      options: ['一段枯老的、斷裂後殘留在地上的樹樁', '一隻會在田裡奔跑的動物', '一件拿在手裡翻土的農具'],
      correctIndex: 0,
      correctFeedback: '破解成功！「株」和樹木有關；它是樹木被砍斷後，留在原處的部分。',
      retryHint: '先不要猜兔子和農具。找找看：兩條線索中，什麼東西都和「株」一起出現？',
      explanation:
        '第一條線索把「朽株」和「枯樹」並列在一起。風吹來時，它們都可能倒下，因此「株」和樹木、木頭有關，不是動物，也不是人拿在手裡使用的工具。\n\n第二條線索裡，枯「株」倒在溪邊，會慢慢腐爛，後來上面還能長出木耳。這提供了更直接的證據：「株」是木質的東西，不是動物，也不是拿在手裡使用的農具。\n\n再回到本篇目前能看到的文字：田中有株。兔走觸株……因釋其耒而守株……「株」原本就在田裡；後來兔子會撞上它，農夫也能一直守在它旁邊。這些線索共同指向一個堅硬、固定在原處的木頭殘幹。\n\n因此，目前可以破解出：「株」是樹木被砍斷或折斷後，留在地上的根和一小段樹幹，也就是樹樁。\n\n第二個選項會在田裡奔跑，無法解釋「枯株」安靜不動的畫面。第三個選項是農具，但「株」在田裡固定不動，後文還會另外出現農夫的農具「耒」。\n\n只靠這些線索，我們還不知道這個樹樁有多高、多粗，也不知道原本是什麼樹；原文沒有說，不需要自行補上。',
      finalDraftLine: '宋國有一位耕田的人，他的田裡有一個樹樁',
      keyAwarded: { code: '株', decodedEvidence: '樹木被砍斷或折斷後，仍留在地上的根和一小段樹幹，也就是樹樁' },
    },
    {
      id: 'chu',
      type: 'evidence',
      prerequisiteIds: ['zhu'],
      targetSentence: '兔走觸株',
      intro: '兔子正在跑，前面有一個樹樁。古文說牠「觸株」。我找到兩個動作結果，我們來判斷「觸」是怎樣的動作。',
      clues: [
        {
          text: '羝羊觸藩，羸其角。',
          highlight: '觸',
          unlockedMeaning: '（「羝羊」是公羊，「藩」是籬笆。）公羊「觸」了籬笆，結果羊角被卡住了。',
          source: '《易經・大壯》',
        },
        {
          text: '觸槐而死。',
          highlight: '觸',
          unlockedMeaning: '一個人「觸」了槐樹，接著死了。',
          source: '《左傳・宣公二年》',
        },
      ],
      question: '比較兩條線索：「觸」最可能是哪一種動作？',
      options: ['朝前方的東西猛力碰上去', '繞過前方的東西繼續跑', '靠近前方的東西停下來'],
      correctIndex: 0,
      correctFeedback: '破解成功！公羊的角被卡住，那個人也因為這個動作而死；「觸」不是繞過或停在旁邊，而是碰撞上去。',
      retryHint: '先看動作造成的結果：一個羊角被卡住，一個人死了。哪一種動作可能造成這些結果？',
      explanation:
        '第一條線索裡，公羊朝籬笆「觸」去，結果羊角卡在籬笆中。這表示公羊不是繞過籬笆，也不是只在籬笆旁邊停下來。\n\n第二條線索裡，一個人對槐樹做出「觸」的動作後死亡。這表示他和槐樹之間發生了猛烈的碰撞。\n\n兩條線索共同留下的結果是：做出「觸」的動作後，身體會直接碰上前方的東西。因此，目前可以破解出：「觸」是朝著某個東西碰撞上去。\n\n第一個選項能同時解釋羊角為什麼卡住，以及人為什麼會死。第二個選項沒有碰到前方的東西；第三個選項只是停下，也不會造成兩條線索中的結果。\n\n僅憑這兩條線索，我們還不知道本篇兔子跑得多快，也不知道牠從哪個方向跑來；原文沒有說，不需要自行補上。',
      keyAwarded: { code: '觸', decodedEvidence: '朝著某個東西碰撞上去' },
    },
    {
      id: 'tu_zou_chu_zhu',
      type: 'reconstruction',
      prerequisiteIds: ['chu'],
      targetSentence: '兔走觸株',
      intro: '三把密碼鑰匙都找到了。按照古文原來的順序，把這個畫面組合起來。',
      keys: [
        { code: '走', decodedEvidence: '跑' },
        { code: '觸', decodedEvidence: '朝著某個東西碰撞上去' },
        { code: '株', decodedEvidence: '留在地上的樹樁' },
      ],
      question: '「兔走觸株」最可能是哪一幅畫面？',
      options: ['兔子奔跑時撞上了樹樁', '兔子繞過樹樁繼續往前跑', '農夫拿著樹樁追趕兔子'],
      correctIndex: 0,
      correctFeedback: '畫面接起來了：兔子正在跑，接著撞上田裡的樹樁。',
      retryHint: '按照「兔—走—觸—株」的順序，再確認是誰在跑、碰上了什麼。',
      explanation:
        '「兔」是這個畫面的主角。「走」在已學古文中表示跑；「觸」表示朝著某個東西碰撞上去；「株」是留在地上的樹樁。\n\n依照原文順序合起來，目前可以讀成：兔子奔跑時撞上了樹樁。\n\n第二個選項把「觸」改成了繞過，與兩條古文線索中的碰撞結果不符。第三個選項把行動者換成農夫，也打亂了原文的順序。',
      finalDraftLine: '兔子奔跑時撞上了樹樁',
    },
    {
      id: 'zhe',
      type: 'evidence',
      prerequisiteIds: ['tu_zou_chu_zhu'],
      targetSentence: '折頸而死',
      intro: '兔子撞上了堅硬的樹樁，接著「折頸而死」。「頸」就是頸部，也就是脖子。可是這裡的「折」表示發生了什麼？',
      clues: [
        {
          text: '大風折木。',
          highlight: '折',
          unlockedMeaning: '大風吹過，樹木被「折」了。',
          source: '《晉書・五行志下》',
        },
        {
          text: '纖手折其枝，花落何飄颺。',
          highlight: '折',
          unlockedMeaning: '一雙手「折」了樹枝，花朵便飄落下來。',
          source: '宋子侯〈董嬌饒〉',
        },
      ],
      question: '比較兩條線索：樹木或樹枝被「折」之後，最可能發生了什麼？',
      options: ['被彎斷或斷裂', '繼續向上生長', '輕輕搖晃後恢復原狀'],
      correctIndex: 0,
      correctFeedback: '破解成功！大風能「折」木，手也能「折」枝；兩個畫面裡，原本完整的部分都受力彎斷了。',
      retryHint: '看看第二條線索的結果：手做出「折」的動作後，花朵為什麼會從枝頭落下？',
      explanation:
        '第一條線索裡，大風吹過後，樹木被「折」。這不是樹木繼續生長，也不是風吹過後完全恢復原狀，而是樹木受到強大的力量而損壞。\n\n第二條線索裡，一雙手「折」了樹枝，花朵便從枝頭飄落。這表示樹枝原來完整地連在樹上，受力後彎斷或斷裂。\n\n兩條線索共同指出：「折」表示某個部分受到力量後彎斷或斷裂。\n\n第一個選項能同時解釋樹木被大風吹壞，以及花朵為什麼從枝頭落下。第二個選項和兩條線索的損壞結果相反；第三個選項無法解釋花朵飄落的結果。\n\n僅憑這兩條線索，我們還不知道兔子的頸部究竟受傷到什麼程度；要把「折」放回原文，才能看見後面的結果。',
      keyAwarded: { code: '折', decodedEvidence: '受到力量後彎斷或斷裂' },
    },
    {
      id: 'zhe_jing_er_si',
      type: 'reconstruction',
      prerequisiteIds: ['zhe'],
      targetSentence: '折頸而死',
      intro: '「折」的密碼已經取得。現在回到兔子撞上樹樁後的結果。',
      keys: [
        { code: '折', decodedEvidence: '受到力量後彎斷或斷裂' },
        { code: '頸', decodedEvidence: '頸部，也就是脖子' },
        { code: '而死', decodedEvidence: '接著死了' },
      ],
      question: '「折頸而死」最可能是哪一幅畫面？',
      options: ['兔子的頸部折斷，接著死了', '兔子低下頭，在樹樁旁邊睡著了', '兔子的腳被樹枝纏住，停在原地'],
      correctIndex: 0,
      correctFeedback: '畫面接上了：兔子奔跑時撞上樹樁，頸部因碰撞而折斷，接著死了。',
      retryHint: '「頸」是脖子；剛取得的「折」又表示彎斷或斷裂。把兩把鑰匙按照原文順序接起來。',
      explanation:
        '「折」表示受到力量後彎斷或斷裂；「頸」是頸部，也就是脖子；「而死」接著寫出死亡的結果。\n\n三個部分按照原文順序合起來，可以讀成：兔子的頸部折斷，接著死了。\n\n第二個選項把「折頸」誤讀成低下頭，無法解釋前面猛烈碰撞的畫面。第三個選項把受傷部位換成腳，也加入了原文沒有出現的樹枝。',
      finalDraftLine: '頸部折斷，接著死了',
    },
    {
      id: 'lei',
      type: 'evidence',
      prerequisiteIds: ['zhe_jing_er_si'],
      targetSentence: '因釋其耒而守株',
      intro:
        '「其」會把後面的東西連回前文中的人物，因此「其耒」就是這位農夫的「耒」。這位宋國人原本正在田裡工作，古文接著提到「他的耒」。「耒」究竟是什麼？先比較兩條古文線索。',
      clues: [
        {
          text: '揉木為耒。',
          highlight: '耒',
          unlockedMeaning: '古人把木頭彎曲，做成「耒」。',
          source: '《易經・繫辭下》',
        },
        {
          text: '言耕者眾，執耒者寡也。',
          highlight: '耒',
          unlockedMeaning: '談論耕田的人很多，真正拿起「耒」工作的人卻很少。',
          source: '《韓非子・五蠹》',
        },
      ],
      question: '比較兩條線索：「耒」最可能是什麼？',
      options: ['木製的耕田工具', '裝兔子的竹籃', '放在樹旁的矮凳'],
      correctIndex: 0,
      correctFeedback: '破解成功！「耒」用木頭製成，人們拿著它耕田，所以它是一種木製農具。',
      retryHint: '一條線索告訴你製作材料，另一條線索告訴你人們拿著它做什麼。把兩項證據合起來。',
      explanation:
        '第一條線索說，古人把木頭彎曲，製成「耒」。因此，「耒」是木製的東西。\n\n第二條線索把「談論耕田」和「拿起耒工作」放在一起。這表示人們拿著「耒」實際從事耕田工作。\n\n兩條線索合起來，目前可以破解出：「耒」是古代用來耕田的木製農具。\n\n第一個選項同時符合「木頭製成」與「拿來耕田」兩項證據。第二個選項雖然也可能用竹木製作，卻沒有耕田的功能；第三個選項不能解釋人們為什麼要「執耒」工作。\n\n這兩條線索只能幫我們確定「耒」的材料與用途，還不能確定它每一部分的形狀；不需要自行補上。',
      keyAwarded: { code: '耒', decodedEvidence: '古代用來耕田的木製農具' },
    },
    {
      id: 'shi',
      type: 'evidence',
      prerequisiteIds: ['lei'],
      targetSentence: '因釋其耒而守株',
      intro: '「耒」是農夫耕田用的工具。古文卻說他「釋其耒」，接著去守著樹樁。他對手中的農具做了什麼？',
      clues: [
        {
          text: '庖丁釋刀對曰。',
          highlight: '釋',
          unlockedMeaning: '廚師「釋」了手中的刀，開始回答國君的問題。',
          source: '《莊子・養生主》',
        },
        {
          text: '士皆釋甲，束馬而飲酒。',
          highlight: '釋',
          unlockedMeaning: '士兵們「釋」了身上的鎧甲，綁好馬，開始喝酒。',
          source: '《左傳・襄公二十八年》',
        },
      ],
      question: '比較兩條線索：刀和鎧甲被「釋」之後，原本使用它們的人做了什麼改變？',
      options: ['不再拿著或穿著它們，轉去做別的事', '把它們抓得更緊，繼續原來的動作', '把它們交給另一個人繼續使用'],
      correctIndex: 0,
      correctFeedback: '破解成功！廚師不再拿刀，士兵也不再穿著鎧甲；「釋」讓人放開或放下原本使用的東西。',
      retryHint: '注意兩條線索中「釋」後面的動作：一個人開始回答問題，另一群人開始喝酒。他們還在繼續原來的工作嗎？',
      explanation:
        '第一條線索裡，廚師原本拿刀工作；他「釋刀」之後，轉而回答國君的問題。因此，他不再拿著刀繼續原來的動作。\n\n第二條線索裡，士兵們「釋甲」之後，綁好馬並開始喝酒。因此，他們不再穿著鎧甲準備行動。\n\n兩條線索共同指出：「釋」表示放開、放下或卸下原本拿著、穿著的東西。\n\n第一個選項能同時解釋廚師和士兵的轉變。第二個選項與後續動作相反；第三個選項加入了兩條古文都沒有寫出的另一個人。\n\n回到本篇時，農夫「釋」的不是刀或鎧甲，而是已經破解出的耕田工具「耒」。',
      keyAwarded: { code: '釋', decodedEvidence: '放開、放下或卸下原本拿著、穿著的東西' },
    },
    {
      id: 'shi_qi_lei',
      type: 'reconstruction',
      prerequisiteIds: ['shi'],
      targetSentence: '釋其耒',
      intro: '「釋」的密碼已經取得。現在把它和已經知道的「其」「耒」接起來。',
      keys: [
        { code: '釋', decodedEvidence: '放開、放下原本使用的東西' },
        { code: '其', decodedEvidence: '他的；指前文的宋國農夫' },
        { code: '耒', decodedEvidence: '古代用來耕田的木製農具' },
      ],
      question: '「釋其耒」最可能是哪一幅畫面？',
      options: ['農夫放下了自己的耕田工具', '農夫拿起工具繼續耕田', '農夫把兔子放進竹籃裡'],
      correctIndex: 0,
      correctFeedback: '畫面接起來了：農夫停下原來的工作，放下了自己的耕田工具。',
      retryHint: '按照「釋—其—耒」的順序，確認農夫對「自己的耕田工具」做了什麼。',
      explanation:
        '「釋」表示放下原本使用的東西；「其」把農具連回前文中的農夫；「耒」是古代耕田用的木製農具。\n\n三把鑰匙按照原文順序合起來，可以讀成：農夫放下了自己的耕田工具。\n\n第二個選項把「釋」理解成拿起，方向正好相反。第三個選項加入竹籃，也把「耒」錯認成裝東西的容器。\n\n目前只破解了農夫做出的動作。至於他為什麼放下農具，要等下一步破解句首的「因」。',
    },
    {
      id: 'yin',
      type: 'evidence',
      prerequisiteIds: ['shi_qi_lei'],
      targetSentence: '因釋其耒而守株',
      intro: '一邊是兔子撞上樹樁後發生的事，一邊是農夫接下來的行動。「因」放在兩幅畫面中間。它怎麼把前後接起來？',
      clues: [
        {
          text: '有行人見之，因竊取獐而去。',
          highlight: '因',
          unlockedMeaning: '（「獐」是一種像鹿的動物。）一個路人看見陷阱裡的獐，「因」偷偷把牠拿走了。',
          source: '《抱朴子・內篇・道意》',
        },
        {
          text: '見陳氏不樂，因問其故。',
          highlight: '因',
          unlockedMeaning: '他看見陳氏不開心，「因」問她發生了什麼事。',
          source: '《百家公案》第六十四回',
        },
      ],
      question: '比較兩條線索：「因」前面先出現一個情況，「因」後面的人接著做了什麼？',
      options: ['受到前面情況的影響，接著做出後面的行動', '完全不理會前面的情況，繼續做原來的事', '先做完後面的行動，才看見前面的情況'],
      correctIndex: 0,
      correctFeedback: '破解成功！兩條線索都用「因」把前面的情況接到人物隨後採取的行動。',
      retryHint: '看清楚動作順序：路人先看見獐，才把牠拿走；另一個人先看見陳氏不開心，才開口詢問。',
      explanation:
        '第一條線索中，路人先看見陷阱裡的獐，後面才出現「偷偷把牠拿走」的行動。「因」放在這兩件事中間。\n\n第二條線索中，一個人先看見陳氏不開心，後面才開口詢問發生了什麼事。「因」也放在看見情況與採取行動之間。\n\n兩條線索共同留下的順序是：前面發生一個情況 → 人物受到這個情況的影響 → 接著採取行動\n\n因此，目前可以破解出：「因」把前面發生的情況接到人物隨後採取的行動；在這裡可以讀成「於是／因此便」。\n\n第一個選項能同時解釋兩條線索。第二個選項說人物不理會前面的情況，無法解釋他們為什麼接著偷走獐或開口詢問。第三個選項把事件順序倒過來了。\n\n回到本篇，前面先發生「兔走觸株，折頸而死」，後面農夫才「釋其耒而守株」。所以「因」正在把兔子死亡這件事，接到農夫隨後做出的選擇。\n\n只靠「因」，我們能確定前後有承接關係；至於農夫心裡究竟希望發生什麼，還要繼續破解後面的「冀復得兔」，不能先替他補出原文沒有明說的想法。',
      keyAwarded: { code: '因', decodedEvidence: '把前面發生的情況接到人物隨後採取的行動；在這裡可以讀成「於是／因此便」' },
    },
    {
      id: 'yin_shi_qi_lei_er_shou_zhu',
      type: 'reconstruction',
      prerequisiteIds: ['yin'],
      targetSentence: '因釋其耒而守株',
      intro: '六把密碼鑰匙都找到了。現在把它們按照原文順序接起來：「因釋其耒而守株」是哪一幅畫面？',
      keys: [
        { code: '因', decodedEvidence: '把前面發生的情況接到人物隨後採取的行動' },
        { code: '釋', decodedEvidence: '放開、放下原本使用的東西' },
        { code: '其', decodedEvidence: '他的；指前文的宋國農夫' },
        { code: '耒', decodedEvidence: '古代用來耕田的木製農具' },
        { code: '而', decodedEvidence: '連接前後兩個動作' },
        { code: '守株', decodedEvidence: '守在樹樁旁' },
      ],
      question: '「因釋其耒而守株」最可能是哪一幅畫面？',
      options: [
        '兔子撞樹樁死後，農夫便放下自己的耕田工具，守在樹樁旁',
        '農夫先守著樹樁，等兔子撞上來後，再拿起工具繼續耕田',
        '農夫把樹樁搬走，拿著耕田工具去追趕兔子',
      ],
      correctIndex: 0,
      correctFeedback: '整句接起來了：兔子意外死在樹樁旁，農夫於是放下農具，改去守著樹樁。',
      retryHint: '先找順序：「因」先接住前面兔子死亡的事；「釋其耒」再寫農夫放下什麼；最後才是「守株」。',
      explanation:
        '「因」接住前面兔子撞上樹樁、折頸而死的事情，再帶出農夫隨後採取的行動。\n\n「釋其耒」已經破解為農夫放下自己的耕田工具；「而」把下一個動作接上來；「守株」則寫他守在樹樁旁。\n\n依照原文順序組合，可以讀成：兔子撞樹樁死後，農夫便放下自己的耕田工具，守在樹樁旁。\n\n第二個選項把動作順序倒過來，也把「釋」改成拿起。第三個選項加入搬走樹樁與追趕兔子，這些都沒有古文證據。\n\n這一句只寫出農夫因前一件事而改變行動。它還沒有完整說明農夫守在樹樁旁想得到什麼；答案藏在下一句「冀復得兔」。',
      finalDraftLine: '農夫於是放下自己的耕田工具，守在樹樁旁',
    },
    {
      id: 'ji',
      type: 'evidence',
      prerequisiteIds: ['yin_shi_qi_lei_er_shou_zhu'],
      targetSentence: '冀復得兔',
      intro: '農夫已經守在樹樁旁，但後面的事情還沒有發生。「冀」透露了他的某種心理狀態。比較兩條線索看看。',
      clues: [
        {
          text: '不如自行搜覓，冀有萬一之得。',
          highlight: '冀',
          unlockedMeaning: '（成名一家必須找到一隻蟋蟀。）與其等別人幫忙，不如自己到處尋找，「冀」能有一點點收穫。',
          source: '蒲松齡《聊齋志異・促織》',
        },
        {
          text: '冀其自新。',
          highlight: '冀',
          unlockedMeaning: '（霍雲犯了錯，皇帝暫時沒有公開處罰他。）皇帝「冀」霍雲能改正錯誤。',
          source: '《漢書・宣帝紀》',
        },
      ],
      question: '找蟋蟀的人還沒有收穫，霍雲也還沒有改正。兩條線索裡的「冀」，最可能表示哪一種心情？',
      options: ['確定事情早已完成，只是在回想結果', '想讓尚未發生的事情成真，但還不知道會不會成功', '已經放棄這件事情，不再等待任何改變'],
      correctIndex: 1,
      correctFeedback: '破解成功！「冀」指向一個人想要的未來結果，但這個結果還沒有發生。',
      retryHint: '看看兩條線索中的結果：蟋蟀已經找到了嗎？霍雲已經改正了嗎？',
      explanation:
        '第一條線索中，成名一家急著找蟋蟀，只能自己到處搜尋。他們「冀」有一點點收穫，但作出這個想法時，蟋蟀還沒有找到。\n\n第二條線索中，皇帝暫時沒有公開處罰霍雲，「冀」霍雲改正錯誤。但這時霍雲還沒有完成改正，皇帝也不能確定他一定會改。\n\n兩條線索共同留下的是：人心裡朝著一個尚未發生的結果等待，而且結果不一定會成真。\n\n因此，目前可以破解出：「冀」表示心裡想讓一件尚未發生、也不確定會不會發生的事成真。\n\n第二個選項能解釋兩條線索。第一個選項說事情已經完成，和兩條線索都不合；第三個選項表示放棄，也無法解釋人們為什麼還在尋找或等待改變。\n\n回到本篇，我們目前只知道農夫心裡想讓「復得兔」成真。究竟是第一次得到兔子，還是想再發生一次，要繼續破解「復」。',
      keyAwarded: { code: '冀', decodedEvidence: '心裡想讓一件尚未發生、也不確定會不會發生的事成真' },
    },
    {
      id: 'fu',
      type: 'evidence',
      prerequisiteIds: ['ji'],
      targetSentence: '冀復得兔',
      intro: '「冀」讓我們知道農夫正在等待一個結果。「復」放在結果前面，增加了什麼時間線索？',
      clues: [
        {
          text: '屠懼，投以骨。一狼得骨止，一狼仍從；復投之，後狼止。',
          highlight: '復',
          unlockedMeaning: '屠夫害怕了，先丟出一塊骨頭；一隻狼停下，另一隻仍然跟著。他「復」丟出骨頭，這次後面的狼停下了。',
          source: '蒲松齡《聊齋志異・狼》',
        },
        {
          text: '奔流到海不復回。',
          highlight: '復',
          unlockedMeaning: '黃河的水一路奔向大海，之後不「復」回來。',
          source: '李白〈將進酒〉',
        },
      ],
      question:
        '第一條線索中，屠夫已經丟過一塊骨頭，後來出現「復投」；第二條線索說水入海後「不復回」。「復」替事情加上了哪一條時間線索？',
      options: ['第一次發生以前，事情完全還沒開始', '第一次發生以後，同樣的事情還會再出現一次', '事情只發生一次，後面不可能有任何變化'],
      correctIndex: 1,
      correctFeedback: '破解成功！「復」把我們帶到第一次之後，表示同樣的事情再出現。',
      retryHint: '找出兩條時間線：屠夫第一次丟骨頭之後，還做了什麼？河水入海之後，古文說什麼不會再次發生？',
      explanation:
        '第一條線索中，屠夫已經丟過一次骨頭，一隻狼卻仍然跟著；後來古文寫他「復投之」。因此，「復」指向第一次之後，再出現同樣的動作。\n\n第二條線索中，黃河水已經奔流入海，古文說它「不復回」。這裡否定的是：入海之後，再出現「回來」的情況。\n\n兩條線索共同指出：「復」把事情放在第一次之後，表示同樣的事情再發生一次。\n\n第二個選項能解釋「投過之後復投」與「入海後不復回」。第一個選項把時間移到第一次以前；第三個選項無法解釋第一條線索為什麼還會再次丟骨頭。\n\n因此，目前可以破解出：「復」在這裡可以讀成「再、又」。\n\n回到本篇，前文已經寫過農夫意外得到一隻兔子。因此「復得兔」不是第一次得到兔子，而是想讓得到兔子的事情再次發生。',
      keyAwarded: { code: '復', decodedEvidence: '在第一次之後，再發生一次；這裡可以讀成「再、又」' },
    },
    {
      id: 'ji_fu_de_tu',
      type: 'reconstruction',
      prerequisiteIds: ['fu'],
      targetSentence: '冀復得兔',
      intro: '三把密碼鑰匙都找到了。按照「冀—復—得兔」的順序，農夫心裡正在想什麼？',
      keys: [
        { code: '冀', decodedEvidence: '想讓一件尚未發生、也不確定會不會發生的事成真' },
        { code: '復', decodedEvidence: '在第一次之後，再發生一次' },
        { code: '得兔', decodedEvidence: '得到兔子' },
      ],
      question: '「冀復得兔」最可能是哪一幅畫面？',
      options: [
        '農夫確定自己已經得到很多兔子，不必繼續等待',
        '農夫想再得到兔子，但這件事還沒有發生，也不確定會不會成功',
        '農夫不想再得到兔子，準備拿起農具回去耕田',
      ],
      correctIndex: 1,
      correctFeedback: '願望畫面接起來了：農夫守在樹樁旁，想讓得到兔子的事情再次發生。',
      retryHint: '「冀」寫的是尚未實現的願望；「復」又說明，這件事以前已經發生過一次。',
      explanation:
        '「冀」表示農夫心裡想讓一個尚未發生的結果成真；「復」把這個結果放在第一次之後；「得兔」則是得到兔子。\n\n三把鑰匙依照原文順序組合，可以讀成：農夫想再得到兔子。\n\n這個願望尚未實現，而且農夫也不能確定它會不會成功。第一個選項把願望誤寫成已經完成的事；第三個選項把想要的結果反過來，也加入了回去耕田的行動。\n\n這裡有一個重要的證據邊界：「農夫想再得到兔子」不是我們替他猜的內心。古文明確使用「冀復得兔」，直接寫出了他的願望。\n\n但是，古文並沒有寫農夫相信兔子「每天」都會來，也沒有寫他認為兔子「一定」會再撞上樹樁。這些說法如果出現，只能算讀者另外增加的推論。',
      finalDraftLine: '想再得到兔子',
    },
    {
      id: 'tu_bu_ke_fu_de',
      type: 'reconstruction',
      prerequisiteIds: ['ji_fu_de_tu'],
      targetSentence: '兔不可復得',
      intro: '前一句寫農夫的願望：「冀復得兔。」下一句立刻寫：「兔不可復得。」他的願望最後有沒有實現？',
      keys: [
        { code: '兔', decodedEvidence: '兔子' },
        { code: '不可', decodedEvidence: '不能、不可能' },
        { code: '復', decodedEvidence: '在第一次之後，再發生一次' },
        { code: '得兔', decodedEvidence: '得到兔子' },
      ],
      question: '「兔不可復得」最可能是哪一幅畫面？',
      options: ['農夫守著樹樁，果然又得到了一隻兔子', '農夫守著樹樁，卻不能靠同樣的方法再次得到兔子', '農夫放棄兔子，拿起農具回去繼續耕田'],
      correctIndex: 1,
      correctFeedback: '願望和結果對上了：農夫「冀復得兔」，結果卻是「不可復得」。',
      retryHint: '把已經取得的「復得」放回句中，再看看它前面多了哪兩個字。',
      explanation:
        '上一句的「冀復得兔」寫出農夫的願望：他想再次得到兔子。\n\n這一句再次出現「復得」，前面卻加上「不可」：冀復得兔 → 想再次得到兔子；不可復得 → 不能再次得到兔子\n\n同一組文字前後重複，讓願望與結果形成清楚的相反畫面。\n\n第二個選項符合「不可＋復得」。第一個選項把「不可」讀成願望成功；第三個選項雖然可能是比較合理的做法，古文卻沒有寫農夫拿起農具回去耕田。\n\n因此，目前可以把這句讀成：農夫守著樹樁，卻不能靠同樣的方法再次得到兔子。\n\n這裡的「不可復得」不是說世界上從此沒有兔子，也不是說農夫使用任何方法都不可能抓到兔子。它否定的是農夫眼前這個做法：只守著樹樁，不能讓偶然發生的事情再次出現。',
      finalDraftLine: '可是，靠守著樹樁，他不可能再次得到兔子',
    },
    {
      id: 'shen',
      type: 'evidence',
      prerequisiteIds: ['tu_bu_ke_fu_de'],
      targetSentence: '而身為宋國笑',
      intro:
        '農夫沒有得到第二隻兔子，古文接著把鏡頭轉回「身」。這裡是在說他的身體，還是在指出結果落到誰身上？比較兩條線索看看。',
      clues: [
        {
          text: '此其近者禍及身，遠者及其子孫。',
          highlight: '身',
          unlockedMeaning: '這種禍事，最先會落到「身」上，影響更遠時還會連累子孫。',
          source: '《戰國策・趙策四・觸龍說趙太后》',
        },
        {
          text: '或暴虐賊害人，終皆禍及身。',
          highlight: '身',
          unlockedMeaning: '有人殘暴地傷害別人，最後禍事都會落到「身」上。',
          source: '《春秋繁露・俞序》',
        },
      ],
      question: '兩條線索都寫「禍及身」：前面是禍事，後面是承受禍事的「身」。這裡的「身」最可能指誰？',
      options: ['這個人自己、本人', '只有這個人的手腳和軀幹', '這個人的子孫，不包括他自己'],
      correctIndex: 0,
      correctFeedback: '破解成功！禍事落到「身」上，就是結果由這個人自己承受。',
      retryHint: '第一條線索把「身」和「子孫」分開寫。先想想：近的禍事由誰承受，遠的才會影響誰？',
      explanation:
        '第一條線索把「身」和「子孫」分開：近的禍事先「及身」，更遠的結果才會影響子孫。因此，「身」指的是這個人自己，不是他的下一代。\n\n第二條線索中，殘暴傷害別人的人，最後「禍及身」。承受禍事的正是做出這些行為的人自己。\n\n兩條線索共同指出：「身」在這裡指這個人自己、本人。\n\n第一個選項能同時解釋兩句「禍及身」。第二個選項只把「身」理解成身體部位，無法解釋第一句為什麼把「身」和「子孫」對照；第三個選項則把兩者的範圍弄反了。\n\n回到本篇，「身」指的就是前文那位放下農具、守著樹樁的宋國農夫。古文即將說明，最後承受結果的是他本人。\n\n但是，只破解「身」還不知道他承受了什麼結果；下一步必須繼續破解「為」在這句中負責什麼工作。',
      keyAwarded: { code: '身', decodedEvidence: '這個人自己、本人' },
    },
    {
      id: 'wei',
      type: 'evidence',
      prerequisiteIds: ['shen'],
      targetSentence: '而身為宋國笑',
      intro: '「為」放在不同位置時，工作可能不一樣。我找到兩條古文線索。比較兩幅畫面，看看這裡的「為」負責什麼工作。',
      clues: [
        {
          text: '有好乘馬者為人所欺。以五十金易一馬，駑甚。',
          highlight: '為',
          unlockedMeaning: '有個喜歡騎馬的人「為」別人欺騙，花五十金換來一匹馬，那匹馬卻跑得很慢。',
          source: '《笑府》',
        },
        {
          text: '居真之次子夜出，為虎所食。',
          highlight: '為',
          unlockedMeaning: '王居真的第二個兒子晚上出門，後來「為」老虎吃掉。',
          source: '《太平廣記・王居真》',
        },
      ],
      question: '哪一個現代字放到兩句的「為」的位置，兩幅畫面的動作方向都不會改變？',
      options: ['被', '替', '變成'],
      correctIndex: 0,
      correctFeedback: '破解成功！騎馬的人「被」別人欺騙；王居真的兒子「被」老虎吃掉。',
      retryHint: '看看動作的結果：買馬的人承受了騙局的後果；晚上出門的人承受了老虎的攻擊。哪個選項能保持這個方向？',
      explanation:
        '第一條線索中，喜歡騎馬的人花了很多錢，換來的馬卻跑得很慢。承受欺騙結果的是買馬的人；做出欺騙行動的「人」放在「為」後面。\n\n第二條線索中，王居真的兒子晚上出門，最後被老虎吃掉。承受結果的是王居真的兒子；做出「吃」這個動作的「虎」也放在「為」後面。\n\n兩條線索中的動作雖然不同，排列方式卻相同：買馬的人「為」別人欺騙；王居真的兒子「為」老虎吃掉。\n\n把「為」換成「被」，兩句的方向都不會改變：買馬的人被別人欺騙。王居真的兒子被老虎吃掉。\n\n因此，目前可以破解出：這種句型裡的「為」，相當於現代中文的「被」。\n\n「替」不能解釋為什麼買馬的人承受欺騙、出門的人承受老虎的攻擊；「變成」也不能接成「變成別人欺騙」或「變成老虎吃掉」。\n\n回到原文：而身「為」宋國笑。現在我們知道「為」可以先換成「被」，但還要把「身」「宋國」「笑」依照原文順序組合，才能看清楚完整畫面。',
      keyAwarded: { code: '為', decodedEvidence: '在這個句型中相當於「被」。它把發出動作的一方放在後面' },
    },
    {
      id: 'er_shen_wei_song_guo_xiao',
      type: 'reconstruction',
      prerequisiteIds: ['wei'],
      targetSentence: '兔不可復得，而身為宋國笑',
      intro: '農夫的願望沒有成功，故事卻還有最後一個結果。把剛取得的密碼依照「身＋為＋宋國＋笑」的順序接回去，哪一幅畫面最符合古文？',
      keys: [
        { code: '兔不可復得', decodedEvidence: '農夫不能靠守著樹樁再次得到兔子' },
        { code: '而', decodedEvidence: '連接前後兩個結果；這裡可以讀成「反而」' },
        { code: '身', decodedEvidence: '農夫自己、本人' },
        { code: '為', decodedEvidence: '在這個句型中相當於「被」' },
        { code: '宋國', decodedEvidence: '這裡指宋國的人' },
        { code: '笑', decodedEvidence: '取笑' },
      ],
      question: '「而身為宋國笑」最可能是哪一幅畫面？',
      options: [
        '農夫沒有得到兔子，反而自己受到宋國人的取笑',
        '農夫沒有得到兔子，反而開始取笑所有宋國人',
        '農夫沒有得到兔子，於是和宋國人一起取笑兔子',
      ],
      correctIndex: 0,
      correctFeedback: '故事的最後一幅畫面完成了：他想靠守著樹樁再次得到兔子，結果兔子沒有等到，自己反而成了宋國人取笑的對象。',
      retryHint: '先把上一題取得的「為＝被」放回句中，再看看「宋國」排在它的前面還是後面。',
      explanation:
        '前半句「兔不可復得」已經說明，農夫守著樹樁，不能讓第一次的意外再次發生。\n\n後半句中：身 → 農夫自己；為 → 被；宋國 → 宋國的人；笑 → 取笑\n\n「而」把兩個結果接起來，還帶出出乎農夫期待的轉折：他原本希望再得到兔子，最後不但沒有得到，自己反而受到取笑。\n\n因此，完整末句可以讀成：農夫不能靠守著樹樁再次得到兔子，自己反而受到宋國人的取笑。\n\n第二個選項把「為」標示的動作方向顛倒；第三個選項則增加了「大家一起取笑兔子」的畫面，原文沒有這項證據。\n\n古文明確寫出的只有兩個結果：一、兔子不可能再次靠這種方式得到。二、農夫自己受到宋國人的取笑。\n\n至於宋國人說了哪些話、農夫當時是否難過，以及他後來有沒有回去耕田，原文都沒有交代。',
      finalDraftLine: '自己反而受到宋國人的取笑',
    },
  ],
  sequenceOrderingClosing: {
    id: 'closing_sequence_order',
    title: '完成全文因果鏈',
    intro:
      '所有古文密碼都解開了。六張因果卡片被打亂了，用上下移動的按鈕，把先發生的放在上面，後發生的接在下面，排出「事情發生 → 農夫行動 → 願望 → 最後結果」的完整故事順序。',
    cards: [
      { id: 'A', text: '農夫希望再次得到兔子。' },
      { id: 'B', text: '一隻奔跑的兔子撞上樹樁，折斷頸子死了。' },
      { id: 'C', text: '農夫自己反而受到宋國人的取笑。' },
      { id: 'D', text: '農夫的田裡原本有一個樹樁。' },
      { id: 'E', text: '農夫因為兔子撞死的事件，放下農具守著樹樁。' },
      { id: 'F', text: '農夫不能靠守著樹樁再次得到兔子。' },
    ],
    correctOrder: ['D', 'B', 'E', 'A', 'F', 'C'],
    correctFeedback: '全文因果鏈完成！你把事情、行動、願望和結果全部接回正確位置了。',
    retryHint: '先找故事的起點，再找「因」：農夫是在兔子撞死以前，還是在這件事發生以後，才放下農具守著樹樁？',
    explanation:
      '每張卡片對應的古文證據：\n\n田中有株 → 農夫的田裡原本有一個樹樁\n兔走觸株，折頸而死 → 兔子奔跑時撞上樹樁而死\n因釋其耒而守株 → 農夫因為這次事件，放下農具守著樹樁\n冀復得兔 → 農夫希望再次得到兔子\n兔不可復得 → 農夫不能靠守株再次得到兔子\n而身為宋國笑 → 農夫自己反而受到宋國人的取笑\n\n完成的因果鏈：\n田裡原本有一個樹樁\n↓\n一隻奔跑的兔子意外撞上樹樁，折斷頸子死了\n↓\n農夫因為這次事件，放下農具守著樹樁\n↓\n他希望得到兔子的事情再次發生\n↓\n他不能靠著守著樹樁再次得到兔子\n↓\n自己反而受到宋國人的取笑\n\n證據邊界：原文明確寫出農夫「冀復得兔」，因此可以確定他希望再次得到兔子。我們可以根據他的行動進一步推論：他把一次偶然發生的事情，當成值得守在原地等待的方法。但是，古文沒有寫他認為兔子「每天」都會出現，也沒有寫他相信兔子「一定」會再撞上樹樁。',
  },
  evidenceMultiSelectClosing: {
    id: 'closing_evidence_multiselect',
    title: '最後一關：哪些是古文明確寫出的？',
    intro: '破譯家不只要會推理，還要知道證據到哪裡為止。下面哪些事情是古文明確寫出的？有明確文字證據的才可以打勾。',
    options: [
      { text: '宋國有一位耕田的人，他的田裡有一個樹樁。', correct: true, detail: '原文證據：「宋人有耕者，田中有株」' },
      { text: '一隻兔子奔跑時撞上樹樁，折斷頸子死了。', correct: true, detail: '原文證據：「兔走觸株，折頸而死」' },
      { text: '農夫因為這件事放下農具，守在樹樁旁。', correct: true, detail: '原文證據：「因釋其耒而守株」' },
      { text: '農夫希望再次得到兔子。', correct: true, detail: '原文證據：「冀復得兔」' },
      { text: '農夫每天都看見許多兔子從樹樁旁跑過。', correct: false, detail: '原文沒有交代其他兔子出現的次數。' },
      { text: '農夫相信第二天一定會有兔子撞上樹樁。', correct: false, detail: '原文沒有寫農夫認定的日期，也沒有寫他心裡怎麼想。' },
      { text: '農夫從此一輩子都沒有再耕田。', correct: false, detail: '原文沒有交代農夫此後一生的生活。' },
      {
        text: '農夫沒有再次得到兔子，自己反而受到宋國人的取笑。',
        correct: true,
        detail: '原文證據：「兔不可復得，而身為宋國笑」',
      },
    ],
    correctFeedback: '證據判讀完成！你找出了古文明確寫出的內容，也沒有把自己的想像偷偷加進原文，好厲害！',
    retryHint: '一項一項回到原文找。如果找不到能直接對上的古文字句，就先不要打勾。',
    finalNote:
      '🔍 明確證據、合理推論和自行想像，不是同一件事。\n\n第一層｜古文明確寫出的：宋國有一位耕田的人，田裡有一個樹樁；兔子奔跑時撞上樹樁，折斷頸子死了；農夫因為這件事放下農具，守在樹樁旁；農夫希望再次得到兔子；農夫沒有再次得到兔子，自己反而受到宋國人的取笑。\n\n第二層｜有證據支持的合理推論：農夫把一次偶然得到兔子的事件，當成值得繼續等待的方法。這個推論能解釋他為什麼「釋其耒而守株，冀復得兔」，但古文沒有把這個想法寫成農夫說出口的話。\n\n第三層｜原文沒有證據的自行想像：農夫每天都看見許多兔子跑過；農夫相信第二天一定會有兔子撞上樹樁；農夫從此一輩子都沒有再耕田。原文沒有交代其他兔子出現的次數、農夫認定的日期，也沒有說他此後一生的生活。',
  },
  finalVerification: {
    prerequisiteStepIds: [
      'zhu',
      'chu',
      'tu_zou_chu_zhu',
      'zhe',
      'zhe_jing_er_si',
      'lei',
      'shi',
      'shi_qi_lei',
      'yin',
      'yin_shi_qi_lei_er_shou_zhu',
      'ji',
      'fu',
      'ji_fu_de_tu',
      'tu_bu_ke_fu_de',
      'shen',
      'wei',
      'er_shen_wei_song_guo_xiao',
      'closing_sequence_order',
      'closing_evidence_multiselect',
    ],
    guideLine:
      '這段白話沒有告訴你新的答案。樹樁、奔跑、碰撞、折頸、放下農具、守在樹樁旁、希望再次得到兔子，以及最後受到取笑——這些畫面，都是你剛才自己一段一段破解出來的。\n\n白話文沒有增加農夫等待了幾天、看見多少隻兔子，也沒有補寫宋國人取笑他時說了哪些話，因為原文都沒有交代。「不能靠守著樹樁再次得到兔子」是把「兔不可復得」放回前文的守株行動中理解，不代表農夫使用任何方法都不可能再得到兔子。',
    translation:
      '宋國有一位耕田的人，他的田裡有一個樹樁。一隻兔子奔跑時撞上樹樁，折斷頸子死了。農夫於是放下自己的耕田工具，守在樹樁旁，希望再次得到兔子。可是，他不能靠守著樹樁再次得到兔子，自己反而受到宋國人的取笑。',
    comparisonRows: [
      { decodedEvidence: '宋人有耕者，田中有株', vernacularExpression: '宋國有一位耕田的人，他的田裡有一個樹樁', relationship: '同一畫面' },
      { decodedEvidence: '兔走觸株，折頸而死', vernacularExpression: '一隻兔子奔跑時撞上樹樁，折斷頸子死了', relationship: '同一事件' },
      {
        decodedEvidence: '因釋其耒而守株，冀復得兔',
        vernacularExpression: '農夫於是放下自己的耕田工具，守在樹樁旁，希望再次得到兔子',
        relationship: '同一因果與願望',
      },
      { decodedEvidence: '兔不可復得', vernacularExpression: '他不能靠守著樹樁再次得到兔子', relationship: '同一結果' },
      { decodedEvidence: '而身為宋國笑', vernacularExpression: '自己反而受到宋國人的取笑', relationship: '同一結局' },
    ],
    completionFeedback: '你沒有背答案。你是比較線索、追蹤證據，自己把整篇古文破解出來的。古文破譯家，任務完成！',
  },
};

export const legacyYaMiaoZhuZhangLesson: GuwenLesson = {
  id: 'ya-miao-zhu-zhang',
  title: '揠苗助長',
  source: '《孟子・公孫丑上》',
  introSpokenLine:
    '我找到一篇田裡發生的怪事。有一個人很想幫禾苗長高，還以為自己成功了。可是他的兒子趕到田裡一看，事情完全不是那樣。他究竟做了什麼？我們從古文留下的密碼開始破解。',
  fullText: '宋人有閔其苗之不長而揠之者，芒芒然歸，謂其人曰：「今日病矣！予助苗長矣！」其子趨而往視之，苗則槁矣。',
  sentences: [
    '宋人有閔其苗之不長而揠之者，',
    '芒芒然歸，',
    '謂其人曰：「今日病矣！予助苗長矣！」',
    '其子趨而往視之，',
    '苗則槁矣。',
  ],
  steps: [
    {
      id: 'zhi',
      type: 'evidence',
      prerequisiteIds: [],
      targetSentence: '苗之不長',
      intro:
        '我們以前遇到的「之」，常常會指回前面的人或東西，簡單說，可以讀成「他、它、這件事」。但是「苗之不長」裡，「之」前面是禾苗，後面是沒有長高。舊鑰匙放不進去，看來這是「之」的新用法。我找到兩條線索，我們來看看它在中間做了什麼。',
      clues: [
        {
          text: '鳥之將死，其鳴也哀。',
          highlight: '之',
          unlockedMeaning: '鳥「之」快要死時，牠的叫聲會很悲傷。',
          source: '《論語・泰伯》',
        },
        {
          text: '歲寒，然後知松柏之後凋也。',
          highlight: '之',
          unlockedMeaning: '天氣變冷以後，才看得出松柏「之」比其他植物更晚凋謝。',
          source: '《論語・子罕》',
        },
      ],
      question:
        '第一條線索的「之」，放在「鳥」和「快要死」中間；第二條線索的「之」，放在「松柏」和「較晚凋謝」中間。兩條線索中的「之」，都在做什麼？',
      options: ['把前面的主角和後面的情況接在一起', '代替前面出現過的人或東西', '表示前面有很多人或很多東西'],
      correctIndex: 0,
      correctFeedback: '找到「之」的新鑰匙了！它把前面的主角和後面的情況接成一個完整畫面。「A 之 B」可以理解為「A 發生 B 這件事」。',
      retryHint: '先把兩條線索切成左右兩邊：鳥／快要死，松柏／較晚凋謝。「之」正好放在哪裡？',
      explanation:
        '第一條線索裡，「之」放在「鳥」和「將死」之間。前面是一隻鳥，後面是這隻鳥快要死亡的情況。把兩邊接起來，就形成「鳥快要死時」這個完整畫面。\n\n第二條線索裡，「之」放在「松柏」和「後凋」之間。前面是松樹、柏樹，後面是它們比其他植物更晚凋謝的情況。兩邊接起來，就形成「松柏較晚凋謝」這件事。\n\n所以，兩條線索中的「之」都沒有代替某個人或東西，而是把前面的主角和後面的情況接在一起。因此，目前可以取得一把新的鑰匙：「A 之 B」可以把 A 和 B 接成「A 發生 B 這件事」。\n\n第二個選項是孩子以前破解過的「之」的另一種用法，但放進這兩條線索都不通。第三個選項是「諸」或表示多數的線索，不是這裡的「之」。\n\n回到本篇，「苗」之「不長」，把兩邊接起來就是：禾苗沒有長高這件事。現在我們已經看懂發生了什麼事；下一題再破解宋人面對這件事時為什麼會「閔」。',
    },
    {
      id: 'min',
      type: 'evidence',
      prerequisiteIds: ['zhi'],
      targetSentence: '閔其苗之不長',
      intro:
        '🔑「其」以前已經破解過：它會把後面的東西連回前面提到的人。簡單說，「其苗」就是「他的苗」，也就是這位宋國人的禾苗。\n\n🔑 第一題剛取得「之」的新鑰匙：它可以把前面的主角和後面的情況接在一起。所以「苗之不長」就是「禾苗沒有長高這件事」。\n\n這個人看著自己的禾苗一直沒有長高，古文說他「閔」。他當時是什麼心情？比較兩條古文線索看看。',
      clues: [
        {
          text: '孝成皇帝閔學殘文缺，稍離其真，乃陳發祕臧，校理舊文。',
          highlight: '閔',
          unlockedMeaning: '（當時流傳的古書殘缺不全，學問漸漸失去原來的樣子。）漢成帝「閔」這種情況，於是打開皇家的藏書，重新整理舊文。',
          source: '《漢書・楚元王傳》所載劉歆〈移書讓太常博士〉',
        },
        {
          text: '閔道德之不行，故周流應聘，冀行其道德。',
          highlight: '閔',
          unlockedMeaning: '孔子「閔」好的道理沒有被大家實行，所以到各國奔走，希望能推行這些道理。',
          source: '《白虎通・五經》',
        },
      ],
      question:
        '第一條線索中的漢成帝「閔」古書殘缺、學問逐漸失真；第二條線索中的孔子「閔」好的道理沒有被實行。兩人接著都採取了行動，希望情況改善。兩句中的「閔」後面，都接著一件尚未變好的事情。「閔」最可能是什麼動作？',
      options: ['把眼前的人或尚未變好的事情放在心上，為它擔心', '認為眼前的一切都很好，完全不需要改變', '不再理會眼前的人或事情，直接轉身離開'],
      correctIndex: 0,
      correctFeedback: '破解成功！兩條線索中的人，都把另一個人或一件尚未變好的事情放在心上。「閔 A」可以理解為「把 A 的情況放在心上，為 A 擔心」。',
      retryHint: '再看看兩個人接著做了什麼：漢成帝整理舊文，孔子到各國奔走。他們為什麼想改變眼前的情況？',
      explanation:
        '第一條線索裡，流傳下來的古書已經殘缺不全，學問也逐漸失去原來的樣子。漢成帝「閔」這種情況，接著打開皇家收藏的古書，重新整理舊文，希望改善問題。\n\n第二條線索裡，好的道理還沒有被大家實行，孔子「閔」這件事，接著到各國奔走，希望讓這些道理真正實行。\n\n兩條線索的「閔」都不是形容外表或樣子，而是一個動作；「閔」的後面直接接著一件尚未變好的事情。兩個人都把問題放在心上，接著採取行動，希望情況改善。\n\n再回到原文：宋人有「閔」其苗之不長而揠之者。「其苗」是這位宋國人的禾苗；「苗之不長」是禾苗沒有長高這件事。宋人「閔」的對象，就是「他的禾苗沒有長高這件事」。因此，目前可以破解出：「閔其苗之不長」表示他擔心自己的禾苗沒有長高，而且盼望它趕快生長。\n\n第二個選項表示一切都很好，無法解釋漢成帝為什麼要整理舊文，也無法解釋孔子為什麼要到各國奔走。第三個選項表示不再理會，更無法解釋兩個人接著採取的行動。\n\n目前只能知道他擔心禾苗沒有長高；他接下來會採取什麼行動，還要繼續破解後面的「揠之」，不能現在先猜。',
      keyAwarded: { code: '閔', decodedEvidence: '把一件尚未變好的事情放在心上，感到擔心、著急' },
    },
    {
      id: 'ya',
      type: 'evidence',
      prerequisiteIds: ['min'],
      targetSentence: '揠之',
      intro:
        '🔑「之」的舊鑰匙：它可以指回前面出現的人或東西。這裡「揠之」的「之」，指的就是前面的禾苗。\n\n可是，這個人究竟對禾苗做了什麼？我找到一條古文線索和一條結構對照句，我們來比較「揠」完成後，東西的位置發生了什麼變化。',
      clues: [
        {
          text: '光弼以范陽本賊巢窟，當先取之，揠賊根本。',
          highlight: '揠',
          unlockedMeaning: '（范陽是敵軍的重要基地。）李光弼認為應先攻下范陽，「揠」敵軍的根本。',
          source: '《新唐書・李光弼傳》',
        },
        {
          text: '童子揠蘿蔔，根出於土。',
          highlight: '揠',
          unlockedMeaning: '一個孩子對蘿蔔做了「揠」的動作，蘿蔔根便離開泥土。',
          source: '⚠️ 仿古結構對照句，非真實古籍引用（自撰示意例句，可查的其他「揠」字古文多為抽象比喻或不適合兒童的暴力畫面，故用具體的蘿蔔與泥土呈現相同的動作方向）',
        },
      ],
      question: '第一條線索中，「揠」會使敵軍失去原本扎住的根本；對照句中的蘿蔔經過「揠」之後，根離開了泥土。「揠」最可能造成哪一種位置變化？',
      options: ['把露出地面的部分剪掉，根仍留在原處', '把原本扎住的東西往外拉，使它離開原位', '在旁邊挖一個洞，讓東西繼續留在原位'],
      correctIndex: 1,
      correctFeedback: '找到「揠」的鑰匙了！兩條線索都讓原本扎住的東西離開根本或泥土。「揠之」就是把前文的禾苗往上拉，使禾苗的根離開原來的位置。',
      retryHint: '注意對照句最後的結果：蘿蔔根已經「出於土」。哪個選項會讓根離開原來扎住的地方？',
      explanation:
        '第一條線索把敵軍的重要基地比成敵軍扎住的根本。李光弼主張先攻下范陽，再「揠」敵軍的根本；完成後，敵軍便不能繼續依靠原來的基地。\n\n仿古結構對照句換成可以看見的畫面：蘿蔔原本扎在泥土裡；孩子做了「揠」的動作後，蘿蔔根離開泥土。\n\n兩條線索共同限制出的變化是：動作前，目標扎在原來的位置；動作後，目標被拉離原位；動作作用在連著根本或根部的東西上。因此，第二個假說可以同時解釋兩條線索。「剪掉地面上的部分」會把根留在土裡；「在旁邊挖洞」也沒有讓目標離開原位，都不能解釋蘿蔔根為什麼出土。\n\n回到本篇，「揠之」中的「之」指前文的禾苗。因此，目前可以推得：宋人把禾苗往上拉，使禾苗的根離開原來扎住的位置。\n\n僅憑「揠之」還不知道他為什麼這麼做，也不知道禾苗後來變成什麼樣子；必須繼續讀他的話和故事結尾。',
      keyAwarded: { code: '揠', decodedEvidence: '把原本扎住的東西往外拉，使它離開原來的位置' },
    },
    {
      id: 'min_er_ya_zhi',
      type: 'reconstruction',
      prerequisiteIds: ['min', 'ya'],
      targetSentence: '閔其苗之不長而揠之',
      intro: '三把密碼鑰匙都亮起來了。現在不能讓 App 替你組好，請你親手判斷：宋人看見什麼情況，又做了什麼？',
      keys: [
        { code: '其苗', decodedEvidence: '他的禾苗，也就是這位宋國人的禾苗' },
        { code: '苗之不長', decodedEvidence: '禾苗沒有長高這件事' },
        { code: '閔 A', decodedEvidence: '把 A 的情況放在心上，為 A 擔心' },
        { code: '而', decodedEvidence: '把前後兩件事接起來' },
        { code: '揠之', decodedEvidence: '把前文的禾苗往上拉，使根離開原位' },
      ],
      question: '把密碼鑰匙依照原文順序組合，「閔其苗之不長而揠之」形成哪一幅畫面？',
      options: ['他看見禾苗已經長高，便把所有禾苗割下來', '他擔心自己的禾苗沒有長高，便把禾苗往上拉', '他不再理會沒有長高的禾苗，轉身離開田地'],
      correctIndex: 1,
      correctFeedback: '整句重建成功！宋人擔心自己的禾苗沒有長高，便動手把禾苗往上拉。古文現在只寫到他的做法；這樣做會產生什麼結果，還要繼續找證據。',
      retryHint: '先看原因：「苗之不長」是禾苗沒有長高。再看行動：「揠之」是把前文的禾苗往上拉。哪個選項保留了這個順序？',
      explanation:
        '「其苗」把禾苗連回前面的宋人；「苗之不長」把禾苗和沒有長高的情況接起來；「閔」表示宋人把這個尚未變好的情況放在心上；「而」再接上他採取的行動；「揠之」則是把那些禾苗往上拉。\n\n依照原文順序，完整畫面是：他擔心自己的禾苗沒有長高，便把禾苗往上拉。\n\n第一個選項把「不長」改成已經長高，又把「揠」換成割下；第三個選項則和「揠之」的實際行動相反。只有第二個選項能保留全部密碼鑰匙。\n\n目前不能在這一題提前加入「禾苗枯死」：那是故事結尾才會提供的新證據。',
      finalDraftLine: '他擔心自己的禾苗沒有長高，便把禾苗往上拉。',
    },
    {
      id: 'wei',
      type: 'evidence',
      prerequisiteIds: ['min_er_ya_zhi'],
      targetSentence: '謂其人曰',
      intro:
        '🔑「其」以前已經破解過：它會把後面的東西連回前面的人。這裡的「其人」指這位宋人的家人。\n\n🔑「曰」也已經破解過：表示說、開口說話。\n\n現在只剩中間的「謂」還沒破解。它夾在兩個人名中間，究竟在安排什麼關係？比較兩條古文線索看看。',
      clues: [
        {
          text: '孫權謂呂蒙曰：「卿今當塗掌事，不可不學！」',
          highlight: '謂',
          unlockedMeaning: '（呂蒙正在負責重要工作。）孫權「謂」呂蒙曰：「你現在管理重要工作，不可以不學習！」',
          source: '《資治通鑑・漢紀》',
        },
        {
          text: '孟子謂戴不勝曰：「子欲子之王之善與？」',
          highlight: '謂',
          unlockedMeaning: '（戴不勝想幫助宋王變好。）孟子「謂」戴不勝曰：「你希望你的國君變好嗎？」',
          source: '《孟子・滕文公下》',
        },
      ],
      question: '兩條線索都排成「A【謂】B 曰：後面接著一句話」。從人名的位置和後面的話判斷，「A 謂 B 曰」最可能表示什麼？',
      options: ['A 把 B 說過的話重新寫下來', 'A 對 B 開口說後面的話', 'A 和 B 一起聽別人說話'],
      correctIndex: 1,
      correctFeedback: '找到「謂」的鑰匙了！兩條線索裡，「謂」後面的人都是聽話的人。「A 謂 B 曰」可以理解為「A 對 B 說……」。',
      retryHint: '先找到「曰」後面的話是誰說的，再看看「謂」後面站著誰。呂蒙和戴不勝是在說話，還是在聽話？',
      explanation:
        '第一條線索中，後面的話是孫權說的，呂蒙是聽話的人；第二條線索中，後面的問題是孟子說的，戴不勝是聽話的人。\n\n兩條線索都把人物排成同一個位置：「謂」前面是開口說話的人；「謂」後面是聽這番話的人；「曰」後面接著說出的內容。因此，「A 謂 B 曰」可以破解為：A 對 B 說……\n\n回到本篇：「謂」其人曰，表示：他對家人說。\n\n第一個選項把「謂」誤解成記錄別人說過的話；第三個選項則把兩人都變成聽話者，都不能解釋兩條線索中一人開口、另一人聆聽的排列。\n\n本句只能確定宋人對家人說話，沒有指出究竟是哪一位家人，也沒有寫出他說話時的語氣。',
      keyAwarded: { code: '謂', decodedEvidence: 'A 謂 B 曰：A 對 B 說後面的話' },
    },
    {
      id: 'bing',
      type: 'evidence',
      prerequisiteIds: ['wei'],
      targetSentence: '今日病矣',
      intro:
        '🔑「矣」以前已經破解過：它提醒我們，前面的情況現在已經出現。簡單說，「病矣」就是「現在已經病了」。\n\n可是，宋人說的「病」真的是生病嗎？先比較他人兩次做了很多事情之後出現的「病」。',
      clues: [
        {
          text: '且不得暇，故病且怠。',
          highlight: '病',
          unlockedMeaning: '百姓整天忙著應付官吏，連休息的時間也沒有，所以「病」而且提不起精神。',
          source: '柳宗元〈種樹郭橐駝傳〉',
        },
        {
          text: '士民疲病於內。',
          highlight: '病',
          unlockedMeaning: '軍隊長年在外作戰，國內的百姓也跟著疲「病」。',
          source: '《韓非子・初見秦》',
        },
      ],
      question: '第一條線索中的百姓忙得沒有時間休息，後來「病且怠」；第二條線索中的軍隊長年作戰，國內百姓也疲「病」。兩句中的「病」最可能是哪一種狀態？',
      options: ['做了很多事情以後，身體十分疲累', '感染疾病，需要立刻服藥休養', '因為別人不聽話，心裡非常生氣'],
      correctIndex: 0,
      correctFeedback: '找到「病」的新鑰匙了！兩條線索中的人都因為長時間做事而沒有力氣。「今日病矣」表示：今天真是累壞了。',
      retryHint: '先看「病」出現以前：一群人沒有時間休息，另一群人長年支撐戰事。哪種狀態最能同時解釋兩條線索？',
      explanation:
        '第一條線索裡，官吏早晚前來催促百姓工作，百姓連休息時間都沒有，最後「病且怠」。這個「病」發生在長時間忙碌之後，旁邊的「怠」又顯示他們已經提不起精神。\n\n第二條線索裡，軍隊長年在外作戰，國內的百姓也必須一直支撐戰事，最後變得疲「病」。這裡的「疲」和「病」連在一起，再次指出身體的力量已經被消耗。\n\n兩條線索的共同證據是：人們先長時間工作或支撐戰事；中間沒有足夠休息；「病」出現時，人已經沒有多少力氣。因此，第一個假說可以同時解釋兩條線索。「感染疾病」雖然是現代中文常見的意思，卻無法解釋兩句為什麼都先寫長時間勞動；「生氣」也沒有任何情緒證據。\n\n回到本篇，宋人剛對田裡的禾苗做完「揠」的動作，回家便說：今日「病」矣！因此，目前可以破解為：今天真是累壞了！\n\n這一題只能確定宋人已經非常疲累，還不能單靠「病」判斷他做得對不對。',
      keyAwarded: { code: '病', decodedEvidence: '做了很多事以後，身體已經十分疲累' },
    },
    {
      id: 'mang_mang_ran_gui',
      type: 'story_reasoning',
      prerequisiteIds: ['bing'],
      targetSentence: '芒芒然歸',
      intro:
        '剛才遇到「芒芒然」時，我們沒有急著猜，而是先繼續讀。前文：宋人剛對田裡的禾苗做完「揠」的動作。後文：他回家後立刻說：「今日病矣！」——今天真是累壞了。現在拿著這條新證據回頭看，他「芒芒然歸」最可能是什麼樣子？',
      question: '前後兩項證據都放進來，「芒芒然歸」最可能形成哪一幅畫面？',
      options: ['他累得沒有多少力氣，拖著疲累的身體回家', '他在田野間迷了路，找不到回家的方向', '他精神十足，一路跳著跑回家'],
      correctIndex: 0,
      correctFeedback: '回查成功！後文的「今日病矣」證明他當時已經累壞了。所以本篇的「芒芒然歸」可以理解為：他疲累不堪地回家。',
      retryHint: '不要只看「芒芒」的字形。回到人物親口說的「今日病矣」：哪個回家畫面和「今天累壞了」最能接在一起？',
      explanation:
        '「芒芒然」本身很少見，而且同樣的「芒芒」在其他古文裡可能描寫廣大的土地、眾多的作物或茫然的狀態。只看這三個字，孩子沒有足夠證據選出本篇的畫面。\n\n因此，破譯時先把它保留，繼續讀人物後面的話：今日病矣！第六題已經利用兩條古文線索破解：這裡的「病」不是感染疾病，而是做了很多事情以後累得沒有力氣。這句話是宋人對自己當天身體狀態的直接說明。\n\n把前後證據接起來：宋人在田裡對禾苗做完「揠」的動作；他以「芒芒然」的樣子回家；他到家後立刻說自己今天已經「病」了，也就是累壞了。因此，第一個假說最符合上下文：「芒芒然歸」是疲累不堪地回家。\n\n第二個選項加入「迷路」，古文沒有寫他找不到方向，而且他最後確實回到了家。第三個選項說他精神十足，和他親口說「今日病矣」相反。',
      finalDraftLine: '他疲累不堪地回到家。',
    },
    {
      id: 'yu',
      type: 'evidence',
      prerequisiteIds: ['mang_mang_ran_gui'],
      targetSentence: '予助苗長矣',
      intro: '我找到兩段人物親口說的話。先找出每句話是誰說的，再看看「予」跟著誰。',
      clues: [
        {
          text: '子曰：「予欲無言。」',
          highlight: '予',
          unlockedMeaning: '（孔子希望學生能自己發現事物的道理，而不是只等待老師說明。）孔子說：「予」想不再說話了。',
          source: '《論語・陽貨》',
        },
        {
          text: '孟子曰：「予豈好辯哉？予不得已也。」',
          highlight: '予',
          unlockedMeaning: '（有人問孟子：「大家都說您喜歡辯論，為什麼？」）孟子回答：「予」難道喜歡爭辯嗎？「予」是沒有辦法才這麼做。',
          source: '《孟子・滕文公下》',
        },
      ],
      question: '讀完這兩份線索，你覺得「予」最可能是指向誰？',
      options: ['正在開口說話的人自己', '正在聽這句話的人', '前面出現過的所有人'],
      correctIndex: 0,
      correctFeedback: '找到「予」的鑰匙了！「予」和以前破解的「吾」一樣，都是說話者用來指自己。簡單說，「予」就是「我」。',
      retryHint: '孔子說「予欲無言」時，是誰想不再說話？孟子說「予不得已」時，又是誰沒有辦法？',
      explanation:
        '第一條線索先寫「子曰」，清楚告訴我們孔子正在開口；他接著用「予」說出自己想不再說話。\n\n第二條線索先寫「孟子曰」，清楚告訴我們孟子正在開口；他也用「予」說明自己為什麼要辯論。\n\n兩條線索的共同位置是：前面先指出正在說話的人；「予」出現在那個人說出的話裡；「予」後面接著那個人自己的想法或理由。因此，第一個假說可以同時解釋兩條線索：「予」是說話者用來指自己。第二個選項把說話者和聽話者顛倒；第三個選項也無法解釋為什麼孔子與孟子都在說個人的想法。\n\n回到本篇，這句話是宋人對家人說的：「予」助苗長矣！所以「予」指的就是正在說話的宋人自己，可以先讀成：我助苗長矣！\n\n目前只知道宋人說自己做了這件事；他的說法是否符合田裡的實際情況，還要繼續閱讀後文驗證。',
      keyAwarded: { code: '予', decodedEvidence: '說話者用來指自己，可以讀成「我」' },
    },
    {
      id: 'yu_zhu_miao_zhang_yi',
      type: 'reconstruction',
      prerequisiteIds: ['yu'],
      targetSentence: '予助苗長矣',
      intro: '「予」和「矣」都亮起來了。現在請你親手重建宋人說的第二句話。',
      keys: [
        { code: '予', decodedEvidence: '說話者指自己；這裡是宋人說「我」' },
        { code: '助', decodedEvidence: '本句可以直接讀成幫助' },
        { code: '苗', decodedEvidence: '田裡的禾苗' },
        { code: '苗長', decodedEvidence: '禾苗往上生長、長高' },
        { code: '矣', decodedEvidence: '提醒前面的情況現在已經出現，可接近「已經……了」' },
      ],
      question: '依照原文順序組合，「予助苗長矣」是宋人在宣稱什麼？',
      options: ['我的禾苗不需要幫忙，自己已經長高了', '我已經幫助禾苗長高了', '我的兒子已經到田裡照顧禾苗了'],
      correctIndex: 1,
      correctFeedback: '整句重建成功！「予助苗長矣」是宋人自己宣稱：「我已經幫助禾苗長高了！」這是人物說出的話，還不等於故事已經證明他真的成功了。',
      retryHint: '先把「予」換成說話者自己，再看是誰「助」、幫助什麼「長」。不要加入原文還沒出現的兒子。',
      explanation:
        '第八題已經破解「予」：它是說話者用來指自己。這句話由宋人說出，所以「予」就是宋人所說的「我」。\n\n接著依照原文順序組合：「予」指出做這件事的人是宋人自己；「助」表示他宣稱自己提供了幫助；「苗長」形成禾苗生長、長高的畫面；「矣」提醒這個結果在他的說法中已經出現。所以「予助苗長矣」可以重建為：我已經幫助禾苗長高了！\n\n第一個選項刪掉了宋人「助」的行動，變成禾苗自己長高；第三個選項則提前加入尚未出場的兒子。只有第二個選項保留原文中的說話者、行動、對象與結果。\n\n但這一題必須守住證據邊界：古文明確證明的是「宋人這樣說」，尚未證明禾苗真的因此長高。接下來要看他的兒子到田裡發現了什麼。',
      finalDraftLine: '他對家人說：「今天真是累壞了！我已經幫助禾苗長高了！」',
    },
    {
      id: 'qu',
      type: 'evidence',
      prerequisiteIds: ['yu_zhu_miao_zhang_yi'],
      targetSentence: '其子趨而往視之',
      intro: '宋人的兒子聽完父親的話，接著「趨而往」。「趨」讓他的移動變成什麼樣子？比較兩條古文線索看看。',
      clues: [
        {
          text: '見物則爭趨之。',
          highlight: '趨',
          unlockedMeaning: '一群不聽指揮的士兵看見想要的東西，就爭著「趨」過去。',
          source: '劉基《郁離子・僰人養猴》',
        },
        {
          text: '孔子下，欲與之言。趨而辟之，不得與之言。',
          highlight: '趨',
          unlockedMeaning: '孔子下車，想和接輿說話；接輿卻「趨」而避開，孔子沒能和他說上話。',
          source: '《論語・微子》',
        },
      ],
      question: '一群不聽指揮的士兵爭著「趨」想要的東西；接輿不想被孔子留下談話，「趨」而避開孔子。兩處的「趨」最可能是怎麼樣的動作？',
      options: ['加快腳步趕過去或離開', '留在原地等待事情發生', '放慢腳步，一邊走一邊休息'],
      correctIndex: 0,
      correctFeedback: '找到「趨」的鑰匙了！兩條線索裡的人都想搶先完成眼前的動作，所以加快腳步移動。「趨」可以理解為趕緊走過去。',
      retryHint: '一群人正在爭著「趨」向想要的東西，接輿也「趨」而避開孔子。哪一種腳步最能同時接上這兩個結果？',
      explanation:
        '第一條線索把不聽指揮的士兵比成搶栗子的猴子：他們一看見東西，便爭著「趨」過去。他們不是留在原地，也不是慢慢靠近。\n\n第二條線索中，孔子想和接輿說話，接輿卻「趨」而避開，結果孔子沒能和他交談。這表示接輿很快便離開了孔子身邊。\n\n兩條線索共同限制出一種移動方式：人物有一件想立刻完成的事；「趨」之後，人物的位置很快發生改變；動作不是等待，也不是放慢腳步。因此，第一個假說最能同時解釋兩條線索：「趨」表示加快腳步，趕緊移動。第二個選項不能解釋眾人為何爭著搶東西，也不能解釋孔子為何追不上接輿；第三個選項則與兩條線索的急迫結果相反。\n\n回到本篇：其子「趨」而往視之。目前可以知道：宋人的兒子加快腳步前往某處。至於他要看什麼，還要破解後面的「視之」。',
      keyAwarded: { code: '趨', decodedEvidence: '加快腳步移動，趕緊前往或離開' },
    },
    {
      id: 'shi',
      type: 'evidence',
      prerequisiteIds: ['qu'],
      targetSentence: '其子趨而往視之',
      intro:
        '🔑「往」以前已經破解過：離開原處，到另一個地方。\n\n🔑「之」會指回前面的人或東西。\n\n兒子到了那裡，接著做的「視」是什麼？',
      clues: [
        {
          text: '明日徐公來，孰視之，自以為不如。',
          highlight: '視',
          unlockedMeaning: '（鄒忌一直想知道自己和徐公誰更好看。）第二天徐公來了，鄒忌仔細「視」他，覺得自己比不上徐公。',
          source: '《戰國策・齊策一》',
        },
        {
          text: '然往來視之，覺無異能者。',
          highlight: '視',
          unlockedMeaning: '（老虎起初很害怕驢子。）後來老虎多次靠近「視」牠，發現驢子沒有特別的本領。',
          source: '柳宗元〈黔之驢〉',
        },
      ],
      question: '鄒忌完成「視」以後，知道自己不如徐公好看；老虎多次「視」驢子以後，發現牠沒有特別本領。兩句中的「視」最可能是什麼動作？',
      options: ['張開嘴巴，大聲呼喊', '用眼睛查看、觀察', '伸出手，把對方拉過來'],
      correctIndex: 1,
      correctFeedback: '找到「視」的鑰匙了！兩條線索中的人物都先用眼睛查看，接著才得到新的發現。「視」可以理解為查看、觀察。',
      retryHint: '鄒忌怎麼判斷兩人的外貌？老虎又怎麼發現驢子沒有特別本領？找出兩個結果都需要使用的身體部位。',
      explanation:
        '第一條線索中，鄒忌仔細「視」徐公，接著判斷自己沒有徐公好看。這個結果來自他對徐公外貌的觀察。\n\n第二條線索中，老虎多次靠近「視」驢子，接著發現驢子沒有特別本領。這個結果也來自牠反覆觀察眼前的動物。\n\n兩條線索的共同證據是：人物面前都有一個可觀察的對象；完成「視」以後，人物得到新的發現；這些發現不是靠呼喊或拉動對方取得。因此，第二個假說能同時解釋兩條線索：「視」是用眼睛查看、觀察。第一個選項不能產生外貌與能力的發現；第三個選項則在兩段古文中都沒有動手拉人的證據。\n\n回到本篇：其子趨而往「視」之。目前可以知道：宋人的兒子趕緊前去查看某個對象。最後的「之」究竟指誰或什麼，要把整句放回故事確認。',
      keyAwarded: { code: '視', decodedEvidence: '用眼睛查看、觀察' },
    },
    {
      id: 'qi_zi_qu_er_wang_shi_zhi',
      type: 'reconstruction',
      prerequisiteIds: ['shi'],
      targetSentence: '其子趨而往視之',
      intro: '六把密碼鑰匙都取得了。現在請你親手追蹤人物和方向，重建兒子做出的整串行動。',
      keys: [
        { code: '其子', decodedEvidence: '「其」就是他的；這裡指前面那位宋人的兒子' },
        { code: '趨', decodedEvidence: '加快腳步，趕緊移動' },
        { code: '而', decodedEvidence: '把前後兩個動作接起來' },
        { code: '往', decodedEvidence: '離開原處，到另一個地方' },
        { code: '視', decodedEvidence: '用眼睛查看、觀察' },
        { code: '之', decodedEvidence: '指回前文出現的人或東西；本題必須依故事判斷指向' },
      ],
      question: '宋人剛說自己幫助禾苗長高。依照人物、動作和「之」的指向，「其子趨而往視之」形成哪一幅畫面？',
      options: ['他的兒子趕緊前去查看那些禾苗', '他的兒子趕緊前去查看那位宋人', '宋人趕緊帶著兒子一起離開田地'],
      correctIndex: 0,
      correctFeedback:
        '整串行動重建成功！「其子」是宋人的兒子；他「趨而往」，趕緊前去，再「視之」，查看父親剛提到的禾苗。「其子趨而往視之」表示：他的兒子趕緊前去查看那些禾苗。',
      retryHint: '先找誰在行動：「其子」是誰的兒子？再找「之」最可能指回父親剛才說要幫助的什麼東西。',
      explanation:
        '「其」會把後面的「子」連回前面的宋人，所以行動者是宋人的兒子，不是宋人本人。\n\n接著依原文順序組合：「趨」表示兒子加快腳步；「而」把移動和後面的行動接起來；「往」表示他離開原處，前往另一個地方；「視」表示他要查看、觀察；「之」指回父親剛才所說的禾苗。\n\n因此，完整畫面是：他的兒子趕緊前去查看那些禾苗。\n\n第二個選項雖然保留兒子的移動，卻把「之」錯接成宋人；前文真正等待驗證的是「予助苗長矣」這句話，所以兒子需要查看的是禾苗。第三個選項把行動者換成宋人，也加入原文沒有寫出的「帶著兒子」。\n\n這句古文只寫兒子趕緊前去查看，沒有明確寫出他是否相信或懷疑父親，也沒有記錄他當時的心情。',
      finalDraftLine: '他的兒子趕緊前去查看那些禾苗。',
    },
    {
      id: 'ze',
      type: 'evidence',
      prerequisiteIds: ['qi_zi_qu_er_wang_shi_zhi'],
      targetSentence: '苗則槁矣',
      intro: '兒子趕到田裡查看，古文接著寫「苗則槁矣」。我們還不知道「槁」是什麼樣子，先看看「則」怎麼把前後接起來。',
      clues: [
        {
          text: '木受繩則直，金就礪則利。',
          highlight: '則',
          unlockedMeaning: '木材靠著墨線切割，「則」變直；刀劍拿去磨刀石磨，「則」變鋒利。',
          source: '《荀子・勸學》',
        },
        {
          text: '橘生淮南則為橘，生於淮北則為枳。',
          highlight: '則',
          unlockedMeaning: '同樣的橘樹，如果長在淮南，「則」結出橘子；如果長在淮北，「則」結出枳。',
          source: '《晏子春秋・內篇雜下》',
        },
      ],
      question:
        '第一條先寫木材和刀劍經過什麼處理，再由「則」接出它們的變化；第二條先寫橘樹生長的地方，再由「則」接出結果。兩條線索中的「A則B」，最可能怎樣連接前後？',
      options: ['A和B只是兩件碰巧排在一起、彼此無關的事', '出現前面的A，便接著帶出後面的B', '後面的B會讓前面的A完全消失'],
      correctIndex: 1,
      correctFeedback: '找到「則」的鑰匙了！兩條線索都先交代前面的情況，再用「則」接出後面的結果。「A則B」在這裡可以理解為：出現A，便接著有B。',
      retryHint: '看看木材經過加工以後怎麼變，刀劍磨過以後又怎麼變。「則」後面的畫面是不是前面情況帶出的結果？',
      explanation:
        '第一條線索先交代木材和刀劍接受的處理：木材經過墨線校正，「則」變直；刀劍放到磨刀石上磨，「則」變鋒利。\n\n第二條線索先交代橘樹生長的地方，再以「則」接出相應的結果。\n\n兩條線索的共同排列都是：前面的情況 → 則 → 後面出現的結果。因此，第二個假說最能同時解釋兩條線索。「則」在這些句子中負責接出結果，可以先讀成「便」或「就」。第一個選項切斷了前後關係；第三個選項所說的「完全消失」，兩條古文都沒有提供證據。\n\n回到本篇：苗「則」槁矣。現在可以先看出：「苗」在前，「槁」是接著出現的結果。至於「槁」究竟是哪種狀態，下一題再破解。\n\n證據邊界：本題只取得「則」在這一句接出結果的用法，不把它說成所有古文中都只有一種意思。',
      keyAwarded: { code: '則', decodedEvidence: '接出後面的結果，可以先讀成「便」或「就」' },
    },
    {
      id: 'gao',
      type: 'evidence',
      prerequisiteIds: ['ze'],
      targetSentence: '苗則槁矣',
      intro: '「則」已經告訴我們：後面的「槁」是禾苗出現的結果。但「槁」到底是哪一種樣子？來看兩幅草木的畫面。',
      clues: [
        {
          text: '草木之生也柔脆，其死也枯槁。',
          highlight: '槁',
          unlockedMeaning: '草木活著時是柔軟的；死去時，會變成枯「槁」的樣子。',
          source: '《老子》第七十六章',
        },
        {
          text: '如旱歲之草，皆枯槁無潤澤。',
          highlight: '槁',
          unlockedMeaning: '（旱災時，草長時間得不到雨水。）像旱年裡的草一樣，全都枯「槁」，沒有潤澤。',
          source: '《詩經・大雅・召旻》鄭箋',
        },
      ],
      question: '第一條把活著的草木和死去的草木放在一起；第二條寫旱年的草長時間缺水，而且「無潤澤」。兩條線索中的「槁」，最可能是哪一種狀態？',
      options: ['失去水分和生氣，變得乾枯', '吸飽水分，長得又綠又挺', '被風吹動，左右不停搖晃'],
      correctIndex: 0,
      correctFeedback: '找到「槁」的鑰匙了！一條線索把「槁」放在草木死去時，另一條寫旱年的草沒有水分和潤澤。「槁」可以理解為草木乾枯、枯萎。',
      retryHint: '一邊是死去的草木，一邊是長時間沒有雨水、失去潤澤的草。哪個選項能同時放進兩幅畫面？',
      explanation:
        '第一條線索先比較草木活著與死去的樣子：活著時柔軟，死去時便枯「槁」。因此，「槁」不會是充滿水分、生長旺盛的狀態。\n\n第二條線索把人比成旱年裡的草。前面的補充告訴孩子，旱災讓草長時間得不到雨水；原句又直接留下「無潤澤」這項情報。這使「槁」進一步指向失去水分的草木。\n\n兩條線索共同形成的畫面是：草木已經失去原來的生命力；草木沒有足夠水分；外觀看起來乾枯、枯萎。因此，第一個假說能同時解釋兩條線索。第二個選項與「死」「旱歲」「無潤澤」三項情報相反；第三個選項只有風吹的動作，無法解釋草木的生命狀態。\n\n回到本篇：苗則「槁」矣。「槁」告訴我們，兒子看到的禾苗已經呈現乾枯、枯萎的樣子。\n\n證據邊界：原文可以確定禾苗已經乾枯，不能只靠「槁」增加「全部永遠無法救活」「兒子立刻大哭」等古文沒有寫出的內容。',
      keyAwarded: { code: '槁', decodedEvidence: '草木失去水分與生氣，變得乾枯、枯萎' },
    },
    {
      id: 'miao_ze_gao_yi',
      type: 'reconstruction',
      prerequisiteIds: ['gao'],
      targetSentence: '苗則槁矣',
      intro: '最後四把鑰匙都亮起來了。宋人說自己已經幫助禾苗長高；可是兒子到了田裡，真正看見了什麼？',
      keys: [
        { code: '苗', decodedEvidence: '宋人田裡的禾苗' },
        { code: '則', decodedEvidence: '接出後面的結果，可以先讀成「便」或「就」' },
        { code: '槁', decodedEvidence: '草木失去水分與生氣，變得乾枯、枯萎' },
        { code: '矣', decodedEvidence: '提醒前面的情況現在已經出現，可接近「已經……了」' },
      ],
      question: '依照四把鑰匙與原文順序，「苗則槁矣」表示兒子看見了什麼？',
      options: ['禾苗已經乾枯了', '禾苗已經長得更加高大', '禾苗已經被兒子重新種好了'],
      correctIndex: 0,
      correctFeedback: '故事結局重建成功！「苗則槁矣」表示：禾苗已經乾枯了。宋人說自己幫助禾苗長高，兒子實際看到的結果卻正好相反。',
      retryHint: '先抓住兩把最關鍵的鑰匙：「槁」是草木的哪種狀態？「矣」又提醒這個狀態現在已經怎麼了？',
      explanation:
        '依照原文順序組合：「苗」是宋人田裡的禾苗；「則」把禾苗接到後面出現的結果；「槁」表示草木已經乾枯、枯萎；「矣」提醒這個情況現在已經出現。\n\n所以「苗則槁矣」可以重建為：禾苗已經乾枯了。\n\n第二個選項重複宋人自己宣稱的「予助苗長矣」，卻和兒子看到的「槁」相反。第三個選項增加了兒子重新種苗的行動，原文完全沒有寫。\n\n這一句也完成了一次驗證：宋人先說：「我已經幫助禾苗長高了。」兒子前去查看。古文明確寫出的結果是：禾苗已經乾枯了。\n\n證據邊界：古文明確寫出禾苗已經乾枯，卻沒有寫兒子當時說了什麼、心裡怎麼想，也沒有寫宋人後來是否後悔。這些都不能冒充原文證據。',
      finalDraftLine: '禾苗卻已經乾枯了。',
    },
  ],
  sequenceOrderingClosing: {
    id: 'closing_sequence_order',
    title: '最後一關：把破解畫面排回故事',
    intro: '所有古文密碼都解開了。但是六張故事卡片被打亂了。請把最先發生的放在上面，再一張一張往下接，排出完整故事。',
    cards: [
      { id: 'A', text: '宋人的兒子趕緊前去查看禾苗。' },
      { id: 'B', text: '宋人擔心自己的禾苗沒有長高。' },
      { id: 'C', text: '兒子看見禾苗已經乾枯了。' },
      { id: 'D', text: '宋人把禾苗往上拉。' },
      { id: 'E', text: '宋人對家人說：「今天真是累壞了！我已經幫助禾苗長高了！」' },
      { id: 'F', text: '宋人疲累不堪地回到家。' },
    ],
    correctOrder: ['B', 'D', 'F', 'E', 'A', 'C'],
    correctFeedback: '全文故事鏈完成！你把宋人的擔心、行動、說法和田裡真正出現的結果全部接回正確位置了。',
    retryHint: '先找宋人為什麼要對禾苗做出動作，再找兒子是在聽見父親說話以前，還是以後，才趕去田裡查看。',
    explanation:
      '排對後，依序對應的古文證據：\n\n擔心｜閔其苗之不長｜宋人擔心自己的禾苗沒有長高\n行動｜而揠之｜宋人把禾苗往上拉\n回家｜芒芒然歸｜宋人疲累不堪地回到家\n說法｜謂其人曰：「今日病矣！予助苗長矣！」｜宋人告訴家人自己很累，並宣稱已經幫助禾苗長高\n查看｜其子趨而往視之｜宋人的兒子趕緊前去查看禾苗\n結果｜苗則槁矣｜兒子看到禾苗已經乾枯\n\n完成的故事鏈：\n宋人擔心自己的禾苗沒有長高\n↓\n他把禾苗往上拉\n↓\n他疲累不堪地回到家\n↓\n他告訴家人：「我已經幫助禾苗長高了！」\n↓\n他的兒子趕緊前去查看\n↓\n禾苗卻已經乾枯了\n\n證據邊界：故事順序可以直接依照古文排列。但這條順序不能證明兒子是因為「不相信父親」才去查看，也不能證明宋人看到結果後立刻後悔。這些內容原文都沒有寫。',
  },
  evidenceMultiSelectClosing: {
    id: 'closing_evidence_multiselect',
    title: '最後一關：哪些真的寫在古文裡？',
    intro: '破譯家不只要會推理，還要知道證據到哪裡為止。下面哪些事情是古文明確寫出的？能在原文裡找到直接證據的才可以打勾。',
    options: [
      { text: '宋人擔心自己的禾苗沒有長高，便把禾苗往上拉。', correct: true, detail: '原文證據：「閔其苗之不長而揠之」' },
      { text: '宋人疲累不堪地回到家。', correct: true, detail: '原文證據：「芒芒然歸」，結合後文「今日病矣」判斷' },
      { text: '宋人對家人說，自己今天累壞了，已經幫助禾苗長高了。', correct: true, detail: '原文證據：「謂其人曰：今日病矣！予助苗長矣！」' },
      { text: '宋人的兒子趕緊前去查看禾苗。', correct: true, detail: '原文證據：「其子趨而往視之」' },
      { text: '兒子看見禾苗已經乾枯了。', correct: true, detail: '原文證據：「苗則槁矣」' },
      {
        text: '宋人認為自己把禾苗往上拉，是在幫助禾苗長高。',
        correct: false,
        detail: '合理推論：能把「揠之」和「予助苗長矣」接起來，但原文沒有直接寫成「宋人認為把禾苗往上拉，就能幫助它們長高」',
      },
      {
        text: '兒子因為完全不相信父親，才故意趕去田裡證明父親說錯了。',
        correct: false,
        detail: '自行增加：原文只寫兒子趕去查看，沒有交代他出發前的想法',
      },
      {
        text: '宋人看見乾枯的禾苗後，立刻向家人道歉並保證不再這麼做。',
        correct: false,
        detail: '自行增加：故事在「苗則槁矣」結束，沒有記錄宋人後來的反應',
      },
    ],
    correctFeedback: '證據檢查完成！你找出了古文明確寫出的內容，也分清楚了合理推論和自己增加的故事。',
    retryHint: '一項一項回到原文找。如果找不到可以直接對上的古文字句，即使聽起來很合理，也先不要打勾。',
    finalNote:
      '🔍 明確證據、合理推論和自行增加的故事，不是同一件事。\n\n第一層｜古文明確寫出的：宋人擔心自己的禾苗沒有長高，便把禾苗往上拉；宋人疲累不堪地回到家；宋人對家人說自己累壞了，並宣稱已經幫助禾苗長高；宋人的兒子趕緊前去查看禾苗；兒子看到禾苗已經乾枯。\n\n第二層｜有證據支持的合理推論：宋人認為自己把禾苗往上拉，是在幫助禾苗長高——這個推論能把「揠之」和宋人後來說的「予助苗長矣」接起來，因此很合理，但古文沒有直接這樣寫。\n\n第三層｜古文沒有證據的自行增加：兒子因為完全不相信父親，才故意趕去田裡證明父親說錯了；宋人看見乾枯的禾苗後，立刻向家人道歉並保證不再這麼做——古文只寫兒子趕去查看，沒有交代他出發前的想法；故事也在「苗則槁矣」結束，沒有記錄宋人後來的反應。',
  },
  finalVerification: {
    prerequisiteStepIds: [
      'zhi',
      'min',
      'ya',
      'min_er_ya_zhi',
      'wei',
      'bing',
      'mang_mang_ran_gui',
      'yu',
      'yu_zhu_miao_zhang_yi',
      'qu',
      'shi',
      'qi_zi_qu_er_wang_shi_zhi',
      'ze',
      'gao',
      'miao_ze_gao_yi',
      'closing_sequence_order',
      'closing_evidence_multiselect',
    ],
    guideLine:
      '這段白話沒有告訴你新的答案。擔心禾苗沒有長高、把禾苗往上拉、疲累地回家、宣稱自己幫助禾苗長高、兒子前去查看，以及禾苗最後乾枯——這些畫面，都是你剛才自己一段一段破解出來的。\n\n白話文使用「疲累不堪地回到家」，是把本課採用的「芒芒然」讀法和宋人緊接著說的「今日病矣」連起來。白話文沒有增加宋人為什麼如此著急、兒子是否相信父親、禾苗的根部受到什麼傷害，也沒有補寫宋人看到結果後是否後悔，因為這些內容原文都沒有交代。',
    translation:
      '宋國有一個人，擔心自己的禾苗沒有長高，便把禾苗往上拉。他疲累不堪地回到家，對家人說：「今天真是累壞了！我已經幫助禾苗長高了！」\n\n他的兒子趕緊前去查看那些禾苗，禾苗卻已經乾枯了。',
    comparisonRows: [
      { decodedEvidence: '閔其苗之不長而揠之', vernacularExpression: '擔心自己的禾苗沒有長高，便把禾苗往上拉', relationship: '同一因果' },
      { decodedEvidence: '芒芒然歸', vernacularExpression: '疲累不堪地回到家', relationship: '同一畫面' },
      {
        decodedEvidence: '謂其人曰：「今日病矣！予助苗長矣！」',
        vernacularExpression: '對家人說：「今天真是累壞了！我已經幫助禾苗長高了！」',
        relationship: '同一說法',
      },
      { decodedEvidence: '其子趨而往視之', vernacularExpression: '兒子趕緊前去查看那些禾苗', relationship: '同一行動' },
      { decodedEvidence: '苗則槁矣', vernacularExpression: '禾苗卻已經乾枯了', relationship: '同一結果' },
    ],
    completionFeedback:
      '你沒有背答案。你比較了其他古文留下的線索，破解了一個字、一個詞和一幅幅故事畫面；你還把宋人的擔心、行動、說法和最後結果接成完整的故事鏈。你也分清楚了哪些是古文明確留下的證據，哪些是我們根據行動作出的合理推論。古文破譯家，任務完成！',
  },
};

export const legacyYanErDaoZhongLesson: GuwenLesson = {
  id: 'yan-er-dao-zhong',
  title: '掩耳盜鐘',
  source: '《呂氏春秋・自知》',
  introSpokenLine:
    '我找到一篇跟聲音有關的古文。一個人找到了一口鐘，接下來卻越弄越奇怪，最後對自己的耳朵做了一件事。他到底做了什麼？我們從古文留下的密碼開始破解。',
  fullText: '范氏之亡也，百姓有得鐘者。欲負而走，則鐘大不可負；以椎毀之，鐘況然有音。恐人聞之而奪己也，遽掩其耳。',
  sentences: [
    '范氏之亡也，',
    '百姓有得鐘者。',
    '欲負而走，',
    '則鐘大不可負；',
    '以椎毀之，',
    '鐘況然有音。',
    '恐人聞之而奪己也，',
    '遽掩其耳。',
  ],
  steps: [
    {
      id: 'wang',
      type: 'evidence',
      prerequisiteIds: [],
      targetSentence: '范氏之亡',
      intro:
        '（范氏是當時的一個大家族。）\n\n🔑「A之B」以前已經破解過：可以理解為「A發生B這件事」。所以「范氏之亡」可以先讀成：范氏發生「亡」這件事。\n\n這個大家族究竟發生了什麼？先別急著猜。我找到兩條寫到國家或勢力結局的古文線索，我們來比對「亡」。',
      clues: [
        {
          text: '順天者存，逆天者亡。',
          highlight: '亡',
          unlockedMeaning: '順應正道的一方可以保存下來；背離正道的一方會「亡」。',
          source: '《孟子・離婁上》',
        },
        {
          text: '入則無法家拂士，出則無敵國外患者，國恆亡。',
          highlight: '亡',
          unlockedMeaning: '（一個國家內部沒有人提醒國君，外面也沒有需要警戒的對手。）這樣的國家常常會「亡」。',
          source: '《孟子・告子下》',
        },
      ],
      question:
        '第一條線索把「存」和「亡」放在相反的位置；第二條寫一個失去內外警戒的國家最後會「亡」。「亡」在這兩條線索裡，最可能表示什麼結果？',
      options: ['原來的家族或國家敗落，勢力無法再維持', '一個人暫時走錯路，找不到方向', '有人把一件物品忘在別處'],
      correctIndex: 0,
      correctFeedback:
        '找到「亡」在這裡的鑰匙了！第一條用「存」和「亡」形成相反的結局，第二條則寫一個國家最後會「亡」。這裡的「亡」不是某個人死亡，也不是東西遺失，而是家族或國家敗落，原來的勢力無法再維持。',
      retryHint: '先看第一條：「存」是保存下來；和它相反的結局，會是哪一個選項？',
      explanation:
        '第一條線索把「存」和「亡」並排成兩種相反的結局。一方可以繼續保存，另一方則走向「亡」。\n\n第二條線索談的是一個國家的結局。國家失去內部的提醒與外部的警戒，最後便會「亡」。這裡談的不是某個人迷路，也不是某件物品不見，而是整個國家原有的勢力無法繼續維持。\n\n回到本篇：范氏之「亡」也。現在可以先讀成：范氏家族敗落、原有勢力無法再維持這件事。\n\n原文在這裡只告訴我們范氏敗落，沒有說明完整的原因、經過，也沒有說范氏家族每一個人後來去了哪裡。這些都不能自行補進故事。',
      finalDraftLine: '范氏家族敗落，原有的勢力無法再維持。',
      keyAwarded: { code: '亡', decodedEvidence: '家族或國家敗落，原來的勢力無法再維持' },
    },
    {
      id: 'ye',
      type: 'evidence',
      prerequisiteIds: ['wang'],
      targetSentence: '范氏之亡也',
      intro:
        '🔑「范氏之亡」已經可以讀成：范氏家族敗落這件事。\n\n古文沒有立刻停下來，而是在「范氏之亡」後面放了一個「也」，接著才寫百姓。這個「也」怎麼幫我們把前後兩幅畫面接起來？看看兩條相同排列方式的古文。',
      clues: [
        {
          text: '臣之壯也，猶不如人；今老矣，無能為也已。',
          highlight: '也',
          unlockedMeaning: '一位大臣回答國君，說自己年輕力壯「也」，能力都還比不上別人；現在已經老了，就更沒有能力了。',
          source: '《左傳・僖公三十年》',
        },
        {
          text: '當余之從師也，嘗負篋曳屣，行深山巨谷中。',
          highlight: '也',
          unlockedMeaning: '作者回想自己跟著老師求學的日子：當我跟著老師學習「也」，曾經負著書箱、拖著鞋子，走在深山大谷中。',
          source: '宋濂〈送東陽馬生序〉',
        },
      ],
      question:
        '第一條先回到大臣年輕力壯的時候，再拿那時和現在比較；第二條先回到作者跟著老師學習的時候，再寫他走過的路。兩條線索的「也」前面都在說「那是什麼時候」，後面才告訴我們那時發生的事。「A之B也，C」最可能怎麼讀？',
      options: ['當A發生B時，C發生了', 'A沒有發生B，所以C也沒有發生', 'A到底有沒有發生B呢'],
      correctIndex: 0,
      correctFeedback: '找到「也」在這種位置的新鑰匙了！它先收住前面的背景，再讓後面的事情接著出現。「A之B也，C」可以先理解成：「當A發生B時，C。」',
      retryHint: '兩條線索的前半段都先交代一個時候或背景，後半段才說那時發生什麼。哪個選項最符合這個排列？',
      explanation:
        '第一條線索先回到大臣年輕力壯的時候，說他那時的能力都還比不上別人；接著再回到現在，說自己已經老了。前半段是在交代拿來比較的時間背景。\n\n第二條線索的畫面也是先說「當我跟著老師學習」，再接上那時發生的事。\n\n因此，這兩句中的「也」都不是在提問，也沒有否定前文。它位於前半段末尾，先把背景收住，再讓後面的情況接上來。\n\n回到本篇：范氏之亡「也」，百姓有得鐘者。目前可以讀成：當范氏家族敗落時，百姓中有一個「得鐘」的人。\n\n這一步只破解「也」如何連接前後；「得鐘」兩字暫時保留成一個尚未拆開、尚未翻譯的密碼。',
      keyAwarded: { code: 'A之B也，C', decodedEvidence: '先收住「A發生B」這個背景，再接出當時發生的C；可以先讀成「當A發生B時，C」' },
    },
    {
      id: 'zhong',
      type: 'evidence',
      prerequisiteIds: ['ye'],
      targetSentence: '百姓有得鐘者',
      intro:
        '前兩題已經破解出：當范氏家族敗落時，百姓中有一個「得鐘」的人。\n\n🔑「有……者」會帶出故事中的某個人。所以「百姓有得鐘者」先讀成：百姓中有一個「得鐘」的人。「得鐘」現在不能拆開；這一題只破解其中的「鐘」。\n\n這究竟是什麼物品？我找到兩句有聲音的古文，我們來比對看看。',
      clues: [
        {
          text: '姑蘇城外寒山寺，夜半鐘聲到客船。',
          highlight: '鐘',
          unlockedMeaning: '（詩人夜裡把船停在江邊。）半夜時，寒山寺傳來的「鐘」聲到達客船。',
          source: '張繼〈楓橋夜泊〉',
        },
        {
          text: '窈窕淑女，鐘鼓樂之。',
          highlight: '鐘',
          unlockedMeaning: '人們用「鐘」和鼓演奏音樂，讓這位女子感到快樂。',
          source: '《詩經・周南・關雎》',
        },
      ],
      question: '第一條線索裡，人們在半夜聽見「鐘聲」；第二條把「鐘」和鼓放在一起演奏音樂。這兩條線索裡的「鐘」，最可能是哪一種物品？',
      options: ['敲擊後會發出聲音的樂器', '用來查看現在幾點的時鐘', '用竹子編成、可以裝東西的籃子'],
      correctIndex: 0,
      correctFeedback: '找到「鐘」的鑰匙了！一條線索留下「鐘聲」，另一條把「鐘」和鼓放在一起演奏。這裡的「鐘」是敲擊後會發出聲音的樂器，不是用來看時間的時鐘。',
      retryHint: '一條線索讓遠處的船聽見聲音，另一條線索把它和鼓放在一起。哪一個選項同時符合這兩幅畫面？',
      explanation:
        '第一條線索發生在深夜。寒山寺傳出的「鐘」聲一路到達江邊的客船，說明這個物品能發出可以傳到遠處的聲音。\n\n第二條線索把「鐘」和鼓並列，兩者一起用來演奏音樂。這再次指出「鐘」和鼓一樣，是會被敲擊而發聲的樂器。\n\n兩條線索共同限制出：它能發出聲音；它可以和鼓一起演奏；它不是用來看時間，也不是用來裝東西。因此，第一個假說能同時解釋兩條線索。\n\n回到本篇：百姓有得「鐘」者。現在只取得一部分情報：「得鐘」裡的「鐘」，是一件敲擊後會發聲的樂器。\n\n「得鐘」仍然是一組尚未完全破解的密碼。不能因為已經知道「鐘」是什麼，就提前替整組密碼下結論；必須繼續讀「欲負而走」，再回頭檢查。',
      keyAwarded: { code: '鐘', decodedEvidence: '敲擊後會發出聲音的樂器' },
    },
    {
      id: 'fu',
      type: 'evidence',
      prerequisiteIds: ['zhong'],
      targetSentence: '欲負而走',
      intro:
        '「欲」表示想要。\n\n🔑「走」以前已經破解過：表示跑、跑開。所以這個人想先對鐘做出「負」的動作，再帶著它跑開。\n\n「負」是對這個東西做什麼動作？我找到兩條也出現「負」的古文線索，我們來比較。',
      clues: [
        {
          text: '當余之從師也，嘗負篋曳屣，行深山巨谷中。',
          highlight: '負',
          unlockedMeaning: '作者跟著老師求學時，「負」著裝滿書的書箱、拖著鞋，走過深山和山谷。',
          source: '宋濂〈送東陽馬生序〉',
        },
        {
          text: '廉頗聞之，肉袒負荊，因賓客至藺相如門謝罪。',
          highlight: '負',
          unlockedMeaning: '廉頗聽說事情經過後，脫去上衣，「負」著有刺的荊條，到藺相如家門前道歉。',
          source: '《史記・廉頗藺相如列傳》',
        },
      ],
      question:
        '第一個人要帶著裝滿書的書箱走過深山；第二個人脫去上衣，「負」著會刺痛身體的荊條前去請罪。比較兩幅畫面，「負」最可能是哪一種攜帶東西的方式？',
      options: ['把東西放在背上背著', '把東西放在地面上向前推', '把東西高高拋到空中'],
      correctIndex: 0,
      correctFeedback: '找到「負」的鑰匙了！書箱放在求學者的背上，荊條也放在廉頗的背上。「負」就是把東西放在背上背著。',
      retryHint: '書箱和荊條都放在人物身體的同一個位置。看看哪個選項寫的是那個位置。',
      explanation:
        '第一條線索裡，作者為了求學，將書箱放在背上，帶著它走過深山和山谷。\n\n第二條線索裡，廉頗把有刺的荊條放在自己裸露的背上，前去向藺相如請罪。兩幅畫面共同指出，「負」不是推，也不是拋，而是把東西放在背上背著。\n\n回到本篇：欲「負」而走。現在可以讀成：他想把鐘背起來，再帶著鐘跑開。\n\n這句只寫出他的打算。鐘能不能真的背起來，必須繼續讀下一句才能確定。',
      keyAwarded: { code: '負', decodedEvidence: '把東西放在背上背著' },
    },
    {
      id: 'de_zhong_yu_fu_er_zou',
      type: 'story_reasoning',
      prerequisiteIds: ['fu'],
      targetSentence: '范氏之亡也，百姓有得鐘者。欲負而走，',
      intro:
        '🔑「欲」在這裡表示想要。🔑「負」表示把東西放在背上背著。🔑「走」表示跑、跑開。所以「欲負而走」已經破解為：他想把鐘背起來，再帶著鐘跑開。\n\n「得鐘」要唸成ㄉㄜˊ鐘，這詞很容易讓人以為：那個人已經得手，甚至把鐘帶回家了。可是下一句又寫他「欲負而走」。這兩句似乎衝突了？我們用後一句反查前一句。',
      question: '現在已經知道「欲負而走」是他接下來想做、但還沒有完成的事。回頭看「得鐘」，哪幅畫面最能讓前後兩句接起來？',
      options: ['這個人發現、找到一口鐘，但還沒有把它搬走', '這個人已經把鐘背回家，後來又打算背去別的地方', '這個人已經收到別人送來的鐘，準備留在原地欣賞'],
      correctIndex: 0,
      correctFeedback:
        '前後文接起來了！這裡的「得鐘」表示他發現、找到了一口鐘，不表示他已經把鐘搬走。下一句「欲負而走」才寫出：他接著想把鐘背起來，帶離原處。',
      retryHint: '「欲負而走」是接下來想做、但還沒有完成的事。假如鐘早已經被搬回家，他還需要在原處想辦法把它背走嗎？',
      explanation:
        '「得鐘」的「得」，當作得到或者找到某物時，要唸成ㄉㄜˊ，音同德。\n\n現代中文的「得到」常讓人想到「東西已經拿到手，也已經歸我所有」。如果把「得鐘」直接這樣翻譯，就會和下一句接不起來。\n\n原文接著寫：欲負而走。這句已經破解為：他想把鐘背起來，再帶著鐘跑開。「欲」表示這是接下來想做、但還沒有完成的行動。因此，此處的「得鐘」應理解為「發現、找到一口鐘」：他已經找到目標，卻還沒有成功把鐘搬離原處。\n\n後來人們把這則故事稱為「掩耳盜鐘」，把他想拿走范氏財物的行為理解為盜取；但《呂氏春秋》這段正文並沒有直接寫出「盜」字。最後做證據檢查時，必須區分：原文明寫他「得鐘」，並想把鐘背走；根據前後文破解，「得鐘」表示發現、找到鐘，尚未完成搬運；後來的故事名稱與合理理解，才會說這是盜鐘；原文沒有明寫他最後是否真的成功把鐘帶走。',
      finalDraftLine: '百姓中有一個人發現了一口鐘。',
    },
    {
      id: 'yu_fu_er_zou_ze_zhong_da_bu_ke_fu',
      type: 'reconstruction',
      prerequisiteIds: ['de_zhong_yu_fu_er_zou'],
      targetSentence: '欲負而走，則鐘大不可負；',
      intro:
        '🔑「負」表示把東西放在背上背著。🔑「走」表示跑、跑開。🔑「則」以前已經破解過：它會接出後面的結果，可以先讀成「就、卻發現」。「不可」和現在說的「不可以」很接近，可以先讀成「不能」。\n\n這個人的計畫已經破解了：他想把鐘背起來，再帶著鐘跑開。可是古文用「則」接出一個結果。這個計畫最後遇到了什麼問題？',
      keys: [
        { code: '欲負而走', decodedEvidence: '他想把鐘背起來，再帶著鐘跑開' },
        { code: '則', decodedEvidence: '接出後面的結果，可以先讀成「就、卻發現」' },
        { code: '不可', decodedEvidence: '不能' },
      ],
      question: '把所有鑰匙依照原文順序組合起來，哪幅畫面最符合？',
      options: ['他想把鐘背走，卻發現鐘太大，根本背不起來', '他想把鐘背走，鐘雖然很大，他還是輕鬆地背走了', '他先把鐘背回家，鐘到了家裡才突然變大'],
      correctIndex: 0,
      correctFeedback:
        '整句重建成功！他原本想把鐘背著跑開；「則」接出的結果卻是：鐘太大，不能背起來。「欲負而走，則鐘大不可負」就是：他想把鐘背走，卻發現鐘太大，根本背不起來。',
      retryHint: '注意「不可負」：最後的「負」還是剛取得的同一把鑰匙，但前面多了「不可」。他的計畫成功了嗎？',
      explanation:
        '前半句「欲負而走」已經破解為：他想把鐘背起來，再帶著鐘跑開。\n\n後半句先寫「鐘大」，指出鐘的體積很大；接著寫「不可負」，表示無法完成把鐘背起來的動作。「則」把原來的計畫和實際遇到的結果連接起來。\n\n因此，整句形成：想把鐘背走 → 卻發現鐘太大 → 無法把鐘背起來。\n\n原文目前只證明他背不起這口鐘，沒有說他已經放棄把鐘帶走。下一句會出現他改用的新辦法。',
      finalDraftLine: '他想把鐘背走，卻發現鐘太大，根本背不起來。',
    },
    {
      id: 'chui',
      type: 'evidence',
      prerequisiteIds: ['yu_fu_er_zou_ze_zhong_da_bu_ke_fu'],
      targetSentence: '以椎毀之',
      intro: '鐘太大，背不起來。這個人改用了一件叫作「椎」的東西。「椎」究竟是什麼？我找到兩個人物帶著「椎」的古文畫面，我們看看能從裡面發現什麼。',
      clues: [
        {
          text: '右脅夾大鐵椎，重四五十斤。',
          highlight: '椎',
          unlockedMeaning: '一名力氣很大的人，右邊身旁夾著一件大鐵「椎」，重量有四五十斤。',
          source: '魏禧〈大鐵椎傳〉',
        },
        {
          text: '朱亥袖四十斤鐵椎，椎殺晉鄙。',
          highlight: '椎',
          unlockedMeaning: '朱亥把一件四十斤重的鐵「椎」藏在袖中；靠近晉鄙後，他便用這件東西攻擊晉鄙。',
          source: '《史記・魏公子列傳》',
        },
      ],
      question: '第一件鐵「椎」重達四五十斤；第二件也重達四十斤，而且被朱亥拿來攻擊別人。「椎」最可能是哪一種東西？',
      options: ['沉重、可以拿來敲擊的鐵製工具', '輕巧、可以拿來寫字的毛筆', '柔軟、可以裝東西的布袋'],
      correctIndex: 0,
      correctFeedback: '找到「椎」的鑰匙了！兩條線索都指出它很重，第二條還寫出有人拿它攻擊。「椎」是沉重、可以拿來敲擊的工具，接近今天說的鐵鎚或大槌。',
      retryHint: '它由鐵製成，重達四五十斤，還能被拿來攻擊。哪個選項最符合這些線索？',
      explanation:
        '第一條線索中的人物力氣很大，身旁夾著一件重達四五十斤的大鐵「椎」。這排除了輕巧的毛筆與柔軟的布袋。\n\n第二條線索裡，朱亥把四十斤重的鐵「椎」藏在袖中，靠近晉鄙後，再拿它攻擊。這補上了它的用途：它不只是沉重的鐵器，也是可以拿來敲擊的工具。\n\n回到本篇：以「椎」毀之。現在只知道：這個人使用一件沉重、可以敲擊的工具。\n\n他拿「椎」對什麼東西做了什麼，必須繼續破解「毀之」才能確定。',
      keyAwarded: { code: '椎', decodedEvidence: '沉重、可以拿來敲擊的工具，接近今天說的鐵鎚或大槌' },
    },
    {
      id: 'hui',
      type: 'evidence',
      prerequisiteIds: ['chui'],
      targetSentence: '以椎毀之',
      intro: '「椎」已經破解了，可是這個人拿起「椎」之後，究竟想讓東西發生什麼變化？我找到兩座建築物面臨「毀」的古文畫面，我們來比較它們的結果。',
      clues: [
        {
          text: '予曰：「毀之乎？其新之也？」曰：「新之。」',
          highlight: '毀',
          unlockedMeaning: '（有人提議處理一座已經老舊的祠堂。）我問：要「毀」這座祠堂，還是把它修新？對方回答：把它修新。',
          source: '王守仁〈象祠記〉',
        },
        {
          text: '約七日雨，不雨毀其廟。',
          highlight: '毀',
          unlockedMeaning: '（當地發生大旱，熊廷弼到城隍廟求雨。）他向城隍神約定：七天內要下雨；如果七天後還不下雨，就「毀」那座廟。',
          source: '《明史・熊廷弼傳》',
        },
      ],
      question:
        '第一條把「毀祠堂」和「修新祠堂」放在兩個不同的選擇中；第二條把「毀廟」當作沒有下雨後要採取的處置。「毀」最可能會讓建築物發生什麼變化？',
      options: ['原本完整的建築受到破壞，不能保持原來的樣子', '原本老舊的建築被修好，變得更新更完整', '整座建築保持原狀，只把名稱換掉'],
      correctIndex: 0,
      correctFeedback: '找到「毀」的鑰匙了！第一條把「毀」和「修新」放在相反的選擇中；第二條則把「毀廟」當成一種處置。「毀」就是使原本完整的東西受到破壞，不能再保持原來的樣子。',
      retryHint: '第一條中，「毀」和「修新」是兩個不同的選擇。如果選擇「毀」，祠堂還會變得更新、更完整嗎？',
      explanation:
        '第一條線索中的人面對兩個不同選擇：一個是「毀」祠堂，另一個是把祠堂修新。對方選擇「修新」，說明「毀」不會讓建築變得更新、更完整。\n\n第二條線索把「毀廟」當作沒有如期下雨後的處置。兩條線索都把「毀」用在建築物上，並共同指出：原本完整的東西會受到破壞，無法保持原來的樣子。\n\n回到本篇：以椎「毀」之。現在只知道「毀」會使某樣原本完整的東西受到破壞。這個人拿「椎」毀的是什麼，還要追蹤句尾的「之」才能確定。',
      keyAwarded: { code: '毀', decodedEvidence: '使原本完整的東西受到破壞，不能再保持原來的樣子' },
    },
    {
      id: 'yi_chui_hui_zhi',
      type: 'reconstruction',
      prerequisiteIds: ['hui'],
      targetSentence: '以椎毀之',
      intro:
        '「以」在這裡可以先讀成「使用」。🔑「椎」是沉重、可以拿來敲擊的工具。🔑「毀」會使原本完整的東西受到破壞。🔑「之」以前已經破解過：它不重複名稱，而是指回前文已經出現的人、事物或事情。\n\n工具和動作都已經破解了，現在只差最後一個問題：「之」指回前文的什麼東西？找到它，才能重建完整動作。',
      keys: [
        { code: '以', decodedEvidence: '使用' },
        { code: '椎', decodedEvidence: '沉重、可以拿來敲擊的工具' },
        { code: '毀', decodedEvidence: '使原本完整的東西受到破壞' },
        { code: '之', decodedEvidence: '指回前文已經出現的人、事物或事情；本題必須依故事判斷指向' },
      ],
      question: '前文中，什麼東西太大，這個人背不起來？把「以／椎／毀／之」依序組合，這句話表示什麼？',
      options: ['他使用「椎」敲擊那口鐘，要使鐘受到破壞', '他拿起那口鐘敲擊「椎」，要使「椎」受到破壞', '他把「椎」和鐘都留在原地，沒有碰它們'],
      correctIndex: 0,
      correctFeedback:
        '整句重建成功！「椎」是工具，「毀」是要造成的變化，「之」指回前面那口太大、背不起來的鐘。「以椎毀之」就是：他使用「椎」敲擊那口鐘，要使鐘受到破壞。',
      retryHint: '先找「之」：前一句一直在說哪一件太大、背不起來的東西？那就是「毀」的目標。',
      explanation:
        '這句包含四個位置：「以」是使用；「椎」是工具；「毀」是使完整的東西受到破壞；「之」指回前文那口鐘。\n\n依照原文順序組合後，完整畫面是：這個人使用「椎」敲擊鐘，想使鐘受到破壞。\n\n原文目前只寫出他採取這個行動，還沒有直接告訴我們鐘是否已經破裂，也沒有說他把鐘分成了幾塊。下一句「鐘況然有音」會先告訴我們另一個立刻出現的結果。',
    },
    {
      id: 'wei_shen_me_hui_zhong',
      type: 'story_reasoning',
      prerequisiteIds: ['yi_chui_hui_zhi'],
      targetSentence: '欲負而走，則鐘大不可負；以椎毀之，',
      intro:
        '已經破解的原文證據：「欲負而走」是他原本想把鐘背走；「鐘大不可負」是整口鐘太大，他背不起來；「以椎毀之」是他改用「椎」敲擊鐘，要使鐘受到破壞。\n\n（古代大鐘多由青銅等金屬鑄成。鐘的形狀如果被破壞，就不能再當樂器使用；可是金屬材料仍然存在，還是可以賣錢。）\n\n奇怪，這個人想把鐘帶走，為什麼反而要「毀」鐘？把他的目標、遇到的困難和後來的動作連起來。哪一個計畫最合理？',
      question: '他用「椎」毀鐘，最可能是想做什麼？',
      options: ['把大鐘敲成較小的部分，再把金屬帶走賣錢', '因為背不動鐘，便把鐘毀掉，準備空手離開', '敲出很大的聲音，請附近的人來幫他搬鐘'],
      correctIndex: 0,
      correctFeedback:
        '人物的計畫推理成功！他的目標是把鐘帶走，困難是整口鐘太大、背不起來。因此，最合理的推論是：他想把金屬鑄成的大鐘敲成較小的部分，再把金屬帶走賣錢。鐘的形狀雖然被破壞了，不能再當樂器使用；可是金屬材料仍然存在，還是可以賣錢。',
      retryHint: '先抓住他原來的目標：他是想把鐘帶走。哪個選項既能解決「鐘太大、背不起來」，又沒有放棄把材料帶走？',
      explanation:
        '原文先交代人物的目標：欲負而走——想把鐘背走。接著出現阻礙：鐘大不可負——整口鐘太大，背不起來。然後人物改變方法：以椎毀之——使用「椎」敲擊鐘，要使鐘受到破壞。\n\n如果他只是想空手離開，就不需要再費力拿「椎」敲鐘；如果他想叫人幫忙，後文也不會寫他害怕別人聽見聲音。因此，最能連起三項證據的推論，是他想把大鐘敲成較小的部分，再把仍有價值的金屬帶走賣錢。完整的鐘雖然被毀壞了，不能再當樂器使用；但金屬材料本身仍然可以賣錢，這才使「毀鐘」成為一個能達成目的的計畫。\n\n證據邊界：他想把鐘敲成較小的部分、再把金屬帶走賣錢，是結合前後文與歷史背景得到的合理推論，不是古文明確寫出的事實。鐘最後被敲成幾塊、他是否已經成功把鐘敲碎，原文都沒有交代；原文也沒有直接寫出「賣」字，沒有交代他要賣給誰或能換到多少錢。',
    },
    {
      id: 'kuang_ran_you_yin',
      type: 'evidence',
      prerequisiteIds: ['wei_shen_me_hui_zhong'],
      targetSentence: '鐘況然有音',
      intro: '古人有時會把聽見的聲音直接寫進句子。我找到兩條排列方式很像的古文聲音線索。我們看看，聲音被放在句子的哪個位置。',
      clues: [
        {
          text: '鏘然有聲。',
          highlight: '鏘然',
          unlockedMeaning: '（文章正在描寫鐘被敲響。）鐘發出「鏘然」的聲音，向外傳開。',
          source: '李程〈故鍾於宮賦〉',
        },
        {
          text: '聞梁上屋角沙沙有聲。',
          highlight: '沙沙',
          unlockedMeaning: '屋裡的人聽見，屋梁上傳來「沙沙」的聲音。',
          source: '袁枚《子不語・屋傾有數》',
        },
      ],
      question: '第一條把「鏘然」放在「有聲」前面，第二條把「沙沙」放在「有聲」前面。回到「況然有音」，這四個字最可能把哪一幅畫面寫進古文？',
      options: ['鐘被敲擊後，「咣」地發出一聲明顯的聲響', '鐘沒有發出聲音，安靜地變得比較輕', '鐘的顏色突然改變，表面變得更明亮'],
      correctIndex: 0,
      correctFeedback:
        '找到古文裡的聲音特效了！「鏘然」和「沙沙」都把聽見的聲響直接寫進句子；「況然」在這裡也做同樣的事。「況然有音」就是：鐘被敲擊後，「咣」地發出一聲明顯的聲響。',
      retryHint: '「鏘然」「沙沙」都在模仿耳朵聽見的東西。「況然」後面也緊接著「有音」，哪個選項同樣是在寫聲音？',
      explanation:
        '第一條描寫鐘聲，「鏘然」緊接著「有聲」；第二條描寫屋梁上傳來的聲音，「沙沙」也緊接著「有聲」。兩條線索共同顯示：古人可以把實際聽到的聲響直接寫在「有聲」前面。\n\n回到本篇：鐘「況然有音」。「有音」說明聲音出現了；「況然」把鐘受到敲擊時的聲響寫進句子。再看後文，這個人還擔心別人聽見，可知這不是只有他貼近鐘才能察覺的微小聲音。\n\n目前可以破解為：鐘被敲擊後，「咣」地發出一聲明顯的聲響。\n\n證據邊界：這句明確寫出鐘發出了聲音；但是還沒有明確說鐘已經破裂，也沒有交代聲音傳到了多遠。',
      keyAwarded: { code: '況然有音', decodedEvidence: '鐘被敲擊後，「咣」地發出一聲明顯的聲響' },
    },
    {
      id: 'yi_chui_hui_zhi_zhong_kuang_ran_you_yin',
      type: 'reconstruction',
      prerequisiteIds: ['kuang_ran_you_yin'],
      targetSentence: '以椎毀之，鐘況然有音。',
      intro:
        '🔑「以椎毀之」：他使用「椎」敲擊前文那口鐘，要使鐘受到破壞。🔑「鐘況然有音」：鐘「咣」地發出一聲明顯的聲響。\n\n現在有兩幅畫面：一幅是人物用「椎」敲鐘，一幅是鐘發出聲響。古文把哪一幅放在前面？前後又形成什麼關係？',
      keys: [
        { code: '以椎毀之', decodedEvidence: '他使用「椎」敲擊前文那口鐘，要使鐘受到破壞' },
        { code: '鐘況然有音', decodedEvidence: '鐘「咣」地發出一聲明顯的聲響' },
      ],
      question: '把兩把密碼鑰匙依照原文順序放回去。哪一條因果鏈最符合古文？',
      options: ['他用「椎」敲擊鐘 → 鐘「咣」地發出明顯聲響', '鐘先「咣」地發出聲響 → 他因此決定不再碰鐘', '他先掩住自己的耳朵 → 鐘便安靜地變小'],
      correctIndex: 0,
      correctFeedback:
        '因果重建成功！「以椎毀之」是人物先做出的動作；「鐘況然有音」是緊接著出現的結果。他用「椎」敲擊鐘，鐘立刻「咣」地發出一聲明顯的聲響。',
      retryHint: '先找動作：是誰拿「椎」做了什麼？再找結果：哪一樣東西接著「有音」？',
      explanation:
        '古文先寫：以椎毀之。這是人物採取的新方法：使用「椎」敲擊鐘。\n\n接著寫：鐘況然有音。這是敲擊之後立刻出現的結果：鐘發出明顯的聲響。\n\n因此，原文的因果順序是：用「椎」敲鐘 → 鐘「咣」地發出聲響。\n\n原文目前可以確定「敲擊後有聲音」，但仍不能確定鐘是否已經被敲碎。下一句會告訴我們，這個聲音為什麼使人物害怕。',
      finalDraftLine: '他用「椎」敲擊鐘，鐘「咣」地發出明顯聲響。',
    },
    {
      id: 'kong',
      type: 'evidence',
      prerequisiteIds: ['yi_chui_hui_zhi_zhong_kuang_ran_you_yin'],
      targetSentence: '恐人聞之而奪己也',
      intro: '鐘聲已經響起。這個人接著想到一件還沒發生的事，古文在這個想法前面放了一個「恐」。我找到兩位人物遇到危險時的古文線索，我們來比較。',
      clues: [
        {
          text: '屠大窘，恐前後受其敵。',
          highlight: '恐',
          unlockedMeaning: '（屠夫前後各有一隻狼，已經被包圍了。）屠夫「恐」前後兩隻狼一起撲過來。',
          source: '蒲松齡《聊齋志異・狼三則》',
        },
        {
          text: '秦王恐其破璧，乃辭謝固請。',
          highlight: '恐',
          unlockedMeaning: '（藺相如拿著珍貴的和氏璧，做出要撞向柱子的樣子。）秦王「恐」他把和氏璧撞破，便趕快道歉，請他不要這樣做。',
          source: '《史記・廉頗藺相如列傳》',
        },
      ],
      question: '兩條線索都在「恐」後面接著一件還沒發生、但人物已經想到的事。「恐」最可能表示人物怎麼看待後面那件事？',
      options: ['擔心那件事真的發生', '希望那件事趕快發生', '確定那件事早已結束'],
      correctIndex: 0,
      correctFeedback: '找到「恐」的鑰匙了！屠夫擔心前後受到狼的攻擊，秦王擔心和氏璧被撞破。「恐＋一件事」可以讀成：擔心那件事真的發生。',
      retryHint: '屠夫想讓狼攻擊自己嗎？秦王想讓和氏璧被撞破嗎？看看兩個人物後來採取的行動。',
      explanation:
        '第一條線索裡，兩隻狼一前一後逼近。屠夫想到自己可能會同時受到攻擊，這是他不希望出現的結果。\n\n第二條線索裡，藺相如準備把和氏璧撞向柱子。秦王立刻道歉阻止，表示和氏璧被撞破也是他不希望出現的結果。\n\n兩件事都還沒有發生，人物卻已經想到它們，並希望阻止它們成真。因此：「恐＋一件事」可以讀成：擔心那件事真的發生。\n\n回到本篇，「恐」後面接著的完整事情，還要在下一題逐一追蹤。\n\n證據邊界：本題只破解「恐」表示人物擔心後面的事發生。至於他擔心誰聽見、又擔心東西被誰拿走，必須繼續依原文判斷。',
      keyAwarded: { code: '恐＋一件事', decodedEvidence: '擔心那件事真的發生' },
    },
    {
      id: 'kong_ren_wen_zhi',
      type: 'reconstruction',
      prerequisiteIds: ['kong'],
      targetSentence: '恐人聞之',
      intro:
        '🔑「恐＋一件事」：擔心那件事真的發生。🔑「聞」：用耳朵聽見。🔑本篇剛用過「之」：它會指回前文已經出現的人、事物或事情。這次要重新追蹤它指向什麼。\n\n前一句剛寫「鐘況然有音」。接著，這個人「恐人聞之」。「人」是其他人；那麼，其他人可能「聞」到的「之」是什麼？',
      keys: [
        { code: '恐', decodedEvidence: '擔心那件事真的發生' },
        { code: '聞', decodedEvidence: '用耳朵聽見' },
        { code: '之', decodedEvidence: '指回前文已經出現的人、事物或事情；本題必須依故事判斷指向' },
      ],
      question: '比較前後文，「恐人聞之」最可能表示什麼？',
      options: ['他擔心別人聽見鐘發出的聲音', '他擔心鐘聽見別人正在說話', '他希望別人聽見鐘聲後前來幫忙'],
      correctIndex: 0,
      correctFeedback: '指向追蹤成功！「人」是其他人，「聞」是聽見；「之」指回前一句鐘發出的聲音。「恐人聞之」就是：他擔心別人聽見鐘聲。',
      retryHint: '先回到上一句找線索：鐘剛剛發出了什麼？那一樣東西能不能被「聞」到？',
      explanation:
        '上一句寫：鐘況然有音。鐘剛剛發出明顯的聲響。下一句的「人聞之」中，「聞」表示聽見；能被別人聽見的，正是前一句出現的鐘聲。\n\n因此，「之」在這裡不是指那口鐘的形狀，也不是指拿鐘的人，而是指鐘發出的聲音。\n\n把密碼鑰匙依照原文順序組合：恐／人／聞之 → 擔心／別人／聽見鐘聲。\n\n所以：「恐人聞之」表示：他擔心別人聽見鐘聲。\n\n證據邊界：原文明確寫出他擔心別人聽見鐘聲；但這裡沒有寫「別人已經聽見了」。他又為什麼害怕別人聽見，還要繼續破解後面的「奪己」。',
    },
    {
      id: 'duo',
      type: 'evidence',
      prerequisiteIds: ['kong_ren_wen_zhi'],
      targetSentence: '恐人聞之而奪己也',
      intro: '這個人不只想到「別人聽見鐘聲」，還想到別人接著可能做出的動作。我找到兩條都出現「奪」的古文線索，我們比較動作前後發生了什麼。',
      clues: [
        {
          text: '尉劍挺，廣起，奪而殺尉。',
          highlight: '奪',
          unlockedMeaning: '（軍官拔劍要攻擊吳廣。）吳廣站起來，「奪」了軍官手中的劍，接著殺死軍官。',
          source: '《史記・陳涉世家》',
        },
        {
          text: '秦王度之，終不可彊奪。',
          highlight: '奪',
          unlockedMeaning: '（和氏璧在藺相如手中。）秦王想了想，終究不能強行「奪」和氏璧。',
          source: '《史記・廉頗藺相如列傳》',
        },
      ],
      question: '第一條線索裡，劍原本在軍官手中；第二條線索裡，和氏璧在藺相如手中。「奪」最可能是哪一種動作？',
      options: ['從別人手中強行把東西拿走', '把手中的東西完整還給別人', '把東西留在原處，不再碰它'],
      correctIndex: 0,
      correctFeedback: '破解「奪」了！劍原本在軍官手中，和氏璧在藺相如手中；「奪」會使東西離開原本拿著它的人，改到另一個人手中。「奪」就是：從別人手中強行把東西拿走。',
      retryHint: '看看東西原本在誰手中，動作完成後又可能到了誰手中。「奪」會不會改變拿著東西的人？',
      explanation:
        '第一條線索中，軍官已經拔出劍；吳廣做出「奪」的動作後，才能使用那把劍反擊。這表示劍離開軍官，到了吳廣手中。\n\n第二條線索中，和氏璧在藺相如一方。秦王雖然想得到，卻判斷不能強行「奪」。這表示「奪」不是對方主動交出，而是要從對方手中強行拿走。\n\n兩條線索共同出現的變化是：東西原本在別人手中 → 有人強行把它拿走。\n\n因此，「奪」最可能表示：從別人手中強行把東西拿走。\n\n證據邊界：本題只破解「奪」的動作。回到本篇，別人想奪走的是什麼、「己」又指誰，必須把前後文重新組合才能確定。',
      keyAwarded: { code: '奪', decodedEvidence: '從別人手中強行把東西拿走' },
    },
    {
      id: 'kong_ren_wen_zhi_er_duo_ji_ye',
      type: 'reconstruction',
      prerequisiteIds: ['duo'],
      targetSentence: '恐人聞之而奪己也',
      intro:
        '🔑「恐人聞之」：他擔心別人聽見鐘聲。🔑「奪」：從別人手中強行把東西拿走。🔑「而」以前已經破解過：把前後兩幅接續發生的畫面連起來。🔑「己」：指人物自己。\n\n「奪己」乍看之下，好像是別人要搶這個人。他究竟擔心別人來搶什麼？回到前文找證據。',
      keys: [
        { code: '恐人聞之', decodedEvidence: '他擔心別人聽見鐘聲' },
        { code: '奪', decodedEvidence: '從別人手中強行把東西拿走' },
        { code: '而', decodedEvidence: '把前後兩幅接續發生的畫面連起來' },
        { code: '己', decodedEvidence: '指人物自己' },
      ],
      question: '把前後線索合起來，「恐人聞之而奪己也」最可能表示什麼？',
      options: ['他擔心別人聽見鐘聲，把鐘從他這裡奪走', '他擔心別人聽見鐘聲，把他本人搶走', '他聽見鐘聲以後，決定把鐘主動送給別人'],
      correctIndex: 0,
      correctFeedback: '整句追蹤成功！「己」指找到鐘的這個人自己；「奪己」省略了前文已經知道的鐘。他擔心別人聽見鐘聲，再把鐘從他這裡奪走。',
      retryHint: '「奪」是強行從別人手中拿走東西。故事裡，現在被這個人佔著、又可能引來別人的東西是什麼？',
      explanation:
        '前半段已經破解為：恐人聞之 → 他擔心別人聽見鐘聲。\n\n「而」把後面可能接著發生的畫面連上來：別人聽見鐘聲 → 別人來「奪」。\n\n「己」指的是正在拿鐘、敲鐘的這個人自己。原文沒有重複寫出「鐘」，因為前文一直都在寫這口鐘；結合故事，別人要從他這裡奪走的就是鐘。\n\n因此：恐人聞之而奪己也 → 他擔心別人聽見鐘聲，再把鐘從他這裡奪走。\n\n證據邊界：原文明確寫出這是人物擔心的情況，並沒有寫別人已經趕來，也沒有寫鐘真的被奪走。下一步要看他為了阻止這件事，採取了什麼行動。',
      finalDraftLine: '他擔心別人聽見鐘聲，把鐘從他這裡奪走。',
    },
    {
      id: 'yan',
      type: 'evidence',
      prerequisiteIds: ['kong_ren_wen_zhi_er_duo_ji_ye'],
      targetSentence: '遽掩其耳',
      intro: '這個人接著對自己的耳朵做了一個動作。我找到兩條分別寫到鼻子和嘴巴的古文線索，看看「掩」讓這些部位發生了什麼。',
      clues: [
        {
          text: '西子蒙不潔，則人皆掩鼻而過之。',
          highlight: '掩',
          unlockedMeaning: '（西子身上沾到骯髒又難聞的東西。）路過的人都「掩」著鼻子走開。',
          source: '《孟子・離婁下》',
        },
        {
          text: '梁掩其口曰：「毋妄言，族矣！」',
          highlight: '掩',
          unlockedMeaning: '（項羽說了一句可能害全家被處死的話。）項梁立刻「掩」住他的嘴，叫他不要亂說。',
          source: '《史記・項羽本紀》',
        },
      ],
      question: '第一條線索中的「掩」對著鼻子，第二條線索中的「掩」對著嘴巴。「掩」最可能是哪一種動作？',
      options: ['用手遮住那個部位', '用力拉扯那個部位', '指著那個部位讓別人看'],
      correctIndex: 0,
      correctFeedback: '破解「掩」了！路人「掩鼻」，項梁「掩口」，兩幅畫面都是用手遮住那個部位。所以「掩其耳」就是遮住他的耳朵。',
      retryHint: '鼻子遇到難聞的氣味，嘴巴又不能繼續說話。哪一個動作能同時解釋這兩幅畫面？',
      explanation:
        '第一條線索裡，西子身上沾到難聞的東西。人們經過時「掩鼻」，這個動作會讓鼻子被遮住。\n\n第二條線索裡，項羽說了可能招來大禍的話。項梁立刻「掩其口」，讓他的嘴被遮住，不能繼續亂說。\n\n兩條線索共同的結構是：掩＋身體部位 → 用手遮住那個部位。\n\n回到本篇：「掩」其耳，可以先破解為：遮住他的耳朵。\n\n證據邊界：本題只破解「掩」的動作。「其耳」是誰的耳朵，以及這個動作多快發生，還要在下一題組合舊鑰匙判斷。',
      keyAwarded: { code: '掩', decodedEvidence: '用手遮住某個部位' },
    },
    {
      id: 'ju_yan_qi_er',
      type: 'reconstruction',
      prerequisiteIds: ['yan'],
      targetSentence: '遽掩其耳',
      intro:
        '🔑「遽」以前已經破解過：後面的動作很快發生，可以先讀成「立刻、急忙」。🔑「掩」：用手遮住某個部位。🔑「其＋名詞」以前已經破解過：把後面的東西連回前面提到的人；所以「其耳」是他的耳朵。\n\n鐘「咣」地響起後，這個人想到別人可能聽見。把三把密碼鑰匙依照原文順序組合，看看他接著對誰的耳朵做了什麼。',
      keys: [
        { code: '遽', decodedEvidence: '後面的動作很快發生，可以先讀成「立刻、急忙」' },
        { code: '掩', decodedEvidence: '用手遮住某個部位' },
        { code: '其耳', decodedEvidence: '他的耳朵' },
      ],
      question: '「遽掩其耳」最可能是哪一幅畫面？',
      options: ['他立刻遮住自己的耳朵', '他立刻遮住那口鐘', '他跑去遮住其他人的耳朵'],
      correctIndex: 0,
      correctFeedback: '動作重建成功！「遽」表示動作立刻發生；「掩」是遮住；「其耳」指這個人自己的耳朵。「遽掩其耳」就是：他立刻遮住自己的耳朵。',
      retryHint: '「其＋名詞」會把後面的東西連回前面提到的人。這一段一直在寫誰拿鐘、敲鐘，又擔心別人聽見？',
      explanation:
        '「遽」曾在《刻舟求劍》中破解過：遽契其舟——他立刻在自己的船上刻記號。這次「遽」仍然讓後面的動作很快發生。\n\n「掩」表示用手遮住某個部位；「其耳」把耳朵連回前面一直描寫的拿鐘者。因此：遽／掩／其耳 → 立刻／遮住／他自己的耳朵。\n\n整句可以重建為：他立刻遮住自己的耳朵。\n\n證據邊界：原文明確寫出他遮住自己的耳朵；沒有寫他遮住別人的耳朵，也沒有寫他設法讓鐘停止發聲。至於遮住自己的耳朵能不能防止別人聽見，必須回到全文因果鏈檢查。',
      finalDraftLine: '他立刻掩住自己的耳朵。',
    },
    {
      id: 'de_zhong_zhe_de_fang_fa_you_xiao',
      type: 'story_reasoning',
      prerequisiteIds: ['ju_yan_qi_er'],
      targetSentence: '恐人聞之而奪己也，遽掩其耳。',
      intro:
        '他擔心的是：別人聽見鐘聲，把鐘從他這裡奪走。他採取的行動是：立刻遮住自己的耳朵。\n\n得鐘者擔心別人聽見鐘聲，把鐘從他這裡奪走。他於是掩住自己的耳朵。這個方法有達成他想要的效果嗎？',
      question: '得鐘者掩住自己的耳朵，有達成他想要的效果嗎？',
      options: ['沒有；他自己聽不見，不代表別人聽不見', '有；只要他掩住自己的耳朵，所有人就會一起聽不見', '有；掩住自己的耳朵，可以讓那口大鐘變得比較小'],
      correctIndex: 0,
      correctFeedback:
        '找到故事裡最關鍵的錯誤了！遮住自己的耳朵，只會改變自己能不能聽見；鐘聲仍然存在，別人的耳朵也沒有被遮住。所以，這個方法不能阻止別人聽見鐘聲。',
      retryHint: '他的手遮住了誰的耳朵？其他人的耳朵有沒有一起被遮住？鐘本身是不是仍然發出了聲音？',
      explanation:
        '人物真正擔心的是：別人聽見鐘聲。\n\n可是，他實際改變的是：自己能不能聽見鐘聲。\n\n自己的耳朵和別人的耳朵並不是同一雙。遮住自己的耳朵，不能使鐘停止發聲，也不能遮住其他人的耳朵。\n\n因此，人物採取的辦法和真正想解決的問題並不相符：想阻止別人聽見 ≠ 讓自己聽不見。\n\n證據邊界：本題只檢查人物採取的方法能不能達成效果。原文明確寫出他的擔心與行動，但沒有直接記錄「他以為自己聽不見，別人也會聽不見」這句內心話。',
    },
  ],
  sequenceOrderingClosing: {
    id: 'closing_sequence_order',
    title: '最後一關：把破解畫面排回故事',
    intro: '全文的密碼都破解了。現在進行最後一次故事重建。從范氏家族敗落開始，到得鐘者掩住自己的耳朵為止，請把所有事件排成完整的大因果鏈。',
    cards: [
      { id: 'A', text: '他擔心別人聽見鐘聲，把鐘從他這裡奪走。' },
      { id: 'B', text: '范氏家族敗落，原有的勢力無法再維持。' },
      { id: 'C', text: '他立刻掩住自己的耳朵。' },
      { id: 'D', text: '百姓中有一個人發現了一口鐘。' },
      { id: 'E', text: '他用「椎」敲擊鐘，鐘「咣」地發出明顯聲響。' },
      { id: 'F', text: '他想把鐘背起來帶走，卻發現鐘太大，根本背不起來。' },
    ],
    correctOrder: ['B', 'D', 'F', 'E', 'A', 'C'],
    correctFeedback:
      '全文大因果鏈重建成功！范氏家族敗落時，百姓中有人發現那口鐘；鐘太大背不走，得鐘者便改用「椎」敲擊；敲擊發出聲音，又讓他擔心別人來奪鐘；最後，他竟然掩住了自己的耳朵。你已經把整篇古文從頭到尾連起來了！',
    retryHint: '先找故事最早交代的背景：哪一個家族發生了變化？那時，百姓中出現了誰？接著再找，得鐘者每一次改變做法，前面遇到了什麼問題？',
    explanation:
      '完成的大因果鏈：\n\n范氏家族敗落，原有的勢力無法再維持\n↓\n百姓中有一個人發現了一口鐘\n↓\n他想把鐘背起來帶走，卻發現鐘太大，根本背不起來\n↓\n他用「椎」敲擊鐘，鐘「咣」地發出明顯聲響\n↓\n他擔心別人聽見鐘聲，把鐘從他這裡奪走\n↓\n他立刻掩住自己的耳朵\n\n證據提醒：這條事件鏈只使用古文明確寫出的事件，以及已經完成的整句破解。開頭的「范氏家族敗落」是後續事件發生時的背景，不代表兩者之間存在古文明說的因果。它也沒有加入「鐘已經被敲碎」「有人已經趕來」或「鐘最後被奪走」等原文未寫出的結果。',
  },
  evidenceMultiSelectClosing: {
    id: 'closing_evidence_multiselect',
    title: '最後一關：哪些真的寫在古文裡？',
    intro:
      '故事已經全部讀懂了。最後啟動「證據掃描器」。下面有些事情是古文明確寫出的；有些雖然想起來很合理，卻是我們根據線索推論的；還有些是後來自己加上的情節。請只勾選「古文明確寫出」的事情。',
    options: [
      {
        text: '他打算把鐘敲成小塊，再把金屬帶走賣錢。',
        correct: false,
        detail: '合理推論：能解釋他為什麼想破壞一口原本可以使用的鐘，但原文沒有「賣」字，也沒有寫他準備賣給誰',
      },
      { text: '范氏家族敗落時，百姓中有一個人發現了一口鐘。', correct: true, detail: '原文證據：「范氏之亡也，百姓有得鐘者」' },
      { text: '這個人想把鐘背起來帶走，卻發現鐘太大，背不起來。', correct: true, detail: '原文證據：「欲負而走，則鐘大不可負」' },
      {
        text: '那口鐘已經被他成功敲碎，變成了許多小塊。',
        correct: false,
        detail: '自行增加：原文只明確寫出鐘發出了聲音，沒有交代鐘是否已經碎裂',
      },
      { text: '他用「椎」敲擊鐘，鐘發出了明顯的聲響。', correct: true, detail: '原文證據：「以椎毀之，鐘況然有音」' },
      { text: '他擔心別人聽見鐘聲，把鐘從他這裡奪走。', correct: true, detail: '原文證據：「恐人聞之而奪己也」' },
      {
        text: '他認為只要自己聽不見鐘聲，別人也一定聽不見。',
        correct: false,
        detail: '合理推論：能解釋他為什麼掩住自己的耳朵，但原文沒有直接記錄這句內心話',
      },
      { text: '他立刻掩住了自己的耳朵。', correct: true, detail: '原文證據：「遽掩其耳」' },
      {
        text: '別人聽見鐘聲後趕來，抓住了他，並把鐘奪走。',
        correct: false,
        detail: '自行增加：原文停在「遽掩其耳」，沒有寫任何人趕來，也沒有寫他被抓或鐘被奪走',
      },
    ],
    correctFeedback: '證據掃描完成！你只勾選了古文明確寫出的事情，沒有把合理推論或後來增加的情節當成原文。真正的古文破譯家，不只要讀懂故事，也要知道自己的理解有多少證據！',
    retryHint: '一項一項回到原文找。如果找不到可以直接對上的古文句子，即使聽起來很合理，也先不要打勾；如果是「已經發生的結果」，要確認原文有沒有真的寫出那個結果。',
    finalNote:
      '🔍 明確證據、合理推論和自行增加的故事，不是同一件事。\n\n第一層｜古文明確寫出的：范氏家族敗落時，百姓中有一個人發現鐘；他想把鐘背走，卻因鐘太大而背不起來；他用「椎」敲鐘，鐘發出了聲音；他擔心別人聽見後來奪鐘；他立刻掩住自己的耳朵。\n\n第二層｜有線索支持的合理推論：他可能想把鐘敲成較小的部分，再把金屬帶走賣錢；他可能以為遮住自己的耳朵，就能處理別人聽見鐘聲的問題。這兩個理解都能從人物的前後行動得到支持，但不是古文明確寫出的原話。\n\n第三層｜古文沒有證據：鐘已經被成功敲成許多小塊；別人已經趕來抓住他，並把鐘奪走。',
  },
  finalVerification: {
    prerequisiteStepIds: [
      'wang',
      'ye',
      'zhong',
      'fu',
      'de_zhong_yu_fu_er_zou',
      'yu_fu_er_zou_ze_zhong_da_bu_ke_fu',
      'chui',
      'hui',
      'yi_chui_hui_zhi',
      'wei_shen_me_hui_zhong',
      'kuang_ran_you_yin',
      'yi_chui_hui_zhi_zhong_kuang_ran_you_yin',
      'kong',
      'kong_ren_wen_zhi',
      'duo',
      'kong_ren_wen_zhi_er_duo_ji_ye',
      'yan',
      'ju_yan_qi_er',
      'de_zhong_zhe_de_fang_fa_you_xiao',
      'closing_sequence_order',
      'closing_evidence_multiselect',
    ],
    guideLine: '這份白話文不是新的答案。請你從頭讀一次，檢查它和你剛才一把一把取得的密碼鑰匙是否相符。',
    translation:
      '范氏家族敗落時，百姓中有一個人發現了一口鐘。他想把鐘背起來帶走，可是鐘太大，根本背不起來；於是，他用大槌敲擊鐘，想使鐘受到破壞，鐘卻「咣」地發出了明顯的聲響。他擔心別人聽見鐘聲，會把鐘從他這裡奪走，便急忙掩住了自己的耳朵。',
    comparisonRows: [
      { decodedEvidence: '范氏之亡也，百姓有得鐘者', vernacularExpression: '范氏家族敗落時，百姓中有一個人發現了一口鐘', relationship: '同一畫面' },
      { decodedEvidence: '欲負而走，則鐘大不可負', vernacularExpression: '他想把鐘背起來帶走，可是鐘太大，根本背不起來', relationship: '同一因果' },
      {
        decodedEvidence: '以椎毀之，鐘況然有音',
        vernacularExpression: '他用大槌敲擊鐘，想使鐘受到破壞，鐘卻「咣」地發出了明顯的聲響',
        relationship: '同一因果',
      },
      { decodedEvidence: '恐人聞之而奪己也', vernacularExpression: '他擔心別人聽見鐘聲，會把鐘從他這裡奪走', relationship: '同一想法' },
      { decodedEvidence: '遽掩其耳', vernacularExpression: '便急忙掩住了自己的耳朵', relationship: '同一結果' },
    ],
    completionFeedback:
      '這篇古文是你自己一個字、一個詞、一幅畫面慢慢比對出來的。你沒有先背字義，也沒有先偷看整篇白話文。你找到古文線索，追蹤「之」和「其」指向哪裡，分清楚古文明寫和合理推論，最後還把整篇故事的因果連了起來。你真的靠自己的推理，讀懂了一篇完整的古文。太了不起了，古文破譯家！',
  },
};

/**
 * Give every three-option question a stable, well-balanced answer position.
 *
 * The source lessons intentionally keep their approved option wording and correct answer together. At
 * runtime, this adapter moves only the correct option. Each block of three questions uses positions 1, 2,
 * and 3 exactly once, while a lesson/id-based permutation prevents a visible repeating pattern. Because the
 * result is calculated once when this module loads, options never jump around during retries or rerenders.
 */
function stableHash(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

const answerPositionPermutations = [
  [0, 1, 2],
  [0, 2, 1],
  [1, 0, 2],
  [1, 2, 0],
  [2, 0, 1],
  [2, 1, 0],
] as const;

function targetAnswerPosition(lessonId: string, questionOrdinal: number): number {
  const block = Math.floor(questionOrdinal / 3);
  const permutation =
    answerPositionPermutations[stableHash(lessonId + ':answer-position-block:' + block) % answerPositionPermutations.length];
  return permutation[questionOrdinal % 3];
}

function repositionCorrectOption(
  options: string[],
  correctIndex: number,
  targetIndex: number,
): { options: string[]; correctIndex: number } {
  const correctOption = options[correctIndex];
  const distractors = options.filter((_, index) => index !== correctIndex);
  const repositionedOptions = [...distractors];
  repositionedOptions.splice(targetIndex, 0, correctOption);
  return { options: repositionedOptions, correctIndex: targetIndex };
}

function distributeCorrectAnswerPositions(lesson: GuwenLesson): GuwenLesson {
  if (lesson.preserveAuthoredOptionOrder) return lesson;
  let questionOrdinal = 0;
  const steps = lesson.steps.map((step): LessonStep => {
    if (step.type === 'reveal') return step;
    const position = targetAnswerPosition(lesson.id, questionOrdinal);
    questionOrdinal += 1;
    return { ...step, ...repositionCorrectOption(step.options, step.correctIndex, position) };
  });

  const causalChainClosing = lesson.causalChainClosing
    ? {
        ...lesson.causalChainClosing,
        ...repositionCorrectOption(
          lesson.causalChainClosing.options,
          lesson.causalChainClosing.correctIndex,
          targetAnswerPosition(lesson.id, questionOrdinal),
        ),
      }
    : undefined;

  return { ...lesson, steps, causalChainClosing };
}

export const guwenLessons: GuwenLesson[] = [
  wangRongLesson,
  simaGuangLesson,
  keZhouQiuJianLesson,
  shouZhuDaiTuLesson,
  yaMiaoZhuZhangLesson,
  yanErDaoZhongLesson,
  zhengRenMaiLuLesson,
  changGanRuChengLesson,
  yangShiZhiZiLesson,
  ziXiangMaoDunLesson,
  yuRenShiYanLesson,
].map(distributeCorrectAnswerPositions);

export function findGuwenLesson(id: string): GuwenLesson | undefined {
  return guwenLessons.find((l) => l.id === id);
}

/** Total gradable/completable items in a lesson: every word/phrase step PLUS every closing screen the
 * lesson actually has (sequenceOrderingClosing/causalChainClosing/evidenceMultiSelectClosing are each
 * independently optional — see the closing-screen interfaces above). Each closing screen contributes its
 * own id to `decodedWordIds` on completion just like a step does, so it counts toward the same total a
 * child sees as "how many things are in this lesson." Use this everywhere a lesson's total is displayed
 * (`GuwenHome.tsx`'s per-lesson progress line, `GuwenLessonDecode.tsx`'s in-lesson "已破解 X/Y" counter) —
 * never hardcode a lesson's total or derive it from `lesson.steps.length` alone, since that silently
 * undercounts by the number of closing screens present and goes stale the moment a lesson's step/closing
 * count changes. */
export function totalGuwenLessonItems(lesson: GuwenLesson): number {
  const closingCount = [lesson.sequenceOrderingClosing, lesson.causalChainClosing, lesson.evidenceMultiSelectClosing].filter(
    Boolean,
  ).length;
  return lesson.steps.length + closingCount;
}
