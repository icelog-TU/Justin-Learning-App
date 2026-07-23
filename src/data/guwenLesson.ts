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

export type LessonStep = EvidenceStep | ReconstructionStep | LocalInferenceStep | StoryReasoningStep;

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
          text: '眾惡之，必察焉；眾好之，必察焉。',
          highlight: '眾',
          unlockedMeaning: '大家都討厭一個人的時候，還是要仔細觀察；大家都喜歡一個人的時候，也還是要仔細觀察。',
          source: '《論語．衛靈公》',
        },
        {
          text: '與少樂樂，與眾樂樂，孰樂？',
          highlight: '眾',
          unlockedMeaning: '一個人或很少人一起聽音樂比較快樂，還是跟一大群人一起聽音樂比較快樂？',
          source: '《孟子．梁惠王下》',
        },
      ],
      question: '兩條線索裡的「眾」都在指什麼？',
      options: ['一大群人，不只一、兩個人', '只有一個人，但是很重要的人', '一整個國家的人民'],
      correctIndex: 0,
      correctFeedback: '破解成功！兩條線索裡的「眾」都是指人數很多的一群人。',
      retryHint: '兩條線索裡，「眾」是指一個人，還是很多人？再讀一次線索裡的畫面。',
      explanation:
        '先看第一條線索。「眾惡之，必察焉」是說，當很多人都討厭一個人的時候，還是要仔細觀察，不能只因為多數人的看法就下判斷——這裡的「眾」是很多人。\n\n再看第二條線索。「與少樂樂，與眾樂樂」把「少」（很少人）和「眾」放在一起比較，「眾」明顯是指人數多的那一邊。\n\n兩條線索共同顯示：\n\n「眾」指的是一大群人，不只一、兩個人。\n\n因此，目前可以推得：\n\n「眾」表示很多人、一大群人。\n\n第二個選項把「眾」誤會成一個人；第三個選項把範圍擴大成一整個國家，但兩條線索都只是在講「人數比較多」，沒有講到國家或政治的範圍。只有第一個選項符合兩條線索共同顯示的畫面。',
      keyAwarded: { code: '眾', decodedEvidence: '一大群人，不只一、兩個人' },
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
          unlockedMeaning: '項羽身邊的人全都哭了，沒有人能抬起頭看他。',
          source: '《史記．項羽本紀》',
        },
        {
          text: '陳勝、吳廣皆次當行，為屯長。',
          highlight: '皆',
          unlockedMeaning: '陳勝和吳廣兩人都被編在同一批要去戍守的隊伍裡，一起擔任隊長。',
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
        { code: '眾', decodedEvidence: '一大群人，不只一、兩個人' },
        { code: '皆', decodedEvidence: '全部，沒有例外' },
        { code: '棄去', decodedEvidence: '把人或東西留下，不再理會，並且離開' },
      ],
      question: '把三把密碼鑰匙依照原文順序組合，「眾皆棄去」最可能是哪一幅畫面？',
      options: ['只有一個孩子離開，其他人留下幫忙', '其他孩子全都把落水的孩子丟下，離開現場', '所有孩子一起把甕搬離庭院'],
      correctIndex: 1,
      correctFeedback: '整句破解成功！其他孩子全都離開了，沒有人留下來幫忙。',
      retryHint: '注意「皆」：它表示全部，不是只有一個，也不是其中幾個。',
      explanation:
        '這句有三把密碼鑰匙：\n\n「眾」是一大群人。\n「皆」表示全部，沒有例外。\n「棄去」表示把人留下、不再理會，並且離開。\n\n回到故事：「群兒戲於庭」告訴我們，在場的本來就是一群一起玩耍的孩子；扣掉沒入水中的那個孩子，「眾」在這裡指的就是其他在場的那群孩子。\n\n把三把鑰匙依照原文順序組合：\n\n眾／皆／棄去\n其他孩子們／全部／把同伴丟下並離開\n\n因此，「眾皆棄去」表示：\n\n其他孩子全都把落水的孩子丟下，離開現場。\n\n第一個選項把「皆」誤解成只有一個人；第三個選項雖然保留了「所有孩子」，卻把「棄去」的對象錯換成甕，也增加了原文沒有的搬運動作。只有第二個選項符合三把密碼鑰匙。\n\n下一句馬上出現「光持石……」，表示司馬光沒有跟著離開。這裡的「眾」是在司馬光之外、先行離去的其他孩子。',
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
          text: '人或持石擊地。',
          highlight: '持石擊地',
          unlockedMeaning: '做完這串動作後，地面傳出了特別的聲音。',
          source: '郎瑛《七修類稿》卷二。',
        },
        {
          text: '某歸聞之，怒，持杖擊之。',
          highlight: '持杖擊之',
          unlockedMeaning: '這個人生氣地做完這串動作後，眼前的鬼挨了一下。這裡的「之」指那個鬼。',
          source: '徐鉉《稽神錄》卷三。',
        },
      ],
      question: '比較兩條古文線索，再回到原文：「持石擊甕」到底是什麼動作？',
      options: ['把石頭放進甕裡', '拿著甕去撞石頭', '拿著石頭敲打甕'],
      correctIndex: 2,
      correctFeedback: '破解成功！兩條線索都顯示：前面的東西被人使用，動作落在後面的對象上。',
      retryHint: '第一條線索中，最後發出聲音的是地面；第二條線索中，最後挨了一下的是鬼。看看「擊」後面接的是什麼。',
      explanation:
        '第一條線索是「持石擊地」。做完這個動作後，地面傳出聲音——動作落在地面上，而石頭是人使用的東西。\n\n第二條線索是「持杖擊之」，「之」指眼前的鬼。做完這個動作後，挨了一下的是鬼，而前面出現的木杖是人使用的東西。\n\n兩條線索共同呈現：\n\n「持」後面出現人所使用的東西。\n「擊」後面出現動作落到的對象。\n\n再回到原文「持石擊甕」：人所使用的是石頭，動作落到的是甕。\n\n因此，「持石擊甕」最可能表示：\n\n拿著石頭敲打甕。\n\n第一個選項「把石頭放進甕裡」沒有出現在兩條線索的畫面裡——兩條線索都是「敲打」，不是「放進去」。第二個選項「拿著甕去撞石頭」把工具和目標的位置整個對調，跟兩條線索呈現的方向相反。只有第三個選項同時符合兩條線索「前面是工具、後面是目標」的關係。\n\n目前只破解到司馬光用石頭敲甕；甕後來是否破掉，還要繼續破解後面的「破之」。',
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

export const guwenLessons: GuwenLesson[] = [simaGuangLesson];

export function findGuwenLesson(id: string): GuwenLesson | undefined {
  return guwenLessons.find((l) => l.id === id);
}
