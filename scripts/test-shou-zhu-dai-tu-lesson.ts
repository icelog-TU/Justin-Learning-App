import assert from 'node:assert/strict';
import fs from 'node:fs';
import { shouZhuDaiTuLesson } from '../src/data/shouZhuDaiTuLesson';
import { guwenLessons } from '../src/data/guwenLesson';
import { parseDraftQuestions } from '../src/lib/guwenDraftPreview';

const expectedStepIds = [
  'zhu',
  'chu',
  'tu_zou_chu_zhu',
  'zhe',
  'zhe_jing_er_si',
  'lei',
  'shi',
  'yin',
  'yin_shi_qi_lei_er_shou_zhu',
  'ji',
  'fu',
  'ji_fu_de_tu',
  'tu_bu_ke_fu_de',
  'shen',
  'wei',
  'er_shen_wei_song_guo_xiao',
];

const activeMaster = fs.readFileSync(new URL('../04-guwen-shouzhudaitu-decoder-content.md', import.meta.url), 'utf8');
const approvedQuestions = parseDraftQuestions(activeMaster);

assert.equal(shouZhuDaiTuLesson.contentRevision, '2026-07-30-approved-v2');
assert.equal(
  guwenLessons.find((lesson) => lesson.id === 'shou-zhu-dai-tu')?.contentRevision,
  '2026-07-30-approved-v2',
  'App 課程入口必須指向新版第四篇，不可仍使用舊版資料',
);
assert.equal(
  shouZhuDaiTuLesson.fullText,
  '宋人有耕者，田中有株。兔走觸株，折頸而死。因釋其耒而守株，冀復得兔。兔不可復得，而身為宋國笑。',
);
assert.equal(shouZhuDaiTuLesson.steps.length, 16, '第四篇應有 16 道一般題');
assert.deepEqual(
  shouZhuDaiTuLesson.steps.map((step) => step.id),
  expectedStepIds,
  '第四篇一般題順序必須與核准主檔一致',
);
assert.equal(shouZhuDaiTuLesson.sequenceOrderingClosing?.cards.length, 5, '第 17 題應有五張排序卡');
assert.equal(shouZhuDaiTuLesson.evidenceMultiSelectClosing?.options.length, 6, '第 18 題應有六張分類卡');
assert.equal(shouZhuDaiTuLesson.causalChainClosing, undefined, '第四篇沒有額外因果鏈收尾頁');
assert.equal(shouZhuDaiTuLesson.preserveAuthoredOptionOrder, true);
assert.equal(shouZhuDaiTuLesson.badgeClaimMode, 'scroll-end');
assert.equal(shouZhuDaiTuLesson.splitIntroSpeechParagraphs, true);
assert.equal(
  'missionOpeningFullText' in shouZhuDaiTuLesson,
  false,
  '第四篇不得再把任務求助、全文聆聽與接受任務合併在同一頁',
);

const allIds = [
  ...expectedStepIds,
  shouZhuDaiTuLesson.sequenceOrderingClosing!.id,
  shouZhuDaiTuLesson.evidenceMultiSelectClosing!.id,
];
assert.equal(new Set(allIds).size, allIds.length, '第四篇所有題目 ID 必須唯一');
assert.deepEqual(shouZhuDaiTuLesson.finalVerification.prerequisiteStepIds, allIds);

for (const step of shouZhuDaiTuLesson.steps) {
  assert.equal(step.options.length, 3, `${step.id} 必須恰有三個選項`);
  assert(step.correctIndex >= 0 && step.correctIndex < 3, `${step.id} 必須有一個有效正解`);
  assert.equal(step.prerequisiteIds.length, step.id === 'zhu' ? 0 : 1, `${step.id} 的解鎖鏈不正確`);
  assert.equal(step.pronunciationCues, undefined, `${step.id} 不應加入中央未判錯的注音提示`);
  if (step.type === 'evidence') assert.equal(step.clues.length, 2, `${step.id} 必須有兩條線索`);
}

