import { useCallback, useEffect, useState } from 'react';
import {
  type AppData,
  type SentenceLogEntry,
  loadData,
  saveData,
  recordVisitToday,
  recordAnswer,
  recordSentence,
} from './storage';

export function useAppData() {
  const [data, setData] = useState<AppData>(() => recordVisitToday(loadData()));

  useEffect(() => {
    saveData(data);
  }, [data]);

  const answer = useCallback((kind: 'idiomStats' | 'confusableStats', id: string, correct: boolean) => {
    setData((prev) => ({ ...recordAnswer({ ...prev }, kind, id, correct) }));
  }, []);

  const logSentence = useCallback((entry: SentenceLogEntry) => {
    setData((prev) => ({ ...recordSentence({ ...prev }, entry) }));
  }, []);

  return { data, answer, logSentence };
}
