import {
  keZhouQiuJianLesson as lesson,
  totalGuwenLessonItems,
} from '../src/data/guwenLesson';
import {
  recordGuwenTextCompleted,
  recordGuwenWordDecoded,
  resetGuwenProgress,
  type AppData,
} from '../src/lib/storage';

function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

check(lesson.contentRevision === '2026-07-28-approved-20', '新版 contentRevision 不正確');
check(!('listenBeforeAccept' in lesson), '第三篇仍保留會合併兩個開場畫面的舊例外');
check(lesson.completeCorrectFeedbackAsCore, '沒有把完整答對回饋當成核心解答');
check(lesson.steps.length === 18, `正文應為 18 題，實際為 ${lesson.steps.length}`);
check(totalGuwenLessonItems(lesson) === 20, '正式課程總題數必須是 20');
check(!lesson.causalChainClosing, '未核准的舊因果單選題仍在正式新版中');
check(lesson.sequenceOrderingClosing?.cards.length === 5, '第 19 題必須有五張事件卡');
check(lesson.sequenceOrderingClosing?.correctOrder.join('') === 'CEDAB', '第 19 題正確順序不是 CEDAB');
check(lesson.evidenceMultiSelectClosing?.options.length === 6, '第 20 題必須有六個勾選項目');
check(
  lesson.evidenceMultiSelectClosing?.options
    .flatMap((option, index) => (option.correct ? [index + 1] : []))
    .join(',') === '1,4,6',
  '第 20 題正解必須是 1、4、6',
);

const ids = [
  ...lesson.steps.map((step) => step.id),
  lesson.sequenceOrderingClosing?.id,
  lesson.evidenceMultiSelectClosing?.id,
].filter((id): id is string => Boolean(id));
check(new Set(ids).size === ids.length, '正式第三篇有重複 ID');
for (const step of lesson.steps) {
  for (const prerequisiteId of step.prerequisiteIds) {
    check(ids.includes(prerequisiteId), `${step.id} 的 prerequisite ${prerequisiteId} 不存在`);
  }
  if (step.type !== 'reveal') {
    check(step.correctIndex >= 0 && step.correctIndex < step.options.length, `${step.id} 的正解位置超出選項範圍`);
    check(Boolean(step.correctFeedback.trim()), `${step.id} 缺少核心解答`);
    check(Boolean(step.explanation.trim()), `${step.id} 缺少獨立詳解`);
  }
}
check(
  lesson.finalVerification.prerequisiteStepIds.length === 20
    && lesson.finalVerification.prerequisiteStepIds.every((id) => ids.includes(id)),
  '白話驗證卷軸沒有鎖到全部 20 個必要項目',
);
check(lesson.sentences.join('') === lesson.fullText, '分句接合後不等於鎖定原文');

const legacyProgress = {
  coins: 0,
  stars: 0,
  totalCoinsEarned: 0,
  totalStarsEarned: 0,
  visits: 0,
  visitDates: [],
  dailyEarnings: {},
  bookmarks: [],
  idiomProgress: {},
  confusableProgress: {},
  sentenceRecords: [],
  collectedCharacters: [],
  characterPity: {},
  characterHearts: {},
  seenCharacterInteractions: {},
  chainHistory: [],
  longestChain: 0,
  chainRoundHistory: [],
  associationCracked: {},
  associationCrackLog: {},
  guwenProgress: {
    [lesson.id]: {
      decodedWordIds: ['old-step'],
      completedAt: '2026-07-01T00:00:00.000Z',
      timesCompleted: 3,
    },
  },
} satisfies AppData;

const migrated = recordGuwenWordDecoded(
  structuredClone(legacyProgress),
  lesson.id,
  lesson.steps[0].id,
  lesson.contentRevision,
);
check(migrated.guwenProgress[lesson.id].decodedWordIds.join() === lesson.steps[0].id, '新版沒有重置舊題解鎖狀態');
check(migrated.guwenProgress[lesson.id].timesCompleted === 3, '改版遺失既有完成次數');
const completed = recordGuwenTextCompleted(
  structuredClone(legacyProgress),
  lesson.id,
  lesson.contentRevision,
);
check(completed.guwenProgress[lesson.id].timesCompleted === 4, '改版完成後沒有沿用重玩獎勵級距');
const reset = resetGuwenProgress(
  structuredClone(legacyProgress),
  lesson.id,
  lesson.contentRevision,
);
check(reset.guwenProgress[lesson.id].timesCompleted === 3, '重設新版進度時遺失既有完成次數');

console.log('《刻舟求劍》正式 App 資料與進度遷移檢查通過');