for (let index = 0; index < shouZhuDaiTuLesson.steps.length; index += 1) {
  const step = shouZhuDaiTuLesson.steps[index];
  const approved = approvedQuestions[index];
  assert.equal(step.targetSentence, approved.target?.text, `${step.id} 的本輪處理句子未同步核准主檔`);
  assert.equal(step.intro, approved.intro?.text, `${step.id} 的孩子端引導語未同步核准主檔`);
  assert.equal(step.question, approved.question?.text, `${step.id} 的提問未同步核准主檔`);
  assert.deepEqual(step.options, approved.options.map((option) => option.text), `${step.id} 的選項未同步核准主檔`);
  assert.equal(step.correctIndex, approved.correctIndex, `${step.id} 的正解位置未同步核准主檔`);
  assert.equal(step.correctFeedback, approved.correctFeedback?.text, `${step.id} 的核心解答未同步核准主檔`);
  assert.equal(step.retryHint, approved.retryHint?.text, `${step.id} 的第一次答錯提示未同步核准主檔`);
  assert.equal(step.explanation, approved.explanation?.text, `${step.id} 的詳解未同步核准主檔`);
  if (approved.preAnswerKeys.length > 0) {
    assert.deepEqual(
      'keys' in step ? step.keys.map((key) => [key.code, key.decodedEvidence]) : [],
      approved.preAnswerKeys.map((key) => [key.code.text, key.decodedEvidence.text]),
      `${step.id} 的作答前密碼鑰匙未同步核准主檔`,
    );
  }
  if (approved.clues.length > 0) {
    assert.equal(step.type, 'evidence', `${step.id} 有線索時必須是 evidence 題型`);
    if (step.type !== 'evidence') continue;
    approved.clues.forEach((clue, clueIndex) => {
      assert.equal(step.clues[clueIndex]?.text, clue.text, `${step.id} 線索 ${clueIndex + 1} 原文未同步`);
      assert.equal(
        step.clues[clueIndex]?.unlockedMeaning,
        clue.meaning?.text,
        `${step.id} 線索 ${clueIndex + 1} 已破解白話未同步`,
      );
      assert.equal(step.clues[clueIndex]?.source, clue.source?.text, `${step.id} 線索 ${clueIndex + 1} 出處未同步`);
    });
  }
}

const q17 = approvedQuestions[16];
assert.equal(shouZhuDaiTuLesson.sequenceOrderingClosing?.intro, q17.intro?.text, '第 17 題引導語未同步');
assert.deepEqual(
  shouZhuDaiTuLesson.sequenceOrderingClosing?.cards.map((card) => card.text),
  [
    '農夫放下農具，守在樹樁旁。',
    '農夫希望再得到兔子。',
    '宋國有一位農夫，田裡有一個樹樁。',
    '農夫沒有再得到兔子，還被宋國人笑話。',
    '一隻兔子奔跑時撞上樹樁，折斷脖子而死。',
  ],
  '第 17 題排序卡初始順序必須與核准主檔一致',
);
assert.equal(shouZhuDaiTuLesson.sequenceOrderingClosing?.correctFeedback, q17.correctFeedback?.text, '第 17 題核心解答未同步');
assert.equal(shouZhuDaiTuLesson.sequenceOrderingClosing?.retryHint, q17.retryHint?.text, '第 17 題第一次答錯提示未同步');
assert.equal(shouZhuDaiTuLesson.sequenceOrderingClosing?.explanation, q17.explanation?.text, '第 17 題詳解未同步');

