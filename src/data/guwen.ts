/** One modern-Chinese "corpus" sentence using the target character in a specific sense, for comparison. */
export interface GuwenCorpusOption {
  sentence: string;
  meaning: string;
}

/** Another spot in the same text where this word reappears, so all its occurrences can be compared side by side. */
export interface GuwenOccurrence {
  sentence: string;
  note: string;
}

/**
 * Not every classical word breaks down the same way:
 * - 'context' (default): the word has genuinely distinct senses — the child compares 3 corpus sentences
 *   and picks whichever usage matches the target sentence, ruling the others out.
 * - 'pattern': the word doesn't have discrete senses to choose between (e.g. 諸 just marks "many/each" in
 *   front of whatever follows) — forcing a 3-choice "which is closest" question about a single example is
 *   artificial since all the examples use it the same way. Instead the child reads several real examples
 *   (auto-played together, then individually replayable), then answers a genuine multiple-choice question
 *   about what the *shared pattern* is — not a passive "reveal" button. The wrong options must each have
 *   their own internal logic (usually a generalization that fits 2 of the 3 examples but breaks on the
 *   third), not just be nonsense — the point is to teach checking a rule against *all* the evidence.
 */
export type GuwenPuzzleType = 'context' | 'pattern';

/** One古文字 to decode: a classical-only usage the child must derive by comparing corpus sentences. */
export interface GuwenWord {
  id: string;
  /** May be more than one character (e.g. "信然" is decoded as a single two-character unit). */
  char: string;
  /** The sentence from the classical text this word is introduced in (shown during its puzzle). */
  targetSentence: string;
  /** Defaults to 'context' when omitted. */
  puzzleType?: GuwenPuzzleType;
  /** Used when puzzleType is 'context' (or omitted). */
  corpus?: GuwenCorpusOption[];
  correctIndex?: number;
  /** Used when puzzleType is 'pattern'. Spoken/shown in order: patternPrompt → each of patternExamples →
   * patternQuestion → then the patternOptions become the actual answer choices (one correct). */
  patternPrompt?: string;
  patternExamples?: string[];
  patternQuestion?: string;
  patternOptions?: string[];
  patternCorrectIndex?: number;
  meaning: string;
  explanation: string;
  /** Other places this word reappears in the same text, shown together once solved so the child can compare whether the meaning stays the same or shifts. */
  occurrences?: GuwenOccurrence[];
}

export interface GuwenText {
  id: string;
  title: string;
  source: string;
  /** Spoken aloud automatically when the intro page loads, before the title and explanation. */
  introSpokenLine: string;
  fullText: string;
  /** fullText split into individually-readable sentences (concatenating these reproduces fullText exactly), so each one can get its own playback button. */
  sentences: string[];
  modernTranslation: string;
  reflectionQuestion: string;
  reflectionAnswer: string;
  words: GuwenWord[];
}

