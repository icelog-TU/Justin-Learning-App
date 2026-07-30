import { guwenLessons, totalGuwenLessonItems } from '../data/guwenLesson';
import type { AppData } from './storage';

export interface PracticeSummaryItem {
  id: 'chain' | 'association' | 'guwen' | 'sentence';
  label: string;
  value: number;
  unit: string;
  description: string;
}

export interface PracticeSummary {
  total: number;
  items: PracticeSummaryItem[];
}

function countAssociationCracks(data: AppData): number {
  return Object.values(data.associationCracked).reduce((sum, count) => sum + Math.max(0, count), 0);
}

function countCurrentGuwenDecodedItems(data: AppData): number {
  return guwenLessons.reduce((sum, lesson) => {
    const progress = data.guwenProgress[lesson.id];
    if (!progress) return sum;
    if (progress.contentRevision && progress.contentRevision !== lesson.contentRevision) return sum;

    const decodedCount = new Set(progress.decodedWordIds).size;
    return sum + Math.min(decodedCount, totalGuwenLessonItems(lesson));
  }, 0);
}

export function buildPracticeSummary(data: AppData): PracticeSummary {
  const chainLinks = Math.max(0, data.chainStats.totalLinks);
  const associationCracks = countAssociationCracks(data);
  const guwenDecodedItems = countCurrentGuwenDecodedItems(data);
  const passedSentences = data.sentenceLog.filter((entry) => entry.passed).length;

  const items: PracticeSummaryItem[] = [
    {
      id: 'chain',
      label: '成語接龍師',
      value: chainLinks,
      unit: '個',
      description: '成功接上的成語數',
    },
    {
      id: 'association',
      label: '一字成語王',
      value: associationCracks,
      unit: '次',
      description: '完成四格破解的次數',
    },
    {
      id: 'guwen',
      label: '古文破譯家',
      value: guwenDecodedItems,
      unit: '題',
      description: '目前正式教材已破解的題數',
    },
    {
      id: 'sentence',
      label: '造句練習',
      value: passedSentences,
      unit: '句',
      description: '通過檢查的句子數',
    },
  ];

  return {
    total: items.reduce((sum, item) => sum + item.value, 0),
    items,
  };
}
