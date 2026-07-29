import fs from 'node:fs';
import { simaGuangLesson as lesson } from '../src/data/simaGuangLesson';
import { totalGuwenLessonItems, type LessonStep } from '../src/data/guwenLesson';
import { parseDraftQuestions } from '../src/lib/guwenDraftPreview';
import { getTtsInput } from '../src/lib/speech';

function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function withoutTtsNote(text: string | undefined): string | undefined {
  return text
    ?.split('\n')
    .filter((line) => !line.startsWith('讀音提示（'))
    .join('\n')
    .trim();
}

function awardedKeyCodes(step: LessonStep): string[] {
  if (step.keysAwarded?.length) return step.keysAwarded.map((key) => key.code);
  return step.keyAwarded ? [step.keyAwarded.code] : [];
}

check(lesson.contentRevision === '2026-07-29-full-copy-rewrite', '第二篇 contentRevision 尚未更新');
check(lesson.steps.length === 16, `第二篇應有 16 道一般題，目前為 ${lesson.steps.length}`);
check(totalGuwenLessonItems(lesson) === 18, '第二篇連同兩道收束題應共 18 題');
check(lesson.sentences.join('') === lesson.fullText, '第二篇分句合併後與全文不一致');
check(lesson.sequenceOrderingClosing?.id === 'q17', '全文排序題必須是 q17');
check(lesson.evidenceMultiSelectClosing?.id === 'q18', '證據檢查題必須是 q18');

const allIds = [
  ...lesson.steps.map((step) => step.id),
  lesson.sequenceOrderingClosing?.id,
  lesson.evidenceMultiSelectClosing?.id,
].filter((id): id is string => Boolean(id));
check(new Set(allIds).size === 18, '第二篇題目 ID 有重複或缺漏');

for (const step of lesson.steps) {
  for (const prerequisiteId of step.prerequisiteIds) {
    check(allIds.includes(prerequisiteId), `${step.id} 引用了不存在的前置題 ${prerequisiteId}`);
  }
  if (step.type !== 'reveal') {
    check(step.correctIndex >= 0 && step.correctIndex < step.options.length, `${step.id} 的正解索引超出選項範圍`);
  }
}
check(
  lesson.finalVerification.prerequisiteStepIds.length === 18
    && lesson.finalVerification.prerequisiteStepIds.every((id) => allIds.includes(id)),
  '最終驗證必須等 18 題全部完成',
);

const approvedQuestions = parseDraftQuestions(
  fs.readFileSync('02-guwen-simaguang-decoder-content.md', 'utf8'),
);
check(approvedQuestions.length === 18, `第二篇核准主檔應有 18 題，目前解析到 ${approvedQuestions.length} 題`);

lesson.steps.forEach((step, index) => {
  const approved = approvedQuestions[index];
  check(approved, `核准主檔缺少第 ${index + 1} 題`);
  check(approved.target?.text === step.targetSentence, `${step.id} 的目標句與核准主檔不一致`);
  check(withoutTtsNote(approved.intro?.text) === step.intro, `${step.id} 的引導語與核准主檔不一致`);
  if (step.type !== 'reveal') {
    check(
      (approved.question?.text ?? approved.intro?.text) === step.question,
      `${step.id} 的核心問題與核准主檔不一致`,
    );
    check(
      JSON.stringify(approved.options.map((option) => option.text)) === JSON.stringify(step.options),
      `${step.id} 的選項與核准主檔不一致`,
    );
    check(approved.correctIndex === step.correctIndex, `${step.id} 的正解與核准主檔不一致`);
    check(withoutTtsNote(approved.retryHint?.text) === step.retryHint, `${step.id} 的再試提示與核准主檔不一致`);
  }
  check(approved.correctFeedback?.text === step.correctFeedback, `${step.id} 的答對回饋與核准主檔不一致`);
  check(approved.explanation?.text === step.explanation, `${step.id} 的補充說明與核准主檔不一致`);
});

check(lesson.steps[9].type === 'reconstruction', 'q10 必須以重建題顯示既有鑰匙');
check(
  lesson.steps[9].type === 'reconstruction' && lesson.steps[9].keys[0]?.code === '棄去',
  'q10 缺少「棄去」鑰匙表',
);
check(awardedKeyCodes(lesson.steps[10]).join('|') === '持 A 擊 B|持石擊甕', 'q11 應取得兩把鑰匙');
check(awardedKeyCodes(lesson.steps[11]).join('|') === '之|本句的「之」', 'q12 應取得兩把鑰匙');
check(awardedKeyCodes(lesson.steps[13]).join('|') === '迸|水迸', 'q14 應取得兩把鑰匙');
check(awardedKeyCodes(lesson.steps[14]).join('|') === '得活|兒得活', 'q15 應取得兩把鑰匙');

check(
  approvedQuestions[16].intro?.text === lesson.sequenceOrderingClosing?.intro,
  'q17 引導語與核准主檔不一致',
);
check(
  approvedQuestions[16].correctFeedback?.text === lesson.sequenceOrderingClosing?.correctFeedback,
  'q17 答對回饋與核准主檔不一致',
);
check(
  approvedQuestions[17].intro?.text === lesson.evidenceMultiSelectClosing?.intro,
  'q18 引導語與核准主檔不一致',
);
check(
  approvedQuestions[17].correctFeedback?.text === lesson.evidenceMultiSelectClosing?.correctFeedback,
  'q18 答對回饋與核准主檔不一致',
);
check(
  lesson.badgeClaimSuccessMessage === '第二篇古文破解成功！你獲得了「司馬光破甕・故事證據徽章」！',
  '第二篇徽章朗讀句與核准文案不一致',
);
check(
  getTtsInput('鬼出沒四隅，杖莫能中。') === '鬼出末四隅，杖莫能種。',
  'q11 的「出沒／莫能中」TTS 讀音替換失效',
);
check(
  getTtsInput('兒得活。') === '兒德活。',
  '「得活」TTS 讀音替換失效',
);

console.log('司馬光第二篇：核准主檔、正式 App 資料與解鎖結構檢查通過。');
