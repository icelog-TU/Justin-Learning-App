import assert from 'node:assert/strict';
import fs from 'node:fs';
import { guwenLessons, totalGuwenLessonItems } from '../src/data/guwenLesson';
import { yuRenShiYanLesson } from '../src/data/yuRenShiYanLesson';
import { parseDraftQuestions } from '../src/lib/guwenDraftPreview';

const activeMaster = fs.readFileSync(
  new URL('../11-guwen-yurenshiyan-decoder-content.md', import.meta.url),
  'utf8',
);
const approvedQuestions = parseDraftQuestions(activeMaster);

assert.equal(yuRenShiYanLesson.id, 'yu-ren-shi-yan');
assert.equal(yuRenShiYanLesson.contentRevision, '2026-07-31-approved-21');
assert.equal(guwenLessons[10]?.id, yuRenShiYanLesson.id, '第十一篇必須排在正式 App 的第十一個位置');
assert.equal(approvedQuestions.length, 21, 'active 主檔應解析出 21 題');
assert(
  approvedQuestions.every((question) => question.status === '已核准' || question.status === '人工審核通過'),
  '第十一篇 active 主檔的 21 題都必須是核准或人工審核通過狀態',
);
assert(
  approvedQuestions.every((question) => question.diagnostics.length === 0),
  '第十一篇 active 主檔不得有預覽解析診斷',
);
assert.equal(yuRenShiYanLesson.steps.length, 19, '第 1–19 題應是一般作答 step');
assert.equal(totalGuwenLessonItems(yuRenShiYanLesson), 21, '第 20–21 題應以兩個 closing 計入總題數');
assert.equal(yuRenShiYanLesson.sequenceOrderingClosing?.id, 'closing_sequence_order');
assert.equal(yuRenShiYanLesson.evidenceMultiSelectClosing?.id, 'closing_evidence_multiselect');
assert.equal(yuRenShiYanLesson.causalChainClosing, undefined);
assert.equal(yuRenShiYanLesson.preserveAuthoredOptionOrder, true);
assert.equal(yuRenShiYanLesson.badgeClaimMode, 'scroll-end');
assert.equal(yuRenShiYanLesson.badgeName, '鹽量推理徽章');

assert.equal(
  yuRenShiYanLesson.sentences.join(''),
  yuRenShiYanLesson.fullText,
  '分句接合後必須逐字等於本課採用原文',
);
assert.equal(
  yuRenShiYanLesson.fullText,
  '昔有愚人至於他家。主人與食嫌淡無味。主人聞已更為益鹽。既得鹽美。便自念言。所以美者緣有鹽故。少有尚爾況復多也。愚人無智便空食鹽。食已口爽返為其患。',
  '正式 App 原文必須逐字保留核准版本',
);

for (let index = 0; index < yuRenShiYanLesson.steps.length; index += 1) {
  const step = yuRenShiYanLesson.steps[index];
  const approved = approvedQuestions[index];
  assert.equal(step.targetSentence, approved.target?.text, `${step.id} 的本輪處理句子未同步核准主檔`);
  assert.equal(step.intro, approved.intro?.text, `${step.id} 的孩子端引導語未同步核准主檔`);
  assert.equal(step.question, approved.question?.text, `${step.id} 的提問未同步核准主檔`);
  assert.deepEqual(
    step.options,
    approved.options.map((option) => option.text),
    `${step.id} 的選項未同步核准主檔`,
  );
  assert.equal(step.correctIndex, approved.correctIndex, `${step.id} 的正解位置未同步核准主檔`);
  assert.equal(step.correctFeedback, approved.correctFeedback?.text, `${step.id} 的核心解答未同步核准主檔`);
  assert.equal(step.retryHint, approved.retryHint?.text, `${step.id} 的答錯提示未同步核准主檔`);
  assert.equal(step.explanation, approved.explanation?.text, `${step.id} 的詳解未同步核准主檔`);
  assert.deepEqual(
    step.keys?.map((key) => [key.code, key.decodedEvidence]) ?? [],
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
        `${step.id} 線索白話未同步`,
      );
      assert.equal(step.clues[clueIndex]?.source, clue.source?.text, `${step.id} 線索出處未同步`);
    });
  }
}

assert.equal(yuRenShiYanLesson.steps[6]?.type, 'local_inference', '第 7 題應是本篇局部推論');
assert.equal(yuRenShiYanLesson.steps[14]?.type, 'story_reasoning', '第 15 題應是故事推理題');

const q20 = approvedQuestions[19];
assert.equal(yuRenShiYanLesson.sequenceOrderingClosing?.intro, q20.intro?.text, '第 20 題引導語未同步');
assert.deepEqual(
  yuRenShiYanLesson.sequenceOrderingClosing?.cards.map((card) => [card.id, card.text]),
  q20.sequenceCards.map((card) => [card.id, card.text]),
  '第 20 題排序卡未同步',
);
assert.deepEqual(yuRenShiYanLesson.sequenceOrderingClosing?.correctOrder, q20.sequenceCorrectOrder);
assert.equal(yuRenShiYanLesson.sequenceOrderingClosing?.correctFeedback, q20.correctFeedback?.text);
assert.equal(yuRenShiYanLesson.sequenceOrderingClosing?.retryHint, q20.retryHint?.text);
assert.equal(yuRenShiYanLesson.sequenceOrderingClosing?.explanation, q20.explanation?.text);

const q21 = approvedQuestions[20];
assert.equal(yuRenShiYanLesson.evidenceMultiSelectClosing?.intro, q21.intro?.text, '第 21 題引導語未同步');
assert.deepEqual(
  yuRenShiYanLesson.evidenceMultiSelectClosing?.options.map((option) => [option.correct, option.text]),
  q21.multiSelectOptions.map((option) => [option.correct, option.text]),
  '第 21 題多選卡順序或正解未同步',
);
assert.equal(yuRenShiYanLesson.evidenceMultiSelectClosing?.correctFeedback, q21.correctFeedback?.text);
assert.equal(yuRenShiYanLesson.evidenceMultiSelectClosing?.retryHint, q21.retryHint?.text);
assert.equal(yuRenShiYanLesson.evidenceMultiSelectClosing?.finalNote, q21.explanation?.text);

const requiredIds = [
  ...yuRenShiYanLesson.steps.map((step) => step.id),
  'closing_sequence_order',
  'closing_evidence_multiselect',
];
assert.deepEqual(yuRenShiYanLesson.finalVerification.prerequisiteStepIds, requiredIds, '白話卷軸必須等全部 21 題完成');
assert.equal(
  yuRenShiYanLesson.finalVerification.translation,
  '從前有一個愚人，到了別人的家。主人給他食物，他嫌食物太淡、沒有味道。主人聽見後，又替他加了鹽。加鹽後味道變好，愚人心裡想：「味道會變好，是因為有鹽。一點點鹽就已經這麼好，何況是更多鹽呢？」愚人沒有智慧，竟然不配其他食物，直接吃鹽。吃完後味覺受損，反而成了他的禍患。',
  '白話驗證卷軸必須同步核准全文',
);
assert.equal(yuRenShiYanLesson.introPronunciationCues, undefined);
assert.equal(yuRenShiYanLesson.fullTextPronunciationCues, undefined);
assert.equal(yuRenShiYanLesson.sentencePronunciationCues, undefined);

console.log('第十一篇《愚人食鹽》App 資料驗證通過。');
