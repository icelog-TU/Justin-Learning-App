import assert from 'node:assert/strict';
import { guwenLessons } from '../src/data/guwenLesson';
import { buildPracticeSummary } from '../src/lib/practiceSummary';
import { normalizeAppData, type AppData } from '../src/lib/storage';

function makeData(partial: Partial<AppData>): AppData {
  return normalizeAppData(partial);
}

const firstLesson = guwenLessons[0]!;

const data = makeData({
  idiomStats: {
    legacy_idiom_quiz_result_should_not_count: {
      seen: 5,
      correct: 5,
      lastCorrect: true,
      lastSeenAt: '2026-07-30T00:00:00.000Z',
    },
  },
  chainStats: { totalLinks: 6, longestChain: 4 },
  associationCracked: { 木: 1, 水: 3 },
  sentenceLog: [
    { idiomId: 'a', word: '成語一', sentence: '我寫了一句。', passed: true, date: '2026-07-30T00:00:00.000Z' },
    { idiomId: 'b', word: '成語二', sentence: '這句沒過。', passed: false, date: '2026-07-30T00:00:00.000Z' },
    { idiomId: 'c', word: '成語三', sentence: '這句通過。', passed: true, date: '2026-07-30T00:00:00.000Z' },
  ],
  guwenProgress: {
    [firstLesson.id]: {
      decodedWordIds: [firstLesson.steps[0]!.id, firstLesson.steps[1]!.id, firstLesson.steps[1]!.id],
      contentRevision: firstLesson.contentRevision,
    },
  },
});

const summary = buildPracticeSummary(data);

assert.deepEqual(
  summary.items.map((item) => [item.id, item.value]),
  [
    ['chain', 6],
    ['association', 4],
    ['guwen', 2],
    ['sentence', 2],
  ],
);
assert.equal(summary.total, 14, '已完成練習總數應只統計核心練習項目');
assert.equal(
  summary.items.some((item) => item.label.includes('成語測驗')),
  false,
  '首頁新總覽不應再把成語測驗答對數當成核心統計',
);

const staleGuwen = buildPracticeSummary(
  makeData({
    guwenProgress: {
      [firstLesson.id]: {
        decodedWordIds: [firstLesson.steps[0]!.id],
        contentRevision: 'old-revision',
      },
    },
  }),
);

assert.equal(staleGuwen.items.find((item) => item.id === 'guwen')?.value, 0, '舊版古文進度不應混入新版正式教材題數');

console.log('已完成練習統計驗證通過。');
