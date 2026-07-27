import assert from 'node:assert/strict';
import fs from 'node:fs';
import { shouZhuDaiTuLesson } from '../src/data/shouZhuDaiTuLesson';
import { guwenLessons } from '../src/data/guwenLesson';
import { SHOU_ZHU_DAI_TU_PRONUNCIATION_AUDIT_CATALOG } from '../src/data/shouZhuDaiTuPronunciationAudit';

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

assert.equal(shouZhuDaiTuLesson.contentRevision, '2026-07-27-rewrite-v1');
assert.equal(
  guwenLessons.find((lesson) => lesson.id === 'shou-zhu-dai-tu')?.contentRevision,
  '2026-07-27-rewrite-v1',
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
assert.equal(
  shouZhuDaiTuLesson.evidenceMultiSelectClosing?.intro,
  '故事已經排好了。最後想麻煩古文破譯家檢查：哪些內容是文章明確寫出來的，請打勾。',
  '第 18 題引導語必須使用最新版核准文字',
);
assert.equal(shouZhuDaiTuLesson.causalChainClosing, undefined, '第四篇沒有額外因果鏈收尾頁');
assert.equal(shouZhuDaiTuLesson.preserveAuthoredOptionOrder, true);
assert.equal(shouZhuDaiTuLesson.badgeClaimMode, 'scroll-end');

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

assert.equal(shouZhuDaiTuLesson.introPronunciationCues, undefined);
assert.equal(shouZhuDaiTuLesson.fullTextPronunciationCues, undefined);
assert.equal(shouZhuDaiTuLesson.sentencePronunciationCues, undefined);

function collectSpeechLeaves(value: unknown, result: string[] = []): string[] {
  if (typeof value === 'string') {
    result.push(...value.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean));
    return result;
  }
  if (Array.isArray(value)) {
    value.forEach((entry) => collectSpeechLeaves(entry, result));
    return result;
  }
  if (value && typeof value === 'object') {
    Object.values(value).forEach((entry) => collectSpeechLeaves(entry, result));
  }
  return result;
}

const normalize = (text: string) => text.replace(/[【】]/g, '').trim();
const lessonSpeechLeaves = new Set(collectSpeechLeaves(shouZhuDaiTuLesson).map(normalize));

assert.equal(SHOU_ZHU_DAI_TU_PRONUNCIATION_AUDIT_CATALOG.length, 35);
for (const item of SHOU_ZHU_DAI_TU_PRONUNCIATION_AUDIT_CATALOG) {
  assert(
    lessonSpeechLeaves.has(normalize(item.displayText)),
    `正式實聽語音沒有出現在 App 核准文案中：${item.id}｜${item.displayText}`,
  );
}

const masterText = normalize(
  fs
    .readFileSync(new URL('../04-guwen-shouzhudaitu-decoder-content.md', import.meta.url), 'utf8')
    .replace(/\*\*/g, ''),
);
const technicalKeys = new Set([
  'id',
  'type',
  'prerequisiteIds',
  'prerequisiteStepIds',
  'correctIndex',
  'correctOrder',
  'contentRevision',
  'badgeClaimMode',
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
