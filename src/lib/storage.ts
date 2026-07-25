import {
  maxExponentForBase,
  GACHA_COST_COINS,
  GACHA_PITY_LIMIT,
  HEART_COST_STARS,
  DUPE_CONSOLATION_STARS,
  ASSOCIATION_CHAR_MILESTONE_INTERVAL,
  characterId,
  currentUnlockedBase,
  SQUARE_CHARACTER_COUNT,
  squareCharacterId,
  ownedSquareCharacterCount,
  characterMaxHearts,
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

/** One 一字成語王 full clear of a character — the 4 idioms solved (position 1..4) and when. */
export interface AssociationCrackRecord {
  words: [string, string, string, string];
  crackedAt: string;
}

/** How many coins/stars were earned on a given calendar date ("YYYY-MM-DD"). */
export interface DailyEarning {
  coins: number;
  stars: number;
}

/** 古文破譯家: progress on one classical text — which words have been decoded, and when it was fully cleared. */
export interface GuwenProgress {
  decodedWordIds: string[];
  completedAt?: string;
  /** How many times this text has ever been fully completed, across resets — survives resetGuwenProgress
   * (unlike decodedWordIds/completedAt) so a redo run can tell which attempt number it's on and pay out at
   * the matching GUWEN_REDO_REWARD_TIERS rate instead of full reward. */
  timesCompleted?: number;
}

export interface AppData {
  idiomStats: Record<string, ItemStat>;
  confusableStats: Record<string, ItemStat>;
  sentenceLog: SentenceLogEntry[];
  visitDates: string[];
  coins: number;
  stars: number;
  /** Lifetime coins/stars earned — never decreases, unlike the spendable coins/stars balance above. */
  totalCoinsEarned: number;
  totalStarsEarned: number;
  /** date ("YYYY-MM-DD") -> coins/stars earned that day */
  dailyEarnings: Record<string, DailyEarning>;
  /** character id ("base^exponent") -> hearts given so far */
  characters: Record<string, number>;
  /** Consecutive gacha rolls since the last brand-new character — drives the pity guarantee. */
  gachaPityCounter: number;
  chainStats: ChainStats;
  /** Idioms Justin's family added themselves when the built-in database was missing one. */
  customIdioms: CustomChainEntry[];
  /** Idioms Justin starred to review later — his "成語筆記本". */
  bookmarkedIdioms: BookmarkedIdiom[];
  /** History of completed chain-game rounds, most recent first — for reviewing past chains. */
  chainRoundHistory: ChainRoundLog[];
  /** 一字成語王: character -> how many times it's been fully cracked (all 4 positions solved in one round). */
  associationCracked: Record<string, number>;
  /** 一字成語王: character -> the detail (4 idioms + date) of every time it's been cracked, most recent first. */
  associationCrackLog: Record<string, AssociationCrackRecord[]>;
  /** 古文破譯家: classical text id -> decoding progress on that text. */
  guwenProgress: Record<string, GuwenProgress>;
}

function emptyData(): AppData {
  return {
    idiomStats: {},
    confusableStats: {},
    sentenceLog: [],
    visitDates: [],
    coins: 0,
    stars: 0,
    totalCoinsEarned: 0,
    totalStarsEarned: 0,
    dailyEarnings: {},
    characters: {},
    gachaPityCounter: 0,
    chainStats: { totalLinks: 0, longestChain: 0 },
    customIdioms: [],
    bookmarkedIdioms: [],
    chainRoundHistory: [],
    associationCracked: {},
    associationCrackLog: {},
    guwenProgress: {},
  };
}

/**
 * Older versions only updated longestChain when a round ended via the reroll button, not when Justin
 * simply navigated away mid-chain — so a long round already logged in chainRoundHistory could be missing
 * from longestChain. Recompute it from history on every load so past rounds get credited retroactively.
 */
export function reconcileLongestChain(data: AppData): AppData {
  const historyMax = data.chainRoundHistory.reduce((max, round) => Math.max(max, round.length), 0);
  if (historyMax > data.chainStats.longestChain) {
    return { ...data, chainStats: { ...data.chainStats, longestChain: historyMax } };
  }
  return data;
}

/**
 * Fills in any fields missing from `partial` with their empty-state default. Needed anywhere data can
 * come from outside this running app version — localStorage from an older build, or a cloud snapshot
 * pushed before a field like guwenProgress existed — since a field that's simply absent (not just empty)
 * would otherwise crash any code that assumes every AppData key is always present.
 */
export function normalizeAppData(partial: Partial<AppData>): AppData {
  return reconcileLongestChain({ ...emptyData(), ...partial });
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyData();
    const parsed = JSON.parse(raw);
    return normalizeAppData(parsed);
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

function logDailyEarning(data: AppData, coins: number, stars: number) {
  if (coins <= 0 && stars <= 0) return;
  const today = new Date().toISOString().slice(0, 10);
  const prev = data.dailyEarnings[today] ?? { coins: 0, stars: 0 };
  data.dailyEarnings = { ...data.dailyEarnings, [today]: { coins: prev.coins + coins, stars: prev.stars + stars } };
}

export function earnRewards(data: AppData, coins: number, stars: number): AppData {
  data.coins += coins;
  data.stars += stars;
  data.totalCoinsEarned += coins;
  data.totalStarsEarned += stars;
  logDailyEarning(data, coins, stars);
  return data;
}

export function rollGacha(data: AppData): { data: AppData; result: GachaResult | null } {
  if (data.coins < GACHA_COST_COINS) return { data, result: null };
  const base = currentUnlockedBase(data.characters);
  const squareCollectionActive = base === null;
  if (squareCollectionActive && ownedSquareCharacterCount(data.characters) >= SQUARE_CHARACTER_COUNT) {
    return { data, result: null };
  }

  data.coins -= GACHA_COST_COINS;

  // Pity system: if the last GACHA_PITY_LIMIT - 1 rolls were all dupes, this roll is guaranteed new.
  const forceNew = data.gachaPityCounter >= GACHA_PITY_LIMIT - 1;
  let result: GachaResult;
  if (squareCollectionActive) {
    let squareBase: number;
    if (forceNew) {
      const unowned: number[] = [];
      for (let candidate = 1; candidate <= SQUARE_CHARACTER_COUNT; candidate++) {
        if (data.characters[squareCharacterId(candidate)] === undefined) unowned.push(candidate);
      }
      squareBase = unowned[Math.floor(Math.random() * unowned.length)];
    } else {
      squareBase = 1 + Math.floor(Math.random() * SQUARE_CHARACTER_COUNT);
    }
    const id = squareCharacterId(squareBase);
    result = { kind: 'square', id, squareBase, isDupe: data.characters[id] !== undefined };
  } else {
    const maxExponent = maxExponentForBase(base);
    let exponent: number;
    if (forceNew) {
      const unowned: number[] = [];
      for (let exp = 1; exp <= maxExponent; exp++) {
        if (data.characters[characterId(base, exp)] === undefined) unowned.push(exp);
      }
      exponent = unowned[Math.floor(Math.random() * unowned.length)];
    } else {
      exponent = 1 + Math.floor(Math.random() * maxExponent);
    }
    const id = characterId(base, exponent);
    result = { kind: 'power', id, base, exponent, isDupe: data.characters[id] !== undefined };
  }

  if (result.isDupe) {
    data.stars += DUPE_CONSOLATION_STARS;
    data.totalStarsEarned += DUPE_CONSOLATION_STARS;
    logDailyEarning(data, 0, DUPE_CONSOLATION_STARS);
    data.gachaPityCounter += 1;
  } else {
    data.characters[result.id] = 0;
    data.gachaPityCounter = 0;
  }

  return { data, result };
}

export function giveHeart(data: AppData, id: string): { data: AppData; success: boolean } {
  const hearts = data.characters[id];
  if (hearts === undefined) return { data, success: false };
  const maxHearts = characterMaxHearts(id);
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

/**
 * Records a 一字成語王 full clear (all 4 positions solved in one round) for `char`, including which
 * 4 idioms were solved and when — kept so Justin can look back at exactly what he solved and on what
 * day. Returns whether this was the character's first-ever crack, and — only on a first-ever crack —
 * the milestone number (1, 2, 3, …) if the new distinct-cracked-character count just landed exactly on
 * a new multiple of ASSOCIATION_CHAR_MILESTONE_INTERVAL, so the caller knows to pay out the escalating
 * milestone bonus.
 */
export function recordAssociationCrack(
  data: AppData,
  char: string,
  words: [string, string, string, string],
): { data: AppData; isNewCharacter: boolean; milestoneNumber: number | null } {
  const prevCount = data.associationCracked[char] ?? 0;
  const isNewCharacter = prevCount === 0;
  data.associationCracked = { ...data.associationCracked, [char]: prevCount + 1 };

  const record: AssociationCrackRecord = { words, crackedAt: new Date().toISOString() };
  const prevLog = data.associationCrackLog[char] ?? [];
  data.associationCrackLog = { ...data.associationCrackLog, [char]: [record, ...prevLog].slice(0, 50) };

  let milestoneNumber: number | null = null;
  if (isNewCharacter) {
    const distinctCount = Object.keys(data.associationCracked).length;
    if (distinctCount % ASSOCIATION_CHAR_MILESTONE_INTERVAL === 0) {
      milestoneNumber = distinctCount / ASSOCIATION_CHAR_MILESTONE_INTERVAL;
    }
  }

  return { data, isNewCharacter, milestoneNumber };
}

/** Records that `wordId` has been decoded within classical text `textId`. No-op if already decoded. */
export function recordGuwenWordDecoded(data: AppData, textId: string, wordId: string): AppData {
  const prev = data.guwenProgress[textId] ?? { decodedWordIds: [] };
  if (prev.decodedWordIds.includes(wordId)) return data;
  data.guwenProgress = {
    ...data.guwenProgress,
    [textId]: { ...prev, decodedWordIds: [...prev.decodedWordIds, wordId] },
  };
  return data;
}

/** Marks `textId` as fully decoded (all its words solved) and bumps its lifetime completion count. No-op if already marked complete this run. */
export function recordGuwenTextCompleted(data: AppData, textId: string): AppData {
  const prev = data.guwenProgress[textId] ?? { decodedWordIds: [] };
  if (prev.completedAt) return data;
  data.guwenProgress = {
    ...data.guwenProgress,
    [textId]: { ...prev, completedAt: new Date().toISOString(), timesCompleted: (prev.timesCompleted ?? 0) + 1 },
  };
  return data;
}

/** Clears decoding progress for `textId` so it can be replayed from the intro screen. Coins/stars already
 * earned are kept, and so is `timesCompleted` — that count is exactly what a redo needs to remember it isn't
 * the first clear, so it must survive the reset it's tracking around. */
export function resetGuwenProgress(data: AppData, textId: string): AppData {
  const prev = data.guwenProgress[textId];
  data.guwenProgress = {
    ...data.guwenProgress,
    [textId]: { decodedWordIds: [], timesCompleted: prev?.timesCompleted ?? 0 },
  };
  return data;
}
