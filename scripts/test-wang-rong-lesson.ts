import fs from 'node:fs';
import { wangRongLesson as lesson } from '../src/data/wangRongLesson';
import { totalGuwenLessonItems } from '../src/data/guwenLesson';
import { parseDraftQuestions } from '../src/lib/guwenDraftPreview';
import { getTtsInput } from '../src/lib/speech';

function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const approved = parseDraftQuestions(
  fs.readFileSync('lessons/01-guwen-wangrong-rewrite.md', 'utf8'),
);

check(lesson.contentRevision === '2026-07-29-latest-reviewed-copy', '第一篇 contentRevision 尚未更新');
check(lesson.steps.length === 18, `第一篇應有 18 道一般題，目前為 ${lesson.steps.length}`);
check(totalGuwenLessonItems(lesson) === 20, '第一篇連同兩道收束題應共 20 題');
check(approved.length === 20, `第一篇核准主檔應有 20 題，目前解析到 ${approved.length} 題`);
check(lesson.introHeadline === '古文破譯家，新任務來了！', '第一篇任務標題未同步');
check(lesson.sentences.join('') === lesson.fullText, '第一篇分句合併後與全文不一致');

lesson.steps.forEach((step, index) => {
  const source = approved[index];
  check(source, `核准主檔缺少第 ${index + 1} 題`);
  check(step.targetSentence === source.target?.text, `${step.id} 的目標句與核准主檔不一致`);
  check(step.intro === (source.intro?.text ?? source.question?.text), `${step.id} 的引導語與核准主檔不一致`);
  check(step.type !== 'reveal', `${step.id} 不應是無作答題型`);
  check(step.question === (source.question?.text ?? source.intro?.text), `${step.id} 的問題與核准主檔不一致`);
  check(
    JSON.stringify(step.options) === JSON.stringify(source.options.map((option) => option.text)),
    `${step.id} 的選項與核准主檔不一致`,
  );
  check(step.correctIndex === source.correctIndex, `${step.id} 的正解位置與核准主檔不一致`);
  check(step.correctFeedback === source.correctFeedback?.text, `${step.id} 的答對回饋與核准主檔不一致`);
  check(step.retryHint === source.retryHint?.text, `${step.id} 的再試提示與核准主檔不一致`);

  if (step.type === 'evidence') {
    step.clues.forEach((clue, clueIndex) => {
      const sourceClue = source.clues[clueIndex];
      check(clue.text === sourceClue?.text, `${step.id} 線索 ${clueIndex + 1} 原文未同步`);
      check(clue.unlockedMeaning === sourceClue.meaning?.text, `${step.id} 線索 ${clueIndex + 1} 解鎖義未同步`);
      check(clue.source === sourceClue.source?.text, `${step.id} 線索 ${clueIndex + 1} 出處未同步`);
    });
  }
});

check(
  lesson.steps[15].explanation === approved[15].explanation?.text,
  'q16 的跨題題號與核准主檔不一致',
);
check(lesson.sequenceOrderingClosing?.id === 'q19', '全文排序題必須是 q19');
check(lesson.sequenceOrderingClosing?.intro === approved[18].intro?.text, 'q19 引導語未同步');
check(lesson.sequenceOrderingClosing?.correctFeedback === approved[18].correctFeedback?.text, 'q19 答對回饋未同步');
check(lesson.evidenceMultiSelectClosing?.id === 'q20', '證據檢查題必須是 q20');
check(lesson.evidenceMultiSelectClosing?.intro === approved[19].intro?.text, 'q20 引導語未同步');
check(lesson.evidenceMultiSelectClosing?.correctFeedback === approved[19].correctFeedback?.text, 'q20 答對回饋未同步');
check(
  lesson.evidenceMultiSelectClosing?.options
    .map((option, index) => option.correct ? index + 1 : 0)
    .filter(Boolean)
    .join(',') === '2,5,6,8',
  'q20 應只勾選第 2、5、6、8 項',
);

const serialized = JSON.stringify(lesson);
check(!serialized.includes('pronunciationCue'), '第一篇仍含舊式側邊讀音提示');
check(
  lesson.steps[0].correctFeedback.includes('「少」當作「年輕」時，念作紹（ㄕㄠˋ）'),
  'q1 核心解答缺少「少」的讀音說明',
);
check(
  lesson.steps[11].correctFeedback.includes('「省」當作「反省、檢查自己」時，念作醒（ㄒㄧㄥˇ）'),
  'q12 核心解答缺少「省」的讀音說明',
);
check(
  getTtsInput('陳涉少時，嘗與人傭耕。') === '陳涉紹時，嘗與人傭耕。',
  '「少時」TTS 讀音替換失效',
);
check(
  getTtsInput('曾子曰：「吾日三省吾身。」') === '增子曰：「吾日三醒吾身。」',
  '「曾子／三省吾身」TTS 讀音替換失效',
);

console.log('王戎第一篇：核准主檔、正式 App 資料、讀音規則與收束題檢查通過。');
