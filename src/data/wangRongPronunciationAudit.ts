/* eslint-disable max-lines */
// 此檔由 scripts/generate-wang-rong-audit.mjs 依核准主檔機械產生。
// 不得手動改寫候選文字；主檔變更後應重新執行產生器並重新實聽。
import { getTtsInput } from '../lib/speech';
import {
  buildTargetFingerprint,
  buildUtteranceFingerprint,
} from '../lib/ttsAuditFingerprint';
import type {
  PronunciationAuditCatalogItem,
  PronunciationTarget,
  PronunciationVerification,
} from './guwenPronunciationAudit';

type WangRongAuditRow = {
  id: string;
  questionId: string;
  speechUnitId: string;
  source: string;
  text: string;
  targets: PronunciationTarget[];
  initialVerifications?: PronunciationVerification[];
};

const rows: WangRongAuditRow[] = [
  {"id":"wangrong-opening-speech-002","questionId":"opening","speechUnitId":"opening-speech-002","source":"《王戎不取道旁李》任務開場｜播放本篇原文（主檔第 73 行）","text":"王戎七歲，嘗與諸小兒遊。看道邊李樹多子折枝，諸兒競走取之，唯戎不動。人問之，答曰：「樹在道邊而多子，此必苦李。」取之，信然。","targets":[{"character":"與","occurrence":1,"zhuyin":"ㄩˇ","homophoneCue":"雨","usage":"和、跟","cueMode":"known_usage","ttsBehavior":"原字"},{"character":"答","occurrence":1,"zhuyin":"ㄉㄚˊ","homophoneCue":"達","usage":"回答","cueMode":"known_usage","ttsBehavior":"原字"}]},
  {"id":"wangrong-q1-speech-003","questionId":"question-1","speechUnitId":"q1-speech-003","source":"《王戎不取道旁李》第1題｜古文線索一（主檔第 109 行）","text":"陳涉少時，嘗與人傭耕。","targets":[{"character":"少","occurrence":1,"zhuyin":"ㄕㄠˋ","homophoneCue":"紹","usage":"年輕","cueMode":"known_usage","ttsBehavior":"原字"}],"initialVerifications":[{"status":"incorrect","verifiedDate":"2026-07-26","environmentLabel":"使用者於正式 App 的實際裝置回聽確認","evidence":"使用者回聽「陳涉少時，嘗與人傭耕。」後，確認「少」被念成三聲，應念四聲。"}]},
  {"id":"wangrong-q1-speech-005","questionId":"question-1","speechUnitId":"q1-speech-005","source":"《王戎不取道旁李》第1題｜古文線索二（主檔第 123 行）","text":"少年時，嘗過一村院。","targets":[{"character":"少","occurrence":1,"zhuyin":"ㄕㄠˋ","homophoneCue":"哨","usage":"年紀小","cueMode":"known_usage","ttsBehavior":"原字"},{"character":"過","occurrence":1,"zhuyin":"ㄍㄨㄛˋ","homophoneCue":"過年的過","usage":"經過、路過","cueMode":"known_usage","ttsBehavior":"原字"}]},
  {"id":"wangrong-q1-speech-010","questionId":"question-1","speechUnitId":"q1-speech-010","source":"《王戎不取道旁李》第1題｜答對回饋（自動播放語音）（主檔第 151 行）","text":"你取得了密碼鑰匙：嘗＝曾經。","targets":[{"character":"得","occurrence":1,"zhuyin":"ㄉㄜˊ","homophoneCue":"德","usage":"取得、得到","cueMode":"known_usage","ttsBehavior":"原字"}]},
  {"id":"wangrong-q10-speech-011","questionId":"question-10","speechUnitId":"q10-speech-011","source":"《王戎不取道旁李》第10題｜答錯提示（主檔第 1319 行）","text":"第一條線索有七八個孩子，幾個長大成人？第二條線索中，許多事物都改變了，什麼沒有改變？","targets":[{"character":"幾","occurrence":1,"zhuyin":"ㄐㄧˇ","homophoneCue":"己","usage":"多少","cueMode":"known_usage","ttsBehavior":"原字"}]},
  {"id":"wangrong-q11-speech-002","questionId":"question-11","speechUnitId":"q11-speech-002","source":"《王戎不取道旁李》第11題｜App 引導語（主檔第 1400 行）","text":"前面出現過一群孩子、王戎和路人，我拿不準這次之指向誰。麻煩古文破譯家幫我沿著故事追蹤。","targets":[{"character":"過","occurrence":1,"zhuyin":"ㄍㄨㄛˋ","homophoneCue":"過年的過","usage":"過去、經歷","cueMode":"known_usage","ttsBehavior":"原字"},{"character":"和","occurrence":1,"zhuyin":"ㄏㄜˊ","homophoneCue":"河","usage":"和、跟","cueMode":"known_usage","ttsBehavior":"原字"},{"character":"著","occurrence":1,"zhuyin":"ㄓㄜ˙","homophoneCue":"輕聲","usage":"放在動作後表示狀態持續","cueMode":"known_usage","ttsBehavior":"原字"}]},
  {"id":"wangrong-q13-speech-005","questionId":"question-11","speechUnitId":"q11-speech-005","source":"《王戎不取道旁李》第11題｜答對回饋（自動播放語音）（主檔第 1428 行）","text":"追蹤成功！其他孩子都跑去摘李子，只有王戎沒有行動，大家自然會注意到他的不同。","targets":[{"character":"只","occurrence":1,"zhuyin":"ㄓˇ","homophoneCue":"紙","usage":"僅僅、只有","cueMode":"known_usage","ttsBehavior":"原字"},{"character":"會","occurrence":1,"zhuyin":"ㄏㄨㄟˋ","homophoneCue":"惠","usage":"會、能夠","cueMode":"known_usage","ttsBehavior":"原字"}]},
  {"id":"wangrong-q14-speech-004","questionId":"question-12","speechUnitId":"q12-speech-004","source":"《王戎不取道旁李》第12題｜線索二（主檔第 1518 行）","text":"曾子曰：「吾日三省吾身。」","targets":[{"character":"省","occurrence":1,"zhuyin":"ㄒㄧㄥˇ","homophoneCue":"醒","usage":"反省、檢查自己","cueMode":"known_usage","ttsBehavior":"原字"}]},
  {"id":"wangrong-q16-speech-003","questionId":"question-13","speechUnitId":"q13-speech-003","source":"《王戎不取道旁李》第13題｜已破解為（主檔第 1647 行）","text":"船已經向前行駛，而落入水中的劍仍留在原來的位置。","targets":[{"character":"行","occurrence":1,"zhuyin":"ㄒㄧㄥˊ","homophoneCue":"形","usage":"走、前進或做出行為","cueMode":"known_usage","ttsBehavior":"原字"},{"character":"落","occurrence":1,"zhuyin":"ㄌㄨㄛˋ","homophoneCue":"駱","usage":"落下或落在後面","cueMode":"known_usage","ttsBehavior":"原字"},{"character":"中","occurrence":1,"zhuyin":"ㄓㄨㄥ","homophoneCue":"鐘","usage":"在範圍裡","cueMode":"known_usage","ttsBehavior":"原字"}]},
  {"id":"wangrong-q17-speech-005","questionId":"question-14","speechUnitId":"q14-speech-005","source":"《王戎不取道旁李》第14題｜選項（主檔第 1778 行）","text":"道路旁邊的李子容易被人發現和摘走；如果好吃，照理不容易還剩這麼多","targets":[{"character":"好","occurrence":1,"zhuyin":"ㄏㄠˇ","homophoneCue":"好人的好","usage":"味道好","cueMode":"known_usage","ttsBehavior":"原字"}]},
  {"id":"wangrong-q17-speech-008","questionId":"question-17","speechUnitId":"q17-speech-008","source":"《王戎不取道旁李》第17題｜選項（主檔第 2133 行）","text":"還沒有查證，只是先把說法記下來","targets":[{"character":"還","occurrence":1,"zhuyin":"ㄏㄞˊ","homophoneCue":"孩","usage":"仍然、尚未","cueMode":"known_usage","ttsBehavior":"原字"}]},
  {"id":"wangrong-q19-speech-002","questionId":"question-19","speechUnitId":"q19-speech-002","source":"《王戎不取道旁李》第19題｜App 引導語（主檔第 2329 行）","text":"麻煩古文破譯家依照事情發生的順序，把故事重新排好。","targets":[{"character":"重","occurrence":1,"zhuyin":"ㄔㄨㄥˊ","homophoneCue":"蟲","usage":"重新組合或再次進行","cueMode":"known_usage","ttsBehavior":"原字"},{"character":"好","occurrence":1,"zhuyin":"ㄏㄠˇ","homophoneCue":"好人的好","usage":"完成妥當或良好","cueMode":"known_usage","ttsBehavior":"原字"}]},
  {"id":"wangrong-q19-speech-005","questionId":"question-16","speechUnitId":"q16-speech-002","source":"《王戎不取道旁李》第16題｜選項（主檔第 2009 行）","text":"因為李樹長在道路旁邊，所以王戎已經親口吃過每一顆李子，知道它們全都很苦。","targets":[{"character":"為","occurrence":1,"zhuyin":"ㄨㄟˋ","homophoneCue":"胃","usage":"為什麼或因為","cueMode":"known_usage","ttsBehavior":"原字"},{"character":"長","occurrence":1,"zhuyin":"ㄓㄤˇ","homophoneCue":"掌","usage":"生長、長大","cueMode":"known_usage","ttsBehavior":"原字"},{"character":"過","occurrence":1,"zhuyin":"ㄍㄨㄛˋ","homophoneCue":"過年的過","usage":"放在動作後表示已完成","cueMode":"known_usage","ttsBehavior":"原字"},{"character":"都","occurrence":1,"zhuyin":"ㄉㄡ","homophoneCue":"兜","usage":"全部","cueMode":"known_usage","ttsBehavior":"原字"}]},
  {"id":"wangrong-q2-speech-002","questionId":"question-2","speechUnitId":"q2-speech-002","source":"《王戎不取道旁李》第2題｜App 引導語（主檔第 244 行）","text":"我找到了兩條線索，請你比較裡面的數量。","targets":[{"character":"數","occurrence":1,"zhuyin":"ㄕㄨˋ","homophoneCue":"樹","usage":"數量","cueMode":"known_usage","ttsBehavior":"原字"}]},
  {"id":"wangrong-q2-speech-005","questionId":"question-2","speechUnitId":"q2-speech-005","source":"《王戎不取道旁李》第2題｜古文線索二（主檔第 262 行）","text":"家有五兒。母卒，諸兒見家人泣，則隨之泣。","targets":[{"character":"卒","occurrence":1,"zhuyin":"ㄗㄨˊ","homophoneCue":"足","usage":"去世","cueMode":"known_usage","ttsBehavior":"原字"}]},
  {"id":"wangrong-q22-speech-005","questionId":"question-18","speechUnitId":"q18-speech-005","source":"《王戎不取道旁李》第18題｜答對回饋（自動播放語音）（主檔第 2252 行）","text":"「取之，信然」可以重建為：有人摘下李子查驗，結果果然如王戎所說，是苦的。","targets":[{"character":"為","occurrence":1,"zhuyin":"ㄨㄟˊ","homophoneCue":"圍","usage":"認為、視為或成為","cueMode":"known_usage","ttsBehavior":"原字"},{"character":"結","occurrence":1,"zhuyin":"ㄐㄧㄝˊ","homophoneCue":"結果的結","usage":"結果、結論","cueMode":"known_usage","ttsBehavior":"原字"}]},
  {"id":"wangrong-q24-speech-006","questionId":"question-20","speechUnitId":"q20-speech-006","source":"《王戎不取道旁李》第20題｜答對回饋（自動播放語音）（主檔第 2450 行）","text":"沒有被文章明確寫出來的內容，就算聽起來合理，也不能當成文章已經說出的事。","targets":[{"character":"當","occurrence":1,"zhuyin":"ㄉㄤ","homophoneCue":"噹","usage":"視為、當作","cueMode":"known_usage","ttsBehavior":"原字"}]},
  {"id":"wangrong-q3-speech-006","questionId":"question-3","speechUnitId":"q3-speech-006","source":"《王戎不取道旁李》第3題｜選項（主檔第 391 行）","text":"王戎七歲時，曾經和一群好朋友一起遊玩。","targets":[{"character":"好","occurrence":1,"zhuyin":"ㄏㄠˇ","homophoneCue":"好人的好","usage":"關係良好","cueMode":"known_usage","ttsBehavior":"原字"}]},
  {"id":"wangrong-q4-speech-004","questionId":"question-4","speechUnitId":"q4-speech-004","source":"《王戎不取道旁李》第4題｜已破解為（主檔第 496 行）","text":"桃樹多子折枝，果實垂得幾乎碰到地面。","targets":[{"character":"幾","occurrence":1,"zhuyin":"ㄐㄧ","homophoneCue":"機","usage":"接近、差一點","cueMode":"known_usage","ttsBehavior":"原字"}]},
  {"id":"wangrong-q4-speech-006","questionId":"question-4","speechUnitId":"q4-speech-006","source":"《王戎不取道旁李》第4題｜已破解為（主檔第 508 行）","text":"梨樹多子折枝，果農便用長竹竿撐住樹枝。","targets":[{"character":"便","occurrence":1,"zhuyin":"ㄅㄧㄢˋ","homophoneCue":"變","usage":"就、於是","cueMode":"known_usage","ttsBehavior":"原字"},{"character":"長","occurrence":1,"zhuyin":"ㄔㄤˊ","homophoneCue":"常","usage":"長度很長","cueMode":"known_usage","ttsBehavior":"原字"}]},
  {"id":"wangrong-q4-speech-013","questionId":"question-4","speechUnitId":"q4-speech-013","source":"《王戎不取道旁李》第4題｜答對回饋（自動播放語音）（主檔第 534 行）","text":"把鑰匙放回原文：「看道邊李樹多子折枝」就是他們看到道路旁的李樹結了很多李子，枝條被重量壓得向下彎折。","targets":[{"character":"看","occurrence":1,"zhuyin":"ㄎㄢˋ","homophoneCue":"看見的看","usage":"看到、看見","cueMode":"known_usage","ttsBehavior":"原字"},{"character":"折","occurrence":1,"zhuyin":"ㄓㄜˊ","homophoneCue":"哲","usage":"彎折或折斷","cueMode":"known_usage","ttsBehavior":"原字"},{"character":"結","occurrence":1,"zhuyin":"ㄐㄧㄝˊ","homophoneCue":"結果的結","usage":"長出果實","cueMode":"known_usage","ttsBehavior":"原字"},{"character":"重","occurrence":1,"zhuyin":"ㄓㄨㄥˋ","homophoneCue":"中獎的中","usage":"重量或重要","cueMode":"known_usage","ttsBehavior":"原字"},{"character":"得","occurrence":1,"zhuyin":"ㄉㄜ˙","homophoneCue":"輕聲","usage":"放在動作後連接結果或程度","cueMode":"known_usage","ttsBehavior":"原字"}]},
  {"id":"wangrong-q6-speech-001","questionId":"question-5","speechUnitId":"q5-speech-001","source":"《王戎不取道旁李》第5題｜App 引導語（主檔第 647 行）","text":"破譯家，下一處待破解的是競。","targets":[{"character":"處","occurrence":1,"zhuyin":"ㄔㄨˋ","homophoneCue":"觸","usage":"地方","cueMode":"known_usage","ttsBehavior":"原字"}]},
  {"id":"wangrong-q6-speech-005","questionId":"question-5","speechUnitId":"q5-speech-005","source":"《王戎不取道旁李》第5題｜已破解為（主檔第 671 行）","text":"兩個孩子競走；一會兒這個領先，一會兒另一個領先，兩人都不肯落在後面。","targets":[{"character":"會","occurrence":1,"zhuyin":"ㄏㄨㄟˇ","homophoneCue":"毀","usage":"很短的一段時間","cueMode":"known_usage","ttsBehavior":"原字"}]},
  {"id":"wangrong-q8-speech-003","questionId":"question-7","speechUnitId":"q7-speech-003","source":"《王戎不取道旁李》第7題｜真實古文線索二（主檔第 957 行）","text":"屠暴起，以刀劈狼首，又數刀斃之。","targets":[{"character":"數","occurrence":1,"zhuyin":"ㄕㄨˋ","homophoneCue":"樹","usage":"好幾個","cueMode":"known_usage","ttsBehavior":"原字"}]},
];

export const WANG_RONG_PRONUNCIATION_AUDIT_CATALOG: PronunciationAuditCatalogItem[] =
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
      lessonId: 'wang-rong-bu-qu-dao-pang-li',
      lessonNumber: 1,
      lessonTitle: '王戎不取道旁李',
      displayText,
      ttsInput,
      auditRevision: 1,
      targetFingerprint: buildTargetFingerprint(row.targets),
      utteranceFingerprint: buildUtteranceFingerprint(fingerprintInput),
      target,
      intendedReading,
      initialVerifications: row.initialVerifications ?? [],
    };
  });
