import {
  MAX_EXPONENT,
  GACHA_COST_COINS,
  HEART_COST_STARS,
  DUPE_CONSOLATION_STARS,
  characterId,
  currentUnlockedBase,
  type GachaResult,
} from './rewards';
import type { CustomChainEntry } from './chainGame';

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

export interface ChainStats {
  totalLinks: number;
  longestChain: number;
}

/** An idiom Justin starred while playing the chain game (often one he only learned via a hint), for later review. */
export interface BookmarkedIdiom {
  word: string;
  meaning: string;
  source: string;
  addedAt: string;
}

/** A completed chain-game round, kept so Justin can look back at which idioms he chained together. */
export interface ChainRoundLog {
  words: string[];
  length: number;
  completedAt: string;
}

export interface AppData {
  idiomStats: Record<string, ItemStat>;
  confusableStats: Record<string, ItemStat>;
  sentenceLog: SentenceLogEntry[];
  visitDates: string[];
  coins: number;
  stars: number;
  /** character id ("base^exponent") -> hearts given so far */
  characters: Record<string, number>;
  chainStats: ChainStats;
  /** Idioms Justin's family added themselves when the built-in database was missing one. */
  customIdioms: CustomChainEntry[];
  /** Idioms Justin starred to review later — his "成語筆記本". */
  bookmarkedIdioms: BookmarkedIdiom[];
  /** History of completed chain-game rounds, most recent first — for reviewing past chains. */
  chainRoundHistory: ChainRoundLog[];
}

function emptyData(): AppData {
  return {
    idiomStats: {},
    confusableStats: {},
    sentenceLog: [],
    visitDates: [],
    coins: 0,
    stars: 0,
    characters: {},
    chainStats: { totalLinks: 0, longestChain: 0 },
    customIdioms: [],
    bookmarkedIdioms: [],
    chainRoundHistory: [],
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
  return data;
}

export function recordSentence(data: AppData, entry: SentenceLogEntry): AppData {
  data.sentenceLog = [entry, ...data.sentenceLog].slice(0, 200);
  return data;
}

export function earnRewards(data: AppData, coins: number, stars: number): AppData {
  data.coins += coins;
  data.stars += stars;
  return data;
}

export function rollGacha(data: AppData): { data: AppData; result: GachaResult | null } {
  if (data.coins < GACHA_COST_COINS) return { data, result: null };
  const base = currentUnlockedBase(data.characters);
  if (base === null) return { data, result: null };

  data.coins -= GACHA_COST_COINS;
  const exponent = 1 + Math.floor(Math.random() * MAX_EXPONENT);
  const id = characterId(base, exponent);
  const isDupe = data.characters[id] !== undefined;

  if (isDupe) {
    data.stars += DUPE_CONSOLATION_STARS;
  } else {
    data.characters[id] = 0;
  }

  return { data, result: { id, base, exponent, isDupe } };
}

export function giveHeart(data: AppData, id: string): { data: AppData; success: boolean } {
  const hearts = data.characters[id];
  if (hearts === undefined) return { data, success: false };
  const [, exponentStr] = id.split('^');
  const maxHearts = Number(exponentStr);
  if (hearts >= maxHearts) return { data, success: false };
  if (data.stars < HEART_COST_STARS) return { data, success: false };

  data.stars -= HEART_COST_STARS;
  data.characters[id] = hearts + 1;
  return { data, success: true };
}

export function recordChainLink(data: AppData): AppData {
  data.chainStats = { ...data.chainStats, totalLinks: data.chainStats.totalLinks + 1 };
  return data;
}

export function updateLongestChain(data: AppData, chainLength: number): AppData {
  if (chainLength > data.chainStats.longestChain) {
    data.chainStats = { ...data.chainStats, longestChain: chainLength };
  }
  return data;
}

/** Records a completed chain-game round's full idiom list for later review. No-op for empty rounds. */
export function recordChainRound(data: AppData, words: string[]): AppData {
  if (words.length === 0) return data;
  const entry: ChainRoundLog = { words, length: words.length, completedAt: new Date().toISOString() };
  data.chainRoundHistory = [entry, ...data.chainRoundHistory].slice(0, 200);
  return data;
}

export function addCustomIdiom(data: AppData, entry: CustomChainEntry): AppData {
  if (data.customIdioms.some((e) => e.word === entry.word)) return data;
  data.customIdioms = [...data.customIdioms, entry];
  return data;
}

/** Toggles a bookmark on/off for the given word — adds it if not yet bookmarked, removes it otherwise. */
export function toggleBookmark(data: AppData, entry: BookmarkedIdiom): AppData {
  const exists = data.bookmarkedIdioms.some((b) => b.word === entry.word);
  data.bookmarkedIdioms = exists
    ? data.bookmarkedIdioms.filter((b) => b.word !== entry.word)
    : [entry, ...data.bookmarkedIdioms];
  return data;
}
