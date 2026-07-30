import assert from 'node:assert/strict';
import fs from 'node:fs';
import { guwenLessons, totalGuwenLessonItems } from '../src/data/guwenLesson';
import { yangShiZhiZiLesson } from '../src/data/yangShiZhiZiLesson';
import { parseDraftQuestions } from '../src/lib/guwenDraftPreview';

const activeMaster = fs.readFileSync(new URL('../09-guwen-yangshizi-decoder-content.md', import.meta.url), 'utf8');
const approvedQuestions = parseDraftQuestions(activeMaster);

assert.equal(yangShiZhiZiLesson.id, 'yang-shi-zhi-zi');
assert.equal(yangShiZhiZiLesson.contentRevision, '2026-07-30-approved-20');
assert.equal(guwenLessons[8]?.id, yangShiZhiZiLesson.id, '第九篇必須排在正式 App 的第九個位置');
assert.equal(
  guwenLessons.find((lesson) => lesson.id === 'yang-shi-zhi-zi')?.contentRevision,
  '2026-07-30-approved-20',
  '正式 App 第九篇入口必須指向新版已核准資料',
);
assert.equal(approvedQuestions.length, 20, 'active 主檔應解析出 20 題');
assert(approvedQuestions.every((question) => !question.status.includes('待審')), '第九篇 active 主檔不得殘留待審題目狀態');
assert.equal(yangShiZhiZiLesson.steps.length, 19, '第 1–19 題應是一般作答 step');
assert.equal(totalGuwenLessonItems(yangShiZhiZiLesson), 20, '第 20 題應以證據多選 closing 計入總題數');
assert.equal(yangShiZhiZiLesson.sequenceOrderingClosing, undefined, '第 19 題是核准的單一排序選擇題，不是拖曳排序 closing');
assert.equal(yangShiZhiZiLesson.causalChainClosing, undefined);
assert.equal(yangShiZhiZiLesson.evidenceMultiSelectClosing?.id, 'closing_evidence_multiselect');
assert.equal(yangShiZhiZiLesson.preserveAuthoredOptionOrder, true);
assert.equal(yangShiZhiZiLesson.badgeClaimMode, 'scroll-end');
assert.equal(yangShiZhiZiLesson.introPronunciationCues, undefined);
assert.equal(yangShiZhiZiLesson.fullTextPronunciationCues, undefined);
assert.equal(yangShiZhiZiLesson.sentencePronunciationCues, undefined);
assert(!JSON.stringify(yangShiZhiZiLesson).includes('??'), 'App 資料不可含編碼替換後的問號文字');

const joinedSentences = yangShiZhiZiLesson.sentences.join('');
assert.equal(joinedSentences, yangShiZhiZiLesson.fullText, '分句接合後必須逐字等於本課採用原文');

for (let index = 0; index < yangShiZhiZiLesson.steps.length; index += 1) {
  const step = yangShiZhiZiLesson.steps[index];
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
        `${step.id} 線索 ${clueIndex + 1} 已破解白話未同步`,
      );
      assert.equal(step.clues[clueIndex]?.source, clue.source?.text, `${step.id} 線索 ${clueIndex + 1} 出處未同步`);
    });
  }
}

const q19 = approvedQuestions[18];
assert.equal(yangShiZhiZiLesson.steps[18].type, 'story_reasoning', '第 19 題應保留為單選排序題');
assert.equal(yangShiZhiZiLesson.steps[18].correctFeedback, q19.correctFeedback?.text, '第 19 題核心解答未同步');

const q20 = approvedQuestions[19];
assert.equal(yangShiZhiZiLesson.evidenceMultiSelectClosing?.intro, q20.intro?.text, '第 20 題引導語未同步');
assert.deepEqual(
  yangShiZhiZiLesson.evidenceMultiSelectClosing?.options.map((option) => [option.correct, option.text]),
  [
    [true, q20.options[0].text],
    [false, q20.options[1].text],
    [true, q20.options[2].text],
    [false, q20.options[3].text],
    [true, q20.options[4].text],
    [true, q20.options[5].text],
  ],
  '第 20 題多選卡順序或正解未同步',
);
assert.equal(yangShiZhiZiLesson.evidenceMultiSelectClosing?.correctFeedback, q20.correctFeedback?.text, '第 20 題核心解答未同步');
assert.equal(yangShiZhiZiLesson.evidenceMultiSelectClosing?.retryHint, q20.retryHint?.text, '第 20 題第一次答錯提示未同步');
assert.equal(yangShiZhiZiLesson.evidenceMultiSelectClosing?.finalNote, q20.explanation?.text, '第 20 題詳解未同步');

const prereqs = yangShiZhiZiLesson.finalVerification.prerequisiteStepIds;
assert.deepEqual(prereqs.slice(-2), ['story_order_choice', 'closing_evidence_multiselect'], '白話卷軸必須等第 19 題與第 20 題完成');
assert.equal(yangShiZhiZiLesson.finalVerification.translation.includes('孔君平前來拜訪'), true, '白話文必須同步白話驗證卷軸');
assert.equal(
  yangShiZhiZiLesson.finalVerification.guideLine,
  '原文沒有寫孩子的名字、父親去了哪裡、盤中是否還有其他水果，也沒有說孔雀真的屬於孔家。',
  '證據邊界必須同步白話驗證卷軸',
);

const zhuyinRegex = /[ㄅ-ㄩˊˇˋ˙]/u;
const nonFeedbackText = yangShiZhiZiLesson.steps
  .map((step) => [
    step.targetSentence,
    step.intro,
    step.question,
    step.retryHint,
    ...step.options,
    ...(step.type === 'evidence'
      ? step.clues.flatMap((clue) => [clue.text, clue.unlockedMeaning ?? '', clue.source])
      : []),
  ].join('\n'))
  .join('\n');
assert.equal(zhuyinRegex.test(nonFeedbackText), false, '注音不得出現在作答前、線索、選項或提示欄位');
assert(zhuyinRegex.test(yangShiZhiZiLesson.steps.map((step) => step.correctFeedback).join('\n')), '核准注音說明應只保留在核心解答');

console.log('第九篇《楊氏之子》App 資料驗證通過。');
