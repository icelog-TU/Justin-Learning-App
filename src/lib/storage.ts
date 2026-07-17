const STORAGE_KEY = 'justin-chinese-app-v1';

export interface ItemStat {
  seen: number;
  correct: number;
  lastCorrect: boolean;
  lastSeenAt: string;
}

export interface SentenceLogEntry {
  idiomId: string;
  word: string;
  sentence: string;
  passed: boolean;
  date: string;
}

export interface AppData {
  idiomStats: Record<string, ItemStat>;
  confusableStats: Record<string, ItemStat>;
  sentenceLog: SentenceLogEntry[];
  visitDates: string[];
  points: number;
}

function emptyData(): AppData {
  return {
    idiomStats: {},
    confusableStats: {},
    sentenceLog: [],
    visitDates: [],
    points: 0,
  };
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyData();
    const parsed = JSON.parse(raw);
    return { ...emptyData(), ...parsed };
  } catch {
    return emptyData();
  }
}

export function saveData(data: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function recordVisitToday(data: AppData): AppData {
  const today = new Date().toISOString().slice(0, 10);
  if (!data.visitDates.includes(today)) {
    data.visitDates = [...data.visitDates, today];
  }
  return data;
}

export function getStreakDays(visitDates: string[]): number {
  if (visitDates.length === 0) return 0;
  const dates = [...visitDates].sort().reverse();
  let streak = 0;
  const cursor = new Date();
  for (let i = 0; i < dates.length; i++) {
    const expected = new Date(cursor);
    expected.setDate(cursor.getDate() - streak);
    const expectedStr = expected.toISOString().slice(0, 10);
    if (dates.includes(expectedStr)) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export function recordAnswer(
  data: AppData,
  kind: 'idiomStats' | 'confusableStats',
  id: string,
  correct: boolean,
): AppData {
  const bucket = data[kind];
  const prev = bucket[id] ?? { seen: 0, correct: 0, lastCorrect: false, lastSeenAt: '' };
  bucket[id] = {
    seen: prev.seen + 1,
    correct: prev.correct + (correct ? 1 : 0),
    lastCorrect: correct,
    lastSeenAt: new Date().toISOString(),
  };
  data.points += correct ? 10 : 0;
  return data;
}

export function recordSentence(data: AppData, entry: SentenceLogEntry): AppData {
  data.sentenceLog = [entry, ...data.sentenceLog].slice(0, 200);
  if (entry.passed) data.points += 15;
  return data;
}
