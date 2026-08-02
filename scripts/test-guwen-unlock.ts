import assert from 'node:assert/strict';
import { guwenLessons } from '../src/data/guwenLesson';
import {
  getGuwenLessonUnlockState,
  hasEverCompletedGuwenLesson,
} from '../src/lib/guwenUnlock';
import { normalizeAppData, type AppData } from '../src/lib/storage';

function progressData(
  guwenProgress: AppData['guwenProgress'],
  guwenAllLessonsUnlocked = false,
): Pick<AppData, 'guwenProgress' | 'guwenAllLessonsUnlocked'> {
  return { guwenProgress, guwenAllLessonsUnlocked };
}

const [first, second, third] = guwenLessons;
const empty = progressData({});

assert.equal(getGuwenLessonUnlockState(empty, guwenLessons, first.id).unlocked, true, 'The first lesson is always unlocked');
assert.equal(getGuwenLessonUnlockState(empty, guwenLessons, second.id).unlocked, false, 'The second lesson waits for the first');
assert.equal(getGuwenLessonUnlockState(empty, guwenLessons, third.id).unlocked, false, 'The third lesson waits for earlier lessons');

const firstCompleted = progressData({
  [first.id]: { decodedWordIds: [], completedAt: '2026-07-29T00:00:00.000Z' },
});
assert.equal(getGuwenLessonUnlockState(firstCompleted, guwenLessons, second.id).unlocked, true, 'Completing the first unlocks the second');
assert.equal(getGuwenLessonUnlockState(firstCompleted, guwenLessons, third.id).unlocked, false, 'Completing only the first does not unlock the third');

const resetAfterCompletion = progressData({
  [first.id]: { decodedWordIds: [], timesCompleted: 1 },
});
assert.equal(hasEverCompletedGuwenLesson(resetAfterCompletion, first.id), true, 'A reset preserves lifetime completion');
assert.equal(
  getGuwenLessonUnlockState(resetAfterCompletion, guwenLessons, second.id).unlocked,
  true,
  'A reset does not relock later lessons',
);

const firstTwoCompleted = progressData({
  [first.id]: { decodedWordIds: [], timesCompleted: 1 },
  [second.id]: { decodedWordIds: [], timesCompleted: 1 },
});
assert.equal(getGuwenLessonUnlockState(firstTwoCompleted, guwenLessons, third.id).unlocked, true, 'Completing the first two unlocks the third');

const skippedCompletion = progressData({
  [second.id]: { decodedWordIds: [], timesCompleted: 1 },
});
assert.equal(getGuwenLessonUnlockState(skippedCompletion, guwenLessons, second.id).unlocked, false, 'A later record cannot bypass the first lesson');
assert.equal(getGuwenLessonUnlockState(skippedCompletion, guwenLessons, third.id).unlocked, false, 'A later record cannot skip earlier lessons');
assert.equal(
  getGuwenLessonUnlockState(skippedCompletion, guwenLessons, third.id).blockingLesson?.id,
  first.id,
  'The earliest incomplete lesson is reported as the blocker',
);

const reviewer = progressData({}, true);
for (const lesson of guwenLessons) {
  assert.equal(
    getGuwenLessonUnlockState(reviewer, guwenLessons, lesson.id).unlocked,
    true,
    `Reviewer access should unlock ${lesson.id}`,
  );
}
assert.equal(
  hasEverCompletedGuwenLesson(reviewer, guwenLessons.at(-1)!.id),
  false,
  'Reviewer access must not mark an unopened lesson as completed',
);

const legacyData = normalizeAppData({ guwenProgress: {} });
assert.equal(
  legacyData.guwenAllLessonsUnlocked,
  false,
  'Older saved data without the reviewer field retains sequential unlocking',
);

console.log('Guwen sequential and reviewer unlock rules passed.');
