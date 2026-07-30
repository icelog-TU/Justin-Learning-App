import type { GuwenLesson } from './guwenLesson';

export const changGanRuChengLesson: GuwenLesson = {
  "id": "chang-gan-ru-cheng",
  "contentRevision": "2026-07-30-approved-20",
  "title": "長竿入城",
  "source": "邯鄲淳《笑林》佚文，保存於《太平廣記》卷二六二。",
  "introHeadline": "古文破譯家，我有一篇古文讀不懂，想請你幫忙。",
  "introSpokenLine": "一個魯國人想進城，卻一直進不去。後來有人教他一個辦法。這個辦法真的解決問題了嗎？\n\n我已經找好幾條古文線索。我們先聽一次原文，再一步一步查清楚。",
  "splitIntroSpeechParagraphs": true,
  "acceptMissionLabel": "接受破譯任務",
  "fullText": "魯有執長竿入城門者，初豎執之，不可入；橫執之，亦不可入，計無所出。俄有老父至，曰：「吾非聖人，但見事多矣。何不以鋸中截而入？」遂依而截之。",
  "sentences": [
    "魯有執長竿入城門者，",
    "初豎執之，不可入；",
    "橫執之，亦不可入，",
    "計無所出。",
    "俄有老父至，",
    "曰：「吾非聖人，但見事多矣。",
    "何不以鋸中截而入？」",
    "遂依而截之。"
  ],
  "preserveAuthoredOptionOrder": true,
  "splitFeedbackParagraphs": true,
  "completeCorrectFeedbackAsCore": true,
  "steps": [
    {
      "id": "gan",
      "type": "evidence",
      "prerequisiteIds": [],
      "targetSentence": "魯有執長【竿】入城門者。",
      "intro": "故事一開始出現了「長竿」。我找到兩條有【竿】的線索，想請你幫我判斷。",
      "question": "【竿】最可能是哪一種東西？",
      "options": [
        "一個裝魚用的竹籃",
        "一根細長的竹木棍",
        "一條綁魚鉤的細線"
      ],
      "correctIndex": 1,
      "correctFeedback": "找到「竿」的鑰匙了！「竿」是細長的竹木棍；「長竿」就是很長的竹木棍。「長竿」的「長」唸作常（ㄔㄤˊ）。",
      "retryHint": "一條線索用它釣魚，另一條寫出它有八尺二寸長。哪一種東西同時符合？",
      "explanation": "第一條用竹竿釣魚，第二條直接寫出竹竿的長度。細長的竹木棍能解釋兩條線索；竹籃和細線都不能解釋「竹竿」。",
      "keyAwarded": {
        "code": "竿",
        "decodedEvidence": "細長的竹木棍"
      },
      "clues": [
        {
          "text": "試垂竹竿釣。",
          "highlight": "竿",
          "unlockedMeaning": "有人試著把竹【竿】垂向水面釣魚。",
          "source": "真實古文線索：孟浩然〈峴潭作〉。原文"
        },
        {
          "text": "竹竿通長八尺二寸。",
          "highlight": "竿",
          "unlockedMeaning": "竹【竿】從頭到尾長八尺二寸。",
          "source": "真實古文線索：《明會典》卷一五二。原文"
        }
      ]
    },
    {
      "id": "zhi",
      "type": "evidence",
      "prerequisiteIds": [
        "gan"
      ],
      "targetSentence": "魯有【執】長竿入城門者。",
      "intro": "舊鑰匙「有……者」會帶出某一個人。\n\n「執」這個動作還看不懂。我找到兩條線索，請你幫我比一比。",
      "question": "【執】最可能是什麼動作？",
      "options": [
        "把物品折成兩段",
        "把物品丟到遠處",
        "用手拿住物品"
      ],
      "correctIndex": 2,
      "correctFeedback": "「執」是用手拿住。第一句也讀懂了：魯國有一個拿著長竿、要進城門的人。",
      "retryHint": "人要怎麼控制筆和手杖，才能使用或交給別人？",
      "explanation": "兩條線索都寫人控制手中的物品，因此「用手拿住」最符合。折斷和丟出都不能解釋如何使用筆。",
      "keyAwarded": {
        "code": "執",
        "decodedEvidence": "用手拿住"
      },
      "finalDraftLine": "魯國有一個拿著長竿、要進城門的人。",
      "clues": [
        {
          "text": "欲法諸書，先求執筆。",
          "highlight": "執",
          "unlockedMeaning": "想學好書法，先要學會怎麼【執】筆。",
          "source": "真實古文線索：許容《說篆》。原文"
        },
        {
          "text": "獻杖者執末。",
          "highlight": "執",
          "unlockedMeaning": "把手杖交給別人時，送的人【執】手杖的末端。",
          "source": "真實古文線索：《禮記・曲禮上》。原文"
        }
      ]
    },
    {
      "id": "shu",
      "type": "evidence",
      "prerequisiteIds": [
        "zhi"
      ],
      "targetSentence": "初【豎】執之，不可入。",
      "intro": "魯國人先「豎」著拿竿。我找到兩條線索，請你判斷竿朝哪個方向。",
      "question": "【豎】最可能表示哪個方向？",
      "options": [
        "上下直立",
        "左右平放",
        "向後拖行"
      ],
      "correctIndex": 0,
      "correctFeedback": "「豎」的鑰匙到手！「豎」是讓物品上下直立。",
      "retryHint": "一條線索要把燈送到高處，另一條寫柱頭朝上。",
      "explanation": "長竿把燈籠送到高處，柱頭也朝上，兩條線索共同支持上下直立。其他方向無法解釋「高處」和「向上」。",
      "keyAwarded": {
        "code": "豎",
        "decodedEvidence": "讓物品上下直立"
      },
      "clues": [
        {
          "text": "各豎長竿，揭籠燈下照。",
          "highlight": "豎",
          "unlockedMeaning": "人們各自【豎】起長竿，把燈籠送到高處，讓燈光往下照。",
          "source": "真實古文線索：《宋史》卷一百四〈志第五十七・禮七〉（節錄）。中國哲學書電子化計劃全文｜同句轉錄掃描頁（原句見頁面首段）"
        },
        {
          "text": "柱倒，工人扶而豎之，柱頭向上。",
          "highlight": "豎",
          "unlockedMeaning": "柱子倒下，工人扶起並【豎】好它，柱頭朝向上方。",
          "source": "AI 仿古推理線索（非古籍原文）。來源骨幹：《三齊略記》「海神為之豎柱」及《古今圖書集成》所錄「豎竿一根」「竿頭置一環」。教材改寫：把海神豎柱與測量器具重組為工人扶起倒柱的單一畫面，補入「柱頭向上」作方向證據。參考原文"
        }
      ]
    },
    {
      "id": "heng",
      "type": "evidence",
      "prerequisiteIds": [
        "shu"
      ],
      "targetSentence": "【橫】執之，亦不可入。",
      "intro": "他又改成「橫」著拿竿。我找到兩條線索，請你追查新的方向。",
      "question": "【橫】最可能表示哪個方向？",
      "options": [
        "斜向下方",
        "左右平放",
        "上下直立"
      ],
      "correctIndex": 1,
      "correctFeedback": "「橫」是讓物品左右平放。「橫」在這裡唸作恆（ㄏㄥˊ）。",
      "retryHint": "鐵索要跨過江面，木頭的兩端也要分別碰到左右牆壁。",
      "explanation": "鐵索跨過江面，木頭兩端碰到左右牆壁，都形成左右延伸的畫面。上下直立和斜向下方都不符合。",
      "keyAwarded": {
        "code": "橫",
        "decodedEvidence": "讓物品左右平放"
      },
      "clues": [
        {
          "text": "以鐵索橫江，欲遏我舟師。",
          "highlight": "橫",
          "unlockedMeaning": "敵軍把鐵索【橫】在江面上，想攔住船隊。",
          "source": "真實古文線索：張煌言《北征紀略》（節錄）。原文"
        },
        {
          "text": "木長一丈，橫置門上，兩端皆著壁。",
          "highlight": "橫",
          "unlockedMeaning": "木頭長一丈，【橫】放在門的上方，左右兩端都碰到牆壁。",
          "source": "AI 仿古推理線索（非古籍原文）。來源骨幹：《古今圖書集成》「用橫竿一根……兩頭皆五尺」及車制中的「橫木」。教材改寫：保留長木左右兩端的結構，改成木頭橫放門上、兩端碰牆的短畫面。參考原文"
        }
      ]
    },
    {
      "id": "shu_heng_reconstruction",
      "type": "reconstruction",
      "prerequisiteIds": [
        "heng"
      ],
      "targetSentence": "初豎執之，不可入；橫執之，亦不可入。",
      "intro": "下面是我們已經取得的密碼鑰匙。",
      "question": "「初豎執之，不可入；橫執之，亦不可入」最符合下面哪一個選項？",
      "options": [
        "他先把竿直立拿著，進不去；又把竿平拿，仍然進不去",
        "他先把竿留在門外；又把竿截斷，終於走進城門",
        "他先把竿平拿，進不去；又把竿直立，原文沒有寫結果"
      ],
      "correctIndex": 0,
      "correctFeedback": "兩次嘗試重建成功！他先把長竿上下直立拿著，進不去；又把長竿左右平拿，仍然進不去。",
      "retryHint": "依序核對「豎、不可入、橫、亦不可入」。",
      "explanation": "第一個選項依原文順序保留兩種方向與兩次失敗。第二個加入後文才出現的截斷；第三個顛倒方向，也漏掉第二次結果。",
      "keyAwarded": {
        "code": "初豎執之，不可入；橫執之，亦不可入",
        "decodedEvidence": "先直拿失敗，再平拿仍然失敗"
      },
      "finalDraftLine": "他先把長竿上下直立拿著，進不去；又把長竿左右平拿，仍然進不去。",
      "keys": [
        {
          "code": "豎",
          "decodedEvidence": "上下直立"
        },
        {
          "code": "橫",
          "decodedEvidence": "左右平放"
        },
        {
          "code": "之",
          "decodedEvidence": "指前面的長竿"
        },
        {
          "code": "亦",
          "decodedEvidence": "仍然一樣"
        }
      ]
    },
    {
      "id": "ji_wu_suo_chu",
      "type": "evidence",
      "prerequisiteIds": [
        "shu_heng_reconstruction"
      ],
      "targetSentence": "【計無所出】。",
      "intro": "兩種拿法都失敗後，他「計無所出」。我找到兩段線索，請你判斷他陷入什麼狀態。",
      "question": "【計無所出】最可能表示什麼？",
      "options": [
        "想出很多辦法，正逐一嘗試",
        "不想處理問題，立刻離開",
        "想不出能解決問題的辦法"
      ],
      "correctIndex": 2,
      "correctFeedback": "「計無所出」表示遇到難題，卻想不出能解決問題的辦法。",
      "retryHint": "一段召集大家商議，另一段還需要別人提出建議。他們缺少什麼？",
      "explanation": "兩段人物都已經遇到難題，卻還需要討論或別人建議，因此缺少的是解決辦法。線索沒有寫他們已有很多辦法或立刻離開。",
      "keyAwarded": {
        "code": "計無所出",
        "decodedEvidence": "想不出能解決問題的辦法"
      },
      "clues": [
        {
          "text": "後主使羣臣會議，計無所出。",
          "highlight": "計無所出",
          "unlockedMeaning": "後主召集群臣商量難題，眾人商議後仍然【計無所出】。",
          "source": "真實古文線索：陳壽《三國志・蜀書・譙周傳》（節錄）。原文"
        },
        {
          "text": "陳平憂懼，計無所出。陸賈入見，說之。",
          "highlight": "計無所出",
          "unlockedMeaning": "陳平十分憂心，【計無所出】；後來陸賈來向他提出建議。",
          "source": "真實古文線索：北宋蘇洵〈上富丞相書〉（《皇朝文鑑》卷一百十七題作〈上富相公書〉，節錄）。維基文庫作品全文｜《皇朝文鑑》卷一百十七｜原刻掃描頁"
        }
      ]
    },
    {
      "id": "e",
      "type": "evidence",
      "prerequisiteIds": [
        "ji_wu_suo_chu"
      ],
      "targetSentence": "【俄】有老父至。",
      "intro": "原文接著出現「俄」。我找到兩條線索，請你比較前後事情隔了多久。",
      "question": "【俄】最可能提供什麼時間訊息？",
      "options": [
        "前事發生不久，後事就出現",
        "前後兩件事同時結束",
        "過了很久，後事才發生"
      ],
      "correctIndex": 0,
      "correctFeedback": "「俄」表示前面的事情發生不久，後面的事情就出現，可以讀成「過了不久」。「俄」唸作鵝（ㄜˊ）。",
      "retryHint": "兩條線索都先寫一幅畫面，接著很快出現新的變化。",
      "explanation": "談論文章後雪勢加大，兩個孩子哭後許多聲音出現，都表示前事之後不久發生新變化。線索沒有長時間等待。",
      "keyAwarded": {
        "code": "俄",
        "decodedEvidence": "過了不久"
      },
      "clues": [
        {
          "text": "與兒女講論文義。俄而雪驟。",
          "highlight": "俄",
          "unlockedMeaning": "一家人正在談論文章；【俄】而，雪勢加大了。",
          "source": "真實古文線索：劉義慶《世說新語・言語》（節錄）。原文"
        },
        {
          "text": "兩兒齊哭。俄而百千人大呼，百千兒哭。",
          "highlight": "俄",
          "unlockedMeaning": "兩個孩子一起哭；【俄】而，許多人也大喊，許多孩子哭。",
          "source": "真實古文線索：林嗣環〈口技〉（節錄），見張潮《虞初新志》。原文"
        }
      ]
    },
    {
      "id": "lao_fu",
      "type": "evidence",
      "prerequisiteIds": [
        "e"
      ],
      "targetSentence": "計無所出。俄有【老父】至。",
      "intro": "新人物叫作「老父」。我找到兩條線索，請你判斷這個稱呼表示什麼。",
      "question": "【老父】最可能是哪一類人？",
      "options": [
        "主角的父親",
        "年幼的男孩",
        "年長的男子"
      ],
      "correctIndex": 2,
      "correctFeedback": "「老父」是對年長男子的稱呼，「父」唸作府（ㄈㄨˇ）。這兩句是：魯國人想不出辦法；過了不久，一位年長男子來到。",
      "retryHint": "第一位年紀八十多歲；第二位沒有被寫成前文人物的父親。",
      "explanation": "兩條線索都以「老父」稱年長男子，並未建立父子關係。年幼男孩又和「年八十餘」衝突。",
      "keyAwarded": {
        "code": "老父",
        "decodedEvidence": "年長男子"
      },
      "finalDraftLine": "魯國人想不出辦法；過了不久，一位年長男子來到。",
      "clues": [
        {
          "text": "果有老父年八十餘，指其丘隴。",
          "highlight": "老父",
          "unlockedMeaning": "果然遇見一位【老父】，年紀八十多歲；他指出墳墓的位置。",
          "source": "真實古文線索：蘇軾〈與朱康叔十七首・之十五〉（節錄）。原文"
        },
        {
          "text": "有老父不知何出，常漁釣於涪水。",
          "highlight": "老父",
          "unlockedMeaning": "有一位【老父】，沒有人知道他從哪裡來；他常在涪水釣魚。",
          "source": "真實古文線索：范曄《後漢書・方術列傳》（節錄）。原文"
        }
      ]
    },
    {
      "id": "sheng_ren",
      "type": "evidence",
      "prerequisiteIds": [
        "lao_fu"
      ],
      "targetSentence": "曰：「吾非【聖人】，但見事多矣。」",
      "intro": "舊鑰匙「曰」表示後面接著這個人說的話。\n\n這句裡的「聖人」還不清楚。我找到兩條線索，請你比較這種人具有什麼特徵。",
      "question": "【聖人】最可能是哪一種人？",
      "options": [
        "才智和學問很高的人",
        "年紀很大的人",
        "永遠不會犯錯的人"
      ],
      "correctIndex": 0,
      "correctFeedback": "「聖人」指才智和學問很高的人；聖人仍可能想錯，也仍會向別人學習。",
      "retryHint": "第一條把「聖人」和愚人相對；第二條以孔子為例。",
      "explanation": "兩條線索都把聖人放在才智與學問很高的位置，但也明說他可能犯錯、繼續學習。因此不能理解成只看年紀或永遠不會錯。",
      "keyAwarded": {
        "code": "聖人",
        "decodedEvidence": "才智和學問很高的人"
      },
      "clues": [
        {
          "text": "聖人千慮，必有一失；愚人千慮，必有一得。",
          "highlight": "聖人",
          "unlockedMeaning": "【聖人】想了很多次，也可能有一次想錯；愚笨的人想了很多次，也可能有一次想對。",
          "source": "真實古文線索：《晏子春秋》。原文"
        },
        {
          "text": "聖人無常師。孔子師郯子、萇弘、師襄、老聃。",
          "highlight": "聖人",
          "unlockedMeaning": "【聖人】不只固定向一位老師學習；孔子曾向不同的人請教。",
          "source": "真實古文線索：韓愈〈師說〉（節錄）。原文"
        }
      ]
    },
    {
      "id": "dan",
      "type": "evidence",
      "prerequisiteIds": [
        "sheng_ren"
      ],
      "targetSentence": "吾非聖人，【但】見事多矣。",
      "intro": "我找到兩條有前因後果的線索，請你看看【但】前後各留下什麼。",
      "question": "【但】最可能怎麼連接前後？",
      "options": [
        "接出更早發生的事",
        "只留下後面這一項",
        "接出完全相反的事情"
      ],
      "correctIndex": 1,
      "correctFeedback": "這裡的「但」只留下後面的一項，可以讀成「只」或「只是」。",
      "retryHint": "第一條排除其他原因，第二條也先說月光和竹柏並不缺少。",
      "explanation": "兩條線索都先排除別的情況，再留下後面一項。它沒有表示時間，也不是現代「但是」常見的相反轉折。",
      "keyAwarded": {
        "code": "但",
        "decodedEvidence": "只、只是"
      },
      "clues": [
        {
          "text": "翁曰：「無他，但手熟爾。」",
          "highlight": "但",
          "unlockedMeaning": "（有人問賣油翁為什麼能把油倒得這麼好。）賣油翁說沒有其他特別原因，【但】練習了很多次罷了。",
          "source": "真實古文線索：歐陽修〈賣油翁〉「無他，但手熟爾」；孩子理解所需的提問前情只補在「已破解為」的白話文中。原文"
        },
        {
          "text": "何夜無月？何處無竹柏？但少閑人如吾兩人耳。",
          "highlight": "但",
          "unlockedMeaning": "哪一晚沒有月光？哪裡沒有竹柏？【但】缺少像我們兩個這樣，有空又有心情欣賞月光美景的人罷了。",
          "source": "真實古文線索：蘇軾〈記承天寺夜遊〉。原文"
        }
      ]
    },
    {
      "id": "jian_shi_duo",
      "type": "evidence",
      "prerequisiteIds": [
        "dan"
      ],
      "targetSentence": "吾非聖人，但【見事多】矣。",
      "intro": "我找到一位老木匠和一位老船夫的線索。請你看看，他們為什麼能很快知道該怎麼做。",
      "question": "【見事多】最可能表示什麼？",
      "options": [
        "眼睛能看得很遠",
        "看過、經歷過很多事情",
        "同時看見很多人"
      ],
      "correctIndex": 1,
      "correctFeedback": "「見事多」表示看過、經歷過很多事情。老人把這一點當成自己能提出建議的理由。",
      "retryHint": "一位做木工四十年，一位行船四十年；他們都能從眼前的跡象知道該怎麼做。",
      "explanation": "老木匠做了四十年，一看木板彎了就知道不能用；老船夫行船四十年，一見烏雲就叫大家回岸。兩人都因為看過、經歷過許多事情，能從眼前的跡象判斷接下來怎麼做；這不是視力或同時看見多少人的問題。",
      "keyAwarded": {
        "code": "見事多",
        "decodedEvidence": "看過、經歷過很多事情"
      },
      "clues": [
        {
          "text": "老匠見事多，見板曲，知其不可用。",
          "highlight": "見事多",
          "unlockedMeaning": "（老木匠已經做木工四十年。）他【見事多】，一看到木板彎了，就知道這塊木板不能使用。",
          "source": "混種古文線索（真實語料骨架＋AI 情境）：保留南宋陸游〈對酒作〉「見事多」的語料骨架；老木匠、木板彎曲與判斷情境由 AI 補寫。四十年的經驗只補在「已破解為」的白話前情中，不混入古文線索。原句見《劎南詩槀》卷七十六。維基文庫卷七十六｜《御選唐宋詩醇》卷四十七轉錄"
        },
        {
          "text": "老舟子見事多，見黑雲，知風雨將至，乃呼眾還岸。",
          "highlight": "見事多",
          "unlockedMeaning": "（老船夫已經行船四十年。）他【見事多】，看到烏雲，就知道風雨快來了，便叫大家回到岸邊。",
          "source": "混種古文線索（真實語料骨架＋AI 情境）：保留周濟《介存齋論詞雜著》「見事多」的語料骨架；老船夫、烏雲、風雨將至與回岸情境由 AI 補寫。四十年的經驗只補在「已破解為」的白話前情中，不混入古文線索。原文"
        }
      ]
    },
    {
      "id": "lao_fu_intro_reconstruction",
      "type": "reconstruction",
      "prerequisiteIds": [
        "jian_shi_duo"
      ],
      "targetSentence": "吾非聖人，但見事多矣。",
      "intro": "舊鑰匙「吾」指正在說話的人自己。\n\n下面是我們已經取得的密碼鑰匙。",
      "question": "「吾非聖人，但見事多矣」最符合下面哪一個選項？",
      "options": [
        "我不是聖人，只是看過、經歷過很多事情",
        "我是聖人，所以從來沒有判斷錯誤",
        "我不是老人，只是看見眼前有很多人"
      ],
      "correctIndex": 0,
      "correctFeedback": "老人的自我介紹重建成功！他說：「我不是聖人，只是看過、經歷過很多事情。」",
      "retryHint": "依序核對「吾、非、但、見事多」。",
      "explanation": "第一個選項完整保留否定與「只是」留下的理由。第二個把「非」改成「是」；第三個誤解「見事多」，也加入原文沒有的很多人。",
      "keyAwarded": {
        "code": "吾非聖人，但見事多矣",
        "decodedEvidence": "我不是聖人，只是看過、經歷過很多事情"
      },
      "finalDraftLine": "老人說：「我不是聖人，只是看過、經歷過很多事情。」",
      "keys": [
        {
          "code": "吾",
          "decodedEvidence": "說話的人自己"
        },
        {
          "code": "非",
          "decodedEvidence": "不是"
        },
        {
          "code": "聖人",
          "decodedEvidence": "才智和學問很高的人"
        },
        {
          "code": "但",
          "decodedEvidence": "只是"
        },
        {
          "code": "見事多",
          "decodedEvidence": "看過、經歷過很多事情"
        }
      ]
    },
    {
      "id": "he_bu",
      "type": "evidence",
      "prerequisiteIds": [
        "lao_fu_intro_reconstruction"
      ],
      "targetSentence": "【何不】以鋸中截而入？",
      "intro": "老人接著問「何不……」。我找到同一段古文裡的兩個例子，請你判斷這種問法在做什麼。",
      "question": "【何不】最可能怎麼讀？",
      "options": [
        "已經不能",
        "何時才會",
        "為什麼不"
      ],
      "correctIndex": 2,
      "correctFeedback": "「何不」可以讀成「為什麼不」，常用來追問或提出一個做法。",
      "retryHint": "兩句都在問對方為什麼沒有做後面的動作。",
      "explanation": "「何不戲」問為什麼不玩，「何不避車」問為什麼不避開車子，因此「為什麼不」能同時解釋兩句。",
      "keyAwarded": {
        "code": "何不",
        "decodedEvidence": "為什麼不"
      },
      "clues": [
        {
          "text": "二小兒作戲，一小兒不作戲。夫子怪而問曰：「何不戲乎？」",
          "highlight": "何不",
          "unlockedMeaning": "兩個孩子在玩，一個孩子沒有玩。孔子覺得奇怪，問他：「【何不】玩呢？」",
          "source": "真實古文線索：《孔子項託相問書》（節錄）。原文"
        },
        {
          "text": "小兒築城當路，夫子語曰：「何不避車？」",
          "highlight": "何不",
          "unlockedMeaning": "孩子在路上築小城，孔子對他說：「【何不】避開車子？」",
          "source": "真實古文線索：《孔子項託相問書》（教材節錄；通行文本作「夫子語小兒曰：何不避車」）。原文"
        }
      ]
    },
    {
      "id": "ju",
      "type": "evidence",
      "prerequisiteIds": [
        "he_bu"
      ],
      "targetSentence": "何不以【鋸】中截而入？",
      "intro": "老人要使用「鋸」。我找到兩條線索，請你判斷這是什麼工具。",
      "question": "【鋸】最可能是哪一種工具？",
      "options": [
        "把木頭切斷的工具",
        "把木頭黏合的工具",
        "測量木頭長度的工具"
      ],
      "correctIndex": 0,
      "correctFeedback": "「鋸」是來回拉動、把木頭切斷的工具。",
      "retryHint": "兩條線索最後都出現木頭斷開。",
      "explanation": "第一條把鋸和斧頭放在工人手中，第二條直接寫用鋸弄斷木頭，因此鋸是切斷木頭的工具，不是黏合或量長度。",
      "keyAwarded": {
        "code": "鋸",
        "decodedEvidence": "把木頭切斷的工具"
      },
      "clues": [
        {
          "text": "或執斧斤，或執刀鋸，皆環立向之。",
          "highlight": "鋸",
          "unlockedMeaning": "工人有的拿著斧頭，有的拿著刀和【鋸】，都圍著工匠首領站好。",
          "source": "真實古文線索：柳宗元〈梓人傳〉（節錄）。原文"
        },
        {
          "text": "以鋸斷木，以斧斷鎖。",
          "highlight": "鋸",
          "unlockedMeaning": "使用【鋸】弄斷木頭，使用斧頭砍斷鎖。",
          "source": "真實古文線索：《欽定續通志》卷四六七（節錄）。原文"
        }
      ]
    },
    {
      "id": "jie",
      "type": "evidence",
      "prerequisiteIds": [
        "ju"
      ],
      "targetSentence": "何不以鋸中【截】而入？",
      "intro": "我找到紙帶和木條的線索，卻還拿不準【截】是做了什麼，想請你幫我判斷。",
      "question": "【截】最可能表示做了什麼？",
      "options": [
        "在東西上畫一道線",
        "把一個東西分成兩段",
        "把兩個東西接在一起"
      ],
      "correctIndex": 1,
      "correctFeedback": "「截」表示把一個東西分成兩段。",
      "retryHint": "紙帶和木條原本各是一個，【截】過之後變成了幾段？",
      "explanation": "第一條裡，紙帶原本是一條，用剪刀【截】過之後成了兩段；第二條裡，木條原本是一根，用鋸子【截】過之後也成了兩段。兩條線索的共同變化，都是一個東西被分成兩段，因此「截」不是畫線，也不是把東西接起來。「中」另外告訴我們從中央下手，本題要破解的「截」則說明做了什麼。",
      "keyAwarded": {
        "code": "截",
        "decodedEvidence": "把一個東西分成兩段"
      },
      "clues": [
        {
          "text": "童以剪中截之，紙遂為二。",
          "highlight": "截",
          "unlockedMeaning": "（孩子手上有一條長紙帶。）他用剪刀從中央【截】紙帶，紙帶便成了兩段。",
          "source": "混種古文線索（真實語料骨架＋AI 情境）：保留《太平廣記》卷三二九「中截」的真實用法；孩子、剪刀與「紙遂為二」的情境由 AI 補寫。長紙帶的前情只補在「已破解為」的白話文中。原文"
        },
        {
          "text": "匠以鋸中截之，木遂為二。",
          "highlight": "截",
          "unlockedMeaning": "（工匠面前有一根長木條。）他用鋸子從中央【截】木條，木條便成了兩段。",
          "source": "混種古文線索（真實語料骨架＋AI 情境）：保留《吳門表隱》「中截」的真實用法；工匠、鋸子與「木遂為二」的情境由 AI 補寫。長木條的前情只補在「已破解為」的白話文中。原文"
        }
      ]
    },
    {
      "id": "advice_reconstruction",
      "type": "reconstruction",
      "prerequisiteIds": [
        "jie"
      ],
      "targetSentence": "何不以鋸中截而入？",
      "intro": "舊鑰匙「以＋工具」表示使用後面的工具。\n\n下面是我們已經取得的密碼鑰匙。",
      "question": "「何不以鋸中截而入」最符合下面哪一個選項？",
      "options": [
        "為什麼不把鋸子放在門中間，再拿長竿進去",
        "為什麼不量出長竿中點，卻不要破壞長竿",
        "為什麼不用鋸子從中間把長竿分成兩段，再進城門"
      ],
      "correctIndex": 2,
      "correctFeedback": "老人的建議重建成功！他問：「為什麼不用鋸子從中間把長竿分成兩段，再進城門？」",
      "retryHint": "核對使用什麼工具、「中」指出哪個位置，以及「截」會讓長竿發生什麼變化。",
      "explanation": "第三個選項依序保留「為什麼不、使用鋸子、從中間、把長竿分成兩段、再進入」。第一個把鋸子放到門中間；第二個刪掉把長竿分成兩段的動作。",
      "keyAwarded": {
        "code": "何不以鋸中截而入",
        "decodedEvidence": "為什麼不用鋸子從中間把長竿分成兩段，再進城門"
      },
      "finalDraftLine": "老人問：「為什麼不用鋸子從中間把長竿分成兩段，再進城門？」",
      "keys": [
        {
          "code": "何不",
          "decodedEvidence": "為什麼不"
        },
        {
          "code": "以鋸",
          "decodedEvidence": "使用鋸子"
        },
        {
          "code": "中",
          "decodedEvidence": "從中間"
        },
        {
          "code": "截",
          "decodedEvidence": "把一個東西分成兩段"
        },
        {
          "code": "而入",
          "decodedEvidence": "然後進入"
        }
      ]
    },
    {
      "id": "yi",
      "type": "evidence",
      "prerequisiteIds": [
        "advice_reconstruction"
      ],
      "targetSentence": "遂【依】而截之。",
      "intro": "每條線索都先交代別人說了什麼，再看人物後來怎麼做。請你判斷【依】表示人物怎麼回應別人的話。",
      "question": "【依】最可能表示什麼？",
      "options": [
        "沒聽完就離開",
        "照著對方的話去做",
        "提出相反的辦法"
      ],
      "correctIndex": 1,
      "correctFeedback": "「依」表示照著對方的話或辦法去做。",
      "retryHint": "兩條線索中的人物都在別人說完之後，做了對方所說的事。",
      "explanation": "媽媽要孩子收衣服，孩子接著收衣服；老師要孩子把書放回架上，孩子接著把書放回去。兩個人都照先前聽到的話採取行動，因此「照著做」最符合；線索沒有寫離開或提出相反辦法。",
      "keyAwarded": {
        "code": "依",
        "decodedEvidence": "照著對方的話或辦法去做"
      },
      "clues": [
        {
          "text": "母曰：「雨將至，收衣入屋。」兒依其言，即收衣。",
          "highlight": "依其言",
          "unlockedMeaning": "媽媽說快下雨了，要孩子把衣服收進屋裡。孩子【依其言】，馬上去收衣服。",
          "source": "混種古文線索（真實語料骨架＋AI 情境）：保留《凝陽董真人遇仙記》「依其言」的真實語料骨架；下雨、收衣與母子情境由 AI 補寫。原文"
        },
        {
          "text": "師曰：「書當歸架。」童依其言，即置書於架。",
          "highlight": "依其言",
          "unlockedMeaning": "老師說書應該放回架上。孩子【依其言】，立刻把書放回架上。",
          "source": "混種古文線索（真實語料骨架＋AI 情境）：保留《包公案》第二十一回「依其言」的真實語料骨架；老師、孩子與放書情境由 AI 補寫。原文"
        }
      ]
    },
    {
      "id": "ending_reconstruction",
      "type": "reconstruction",
      "prerequisiteIds": [
        "yi"
      ],
      "targetSentence": "遂依而截之。",
      "intro": "「遂」接出後續結果；「之」要回前文找所指的東西。\n\n下面是我們已經取得的密碼鑰匙。",
      "question": "「遂依而截之」最符合下面哪一個選項？",
      "options": [
        "魯國人拒絕建議，把鋸子截斷",
        "魯國人照著建議，截斷了城門",
        "魯國人於是照著建議，截斷了長竿"
      ],
      "correctIndex": 2,
      "correctFeedback": "結尾重建成功！魯國人於是照著老人的建議，截斷了長竿。原文沒有再寫他是否進了城門。",
      "retryHint": "「依」表示照做；「之」要指回老人建議截斷的東西。",
      "explanation": "第三個選項保留「遂、依、截」並讓「之」指回長竿。第一個把照做改成拒絕，第二個把被截斷的物品換成城門。原文到截斷長竿就結束，沒有明寫進城結果。",
      "keyAwarded": {
        "code": "遂依而截之",
        "decodedEvidence": "於是照著建議截斷長竿"
      },
      "finalDraftLine": "魯國人於是照著老人的建議，截斷了長竿。",
      "keys": [
        {
          "code": "遂",
          "decodedEvidence": "於是接著"
        },
        {
          "code": "依",
          "decodedEvidence": "照著建議做"
        },
        {
          "code": "截",
          "decodedEvidence": "把一個東西分成兩段"
        },
        {
          "code": "之",
          "decodedEvidence": "指前面的長竿"
        }
      ]
    }
  ],
  "sequenceOrderingClosing": {
    "id": "closing_sequence_order",
    "title": "第十九題：全文故事排序",
    "intro": "五張故事卡被打亂了，想請你依古文發生的順序排好。",
    "cards": [
      {
        "id": "A",
        "text": "老人建議用鋸子從中間截斷長竿。"
      },
      {
        "id": "B",
        "text": "魯國人拿著長竿，想進城門。"
      },
      {
        "id": "C",
        "text": "魯國人照著建議截斷長竿。"
      },
      {
        "id": "D",
        "text": "魯國人直拿、平拿都失敗，想不出辦法。"
      },
      {
        "id": "E",
        "text": "一位年長男子來到，說自己見過很多事情。"
      }
    ],
    "correctOrder": [
      "B",
      "D",
      "E",
      "A",
      "C"
    ],
    "correctFeedback": "全文順序重建成功！魯國人帶竿進城，兩種拿法都失敗；老人來到並提出截竿的辦法，魯國人最後照著做。",
    "retryHint": "先找故事開頭，再追蹤「失敗—老人來到—提出辦法—照做」。",
    "explanation": "原文先介紹拿長竿進城的人，再寫兩次失敗與想不出辦法；老人之後才來到、提出建議，魯國人最後照做。"
  },
  "evidenceMultiSelectClosing": {
    "id": "closing_evidence_multiselect",
    "title": "第二十題：全文證據檢查",
    "intro": "最後還有一些說法混在一起。請只勾選文章有明確寫出來的內容。",
    "options": [
      {
        "text": "魯國人先直拿長竿，後來又平拿。",
        "correct": true,
        "detail": "原文證據：「初豎執之……橫執之」。"
      },
      {
        "text": "城門比長竿短三尺。",
        "correct": false,
        "detail": "原文沒有寫城門尺寸。"
      },
      {
        "text": "老人說自己不是聖人，只是見過很多事情。",
        "correct": true,
        "detail": "原文證據：「吾非聖人，但見事多矣」。"
      },
      {
        "text": "魯國人最後成功走進城門。",
        "correct": false,
        "detail": "原文只寫到「遂依而截之」，沒有明寫成功進城。"
      },
      {
        "text": "老人建議從中間截斷長竿。",
        "correct": true,
        "detail": "原文證據：「何不以鋸中截而入？」"
      },
      {
        "text": "魯國人照著建議截斷長竿。",
        "correct": true,
        "detail": "原文證據：「遂依而截之」。"
      },
      {
        "text": "老人的辦法是最聰明、最好的辦法。",
        "correct": false,
        "detail": "文章沒有明寫這是最聰明、最好的辦法。"
      },
      {
        "text": "截斷以後，長竿仍能保持原來的用途。",
        "correct": false,
        "detail": "文章沒有說截斷後長竿能否保持原來用途。"
      }
    ],
    "correctFeedback": "證據檢查完成！文章明寫兩種拿法、老人的自我介紹與截竿建議，也明寫魯國人照做。城門尺寸、是否進城、辦法是否最好，以及截斷後還能不能照原用途使用，文章都沒有明確寫出來。",
    "retryHint": "每一項都回原文找一句直接證據；找不到就先不要勾。",
    "finalNote": "第 1、3、5、6 項都能在原文找到直接對應。原文沒有城門尺寸，也停在「截之」，沒有寫成功進城。讀者可以評估辦法或提出更好的做法，但那不是文章明寫。"
  },
  "finalVerification": {
    "prerequisiteStepIds": [
      "gan",
      "zhi",
      "shu",
      "heng",
      "shu_heng_reconstruction",
      "ji_wu_suo_chu",
      "e",
      "lao_fu",
      "sheng_ren",
      "dan",
      "jian_shi_duo",
      "lao_fu_intro_reconstruction",
      "he_bu",
      "ju",
      "jie",
      "advice_reconstruction",
      "yi",
      "ending_reconstruction",
      "closing_sequence_order",
      "closing_evidence_multiselect"
    ],
    "guideLine": "原文寫到魯國人截斷長竿就結束了，沒有明寫他後來是否成功進城，也沒有說老人的辦法是不是最好的辦法。",
    "translation": "魯國有一個拿著長竿、要進城門的人。一開始，他把長竿上下直立拿著，進不去；後來又把長竿左右平拿，仍然進不去，想不出還能怎麼做。\n\n過了不久，一位年長男子來到，說：「我不是聖人，只是看過、經歷過很多事情。為什麼不用鋸子從中間截斷長竿，再進城門呢？」\n\n魯國人於是照著老人的建議，截斷了長竿。",
    "comparisonRows": [],
    "completionFeedback": "你不只破解了每個古文字詞，還檢查了故事的先後和證據邊界。《長竿入城》全文破譯完成！"
  },
  "badgeName": "長竿證據檢查徽章",
  "badgeClaimLabel": "收集破譯徽章",
  "badgeClaimMode": "scroll-end"
};
