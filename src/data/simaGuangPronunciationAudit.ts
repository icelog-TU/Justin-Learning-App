/* eslint-disable max-lines */
// 此檔由 scripts/generate-sima-guang-audit.mjs 依核准主檔機械產生。
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

type SimaGuangAuditRow = {
  questionId: string;
  speechUnitId: string;
  source: string;
  text: string;
  targets: PronunciationTarget[];
};

const rows: SimaGuangAuditRow[] = [
  {"questionId":"opening","speechUnitId":"opening-speech-003","source":"《司馬光破甕救友》任務開場｜App 畫面 1｜向破譯家求助（主檔第 103 行）","text":"我找到了幾條其他古文線索，但要怎麼解讀，得請你這位專家來判斷。你願意幫我把事情經過一點一點讀回來嗎？","targets":[{"character":"幾","occurrence":1,"zhuyin":"ㄐㄧˇ","homophoneCue":"己","usage":"多少或不定的少數","cueMode":"known_usage"},{"character":"要","occurrence":1,"zhuyin":"ㄧㄠˋ","homophoneCue":"藥","usage":"需要、將要或要求","cueMode":"known_usage"},{"character":"得","occurrence":1,"zhuyin":"ㄉㄟˇ","homophoneCue":"得要的得","usage":"必須、需要","cueMode":"known_usage"},{"character":"過","occurrence":1,"zhuyin":"ㄍㄨㄛˋ","homophoneCue":"過年的過","usage":"事情發展的過程","cueMode":"known_usage"}]},
  {"questionId":"question-1","speechUnitId":"q1-speech-004","source":"《司馬光破甕救友》第1題｜已破解為（主檔第 188 行）","text":"虞舜曾經於歷山這個地方耕田。","targets":[{"character":"曾","occurrence":1,"zhuyin":"ㄘㄥˊ","homophoneCue":"層","usage":"曾經、過去發生過","cueMode":"known_usage"}]},
  {"questionId":"question-1","speechUnitId":"q1-speech-005","source":"《司馬光破甕救友》第1題｜真實古文線索二（主檔第 196 行）","text":"子路宿於石門。","targets":[{"character":"宿","occurrence":1,"zhuyin":"ㄙㄨˋ","homophoneCue":"素","usage":"住宿、過夜","cueMode":"known_usage"}]},
  {"questionId":"question-1","speechUnitId":"q1-speech-012","source":"《司馬光破甕救友》第1題｜第一次答錯提示（主檔第 230 行）","text":"回到兩條線索：耕田和過夜分別在哪裡發生？再看看「歷山」和「石門」都放在「於」的哪一邊。","targets":[{"character":"過","occurrence":1,"zhuyin":"ㄍㄨㄛˋ","homophoneCue":"過年的過","usage":"度過一段時間","cueMode":"known_usage"},{"character":"分","occurrence":1,"zhuyin":"ㄈㄣ","homophoneCue":"分開的分","usage":"分開、區別或分組","cueMode":"known_usage"}]},
  {"questionId":"question-2","speechUnitId":"q2-speech-008","source":"《司馬光破甕救友》第2題｜選項（主檔第 341 行）","text":"一種用來從井裡打水的長柄工具","targets":[{"character":"長","occurrence":1,"zhuyin":"ㄔㄤˊ","homophoneCue":"常","usage":"長度很長","cueMode":"known_usage"}]},
  {"questionId":"question-2","speechUnitId":"q2-speech-012","source":"《司馬光破甕救友》第2題｜第一次答錯提示（主檔第 359 行）","text":"請把兩條證據放在一起：它可以被人抱著去澆水，熱油也能倒進它的裡面。哪個假說兩邊都說得通？","targets":[{"character":"著","occurrence":1,"zhuyin":"ㄓㄜ˙","homophoneCue":"輕聲","usage":"接在動作後表示狀態持續","cueMode":"known_usage"},{"character":"倒","occurrence":1,"zhuyin":"ㄉㄠˋ","homophoneCue":"到","usage":"把液體傾入","cueMode":"known_usage"},{"character":"假","occurrence":1,"zhuyin":"ㄐㄧㄚˇ","homophoneCue":"甲","usage":"假說、尚待驗證的說法","cueMode":"known_usage"},{"character":"說","occurrence":1,"zhuyin":"ㄕㄨㄛ","homophoneCue":"說話的說","usage":"假說、尚待驗證的說法","cueMode":"known_usage"},{"character":"得","occurrence":1,"zhuyin":"ㄉㄜ˙","homophoneCue":"輕聲","usage":"接在動作後表示結果、程度或感受","cueMode":"known_usage"}]},
  {"questionId":"question-5","speechUnitId":"q5-speech-004","source":"《司馬光破甕救友》第5題｜選項（主檔第 687 行）","text":"本篇這個甕有一定大小，足以讓孩子往上爬","targets":[{"character":"大","occurrence":1,"zhuyin":"ㄉㄚˋ","homophoneCue":"大小的大","usage":"大小或程度大","cueMode":"known_usage"}]},
  {"questionId":"question-5","speechUnitId":"q5-speech-006","source":"《司馬光破甕救友》第5題｜選項（主檔第 689 行）","text":"本篇的甕放在樹旁，孩子爬上去是為了摘果子","targets":[{"character":"為","occurrence":1,"zhuyin":"ㄨㄟˋ","homophoneCue":"位置的位","usage":"為了、表示目的","cueMode":"known_usage"}]},
  {"questionId":"question-6","speechUnitId":"q6-speech-004","source":"《司馬光破甕救友》第6題｜已破解為（主檔第 784 行）","text":"走過危險的橋時，擔心自己會足跌。","targets":[{"character":"過","occurrence":1,"zhuyin":"ㄍㄨㄛˋ","homophoneCue":"過年的過","usage":"經過、通過","cueMode":"known_usage"},{"character":"會","occurrence":1,"zhuyin":"ㄏㄨㄟˋ","homophoneCue":"惠","usage":"會、可能或能夠","cueMode":"known_usage"}]},
  {"questionId":"question-6","speechUnitId":"q6-speech-006","source":"《司馬光破甕救友》第6題｜已破解為（主檔第 796 行）","text":"曾公亮先足跌，接著整個人倒在地上。","targets":[{"character":"曾","occurrence":1,"zhuyin":"ㄗㄥ","homophoneCue":"增","usage":"姓氏「曾」","cueMode":"known_usage"},{"character":"倒","occurrence":1,"zhuyin":"ㄉㄠˇ","homophoneCue":"島","usage":"倒下、失去直立姿勢","cueMode":"known_usage"}]},
  {"questionId":"question-7","speechUnitId":"q7-speech-007","source":"《司馬光破甕救友》第7題｜推理提問（主檔第 931 行）","text":"一座鼎沒水中後，在水面上看不見；石碑只有一半沒水中，所以另一半還露在外面。沒水中最可能是哪個位置變化？","targets":[{"character":"沒","occurrence":1,"zhuyin":"ㄇㄛˋ","homophoneCue":"默","usage":"沉入水中或進入水面以下","cueMode":"unresolved_target"},{"character":"中","occurrence":1,"zhuyin":"ㄓㄨㄥ","homophoneCue":"鐘","usage":"在範圍或水裡","cueMode":"known_usage"},{"character":"見","occurrence":1,"zhuyin":"ㄐㄧㄢˋ","homophoneCue":"建","usage":"看見、發現","cueMode":"known_usage"},{"character":"只","occurrence":1,"zhuyin":"ㄓˇ","homophoneCue":"紙","usage":"僅僅、只有","cueMode":"known_usage"},{"character":"還","occurrence":1,"zhuyin":"ㄏㄞˊ","homophoneCue":"孩","usage":"仍然、尚且","cueMode":"known_usage"},{"character":"露","occurrence":1,"zhuyin":"ㄌㄨˋ","homophoneCue":"路","usage":"顯露在外","cueMode":"known_usage"}]},
  {"questionId":"question-9","speechUnitId":"q9-speech-003","source":"《司馬光破甕救友》第9題｜真實古文線索一（主檔第 1142 行）","text":"長者加以金銀華美之服，輒羞赧棄去之。","targets":[{"character":"長","occurrence":1,"zhuyin":"ㄓㄤˇ","homophoneCue":"掌","usage":"年長的人","cueMode":"known_usage"}]},
  {"questionId":"question-9","speechUnitId":"q9-speech-004","source":"《司馬光破甕救友》第9題｜已破解為（主檔第 1146 行）","text":"大人替年幼的司馬光穿上華麗衣服。他覺得很不好意思，便棄去那件衣服。","targets":[{"character":"大","occurrence":1,"zhuyin":"ㄉㄚˋ","homophoneCue":"大小的大","usage":"成年人","cueMode":"known_usage"},{"character":"覺","occurrence":1,"zhuyin":"ㄐㄩㄝˊ","homophoneCue":"決","usage":"感覺、察覺","cueMode":"known_usage"}]},
  {"questionId":"question-9","speechUnitId":"q9-speech-006","source":"《司馬光破甕救友》第9題｜已破解為（主檔第 1158 行）","text":"（女子得了一種很難治的病。家人請來許多醫生，卻沒有人能治好她。）後來，醫生們全都棄去。女子發現醫生們一個也不在了，想到自己的病可能再也沒有人能治，心裡更加害怕。","targets":[{"character":"得","occurrence":1,"zhuyin":"ㄉㄜˊ","homophoneCue":"德","usage":"得到、患上","cueMode":"known_usage"},{"character":"難","occurrence":1,"zhuyin":"ㄋㄢˊ","homophoneCue":"南","usage":"困難、不容易","cueMode":"known_usage"},{"character":"沒","occurrence":1,"zhuyin":"ㄇㄟˊ","homophoneCue":"梅","usage":"否定、沒有或不曾","cueMode":"known_usage"},{"character":"好","occurrence":1,"zhuyin":"ㄏㄠˇ","homophoneCue":"好人的好","usage":"良好或完成妥當","cueMode":"known_usage"},{"character":"都","occurrence":1,"zhuyin":"ㄉㄡ","homophoneCue":"兜","usage":"全部","cueMode":"known_usage"},{"character":"發","occurrence":1,"zhuyin":"ㄈㄚ","homophoneCue":"發現的發","usage":"發現、察覺","cueMode":"known_usage"},{"character":"更","occurrence":1,"zhuyin":"ㄍㄥˋ","homophoneCue":"更改的更","usage":"更加、程度增加","cueMode":"known_usage"}]},
  {"questionId":"question-10","speechUnitId":"q10-speech-004","source":"《司馬光破甕救友》第10題｜選項（主檔第 1294 行）","text":"只有一個孩子離開，其他孩子都留下來處理危險","targets":[{"character":"處","occurrence":1,"zhuyin":"ㄔㄨˇ","homophoneCue":"楚","usage":"處理、處置","cueMode":"known_usage"}]},
  {"questionId":"question-10","speechUnitId":"q10-speech-005","source":"《司馬光破甕救友》第10題｜選項（主檔第 1295 行）","text":"其他孩子都丟下落水的同伴，離開了。下一句才轉過來寫司馬光的行動。","targets":[{"character":"落","occurrence":1,"zhuyin":"ㄌㄨㄛˋ","homophoneCue":"駱","usage":"落下或落入水中","cueMode":"known_usage"},{"character":"轉","occurrence":1,"zhuyin":"ㄓㄨㄢˇ","homophoneCue":"轉身的轉","usage":"改變方向或轉換敘述焦點","cueMode":"known_usage"},{"character":"行","occurrence":1,"zhuyin":"ㄒㄧㄥˊ","homophoneCue":"形","usage":"行走、行動或進行","cueMode":"known_usage"}]},
  {"questionId":"question-10","speechUnitId":"q10-speech-007","source":"《司馬光破甕救友》第10題｜答對回饋（主檔第 1304 行）","text":"整句重建成功！「眾皆棄去」表示其他孩子全都把落水的同伴留在原處，並且離開。下一句另外提出司馬光，表示他沒有被算進離開的那群人。","targets":[{"character":"重","occurrence":1,"zhuyin":"ㄔㄨㄥˊ","homophoneCue":"蟲","usage":"重新組合或再次進行","cueMode":"known_usage"},{"character":"提","occurrence":1,"zhuyin":"ㄊㄧˊ","homophoneCue":"題","usage":"提出、提到","cueMode":"known_usage"}]},
  {"questionId":"question-11","speechUnitId":"q11-speech-004","source":"《司馬光破甕救友》第11題｜已破解為（主檔第 1396 行）","text":"有人持石擊地以後，地面傳出了特別的聲音。","targets":[{"character":"傳","occurrence":1,"zhuyin":"ㄔㄨㄢˊ","homophoneCue":"船","usage":"傳遞、傳出","cueMode":"known_usage"}]},
  {"questionId":"question-11","speechUnitId":"q11-speech-005","source":"《司馬光破甕救友》第11題｜真實古文線索二（主檔第 1404 行）","text":"某歸聞之，怒，持杖擊之。鬼出沒四隅，杖莫能中。","targets":[{"character":"沒","occurrence":1,"zhuyin":"ㄇㄛˋ","homophoneCue":"默","usage":"出現或隱沒","cueMode":"known_usage"}]},
  {"questionId":"question-11","speechUnitId":"q11-speech-006","source":"《司馬光破甕救友》第11題｜已破解為（主檔第 1408 行）","text":"那人回來後聽說此事，非常生氣，便持杖擊之；鬼四處躲閃，木杖一直打不中。","targets":[{"character":"說","occurrence":1,"zhuyin":"ㄕㄨㄛ","homophoneCue":"說話的說","usage":"說明、說出","cueMode":"known_usage"},{"character":"便","occurrence":1,"zhuyin":"ㄅㄧㄢˋ","homophoneCue":"變","usage":"就、於是","cueMode":"known_usage"},{"character":"處","occurrence":1,"zhuyin":"ㄔㄨˋ","homophoneCue":"觸","usage":"地方、位置","cueMode":"known_usage"},{"character":"中","occurrence":1,"zhuyin":"ㄓㄨㄥˋ","homophoneCue":"種田的種","usage":"擊中、打中","cueMode":"known_usage"}]},
  {"questionId":"question-11","speechUnitId":"q11-speech-007","source":"《司馬光破甕救友》第11題｜推理提問（主檔第 1416 行）","text":"第一條線索中，石頭在前、發出聲音的地面在後；第二條線索中，木杖在前、躲閃的鬼在後。「持 A 擊 B」最可能怎麼排列工具和目標？","targets":[{"character":"發","occurrence":1,"zhuyin":"ㄈㄚ","homophoneCue":"發現的發","usage":"發出、產生","cueMode":"known_usage"}]},
  {"questionId":"question-11","speechUnitId":"q11-speech-009","source":"《司馬光破甕救友》第11題｜選項（主檔第 1421 行）","text":"把 A 遞給 B，請 B 拿去敲打","targets":[{"character":"給","occurrence":1,"zhuyin":"ㄍㄟˇ","homophoneCue":"給你的給","usage":"交付、使對方得到","cueMode":"known_usage"}]},
  {"questionId":"question-14","speechUnitId":"q14-speech-003","source":"《司馬光破甕救友》第14題｜真實古文線索一（主檔第 1750 行）","text":"一山至有數十處，水迸而出。","targets":[{"character":"數","occurrence":1,"zhuyin":"ㄕㄨˋ","homophoneCue":"樹","usage":"幾個、數量","cueMode":"known_usage"}]},
  {"questionId":"question-15","speechUnitId":"q15-speech-003","source":"《司馬光破甕救友》第15題｜真實古文線索一（主檔第 1882 行）","text":"有客舟覆……福獨救人。有夫婦得活。","targets":[{"character":"得","occurrence":1,"zhuyin":"ㄉㄜˊ","homophoneCue":"德","usage":"得以存活、保住性命","cueMode":"unresolved_target"}]},
  {"questionId":"question-15","speechUnitId":"q15-speech-012","source":"《司馬光破甕救友》第15題｜第一次答錯提示（主檔第 1928 行）","text":"第一條線索發生了翻船，第二條線索出現了毒蛇。看看兩次危險過後，夫婦和國王共同得到的是哪一種結果。","targets":[{"character":"發","occurrence":1,"zhuyin":"ㄈㄚ","homophoneCue":"發現的發","usage":"發生、出現","cueMode":"known_usage"},{"character":"看","occurrence":1,"zhuyin":"ㄎㄢˋ","homophoneCue":"看見的看","usage":"觀看、看見","cueMode":"known_usage"},{"character":"過","occurrence":1,"zhuyin":"ㄍㄨㄛˋ","homophoneCue":"過年的過","usage":"事情的經歷或已完成","cueMode":"known_usage"},{"character":"和","occurrence":1,"zhuyin":"ㄏㄜˊ","homophoneCue":"河","usage":"和、跟或連接並列項目","cueMode":"known_usage"},{"character":"得","occurrence":1,"zhuyin":"ㄉㄜˊ","homophoneCue":"德","usage":"取得、得到","cueMode":"known_usage"},{"character":"哪","occurrence":1,"zhuyin":"ㄋㄚˇ","homophoneCue":"哪裡的哪","usage":"疑問代詞","cueMode":"known_usage"},{"character":"種","occurrence":1,"zhuyin":"ㄓㄨㄥˇ","homophoneCue":"腫","usage":"種類","cueMode":"known_usage"},{"character":"結","occurrence":1,"zhuyin":"ㄐㄧㄝˊ","homophoneCue":"結果的結","usage":"結果、結論","cueMode":"known_usage"}]},
  {"questionId":"question-18","speechUnitId":"q18-speech-004","source":"《司馬光破甕救友》第18題｜待判斷的六張敘述（畫面順序）（主檔第 2218 行）","text":"其他孩子是因為害怕，才把同伴留在原處並離開。","targets":[{"character":"為","occurrence":1,"zhuyin":"ㄨㄟˋ","homophoneCue":"位置的位","usage":"因為、表示原因","cueMode":"known_usage"}]},
  {"questionId":"question-18","speechUnitId":"q18-speech-009","source":"《司馬光破甕救友》第18題｜答對回饋（主檔第 2246 行）","text":"證據檢查完成！你找出了古文有明確寫出的三件事。沒有被古文明確寫出的內容，就算聽起來很合理，也不能當成古文已經說出的事。","targets":[{"character":"當","occurrence":1,"zhuyin":"ㄉㄤ","homophoneCue":"噹","usage":"視為、當作","cueMode":"known_usage"}]},
];

export const SIMA_GUANG_PRONUNCIATION_AUDIT_CATALOG: PronunciationAuditCatalogItem[] =
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
      id: `simaguang-${row.speechUnitId}`,
      lessonId: 'sima-guang-po-weng',
      lessonNumber: 2,
      lessonTitle: '司馬光破甕救友',
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
