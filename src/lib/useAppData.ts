import { useCallback, useEffect, useState } from 'react';
import {
  type AppData,
  type SentenceLogEntry,
  loadData,
  saveData,
  recordVisitToday,
  recordAnswer,
  recordSentence,
  earnRewards,
  rollGacha as rollGachaMutation,
  giveHeart as giveHeartMutation,
} from './storage';
import type { GachaResult } from './rewards';

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

  const reward = useCallback((coins: number, stars: number) => {
    setData((prev) => ({ ...earnRewards({ ...prev }, coins, stars) }));
  }, []);

  const rollGacha = useCallback((): GachaResult | null => {
    let result: GachaResult | null = null;
    setData((prev) => {
      const outcome = rollGachaMutation({ ...prev, characters: { ...prev.characters } });
      result = outcome.result;
      return outcome.data;
    });
    return result;
  }, []);

  const giveHeart = useCallback((id: string): boolean => {
    let success = false;
    setData((prev) => {
      const outcome = giveHeartMutation({ ...prev, characters: { ...prev.characters } }, id);
      success = outcome.success;
      return outcome.data;
    });
    return success;
  }, []);

  return { data, answer, logSentence, reward, rollGacha, giveHeart };
}
