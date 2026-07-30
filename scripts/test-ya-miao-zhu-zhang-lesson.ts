import assert from 'node:assert/strict';
import fs from 'node:fs';
import { guwenLessons, totalGuwenLessonItems } from '../src/data/guwenLesson';
import { yaMiaoZhuZhangLesson } from '../src/data/yaMiaoZhuZhangLesson';
import { parseDraftQuestions } from '../src/lib/guwenDraftPreview';

const activeMaster = fs.readFileSync(new URL('../05-guwen-yamiaozhuzhang-decoder-content.md', import.meta.url), 'utf8');
const approvedQuestions = parseDraftQuestions(activeMaster);

assert.equal(yaMiaoZhuZhangLesson.contentRevision, '2026-07-30-approved-v2');
assert.equal(
  guwenLessons.find((lesson) => lesson.id === 'ya-miao-zhu-zhang')?.contentRevision,
  '2026-07-30-approved-v2',
  '正式 App 第五篇入口必須指向新版已核准資料',
);
assert.equal(approvedQuestions.length, 17, 'active 主檔應解析出 17 題');
assert.equal(yaMiaoZhuZhangLesson.steps.length, 14, '第 1–14 題應是一般作答 step');
assert.equal(totalGuwenLessonItems(yaMiaoZhuZhangLesson), 17, '第 15–17 題應以三個 closing 計入總題數');
assert.equal(yaMiaoZhuZhangLesson.sequenceOrderingClosing?.id, 'closing_sequence_order');
assert.equal(yaMiaoZhuZhangLesson.causalChainClosing?.id, 'closing_title_reversal');
assert.equal(yaMiaoZhuZhangLesson.evidenceMultiSelectClosing?.id, 'closing_evidence_multiselect');
assert.equal(yaMiaoZhuZhangLesson.preserveAuthoredOptionOrder, true);
assert.equal(yaMiaoZhuZhangLesson.badgeClaimMode, 'scroll-end');
assert.equal(yaMiaoZhuZhangLesson.introPronunciationCues, undefined);
assert.equal(yaMiaoZhuZhangLesson.fullTextPronunciationCues, undefined);
assert.equal(yaMiaoZhuZhangLesson.sentencePronunciationCues, undefined);
assert(!JSON.stringify(yaMiaoZhuZhangLesson).includes('??'), 'App 資料不可含編碼替換後的問號文字');

for (let index = 0; index < yaMiaoZhuZhangLesson.steps.length; index += 1) {
  const step = yaMiaoZhuZhangLesson.steps[index];
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

const q15 = approvedQuestions[14];
assert.equal(yaMiaoZhuZhangLesson.sequenceOrderingClosing?.intro, q15.intro?.text, '第 15 題引導語未同步');
assert.deepEqual(
  yaMiaoZhuZhangLesson.sequenceOrderingClosing?.cards.map((card) => [card.id, card.text]),
  q15.sequenceCards.map((card) => [card.id, card.text]),
  '第 15 題排序卡未同步',
);
assert.deepEqual(yaMiaoZhuZhangLesson.sequenceOrderingClosing?.correctOrder, q15.sequenceCorrectOrder, '第 15 題正確排序未同步');
assert.equal(yaMiaoZhuZhangLesson.sequenceOrderingClosing?.correctFeedback, q15.correctFeedback?.text, '第 15 題核心解答未同步');
assert.equal(yaMiaoZhuZhangLesson.sequenceOrderingClosing?.retryHint, q15.retryHint?.text, '第 15 題第一次答錯提示未同步');
assert.equal(yaMiaoZhuZhangLesson.sequenceOrderingClosing?.explanation, q15.explanation?.text, '第 15 題詳解未同步');

const q16 = approvedQuestions[15];
assert.equal(yaMiaoZhuZhangLesson.causalChainClosing?.intro, q16.intro?.text, '第 16 題引導語未同步');
assert.equal(yaMiaoZhuZhangLesson.causalChainClosing?.question, q16.question?.text, '第 16 題提問未同步');
assert.deepEqual(yaMiaoZhuZhangLesson.causalChainClosing?.options, q16.options.map((option) => option.text), '第 16 題選項未同步');
assert.equal(yaMiaoZhuZhangLesson.causalChainClosing?.correctIndex, q16.correctIndex, '第 16 題正解未同步');
assert.equal(yaMiaoZhuZhangLesson.causalChainClosing?.correctFeedback, q16.correctFeedback?.text, '第 16 題核心解答未同步');
assert.equal(yaMiaoZhuZhangLesson.causalChainClosing?.retryHint, q16.retryHint?.text, '第 16 題第一次答錯提示未同步');
assert(q16.explanation?.text.includes(yaMiaoZhuZhangLesson.causalChainClosing?.evidenceBoundary ?? ''), '第 16 題證據邊界必須來自詳解');

const q17 = approvedQuestions[16];
assert.equal(yaMiaoZhuZhangLesson.evidenceMultiSelectClosing?.intro, q17.intro?.text, '第 17 題引導語未同步');
assert.deepEqual(
  yaMiaoZhuZhangLesson.evidenceMultiSelectClosing?.options.map((option) => [option.correct, option.text]),
  q17.multiSelectOptions.map((option) => [option.correct, option.text]),
  '第 17 題多選卡順序或正解未同步',
);
assert.equal(yaMiaoZhuZhangLesson.evidenceMultiSelectClosing?.correctFeedback, q17.correctFeedback?.text, '第 17 題核心解答未同步');
assert.equal(yaMiaoZhuZhangLesson.evidenceMultiSelectClosing?.retryHint, q17.retryHint?.text, '第 17 題第一次答錯提示未同步');
assert.equal(yaMiaoZhuZhangLesson.evidenceMultiSelectClosing?.finalNote, q17.explanation?.text, '第 17 題詳解未同步');

const prereqs = yaMiaoZhuZhangLesson.finalVerification.prerequisiteStepIds;
assert(prereqs.includes('closing_sequence_order'), '白話卷軸必須等第 15 題排序完成');
assert(prereqs.includes('closing_title_reversal'), '白話卷軸必須等第 16 題因果推理完成');
assert(prereqs.includes('closing_evidence_multiselect'), '白話卷軸必須等第 17 題證據檢查完成');

console.log('第五篇《揠苗助長》App 資料驗證通過。');
