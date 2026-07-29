import fs from 'node:fs';
import { zhengRenMaiLuLesson as lesson } from '../src/data/zhengRenMaiLuLesson';
import { totalGuwenLessonItems } from '../src/data/guwenLesson';
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
  fs.readFileSync('07-guwen-zhengrenmailv-decoder-content.md', 'utf8'),
);

check(lesson.contentRevision === '2026-07-30-approved-20', '第七篇 contentRevision 尚未更新');
check(approved.length === 20, `第七篇核准主檔應有 20 題，目前解析到 ${approved.length} 題`);
check(lesson.steps.length === 18, `第七篇應有 18 道正文題，目前為 ${lesson.steps.length}`);
check(totalGuwenLessonItems(lesson) === 20, '第七篇連同兩道收尾題應共 20 題');
check(lesson.sentences.join('') === lesson.fullText, '第七篇分句合併後與核准原文不一致');
check(lesson.completeCorrectFeedbackAsCore, '第七篇未把完整核准回饋當作核心解答');
check(lesson.preserveAuthoredOptionOrder, '第七篇沒有保留核准選項順序');
check(!JSON.stringify(lesson).includes('pronunciationCue'), '第七篇仍含舊式側邊讀音提示');

lesson.steps.forEach((step, index) => {
  const source = approved[index];
  check(source, `核准主檔缺少第 ${index + 1} 題`);
  check(step.targetSentence === source.target?.text, `${step.id} 的目標句未同步核准主檔`);
  check(step.intro === source.intro?.text, `${step.id} 的引導語未同步核准主檔`);
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

check(lesson.steps[14].type === 'evidence', '第 15 題沒有改成兩條獨立外部古文線索題');
check(lesson.steps[14].type !== 'reveal' && lesson.steps[14].keysAwarded?.length === 2, '第 15 題沒有取得兩把「得」鑰匙');
check(
  lesson.steps.flatMap((step, index) => step.finalDraftLine ? [index + 1] : []).join(',') ===
    '1,4,6,15,16,18',
  '完整句意沒有依「無後續重建才交付」規則進入破譯稿',
);

const q19 = approved[18];
const q20 = approved[19];
check(lesson.sequenceOrderingClosing?.intro === q19.intro?.text, '第 19 題引導語未同步');
check(
  lesson.sequenceOrderingClosing?.cards.map((card) => `${card.id}:${card.text}`).join('\n') ===
    q19.sequenceCards.map((card) => `${card.id}:${card.text}`).join('\n'),
  '第 19 題八張卡未同步',
);
check(lesson.sequenceOrderingClosing?.correctOrder.join('') === 'BFDHEACG', '第 19 題順序不正確');
check(lesson.sequenceOrderingClosing?.correctFeedback === q19.correctFeedback?.text, '第 19 題核心解答未同步');
check(lesson.sequenceOrderingClosing?.retryHint === q19.retryHint?.text, '第 19 題答錯提示未同步');

check(lesson.evidenceMultiSelectClosing?.intro === q20.intro?.text, '第 20 題引導語未同步');
check(
  lesson.evidenceMultiSelectClosing?.options.map((option) => option.text).join('\n') ===
    q20.multiSelectOptions.map((option) => option.text).join('\n'),
  '第 20 題選項未同步',
);
check(
  lesson.evidenceMultiSelectClosing?.options
    .flatMap((option, index) => option.correct ? [index + 1] : [])
    .join(',') === '2,4,5,7,8',
  '第 20 題正解應為 2、4、5、7、8',
);
check(lesson.evidenceMultiSelectClosing?.correctFeedback === q20.correctFeedback?.text, '第 20 題核心解答未同步');
check(lesson.evidenceMultiSelectClosing?.retryHint === q20.retryHint?.text, '第 20 題答錯提示未同步');

const allIds = [
  ...lesson.steps.map((step) => step.id),
  lesson.sequenceOrderingClosing?.id,
  lesson.evidenceMultiSelectClosing?.id,
].filter((id): id is string => Boolean(id));
check(new Set(allIds).size === 20, '第七篇題目 ID 有缺漏或重複');
check(
  lesson.finalVerification.prerequisiteStepIds.length === 20 &&
    lesson.finalVerification.prerequisiteStepIds.every((id) => allIds.includes(id)),
  '白話驗證卷軸沒有鎖到全部 20 題',
);
check(lesson.finalVerification.comparisonRows.length === 0, '核准主檔沒有的舊版對照表仍在正式 App');
check(lesson.badgeClaimMode === 'scroll-end', '徽章按鈕沒有放在驗證卷軸最底部');
check(lesson.badgeClaimLabel === '收集「鄭人買履」破譯徽章', '徽章按鈕文字未同步');
check(lesson.badgeClaimSuccessMessage === '第七枚古文破譯徽章，收集成功！', '徽章成功訊息未同步');

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

console.log('《鄭人買履》第七篇：核准主檔、正式 App 資料、收尾題與進度遷移檢查通過。');
