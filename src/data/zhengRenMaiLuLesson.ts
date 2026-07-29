import type { GuwenLesson } from "./guwenLesson";

export const zhengRenMaiLuLesson: GuwenLesson = {
  id: "zheng-ren-mai-lu",
  contentRevision: "2026-07-30-approved-20",
  title: "鄭人買履",
  source: "《韓非子・外儲說左上》",
  introHeadline: "古文破譯家，新任務來了！",
  introSpokenLine:
    "我找到一篇鄭國人的故事，裡面有些古老字詞今天不容易讀懂。你願意幫我比較線索，一步一步重建故事嗎？",
  acceptMissionLabel: "接受破譯任務",
  fullText:
    "鄭人有欲買履者，先自度其足，而置之其坐。至之市，而忘操之。已得履，乃曰：「吾忘持度。」反歸取之。及反，市罷，遂不得履。\n人曰：「何不試之以足？」\n曰：「寧信度，無自信也。」",
  sentences: [
    "鄭人有欲買履者，",
    "先自度其足，而置之其坐。",
    "至之市，而忘操之。",
    "已得履，乃曰：「吾忘持度。」",
    "反歸取之。",
    "及反，市罷，遂不得履。\n",
    "人曰：「何不試之以足？」\n",
    "曰：「寧信度，無自信也。」",
  ],
  preserveAuthoredOptionOrder: true,
  splitFeedbackParagraphs: true,
  completeCorrectFeedbackAsCore: true,
  steps: [
    {
      id: "lu",
      type: "evidence",
      prerequisiteIds: [],
      targetSentence: "鄭人有欲買【履】者。",
      intro: "我看不懂「履」是什麼，拜託古文破譯家幫我破解。",
      question: "「履」在兩條線索中都穿在哪裡？它最可能是哪一種東西？",
      options: [
        "穿在腳上的鞋子",
        "一張拿來記錄腳大小的紙",
        "一個用來裝東西的袋子",
      ],
      correctIndex: 0,
      correctFeedback:
        "破解了！兩條線索中的「履」都穿在腳上，所以「履」就是鞋子。整句是說：鄭國有一個想要買鞋的人。",
      retryHint:
        "先不要猜它的材料。回到兩條線索，找找看：「履」都出現在身體的哪個位置？",
      explanation:
        "第一條線索先給出「足下」，接著寫人物腳上有絲做的「履」；「足下」把位置限制在腳上。\n\n第二條線索也用上下對照：腳上穿了「遠遊履」，頭上戴了「方山巾」。它再次把「履」放在腳上。\n\n兩條線索合起來，都指向同一種畫面：「履」和頭巾一樣是穿戴用品，但它的位置在腳上。因此，「履」在本篇中就是古人所穿的鞋子。\n\n第二個選項不能解釋第一條線索中「履」所在的位置；第三個選項也不能解釋為什麼它位於腳上。",
      finalDraftLine: "鄭國有一個想要買鞋的人。",
      clues: [
        {
          text: "足下躡絲履，頭上玳瑁光。",
          highlight: "履",
          unlockedMeaning: "她的腳上穿了絲做的【履】，頭上戴了閃亮的飾品。",
          source: "真實古文線索；《孔雀東南飛》",
        },
        {
          text: "足著遠遊履，首戴方山巾。",
          highlight: "履",
          unlockedMeaning:
            "他的腳上穿了遠遊用的【履】，頭上戴了方山頭巾。（一種頭巾樣式）",
          source: "真實古文線索；李白《嘲魯儒》",
        },
      ],
      keyAwarded: {
        code: "履",
        decodedEvidence: "鞋子",
      },
    },
    {
      id: "du_qi_zu",
      type: "evidence",
      prerequisiteIds: ["lu"],
      targetSentence: "先自【度其足】。",
      intro:
        "「其足」是他的腳，可是「度」這個動作我還看不懂。拜託古文破譯家幫我。",
      question:
        "第一條線索要知道長短，第二條要做合身的衣服。「度」最可能是什麼動作？",
      options: ["把東西遮住，不讓別人看見", "用腳試穿鞋子", "測出有多長、多大"],
      correctIndex: 2,
      correctFeedback:
        "破解了！「度」是測出長短、大小的動作；「度」當作測量時，念作墮（ㄉㄨㄛˋ），所以「度其足」就是量自己的腳有多大。",
      retryHint:
        "第一條線索要知道長短，第二條線索要做合身的衣服。做這些事以前，都要先知道哪一種資料？",
      explanation:
        "第一條線索用「輕重」對照「長短」；第二條線索要先知道身體大小，才能做合身的衣服。因此，「度」是測出長短、大小的動作。",
      clues: [
        {
          text: "權，然後知輕重；度，然後知長短。",
          highlight: "度",
          unlockedMeaning: "用工具測過，才知道輕重；用尺【度】過，才知道長短。",
          source: "真實古文線索；《孟子・梁惠王上》",
        },
        {
          text: "量腹而食，度身而衣。",
          highlight: "度",
          unlockedMeaning:
            "按照肚子的大小決定吃多少；先【度】身體，再做合身的衣服。",
          source: "真實古文線索；《墨子・魯問》",
        },
      ],
      keyAwarded: {
        code: "度其足",
        decodedEvidence: "量自己的腳有多大",
      },
    },
    {
      id: "zuo",
      type: "evidence",
      prerequisiteIds: ["du_qi_zu"],
      targetSentence: "而置之其【坐】。",
      intro:
        "「其」就是「他的」，可是「其坐」裡的「坐」我還看不懂。拜託古文破譯家幫我比一比。",
      question: "兩條線索中的「坐」最可能是什麼？",
      options: ["人坐下的動作", "人坐的位置", "人走路的速度"],
      correctIndex: 1,
      correctFeedback:
        "破解了！「坐」在這裡是人坐的位置，相當於座位；「其坐」就是他的座位。",
      retryHint:
        "第一條線索把「坐」和地面並列成兩個放東西的位置。再看一次：玉璧被放在哪裡？",
      explanation:
        "玉璧可以放在「坐」上，客人也可以待在「坐」上。因此，這裡的「坐」是人坐的位置，不是坐下的動作。",
      clues: [
        {
          text: "項王則受璧，置之坐上；亞父受玉斗，置之地。",
          highlight: "坐",
          unlockedMeaning:
            "項王接過玉璧，把它放在【坐】上；亞父接過玉斗，把它放在地上。",
          source: "真實古文線索；《史記・項羽本紀》",
        },
        {
          text: "坐上客恆滿。",
          highlight: "坐",
          unlockedMeaning: "孔融家裡，【坐】上總有許多客人。",
          source: "真實古文線索；《後漢書・孔融傳》",
        },
      ],
      keyAwarded: {
        code: "坐",
        decodedEvidence: "人坐的位置，也就是座位",
      },
    },
    {
      id: "zhi_zhi_qi_zuo",
      type: "local_inference",
      prerequisiteIds: ["zuo"],
      targetSentence: "先自度其足，而置【之】其坐。",
      intro: "🔑「之」常指回前面的東西。這次還要拜託古文破譯家幫我。",
      question: "往前看，他放在自己座位上的最可能是哪一項？",
      options: ["量腳後得到的尺寸", "他自己的腳", "還沒有取得的鞋"],
      correctIndex: 0,
      correctFeedback:
        "追到了！「之」指量腳後得到的尺寸。整句是說：他先量自己的腳有多大，再把量好的尺寸放在自己的座位上。",
      retryHint:
        "他現在還沒有到市集，也還沒有取得鞋。往前找：他剛剛完成了哪一件事？",
      explanation:
        "前一句才寫他量腳，後一句就把「之」放在座位上，所以「之」指量腳後得到的尺寸。這時他還沒有鞋，當然不可能把鞋放在座位上。",
      finalDraftLine: "他先量自己的腳有多大，再把量好的尺寸放在自己的座位上。",
      keyAwarded: {
        code: "置之其坐",
        decodedEvidence: "把量好的尺寸放在自己的座位上",
      },
    },
    {
      id: "zhi_shi",
      type: "evidence",
      prerequisiteIds: ["zhi_zhi_qi_zuo"],
      targetSentence: "至【之市】，而忘操之。",
      intro:
        "🔑「之」常指回前面的人或東西，可是這次它後面接著「市」。我拿不準是不是同一種用法，拜託古文破譯家幫我比一比。",
      question: "兩句中的「之＋地方」最可能表示什麼？",
      options: ["剛剛離開的地方", "留在原地觀看的地方", "準備前往的地方"],
      correctIndex: 2,
      correctFeedback:
        "找到「之」的新鑰匙了！「之＋地方」可以表示前往那個地方。所以「之市」就是前往市集。",
      retryHint:
        "第一個人騎馬，第二個人談到南海。他們的動作方向，是朝向「之」後面的地方，還是離開那裡？",
      explanation:
        "項伯朝沛公的軍營移動；和尚也想去南海。兩句的「之」後面都接目的地，所以這裡的「之」表示前往。",
      clues: [
        {
          text: "項伯乃夜馳之沛公軍。",
          highlight: "之",
          unlockedMeaning: "項伯當夜騎馬疾馳，【之】沛公的軍營。",
          source: "真實古文線索；《史記・項羽本紀》",
        },
        {
          text: "吾欲之南海，何如？",
          highlight: "之",
          unlockedMeaning:
            "（南海是一個地方。）一位和尚說：「我想【之】南海，怎麼樣？」",
          source: "真實古文線索；彭端淑《為學一首示子姪》",
        },
      ],
      keyAwarded: {
        code: "之＋地方",
        decodedEvidence: "前往那個地方",
      },
    },
    {
      id: "cao",
      type: "evidence",
      prerequisiteIds: ["zhi_shi"],
      targetSentence: "至之市，而忘【操】之。",
      intro: "「操之」裡的「操」我還看不懂，拜託古文破譯家幫我比一比。",
      question: "比較兩條線索：「操」最可能是什麼動作？",
      options: [
        "把某樣東西放回原來的位置",
        "把某樣東西拿在手中或帶在身上",
        "把某樣東西交給另一個人",
      ],
      correctIndex: 1,
      correctFeedback:
        "破解了！「操」是把東西拿在手中或帶在身上；這裡的「之」指量好的尺寸。整句是說：他到了市集，卻忘了帶量好的尺寸。",
      retryHint:
        "戰士的「操」後面接著吳戈，羿的「操」後面接著弓。看看這兩件東西和人物的位置。",
      explanation:
        "戰士手中有吳戈，羿手中有弓，因此「操」表示把某樣東西拿在手中或帶在身上。回到原文，前面唯一被留下、現在又需要帶去市集的東西，是量腳後得到的尺寸，所以「操之」就是帶著量好的尺寸。",
      finalDraftLine: "他到了市集，卻忘了帶量好的尺寸。",
      clues: [
        {
          text: "操吳戈。",
          highlight: "操",
          unlockedMeaning: "戰士【操】吳戈。（吳戈是一種武器。）",
          source: "真實古文線索；屈原《九歌・國殤》",
        },
        {
          text: "羿操弓而進，挾矢而前。",
          highlight: "操",
          unlockedMeaning:
            "（羿準備用弓箭對付太陽。）羿【操】弓向前，箭夾在身旁。",
          source:
            "真實古文線索；唐・周鍼〈羿射九日賦〉，收入《全唐文》卷九百五十四、《文苑英華》卷四。原文核對：中國哲學書電子化計劃",
        },
      ],
      keyAwarded: {
        code: "操",
        decodedEvidence: "把東西拿在手中或帶在身上",
      },
    },
    {
      id: "nai",
      type: "evidence",
      prerequisiteIds: ["cao"],
      targetSentence: "已得履，【乃】曰：「吾忘持度。」",
      intro:
        "🔑「曰」就是開口說話。我拿不準「乃」怎麼接起前後兩件事，拜託古文破譯家幫我判斷。",
      question:
        "比較兩條線索：「乃」把後面的反應或動作，接在前面的事情什麼時候？",
      options: [
        "前面的事情還沒發生，就先做後面的事",
        "前面的事情發生後，接著才出現後面的事",
        "前面的事情發生後，後面的事永遠不會出現",
      ],
      correctIndex: 1,
      correctFeedback:
        "破解「乃」了！它把後面的事接在前面的情況之後，可以讀成「這才」或「於是才」。所以「已得履，乃曰」表示前面的情況出現後，他這才開口說話。",
      retryHint:
        "陳太丘先離開，朋友後到；村民先看見漁夫，接著才感到驚訝。兩句的後半段，都出現在前半段之前還是之後？",
      explanation:
        "第一條線索先寫陳太丘離開，朋友後來才到；第二條線索先寫村民看見漁夫，接著才驚訝。因此，「乃」把後面的事接在前面的事情之後。",
      clues: [
        {
          text: "太丘舍去，去後乃至。",
          highlight: "乃",
          unlockedMeaning:
            "陳太丘等不到朋友，先離開了；陳太丘離開以後，那位朋友【乃】到達。",
          source: "真實古文線索；《世說新語・方正》",
        },
        {
          text: "見漁人，乃大驚。",
          highlight: "乃",
          unlockedMeaning: "村民們看見一位從外面來的漁夫，【乃】非常驚訝。",
          source: "真實古文線索；陶淵明《桃花源記》",
        },
      ],
      keyAwarded: {
        code: "乃",
        decodedEvidence: "前面的情況發生後，這才出現後面的事",
      },
    },
    {
      id: "chi_du",
      type: "local_inference",
      prerequisiteIds: ["nai"],
      targetSentence: "已得履，乃曰：「吾忘【持度】。」",
      intro:
        "🔑前面的「度其足」已經破解：他量了自己的腳。\n🔑「吾」就是說話的人自己；「持」表示把東西拿在手中或帶在身上。\n這次「度」跟在「持」後面，我拿不準是不是同一種用法，拜託古文破譯家幫我追查。",
      question: "「吾忘持度」最可能表示他忘了帶什麼？",
      options: ["還沒有買到的鞋", "他自己的腳", "量腳後得到的尺寸"],
      correctIndex: 2,
      correctFeedback:
        "抓到了！「持度」的「度」指量好的尺寸；「度」當作尺寸時，念作肚（ㄉㄨˋ）。所以「吾忘持度」就是「我忘了帶量好的尺寸」。",
      retryHint:
        "他出門前把什麼放在座位上？那樣東西留在家裡，才會忘了帶去市集。",
      explanation:
        "前文先寫他量腳，再把量好的尺寸放在座位上。到了市集，他說自己忘了「持度」。因此，這裡的「度」不是量腳的動作，而是量腳後得到的尺寸。",
      keyAwarded: {
        code: "持度",
        decodedEvidence: "帶著量腳後得到的尺寸",
      },
    },
    {
      id: "fan",
      type: "evidence",
      prerequisiteIds: ["chi_du"],
      targetSentence: "【反】歸取之。",
      intro:
        "他發現自己忘了帶尺寸，接著做出「反」的動作。我看不懂他的方向，拜託古文破譯家幫我比一比。",
      question:
        "兩條線索中的人先離開一個地方，後來又「反」。「反」最可能表示什麼？",
      options: ["回到先前的地方", "繼續朝更遠的地方前進", "停在原地不動"],
      correctIndex: 0,
      correctFeedback:
        "破解「反」了！兩條線索都先寫人物離開，再寫他回到先前的地方。所以這裡的「反」表示返回。",
      retryHint:
        "蘇軾先上山，後來又登船；愚公一家先把土運走，之後才再次出現在原來的地方。他們的方向是繼續遠離，還是回頭？",
      explanation:
        "第一條線索中，蘇軾離開山上，回到江邊登船。第二條線索中，愚公一家把土石運到遠方後，很久才回來一次。兩句都出現「離開後再回來」的畫面，因此「反」表示返回。",
      clues: [
        {
          text: "反而登舟。",
          highlight: "反",
          unlockedMeaning:
            "（蘇軾爬上山，覺得害怕，不能久留。）他【反】到江邊，登上船。",
          source: "真實古文線索；蘇軾《後赤壁賦》",
        },
        {
          text: "寒暑易節，始一反焉。",
          highlight: "反",
          unlockedMeaning:
            "（愚公一家把挖出的土石運到很遠的地方。）經過寒暑變化，全家人才【反】一次。",
          source: "真實古文線索；《列子・湯問》",
        },
      ],
      keyAwarded: {
        code: "反",
        decodedEvidence: "返回先前的地方",
      },
    },
    {
      id: "fan_gui_qu_zhi",
      type: "reconstruction",
      prerequisiteIds: ["fan"],
      targetSentence: "【反歸取之】。",
      intro: "下面是我們已經取得的密碼鑰匙。",
      question: "「反歸取之」最符合下面哪一個選項？",
      options: [
        "回到鞋攤，把鞋放在攤位上",
        "留在市集，重新測量自己的腳",
        "回到家裡，拿取留在座位上的尺寸",
      ],
      correctIndex: 2,
      correctFeedback:
        "重建完成！「反歸取之」是說：他返回家裡，拿取前面留在座位上的尺寸。",
      retryHint:
        "他先前把什麼留在自己的座位上？現在又因為忘了帶那樣東西而離開市集。",
      explanation:
        "前文已經確定，他把量好的尺寸留在座位上，到了市集才發現忘記攜帶。「反歸」讓他回到原來的地方；「取之」則把前文留下的尺寸拿走。",
      keys: [
        {
          code: "反、歸",
          decodedEvidence: "返回、回去",
        },
        {
          code: "取",
          decodedEvidence: "把東西拿走",
        },
        {
          code: "之",
          decodedEvidence: "指回前面提到的東西",
        },
      ],
      keyAwarded: {
        code: "反歸取之",
        decodedEvidence: "返回家裡拿取量好的尺寸",
      },
    },
    {
      id: "ji",
      type: "evidence",
      prerequisiteIds: ["fan_gui_qu_zhi"],
      targetSentence: "【及】反，市罷。",
      intro:
        "「及反」把返回的動作接到某個時間點，我拿不準是哪一種關係，拜託古文破譯家幫我比一比。",
      question:
        "比較兩條線索，哪一個說法最能解釋「及」怎麼把前後的事情接起來？",
      options: ["等到、到了", "很久以前", "還沒有等到"],
      correctIndex: 0,
      correctFeedback:
        "破解「及」了！太陽升起後，到了正午才讓人感到炎熱；漁人到了郡城後，才去見太守。因此，「及」可以表示「等到、到了」；「及反」就是「等到他返回」。",
      retryHint:
        "第一條線索先寫太陽升起，再寫正午的感覺；第二條線索先寫漁人前進，再寫他到郡城後做的事。哪個選項能同時說明兩句的先後關係？",
      explanation:
        "兩條線索都先讓一件事進行到某個時間點，再接出後續。因此，「及」表示等到或到了。「及反」就是等到他返回市集。",
      clues: [
        {
          text: "日初出滄滄涼涼，及其日中如探湯。",
          highlight: "及",
          unlockedMeaning:
            "太陽剛升起時，天氣涼涼的；【及】正午，太陽就如熱水般燙。",
          source: "真實古文線索；《列子・湯問》",
        },
        {
          text: "及郡下，詣太守，說如此。",
          highlight: "及",
          unlockedMeaning:
            "（漁人離開桃花源，搭船前進。）【及】郡城，他去見太守，說了這件事。",
          source: "真實古文線索；陶淵明《桃花源記》",
        },
      ],
      keyAwarded: {
        code: "及",
        decodedEvidence: "等到、到了",
      },
    },
    {
      id: "ba",
      type: "evidence",
      prerequisiteIds: ["ji"],
      targetSentence: "及反，市【罷】。",
      intro:
        "我看不懂市集變成了什麼狀態，拜託古文破譯家幫我比較兩條「罷」的線索。",
      question: "比較兩條線索：「罷」和後面的動作之間，有什麼共同關係？",
      options: ["剛要開始", "進行到一半", "已經結束"],
      correctIndex: 2,
      correctFeedback:
        "破解「罷」了！歌「罷」和曲「罷」都表示演唱已經結束。因此，「市罷」就是市集已經結束。",
      retryHint:
        "先看兩句的順序：歌【罷】之後，杜甫才抬頭嘆息；曲【罷】之後，女子才靠著欄杆哭。哪一個假說能同時解釋兩句？",
      explanation:
        "兩條線索都把「罷」放在歌唱活動的末尾，後面的動作是在演唱結束後才發生。所以「罷」表示結束；「市罷」就是市集已經結束。",
      clues: [
        {
          text: "歌罷仰天歎，四座淚縱橫。",
          highlight: "罷",
          unlockedMeaning: "杜甫唱歌【罷】，抬頭長嘆，四周的人都流下眼淚。",
          source: "真實古文線索；杜甫《羌村》",
        },
        {
          text: "曲罷情不勝，憑闌向西哭。",
          highlight: "罷",
          unlockedMeaning:
            "（女子對著空屋唱曲。）曲【罷】，她靠在欄杆邊，面向西方哭泣。",
          source: "真實古文線索；劉商《銅雀妓》",
        },
      ],
      keyAwarded: {
        code: "罷",
        decodedEvidence: "活動已經結束",
      },
    },
    {
      id: "ji_fan_shi_ba",
      type: "reconstruction",
      prerequisiteIds: ["ba"],
      targetSentence: "【及反，市罷】。",
      intro: "下面是我們已經取得的密碼鑰匙。",
      question: "「及反，市罷」最符合下面哪一個選項？",
      options: [
        "他回到市集以前，市集重新開門",
        "等到他返回市集，市集已經結束",
        "他一返回家裡，市集便開始營業",
      ],
      correctIndex: 1,
      correctFeedback:
        "重建完成！「及反，市罷」是說：等到他再回到市集，市集已經結束。",
      retryHint:
        "「及反」先交代他返回；「市罷」再交代返回時看見的情況。不要把兩件事的時間順序顛倒。",
      explanation:
        "「及反」把時間推到他從家裡返回市集的時刻；「市罷」則說明那時市集已經結束。兩句合起來，清楚交代他因為往返而錯過市集。",
      keys: [
        {
          code: "及反",
          decodedEvidence: "等到他返回",
        },
        {
          code: "市罷",
          decodedEvidence: "市集已經結束",
        },
      ],
      keyAwarded: {
        code: "及反，市罷",
        decodedEvidence: "等他再回到市集時，市集已經結束",
      },
    },
    {
      id: "sui_bu_de_lu",
      type: "evidence",
      prerequisiteIds: ["ji_fan_shi_ba"],
      targetSentence: "及反，市罷，【遂不得履】。",
      intro:
        "市集已經結束，原文接著寫「遂不得履」。我拿不準「遂」怎麼連接前後，拜託古文破譯家幫我比一比。",
      question:
        "比較兩條線索，再回到原文。哪一個說法最能同時解釋三句中「遂」前後的關係？",
      options: [
        "市集結束，但是他立刻得到另一雙鞋",
        "市集結束以前，他已經把鞋帶回家",
        "市集結束，所以最後沒有取得鞋",
      ],
      correctIndex: 2,
      correctFeedback:
        "破解了！「遂」把前面的情況接到後面的結果，可以讀成「所以最後」。整句是說：等他返回時，市集已經結束，所以最後沒有取得鞋。",
      retryHint:
        "線索一中，劉邦拔劍砍蛇，蛇接著斷成兩截；線索二中，匈奴認為有神相助，接著離開。再看「遂」把哪兩件事接在一起。",
      explanation:
        "第一條線索中，劉邦拔劍砍蛇，蛇接著斷成兩截；第二條線索中，匈奴以為有神相助，接著帶兵離開。兩句中的「遂」都承接前面的情況，帶出接下來發生的事。因此，目前可推得「遂」可以讀成「於是、所以最後」。「市罷，遂不得履」表示市集結束，所以他最終沒能取得鞋。",
      clues: [
        {
          text: "乃前，拔劍擊斬蛇。蛇遂分為兩。",
          highlight: "遂",
          unlockedMeaning:
            "（劉邦遇到一條擋路的大蛇。）他走上前，拔劍砍蛇；蛇【遂】斷成兩截。",
          source: "真實古文線索；司馬遷《史記・高祖本紀》",
        },
        {
          text: "虜以為神明，遂引去。",
          highlight: "遂",
          unlockedMeaning:
            "（漢軍挖井取得水，匈奴看見後很驚訝。）匈奴以為有神相助，【遂】帶兵離開。",
          source: "真實古文線索；《後漢書・耿恭傳》",
        },
      ],
      keyAwarded: {
        code: "遂",
        decodedEvidence: "承接前面的情況，帶出最後的結果",
      },
    },
    {
      id: "yi_de_lu",
      type: "evidence",
      prerequisiteIds: ["sui_bu_de_lu"],
      targetSentence:
        "【已得履】，乃曰：「吾忘持度。」\n及反，市罷，【遂不得履】。",
      intro:
        "同一個「得」放在不同句子裡，意思好像會變。我找到兩條線索，想請古文破譯家幫我比一比。",
      question: "你看得出線索一和線索二中的兩個【得】，分別是什麼意思嗎？",
      options: [
        "線索一的【得】是買到，線索二的【得】是找到",
        "線索一的【得】是找到，線索二的【得】是買到",
        "兩條線索的【得】都是買到",
      ],
      correctIndex: 1,
      correctFeedback:
        "沒錯！線索一的【得】是找到，線索二的【得】是買到。把這兩把鑰匙放回原文：「已得履」是他已經找到或挑中鞋；但他回家拿尺寸，等他返回時市集已經結束，「遂不得履」就是最後沒能買到鞋。",
      retryHint:
        "線索一是在路上遇到別人遺失的金子；線索二是在付錢之後拿到魚。先替兩條線索分別選「找到」或「買到」，再放回本篇。",
      explanation:
        "線索一中，羊子在路上遇到別人遺失的金子，所以【得】表示找到。線索二先說付出一百枚錢，再說【得】兩條鯉魚，所以【得】表示買到。回到本篇，「已得履」之後，他仍因忘帶尺寸而離開市集；等他回來時，市集已經結束，才「遂不得履」。因此，第一個【得】是找到或挑中鞋，第二個【得】是最後沒能買到鞋。",
      finalDraftLine:
        "他找到或挑中想要的鞋後，這才說：「我忘了帶量好的尺寸。」於是回家拿尺寸。等他返回市集，市集已經結束，所以最後沒能買到鞋。",
      clues: [
        {
          text: "羊子嘗行路，得遺金一餅。",
          highlight: "得",
          unlockedMeaning:
            "有一個人叫羊子，他在路上行走時，【得】一塊別人遺失的金子。",
          source: "真實古文線索；范曄《後漢書・列女傳》（節錄）",
        },
        {
          text: "以百錢得雙鯉。",
          highlight: "得",
          unlockedMeaning: "有人付出一百枚錢，【得】兩條鯉魚。",
          source: "真實古文線索；清・西清《黑龍江外記》卷八（節錄）",
        },
      ],
      keysAwarded: [
        {
          code: "第一個得",
          decodedEvidence: "找到或挑中",
        },
        {
          code: "第二個得",
          decodedEvidence: "買到",
        },
      ],
    },
    {
      id: "shi_zhi_yi_zu",
      type: "evidence",
      prerequisiteIds: ["yi_de_lu"],
      targetSentence: "人曰：「何不【試之以足】？」",
      intro:
        "🔑「何不」就是「為什麼不」。我拿不準「以足」和「試之」怎麼組成一個動作，拜託古文破譯家幫我比一比。",
      question:
        "比較兩條線索中「刀、杓」和動作的關係，再回到故事。「之」最可能指什麼？「試之以足」最可能是哪一個完整畫面？",
      options: [
        "「之」指鞋：為什麼不用自己的腳試那雙鞋？",
        "「之」指量好的尺寸：為什麼不用自己的腳試量好的尺寸？",
        "「之」指自己的腳：為什麼不用自己的腳試自己的腳？",
      ],
      correctIndex: 0,
      correctFeedback:
        "破解完成！「之」指前面找到的鞋，「以足」表示用自己的腳。整句是說：有人問他：「為什麼不用自己的腳試那雙鞋？」",
      retryHint:
        "線索一中，刀和「劈」有什麼關係？線索二中，杓和「舀」有什麼關係？再回到故事：尺寸、鞋和腳之中，哪一樣東西正等著被試？",
      explanation:
        "第一條線索中，屠夫拿刀完成劈的動作；第二條線索中，賣油翁拿杓完成舀油的動作。放回原文，「足」就是完成「試」這個動作時使用的身體部位。\n\n接著追查「之」：別人是在問他為什麼不直接試前面找到的鞋，所以「之」指鞋。整句就是：「為什麼不用自己的腳試那雙鞋？」",
      finalDraftLine: "有人問他：「為什麼不用自己的腳試那雙鞋？」",
      clues: [
        {
          text: "以刀劈狼首。",
          highlight: "以刀",
          unlockedMeaning: "屠夫【以刀】劈向狼的頭。",
          source: "真實古文線索；蒲松齡《狼三則》",
        },
        {
          text: "徐以杓酌油瀝之。",
          highlight: "以杓",
          unlockedMeaning: "賣油翁慢慢【以杓】舀油，再把油滴進葫蘆口。",
          source: "真實古文線索；歐陽修《賣油翁》",
        },
      ],
      keyAwarded: {
        code: "試之以足",
        decodedEvidence: "用自己的腳試那雙鞋",
      },
    },
    {
      id: "ning",
      type: "evidence",
      prerequisiteIds: ["shi_zhi_yi_zu"],
      targetSentence: "曰：「【寧】信度，無自信也。」",
      intro:
        "「寧」把兩種情況放在一起比較，我拿不準人物選了哪一邊，拜託古文破譯家幫我比一比。",
      question:
        "比較每句前後兩種情況：人物把哪一種放在「寧」後面？「寧」最可能帶出什麼意思？",
      options: [
        "前後兩種情況都同樣可以接受",
        "想避開「寧」後面的情況，改選另一邊",
        "即使兩邊都不理想，也比較願意接受「寧」後面的情況",
      ],
      correctIndex: 2,
      correctFeedback:
        "找到「寧」的鑰匙了！「寧」表示兩相比較後，情願接受後面接著的情況，可以讀成「寧可」。「寧信度」就是寧可相信量好的尺寸。",
      retryHint:
        "線索一裡，「沒有肉」和「沒有竹子」，哪一種情況被說成「不可」？再看看「寧」放在哪一種情況前面。",
      explanation:
        "第一條線索中，蘇軾可以接受吃飯沒有肉，卻不能接受住處沒有竹子。第二條線索中，採桑女可以接受孩子晚一點吃飯，卻不能耽誤蠶睡眠。\n\n兩句都把比較願意接受的情況放在「寧」後面。因此，「寧」可以讀成「寧可」。\n\n放回原文，目前只能讀出：「我寧可相信量好的尺寸，不……」後面的「無自信也」仍要到下一題破解。",
      clues: [
        {
          text: "寧可食無肉，不可居無竹。",
          highlight: "寧",
          unlockedMeaning:
            "蘇軾說：「【寧】可吃飯沒有肉，不可住的地方沒有竹子。」",
          source: "真實古文線索；蘇軾《於潛僧綠筠軒》",
        },
        {
          text: "寧可誤兒飢，不可誤蠶眠。",
          highlight: "寧",
          unlockedMeaning:
            "採桑女說：「【寧】可讓孩子晚一點吃飯，不可耽誤蠶睡眠。」",
          source:
            "真實古文線索；明末清初・黎遂球〈採桑曲〉。原文核對：維基文庫〈採桑曲〉",
        },
      ],
      keyAwarded: {
        code: "寧",
        decodedEvidence: "兩相比較後，寧可接受後面接著的情況",
      },
    },
    {
      id: "wu_zi_xin_ye",
      type: "evidence",
      prerequisiteIds: ["ning"],
      targetSentence: "曰：「寧信度，【無自信也】。」",
      intro:
        "今天說「沒有自信」，常指一個人覺得自己做不到。古文的「無自信也」也是這個意思嗎？拜託古文破譯家幫我比一比。",
      question:
        "把兩條線索中的「信」放回原文比較：「無自信也」和今天說的「沒有自信」，意思一樣嗎？",
      options: [
        "一樣：他覺得自己沒有能力用腳試鞋。",
        "不一樣：他不是覺得自己做不到，而是不相信用自己的腳試鞋子會比量好的尺寸更精準。",
        "不一樣：他不相信自己曾經量過腳。",
      ],
      correctIndex: 1,
      correctFeedback:
        "找到鑰匙了！他不是覺得自己做不到。整句是說：他寧可相信量好的尺寸，也不相信直接用自己的腳試鞋會更準確。",
      retryHint:
        "第一條線索是在說沒有能力讀書嗎？第二條線索是在說沒有能力和大臣相處嗎？再把兩句中的「信」放進「自信」試試看。",
      explanation:
        "第一條線索談的是要不要相信書上寫的內容，不是有沒有能力讀書。第二條線索談的是國君是否相信大臣，也不是有沒有能力和大臣相處。\n\n因此，兩條線索中的「信」都可以理解為相信。放回原文，「自」是自己，「自信」就是相信自己。\n\n放回故事，別人問他為什麼不用自己的腳試鞋。他回答「寧信度，無自信也」，表示他寧可依照量好的尺寸，也不認為直接用腳試鞋會更加準確。\n\n所以，這裡的「無自信也」並不是今天所說的「覺得自己做不到」。選項三也不成立，因為原文明確寫出他已經量過自己的腳；他懷疑的不是自己有沒有量過，而是哪一種方法更值得採用。",
      finalDraftLine:
        "他回答：「我寧可依照量好的尺寸，也不相信直接用自己的腳試鞋會更準確。」",
      clues: [
        {
          text: "盡信書，則不如無書。",
          highlight: "信",
          unlockedMeaning: "如果完全【信】書上寫的內容，還不如沒有書。",
          source: "真實古文線索；《孟子・盡心下》",
        },
        {
          text: "願陛下親之信之。",
          highlight: "信",
          unlockedMeaning:
            "諸葛亮向國君推薦幾位大臣，希望陛下親近他們、【信】他們。",
          source: "真實古文線索；諸葛亮《出師表》",
        },
      ],
      keyAwarded: {
        code: "自信",
        decodedEvidence: "相信自己；本句不是現代「有自信」的意思",
      },
    },
  ],
  sequenceOrderingClosing: {
    id: "closing_sequence_order",
    title: "第十九題：全文故事順序",
    intro: "八張故事卡的順序亂了，我沒辦法確認故事經過，拜託古文破譯家幫我。",
    cards: [
      {
        id: "A",
        text: "等他再次回到市集，市集已經結束，他沒買到鞋。",
      },
      {
        id: "B",
        text: "他想買鞋。",
      },
      {
        id: "C",
        text: "有人問他，為什麼不用自己的腳直接試鞋。",
      },
      {
        id: "D",
        text: "他到了市集，身上沒有量好的尺寸。",
      },
      {
        id: "E",
        text: "他返回家裡拿尺寸。",
      },
      {
        id: "F",
        text: "他先量自己的腳，把量好的尺寸留在座位上。",
      },
      {
        id: "G",
        text: "他回答：寧可依照量好的尺寸，也不相信用腳試鞋會更準確。",
      },
      {
        id: "H",
        text: "他找到或挑中想要的鞋時，才想起尺寸留在家裡。",
      },
    ],
    correctOrder: ["B", "F", "D", "H", "E", "A", "C", "G"],
    correctFeedback:
      "全文重建成功！他先量腳，卻把尺寸留在家裡；到了市集才想起，又為了取尺寸往返，最後錯過市集。別人提出直接用腳試鞋，他仍認為量好的尺寸更值得採用。",
    retryHint:
      "先找最早發生的兩件事：他還沒去市集以前，先做了什麼？再找「返回家裡」和「市集結束」的先後。",
    explanation:
      "「找到或挑中想要的鞋」是根據「已得履」和「遂不得履」得到的最合理推論。古文沒有記下完整的購買手續。",
  },
  evidenceMultiSelectClosing: {
    id: "closing_evidence_multiselect",
    title: "第二十題：破譯家的證據檢查",
    intro:
      "我把文章寫的內容和自己補上的細節混在一起了，拜託古文破譯家幫我分清楚。",
    options: [
      {
        text: "他把量好的尺寸寫在一張紙上。",
        correct: false,
        detail: "文章沒有明確寫出尺寸記在紙上。",
      },
      {
        text: "他發現忘帶尺寸後，返回家裡拿取。",
        correct: true,
        detail: "原文證據：「反歸取之」。",
      },
      {
        text: "他已經付錢買下鞋，才決定回家。",
        correct: false,
        detail: "文章沒有明確寫出他已經付錢。",
      },
      {
        text: "他買鞋以前先測量自己的腳。",
        correct: true,
        detail: "原文證據：「先自度其足」。",
      },
      {
        text: "他再次回到市集時，市集已經結束。",
        correct: true,
        detail: "原文證據：「及反，市罷」。",
      },
      {
        text: "鞋店老闆拒絕讓他試穿。",
        correct: false,
        detail: "文章沒有明確寫出鞋店老闆拒絕讓他試穿。",
      },
      {
        text: "他原本想買鞋。",
        correct: true,
        detail: "原文證據：「鄭人有欲買履者」。",
      },
      {
        text: "他寧可依照量好的尺寸，也不相信用自己的腳直接試鞋會更準確。",
        correct: true,
        detail: "原文證據：「寧信度，無自信也」。",
      },
    ],
    correctFeedback:
      "證據檢查完成！文章有明確寫出：他想買鞋、先量腳、回家拿尺寸、回到市集時市集已經結束；他也寧可相信量好的尺寸，不相信自己的腳。\n\n文章沒有明確寫出尺寸記在紙上、他已經付錢，或鞋店老闆拒絕讓他試穿，所以這些選項不能勾。",
    retryHint: "每個選項都回原文找。文章沒有明確寫出來的內容，就先不要勾。",
    finalNote:
      "「已得履」最合理的理解是：他已經找到或挑中想要的鞋，但還沒有完成購買。這是前後文支持的推論，文章沒有直接寫出完整交易過程；所以在這一題仍歸入「文章沒有明確寫出來」。",
  },
  finalVerification: {
    prerequisiteStepIds: [
      "lu",
      "du_qi_zu",
      "zuo",
      "zhi_zhi_qi_zuo",
      "zhi_shi",
      "cao",
      "nai",
      "chi_du",
      "fan",
      "fan_gui_qu_zhi",
      "ji",
      "ba",
      "ji_fan_shi_ba",
      "sui_bu_de_lu",
      "yi_de_lu",
      "shi_zhi_yi_zu",
      "ning",
      "wu_zi_xin_ye",
      "closing_sequence_order",
      "closing_evidence_multiselect",
    ],
    guideLine:
      "「已得履」譯為「找到或挑中想要的鞋」，是為了和後文「遂不得履」一致。古文沒有記錄實際交易的每一道步驟，因此不能進一步斷定他是否已經議價、試看或準備交錢。",
    translation:
      "有一個鄭國人想買鞋。他先量自己的腳，把量好的尺寸放在自己的座位上。等到他前往市集，卻忘了把尺寸帶在身上。\n\n他找到或挑中想要的鞋後，這才說：「我忘了帶量好的尺寸。」於是他返回家裡拿尺寸。等他再次回到市集，市集已經結束，所以最後沒能買到鞋。\n\n有人問他：「為什麼不用自己的腳直接試鞋？」\n\n他回答：「我寧可依照量好的尺寸，也不相信用自己的腳直接試鞋會更準確。」",
    comparisonRows: [],
    completionFeedback:
      "太了不起了！\n\n這篇古文不是別人先翻譯給你聽的。你自己比對線索，破解了物品、動作、方向、時間、代詞和人物的選擇，還用後面的結局反查前面的意思。\n\n你沒有背字典，卻真的把整篇古文讀懂了。這就是古文破譯家的本事！",
  },
  badgeName: "鄭人買履破譯徽章",
  badgeClaimLabel: "收集「鄭人買履」破譯徽章",
  badgeClaimSuccessMessage: "第七枚古文破譯徽章，收集成功！",
  badgeClaimMode: "scroll-end",
};