export const wangRongText: GuwenText = {
  id: 'wang-rong-li',
  title: '王戎不取道旁李',
  source: '世說新語．雅量',
  introSpokenLine: '我們來破解古文吧。這篇古文來自世說新語．雅量篇。',
  fullText:
    '王戎七歲，嘗與諸小兒遊。看道邊李樹多子折枝，諸兒競走取之，唯戎不動。人問之，答曰：「樹在道邊而多子，此必苦李。」取之，信然。',
  sentences: [
    '王戎七歲，嘗與諸小兒遊。',
    '看道邊李樹多子折枝，諸兒競走取之，唯戎不動。',
    '人問之，答曰：「樹在道邊而多子，此必苦李。」',
    '取之，信然。',
  ],
  modernTranslation:
    '王戎七歲的時候，曾經和很多小朋友一起出去玩。大家看到路邊的李子樹上結了好多果實，把樹枝都壓彎了，其他小朋友都爭先恐後地跑去摘，只有王戎沒有動。有人問他為什麼不去摘，他回答說：「這棵樹長在路邊，卻還有這麼多李子沒被摘走，這一定是苦李子。」摘下來一嚐，果然是這樣。',
  reflectionQuestion: '王戎明明沒有吃過那棵樹上的李子，為什麼可以一口斷定「這一定是苦李子」呢？',
  reflectionAnswer:
    '因為那棵樹長在「路邊」——每天有很多人經過，如果李子是甜的、好吃的，早就被路過的人摘光了，不可能還「多子折枝」（多到把樹枝都壓彎）。王戎從「位置」和「結果」反過來推理原因，這就是他觀察力和判斷力過人的地方！',
  words: [
    {
      id: 'chang',
      char: '嘗',
      targetSentence: '王戎七歲，嘗與諸小兒遊。',
      corpus: [
        { sentence: '弟弟第一次嘗榴槤，吃了一口就皺起眉頭。', meaning: '品嚐、嚐味道' },
        { sentence: '杜甫嘗住成都，留下許多有名的詩作。', meaning: '曾經' },
        { sentence: '妹妹今天想嘗試自己綁鞋帶。', meaning: '嘗試、試著做' },
      ],
      correctIndex: 1,
      meaning: '曾經',
      explanation:
        '破解古文，不是先背字典，而是先找最像的語境。第二句「杜甫嘗住成都」和目標句「王戎嘗與諸小兒遊」有很相似的句型：「嘗＋動作」，兩句都是在描述一件過去曾經發生的事情。第一句是在說「品嘗」，第三句是在說「嘗試」，只有第二句和目標句的用法最接近。所以這裡的「嘗」表示：曾經。',
    },
    {
      id: 'yu',
      char: '與',
      targetSentence: '王戎七歲，嘗與諸小兒遊。',
      corpus: [
        { sentence: '爸爸與媽媽一起散步。', meaning: '跟、和' },
        { sentence: '老師贈與每位同學一本故事書。', meaning: '給、給予' },
        { sentence: '妹妹參與合唱團表演。', meaning: '參加、加入' },
      ],
      correctIndex: 0,
      meaning: '跟、和',
      explanation:
        '先不要急著想「與」有哪些意思，先看看它在句子裡扮演什麼角色。目標句是「王戎與諸小兒遊」，第一句是「爸爸與媽媽散步」，都是「A與B一起做某件事情」。第二句是「給」，第三句是「參加」，因此第一句和目標句最像。所以這裡的「與」表示：跟、和。',
    },
    {
      id: 'zhu',
      char: '諸',
      targetSentence: '王戎七歲，嘗與諸小兒遊。',
      puzzleType: 'pattern',
      patternPrompt: '請把下面幾句話唸一遍，你有沒有發現「諸」後面接的東西有什麼共同點？',
      patternExamples: ['諸位老師都到了。', '諸國派使者前來。', '諸小兒一起玩耍。'],
      patternQuestion: '你發現「諸」字用法的規律了嗎？',
      patternOptions: [
        '「諸」後面接的都是很多人組成的團體，所以「諸」只能用在講一群人的時候。',
        '「諸」後面接的都是人或事物的名稱，「諸」本身沒有特別意思，只是表示後面的東西不只一個。',
        '「諸」後面接的東西一定是要用敬語稱呼的對象，所以「諸」表示尊敬的意思。',
      ],
      patternCorrectIndex: 1,
      meaning: '眾多的、各個',
      explanation:
        '「諸」後面接的東西雖然不一樣——老師、國家、小孩——但共同點是它們都是「人或事物的名稱」，而且都不只一個。「諸」本身沒有特別的意思，它只是讓後面的東西變成「很多個」。如果只看「諸位老師」和「諸國」，可能會覺得「諸」是在講很有身分地位的人或團體，但「諸小兒」（一群小孩）就不算「很有地位」，這個說法就不成立了；同樣地，如果覺得「諸」代表尊敬，那「諸小兒」也不太算是需要用敬語稱呼的對象。所以最準確的規律是：「諸」＋名詞＝很多個那個東西。「諸小兒」就是「一群小朋友」，「諸位老師」就是「各位老師」，「諸國」就是「各個國家」。',
    },
    {
      id: 'you',
      char: '遊',
      targetSentence: '王戎七歲，嘗與諸小兒遊。',
      corpus: [
        { sentence: '暑假我們全家去日本旅遊。', meaning: '旅遊、觀光' },
        { sentence: '放學後，大家在操場一起遊玩。', meaning: '玩耍' },
        { sentence: '小魚在水裡游來游去。', meaning: '游動、游泳' },
      ],
      correctIndex: 1,
      meaning: '玩耍',
      explanation:
        '第二句和目標句都有一群孩子一起活動的畫面，不是長途旅行，也不是在水裡游泳，而是一起玩。所以「遊」在這裡表示：玩耍。',
    },
    {
      id: 'duozizhezhi',
      char: '多子折枝',
      targetSentence: '看道邊李樹多子折枝。',
      puzzleType: 'pattern',
      patternPrompt:
        '「多子折枝」這四個字合在一起是一幅畫面，不是一個字一個字分開解釋的。如果只看「折」，可能會猜成「有人去攀折樹枝」——但我又找到兩個線索，可以幫你判斷這樣猜對不對，你聽聽看：',
      patternExamples: ['柿樹多子壓枝。', '葡萄多實垂架。'],
      patternQuestion: '你覺得哪個意思更符合「多子折枝」？',
      patternOptions: ['很多小孩子攀折樹枝，想要爬上去摘果子。', '果實結得太多、太重，把樹枝都壓彎了。'],
      patternCorrectIndex: 1,
      meaning: '果實結得太多，把樹枝都壓彎了',
      explanation:
        '兩個線索「柿樹多子壓枝」和「葡萄多實垂架」用的都是同一種畫面：果實結太多、太重，把樹枝「壓」彎、「垂」下來，不是有人動手去折它。如果猜成「很多小孩子攀折樹枝摘果子」，那跟後面「諸兒競走取之」（小朋友爭著跑去摘）就變成同一件事講兩次，不合理。所以「多子折枝」真正的意思是：李子結得太多，把樹枝都壓彎了。這正是王戎判斷「這一定是苦李子」的關鍵線索——如果李子好吃，早就被路過的人摘光了，不可能多到壓彎樹枝。',
    },
    {
      id: 'jing',
      char: '競',
      targetSentence: '諸兒競走取之，唯戎不動。',
      corpus: [
        { sentence: '運動會的時候，同學們在操場上競賽賽跑。', meaning: '比賽' },
        { sentence: '看到最後一顆糖果，兩個弟弟競相伸手去搶。', meaning: '爭著、搶著' },
        { sentence: '這是一場競爭激烈的比賽，大家都想拿第一名。', meaning: '爭取勝利' },
      ],
      correctIndex: 1,
      meaning: '爭著、搶著',
      explanation:
        '「競」其實常見有三種意思：比賽、爭著／搶著、爭取勝利。這裡的情境是大家看到李子同時衝過去摘，並沒有規則或名次，所以不是正式的「比賽」，用「爭著、搶著」來解釋最合理。「諸兒競走取之」就是「所有小朋友都爭先恐後地跑去摘李子」。',
    },
    {
      id: 'zou',
      char: '走',
      targetSentence: '諸兒競走取之。',
      corpus: [
        { sentence: '奶奶每天都走路去市場買菜。', meaning: '走路，慢慢移動' },
        { sentence: '看到老師發糖果，大家立刻走向前去。', meaning: '快步走向前（還不到用跑的）' },
        { sentence: '比賽一開始，小朋友立刻跑向終點。', meaning: '跑' },
      ],
      correctIndex: 2,
      meaning: '跑',
      explanation:
        '請先想像故事畫面：大家看到滿樹李子，是慢慢走過去，還是立刻衝過去？當然是立刻衝過去。第三句「小朋友立刻跑向終點」和這個畫面最像，第二句「走向前去」雖然也有動作，但還不到那種急切的程度。因此古文裡的「走」在這裡不是今天的「走路」，而是：跑。',
    },
    {
      id: 'zhi',
      char: '之',
      targetSentence: '諸兒競走取之。',
      corpus: [
        { sentence: '媽媽拿起桌上的蘋果，把它洗乾淨。', meaning: '它（代替前面提到的東西）' },
        { sentence: '這是我最喜歡的故事之一。', meaning: '的（之一＝其中一個）' },
        { sentence: '他知道之後，終於放心了。', meaning: '之後（表示時間先後的詞）' },
      ],
      correctIndex: 0,
      meaning: '它（代替前面提到的東西）',
      explanation:
        '請注意第一句：「它」代替的是前面說過的蘋果。目標句也是一樣，「取之」沒有再說一次「李子」，而是用「之」代替前面提到的李子。所以「之」在這裡就像現代中文的「它」。閱讀古文時，你會常看到「之」，很多時候，它只是幫作者避免一直重複同一個名詞。這篇文章裡「之」總共出現了三次，你可以比較看看每一次它代替的是誰。',
      occurrences: [
        { sentence: '諸兒競走取之。', note: '這裡的「之」指的是「李子」——大家爭著跑去摘的東西。' },
        { sentence: '人問之。', note: '這裡的「之」指的是「王戎」——有人問他為什麼不去摘。' },
        { sentence: '取之，信然。', note: '這裡的「之」又指回「李子」——摘下來一嚐，果然是苦的。' },
      ],
    },
    {
      id: 'wei',
      char: '唯',
      targetSentence: '唯戎不動。',
      corpus: [
        { sentence: '只有小美沒有舉手。', meaning: '只有' },
        { sentence: '唯有努力，才能成功。', meaning: '唯有（表示條件）' },
        { sentence: '唯美風格的插畫，看起來很夢幻。', meaning: '唯美（固定詞，形容一種風格）' },
      ],
      correctIndex: 0,
      meaning: '只有',
      explanation:
        '請先想像故事：所有小朋友都跑去摘李子，只有王戎站在原地。第一句也是一樣，大家都做了同一件事，只有一個人不同。第二句雖然也有「唯有」，但是是在表示條件。第三句則是「唯美」這個固定詞。因此第一句和目標句最接近。所以「唯」在這裡表示：只有。',
    },
    {
      id: 'yue',
      char: '曰',
      targetSentence: '人問之，答曰：「樹在道邊而多子，此必苦李。」',
      corpus: [
        { sentence: '老師問小明，小明回答：', meaning: '說、回答' },
        { sentence: '醫生說：', meaning: '說（單純講話，沒有先問後答的結構）' },
        { sentence: '媽媽昨天說過，今天會下雨。', meaning: '說（描述以前說過的事）' },
      ],
      correctIndex: 0,
      meaning: '說、回答',
      explanation:
        '注意整個句子的順序：先有人發問，接著，王戎開始回答。第一句也是完全一樣：先問，再回答。第二句只是一般說話，第三句則是在描述以前說過的事。因此第一句和目標句最接近。古文裡，「曰」很多時候就是：說、回答。',
    },
    {
      id: 'er',
      char: '而',
      targetSentence: '答曰：「樹在道邊而多子，此必苦李。」',
      corpus: [
        { sentence: '妹妹雖然很想睡覺，而她還是努力寫完功課。', meaning: '但是、卻' },
        { sentence: '春天到了，花開了，而且天氣也漸漸變暖和。', meaning: '而且（用來連接，不是對比）' },
        { sentence: '老師說的話，他卻聽而不聞，一點都沒放在心上。', meaning: '卻（聽而不聞＝聽了卻像沒聽到）' },
      ],
      correctIndex: 0,
      meaning: '但是、卻',
      explanation:
        '「而」其實常見有兩種主要意思：表示轉折的「但是、卻」、表示並列的「而且」。這裡「樹在道邊而多子」是在講一個不合常理的對比——長在路邊照理說很容易被摘光，「卻」還有這麼多果實，所以用「但是、卻」來解釋最合理，不是單純並列的「而且」。這正是王戎判斷「一定是苦李子」的關鍵線索！',
    },
    {
      id: 'xinran',
      char: '信然',
      targetSentence: '取之，信然。',
      corpus: [
        { sentence: '大家去看了一下，果然是真的。', meaning: '果然如此' },
        { sentence: '妹妹相信哥哥說的話。', meaning: '相信' },
        { sentence: '天氣忽然放晴，大家很開心。', meaning: '忽然（發音跟「信然」相近，但意思完全不同）' },
      ],
      correctIndex: 0,
      meaning: '果然如此',
      explanation:
        '故事最後，大家真的把李子摘下來嚐了嚐，發現真的是苦的，證明王戎猜對了。第一句也是：先做一件事，再發現真的跟原本猜的一樣。第二句是在說相信，第三句是在描述突然。因此第一句最接近。所以「信然」不是單純的「相信」，而是：果然如此——也就是原本的推論，最後被證明是真的。',
    },
  ],
};

export const guwenTexts: GuwenText[] = [wangRongText];

export function findGuwenText(id: string): GuwenText | undefined {
  return guwenTexts.find((t) => t.id === id);
}
