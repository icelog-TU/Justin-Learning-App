/* eslint-disable max-lines */
// 此檔由 scripts/generate-shou-zhu-dai-tu-audit.mjs 依核准主檔機械產生。
// 不得手動改寫候選文字；主檔變更後應重新執行產生器並重新實聽。
import { getTtsInput } from '../lib/speech';
import {
  buildTargetFingerprint,
  buildUtteranceFingerprint,
} from '../lib/ttsAuditFingerprint';
import type {
  PronunciationAuditCatalogItem,
  PronunciationTarget,
} from './guwenPronunciationAudit';

type ShouZhuDaiTuAuditRow = {
  questionId: string;
  speechUnitId: string;
  source: string;
  text: string;
  targets: PronunciationTarget[];
};

const rows: ShouZhuDaiTuAuditRow[] = [
  {"questionId":"opening","speechUnitId":"opening-speech-002","source":"《守株待兔》任務開場｜畫面一｜AI 前來求助（主檔第 113 行）","text":"我看得出來，一次意外發生後，農夫改變了原本的生活；可是他為什麼這樣做，最後又發生了什麼事，我還讀不完整。","targets":[{"character":"為","occurrence":1,"zhuyin":"ㄨㄟˋ","homophoneCue":"位置的位","usage":"為什麼","cueMode":"known_usage"}]},
  {"questionId":"opening","speechUnitId":"opening-speech-005","source":"《守株待兔》任務開場｜畫面三｜等待孩子接受（主檔第 123 行）","text":"準備好後，我們就從農夫田裡那個陌生的東西開始。","targets":[{"character":"好","occurrence":1,"zhuyin":"ㄏㄠˇ","homophoneCue":"好人的好","usage":"完成妥當、準備妥當","cueMode":"known_usage"}]},
  {"questionId":"question-1","speechUnitId":"q1-speech-006","source":"《守株待兔》第1題｜線索二（主檔第 177 行）","text":"枯株倒在溪邊慢慢腐爛；等到明年，上面會長出木耳。","targets":[{"character":"倒","occurrence":1,"zhuyin":"ㄉㄠˇ","homophoneCue":"島","usage":"倒下、失去直立姿勢","cueMode":"known_usage"},{"character":"長","occurrence":1,"zhuyin":"ㄓㄤˇ","homophoneCue":"掌","usage":"生長、長出","cueMode":"known_usage"}]},
  {"questionId":"question-1","speechUnitId":"q1-speech-007","source":"《守株待兔》第1題｜提交假說（主檔第 181 行）","text":"哪一個假說能同時解開兩條線索中的株？","targets":[{"character":"假","occurrence":1,"zhuyin":"ㄐㄧㄚˇ","homophoneCue":"甲","usage":"假說、尚待驗證的說法","cueMode":"known_usage"},{"character":"說","occurrence":1,"zhuyin":"ㄕㄨㄛ","homophoneCue":"說話的說","usage":"說明、說出或假說","cueMode":"known_usage"},{"character":"解","occurrence":1,"zhuyin":"ㄐㄧㄝˇ","homophoneCue":"姐姐的姐","usage":"破解、解開或解鎖","cueMode":"known_usage"},{"character":"中","occurrence":1,"zhuyin":"ㄓㄨㄥ","homophoneCue":"鐘","usage":"在範圍、位置或群體裡","cueMode":"known_usage"}]},
  {"questionId":"question-1","speechUnitId":"q1-speech-010","source":"《守株待兔》第1題｜選項（主檔第 185 行）","text":"從樹上斷落、掉在地面的細小樹枝","targets":[{"character":"從","occurrence":1,"zhuyin":"ㄘㄨㄥˊ","homophoneCue":"叢","usage":"從某處開始、由","cueMode":"known_usage"},{"character":"地","occurrence":1,"zhuyin":"ㄉㄧˋ","homophoneCue":"弟","usage":"地面、地方","cueMode":"known_usage"}]},
  {"questionId":"question-1","speechUnitId":"q1-speech-012","source":"《守株待兔》第1題｜第一次答錯提示（主檔第 197 行）","text":"再追蹤一次砍樹後的位置：樹枝和上方的樹幹已經移走，哪一部分仍留在土裡？","targets":[{"character":"分","occurrence":1,"zhuyin":"ㄈㄣˋ","homophoneCue":"份","usage":"整體中的一部分","cueMode":"known_usage"}]},
  {"questionId":"question-2","speechUnitId":"q2-speech-004","source":"《守株待兔》第2題｜線索一（主檔第 276 行）","text":"羝羊觸藩，羸其角。","targets":[{"character":"角","occurrence":1,"zhuyin":"ㄐㄧㄠˇ","homophoneCue":"腳","usage":"動物頭上的角","cueMode":"known_usage"}]},
  {"questionId":"question-4","speechUnitId":"q4-speech-004","source":"《守株待兔》第4題｜線索一（主檔第 475 行）","text":"大風吹過，樹木折了，原本連在一起的樹幹分成兩段。","targets":[{"character":"大","occurrence":1,"zhuyin":"ㄉㄚˋ","homophoneCue":"大小的大","usage":"大小、程度大或頭銜用字","cueMode":"known_usage"},{"character":"過","occurrence":1,"zhuyin":"ㄍㄨㄛˋ","homophoneCue":"過年的過","usage":"經過、通過","cueMode":"known_usage"},{"character":"折","occurrence":1,"zhuyin":"ㄓㄜˊ","homophoneCue":"哲","usage":"彎折、折斷","cueMode":"unresolved_target"},{"character":"幹","occurrence":1,"zhuyin":"ㄍㄢˋ","homophoneCue":"幹部的幹","usage":"樹木的主幹","cueMode":"known_usage"},{"character":"分","occurrence":1,"zhuyin":"ㄈㄣ","homophoneCue":"分開的分","usage":"分開、區別或分組","cueMode":"known_usage"}]},
  {"questionId":"question-4","speechUnitId":"q4-speech-006","source":"《守株待兔》第4題｜線索二（主檔第 483 行）","text":"一雙手折了樹枝，花朵便從枝頭飄落。","targets":[{"character":"便","occurrence":1,"zhuyin":"ㄅㄧㄢˋ","homophoneCue":"變","usage":"就、於是","cueMode":"known_usage"}]},
  {"questionId":"question-4","speechUnitId":"q4-speech-009","source":"《守株待兔》第4題｜選項（主檔第 490 行）","text":"受到力量而彎斷或斷裂","targets":[{"character":"量","occurrence":1,"zhuyin":"ㄌㄧㄤˋ","homophoneCue":"亮","usage":"力量、力氣","cueMode":"known_usage"}]},
  {"questionId":"question-5","speechUnitId":"q5-speech-004","source":"《守株待兔》第5題｜選項（主檔第 589 行）","text":"兔子的頸部折斷，接著死了","targets":[{"character":"頸","occurrence":1,"zhuyin":"ㄐㄧㄥˇ","homophoneCue":"井","usage":"頸部、脖子","cueMode":"known_usage"}]},
  {"questionId":"question-5","speechUnitId":"q5-speech-005","source":"《守株待兔》第5題｜選項（主檔第 590 行）","text":"兔子低下頭，在樹樁旁邊睡著了","targets":[{"character":"著","occurrence":1,"zhuyin":"ㄓㄠˊ","homophoneCue":"著火的著","usage":"進入睡眠狀態","cueMode":"known_usage"}]},
  {"questionId":"question-6","speechUnitId":"q6-speech-003","source":"《守株待兔》第6題｜線索一（主檔第 669 行）","text":"揉木為耒。","targets":[{"character":"為","occurrence":1,"zhuyin":"ㄨㄟˊ","homophoneCue":"圍","usage":"成為、做成","cueMode":"known_usage"}]},
  {"questionId":"question-6","speechUnitId":"q6-speech-008","source":"《守株待兔》第6題｜選項（主檔第 687 行）","text":"農夫裝種子和糧食的布袋","targets":[{"character":"種","occurrence":1,"zhuyin":"ㄓㄨㄥˇ","homophoneCue":"腫","usage":"種子","cueMode":"known_usage"}]},
  {"questionId":"question-7","speechUnitId":"q7-speech-003","source":"《守株待兔》第7題｜線索一（主檔第 779 行）","text":"有賣油翁釋擔而立。","targets":[{"character":"擔","occurrence":1,"zhuyin":"ㄉㄢˋ","homophoneCue":"蛋","usage":"擔子、用肩挑的物品","cueMode":"known_usage"}]},
  {"questionId":"question-7","speechUnitId":"q7-speech-006","source":"《守株待兔》第7題｜線索二（主檔第 791 行）","text":"廚師原本手裡拿著刀，後來釋刀回答；這時刀已經不在手裡。","targets":[{"character":"答","occurrence":1,"zhuyin":"ㄉㄚˊ","homophoneCue":"達","usage":"回答","cueMode":"known_usage"}]},
  {"questionId":"question-7","speechUnitId":"q7-speech-010","source":"《守株待兔》第7題｜選項（主檔第 799 行）","text":"把原本拿著或挑著的東西交給另一個人","targets":[{"character":"著","occurrence":1,"zhuyin":"ㄓㄜ˙","homophoneCue":"輕聲","usage":"接在動作後表示持續或承接","cueMode":"known_usage"},{"character":"挑","occurrence":1,"zhuyin":"ㄊㄧㄠ","homophoneCue":"挑選的挑","usage":"用肩膀承擔或拿著","cueMode":"known_usage"},{"character":"給","occurrence":1,"zhuyin":"ㄍㄟˇ","homophoneCue":"給你的給","usage":"交付、使對方得到","cueMode":"known_usage"}]},
  {"questionId":"question-8","speechUnitId":"q8-speech-002","source":"《守株待兔》第8題｜線索一（主檔第 892 行）","text":"有行人見之，因竊取獐而去。","targets":[{"character":"行","occurrence":1,"zhuyin":"ㄒㄧㄥˊ","homophoneCue":"形","usage":"行走、行動","cueMode":"known_usage"}]},
  {"questionId":"question-8","speechUnitId":"q8-speech-004","source":"《守株待兔》第8題｜線索二（主檔第 900 行）","text":"婦見雨將至，因收衣入室。","targets":[{"character":"見","occurrence":1,"zhuyin":"ㄐㄧㄢˋ","homophoneCue":"建","usage":"看見、會面","cueMode":"known_usage"},{"character":"雨","occurrence":1,"zhuyin":"ㄩˇ","homophoneCue":"雨水的雨","usage":"雨水、下雨","cueMode":"known_usage"},{"character":"將","occurrence":1,"zhuyin":"ㄐㄧㄤ","homophoneCue":"江","usage":"將要、即將","cueMode":"known_usage"},{"character":"衣","occurrence":1,"zhuyin":"ㄧ","homophoneCue":"依","usage":"衣服、衣物","cueMode":"known_usage"}]},
  {"questionId":"question-9","speechUnitId":"q9-speech-007","source":"《守株待兔》第9題｜第一次答錯提示（主檔第 1034 行）","text":"按照原文順序，再看看農夫先怎麼處理農具，接著去了哪裡。","targets":[{"character":"處","occurrence":1,"zhuyin":"ㄔㄨˇ","homophoneCue":"楚","usage":"處理、處置","cueMode":"known_usage"}]},
  {"questionId":"question-10","speechUnitId":"q10-speech-002","source":"《守株待兔》第10題｜線索一（主檔第 1096 行）","text":"冀君實或見恕也。","targets":[{"character":"見","occurrence":1,"zhuyin":"ㄐㄧㄢˋ","homophoneCue":"建","usage":"放在動作前表示被動","cueMode":"known_usage"}]},
  {"questionId":"question-10","speechUnitId":"q10-speech-005","source":"《守株待兔》第10題｜線索二（主檔第 1108 行）","text":"皇帝發現將軍犯下大錯，卻暫時沒有把事情公開，冀他能改過自新。","targets":[{"character":"發","occurrence":1,"zhuyin":"ㄈㄚ","homophoneCue":"發現的發","usage":"發現、察覺","cueMode":"known_usage"}]},
  {"questionId":"question-10","speechUnitId":"q10-speech-011","source":"《守株待兔》第10題｜第一次答錯提示（主檔第 1128 行）","text":"司馬光還沒有原諒王安石，犯錯的將軍也還沒有改過。兩句都在等待哪一個結果成真？","targets":[{"character":"還","occurrence":1,"zhuyin":"ㄏㄞˊ","homophoneCue":"孩","usage":"仍然、尚且","cueMode":"known_usage"},{"character":"沒","occurrence":1,"zhuyin":"ㄇㄟˊ","homophoneCue":"梅","usage":"否定、沒有","cueMode":"known_usage"},{"character":"將","occurrence":1,"zhuyin":"ㄐㄧㄤ","homophoneCue":"江","usage":"將軍、軍事首領","cueMode":"known_usage"},{"character":"過","occurrence":1,"zhuyin":"ㄍㄨㄛˋ","homophoneCue":"過年的過","usage":"改正過錯","cueMode":"known_usage"},{"character":"都","occurrence":1,"zhuyin":"ㄉㄡ","homophoneCue":"兜","usage":"全部","cueMode":"known_usage"},{"character":"待","occurrence":1,"zhuyin":"ㄉㄞˋ","homophoneCue":"袋","usage":"等待、留到後來","cueMode":"known_usage"},{"character":"哪","occurrence":1,"zhuyin":"ㄋㄚˇ","homophoneCue":"哪裡的哪","usage":"疑問代詞","cueMode":"known_usage"},{"character":"結","occurrence":1,"zhuyin":"ㄐㄧㄝˊ","homophoneCue":"結果的結","usage":"結果、結論","cueMode":"known_usage"}]},
  {"questionId":"question-11","speechUnitId":"q11-speech-003","source":"《守株待兔》第11題｜線索一（主檔第 1210 行）","text":"扁鵲先前已經見過蔡桓公。過了十天，扁鵲復來見他。","targets":[{"character":"過","occurrence":1,"zhuyin":"ㄍㄨㄛˋ","homophoneCue":"過年的過","usage":"接在動作後表示曾經發生","cueMode":"known_usage"}]},
  {"questionId":"question-11","speechUnitId":"q11-speech-004","source":"《守株待兔》第11題｜線索二（主檔第 1214 行）","text":"屠懼，投以骨。一狼得骨止，一狼仍從；復投之。","targets":[{"character":"從","occurrence":1,"zhuyin":"ㄘㄨㄥˊ","homophoneCue":"叢","usage":"跟隨","cueMode":"known_usage"}]},
  {"questionId":"question-12","speechUnitId":"q12-speech-006","source":"《守株待兔》第12題｜答對回饋（主檔第 1336 行）","text":"重建成功！「冀復得兔」是農夫希望再得到兔子。這是他的願望，還不是已經發生的結果。","targets":[{"character":"重","occurrence":1,"zhuyin":"ㄔㄨㄥˊ","homophoneCue":"蟲","usage":"重新組合或再次進行","cueMode":"known_usage"},{"character":"得","occurrence":1,"zhuyin":"ㄉㄜˊ","homophoneCue":"德","usage":"取得、得到","cueMode":"known_usage"},{"character":"得","occurrence":2,"zhuyin":"ㄉㄜˊ","homophoneCue":"德","usage":"取得、得到","cueMode":"known_usage"},{"character":"發","occurrence":1,"zhuyin":"ㄈㄚ","homophoneCue":"發現的發","usage":"發生、出現","cueMode":"known_usage"}]},
  {"questionId":"question-14","speechUnitId":"q14-speech-003","source":"《守株待兔》第14題｜線索一（主檔第 1495 行）","text":"這種禍事，近的後果先落到身上，影響更遠時才會連累子孫。","targets":[{"character":"種","occurrence":1,"zhuyin":"ㄓㄨㄥˇ","homophoneCue":"腫","usage":"種類","cueMode":"known_usage"},{"character":"落","occurrence":1,"zhuyin":"ㄌㄨㄛˋ","homophoneCue":"駱","usage":"落下、落空或落到","cueMode":"known_usage"},{"character":"更","occurrence":1,"zhuyin":"ㄍㄥˋ","homophoneCue":"更改的更","usage":"更加、程度增加","cueMode":"known_usage"},{"character":"會","occurrence":1,"zhuyin":"ㄏㄨㄟˋ","homophoneCue":"惠","usage":"會、可能或能夠","cueMode":"known_usage"},{"character":"累","occurrence":1,"zhuyin":"ㄌㄟˇ","homophoneCue":"壘","usage":"牽連、連累","cueMode":"known_usage"}]},
  {"questionId":"question-14","speechUnitId":"q14-speech-005","source":"《守株待兔》第14題｜線索二（主檔第 1503 行）","text":"有人殘暴地傷害別人，最後禍事都會落到身上。","targets":[{"character":"地","occurrence":1,"zhuyin":"ㄉㄜ˙","homophoneCue":"輕聲","usage":"接在修飾語後連接動作","cueMode":"known_usage"}]},
  {"questionId":"question-15","speechUnitId":"q15-speech-005","source":"《守株待兔》第15題｜線索二（主檔第 1611 行）","text":"莊宗的國家本來富強，他卻沉迷享樂，不管國事。最後自己被殺，國家也滅亡，為天下人笑話。","targets":[{"character":"強","occurrence":1,"zhuyin":"ㄑㄧㄤˊ","homophoneCue":"牆","usage":"強大、富強","cueMode":"known_usage"},{"character":"樂","occurrence":1,"zhuyin":"ㄌㄜˋ","homophoneCue":"快樂的樂","usage":"享樂、快樂","cueMode":"known_usage"}]},
  {"questionId":"question-16","speechUnitId":"q16-speech-007","source":"《守株待兔》第16題｜第一次答錯提示（主檔第 1732 行）","text":"身是農夫本人，為在這裡相當於「被」。再看看笑人的和被笑的人有沒有放對位置。","targets":[{"character":"夫","occurrence":1,"zhuyin":"ㄈㄨ","homophoneCue":"膚","usage":"成年男子或職業名稱後綴","cueMode":"known_usage"},{"character":"為","occurrence":1,"zhuyin":"ㄨㄟˊ","homophoneCue":"圍","usage":"被、表示被動","cueMode":"unresolved_target"},{"character":"相","occurrence":1,"zhuyin":"ㄒㄧㄤ","homophoneCue":"香","usage":"相當於、彼此比較","cueMode":"known_usage"},{"character":"當","occurrence":1,"zhuyin":"ㄉㄤ","homophoneCue":"噹","usage":"視為、當作","cueMode":"known_usage"},{"character":"看","occurrence":1,"zhuyin":"ㄎㄢˋ","homophoneCue":"看見的看","usage":"觀看、看見","cueMode":"known_usage"},{"character":"和","occurrence":1,"zhuyin":"ㄏㄜˊ","homophoneCue":"河","usage":"和、跟或連接並列項目","cueMode":"known_usage"}]},
  {"questionId":"question-17","speechUnitId":"q17-speech-008","source":"《守株待兔》第17題｜答對回饋（主檔第 1815 行）","text":"全文重建成功！一次意外讓農夫放下農具守著樹樁；他的願望落空，自己還被宋國人笑話。","targets":[{"character":"空","occurrence":1,"zhuyin":"ㄎㄨㄥ","homophoneCue":"天空的空","usage":"落空、沒有實現","cueMode":"known_usage"}]},
  {"questionId":"question-18","speechUnitId":"q18-speech-002","source":"《守株待兔》第18題｜分類卡（主檔第 1866 行）","text":"農夫覺得守著樹樁，比繼續耕田更值得。","targets":[{"character":"覺","occurrence":1,"zhuyin":"ㄐㄩㄝˊ","homophoneCue":"決","usage":"感覺、認為","cueMode":"known_usage"},{"character":"得","occurrence":1,"zhuyin":"ㄉㄜ˙","homophoneCue":"輕聲","usage":"接在動作或狀態後連接結果、程度","cueMode":"known_usage"}]},
  {"questionId":"question-18","speechUnitId":"q18-speech-006","source":"《守株待兔》第18題｜分類卡（主檔第 1870 行）","text":"農夫相信每天都一定會有兔子撞死在樹樁旁。","targets":[{"character":"相","occurrence":1,"zhuyin":"ㄒㄧㄤ","homophoneCue":"香","usage":"相信","cueMode":"known_usage"}]},
  {"questionId":"question-18","speechUnitId":"q18-speech-009","source":"《守株待兔》第18題｜答對回饋（主檔第 1893 行）","text":"證據檢查完成！我們分清楚文章有明確寫出來的內容，也沒有把其他想法當成原文。白話驗證卷軸解鎖了！","targets":[{"character":"當","occurrence":1,"zhuyin":"ㄉㄤ","homophoneCue":"噹","usage":"視為、當作","cueMode":"known_usage"}]},
  {"questionId":"question-18","speechUnitId":"q18-speech-010","source":"《守株待兔》第18題｜第一次答錯提示（主檔第 1897 行）","text":"找找看：哪些句子能在原文中直接找到？只要文章沒有明確寫出來，就放進另一類。","targets":[{"character":"只","occurrence":1,"zhuyin":"ㄓˇ","homophoneCue":"紙","usage":"僅僅、只有","cueMode":"known_usage"},{"character":"要","occurrence":1,"zhuyin":"ㄧㄠˋ","homophoneCue":"藥","usage":"需要、將要或要求","cueMode":"known_usage"}]},
];

export const SHOU_ZHU_DAI_TU_PRONUNCIATION_AUDIT_CATALOG: PronunciationAuditCatalogItem[] =
  rows.map((row) => {
    const displayText = row.text;
    const ttsInput = getTtsInput(displayText);
    const target = row.targets.map((item) => item.character).join('、');
    const intendedReading = row.targets
      .map((item) => `${item.homophoneCue}（${item.zhuyin}）`)
      .join('；');
    const fingerprintInput = {
      displayText,
      ttsInput,
      targets: row.targets,
      auditRevision: 1,
    };
    return {
      ...row,
      id: `shouzhudaitu-${row.speechUnitId}`,
      lessonId: 'shou-zhu-dai-tu',
      lessonNumber: 4,
      lessonTitle: '守株待兔',
      displayText,
      ttsInput,
      auditRevision: 1,
      targetFingerprint: buildTargetFingerprint(row.targets),
      utteranceFingerprint: buildUtteranceFingerprint(fingerprintInput),
      target,
      intendedReading,
      initialVerifications: [],
    };
  });
