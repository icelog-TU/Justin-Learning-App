import fs from 'node:fs';
import { changGanRuChengLesson as lesson } from '../src/data/changGanRuChengLesson';
import { guwenLessons, totalGuwenLessonItems } from '../src/data/guwenLesson';
import { parseDraftQuestions } from '../src/lib/guwenDraftPreview';
import {
  normalizeAppData,
  recordGuwenWordDecoded,
  resetGuwenProgress,
} from '../src/lib/storage';

function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const approved = parseDraftQuestions(
  fs.readFileSync('08-guwen-changganrucheng-decoder-content.md', 'utf8'),
);
const reminderByQuestion: Record<number, string> = {
  2: '舊鑰匙「有……者」會帶出某一個人。',
  9: '舊鑰匙「曰」表示後面接著這個人說的話。',
  12: '舊鑰匙「吾」指正在說話的人自己。',
  16: '舊鑰匙「以＋工具」表示使用後面的工具。',
  18: '「遂」接出後續結果；「之」要回前文找所指的東西。',
};

check(lesson.contentRevision === '2026-07-30-approved-20', '第八篇 contentRevision 尚未更新');
check(approved.length === 20, `第八篇核准主檔應有 20 題，目前解析到 ${approved.length} 題`);
check(lesson.steps.length === 18, `第八篇應有 18 道正文題，目前為 ${lesson.steps.length}`);
check(totalGuwenLessonItems(lesson) === 20, '第八篇連同兩道收尾題應共 20 題');
check(lesson.sentences.join('') === lesson.fullText, '第八篇分句合併後與核准原文不一致');
check(lesson.completeCorrectFeedbackAsCore, '第八篇未把完整核准回饋當作核心解答');
check(lesson.preserveAuthoredOptionOrder, '第八篇沒有保留核准選項順序');
check(lesson.splitFeedbackParagraphs, '第八篇沒有依段落播放核准回饋');
check(!JSON.stringify(lesson).includes('pronunciationCue'), '第八篇仍含舊式側邊讀音提示');
check(guwenLessons[7]?.id === lesson.id, '第八篇沒有排在正式 App 的第八個位置');

lesson.steps.forEach((step, index) => {
  const source = approved[index];
  check(source, `核准主檔缺少第 ${index + 1} 題`);
  check(step.targetSentence === source.target?.text, `${step.id} 的目標句未同步核准主檔`);
  const expectedIntro = reminderByQuestion[source.number]
    ? `${reminderByQuestion[source.number]}\n\n${source.intro?.text}`
    : source.intro?.text;
  check(step.intro === expectedIntro, `${step.id} 的引導語或舊鑰匙提醒未同步核准主檔`);
  check(step.type !== 'reveal', `${step.id} 不應是無作答題型`);
  check(step.question === source.question?.text, `${step.id} 的問題未同步核准主檔`);
  check(
    JSON.stringify(step.options) === JSON.stringify(source.options.map((option) => option.text)),
    `${step.id} 的選項未同步核准主檔`,
  );
  check(step.correctIndex === source.correctIndex, `${step.id} 的正解位置未同步核准主檔`);
  check(step.correctFeedback === source.correctFeedback?.text, `${step.id} 的核心解答未同步核准主檔`);
  check(step.retryHint === source.retryHint?.text, `${step.id} 的答錯提示未同步核准主檔`);
  check(step.explanation === source.explanation?.text, `${step.id} 的詳解未同步核准主檔`);

  if (step.type === 'evidence') {
    step.clues.forEach((clue, clueIndex) => {
      const sourceClue = source.clues[clueIndex];
      check(
        clue.text === sourceClue?.text.replace(/[【】]/g, ''),
        `${step.id} 線索 ${clueIndex + 1} 原文未同步`,
      );
      check(
        clue.highlight === sourceClue?.text.match(/【([^】]+)】/)?.[1],
        `${step.id} 線索 ${clueIndex + 1} 反白範圍未同步`,
      );
      check(
        clue.unlockedMeaning === sourceClue?.meaning?.text,
        `${step.id} 線索 ${clueIndex + 1} 白話未同步`,
      );
      check(clue.source === sourceClue?.source?.text, `${step.id} 線索 ${clueIndex + 1} 出處未同步`);
    });
  }

  if (step.type === 'reconstruction') {
    check(
      JSON.stringify(step.keys) === JSON.stringify(
        source.preAnswerKeys.map((key) => ({
          code: key.code.text,
          decodedEvidence: key.decodedEvidence.text,
        })),
      ),
      `${step.id} 的作答前密碼鑰匙未同步`,
    );
  }
});

