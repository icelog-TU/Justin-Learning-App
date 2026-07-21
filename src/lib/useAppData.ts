import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type AppData,
  type SentenceLogEntry,
  type BookmarkedIdiom,
  loadData,
  saveData,
  recordVisitToday,
  recordAnswer,
  recordSentence,
  earnRewards,
  rollGacha as rollGachaMutation,
  giveHeart as giveHeartMutation,
  recordChainLink,
  updateLongestChain,
  addCustomIdiom as addCustomIdiomMutation,
  toggleBookmark as toggleBookmarkMutation,
  recordChainRound as recordChainRoundMutation,
} from './storage';
import type { GachaResult } from './rewards';
import type { CustomChainEntry } from './chainGame';
import type { CelebrationTrigger } from '../components/CelebrationOverlay';

export function useAppData() {
  const [data, setData] = useState<AppData>(() => recordVisitToday(loadData()));
  const [celebration, setCelebration] = useState<CelebrationTrigger | null>(null);
  const celebrationCounter = useRef(0);

  useEffect(() => {
    saveData(data);
  }, [data]);

  const answer = useCallback((kind: 'idiomStats' | 'confusableStats', id: string, correct: boolean) => {
    setData((prev) => ({ ...recordAnswer({ ...prev }, kind, id, correct) }));
  }, []);

  const logSentence = useCallback((entry: SentenceLogEntry) => {
    setData((prev) => ({ ...recordSentence({ ...prev }, entry) }));
  }, []);

  const reward = useCallback((coins: number, stars: number, opts?: { big?: boolean }) => {
    setData((prev) => ({ ...earnRewards({ ...prev }, coins, stars) }));
    celebrationCounter.current += 1;
    setCelebration({ coins, stars, nonce: celebrationCounter.current, big: opts?.big });
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

  const addChainLink = useCallback(() => {
    setData((prev) => ({ ...recordChainLink({ ...prev }) }));
  }, []);

  const reportChainLength = useCallback((length: number) => {
    setData((prev) => ({ ...updateLongestChain({ ...prev }, length) }));
  }, []);

  const addCustomIdiom = useCallback((entry: CustomChainEntry) => {
    setData((prev) => ({ ...addCustomIdiomMutation({ ...prev, customIdioms: [...prev.customIdioms] }, entry) }));
  }, []);

  const toggleBookmark = useCallback((entry: BookmarkedIdiom) => {
    setData((prev) => ({
      ...toggleBookmarkMutation({ ...prev, bookmarkedIdioms: [...prev.bookmarkedIdioms] }, entry),
    }));
  }, []);

  const recordChainRound = useCallback((words: string[]) => {
    setData((prev) => ({
      ...recordChainRoundMutation({ ...prev, chainRoundHistory: [...prev.chainRoundHistory] }, words),
    }));
  }, []);

  return {
    data,
    answer,
    logSentence,
    reward,
    rollGacha,
    giveHeart,
    addChainLink,
    reportChainLength,
    celebration,
    addCustomIdiom,
    toggleBookmark,
    recordChainRound,
  };
}
