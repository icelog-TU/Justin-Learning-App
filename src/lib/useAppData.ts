import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type AppData,
  type SentenceLogEntry,
  type BookmarkedIdiom,
  loadData,
  saveData,
  recordVisitToday,
  normalizeAppData,
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
  recordAssociationCrack as recordAssociationCrackMutation,
  recordGuwenWordDecoded as recordGuwenWordDecodedMutation,
  recordGuwenTextCompleted as recordGuwenTextCompletedMutation,
  resetGuwenProgress as resetGuwenProgressMutation,
} from './storage';
import type { GachaResult } from './rewards';
import type { CustomChainEntry } from './chainGame';
import type { CelebrationTrigger } from '../components/CelebrationOverlay';
import { getOrCreateSyncCode, setSyncCode as setSyncCodeStorage } from './syncCode';
import { fetchCloudData, pushCloudData, subscribeCloudData } from './cloudSync';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'error';

const PUSH_DEBOUNCE_MS = 1200;

export function useAppData() {
  const [data, setData] = useState<AppData>(() => recordVisitToday(loadData()));
  const [celebration, setCelebration] = useState<CelebrationTrigger | null>(null);
  const celebrationCounter = useRef(0);

  const [syncCode, setSyncCodeState] = useState(() => getOrCreateSyncCode());
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  // Tracks the logical "last modified" time for the whole AppData blob without touching every mutator above.
  const lastModifiedRef = useRef(0);
  // Set right before setData() is called with cloud-sourced data, so the save-effect below can tell a
  // remote-originated change from a real local edit and skip re-pushing it (avoids sync ping-pong).
  const applyingRemoteRef = useRef(false);
  const pushTimerRef = useRef<number | null>(null);
  // Skipped on the very first run of the save-effect (mount) — initial cloud reconciliation is the
  // fetch/subscribe effect's job below, not this one's.
  const didMountRef = useRef(false);
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    saveData(data);

    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }

    if (applyingRemoteRef.current) {
      applyingRemoteRef.current = false;
      return;
    }

    lastModifiedRef.current = Date.now();
    const stamp = lastModifiedRef.current;

    if (pushTimerRef.current !== null) {
      window.clearTimeout(pushTimerRef.current);
    }
    pushTimerRef.current = window.setTimeout(() => {
      pushTimerRef.current = null;
      setSyncStatus('syncing');
      pushCloudData(syncCode, data, stamp)
        .then(() => setSyncStatus('synced'))
        .catch(() => setSyncStatus('error'));
    }, PUSH_DEBOUNCE_MS);
  }, [data, syncCode]);

  // Initial cloud fetch + realtime subscription for whichever sync code is currently active.
  useEffect(() => {
    let cancelled = false;
    setSyncStatus('syncing');

    fetchCloudData(syncCode)
      .then((cloud) => {
        if (cancelled) return;
        if (cloud && cloud.updatedAt > lastModifiedRef.current) {
          applyingRemoteRef.current = true;
          lastModifiedRef.current = cloud.updatedAt;
          setData(normalizeAppData(cloud.data));
        } else if (!cloud) {
          const stamp = Date.now();
          lastModifiedRef.current = stamp;
          void pushCloudData(syncCode, dataRef.current, stamp);
        }
        setSyncStatus('synced');
      })
      .catch(() => {
        if (!cancelled) setSyncStatus('offline');
      });

    const unsubscribe = subscribeCloudData(syncCode, (cloud) => {
      if (cloud.updatedAt > lastModifiedRef.current) {
        applyingRemoteRef.current = true;
        lastModifiedRef.current = cloud.updatedAt;
        setData(normalizeAppData(cloud.data));
        setSyncStatus('synced');
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
      if (pushTimerRef.current !== null) {
        window.clearTimeout(pushTimerRef.current);
        pushTimerRef.current = null;
      }
    };
  }, [syncCode]);

  const linkSyncCode = useCallback((code: string) => {
    const normalized = setSyncCodeStorage(code);
    lastModifiedRef.current = 0;
    didMountRef.current = false;
    setSyncCodeState(normalized);
  }, []);

  const answer = useCallback((kind: 'idiomStats' | 'confusableStats', id: string, correct: boolean) => {
    setData((prev) => ({ ...recordAnswer({ ...prev }, kind, id, correct) }));
  }, []);

  const logSentence = useCallback((entry: SentenceLogEntry) => {
    setData((prev) => ({ ...recordSentence({ ...prev }, entry) }));
  }, []);

  const reward = useCallback((coins: number, stars: number, opts?: { big?: boolean; celebrate?: boolean }) => {
    setData((prev) => ({ ...earnRewards({ ...prev }, coins, stars) }));
    // A feature-specific completion ceremony can suppress only this generic overlay while still awarding
    // and persisting the currency above. This prevents two banners and two sound sequences from stacking.
    if (opts?.celebrate === false) return;
    celebrationCounter.current += 1;
    setCelebration({ coins, stars, nonce: celebrationCounter.current, big: opts?.big });
  }, []);

  // Computed directly off `dataRef.current` and written via a plain `setData(nextData)` rather than the
  // functional-updater form — React does not guarantee a functional updater runs synchronously (it's an
  // "eager state" fast path that's skipped once more than one update is already queued, e.g. from rapid
  // repeated taps), so a `let result` closed over and assigned *inside* the updater is not reliably set by
  // the time this function returns. That used to be exactly the "轉蛋連續按太快，扣了金幣卻抽不到角色" bug: the
  // coin deduction and character grant genuinely did land in `data` once React got around to applying the
  // queued updater, but the caller's `rollGacha()` return value — read immediately, before that — could
  // still be `null`, so the UI showed nothing for a roll that actually happened. Same fix already applied to
  // `recordAssociationCrack` below; see its comment for the general rule.
  const rollGacha = useCallback((): GachaResult | null => {
    const outcome = rollGachaMutation({ ...dataRef.current, characters: { ...dataRef.current.characters } });
    setData(outcome.data);
    return outcome.result;
  }, []);

  const giveHeart = useCallback((id: string): boolean => {
    const outcome = giveHeartMutation({ ...dataRef.current, characters: { ...dataRef.current.characters } }, id);
    setData(outcome.data);
    return outcome.success;
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

  // Note: this only performs the write. React's setState updater callback is not guaranteed to run
  // synchronously, so callers must decide isNewCharacter/milestone-crossing from the current `data`
  // prop (read side) *before* calling this, rather than trying to read a result back out of it.
  const recordAssociationCrack = useCallback((char: string, words: [string, string, string, string]) => {
    setData((prev) => ({
      ...recordAssociationCrackMutation(
        { ...prev, associationCracked: { ...prev.associationCracked }, associationCrackLog: { ...prev.associationCrackLog } },
        char,
        words,
      ).data,
    }));
  }, []);

  const recordGuwenWord = useCallback((textId: string, wordId: string) => {
    setData((prev) => ({
      ...recordGuwenWordDecodedMutation({ ...prev, guwenProgress: { ...prev.guwenProgress } }, textId, wordId),
    }));
  }, []);

  const completeGuwenText = useCallback((textId: string) => {
    setData((prev) => ({
      ...recordGuwenTextCompletedMutation({ ...prev, guwenProgress: { ...prev.guwenProgress } }, textId),
    }));
  }, []);

  const resetGuwenText = useCallback((textId: string) => {
    setData((prev) => ({
      ...resetGuwenProgressMutation({ ...prev, guwenProgress: { ...prev.guwenProgress } }, textId),
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
    recordAssociationCrack,
    recordGuwenWord,
    completeGuwenText,
    resetGuwenText,
    syncCode,
    syncStatus,
    linkSyncCode,
  };
}