const q18 = approvedQuestions[17];
assert.equal(shouZhuDaiTuLesson.evidenceMultiSelectClosing?.intro, q18.intro?.text, '第 18 題引導語未同步');
assert.deepEqual(
  shouZhuDaiTuLesson.evidenceMultiSelectClosing?.options.map((option) => [option.correct, option.text]),
  [
    [true, '農夫的田裡有一個樹樁。'],
    [false, '農夫相信每天都一定會有兔子撞死在樹樁旁。'],
    [false, '農夫後來重新拿起農具，回去耕田。'],
    [true, '一隻兔子奔跑時撞上樹樁，折斷脖子而死。'],
    [false, '農夫覺得守著樹樁，比繼續耕田更值得。'],
    [true, '農夫沒有再得到兔子，還被宋國人笑話。'],
  ],
  '第 18 題分類卡順序與正解必須與核准主檔一致',
);
assert.equal(shouZhuDaiTuLesson.evidenceMultiSelectClosing?.correctFeedback, q18.correctFeedback?.text, '第 18 題核心解答未同步');
assert.equal(shouZhuDaiTuLesson.evidenceMultiSelectClosing?.retryHint, q18.retryHint?.text, '第 18 題第一次答錯提示未同步');
assert.equal(shouZhuDaiTuLesson.evidenceMultiSelectClosing?.finalNote, q18.explanation?.text, '第 18 題詳解未同步');

assert.equal(shouZhuDaiTuLesson.introPronunciationCues, undefined);
assert.equal(shouZhuDaiTuLesson.fullTextPronunciationCues, undefined);
assert.equal(shouZhuDaiTuLesson.sentencePronunciationCues, undefined);

const normalize = (text: string) => text.replace(/[【】]/g, '').trim();
const masterText = normalize(activeMaster.replace(/\*\*/g, ''));
const decoderSource = fs.readFileSync(new URL('../src/pages/GuwenLessonDecode.tsx', import.meta.url), 'utf8');
assert(
  !decoderSource.includes('missionOpeningFullText'),
  '共用頁面不得保留跳過全文聆聽頁的 missionOpeningFullText 特例',
);
const introPhaseSource = decoderSource.slice(
  decoderSource.indexOf("{phase === 'intro'"),
  decoderSource.indexOf("{phase === 'listening'"),
);
assert(!introPhaseSource.includes('lesson.fullText'), '任務求助頁不得顯示完整原文');
assert(!introPhaseSource.includes('renderPassage()'), '任務求助頁不得塞入灰色全文');
assert(introPhaseSource.includes("setPhase('listening')"), '接受任務後必須進入全文聆聽頁');
assert(introPhaseSource.includes("'接受破譯任務'"), '第一頁的共用預設按鈕必須是「接受破譯任務」');
const listeningPhaseSource = decoderSource.slice(
  decoderSource.indexOf("{phase === 'listening'"),
  decoderSource.indexOf("{phase === 'steps'"),
);
assert(listeningPhaseSource.includes('lesson.fullText'), '第二頁必須顯示完整原文');
assert(listeningPhaseSource.includes('lesson.introClosingLine'), '核准的等待句必須移到第二頁');
assert(listeningPhaseSource.includes("setPhase('steps')"), '第二頁按鈕才可以進入第一題');
const technicalKeys = new Set([
  'id',
  'type',
  'prerequisiteIds',
  'prerequisiteStepIds',
  'correctIndex',
  'correctOrder',
  'contentRevision',
  'badgeClaimMode',
  'source',
]);

function collectApprovedCopy(value: unknown, key = '', result: string[] = []): string[] {
  if (technicalKeys.has(key)) return result;
  if (typeof value === 'string') {
    result.push(...value.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean));
    return result;
  }
  if (Array.isArray(value)) {
    value.forEach((entry) => collectApprovedCopy(entry, key, result));
    return result;
  }
  if (value && typeof value === 'object') {
    Object.entries(value).forEach(([childKey, entry]) => collectApprovedCopy(entry, childKey, result));
  }
  return result;
}

for (const copy of collectApprovedCopy(shouZhuDaiTuLesson)) {
  assert(masterText.includes(normalize(copy)), `App 文案不在唯一教材主檔中：${copy}`);
}

console.log('第四篇《守株待兔》App 資料驗證通過。');
