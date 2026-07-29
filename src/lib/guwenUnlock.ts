import type { GuwenLesson } from '../data/guwenLesson';
import type { AppData } from './storage';

type GuwenProgressData = Pick<AppData, 'guwenProgress'>;

export interface GuwenLessonUnlockState {
  unlocked: boolean;
  blockingLesson?: GuwenLesson;
}

/**
 * A lesson stays completed for sequence-unlock purposes after reset or a content revision.
 * `timesCompleted` is the lifetime completion marker; `completedAt` also supports older saved data.
 */
export function hasEverCompletedGuwenLesson(data: GuwenProgressData, lessonId: string): boolean {
  const progress = data.guwenProgress[lessonId];
  return Boolean(progress?.completedAt) || (progress?.timesCompleted ?? 0) > 0;
}

export function getGuwenLessonUnlockState(
  data: GuwenProgressData,
  lessons: readonly GuwenLesson[],
  lessonId: string,
): GuwenLessonUnlockState {
  const lessonIndex = lessons.findIndex((lesson) => lesson.id === lessonId);
  if (lessonIndex < 0) return { unlocked: false };
  if (lessonIndex === 0) return { unlocked: true };

  const blockingLesson = lessons
    .slice(0, lessonIndex)
    .find((lesson) => !hasEverCompletedGuwenLesson(data, lesson.id));
  return {
    unlocked: blockingLesson === undefined,
    blockingLesson,
  };
}