check(
  lesson.steps.flatMap((step, index) => step.finalDraftLine ? [index + 1] : []).join(',') ===
    '2,5,8,12,16,18',
  '完整句意沒有依「無後續重建才交付」規則進入破譯稿',
);

const q19 = approved[18];
const q20 = approved[19];
check(lesson.sequenceOrderingClosing?.intro === q19.intro?.text, '第 19 題引導語未同步');
check(
  lesson.sequenceOrderingClosing?.cards.map((card) => card.text).join('\n') === [
    '老人建議用鋸子從中間截斷長竿。',
    '魯國人拿著長竿，想進城門。',
    '魯國人照著建議截斷長竿。',
    '魯國人直拿、平拿都失敗，想不出辦法。',
    '一位年長男子來到，說自己見過很多事情。',
  ].join('\n'),
  '第 19 題五張故事卡未同步',
);
check(lesson.sequenceOrderingClosing?.correctOrder.join('') === 'BDEAC', '第 19 題故事順序不正確');
check(lesson.sequenceOrderingClosing?.correctFeedback === q19.correctFeedback?.text, '第 19 題核心解答未同步');
check(lesson.sequenceOrderingClosing?.retryHint === q19.retryHint?.text, '第 19 題答錯提示未同步');
check(lesson.sequenceOrderingClosing?.explanation === q19.explanation?.text, '第 19 題詳解未同步');

check(lesson.evidenceMultiSelectClosing?.intro === q20.intro?.text, '第 20 題引導語未同步');
check(lesson.evidenceMultiSelectClosing?.options.length === 8, '第 20 題應有八個判斷項目');
check(
  lesson.evidenceMultiSelectClosing?.options
    .flatMap((option, index) => option.correct ? [index + 1] : [])
    .join(',') === '1,3,5,6',
  '第 20 題正解應為 1、3、5、6',
);
check(lesson.evidenceMultiSelectClosing?.correctFeedback === q20.correctFeedback?.text, '第 20 題核心解答未同步');
check(lesson.evidenceMultiSelectClosing?.retryHint === q20.retryHint?.text, '第 20 題答錯提示未同步');

const allIds = [
  ...lesson.steps.map((step) => step.id),
  lesson.sequenceOrderingClosing?.id,
  lesson.evidenceMultiSelectClosing?.id,
].filter((id): id is string => Boolean(id));
check(new Set(allIds).size === 20, '第八篇題目 ID 有缺漏或重複');
check(
  lesson.finalVerification.prerequisiteStepIds.length === 20 &&
    lesson.finalVerification.prerequisiteStepIds.every((id) => allIds.includes(id)),
  '白話驗證卷軸沒有鎖到全部 20 題',
);
check(lesson.finalVerification.comparisonRows.length === 0, '核准主檔沒有的舊版對照表仍在正式 App');
check(lesson.badgeClaimMode === 'scroll-end', '徽章按鈕沒有放在驗證卷軸最底部');

const legacy = normalizeAppData({
  guwenProgress: {
    [lesson.id]: {
      decodedWordIds: ['old-step'],
      completedAt: '2026-07-01T00:00:00.000Z',
      timesCompleted: 3,
    },
  },
});
const migrated = recordGuwenWordDecoded(
  structuredClone(legacy),
  lesson.id,
  lesson.steps[0].id,
  lesson.contentRevision,
);
check(migrated.guwenProgress[lesson.id].decodedWordIds.join() === lesson.steps[0].id, '新版未重置舊題解鎖狀態');
check(migrated.guwenProgress[lesson.id].timesCompleted === 3, '改版遺失既有完成次數');
const reset = resetGuwenProgress(structuredClone(legacy), lesson.id, lesson.contentRevision);
check(reset.guwenProgress[lesson.id].timesCompleted === 3, '重設新版進度時遺失既有完成次數');

console.log('《長竿入城》第八篇：核准主檔、正式 App 資料、收尾題與進度遷移檢查通過。');
