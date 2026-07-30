import type { GuwenLesson } from './guwenLesson';

export const yangShiZhiZiLesson: GuwenLesson = {
  "id": "yang-shi-zhi-zi",
  "contentRevision": "2026-07-30-approved-20",
  "title": "楊氏之子",
  "source": "南朝宋・劉義慶《世說新語・言語》",
  "introHeadline": "請古文破譯家接受委託",
  "introSpokenLine": "古文破譯家，我找到一篇九歲孩子和大人對話的古文。\n\n大人看著水果說了一句話，孩子馬上用一種鳥回答。我還沒看懂兩句話是怎麼接起來的，想請你幫我從古文裡找線索。",
  "splitIntroSpeechParagraphs": true,
  "acceptMissionLabel": "接受破譯任務",
  "fullText": "梁國楊氏子九歲，甚聰惠。孔君平詣其父，父不在，乃呼兒出。為設果，果有楊梅。孔指以示兒曰：「此是君家果。」兒應聲答曰：「未聞孔雀是夫子家禽。」",
  "sentences": [
    "梁國楊氏子九歲，甚聰惠。",
    "孔君平詣其父，父不在，乃呼兒出。",
    "為設果，果有楊梅。",
    "孔指以示兒曰：「此是君家果。」",
    "兒應聲答曰：「未聞孔雀是夫子家禽。」"
  ],
  "steps": [
    {
      "id": "shi",
      "type": "evidence",
      "prerequisiteIds": [],
      "targetSentence": "梁國楊【氏】子九歲。",
      "intro": "「楊氏子」中的「氏」是什麼意思？我依照真實古文的結構整理了兩條短線索，想請你幫我判斷。",
      "question": "【氏】放在姓的後面，連向什麼？",
      "options": [
        "這個人的名字",
        "這一姓的人家",
        "這個人住的地方"
      ],
      "correctIndex": 1,
      "correctFeedback": "【氏】放在姓後面，可以連向這一姓的人家；「楊氏子」就是姓楊人家的孩子。",
      "retryHint": "兩個孩子的名字是安和平；再看看「氏」前面的李、謝和父親的姓。",
      "explanation": "安的父親姓李，所以「李氏」連向李家；平的父親姓謝，所以「謝氏」連向謝家。「氏」不是孩子的名字，也不是居住地。",
      "clues": [
        {
          "text": "童名安，父姓李。安，李【氏】子也。",
          "highlight": "氏",
          "unlockedMeaning": "孩子名叫安，父親姓李。安是李【氏】的孩子。",
          "source": "AI 仿古推理線索（非古籍原文）；句型依據《大明高僧傳》「隰州李氏子也」。"
        },
        {
          "text": "童名平，父姓謝。平，謝【氏】子也。",
          "highlight": "氏",
          "unlockedMeaning": "孩子名叫平，父親姓謝。平是謝【氏】的孩子。",
          "source": "AI 仿古推理線索（非古籍原文）；句型依據《大明高僧傳》「保定易縣謝氏子也」。"
        }
      ],
      "keyAwarded": {
        "code": "氏",
        "decodedEvidence": "放在姓後面，可以連向這一姓的人家。"
      }
    },
    {
      "id": "shen",
      "type": "evidence",
      "prerequisiteIds": [
        "shi"
      ],
      "targetSentence": "梁國楊氏子九歲，【甚】聰惠。",
      "intro": "我找到兩條帶有明顯反應的線索，想請你判斷「甚」表示多強的程度。",
      "question": "「甚」表示的程度最接近哪一個？",
      "options": [
        "稍微",
        "普通",
        "很、非常"
      ],
      "correctIndex": 2,
      "correctFeedback": "「甚」會加強程度，表示很、非常；第一句是說：梁國有個姓楊人家的九歲孩子，非常聰明。",
      "retryHint": "老虎嚇得逃到遠處，大王高興得加封賞賜，都是很強的反應。",
      "explanation": "老虎「大駭、遠遁」，大王則立刻加封賞賜，兩幅畫面都不是微弱或普通程度，所以第三個假說最符合證據。",
      "clues": [
        {
          "text": "驢一鳴，虎大駭，遠遁，【甚】恐。",
          "highlight": "甚",
          "unlockedMeaning": "驢一叫，老虎嚇了一大跳，逃得遠遠的，【甚】害怕。",
          "source": "真實古文線索；柳宗元〈黔之驢〉，節錄。"
        },
        {
          "text": "大王聞之【甚】喜，加爵賞。",
          "highlight": "甚",
          "unlockedMeaning": "大王聽說敵軍退兵後，【甚】高興，便加封又賞賜將軍。",
          "source": "真實古文線索；《三國史記・列傳第一》，節錄。"
        }
      ],
      "keyAwarded": {
        "code": "甚",
        "decodedEvidence": "很、非常。"
      }
    },
    {
      "id": "yi",
      "type": "evidence",
      "prerequisiteIds": [
        "shen"
      ],
      "targetSentence": "孔君平【詣】其父。",
      "intro": "孔君平「詣其父」，我拿不準是誰移動。請你幫我比較兩條線索。",
      "question": "「詣＋人物」的移動方向是哪一個？",
      "options": [
        "從那個人身邊離開",
        "前往那個人所在之處",
        "請那個人來到自己這裡"
      ],
      "correctIndex": 1,
      "correctFeedback": "「詣＋人物」是前往那個人所在之處；拜訪情境中可理解成前去拜訪。",
      "retryHint": "劉備去了三次才見到諸葛亮；移動的人是劉備。",
      "explanation": "漁人前往太守那裡，劉備前往諸葛亮那裡，都是前面的人朝後面的人移動。現在還要判斷原文的「其父」是誰的父親。",
      "clues": [
        {
          "text": "及郡下，【詣】太守。",
          "highlight": "詣",
          "unlockedMeaning": "漁人到了郡城後【詣】太守，太守接著派人跟他去找桃花源。",
          "source": "真實古文線索；陶淵明〈桃花源記〉，節錄。"
        },
        {
          "text": "先主遂【詣】亮，凡三往，乃見。",
          "highlight": "詣",
          "unlockedMeaning": "劉備便【詣】諸葛亮，去了三次才見到他。",
          "source": "真實古文線索；《三國志・蜀書・諸葛亮傳》，節錄。"
        }
      ],
      "keyAwarded": {
        "code": "詣＋人物",
        "decodedEvidence": "前往那個人所在之處。"
      }
    },
    {
      "id": "kong_jun_ping_yi_qi_fu",
      "type": "reconstruction",
      "prerequisiteIds": [
        "yi"
      ],
      "targetSentence": "孔君平詣其父。",
      "intro": "「其父」還沒有說出是誰的父親，想請你把它接回前文。",
      "question": "「孔君平詣其父」最符合下面哪一個選項？",
      "options": [
        "孔君平前往楊氏子的父親那裡拜訪",
        "楊氏子的父親前往孔君平那裡拜訪",
        "孔君平前往自己的父親那裡拜訪"
      ],
      "correctIndex": 0,
      "correctFeedback": "孔君平前往楊氏子的父親那裡拜訪；「其父」指楊氏子的父親。",
      "retryHint": "「詣」前面是孔君平；「其」往前連到剛介紹的楊氏子。",
      "explanation": "「詣」決定移動的人是孔君平；「其父」連回前文的楊氏子。第二個選項顛倒移動方向，第三個選項則把「其」連錯人。",
      "keys": [
        {
          "code": "詣＋人物",
          "decodedEvidence": "前往那個人所在之處"
        },
        {
          "code": "其＋名詞",
          "decodedEvidence": "把後面的人或事物連回前文"
        }
      ],
      "keyAwarded": {
        "code": "孔君平前往楊氏子的父親那裡拜訪。",
        "decodedEvidence": "孔君平前往楊氏子的父親那裡拜訪。"
      }
    },
    {
      "id": "fu_bu_zai_nai_hu_er_chu",
      "type": "reconstruction",
      "prerequisiteIds": [
        "kong_jun_ping_yi_qi_fu"
      ],
      "targetSentence": "父不在，乃呼兒出。",
      "intro": "古文省略了是誰「呼兒出」，我需要你幫忙追蹤現場人物。",
      "question": "「父不在，乃呼兒出」最符合下面哪一個選項？",
      "options": [
        "父親不在，孩子於是叫孔君平出去",
        "父親不在，父親仍叫孩子出來",
        "父親不在，孔君平於是叫孩子出來"
      ],
      "correctIndex": 2,
      "correctFeedback": "第二句是說：孔君平前來拜訪楊氏子的父親；父親不在，孔君平於是叫孩子出來。",
      "retryHint": "父親既然不在，現場哪一個人最可能接著叫孩子出來？",
      "explanation": "父親不在，不能在現場完成叫人的動作；「兒」是被叫的人。接著前文最合理的主語是來訪者孔君平。",
      "keys": [
        {
          "code": "孔君平詣其父",
          "decodedEvidence": "孔君平前來拜訪楊氏子的父親"
        },
        {
          "code": "乃",
          "decodedEvidence": "前事發生後，接出後面的動作"
        }
      ],
      "keyAwarded": {
        "code": "父親不在，孔君平於是叫孩子出來。",
        "decodedEvidence": "父親不在，孔君平於是叫孩子出來。"
      }
    },
    {
      "id": "she",
      "type": "evidence",
      "prerequisiteIds": [
        "fu_bu_zai_nai_hu_er_chu"
      ],
      "targetSentence": "為【設】果。",
      "intro": "「設」後面接著待客的飲食，我找了兩條線索想請你判斷這個動作。",
      "question": "「設＋飲食」是什麼動作？",
      "options": [
        "準備、擺出飲食",
        "吃完、收走飲食",
        "分送、帶走飲食"
      ],
      "correctIndex": 0,
      "correctFeedback": "「設＋飲食」是準備、擺出飲食；「為設果」中的「為」唸作位（ㄨㄟˋ），表示替對方做這件事。",
      "retryHint": "兩條線索都在客人到來前後準備酒菜。",
      "explanation": "村人擺酒做飯，朋友來訪前也先備好飯菜，所以第一個假說能解釋兩幅待客畫面。原文中究竟是誰替誰擺水果，下一題再追蹤。",
      "clues": [
        {
          "text": "便要還家，【設】酒殺雞作食。",
          "highlight": "設",
          "unlockedMeaning": "村人邀請客人回家，【設】酒、殺雞做飯招待他。",
          "source": "真實古文線索；陶淵明〈桃花源記〉，節錄。"
        },
        {
          "text": "請【設】饌以候之。",
          "highlight": "設",
          "unlockedMeaning": "朋友快來了，主人請家人【設】飯菜等候他。",
          "source": "真實古文線索；《後漢書・范式傳》，節錄。"
        }
      ],
      "keyAwarded": {
        "code": "設＋飲食",
        "decodedEvidence": "準備、擺出飲食。"
      }
    },
    {
      "id": "wei_she_guo_person",
      "type": "reconstruction",
      "prerequisiteIds": [
        "she"
      ],
      "targetSentence": "為設果。",
      "intro": "「為設果」省略了兩個人物。我知道現場有主人家的孩子和來訪的客人，卻拿不準誰替誰準備水果。",
      "question": "「為設果」最符合下面哪一個選項？",
      "options": [
        "孔君平替楊氏子擺出水果",
        "楊氏子替孔君平擺出水果",
        "楊氏子的父親替兩人擺出水果"
      ],
      "correctIndex": 1,
      "correctFeedback": "「為設果」是楊氏子替孔君平擺出水果。",
      "retryHint": "父親不在；再看看誰是主人家的孩子，誰是來訪的客人。",
      "explanation": "孔君平是來客，楊氏子是主人家的孩子，因此由孩子擺出水果待客最符合前文。第一個選項顛倒主客，第三個選項則讓不在現場的父親做了動作。",
      "keys": [
        {
          "code": "孔君平",
          "decodedEvidence": "前來拜訪的客人"
        },
        {
          "code": "楊氏子",
          "decodedEvidence": "主人家的孩子"
        },
        {
          "code": "設＋飲食",
          "decodedEvidence": "準備、擺出飲食"
        }
      ],
      "keyAwarded": {
        "code": "楊氏子替孔君平擺出水果。",
        "decodedEvidence": "楊氏子替孔君平擺出水果。"
      }
    },
    {
      "id": "wei_she_guo_guo_you_yangmei",
      "type": "reconstruction",
      "prerequisiteIds": [
        "wei_she_guo_person"
      ],
      "targetSentence": "為設果，果有楊梅。",
      "intro": "前半句的人物已經確認了；後半句只寫「果有楊梅」，我需要你幫忙守住原文的證據邊界。",
      "question": "「為設果，果有楊梅」最符合下面哪一個選項？",
      "options": [
        "孩子替孔君平擺水果，水果中有楊梅",
        "孔君平替孩子擺水果，只有一顆楊梅",
        "孩子和孔君平一起摘下許多楊梅"
      ],
      "correctIndex": 0,
      "correctFeedback": "第三句是說：楊氏子替孔君平準備、擺出水果，水果中有楊梅。",
      "retryHint": "「果有楊梅」只告訴我們水果中有楊梅；再檢查哪個選項沒有多加數量或採摘動作。",
      "explanation": "第 7 題已確認由孩子替客人擺水果；「果有楊梅」只證明其中有楊梅。第二個選項顛倒主客又多出數量，第三個選項則多出採摘動作。",
      "keys": [
        {
          "code": "為設果",
          "decodedEvidence": "楊氏子替孔君平擺出水果"
        },
        {
          "code": "果有楊梅",
          "decodedEvidence": "水果中有楊梅"
        }
      ],
      "keyAwarded": {
        "code": "楊氏子替孔君平擺出水果，水果中有楊梅。",
        "decodedEvidence": "楊氏子替孔君平擺出水果，水果中有楊梅。"
      }
    },
    {
      "id": "shi_show",
      "type": "evidence",
      "prerequisiteIds": [
        "wei_she_guo_guo_you_yangmei"
      ],
      "targetSentence": "孔指以【示】兒。",
      "intro": "我找到兩條「示」前面都有指、舉動作的線索，想請你判斷它們的共同目的。",
      "question": "「示＋人物」表示什麼？",
      "options": [
        "把東西藏起來",
        "把東西交給對方保管",
        "把東西指或舉出來讓對方看"
      ],
      "correctIndex": 2,
      "correctFeedback": "「示＋人物」是把東西指或舉出來，讓那個人看。",
      "retryHint": "一個人指天空，另一個人舉玉玦；對方都能看到那樣東西。",
      "explanation": "兩條線索都先出現指或舉的動作，再把東西呈現在另一人眼前。它們沒有藏起或交付保管的證據。",
      "clues": [
        {
          "text": "父指天【示】之曰：「天也。」",
          "highlight": "示",
          "unlockedMeaning": "父親指著天空【示】孩子，說：「這是天。」",
          "source": "真實古文線索；《宋史・朱熹傳》，節錄。"
        },
        {
          "text": "舉所佩玉玦以【示】之者三，項王默然不應。",
          "highlight": "示",
          "unlockedMeaning": "（范增想催促項王趕快對付劉邦。）范增三次舉起自己佩帶的玉玦【示】項王，項王卻一直沒有採取行動。",
          "source": "真實古文線索；《史記・項羽本紀》，節錄。"
        }
      ],
      "keyAwarded": {
        "code": "示＋人物",
        "decodedEvidence": "把東西指或舉出來讓那個人看。"
      }
    },
    {
      "id": "kong_zhi_yi_shi_er_yue",
      "type": "reconstruction",
      "prerequisiteIds": [
        "shi_show"
      ],
      "targetSentence": "果有楊梅。孔指以示兒曰。",
      "intro": "「指以示兒」省略了被指的東西，我需要你幫忙從前文找回來，並確認接著是誰開口。",
      "question": "「孔指以示兒曰」最符合下面哪一個選項？",
      "options": [
        "孔君平指著楊梅讓楊氏子看，接著開口說話",
        "楊氏子指著楊梅讓孔君平看，接著開口說話",
        "孔君平拿起盤子交給楊氏子，接著由孩子說話"
      ],
      "correctIndex": 0,
      "correctFeedback": "孔君平指著剛出現的楊梅，讓楊氏子看，接著開口說話。",
      "retryHint": "句首的「孔」是做動作的人；往前找剛出現、可以用手指的東西。",
      "explanation": "「孔」指出動作者，「兒」指出看的人；前一句剛說盤中有楊梅，所以省略的物件是楊梅。「曰」又把後面的話接在孔君平之後。其他選項顛倒人物或說話者，也多出交付盤子的動作。",
      "keys": [
        {
          "code": "孔",
          "decodedEvidence": "做動作的孔君平"
        },
        {
          "code": "示＋人物",
          "decodedEvidence": "把東西指或舉出來讓那個人看"
        },
        {
          "code": "兒",
          "decodedEvidence": "楊氏子"
        },
        {
          "code": "曰",
          "decodedEvidence": "後面接著這個人說的話"
        }
      ],
      "keyAwarded": {
        "code": "孔君平指著楊梅讓楊氏子看，接著開口說話。",
        "decodedEvidence": "孔君平指著楊梅讓楊氏子看，接著開口說話。"
      }
    },
    {
      "id": "jun",
      "type": "evidence",
      "prerequisiteIds": [
        "kong_zhi_yi_shi_er_yue"
      ],
      "targetSentence": "此是【君】家果。",
      "intro": "我找到兩段面對面說話的古文，卻拿不準「君」指哪一邊的人，想請你幫我比較。",
      "question": "兩句中的「君」都指誰？",
      "options": [
        "正在說話的人自己",
        "正在聽話的那個人",
        "不在現場的另一個人"
      ],
      "correctIndex": 1,
      "correctFeedback": "「君」是說話者對正在聽話的人使用的稱呼；本句是孔君平對楊氏子說話，可理解成「你」或較禮貌的「您」。",
      "retryHint": "第一條是妻子對鄒忌說話，第二條是劉邦對張良說話；找出兩個「君」都落在哪一邊。",
      "explanation": "鄒忌正在聽妻子說話，張良正在聽劉邦說話，兩句的「君」都指說話者面前的聽話者，不是說話者自己，也不是不在場的第三人。原文接著寫張良出去邀項伯進來，也能確認劉邦是在請張良代為叫人。回到本篇，正在聽孔君平說話的是楊氏子。",
      "clues": [
        {
          "text": "妻曰：「【君】美甚。」",
          "highlight": "君",
          "unlockedMeaning": "妻子對鄒忌說：「【君】很英俊。」",
          "source": "真實古文線索；《戰國策・齊策一・鄒忌諷齊王納諫》，節錄。"
        },
        {
          "text": "【君】為我呼入。",
          "highlight": "君",
          "unlockedMeaning": "劉邦對張良說：「請【君】替我把項伯叫進來。」",
          "source": "真實古文線索；司馬遷《史記・項羽本紀》，節錄。"
        }
      ],
      "keyAwarded": {
        "code": "君",
        "decodedEvidence": "說話者對正在聽話的人使用的稱呼，本句指楊氏子。"
      }
    },
    {
      "id": "ci_shi_jun_jia_guo",
      "type": "story_reasoning",
      "prerequisiteIds": [
        "jun"
      ],
      "targetSentence": "孔指以示兒曰：「此是君家果。」",
      "intro": "孔君平指著楊梅說「此是君家果」，我想請你找出這句玩笑連起了哪兩個地方。",
      "question": "孔君平為什麼說楊梅是「君家果」？",
      "options": [
        "因為楊梅是孩子剛從樹上摘的",
        "因為楊家只准家人吃這種水果",
        "因為「楊梅」和「楊家」都有「楊」"
      ],
      "correctIndex": 2,
      "correctFeedback": "第四句是說：孔君平指著楊梅給孩子看，說「這是您家的水果」，把「楊梅」的「楊」和楊家連成一個玩笑。",
      "retryHint": "把「楊梅」和「楊氏子」放在一起看，找找相同的字。",
      "explanation": "原文只寫盤中有楊梅，沒有寫誰採摘，也沒有家中飲食規定。孔君平利用相同的「楊」字，把水果名稱和孩子的姓連起來。",
      "keyAwarded": {
        "code": "孔君平把「楊梅」的「楊」和楊家連在一起，戲稱它是楊家的水果。",
        "decodedEvidence": "孔君平把「楊梅」的「楊」和楊家連在一起，戲稱它是楊家的水果。"
      }
    },
    {
      "id": "ying_sheng",
      "type": "evidence",
      "prerequisiteIds": [
        "ci_shi_jun_jia_guo"
      ],
      "targetSentence": "兒【應聲】答曰。",
      "intro": "我找到兩幅人在接到難題後用「應聲」作出回應的畫面，卻拿不準中間隔了多久，想請你幫我比較。",
      "question": "「應聲」最接近哪一種反應？",
      "options": [
        "聽見話音就立刻回答",
        "過了很久才回答",
        "沒有聽清楚而不回答"
      ],
      "correctIndex": 0,
      "correctFeedback": "「應聲」表示聽見話音就立刻回應；楊氏子幾乎沒有停頓便開口回答。",
      "retryHint": "這兩個人都很聰明，反應也很快。再想想看，【應聲】是哪一種回答方式？",
      "explanation": "第一條中的人很聰明，面對難題時反應很快；第二條中的曹植必須在走完七步以前作出一首詩，他【應聲】便作出詩來。兩句都用「應聲」連接接到難題與作出回應，因此共同支持「聽見話音就立刻回答」，不支持久等或沒有回答。這還沒有告訴我們孩子回答了什麼。",
      "clues": [
        {
          "text": "每見難問，【應聲】而答。",
          "highlight": "應聲",
          "unlockedMeaning": "這個人很聰明，面對別人提出的難題，反應很快，能【應聲】回答。",
          "source": "真實古文線索；《世說新語・文學》劉孝標注引《魏氏春秋》，節錄。"
        },
        {
          "text": "文帝嘗令東阿王七步中作詩，不成者行大法。【應聲】便為詩曰……",
          "highlight": "應聲",
          "unlockedMeaning": "魏文帝命曹植在走完七步以前作出一首詩，做不出來就要受到重罰；曹植【應聲】便作出詩來。",
          "source": "真實古文線索；《世說新語・文學》，節錄。"
        }
      ],
      "keyAwarded": {
        "code": "應聲",
        "decodedEvidence": "話音一到就立刻回應。"
      }
    },
    {
      "id": "wei_wen",
      "type": "evidence",
      "prerequisiteIds": [
        "ying_sheng"
      ],
      "targetSentence": "【未聞】孔雀是夫子家禽。",
      "intro": "「未聞」出現在兩段談論所知消息的古文裡，想請你幫我判斷它表示哪一種情況。",
      "question": "「未聞」是什麼意思？",
      "options": [
        "沒有聽說過",
        "已經親眼看見",
        "聽過很多次"
      ],
      "correctIndex": 0,
      "correctFeedback": "「未聞」是沒有聽說過；孩子先用這句話表示自己從沒聽過後面那件事。",
      "retryHint": "第二條前半句說「吾嘗聞之矣」，表示哥哥回家的消息已經聽過；後半句換成【未聞】，兩邊的情況相同，還是相反？",
      "explanation": "第一條中，孔子先說以前知道顏回好學，再用【未聞】說明顏回去世後的情況；第二條先說哥哥回家的消息「吾嘗聞之矣」，再把弟弟回家的消息放在【未聞】的位置。兩條線索都用已經聽過的消息和【未聞】形成對比，因此「沒有聽說過」最能同時解釋兩句；它不是親眼看見，也不是聽過很多次。",
      "clues": [
        {
          "text": "哀公問：「弟子孰為好學？」孔子對曰：「有顏回者好學……今也則亡，【未聞】好學者也。」",
          "highlight": "未聞",
          "unlockedMeaning": "魯哀公問孔子的弟子中誰最好學。孔子先說以前有顏回，但是顏回去世了。他接著說：「現在，【未聞】還有像顏回那樣好學的人了。」",
          "source": "真實古文線索；《論語・雍也》，節錄。"
        },
        {
          "text": "童子曰：「兄歸，吾嘗聞之矣；弟歸，則【未聞】也。」",
          "highlight": "未聞",
          "unlockedMeaning": "孩子說：「哥哥已經回家的消息，我聽說了；弟弟已經回家的消息，我則【未聞】。」",
          "source": "混種古文線索（真實語料骨架＋AI 情境）；對比骨架「句踐事吳，則嘗聞之矣，受吳封爵則未之聞也」取自唐庚《三國雜事》；哥哥、弟弟返家的情境與「未聞」語序由 AI 改寫。"
        }
      ],
      "keyAwarded": {
        "code": "未聞",
        "decodedEvidence": "沒有聽說過。"
      }
    },
    {
      "id": "fu_zi",
      "type": "evidence",
      "prerequisiteIds": [
        "wei_wen"
      ],
      "targetSentence": "未聞孔雀是【夫子】家禽。",
      "intro": "兩段對話都用「夫子」稱呼面前的人，想請你判斷這是什麼稱呼。",
      "question": "「夫子」在兩段對話中是什麼稱呼？",
      "options": [
        "對自己父親的稱呼",
        "對年幼孩子的稱呼",
        "對面前男子或長者的尊稱"
      ],
      "correctIndex": 2,
      "correctFeedback": "「夫子」是對男子或長者的尊稱，本句指孔君平，可理解成「您」；「夫」唸作膚（ㄈㄨ）。",
      "retryHint": "第一條是國君對孟子說話，第二條是學生對孔子說話。",
      "explanation": "孟子和孔子都是說話者面前受尊敬的男子或長者，不是說話者的父親，也不是年幼孩子。回到本篇，楊氏子正對孔君平回答。",
      "clues": [
        {
          "text": "願【夫子】輔吾志，明以教我。",
          "highlight": "夫子",
          "unlockedMeaning": "國君對孟子說：「希望【夫子】幫助我實現心願，清楚地教導我。」",
          "source": "真實古文線索；《孟子・梁惠王上》。"
        },
        {
          "text": "【夫子】何哂由也？",
          "highlight": "夫子",
          "unlockedMeaning": "曾皙問孔子：「【夫子】為什麼笑子路呢？」",
          "source": "真實古文線索；《論語・先進》。"
        }
      ],
      "keyAwarded": {
        "code": "夫子",
        "decodedEvidence": "對面前男子或長者的尊稱，本句可理解成「您」。"
      }
    },
    {
      "id": "fu_zi_jia_qin",
      "type": "evidence",
      "prerequisiteIds": [
        "fu_zi"
      ],
      "targetSentence": "孔雀是夫子家【禽】。",
      "intro": "「夫子家禽」很容易被看成今天的「家禽」。我找到兩條古文，想請你先確認「禽」在這裡指什麼。",
      "question": "「孔雀是夫子家禽」中的「夫子家／禽」最接近哪一個？",
      "options": [
        "您家養來下蛋的動物",
        "您家的鳥",
        "夫子的家人"
      ],
      "correctIndex": 1,
      "correctFeedback": "古文中的「禽」在這裡指鳥；「夫子家／禽」要讀成「您家的鳥」，不是今天合成一詞的「家禽」。",
      "retryHint": "孔雀有兩隻腳和羽毛，也會像柳樹間的「鳴禽」一樣鳴叫。",
      "explanation": "兩條線索都把「禽」連到有羽毛、會鳴叫的鳥。成人已先判定句界是「夫子家／禽」，所以「家」屬於前面的「夫子家」。",
      "clues": [
        {
          "text": "二足而羽謂之【禽】。",
          "highlight": "禽",
          "unlockedMeaning": "有兩隻腳、身上有羽毛的，稱為【禽】。",
          "source": "真實古文線索；《爾雅・釋鳥》相關古注用語。"
        },
        {
          "text": "園柳變鳴【禽】。",
          "highlight": "禽",
          "unlockedMeaning": "園中柳樹間出現了鳴叫的【禽】。",
          "source": "真實古文線索；謝靈運〈登池上樓〉。"
        }
      ],
      "keyAwarded": {
        "code": "夫子家／禽",
        "decodedEvidence": "您家的鳥。"
      }
    },
    {
      "id": "wei_wen_kong_que_shi_fu_zi_jia_qin",
      "type": "reconstruction",
      "prerequisiteIds": [
        "fu_zi_jia_qin"
      ],
      "targetSentence": "兒應聲答曰：「未聞孔雀是夫子家禽。」",
      "intro": "回答中的鑰匙都找到了，想請你幫我把它們接成完整的話。",
      "question": "「兒應聲答曰：『未聞孔雀是夫子家禽。』」最符合下面哪一個選項？",
      "options": [
        "孩子立刻說：「沒有聽說過孔雀是您家的鳥。」",
        "孩子想了很久才說：「您家養了很多孔雀。」",
        "孩子立刻說：「我沒有看見您家的水果。」"
      ],
      "correctIndex": 0,
      "correctFeedback": "第五句是說：孩子聽見後立刻回答：「沒有聽說過孔雀是您家的鳥。」",
      "retryHint": "依序檢查「應聲」、「未聞」和「夫子家／禽」三把鑰匙。",
      "explanation": "第一個選項保留了立即回答、沒有聽說過和您家的鳥三項證據；另外兩項改掉了時間或談話內容。",
      "keys": [
        {
          "code": "應聲",
          "decodedEvidence": "聽見話音就立刻回應"
        },
        {
          "code": "未聞",
          "decodedEvidence": "沒有聽說過"
        },
        {
          "code": "夫子",
          "decodedEvidence": "對孔君平的尊稱，可理解成「您」"
        },
        {
          "code": "夫子家／禽",
          "decodedEvidence": "您家的鳥"
        }
      ],
      "keyAwarded": {
        "code": "孩子立刻回答",
        "decodedEvidence": "「沒有聽說過孔雀是您家的鳥。」"
      }
    },
    {
      "id": "dialogue_wordplay",
      "type": "story_reasoning",
      "prerequisiteIds": [
        "wei_wen_kong_que_shi_fu_zi_jia_qin"
      ],
      "targetSentence": "「此是君家果。」／「未聞孔雀是夫子家禽。」",
      "intro": "我把兩句話並排後，還是沒看懂孩子怎麼接住孔君平的玩笑，想請你幫我找出它們的關係。",
      "question": "孩子的回答和孔君平的話有什麼關係？",
      "options": [
        "孩子避開原來的話題，改談別的動物",
        "孩子承認每種同姓的東西都屬於那一家",
        "孩子照同樣結構，把「孔雀」連回姓孔的人"
      ],
      "correctIndex": 2,
      "correctFeedback": "孔君平把「楊梅」說成楊家的水果；孩子照同樣結構，把「孔雀」說成孔家的鳥，立刻把玩笑原樣回送。",
      "retryHint": "排成兩組看：楊梅—楊家—果；孔雀—孔家—鳥。",
      "explanation": "孩子沒有真的主張孔雀屬於孔家，而是借同一套說法指出：若名字同字就算那家的東西，那孔雀也能算孔家的鳥。",
      "keyAwarded": {
        "code": "楊梅—楊家果；孔雀—孔家鳥。孩子沿用大人的說法回敬同樣的文字玩笑。",
        "decodedEvidence": "楊梅—楊家果；孔雀—孔家鳥。孩子沿用大人的說法回敬同樣的文字玩笑。"
      }
    },
    {
      "id": "story_order_choice",
      "type": "story_reasoning",
      "prerequisiteIds": [
        "dialogue_wordplay"
      ],
      "targetSentence": "全文。",
      "intro": "每一幅畫面都破解了，但我把先後順序弄亂了，想請你幫我排回故事。",
      "question": "哪一個順序符合原文？",
      "options": [
        "設果 → 拜訪 → 回答 → 指楊梅 → 叫孩子",
        "拜訪 → 叫孩子 → 設果 → 指楊梅 → 立刻回答",
        "叫孩子 → 指楊梅 → 拜訪 → 設果 → 立刻回答"
      ],
      "correctIndex": 1,
      "correctFeedback": "故事順序是：孔君平拜訪孩子的父親未遇見，於是叫孩子出來；孩子設果待客，孔君平指著楊梅說笑，孩子立刻回答。",
      "retryHint": "先找開頭：孔君平必須先來拜訪，後面才會出現待客水果和對話。",
      "explanation": "原文依序寫來訪、叫孩子、擺水果、指楊梅和回答。其他兩個選項都把原因放到結果之後。",
      "keyAwarded": {
        "code": "拜訪父親未遇見 → 叫孩子出來 → 孩子設果 → 大人指楊梅說笑 → 孩子立刻回答。",
        "decodedEvidence": "拜訪父親未遇見 → 叫孩子出來 → 孩子設果 → 大人指楊梅說笑 → 孩子立刻回答。"
      }
    }
  ],
  "evidenceMultiSelectClosing": {
    "id": "closing_evidence_multiselect",
    "title": "第 20 題：全文證據檢查",
    "intro": "最後還有幾張故事卡混在一起，想請你只留下文章明確寫出的內容。",
    "options": [
      {
        "text": "楊氏子九歲，而且非常聰明",
        "correct": true,
        "detail": "第一、三、五、六項都能在原文找到直接文字。父親可能外出，但文章沒有說原因；「有楊梅」也不能證明沒有其他水果。"
      },
      {
        "text": "孩子的父親外出買東西",
        "correct": false,
        "detail": "第一、三、五、六項都能在原文找到直接文字。父親可能外出，但文章沒有說原因；「有楊梅」也不能證明沒有其他水果。"
      },
      {
        "text": "孩子擺出的水果中有楊梅",
        "correct": true,
        "detail": "第一、三、五、六項都能在原文找到直接文字。父親可能外出，但文章沒有說原因；「有楊梅」也不能證明沒有其他水果。"
      },
      {
        "text": "盤中只有楊梅，沒有別的水果",
        "correct": false,
        "detail": "第一、三、五、六項都能在原文找到直接文字。父親可能外出，但文章沒有說原因；「有楊梅」也不能證明沒有其他水果。"
      },
      {
        "text": "孔君平來訪時，孩子的父親不在",
        "correct": true,
        "detail": "第一、三、五、六項都能在原文找到直接文字。父親可能外出，但文章沒有說原因；「有楊梅」也不能證明沒有其他水果。"
      },
      {
        "text": "孩子立刻回答孔君平",
        "correct": true,
        "detail": "第一、三、五、六項都能在原文找到直接文字。父親可能外出，但文章沒有說原因；「有楊梅」也不能證明沒有其他水果。"
      }
    ],
    "correctFeedback": "原文明確寫出孩子九歲又聰明、父親不在、水果中有楊梅，以及孩子立刻回答；父親去了哪裡、盤中是否只有楊梅，都沒有明確寫出來。",
    "retryHint": "「父不在」只說父親不在；「果有楊梅」只說水果中有楊梅。",
    "finalNote": "第一、三、五、六項都能在原文找到直接文字。父親可能外出，但文章沒有說原因；「有楊梅」也不能證明沒有其他水果。",
    "submitButtonLabel": "請勾選「文章有明確寫出來」的敘述；沒有明確寫出的不要勾。"
  },
  "finalVerification": {
    "prerequisiteStepIds": [
      "shi",
      "shen",
      "yi",
      "kong_jun_ping_yi_qi_fu",
      "fu_bu_zai_nai_hu_er_chu",
      "she",
      "wei_she_guo_person",
      "wei_she_guo_guo_you_yangmei",
      "shi_show",
      "kong_zhi_yi_shi_er_yue",
      "jun",
      "ci_shi_jun_jia_guo",
      "ying_sheng",
      "wei_wen",
      "fu_zi",
      "fu_zi_jia_qin",
      "wei_wen_kong_que_shi_fu_zi_jia_qin",
      "dialogue_wordplay",
      "story_order_choice",
      "closing_evidence_multiselect"
    ],
    "guideLine": "原文沒有寫孩子的名字、父親去了哪裡、盤中是否還有其他水果，也沒有說孔雀真的屬於孔家。",
    "translation": "梁國有個姓楊人家的孩子，九歲，非常聰明。孔君平前來拜訪孩子的父親；父親不在，孔君平於是叫孩子出來。孩子替孔君平準備、擺出水果，水果中有楊梅。孔君平指著楊梅給孩子看，說：「這是您家的水果。」孩子聽見後立刻回答：「沒有聽說過孔雀是您家的鳥。」",
    "evidenceBoundary": [
      "原文沒有寫孩子的名字、父親去了哪裡、盤中是否還有其他水果，也沒有說孔雀真的屬於孔家。"
    ],
    "comparisonRows": [],
    "completionFeedback": "破譯完成，可以解鎖白話驗證卷軸。"
  },
  "badgeClaimLabel": "收集破譯徽章",
  "badgeClaimMode": "scroll-end",
  "preserveAuthoredOptionOrder": true,
  "splitFeedbackParagraphs": true,
  "completeCorrectFeedbackAsCore": true
};
