/**
 * 古文破譯家 — "Lesson" format: a stricter evidence-based methodology than the original GuwenWord model in
 * guwen.ts. Cross-text clues here must be REAL classical excerpts (never modern-Chinese sentences), each
 * with a pre-unlocked vernacular gloss and a traceable source, and the child reconstructs multi-part
 * phrases from separately-decoded "decoding keys" before the full text's translation is ever revealed.
 * See .claude/skills/design-guwen-decoding/SKILL.md and .claude/skills/guwen-decoder/SKILL.md for the full
 * design contract this format follows. `wangRongText` in guwen.ts (the first text) predates this format and
 * is intentionally left on its original model — this file does not touch it.
 */

/** One real classical-text excerpt used as comparison evidence for a target word/phrase. */
export interface ClassicalClue {
  /** The exact classical excerpt, character-for-character — never modernized, paraphrased, or invented. */
  text: string;
  /** The exact substring of `text` to visually highlight (the word/phrase this clue is evidence for). */
  highlight: string;
  /** Child-facing vernacular gloss for this clue sentence only — unlocks the clue, never the target sentence. */
  unlockedMeaning: string;
  /** Traceable source (author/work), preserved verbatim from the approved lesson content. */
  source: string;
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
  /** This step's contribution to the final assembled draft ("我的破譯稿"), only set on the 7 steps whose
   * solved meaning becomes one line of the reconstructed story (see 全文密碼地圖 in the source lesson). */
  finalDraftLine?: string;
  /** The decoding key this step contributes to a later reconstruction step's key table, if any. */
  keyAwarded?: DecodingKey;
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
  finalDraftLine?: string;
  keyAwarded?: DecodingKey;
}

export type LessonStep =
  | EvidenceStep
  | ReconstructionStep
  | LocalInferenceStep
  | StoryReasoningStep
  | RevealStep;

/** 收尾一：drag-free sequence-ordering checkpoint. The child reorders shuffled story-beat cards (via
 * up/down buttons, not true drag-and-drop — decided with the user for mobile reliability) into the order
 * they happened in the classical text. */
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
}

/** 收尾二：a non-interactive causal-chain summary — no scoring, no distractors, just a sequential reveal of
 * how one event led to the next, ending in a core-summary line and a continue button. */
export interface CausalChainClosing {
  id: string;
  title: string;
  displayNote: string;
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
}

export interface ClosingSequence {
  sequenceOrdering: SequenceOrderingClosing;
  causalChain: CausalChainClosing;
  evidenceMultiSelect: EvidenceMultiSelectClosing;
}

export interface ComparisonRow {
  decodedEvidence: string;
  vernacularExpression: string;
  relationship: string;
}

export interface FinalVerification {
  /** Step ids that must all be solved before the verification scroll unlocks. */
  prerequisiteStepIds: string[];
  unlockButtonLabel: string;
  guideLine: string;
  translation: string;
  comparisonRows: ComparisonRow[];
  completionFeedback: string;
}

export interface GuwenLesson {
  id: string;
  title: string;
  source: string;
  /** App 開場白 — spoken on the intro screen. */
  introSpokenLine: string;
  fullText: string;
  /** fullText split into individually-readable sentences (concatenating these reproduces fullText exactly). */
  sentences: string[];
  steps: LessonStep[];
  /** Optional whole-lesson wrap-up screens shown after every step is solved, before the final translation
   * unlocks — event-sequencing, then a causal-chain summary, then an evidence-boundary multi-select. */
  closingSequence?: ClosingSequence;
  finalVerification: FinalVerification;
}

