import assert from 'node:assert/strict';
import fs from 'node:fs';
import { guwenLessons, totalGuwenLessonItems } from '../src/data/guwenLesson';
import { yanErDaoZhongLesson } from '../src/data/yanErDaoZhongLesson';
import { parseDraftQuestions } from '../src/lib/guwenDraftPreview';

const activeMaster = fs.readFileSync(new URL('../06-guwen-yanerdaozhong-decoder-content.md', import.meta.url), 'utf8');
const approvedQuestions = parseDraftQuestions(activeMaster);

assert.equal(yanErDaoZhongLesson.contentRevision, '2026-07-30-approved-v2');
assert.equal(
  guwenLessons.find((lesson) => lesson.id === 'yan-er-dao-zhong')?.contentRevision,
  '2026-07-30-approved-v2',
  '正式 App 第六篇入口必須指向新版已核准資料',
);
assert.equal(approvedQuestions.length, 20, 'active 主檔應解析出 20 題');
assert(approvedQuestions.every((question) => !question.status.includes('待審')), '第六篇 active 主檔不得殘留待審題目狀態');
assert.equal(yanErDaoZhongLesson.steps.length, 18, '第 1–18 題應是一般作答 step');
assert.equal(totalGuwenLessonItems(yanErDaoZhongLesson), 20, '第 19–20 題應以兩個 closing 計入總題數');
assert.equal(yanErDaoZhongLesson.sequenceOrderingClosing?.id, 'closing_sequence_order');
assert.equal(yanErDaoZhongLesson.causalChainClosing, undefined);
assert.equal(yanErDaoZhongLesson.evidenceMultiSelectClosing?.id, 'closing_evidence_multiselect');
assert.equal(yanErDaoZhongLesson.preserveAuthoredOptionOrder, true);
assert.equal(yanErDaoZhongLesson.badgeClaimMode, 'scroll-end');
assert.equal(yanErDaoZhongLesson.introPronunciationCues, undefined);
assert.equal(yanErDaoZhongLesson.fullTextPronunciationCues, undefined);
assert.equal(yanErDaoZhongLesson.sentencePronunciationCues, undefined);
assert(!JSON.stringify(yanErDaoZhongLesson).includes('??'), 'App 資料不可含編碼替換後的問號文字');
assert(
  yanErDaoZhongLesson.steps[10].correctFeedback.includes('ㄎㄨㄤˋ'),
  '第 11 題注音說明必須保留在核心解答內',
);
assert(!JSON.stringify(yanErDaoZhongLesson.steps[10]).includes('pronunciationCues'), '第 11 題不得建立旁註式注音欄位');

for (let index = 0; index < yanErDaoZhongLesson.steps.length; index += 1) {
  const step = yanErDaoZhongLesson.steps[index];
  const approved = approvedQuestions[index];
  assert.equal(step.targetSentence, approved.target?.text, `${step.id} 的本輪處理句子未同步核准主檔`);
  assert.equal(step.intro, approved.intro?.text, `${step.id} 的孩子端引導語未同步核准主檔`);
  assert.equal(step.question, approved.question?.text, `${step.id} 的提問未同步核准主檔`);
  assert.deepEqual(step.options, approved.options.map((option) => option.text), `${step.id} 的選項未同步核准主檔`);
  assert.equal(step.correctIndex, approved.correctIndex, `${step.id} 的正解位置未同步核准主檔`);
  assert.equal(step.correctFeedback, approved.correctFeedback?.text, `${step.id} 的核心解答未同步核准主檔`);
  assert.equal(step.retryHint, approved.retryHint?.text, `${step.id} 的第一次答錯提示未同步核准主檔`);
  assert.equal(step.explanation, approved.explanation?.text, `${step.id} 的詳解未同步核准主檔`);
  assert.deepEqual(
    'keys' in step ? step.keys.map((key) => [key.code, key.decodedEvidence]) : [],
    approved.preAnswerKeys.map((key) => [key.code.text, key.decodedEvidence.text]),
    `${step.id} 的作答前密碼鑰匙未同步核准主檔`,
  );
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

const q19 = approvedQuestions[18];
assert.equal(yanErDaoZhongLesson.sequenceOrderingClosing?.intro, q19.intro?.text, '第 19 題引導語未同步');
assert.deepEqual(
  yanErDaoZhongLesson.sequenceOrderingClosing?.cards.map((card) => [card.id, card.text]),
  q19.sequenceCards.map((card) => [card.id, card.text]),
  '第 19 題排序卡未同步',
);
assert.deepEqual(yanErDaoZhongLesson.sequenceOrderingClosing?.correctOrder, q19.sequenceCorrectOrder, '第 19 題正確排序未同步');
assert.equal(yanErDaoZhongLesson.sequenceOrderingClosing?.correctFeedback, q19.correctFeedback?.text, '第 19 題核心解答未同步');
assert.equal(yanErDaoZhongLesson.sequenceOrderingClosing?.retryHint, q19.retryHint?.text, '第 19 題第一次答錯提示未同步');
assert.equal(yanErDaoZhongLesson.sequenceOrderingClosing?.explanation, q19.explanation?.text, '第 19 題詳解未同步');

const q20 = approvedQuestions[19];
assert.equal(yanErDaoZhongLesson.evidenceMultiSelectClosing?.intro, q20.intro?.text, '第 20 題引導語未同步');
assert.deepEqual(
  yanErDaoZhongLesson.evidenceMultiSelectClosing?.options.map((option) => [option.correct, option.text]),
  q20.multiSelectOptions.map((option) => [option.correct, option.text]),
  '第 20 題多選卡順序或正解未同步',
);
assert.equal(yanErDaoZhongLesson.evidenceMultiSelectClosing?.correctFeedback, q20.correctFeedback?.text, '第 20 題核心解答未同步');
assert.equal(yanErDaoZhongLesson.evidenceMultiSelectClosing?.retryHint, q20.retryHint?.text, '第 20 題第一次答錯提示未同步');
assert.equal(yanErDaoZhongLesson.evidenceMultiSelectClosing?.finalNote, q20.explanation?.text, '第 20 題詳解未同步');

const prereqs = yanErDaoZhongLesson.finalVerification.prerequisiteStepIds;
assert.deepEqual(
  prereqs.slice(-2),
  ['closing_sequence_order', 'closing_evidence_multiselect'],
  '白話卷軸必須等第 19 題排序與第 20 題證據檢查完成',
);
assert.equal(yanErDaoZhongLesson.finalVerification.translation.includes('范氏家族敗落時'), true, '白話文必須同步白話驗證卷軸');

console.log('第六篇《掩耳盜鐘》App 資料驗證通過。');
