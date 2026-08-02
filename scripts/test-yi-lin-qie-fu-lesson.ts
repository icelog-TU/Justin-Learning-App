import assert from 'node:assert/strict';
import fs from 'node:fs';
import { guwenLessons, totalGuwenLessonItems } from '../src/data/guwenLesson';
import { yiLinQieFuLesson } from '../src/data/yiLinQieFuLesson';
import { parseDraftQuestions } from '../src/lib/guwenDraftPreview';

const activeMaster = fs.readFileSync(
  new URL('../12-guwen-yilinqiefu-decoder-content.md', import.meta.url),
  'utf8',
).replace(/\r\n/g, '\n');
const approvedQuestions = parseDraftQuestions(activeMaster);

function stripQuote(line: string): string {
  return line.replace(/^>\s?/, '');
}

function sectionBody(heading: string): string {
  const pattern = new RegExp(`^${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'm');
  const match = activeMaster.match(pattern);
  assert(match?.index !== undefined, `找不到章節：${heading}`);
  const start = activeMaster.indexOf('\n', match.index) + 1;
  const rest = activeMaster.slice(start);
  const next = rest.search(/^#{1,3}\s/m);
  return (next >= 0 ? rest.slice(0, next) : rest).trim();
}

function blockquoteAfter(heading: string): string {
  return sectionBody(heading)
    .split('\n')
    .filter((line) => line.startsWith('>'))
    .map(stripQuote)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

assert.equal(yiLinQieFuLesson.id, 'yi-lin-qie-fu');
assert.equal(yiLinQieFuLesson.contentRevision, '2026-08-02-approved-20');
assert.equal(guwenLessons[11]?.id, yiLinQieFuLesson.id, '第十二篇必須排在正式 App 的第 12 位');
assert.equal(approvedQuestions.length, 20, 'active 主檔應有 20 題');
assert(
  approvedQuestions.every((question) => question.status === '人工審核通過' || question.status === '已核准'),
  '第十二篇 active 主檔 20 題都必須是已核准或人工審核通過狀態',
);
assert(
  approvedQuestions.every((question) => question.diagnostics.length === 0),
  '第十二篇 active 主檔不得有成人預覽解析 diagnostics',
);
assert.equal(yiLinQieFuLesson.steps.length, 18, '第 1～18 題必須是正式 App steps');
assert.equal(totalGuwenLessonItems(yiLinQieFuLesson), 20, '第 19～20 題必須以 closing 納入總題數');
assert.equal(yiLinQieFuLesson.sequenceOrderingClosing?.id, 'closing_sequence_order');
assert.equal(yiLinQieFuLesson.evidenceMultiSelectClosing?.id, 'closing_evidence_multiselect');
assert.equal(yiLinQieFuLesson.causalChainClosing, undefined);
assert.equal(yiLinQieFuLesson.preserveAuthoredOptionOrder, true);
assert.equal(yiLinQieFuLesson.badgeClaimMode, 'scroll-end');
assert.equal(yiLinQieFuLesson.badgeName, '明察證據徽章');
assert.equal(yiLinQieFuLesson.sentences.join(''), yiLinQieFuLesson.fullText, 'sentences 必須完整拼回正式原文');
assert.equal(yiLinQieFuLesson.fullText, blockquoteAfter('## 本課採用原文'));

for (let index = 0; index < yiLinQieFuLesson.steps.length; index += 1) {
  const step = yiLinQieFuLesson.steps[index];
  const approved = approvedQuestions[index];
  assert.equal(step.targetSentence, approved.target?.text, `${step.id} targetSentence 必須來自 active MD`);
  assert.equal(step.intro, approved.intro?.text, `${step.id} intro 必須來自 active MD`);
  assert.equal(step.question, approved.question?.text, `${step.id} question 必須來自 active MD`);
  assert.deepEqual(step.options, approved.options.map((option) => option.text), `${step.id} 選項順序必須保留`);
  assert.equal(step.correctIndex, approved.correctIndex, `${step.id} 正解位置必須保留`);
  assert.equal(step.correctFeedback, approved.correctFeedback?.text, `${step.id} 答對回饋必須保留`);
  assert.equal(step.retryHint, approved.retryHint?.text, `${step.id} 第一次答錯提示必須保留`);
  assert.equal(step.explanation, approved.explanation?.text, `${step.id} 詳解必須保留`);
  assert.deepEqual(
    step.keys?.map((key) => [key.code, key.decodedEvidence]) ?? [],
    approved.preAnswerKeys.map((key) => [key.code.text, key.decodedEvidence.text]),
    `${step.id} 作答前密碼鑰匙必須保留`,
  );

  if (approved.clues.length > 0) {
    assert.equal(step.type, 'evidence', `${step.id} 有線索題必須映射成 evidence`);
    if (step.type !== 'evidence') continue;
    approved.clues.forEach((clue, clueIndex) => {
      assert.equal(step.clues[clueIndex]?.text, clue.text, `${step.id} 線索 ${clueIndex + 1} 原文必須保留`);
      assert.equal(step.clues[clueIndex]?.unlockedMeaning, clue.meaning?.text, `${step.id} 線索白話必須保留`);
      assert.equal(step.clues[clueIndex]?.source, clue.source?.text, `${step.id} 線索出處必須保留`);
    });
  }
}

assert.equal(yiLinQieFuLesson.steps[10]?.type, 'story_reasoning', '第 11 題人物追蹤應為 story_reasoning');
assert.equal(yiLinQieFuLesson.steps[13]?.type, 'local_inference', '第 14 題物主追蹤應為 local_inference');
assert.equal(yiLinQieFuLesson.steps[15]?.type, 'local_inference', '第 16 題時間詞整合應為 local_inference');

const q19 = approvedQuestions[18];
assert.equal(yiLinQieFuLesson.sequenceOrderingClosing?.intro, q19.intro?.text);
assert.deepEqual(
  yiLinQieFuLesson.sequenceOrderingClosing?.cards.map((card) => [card.id, card.text]),
  q19.sequenceCards.map((card) => [card.id, card.text]),
  '第 19 題事件卡與順序必須保留',
);
assert.deepEqual(yiLinQieFuLesson.sequenceOrderingClosing?.correctOrder, q19.sequenceCorrectOrder);
assert.equal(yiLinQieFuLesson.sequenceOrderingClosing?.correctFeedback, q19.correctFeedback?.text);
assert.equal(yiLinQieFuLesson.sequenceOrderingClosing?.retryHint, q19.retryHint?.text);
assert.equal(yiLinQieFuLesson.sequenceOrderingClosing?.explanation, q19.explanation?.text);

const q20 = approvedQuestions[19];
assert.equal(yiLinQieFuLesson.evidenceMultiSelectClosing?.intro, q20.intro?.text);
assert.deepEqual(
  yiLinQieFuLesson.evidenceMultiSelectClosing?.options.map((option) => [option.correct, option.text]),
  q20.multiSelectOptions.map((option) => [option.correct, option.text]),
  '第 20 題勾選項與正解旗標必須保留',
);
assert.equal(yiLinQieFuLesson.evidenceMultiSelectClosing?.correctFeedback, q20.correctFeedback?.text);
assert.equal(yiLinQieFuLesson.evidenceMultiSelectClosing?.retryHint, q20.retryHint?.text);
assert.equal(yiLinQieFuLesson.evidenceMultiSelectClosing?.finalNote, q20.explanation?.text);
assert.equal(yiLinQieFuLesson.evidenceMultiSelectClosing?.submitButtonLabel, q20.question?.text);

const requiredIds = [
  ...yiLinQieFuLesson.steps.map((step) => step.id),
  'closing_sequence_order',
  'closing_evidence_multiselect',
];
assert.deepEqual(yiLinQieFuLesson.finalVerification.prerequisiteStepIds, requiredIds, '白話卷軸必須等全部 20 題完成');
assert.equal(yiLinQieFuLesson.finalVerification.translation, blockquoteAfter('### 完整白話文'));
assert.deepEqual(yiLinQieFuLesson.finalVerification.evidenceBoundary, [blockquoteAfter('### 證據邊界')]);
assert.equal(yiLinQieFuLesson.finalVerification.completionFeedback, blockquoteAfter('### 全文完成鼓勵'));
assert.equal(yiLinQieFuLesson.introPronunciationCues, undefined);
assert.equal(yiLinQieFuLesson.fullTextPronunciationCues, undefined);
assert.equal(yiLinQieFuLesson.sentencePronunciationCues, undefined);

console.log('第十二篇《疑鄰竊斧》App 資料驗證通過。');
