import type { GuwenLesson } from './guwenLesson';

export const approvedKeZhouQiuJianLesson: GuwenLesson = {
  id: 'ke-zhou-qiu-jian',
  contentRevision: '2026-07-29-approved-20',
  title: '刻舟求劍',
  source: '《呂氏春秋・察今》',
  introHeadline: '古文破譯家，可以請你幫個忙嗎？',
  introSpokenLine:
    '我找到一篇楚國人的故事。他遇到麻煩後，在船上做了一件事；可是船繼續往前，這個做法究竟能不能幫他，我還拿不準。\n\n我找到幾條可以比對的古文線索，想請你和我一起把事情經過讀回來。',
  splitIntroSpeechParagraphs: true,
  acceptMissionLabel: '接受破譯任務',
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
  preserveAuthoredOptionOrder: true,
  splitFeedbackParagraphs: true,
  completeCorrectFeedbackAsCore: true,
  steps: [
    {
      id: 'she_jiang',
      type: 'evidence',
      prerequisiteIds: [],
      targetSentence: '楚人有【涉江】者',
      intro: '【涉江】發生了什麼，我還拿不準。我找到兩條線索，想請古文破譯家幫我比一比。',
      clues: [
        {
          text: '送子涉淇，至于頓丘。',
          highlight: '涉淇',
          unlockedMeaning: '（淇是一條河。）那時，我一路送你【涉淇】，一直走到了頓丘。',
          source: '真實古文線索；《詩經・衛風・氓》。',
        },
        {
          text: '惟涉河以民遷。',
          highlight: '涉河',
          unlockedMeaning: '國王準備帶領人民【涉河】，搬到新的地方。',
          source: '真實古文線索；《尚書・盤庚中》節錄。',
        },
      ],
      question: '比較兩段路線，【涉】最可能是哪一種移動？',
      options: ['停在河邊等待', '渡過河流，到達另一邊', '沿河岸往前走'],
      correctIndex: 1,
      correctFeedback: '【涉江】的密碼鑰匙到手！【涉江】表示渡過一條河；目前仍不知道這位楚國人用什麼方式渡河。',
      retryHint: '「停在河邊」無法解釋人物後來到達頓丘或新的住處。哪個解法能完成兩段移動？',
      explanation:
        '第一條線索中的人物【涉淇】後到了頓丘；第二條線索中的人們【涉河】後搬到新的地方。兩段路線都穿過河流，到達另一處。「停在河邊」沒有完成移動；「沿河岸前進」也沒有通過河流。',
      keyAwarded: {
        code: '涉江',
        decodedEvidence: '渡過一條河',
      },
    },
    {
      id: 'chu_ren_you_she_jiang_zhe',
      type: 'reconstruction',
      prerequisiteIds: ['she_jiang'],
      targetSentence: '楚人有涉江者',
      intro: '下面是我們已經取得的密碼鑰匙。',
      keys: [
        {
          code: '楚人',
          decodedEvidence: '楚國人',
        },
        {
          code: '涉江',
          decodedEvidence: '渡過一條河',
        },
      ],
      question: '「楚人有涉江者」最符合下面哪一個選項？',
      options: ['有一位楚國人正在渡河', '有一位楚國人站在河邊目送別人渡河', '有一位楚國人下水尋找遺失的東西'],
      correctIndex: 0,
      correctFeedback: '「楚人有涉江者」重建成功，表示有一位楚國人正在渡河。',
      retryHint: '【涉江】是渡過河流。原文現在寫的是誰正在渡河？有沒有寫他下水找東西？',
      explanation:
        '「楚人」指出人物來自楚國；「涉江」表示渡河。第二個選項加入「目送別人」，第三個選項提前加入後文才出現的尋找動作，都不是本句明寫的內容。',
      finalDraftLine: '有一位楚國人正在渡河。',
    },
    {
      id: 'qi_jian',
      type: 'evidence',
      prerequisiteIds: ['chu_ren_you_she_jiang_zhe'],
      targetSentence: '【其】劍自舟中墜於水',
      intro: '【其劍】的【其】指向誰，我還拿不準。我找到兩條線索，想請古文破譯家幫我比一比。',
      clues: [
        {
          text: '楊布換黑衣而歸，其狗不知而吠之。',
          highlight: '其',
          unlockedMeaning: '楊布換穿黑衣回家，【其】狗沒有認出自己的主人，就向他叫。',
          source:
            '混種古文線索（真實語料骨架＋AI 情境）；真實骨架「其狗不知而吠之」出自《韓非子・說林下》，AI 補寫楊布換衣回家的簡短前情。',
        },
        {
          text: '楚人賣盾與矛，又譽其矛曰：「吾矛之利，於物無不陷也。」',
          highlight: '其',
          unlockedMeaning: '有個楚國人在賣盾和矛。他又誇獎【其】矛，說：「我的矛非常鋒利，什麼東西都能刺穿。」',
          source:
            '混種古文線索（真實語料骨架＋AI 情境）；真實骨架「楚人有鬻楯與矛者……又譽其矛曰：『吾矛之利，於物無不陷也。』」出自《韓非子・難一》，AI 精簡販賣情境。',
        },
      ],
      question: '比較兩句中的【其】，它最可能有什麼作用？',
      options: ['【其】都指前面提到的人', '【其】都指後面才會出現的人', '【其】都指所有人'],
      correctIndex: 0,
      correctFeedback:
        '【其】的密碼鑰匙到手！【其】指前面提到的人；【其＋名詞】可以讀成「他的、她的、它的……」，具體指誰仍要回到前文判斷。',
      retryHint: '先看看兩句在【其】前面各自提到了誰，再比一比【其】是不是指回前面的人。',
      explanation:
        '第一條線索先提楊布，【其狗】指楊布的狗；第二條先提賣盾與矛的楚國人，【其矛】又被他稱為「吾矛」。兩句中的【其】都指回前面的人，不是後面才出現的人，也不是所有人。',
      keyAwarded: {
        code: '其',
        decodedEvidence: '【其】指前面提到的人',
      },
    },
    {
      id: 'zhui',
      type: 'evidence',
      prerequisiteIds: ['qi_jian'],
      targetSentence: '其劍自舟中【墜】於水',
      intro: '【墜】的移動方向，我還拿不準。我找到兩條線索，想請古文破譯家幫我比一比。',
      clues: [
        {
          text: '椀自手中墜地。',
          highlight: '墜',
          unlockedMeaning: '碗原本在手中，後來從手中【墜】到地面。',
          source: '真實古文線索；《太平廣記・鄭延濟》引《中朝故事》。',
        },
        {
          text: '手中算囊遂墜於水。',
          highlight: '墜',
          unlockedMeaning: '他坐船時，算袋原本在手中，後來【墜】到水裡。（算袋是裝計算工具的小袋子。）',
          source: '真實古文線索；《酉陽雜俎・事感》節錄。',
        },
      ],
      question: '比較兩樣物品的位置變化，【墜】最可能表示哪一種移動？',
      options: ['【墜】表示留在原來的位置', '【墜】表示從原來的位置往下掉', '【墜】表示從下面往上回到原來的位置'],
      correctIndex: 1,
      correctFeedback: '【墜】的密碼鑰匙到手！【墜】表示從原來的位置往下掉。',
      retryHint: '兩樣東西原本都在手裡，後來一個到地面、一個到水裡；它們的位置比手裡高，還是低？',
      explanation:
        '碗和算袋原本都在手中，【墜】之後分別到了下面的地面與水裡。兩條線索共同顯示從原處往下移動；「留在原處」沒有位置變化，「從下面往上」則把方向說反了。',
      keyAwarded: {
        code: '墜',
        decodedEvidence: '從原來的位置往下掉',
      },
    },
    {
      id: 'reveal_qi_jian_zhui',
      type: 'reconstruction',
      prerequisiteIds: ['zhui'],
      targetSentence: '其劍自舟中墜於水',
      intro: '下面是我們已經取得的密碼鑰匙。',
      keys: [
        {
          code: '其劍',
          decodedEvidence: '前面那位楚國人的劍',
        },
        {
          code: '自舟中',
          decodedEvidence: '從船裡',
        },
        {
          code: '墜',
          decodedEvidence: '從原來的位置往下掉',
        },
        {
          code: '於水',
          decodedEvidence: '到水裡',
        },
      ],
      question: '「其劍自舟中墜於水」最符合下面哪一個選項？',
      options: ['那位楚國人的劍從船裡掉進水中', '那位楚國人從船裡跳進水中尋找劍', '整艘船和那位楚國人的劍一起沉進水中'],
      correctIndex: 0,
      correctFeedback: '「其劍自舟中墜於水」重建成功，表示前面那位楚國人的劍從船裡往下掉進水中。',
      retryHint: '原文先寫「其劍」，又寫它從船裡到了水裡；掉進水裡的是劍、楚國人，還是整艘船？',
      explanation:
        '「其劍」指出移動者，「自舟中」指出起點，「墜」指出向下移動，「於水」指出終點。第二個選項把移動者換成楚國人，還提前加入尋找；第三個選項則把劍掉進水中改成整艘船沉沒。',
      finalDraftLine: '有一位楚國人正在渡河。他的劍從船裡掉進水中。',
    },
    {
      id: 'ju',
      type: 'evidence',
      prerequisiteIds: ['reveal_qi_jian_zhui'],
      targetSentence: '【遽】契其舟曰',
      intro: '【遽】讓後面的動作怎麼發生，我還拿不準。我找到兩條線索，想請古文破譯家幫我比一比。',
      clues: [
        {
          text: '上忽發火。子猷遽走避，不惶取屐；子敬神色恬然，徐喚左右，扶憑而出。',
          highlight: '遽',
          unlockedMeaning: '樓上忽然失火。子猷【遽】跑出去躲避，連鞋也來不及拿；子敬仍然很安定，慢慢叫人扶他出去。',
          source: '真實古文線索；《世說新語・雅量》節錄。',
        },
        {
          text: '崔驚懼遽走。道士緩步庭中。',
          highlight: '遽',
          unlockedMeaning: '崔生忽然看見一位陌生道士，驚嚇地【遽】跑走；道士卻慢慢走進庭院。',
          source: '真實古文線索；段成式《酉陽雜俎續集・支諾皋上》節錄。',
        },
      ],
      question: '比較兩條線索，【遽】最可能表示什麼？',
      options: [
        '【遽】表示先停一會兒，再慢慢做後面的動作',
        '【遽】表示立刻、急忙地做後面的動作',
        '【遽】表示不再做後面的動作',
      ],
      correctIndex: 1,
      correctFeedback: '【遽】的密碼鑰匙到手！【遽】表示立刻、急忙地做後面的動作。',
      retryHint: '子猷和子敬、崔生和道士的動作速度不同；哪一邊的動作比較快？',
      explanation:
        '子猷【遽】跑走，和慢慢出去的子敬形成對照；崔生【遽】跑走，也和緩步走進庭院的道士形成對照。【遽】的一方動作較快，不是停下後慢慢行動，也不是不再行動。',
      keyAwarded: {
        code: '遽',
        decodedEvidence: '立刻、急忙地做後面的動作',
      },
    },
    {
      id: 'qi_qi_zhou',
      type: 'evidence',
      prerequisiteIds: ['ju'],
      targetSentence: '遽【契】其舟曰',
      intro: '【契】在句中做了什麼，我還拿不準。我找到兩條線索，想請古文破譯家幫我比一比。',
      clues: [
        {
          text: '越人契臂，臂上留痕。',
          highlight: '契',
          unlockedMeaning: '越地人【契】自己的手臂，手臂於是留下疤痕。',
          source:
            '混種古文線索（真實語料骨架＋AI 情境）；真實骨架「越人契臂」出自《淮南子・齊俗訓》，AI 補寫「臂上留痕」。',
        },
        {
          text: '古人契龜甲，甲上留裂痕。',
          highlight: '契',
          unlockedMeaning: '古人【契】龜甲，龜甲上留下裂痕。',
          source:
            '混種古文線索（真實語料骨架＋AI 情境）；真實骨架「爰契我龜」出自《詩經・大雅・緜》，教材改寫為一般人物並由 AI 補寫「甲上留裂痕」。',
        },
      ],
      question: '比較兩個動作結果，【契】最可能表示什麼？',
      options: [
        '【契】表示擦掉物體表面的痕跡',
        '【契】表示把物體搬到另一個地方',
        '【契】表示在物體表面刻畫，留下看得見的痕跡',
      ],
      correctIndex: 2,
      correctFeedback:
        '【契】的密碼鑰匙到手！【契＋物體】表示在物體表面刻畫，使表面留下看得見的痕跡；「契」表示刻畫時，念作氣（ㄑㄧˋ）。',
      retryHint: '【契】之後，手臂留下疤痕，龜甲留下裂痕；哪個動作會造成這兩種變化？',
      explanation:
        '兩條線索都顯示【契】作用在物體表面，完成後留下可見痕跡。「擦掉痕跡」和結果相反；「搬到另一處」只能改變位置，不能解釋表面為何出現變化。',
      keyAwarded: {
        code: '契其舟',
        decodedEvidence: '在他乘坐的船上刻畫，使船身留下痕跡',
      },
    },
    {
      id: 'reveal_ju_qi_qi_zhou',
      type: 'reconstruction',
      prerequisiteIds: ['qi_qi_zhou'],
      targetSentence: '遽契其舟曰',
      intro: '下面是我們已經取得的密碼鑰匙。',
      keys: [
        {
          code: '遽',
          decodedEvidence: '立刻、急忙地做後面的動作',
        },
        {
          code: '契其舟',
          decodedEvidence: '在他乘坐的船上刻畫，使船身留下痕跡',
        },
        {
          code: '曰',
          decodedEvidence: '說',
        },
      ],
      question: '「遽契其舟曰」最符合下面哪一個選項？',
      options: [
        '他先說這裡是劍掉下去的地方，再慢慢在船上刻下記號',
        '他立刻跳進水裡，在掉落的劍上刻下記號',
        '他立刻在自己乘坐的船上刻下記號，接著說話',
      ],
      correctIndex: 2,
      correctFeedback: '「遽契其舟曰」重建成功，表示楚國人立刻在自己乘坐的船上刻下記號，接著說話。',
      retryHint: '依「遽／契其舟／曰」核對：誰在做、刻在哪裡、先刻還是先說？',
      explanation:
        '第三個選項保留楚國人、船身與先刻後說的順序。第一個選項顛倒順序，還把【遽】改成慢慢；第二個選項把刻畫位置換成水中的劍，又提前加入入水動作。',
      finalDraftLine: '有一位楚國人正在渡河。他的劍從船裡掉進水中。楚國人立刻在自己乘坐的船上刻下記號，接著說……',
    },
    {
      id: 'shi',
      type: 'evidence',
      prerequisiteIds: ['reveal_ju_qi_qi_zhou'],
      targetSentence: '「【是】吾劍之所從墜。」',
      intro: '句首的【是】指什麼，我還拿不準。我找到兩條線索，想請古文破譯家幫我比一比。',
      clues: [
        {
          text: '是鳥也，海運則將徙於南冥。',
          highlight: '是',
          unlockedMeaning: '（前文正在說一隻名叫鵬的大鳥。）【是】鳥遇到海上大風時，就要遷往南方的大海。',
          source: '真實古文線索；《莊子・逍遙遊》節錄。',
        },
        {
          text: '是日也，天朗氣清，惠風和暢。',
          highlight: '是',
          unlockedMeaning: '（前文剛寫大家在暮春的一天到蘭亭聚會。）【是】日天空晴朗，空氣清新，微風和暖。',
          source: '真實古文線索；王羲之〈蘭亭集序〉。',
        },
      ],
      question: '比較兩句中的【是】，它最可能指什麼？',
      options: [
        '【是】都指所有同類的人、事物或時間',
        '【是】都指眼前或前面剛提到的這一個',
        '【是】都指後面才會出現的另一個',
      ],
      correctIndex: 1,
      correctFeedback:
        '【是】的密碼鑰匙到手！【是】會把話接回眼前或前文剛提到的這一個；放回本篇，它指船上剛刻下記號的地方。',
      retryHint: '一條先介紹鵬鳥，一條先寫蘭亭聚會的那一天；後面的【是】接回了哪兩個已出現的對象？',
      explanation:
        '【是】鳥接回前文的鵬鳥，【是】日接回蘭亭聚會的那一天。兩句都不是泛指所有同類，也不是指向後面才會出現的另一個。本篇中，【是】結合前一句的刻船畫面，指楚國人剛刻記號的地方。',
      keyAwarded: {
        code: '是',
        decodedEvidence: '船上剛刻下記號的這個地方',
      },
    },
    {
      id: 'wu',
      type: 'evidence',
      prerequisiteIds: ['shi'],
      targetSentence: '「是【吾劍】之所從墜。」',
      intro: '【吾】把這把劍連到誰，我還拿不準。我找到兩條線索，想請古文破譯家幫我比一比。',
      clues: [
        {
          text: '吾十有五而志于學。',
          highlight: '吾',
          unlockedMeaning: '（孔子正在回想自己的人生。）孔子說：【吾】十五歲時立志學習。',
          source: '真實古文線索；《論語・為政》。',
        },
        {
          text: '吾楯之堅，物莫能陷也。',
          highlight: '吾',
          unlockedMeaning: '（說話的人正在販賣盾牌。）賣武器的人誇口說：【吾】盾牌非常堅固，沒有東西能刺穿它。',
          source: '真實古文線索；《韓非子・難一》。',
        },
      ],
      question: '比較兩句中的【吾】，它們都指誰？',
      options: ['【吾】都指說話的人自己', '【吾】都指聽他說話的人', '【吾】都指所有人'],
      correctIndex: 0,
      correctFeedback:
        '【吾】的密碼鑰匙到手！【吾】指正在說話的人自己，放回本篇，【吾劍】就是楚國人自己的劍；線索中的「有」放在「十有五」時，念作又（ㄧㄡˋ）。',
      retryHint: '兩句都是有人開口說話；【吾】指說話的人自己、聽他說話的人，還是所有人？',
      explanation:
        '孔子用【吾】說自己的經歷；賣武器的人用【吾】說自己的盾牌。兩句中的【吾】都指正在說話的人，不是聽話者，也不是所有人。本篇說話者是剛刻船的楚國人，所以【吾劍】是他自己的劍。',
      keyAwarded: {
        code: '吾劍',
        decodedEvidence: '楚國人自己的劍',
      },
    },
    {
      id: 'suo_cong_zhui',
      type: 'evidence',
      prerequisiteIds: ['wu'],
      targetSentence: '「是吾劍之【所從墜】。」',
      intro: '【所從墜】追查的是什麼，我還拿不準。我找到兩條【所從來】的線索，想請古文破譯家幫我比一比。',
      clues: [
        {
          text: '見漁人，乃大驚，問所從來，具答之。',
          highlight: '所從來',
          unlockedMeaning:
            '（桃花源裡的村民第一次看見外來的漁人。）村民看見漁人，非常驚訝，便問他【所從來】；漁人把自己走過的路一一告訴他們。',
          source: '真實古文線索；陶淵明〈桃花源記〉。',
        },
        {
          text: '客至，主人問所從來。客曰：「自東村來。」',
          highlight: '所從來',
          unlockedMeaning: '客人來了，主人問他【所從來】。客人回答：「我是從東村來的。」',
          source:
            '混種古文線索（真實語料骨架＋AI 情境）；真實骨架「問所從來……具以實告」出自《仙遊記》，AI 將人物精簡為主人與客人，並補寫「自東村來」的直接回答，使出發地清楚可見。',
        },
      ],
      question: '比較兩句中的【所從來】，再把【來】換成【墜】；【所從墜】最可能表示什麼？',
      options: ['【所從墜】表示從哪個地方掉下去', '【所從墜】表示掉下去後到了哪裡', '【所從墜】表示是誰讓它掉下去'],
      correctIndex: 0,
      correctFeedback:
        '【所從墜】的密碼鑰匙到手！【所從墜】表示從哪個地方掉下去；放回本篇，就是劍從船上的哪個地方掉下去。',
      retryHint: '客人用「自東村來」回答【所從來】，說出的是來以前所在的地方；把【來】換成【墜】再想一次。',
      explanation:
        '兩條【所從來】線索都追查人物來以前所在的地方。把最後的動作換成【墜】，相同結構便追查掉落以前的位置。【所從墜】不是掉落後到達哪裡，也不是誰造成掉落。',
      keyAwarded: {
        code: '所從墜',
        decodedEvidence: '劍從哪個地方掉下去',
      },
    },
    {
      id: 'reveal_shi_wu_suo_cong_zhui',
      type: 'reconstruction',
      prerequisiteIds: ['suo_cong_zhui'],
      targetSentence: '「是吾劍之所從墜。」',
      intro: '下面是我們已經取得的密碼鑰匙。',
      keys: [
        {
          code: '是',
          decodedEvidence: '船上剛刻下記號的這個地方',
        },
        {
          code: '吾劍',
          decodedEvidence: '楚國人自己的劍',
        },
        {
          code: '所從墜',
          decodedEvidence: '劍從哪個地方掉下去',
        },
      ],
      question: '「是吾劍之所從墜」最符合下面哪一個選項？',
      options: [
        '「這裡是我剛才從水裡撿到劍的地方。」',
        '「這把劍會跟著船上的記號一起移動。」',
        '「這裡是我的劍掉下去的地方。」',
      ],
      correctIndex: 2,
      correctFeedback: '「是吾劍之所從墜」重建成功，表示「這裡是我的劍掉下去的地方」。',
      retryHint: '【是】指剛刻記號的地方，【吾劍】是楚國人自己的劍，【所從墜】說劍從哪裡掉下去；哪個選項保留三把鑰匙？',
      explanation:
        '第三個選項依序保留「這裡／我的劍／掉下去的地方」。第一個選項把掉落改成從水裡撿起；第二個選項加入劍會跟著記號移動，都不是這句明寫的內容。',
      finalDraftLine:
        '有一位楚國人正在渡河。他的劍從船裡掉進水中。楚國人立刻在自己乘坐的船上刻下記號，說：「這裡是我的劍掉下去的地方。」',
    },
    {
      id: 'ru_shui_qiu_zhi',
      type: 'evidence',
      prerequisiteIds: ['reveal_shi_wu_suo_cong_zhui'],
      targetSentence: '舟止，從其所契者【入水求之】',
      intro: '船停下後，楚人做出【入水求之】這串動作。我找到兩條線索，想請古文破譯家幫我比一比。',
      clues: [
        {
          text: '方士徐市等入海求神藥。',
          highlight: '入海求神藥',
          unlockedMeaning: '方士徐市等人【入海求神藥】：海是他們進入的地方，神藥是他們尋找的東西。',
          source: '真實古文線索；《史記・秦始皇本紀》節錄。',
        },
        {
          text: '與數人入林求木。',
          highlight: '入林求木',
          unlockedMeaning: '他和幾個人【入林求木】：樹林是他們進入的地方，木材是他們尋找的東西。',
          source: '真實古文線索；《太平廣記・楊溥》引《紀聞》節錄。',
        },
      ],
      question: '比較兩串動作的順序，【入水求之】最可能是哪一幅畫面？',
      options: ['楚人進入水中，尋找那把劍', '楚人離開水面，回到船上尋找那把劍', '楚人把劍放進水中，自己留在船上'],
      correctIndex: 0,
      correctFeedback:
        '【入水求之】表示先進入水中，再尋找前面提到的劍；放回原文，「舟止，從其所契者入水求之」表示船停下來後，楚人從自己刻記號的地方進入水中找劍。線索中的「數人」是幾個人，「數」念作樹（ㄕㄨˋ）。',
      retryHint: '兩條線索都是人先進入一個地方，接著尋找一樣東西；把地點與尋找的東西換回本篇再試一次。',
      explanation:
        '「入海求神藥」是進入海中後尋找神藥；「入林求木」是進入樹林後尋找木材。「入水求之」沿用相同順序；「之」喚回前文代詞鑰匙，指掉進水裡的劍。其他選項顛倒進出方向，或把進入水中的人換成劍。',
      keyAwarded: {
        code: '入水求之',
        decodedEvidence: '先進入水中，再尋找前面提到的劍',
      },
      finalDraftLine: '船停下來後，楚人從自己刻記號的地方進入水中，尋找那把劍。',
    },
    {
      id: 'yi',
      type: 'evidence',
      prerequisiteIds: ['ru_shui_qiu_zhi'],
      targetSentence: '舟已行【矣】，而劍不行',
      intro: '【矣】在提醒讀者什麼，我還拿不準。我找到兩條線索，想請古文破譯家幫我比一比。',
      clues: [
        {
          text: '臣之壯也，猶不如人；今老矣，無能為也已。',
          highlight: '矣',
          unlockedMeaning: '我年輕力壯時，尚且比不上別人；如今老【矣】，已經沒辦法做什麼了。',
          source: '真實古文線索；《左傳・僖公三十年》節錄。',
        },
        {
          text: '至飯前，所掛之肉骨已盡矣。',
          highlight: '矣',
          unlockedMeaning: '到吃午飯以前，肉攤掛著的肉和骨頭全都賣完【矣】。',
          source: '真實古文線索；吳自牧《夢粱錄・卷十六》節錄。',
        },
      ],
      question: '兩條線索中的【矣】，都在提醒讀者什麼？',
      options: ['前面的情況還沒有發生', '前面的情況已經出現，現在是這樣了', '說話的人正在提出問題'],
      correctIndex: 1,
      correctFeedback:
        '【矣】的密碼鑰匙到手！【矣】提醒讀者前面的情況已經出現；放回原文，「舟已行矣，而劍不行」表示船已經往前移動，可是劍沒有移動。',
      retryHint: '「今老矣」和「肉骨已盡矣」說的是還沒發生，還是已經出現的情況？',
      explanation:
        '「今老矣」表示年老的情況已經出現；「肉骨已盡矣」表示肉和骨頭已經賣完。兩句都不是尚未發生，也不是提出問題。本篇中，【行】表示往前移動，【而】連接不同情況，因此船與劍的位置變化不同。',
      keyAwarded: {
        code: '矣',
        decodedEvidence: '【矣】提醒讀者前面的情況已經出現，現在是這樣了',
      },
      finalDraftLine: '船已經往前移動，可是劍沒有移動。',
    },
    {
      id: 'ruo_ci',
      type: 'evidence',
      prerequisiteIds: ['yi'],
      targetSentence: '求劍【若此】，不亦惑乎？',
      intro: '【若此】指回什麼，我還拿不準。我找到兩條線索，想請古文破譯家幫我比一比。',
      clues: [
        {
          text: '張文節為相，受俸不少；食惟粗飯，衣仍舊袍，而自奉若此，親友皆驚。',
          highlight: '若此',
          unlockedMeaning: '張文節做了大官，收入不少；他卻只吃簡單的飯、穿舊袍，把生活過得【若此】，親友都很驚訝。',
          source:
            '混種古文線索（真實語料骨架＋AI 情境）；真實骨架「公今受俸不少，而自奉若此」出自司馬光〈訓儉示康〉，AI 補寫飲食、衣物與親友反應。',
        },
        {
          text: '工匠製作甚勞，主人卻飾車以彩，飾舟以花；為舟車若此，眾皆嘆之。',
          highlight: '若此',
          unlockedMeaning:
            '工匠製作車船已經很辛苦，主人卻又命令工匠在車上畫滿彩紋、在船上刻滿花紋；他把車船布置得【若此】，旁人都感嘆太誇張了。',
          source:
            '混種古文線索（真實語料骨架＋AI 情境）；真實骨架「飾車以文采，飾舟以刻鏤……人君為舟車若此」出自《墨子・辭過》，AI 精簡背景並補寫旁人反應。',
        },
      ],
      question: '兩條線索中的【若此】，最接近哪一種感嘆？',
      options: ['事情還沒發生，以後也許會變成這樣', '竟然到了前面所說的這種程度', '結果和前面所說的情況完全相反'],
      correctIndex: 1,
      correctFeedback:
        '【若此】的密碼鑰匙到手！【若此】把前面描述的整個情況收起來，表示到了這種程度；在這兩條線索中帶有「竟然這樣」的感嘆。線索中的「衣」表示穿著時，念作意（ㄧˋ）。',
      retryHint: '兩句都先寫出讓旁人驚訝或感嘆的情況，再用【若此】指回它；這是在說尚未發生，還是已到這種程度？',
      explanation:
        '「自奉若此」指回張文節簡樸生活的整體情況；「為舟車若此」指回費力裝飾車船的整體情況。兩句都配合反差與旁人反應，讀出「竟然到了這種程度」的感嘆，不是未來的可能，也沒有推翻前文。',
      keyAwarded: {
        code: '若此',
        decodedEvidence: '到了前面所說的這種程度；本篇帶有「竟然這樣」的感嘆',
      },
    },
    {
      id: 'bu_yi',
      type: 'evidence',
      prerequisiteIds: ['ruo_ci'],
      targetSentence: '求劍若此，【不亦惑乎】？',
      intro: '「不亦……乎」是在真的等答案，還是在加強看法，我拿不準。我找到兩條線索，想請古文破譯家幫我比一比。',
      clues: [
        {
          text: '學而時習之，不亦說乎？',
          highlight: '不亦說乎',
          unlockedMeaning: '學過以後常常練習，【不亦】令人高興【乎】？',
          source: '真實古文線索；《論語・學而》。',
        },
        {
          text: '有朋自遠方來，不亦樂乎？',
          highlight: '不亦樂乎',
          unlockedMeaning: '有朋友從遠方來，【不亦】令人快樂【乎】？',
          source: '真實古文線索；《論語・學而》。',
        },
      ],
      question: '兩句中的「不亦……乎」，真正想表達什麼？',
      options: [
        '「我不知道。」真的在等別人告訴答案',
        '「千萬不要！」正在阻止這件事發生',
        '「當然是啊！」用問句加強自己的看法',
      ],
      correctIndex: 2,
      correctFeedback:
        '【不亦……乎】的密碼鑰匙到手！說話者不是在等別人提供答案，而是用「不是很……嗎？」加強自己的看法；線索中的「說」表示高興時，念作悅（ㄩㄝˋ）。',
      retryHint: '學過再練習、朋友從遠方來，說話的人心裡真的完全不知道這是不是好事嗎？',
      explanation:
        '兩句都用問句加強「令人高興、快樂」的看法，不是真的不知道答案，也不是阻止事情發生。回到本篇，目前只能確定作者心中已有判斷；判斷內容仍要由【惑】決定。',
      keyAwarded: {
        code: '不亦……乎',
        decodedEvidence: '說話者心中已有看法，用「不是很……嗎？」加強語氣',
      },
    },
    {
      id: 'huo',
      type: 'evidence',
      prerequisiteIds: ['bu_yi'],
      targetSentence: '求劍若此，不亦【惑】乎？',
      intro: '作者的判斷藏在【惑】裡，我還拿不準。我找到兩條線索，想請古文破譯家幫我比一比。',
      clues: [
        {
          text: '知者不惑，仁者不憂，勇者不懼。',
          highlight: '惑',
          unlockedMeaning: '有智慧的人不會【惑】，有仁德的人不會憂愁，勇敢的人不會害怕。',
          source: '真實古文線索；《論語・子罕》。',
        },
        {
          text: '惑而不從師，其為惑也，終不解矣。',
          highlight: '惑',
          unlockedMeaning: '心中有了【惑】卻不向老師請教，這個【惑】到最後仍然無法解開。',
          source: '真實古文線索；韓愈〈師說〉。',
        },
      ],
      question: '比較兩條線索，【惑】最可能是哪一種狀態？',
      options: ['心裡有不明白、沒有想通的地方', '已經把事情想得清清楚楚', '因為事情成功而非常高興'],
      correctIndex: 0,
      correctFeedback:
        '【惑】的密碼鑰匙到手！【惑】表示心裡有不明白、沒有想通的地方；線索中的「知者」是有智慧的人，「知」念作智（ㄓˋ）。',
      retryHint: '第二條線索說【惑】可能一直「不解」；什麼樣的事情才需要解開？',
      explanation:
        '有智慧的人不【惑】，顯示【惑】和沒有把事情看清楚有關；心中的【惑】若一直「不解」，也表示仍有不明白、沒有想通之處。「已經想清楚」和「終不解矣」相反，「非常高興」則無法解釋請教與解開。',
      keyAwarded: {
        code: '惑',
        decodedEvidence: '心裡不明白、沒有想通',
      },
    },
    {
      id: 'reveal_ruo_ci_bu_yi_huo_hu',
      type: 'reconstruction',
      prerequisiteIds: ['huo'],
      targetSentence: '求劍若此，不亦惑乎？',
      intro: '下面是我們已經取得的密碼鑰匙。',
      keys: [
        {
          code: '若此',
          decodedEvidence: '到了前面所說的這種程度；本篇帶有「竟然這樣」的感嘆',
        },
        {
          code: '不亦……乎',
          decodedEvidence: '說話者心中已有看法，用「不是很……嗎？」加強語氣',
        },
        {
          code: '惑',
          decodedEvidence: '心裡不明白、沒有想通',
        },
      ],
      question: '「求劍若此，不亦惑乎」最符合下面哪一個選項？',
      options: [
        '像這樣尋找劍，最後找到劍了嗎？',
        '竟然像這樣找劍，真讓人想不通。',
        '尋找劍時，是不是一定要先在船上刻記號？',
      ],
      correctIndex: 1,
      correctFeedback: '「求劍若此，不亦惑乎」重建成功，表示竟然像這樣找劍，真讓人想不通。',
      retryHint: '【若此】指前面的找劍方法，【不亦……乎】加強看法，【惑】和沒有想通有關；哪個選項保留三把鑰匙？',
      explanation:
        '【若此】指回楚人前面的尋劍方法；【不亦……乎】用問句加強作者已有的看法；【惑】表示心裡沒有想通。第一個選項只問最後有沒有找到劍，第三個選項則詢問找劍規則，都沒有表達作者的感嘆。',
      finalDraftLine: '作者看到楚人從移動後的記號下水找劍，感嘆：竟然像這樣找劍，真讓人想不通。',
    },
  ],
  sequenceOrderingClosing: {
    id: 'closing_sequence_order',
    title: '全文故事排序',
    intro: '五張故事卡的順序亂了，想請古文破譯家幫我排回事情發生的順序。',
    cards: [
      {
        id: 'A',
        text: '船停下來。',
      },
      {
        id: 'B',
        text: '楚人從刻痕處入水找劍。',
      },
      {
        id: 'C',
        text: '劍掉進水裡。',
      },
      {
        id: 'D',
        text: '船繼續向前走。',
      },
      {
        id: 'E',
        text: '楚人立刻在船上刻下記號。',
      },
    ],
    correctOrder: ['C', 'E', 'D', 'A', 'B'],
    correctFeedback: '故事順序排好了：劍先掉進水裡，楚人立刻刻船；船繼續向前，停下後，他才從刻痕處入水找劍。',
    retryHint: '先找出劍掉進水裡後，楚人立刻做了什麼；再看看船在他入水以前有沒有停下。',
    explanation: '古文先寫劍掉進水裡，接著寫楚人立刻在船上刻記號。船已經向前移動，後來停下，楚人才從刻痕處入水找劍。',
  },
  evidenceMultiSelectClosing: {
    id: 'closing_evidence_multiselect',
    title: '全文證據檢查',
    intro: '最後還有一個證據問題拿不準，想請古文破譯家只勾選古文明確寫出的事情。',
    options: [
      {
        text: '劍從船裡掉進水中。',
        correct: true,
        detail: '原文證據：「其劍自舟中墜於水」',
      },
      {
        text: '楚人最後找到了劍。',
        correct: false,
        detail: '原文沒有交代楚人最後是否找到劍。',
      },
      {
        text: '楚人刻船，是因為有人教過他這個方法。',
        correct: false,
        detail: '原文沒有交代刻船方法由誰教他。',
      },
      {
        text: '劍掉了之後，楚人立刻在船上刻下記號。',
        correct: true,
        detail: '原文證據：「遽契其舟」',
      },
      {
        text: '楚人掉劍時感到害怕。',
        correct: false,
        detail: '原文沒有寫楚人掉劍時害怕。',
      },
      {
        text: '作者覺得這種找劍的方法真讓人想不通。',
        correct: true,
        detail: '原文證據：「求劍若此，不亦惑乎」',
      },
    ],
    correctFeedback: '證據邊界找到了！古文有明確寫出的，才能算本文已經告訴我們的事；古文沒有寫的，不能自己補進故事裡。',
    retryHint: '回到原文找證據：能直接找到對應句子的才勾選，找不到文字證據的不要勾。',
    finalNote:
      '「其劍自舟中墜於水」寫出劍從船裡掉進水中；「遽契其舟」寫出楚人立刻刻船；「求劍若此，不亦惑乎」寫出作者對這種方法感到想不通。原文沒有交代楚人最後是否找到劍、刻船方法由誰教他，也沒有寫他掉劍時害怕。沒有寫「最後找到劍」只表示本文無法確定，不能反過來說本文已寫出他沒有找到。',
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
      'yi',
      'ruo_ci',
      'bu_yi',
      'huo',
      'reveal_ruo_ci_bu_yi_huo_hu',
      'closing_sequence_order',
      'closing_evidence_multiselect',
    ],
    guideLine:
      '你已經把整篇古文破解完了。現在才打開白話文，看看它和你剛才破解出的故事是不是一樣。\n\n這段白話沒有告訴你新的答案；每一幅畫面，都是你剛才自己用線索與證據破解出來的。',
    translation:
      '有一位楚國人正在渡河。他的劍從船裡掉進水中，他立刻在自己乘坐的船上刻下一個記號，說：「這裡是我的劍掉下去的地方。」\n\n船已經向前移動，後來停了下來。楚人從自己刻記號的地方進入水中，尋找那把劍。\n\n可是，船已經離開劍掉進水裡的位置，劍並沒有跟著船一起移動。竟然像這樣找劍，真讓人想不通。',
    comparisonRows: [],
    completionFeedback:
      '這篇古文，是你自己看懂的。\n\n你把字詞和其他古文線索比對，再用證據一步一步推理，最後把整篇故事接了起來。\n\n你沒有先偷看白話答案。這篇古文，是你親手破解的。\n\n太了不起了，古文破譯家！',
  },
  badgeName: '刻舟求劍破譯徽章',
  badgeClaimLabel: '收集破譯徽章',
  badgeClaimMode: 'scroll-end',
};
