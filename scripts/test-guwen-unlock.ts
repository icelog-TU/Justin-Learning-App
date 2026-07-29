import assert from 'node:assert/strict';
import { guwenLessons } from '../src/data/guwenLesson';
import {
  getGuwenLessonUnlockState,
  hasEverCompletedGuwenLesson,
} from '../src/lib/guwenUnlock';
import type { AppData } from '../src/lib/storage';

function progressData(guwenProgress: AppData['guwenProgress']): Pick<AppData, 'guwenProgress'> {
  return { guwenProgress };
}

const [first, second, third] = guwenLessons;
const empty = progressData({});

assert.equal(getGuwenLessonUnlockState(empty, guwenLessons, first.id).unlocked, true, '第一篇應永遠解鎖');
assert.equal(getGuwenLessonUnlockState(empty, guwenLessons, second.id).unlocked, false, '未完成第一篇時第二篇應上鎖');
assert.equal(getGuwenLessonUnlockState(empty, guwenLessons, third.id).unlocked, false, '未完成第二篇時第三篇應上鎖');

const firstCompleted = progressData({
  [first.id]: { decodedWordIds: [], completedAt: '2026-07-29T00:00:00.000Z' },
});
assert.equal(getGuwenLessonUnlockState(firstCompleted, guwenLessons, second.id).unlocked, true, '完成第一篇應解鎖第二篇');
assert.equal(getGuwenLessonUnlockState(firstCompleted, guwenLessons, third.id).unlocked, false, '只完成第一篇不可解鎖第三篇');

const resetAfterCompletion = progressData({
  [first.id]: { decodedWordIds: [], timesCompleted: 1 },
});
assert.equal(hasEverCompletedGuwenLesson(resetAfterCompletion, first.id), true, '重玩清空後仍應記得曾完成第一篇');
assert.equal(
  getGuwenLessonUnlockState(resetAfterCompletion, guwenLessons, second.id).unlocked,
  true,
  '重玩上一篇不可把下一篇重新鎖住',
);

const firstTwoCompleted = progressData({
  [first.id]: { decodedWordIds: [], timesCompleted: 1 },
  [second.id]: { decodedWordIds: [], timesCompleted: 1 },
});
assert.equal(getGuwenLessonUnlockState(firstTwoCompleted, guwenLessons, third.id).unlocked, true, '依序完成前兩篇應解鎖第三篇');

const skippedCompletion = progressData({
  [second.id]: { decodedWordIds: [], timesCompleted: 1 },
});
assert.equal(getGuwenLessonUnlockState(skippedCompletion, guwenLessons, second.id).unlocked, false, '後篇舊紀錄不可繞過上一篇');
assert.equal(getGuwenLessonUnlockState(skippedCompletion, guwenLessons, third.id).unlocked, false, '後篇舊紀錄不可跳過更早篇章');
assert.equal(
  getGuwenLessonUnlockState(skippedCompletion, guwenLessons, third.id).blockingLesson?.id,
  first.id,
  '上鎖提示應指出最早尚未完成的篇章',
);

console.log('古文篇章依序解鎖測試通過：依上一篇完成紀錄解鎖，重玩不會重新上鎖。');