export const simaGuangLesson: GuwenLesson = {
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
          unlockedMeaning: '虞舜在歷山耕作。',
          source: '干寶《搜神記》卷八。',
        },
        {
          text: '子路宿於石門。',
          highlight: '宿於',
          unlockedMeaning: '子路在石門過夜。',
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
    unlockButtonLabel: '打開白話驗證卷軸',
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

export const keZhouQiuJianLesson: GuwenLesson = {
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
          unlockedMeaning: '（淇是一條河的名字。）我陪你涉淇，一直送到頓丘。',
          source: '《詩經．衛風．氓》',
        },
        {
          text: '子惠思我，褰裳涉溱。',
          highlight: '涉溱',
          unlockedMeaning: '（溱水是一條河的名字。）如果你想念我，就提起衣裳，涉溱來找我。',
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
        '先看第一條線索的移動路線：說話的人送對方來到淇水，陪他涉淇，最後又送到頓丘。涉淇不會只是停在淇水旁邊，否則人物無法繼續到達後面的地點。\n\n再看第二條線索的準備動作：想去找對方的人先褰裳，也就是提起衣裳，接著才要涉溱。提起衣裳和溱水同時出現，表示接下來的移動會經過水域，而不是沿著岸邊折返。\n\n兩條線索的共同證據是：\n\n人物面前都有一條水域；\n人物都要繼續前往另一個目的地；\n「涉」位在接近水域之後、繼續前進之前。\n\n因此，「涉」在這些句子裡表示通過水域，從一邊往另一邊移動。「江」是河流，所以「涉江」形成的畫面是越過一條河。\n\n目前古文只讓我們確定「越過河流」這件事，還沒有單靠這四個字說明使用哪一種工具。後文出現「舟」，才會補上故事中的交通方式。破譯時不能把後來才知道的情報，偷偷塞回眼前的古文裡。\n\n「停在水邊」無法解釋第一條線索為何接著到達頓丘，也無法完成第二條線索中前去找人的目的。「沿岸走回去」與兩條線索持續朝目的地前進的方向相反，而且不能解釋為什麼要先提起衣裳。\n\n「有……者」不另設題目：破解「涉江」後，直接把整句更新為——有一位楚國人正在越過一條河。',
      finalDraftLine: '有一位楚國人正在越過一條河',
    },
    {
      id: 'qi_jian',
      type: 'evidence',
      prerequisiteIds: ['she_jiang'],
      targetSentence: '其劍自舟中墜於水',
      intro: '新的句子出現「其劍」。這把劍和前面哪個人有關？先看看其他古文中的「其」會怎麼指路。',
      clues: [
        {
          text: '梁國楊氏子，九歲，甚聰惠。孔君平詣其父。',
          highlight: '其',
          unlockedMeaning: '梁國楊家的孩子九歲，非常聰明。孔君平前去拜訪其父親。',
          source: '《世說新語．言語》',
        },
        {
          text: '曾子之妻之市，其子隨之而泣。',
          highlight: '其',
          unlockedMeaning: '曾子的妻子前往市場，其兒子跟在後面哭泣。',
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
          unlockedMeaning: '這種小蟲又喜歡往高處爬，用盡力氣也不停，最後墜到地面死去。',
          source: '柳宗元〈蝜蝂傳〉',
        },
        {
          text: '手中算囊遂墜於水。',
          highlight: '墜',
          unlockedMeaning: '他乘船時，手中的算袋便墜於水。',
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
      type: 'reveal',
      prerequisiteIds: ['zhui'],
      targetSentence: '其劍自舟中墜於水',
      intro: '「其」「墜」都破解了，「於＋地點」是上一篇已經取得的舊鑰匙，直接喚回，不用重新破解。把所有線索放回故事看看。',
      keys: [
        { code: '其劍', decodedEvidence: '前面那位楚國人的劍' },
        { code: '自舟中', decodedEvidence: '從船裡' },
        { code: '墜', decodedEvidence: '從原來的位置往下移動' },
        { code: '於水', decodedEvidence: '到水裡（舊鑰匙）' },
      ],
      continueLabel: '繼續破解 →',
      correctFeedback: '整句重建成功！',
      explanation:
        '把已取得的密碼鑰匙依照原句順序組合：\n\n其劍／自舟中／墜／於水\n前面那位楚國人的劍／從船裡／往下移動／到水裡\n\n因此，「其劍自舟中墜於水」表示：\n\n那位楚國人的劍從船裡掉進水中。\n\n回到連續原文：楚人有涉江者，其劍自舟中墜於水。\n\n目前讀懂的故事：有一位楚國人正在渡河。他的劍從船裡掉進水中。',
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
          unlockedMeaning: '（公仲原本不肯接見顏率。）公仲的門人把顏率的話轉告給他，公仲便遽起身接見顏率。',
          source: '《戰國策．顏率見公仲》',
        },
        {
          text: '帝驚，遽起持昭儀曰。',
          highlight: '遽',
          unlockedMeaning: '（昭儀突然倒在地上。）皇帝吃了一驚，便遽起身扶住她說話。',
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
            '古代不同地方的人用不同儀式表示信用：北方人彈動骨頭，越地人契手臂，中原人把牲血塗在嘴邊。（越地人完成這個儀式後，手臂表面會留下痕跡。）',
          source: '《淮南子．齊俗訓》',
        },
        {
          text: '爰始爰謀，爰契我龜。',
          highlight: '契',
          unlockedMeaning: '（古人占卜時，會觀察龜甲上的裂紋。）人們開始商量，接著契自己的龜甲，最後決定在這裡建造房屋。',
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
      type: 'reveal',
      prerequisiteIds: ['qi_qi_zhou'],
      targetSentence: '遽契其舟曰',
      intro: '「遽」「契其舟」都破解了，「曰」是常見的舊鑰匙——說。把線索放回故事看看。',
      keys: [
        { code: '遽', decodedEvidence: '立刻、急忙接著做' },
        { code: '契其舟', decodedEvidence: '在他乘坐的船上刻下記號' },
        { code: '曰', decodedEvidence: '說（舊鑰匙）' },
      ],
      continueLabel: '繼續破解 →',
      correctFeedback: '整句重建成功！',
      explanation:
        '把密碼鑰匙依照原句順序組合：\n\n遽／契其舟／曰\n立刻、急忙／在他乘坐的船上刻下記號／說\n\n因此，「遽契其舟曰」表示：\n\n他立刻在自己乘坐的船上刻下一個記號，說……\n\n回到連續原文：楚人有涉江者，其劍自舟中墜於水，遽契其舟曰……\n\n目前讀懂的故事：有一位楚國人正在渡河。他的劍從船裡掉進水中，他立刻在自己乘坐的船上刻下一個記號，接著說……',
      finalDraftLine: '他立刻在自己乘坐的船上刻下一個記號，說',
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
          unlockedMeaning: '（前文正在說一隻名叫鵬的大鳥。）是鳥遇到海上大風時，就要遷往南方的大海。',
          source: '《莊子．逍遙遊》',
        },
        {
          text: '是日也，天朗氣清，惠風和暢。',
          highlight: '是',
          unlockedMeaning: '（前文正在說蘭亭聚會的那一天。）是日天空晴朗，空氣清新，微風和暖舒暢。',
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
          unlockedMeaning: '（這是孔子回想自己人生時說的話。）孔子說：吾十五歲時立志學習。',
          source: '《論語．為政》',
        },
        {
          text: '吾楯之堅，莫能陷也。',
          highlight: '吾',
          unlockedMeaning: '（「楯」就是盾牌，說話的人正在販賣武器。）賣武器的人誇口說：吾楯非常堅固，沒有東西能刺穿它。',
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
          unlockedMeaning: '（桃花源中的村民第一次看見外來的漁人。）村民看見漁人，非常驚訝，便問他所從來；漁人一一回答。',
          source: '陶淵明〈桃花源記〉',
        },
        {
          text: '術丐乞者，不知所從來。',
          highlight: '所從來',
          unlockedMeaning: '有一位表演法術的乞討者，大家不知道他所從來；他只說自己姓胡，名叫媚兒。',
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
      type: 'reveal',
      prerequisiteIds: ['suo_cong_zhui'],
      targetSentence: '是吾劍之所從墜',
      intro: '「是」「吾劍」「之所從墜」都破解了。把線索放回這句話看看。',
      keys: [
        { code: '是', decodedEvidence: '這裡、這一個地方' },
        { code: '吾劍', decodedEvidence: '說話者自己的劍' },
        { code: '之所從墜', decodedEvidence: '從這個地方掉下去' },
      ],
      continueLabel: '繼續破解 →',
      correctFeedback: '整句重建成功！',
      explanation:
        '把密碼鑰匙依照原句順序組合：\n\n是／吾劍／之所從墜\n這裡／說話者自己的劍／從這個地方掉下去\n\n因此，「是吾劍之所從墜」表示：\n\n「這裡是我的劍掉下去的地方。」\n\n證據邊界：這句只能確定楚國人認為記號記下了「劍從船上掉落的地方」。它還不能證明這個記號最後是否能幫他找回劍，也沒有直接說出楚國人的個性或內心。\n\n回到連續原文：楚人有涉江者，其劍自舟中墜於水，遽契其舟曰：「是吾劍之所從墜。」\n\n目前讀懂的故事：有一位楚國人正在渡河。他的劍從船裡掉進水中，他立刻在自己乘坐的船上刻下一個記號，說：「這裡是我的劍掉下去的地方。」',
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
          unlockedMeaning: '方士徐市等人，一起進入海中，尋找長生不老的仙藥。',
          source: '《史記．秦始皇本紀》',
        },
        {
          text: '與數人入林求木。',
          highlight: '入林求木',
          unlockedMeaning: '他和幾個人一起，進入樹林，尋找可以使用的木材。',
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
      type: 'reveal',
      prerequisiteIds: ['ru_shui_qiu_zhi'],
      targetSentence: '舟止，從其所契者入水求之。',
      intro: '「舟止」不特別出題——結合正在渡江的航程，可以直接讀成「船抵達目的地後停下來」。「其」「契」也是已經取得的舊鑰匙。把所有線索放回故事看看。',
      keys: [
        { code: '舟止', decodedEvidence: '船抵達目的地後停下來' },
        { code: '從其所契者', decodedEvidence: '從他刻記號的地方' },
        { code: '入水求之', decodedEvidence: '進入水中，尋找那把劍' },
      ],
      continueLabel: '繼續破解 →',
      correctFeedback: '整句重建成功！',
      explanation:
        '把密碼鑰匙依照原句順序組合：\n\n舟止／從其所契者／入水求之\n船抵達目的地後停下來／從他刻記號的地方／進入水中，尋找那把劍\n\n因此，「舟止，從其所契者入水求之」表示：\n\n船抵達目的地後停下來，他從自己刻記號的地方進入水中，尋找那把劍。\n\n證據邊界：這句只寫出楚人從船上刻記號的地方進入水中找劍。它還沒有說他是否找得到，也沒有說明他的做法錯在哪裡；這些必須等待後文提供證據。\n\n回到連續原文：楚人有涉江者，其劍自舟中墜於水，遽契其舟曰：「是吾劍之所從墜。」舟止，從其所契者入水求之。\n\n目前讀懂的故事：有一位楚國人正在渡河。他的劍從船裡掉進水中，他立刻在自己乘坐的船上刻下一個記號，說：「這裡是我的劍掉下去的地方。」船抵達目的地後停下來，他從自己刻記號的地方進入水中，尋找那把劍。',
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
          unlockedMeaning: '墨子聽到消息，從齊國出發，行了十天十夜，最後抵達楚國的郢都。',
          source: '《墨子．公輸》',
        },
        {
          text: '四鼓，解舟行，至西興鎮。',
          highlight: '行',
          unlockedMeaning: '天還沒亮，他們解開船纜，讓船行，後來抵達西興鎮。',
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
          unlockedMeaning: '我年輕力壯時，尚且比不上別人；如今老矣，已經不能做什麼了。',
          source: '《左傳．僖公三十年》',
        },
        {
          text: '骨已盡矣，而兩狼之並驅如故。',
          highlight: '矣',
          unlockedMeaning: '屠夫能丟給狼的骨頭已經用盡矣，可是兩隻狼仍像先前一樣一起追趕。',
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
      type: 'reveal',
      prerequisiteIds: ['yi'],
      targetSentence: '舟已行矣，而劍不行。',
      intro: '「行」「矣」都破解了。把線索放回這句話看看。',
      keys: [
        { code: '舟已行矣', decodedEvidence: '船已經繼續往目的地開去，離開原來的位置' },
        { code: '而', decodedEvidence: '前後出現轉折或對照（舊鑰匙）' },
        { code: '劍不行', decodedEvidence: '劍沒有跟著改變位置' },
      ],
      continueLabel: '繼續破解 →',
      correctFeedback: '整句重建成功！',
      explanation:
        '把密碼鑰匙依照原句順序組合：\n\n舟已行矣／而／劍不行\n船已經繼續往目的地開去／可是／劍沒有跟著改變位置\n\n因此，「舟已行矣，而劍不行」表示：\n\n船已經繼續往目的地開去了，可是劍沒有跟著船一起移動。\n\n證據邊界：這裡可以確定船與劍的位置關係已經改變。原文還沒有直接說出作者對楚人的評價；必須繼續破解最後一句，不能先替作者補上「愚蠢」或其他判斷。\n\n回到連續原文：楚人有涉江者，其劍自舟中墜於水，遽契其舟曰：「是吾劍之所從墜。」舟止，從其所契者入水求之。舟已行矣，而劍不行。\n\n目前讀懂的故事：有一位楚國人正在渡河。他的劍從船裡掉進水中，他立刻在自己乘坐的船上刻下一個記號，說：「這裡是我的劍掉下去的地方。」船繼續往目的地開去；抵達目的地後，船停了下來，他才從自己刻記號的地方進入水中，尋找那把劍。可是船早已離開劍掉落的位置，沉在水中的劍並沒有跟著船一起移動。',
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
          unlockedMeaning: '（張文節當了宰相，吃穿仍和以前一樣簡單。）有人勸他：「您現在領的薪水不少，怎麼還把日子過得若此？可以讓自己過得好一點呀！」',
          source: '司馬光〈訓儉示康〉',
        },
        {
          text: '求聞之若此，不若無聞也。',
          highlight: '若此',
          unlockedMeaning: '（某人想打聽消息卻完全弄錯。）打聽消息卻若此，還不如沒聽到。',
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
          unlockedMeaning: '學過以後常常練習，不亦令人高興嗎？',
          source: '《論語．學而》',
        },
        {
          text: '有朋自遠方來，不亦樂乎？',
          highlight: '不亦',
          unlockedMeaning: '有朋友從遠方來看你，不亦令人快樂嗎？',
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
          unlockedMeaning: '有智慧的人不會惑，有仁德的人不會憂愁，勇敢的人不會害怕。',
          source: '《論語．子罕》',
        },
        {
          text: '惑而不從師，其為惑也，終不解矣。',
          highlight: '惑',
          unlockedMeaning: '心中有了惑卻不向老師請教，這個惑到最後仍然無法解開。',
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
          unlockedMeaning: '項王對樊噲說：「勇士！你還能再喝一杯酒乎？」',
          source: '司馬遷《史記．項羽本紀》',
        },
        {
          text: '學詩乎？',
          highlight: '乎',
          unlockedMeaning: '孔子對兒子說：「你學過《詩經》乎？」兒子回答：「還沒有。」',
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
      type: 'reveal',
      prerequisiteIds: ['hu'],
      targetSentence: '求劍若此，不亦惑乎？',
      intro: '「若此」「不亦」「惑」「乎」都破解了。把整句組合起來看看。',
      keys: [
        { code: '若此', decodedEvidence: '像前面剛剛描述的那樣' },
        { code: '不亦', decodedEvidence: '說話者心中已有判斷，用問句加強語氣' },
        { code: '惑', decodedEvidence: '沒有想通；本篇是在批評做法糊塗' },
        { code: '乎', decodedEvidence: '放在句尾，讓整句成為問句' },
      ],
      continueLabel: '看看全文重建 →',
      correctFeedback: '整句重建成功！全文的古文密碼都破解完了！',
      explanation:
        '依照原文順序組合：\n\n求劍若此／不亦／惑／乎\n像前面那樣尋找劍／心中已有判斷，用問句加強語氣／糊塗／表示提問\n\n因此，「求劍若此，不亦惑乎」表示：\n\n像這樣尋找劍，不是很糊塗嗎？\n\n這不是作者真的不知道答案，而是作者認為楚人的做法很糊塗，用問句請讀者一起確認。\n\n所有古文密碼都已經破解完成。',
      finalDraftLine: '像這樣尋找劍，不是很糊塗嗎？',
    },
  ],
  closingSequence: {
    sequenceOrdering: {
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
    causalChain: {
      id: 'closing_causal_chain',
      title: '破譯完成：這個方法為什麼出了問題？',
      displayNote: '這一段是全文理解摘要，不需作答。',
      nodes: [
        '劍從船上掉進水裡',
        '楚人把記號刻在船上',
        '船繼續往目的地開去，船上的記號也跟著移動',
        '劍沒有跟著船一起移動',
        '船抵達目的地後停下來，楚人從已經移動的記號處進入水中找劍',
        '船上的記號已經不能指出劍原本掉進水裡的位置',
      ],
      coreSummary:
        '問題不在於楚人有沒有留下記號，而在於他把記號刻在會移動的船上。所以作者才會問：「求劍若此，不亦惑乎？」——像這樣尋找劍，不是很糊塗嗎？',
      evidenceBoundary:
        '原文寫到楚人「入水求之」，沒有直接交代他最後有沒有找到劍。因此，摘要只說船上的記號已經不能指出原來落劍的位置，不把「他最後沒有找到劍」寫成古文明確交代的結果。',
      continueButtonLabel: '開始證據判讀',
    },
    evidenceMultiSelect: {
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
  },
  finalVerification: {
    prerequisiteStepIds: [
      'she_jiang',
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
    unlockButtonLabel: '打開白話驗證卷軸',
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

export const guwenLessons: GuwenLesson[] = [simaGuangLesson, keZhouQiuJianLesson];

export function findGuwenLesson(id: string): GuwenLesson | undefined {
  return guwenLessons.find((l) => l.id === id);
}
