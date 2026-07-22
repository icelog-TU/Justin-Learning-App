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

/** One古文字 to decode: a classical-only usage the child must derive by comparing corpus sentences. */
export interface GuwenWord {
  id: string;
  /** May be more than one character (e.g. "信然" is decoded as a single two-character unit). */
  char: string;
  /** The sentence from the classical text this word is introduced in (shown during its puzzle). */
  targetSentence: string;
  corpus: GuwenCorpusOption[];
  correctIndex: number;
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
        { sentence: '妹妹最愛嘗美食，每一道菜都想吃一口。', meaning: '品嘗、嚐味道' },
        { sentence: '李白嘗遊長安，寫下許多有名的詩句。', meaning: '曾經' },
        { sentence: '弟弟嘗試自己綁鞋帶，雖然失敗了好幾次。', meaning: '嘗試、試著做' },
      ],
      correctIndex: 1,
      meaning: '曾經',
      explanation:
        '「嘗」其實常見有三種意思：品嚐味道、曾經、嘗試（努力去做）。這裡「嘗」是用來修飾「與諸小兒遊」這整件事，表示這件事發生在過去，所以用「曾經」來解釋最合理，這樣才符合邏輯——不是在嚐味道，也不是在嘗試做什麼。「嘗與諸小兒遊」就是「曾經和很多小朋友一起玩」。',
    },
    {
      id: 'yu',
      char: '與',
      targetSentence: '王戎七歲，嘗與諸小兒遊。',
      corpus: [
        { sentence: '姐姐與弟弟一起去公園玩溜滑梯。', meaning: '跟、和' },
        { sentence: '老師給與每位同學一張獎狀。', meaning: '給、給予' },
        { sentence: '這次的大隊接力，他決定報名參與。', meaning: '參加、加入' },
      ],
      correctIndex: 0,
      meaning: '跟、和',
      explanation:
        '「與」其實常見有三種意思：跟／和、給／給予、參加／加入。這裡「與」後面接著「諸小兒」，是在說跟誰一起做某件事，所以用「跟、和」來解釋最合理——不是「給誰東西」，也不是在講「參加」什麼活動。「嘗與諸小兒遊」就是「曾經跟很多小朋友一起玩」。',
    },
    {
      id: 'zhu',
      char: '諸',
      targetSentence: '王戎七歲，嘗與諸小兒遊。',
      corpus: [
        { sentence: '開會的時候，諸位老師都發表了意見。', meaning: '各位、眾多的' },
        { sentence: '水果店裡有蘋果、香蕉、橘子諸如此類的水果。', meaning: '各種、許多（諸如＝像這一類）' },
        { sentence: '弟弟做決定前，諸事都要先問過媽媽。', meaning: '所有的、一切的' },
      ],
      correctIndex: 0,
      meaning: '眾多的、各個',
      explanation:
        '「諸」其實常見有幾種意思：眾多的／各個（諸位）、各種／許多（諸如）、所有的／一切的（諸事）。這裡「諸」後面接著「小兒」這個具體的一群人，所以用「眾多的、各個」來解釋最合理——是在形容一群小朋友，不是在講一堆不同種類的東西，也不是在講抽象的「所有事情」。「諸小兒」就是「一群小朋友」，「諸兒」就是「所有的小朋友」。',
    },
    {
      id: 'you',
      char: '遊',
      targetSentence: '王戎七歲，嘗與諸小兒遊。',
      corpus: [
        { sentence: '暑假的時候，爸爸媽媽帶我去日本旅遊。', meaning: '旅遊、觀光' },
        { sentence: '放學後，他常常和同學到附近的公園遊玩。', meaning: '玩耍' },
        { sentence: '這條魚在水裡自由自在地遊來遊去。', meaning: '游動、游泳' },
      ],
      correctIndex: 1,
      meaning: '玩耍',
      explanation:
        '「遊」其實常見有三種意思：旅遊／觀光、玩耍、游動／游泳。這裡的主角是七歲的王戎和一群小朋友，不太可能是去做正式、長途的「旅遊」，也不是在水裡「游泳」，所以用「玩耍」來解釋最合理。「嘗與諸小兒遊」就是「曾經和很多小朋友一起玩耍」。',
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
      targetSentence: '諸兒競走取之，唯戎不動。',
      corpus: [
        { sentence: '爺爺每天出門散步，慢慢地走在公園裡。', meaning: '走路，慢慢移動' },
        { sentence: '動物園裡有各種飛禽走獸，走獸指的是用四隻腳奔跑的動物。', meaning: '跑' },
        { sentence: '小偷做壞事被發現，嚇得拔腿就跑走了。', meaning: '離開' },
      ],
      correctIndex: 1,
      meaning: '跑',
      explanation:
        '「走」其實常見有三種意思：走路（慢慢移動）、跑、離開。這裡是說一群小孩子看到滿樹的李子，爭先恐後地衝過去摘，這個畫面應該是用跑的，而不是慢慢走過去，也不是要「離開」，所以用「跑」來解釋最合理，跟現在說的「用走的」不一樣！「飛禽走獸」的「走獸」就保留了這個古代的意思。所以「諸兒競走取之」是說所有小朋友都用跑的去搶李子。',
    },
    {
      id: 'zhi',
      char: '之',
      targetSentence: '諸兒競走取之，唯戎不動。',
      corpus: [
        { sentence: '這是他最喜歡的水果之一，他每次都吃好多。', meaning: '的（之一＝其中一個）' },
        { sentence: '面對別人的嘲笑，他總是一笑置之，不放在心上。', meaning: '它、這件事' },
        { sentence: '兩支球隊實力相當，勝負難分之際，忽然下起大雨。', meaning: '的' },
      ],
      correctIndex: 1,
      meaning: '它、他（代替前面提到的人事物）',
      explanation:
        '「之」最常見的用法是當代名詞，代替前面講過的人事物，不用再說一次名字（也可以當「的」用，像「之一」）。這裡的「之」出現在「取之」這個動作後面，取的對象應該是前面提到的「李子」，所以用「它（代替李子）」來解釋最合理，不是「的」的意思。就像「一笑置之」的「之」指的是被嘲笑這件事一樣。這篇文章裡「之」總共出現了三次，你可以比較看看每一次它代替的是誰。',
      occurrences: [
        { sentence: '諸兒競走取之，唯戎不動。', note: '這裡的「之」指的是「李子」——大家爭著跑去摘的東西。' },
        {
          sentence: '人問之，答曰：「樹在道邊而多子，此必苦李。」',
          note: '這裡的「之」指的是「王戎」——有人問他為什麼不去摘。',
        },
        { sentence: '取之，信然。', note: '這裡的「之」又指回「李子」——摘下來一嚐，果然是苦的。' },
      ],
    },
    {
      id: 'wei',
      char: '唯',
      targetSentence: '諸兒競走取之，唯戎不動。',
      corpus: [
        { sentence: '全班都及格了，唯獨小華一個人沒通過測驗。', meaning: '只有' },
        { sentence: '這是唯一的機會，不能再錯過了。', meaning: '只有一個、獨一無二' },
        { sentence: '弟弟做事總是唯命是從，媽媽說什麼就做什麼。', meaning: '只、完全聽從' },
      ],
      correctIndex: 0,
      meaning: '只有',
      explanation:
        '「唯」其實常見有幾種意思：只有、只有一個／獨一無二（唯一）、只／完全聽從（唯命是從）。這裡「唯」後面接著「戎不動」，是在講一群人裡面只有王戎一個人沒有動，所以用「只有」來解釋最合理。「唯戎不動」就是「只有王戎沒有動」，其他小朋友都跑去搶李子了。',
    },
    {
      id: 'yue',
      char: '曰',
      targetSentence: '人問之，答曰：「樹在道邊而多子，此必苦李。」',
      corpus: [
        { sentence: '課本上寫著：「子曰：『學而時習之』」，這是很有名的孔子說過的話。', meaning: '說' },
        { sentence: '這道菜店家取了個好聽的名字，美其名曰「黃金炒飯」，其實就是蛋炒飯。', meaning: '稱作、叫做' },
        { sentence: '老師介紹接下來要念的詩句時，常常會用「詩曰」兩個字開頭。', meaning: '說（用來引出說的內容）' },
      ],
      correctIndex: 0,
      meaning: '說',
      explanation:
        '「曰」其實常見有兩種意思：說（像「子曰」）、稱作／叫做（像「美其名曰」）。這裡「答曰」後面直接接著王戎說的完整內容，所以用「說」來解釋最合理，不是「稱作、叫做」這種替東西取名字的用法。「答曰」就是「回答說」。',
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
        { sentence: '媽媽收到朋友寄來的一封信，很開心地拆開來看。', meaning: '書信' },
        { sentence: '妹妹每次答應的事都會做到，是個很守信用的人。', meaning: '誠信、值得信任' },
        { sentence: '別人說巷口那家水果攤的芒果很甜，買回來一吃，信然，真的非常香甜。', meaning: '果然如此、確實這樣' },
      ],
      correctIndex: 2,
      meaning: '果然如此',
      explanation:
        '「信」其實常見有幾種意思：書信（名詞）、誠信／值得信任、果然／確實（信然）。這裡「取之，信然」是在講把李子摘下來一嚐，結果證實了王戎猜的沒錯，所以用「果然如此」來解釋最合理，不是在講書信，也不是在講一個人講不講信用！',
    },
  ],
};

export const guwenTexts: GuwenText[] = [wangRongText];

export function findGuwenText(id: string): GuwenText | undefined {
  return guwenTexts.find((t) => t.id === id);
}
