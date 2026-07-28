import { idiomChainData } from '../data/idiomChain';
import { getZhuyin } from './zhuyin';
import { shuffle } from './quizUtils';

export interface MoeRawEntry {
  id: string;
  word: string;
  meaning: string;
  firstChar: string;
  firstZhuyin: string;
  char2?: string;
  char2Zhuyin?: string;
  char3?: string;
  char3Zhuyin?: string;
  lastChar: string;
  lastZhuyin: string;
}

/**
 * No meaning field — these come from MOE's 30-reference-book editorial word list, word-only.
 * `frequency` is how many of the 30 reference books include the word (2–18 in our filtered set).
 * `char2`/`char3` (2nd/3rd character) zhuyin is only present where resolvable from other sources —
 * never guessed, so it's left out entirely rather than filled with a wrong reading.
 */
export interface EditorialRawEntry {
  word: string;
  firstChar: string;
  firstZhuyin: string;
  char2?: string;
  char2Zhuyin?: string;
  char3?: string;
  char3Zhuyin?: string;
  lastChar: string;
  lastZhuyin: string;
  frequency: number;
}

/** A word Justin's family added themselves via the "加入我的題庫" flow, kept in localStorage. */
export interface CustomChainEntry {
  word: string;
  meaning: string;
  firstChar: string;
  firstZhuyin: string;
  lastChar: string;
  lastZhuyin: string;
  addedAt: string;
}

/** 1 = first character of a 4-character idiom, 4 = last. */
export type IdiomPosition = 1 | 2 | 3 | 4;

export interface ChainEntry {
  id: string;
  word: string;
  meaning: string;
  source: 'curated' | 'moe' | 'editorial' | 'custom';
  firstChar: string;
  /** toned zhuyin, e.g. "ㄇㄧㄢˋ" */
  firstZhuyin: string;
  /** 2nd/3rd character + zhuyin — only known for some entries (see EditorialRawEntry doc). */
  char2?: string;
  char2Zhuyin?: string;
  char3?: string;
  char3Zhuyin?: string;
  lastChar: string;
  lastZhuyin: string;
  /** Only set for 'editorial' entries — how many of the 30 reference books include the word. */
  frequency?: number;
}

export const IDIOM_DATABASE_SCOPE_NOTE =
  '我們的成語資料庫主要收錄有典故出處的成語，無法包含所有常用四字詞。';

export function toBaseZhuyin(zhuyin: string): string {
  return zhuyin.replace(/[ˊˇˋ˙]/g, '').trim();
}

/** Mid-position (2nd/3rd) char + zhuyin for a 4-character word, using the curated lookup table — omitted (never guessed) if unknown. */
function midPositions(word: string): { char2?: string; char2Zhuyin?: string; char3?: string; char3Zhuyin?: string } {
  if (word.length !== 4) return {};
  const char2 = word[1];
  const char3 = word[2];
  const char2Zhuyin = getZhuyin(char2);
  const char3Zhuyin = getZhuyin(char3);
  return {
    char2,
    ...(char2Zhuyin ? { char2Zhuyin } : {}),
    char3,
    ...(char3Zhuyin ? { char3Zhuyin } : {}),
  };
}

/** Our own 94 hand-written, story-backed idioms — converted to zhuyin via the curated char lookup table. */
export function buildCuratedPool(): ChainEntry[] {
  return idiomChainData.map((entry) => ({
    id: entry.id,
    word: entry.word,
    meaning: entry.meaning,
    source: 'curated',
    firstChar: entry.firstChar,
    firstZhuyin: getZhuyin(entry.firstChar),
    ...midPositions(entry.word),
    lastChar: entry.lastChar,
    lastZhuyin: getZhuyin(entry.lastChar),
  }));
}

/** MOE 成語典 entries, fetched at runtime from public/data/moe-idioms.json. */
export function buildMoePool(raw: MoeRawEntry[]): ChainEntry[] {
  return raw.map((entry) => ({ ...entry, source: 'moe' as const }));
}

/**
 * MOE's editorial word list (drawn from 30 reference books, no definitions).
 * Only usable to validate/continue a chain — never eligible as a hint, since there's no meaning to show.
 */
export function buildEditorialPool(raw: EditorialRawEntry[]): ChainEntry[] {
  return raw.map((entry) => ({
    id: `ed-${entry.word}`,
    word: entry.word,
    meaning: '',
    source: 'editorial' as const,
    firstChar: entry.firstChar,
    firstZhuyin: entry.firstZhuyin,
    char2: entry.char2,
    char2Zhuyin: entry.char2Zhuyin,
    char3: entry.char3,
    char3Zhuyin: entry.char3Zhuyin,
    lastChar: entry.lastChar,
    lastZhuyin: entry.lastZhuyin,
    frequency: entry.frequency,
  }));
}

/** User-added idioms, fetched from localStorage-backed AppData at runtime. */
export function buildCustomPool(entries: CustomChainEntry[]): ChainEntry[] {
  return entries.map((entry) => ({
    id: `custom-${entry.word}`,
    word: entry.word,
    meaning: entry.meaning,
    source: 'custom' as const,
    firstChar: entry.firstChar,
    firstZhuyin: entry.firstZhuyin,
    ...midPositions(entry.word),
    lastChar: entry.lastChar,
    lastZhuyin: entry.lastZhuyin,
  }));
}

export function isHintable(entry: ChainEntry): boolean {
  return entry.source !== 'editorial';
}

/** An 'editorial' entry cited by at least this many of the 30 reference books counts as commonly used. */
const EDITORIAL_HIGH_FREQUENCY_THRESHOLD = 10;

/**
 * How trustworthy/well-known an idiom is, for ranking hints: 3 = has a real explanation (MOE's
 * 成語典, our own curated set, or a custom entry Justin's family filled in) — 2 = no explanation,
 * but cited by 10+ of the 30 reference books — 1 = no explanation and cited by fewer than 10
 * (entries cited by 3 or fewer books are dropped from the editorial dataset entirely).
 */
export function qualityLevel(entry: ChainEntry): 1 | 2 | 3 {
  if (entry.source === 'moe' || entry.source === 'curated') return 3;
  if (entry.source === 'custom') return entry.meaning ? 3 : 1;
  return (entry.frequency ?? 0) >= EDITORIAL_HIGH_FREQUENCY_THRESHOLD ? 2 : 1;
}

export function matchesTarget(entry: ChainEntry, targetChar: string, targetZhuyin: string): boolean {
  return entry.firstChar === targetChar || toBaseZhuyin(entry.firstZhuyin) === toBaseZhuyin(targetZhuyin);
}

/**
 * Match quality, best first: 0 = exact same character, 1 = exact same reading (tone included)
 * but a different character, 2 = same reading once tone is ignored. Used to rank hints so
 * kids see the closest matches (and any exact-character group) before looser near-homophones.
 */
export function matchTier(entry: ChainEntry, targetChar: string, targetZhuyin: string): number {
  if (entry.firstChar === targetChar) return 0;
  if (entry.firstZhuyin === targetZhuyin) return 1;
  return 2;
}

export function findCandidates(
  pool: ChainEntry[],
  usedIds: Set<string>,
  targetChar: string,
  targetZhuyin: string,
): ChainEntry[] {
  return pool.filter((entry) => !usedIds.has(entry.id) && matchesTarget(entry, targetChar, targetZhuyin));
}

/**
 * Ranks every candidate for the current target along two axes: match tier (see matchTier) and
 * quality level (see qualityLevel). By default match tier is primary — same-character matches
 * lead — which can bury an all-🥉 same-character run behind higher-quality same-reading matches.
 * Pass `prioritizeQuality: true` to flip that: quality level becomes primary, surfacing every
 * 🥇 idiom (same character OR same reading) before any 🥈/🥉, for when the same-character group
 * happens to be all obscure entries.
 * Randomized within each (primary, secondary) group so the order isn't always alphabetical-ish.
 * Entries that would look identical once masked (e.g. two different idioms sharing the same first
 * and last character) are deduplicated so kids don't see the same-looking card twice.
 *
 * Returns the full ranked list — callers paginate it (see IdiomChainGame's hint pages) rather than
 * re-rolling a fresh random top-n each time, so "next page" reliably surfaces idioms not seen yet.
 */
export function rankHintCandidates(
  candidates: ChainEntry[],
  targetChar: string,
  targetZhuyin: string,
  prioritizeQuality = false,
): ChainEntry[] {
  const buckets: ChainEntry[][][] = [[[], [], []], [[], [], []], [[], [], []]];
  for (const entry of candidates) {
    const tier = matchTier(entry, targetChar, targetZhuyin);
    const levelIdx = 3 - qualityLevel(entry); // 0 (best/🥇) .. 2 (🥉)
    const [primary, secondary] = prioritizeQuality ? [levelIdx, tier] : [tier, levelIdx];
    buckets[primary][secondary].push(entry);
  }
  const ordered: ChainEntry[] = [];
  for (const primaryBucket of buckets) {
    for (const secondaryBucket of primaryBucket) {
      ordered.push(...shuffle(secondaryBucket));
    }
  }
  const result: ChainEntry[] = [];
  const seenMasks = new Set<string>();
  for (const entry of ordered) {
    const mask = maskHint(entry.word);
    if (seenMasks.has(mask)) continue;
    seenMasks.add(mask);
    result.push(entry);
  }
  return result;
}

/** The character at the given 1-based position of a 4-character idiom, or undefined if unknown. */
export function charAt(entry: ChainEntry, position: IdiomPosition): string | undefined {
  if (position === 1) return entry.firstChar;
  if (position === 2) return entry.char2;
  if (position === 3) return entry.char3;
  return entry.lastChar;
}

/** The toned zhuyin at the given 1-based position, or undefined if unknown. */
export function zhuyinAt(entry: ChainEntry, position: IdiomPosition): string | undefined {
  if (position === 1) return entry.firstZhuyin;
  if (position === 2) return entry.char2Zhuyin;
  if (position === 3) return entry.char3Zhuyin;
  return entry.lastZhuyin;
}

export function matchesTargetAtPosition(
  entry: ChainEntry,
  position: IdiomPosition,
  targetChar: string,
  targetZhuyin: string,
): boolean {
  const ch = charAt(entry, position);
  if (ch === targetChar) return true;
  const zy = zhuyinAt(entry, position);
  return zy !== undefined && toBaseZhuyin(zy) === toBaseZhuyin(targetZhuyin);
}

/** Same tiering as matchTier (0 = exact char, 1 = exact reading, 2 = same reading ignoring tone), for one specific position. */
export function matchTierAtPosition(
  entry: ChainEntry,
  position: IdiomPosition,
  targetChar: string,
  targetZhuyin: string,
): number {
  if (charAt(entry, position) === targetChar) return 0;
  if (zhuyinAt(entry, position) === targetZhuyin) return 1;
  return 2;
}

/** Every hintable, not-yet-used 4-character idiom containing targetChar (or a homophone) at the given position. */
export function findCandidatesAtPosition(
  pool: ChainEntry[],
  position: IdiomPosition,
  targetChar: string,
  targetZhuyin: string,
  usedIds: Set<string>,
): ChainEntry[] {
  return pool.filter(
    (entry) =>
      entry.word.length === 4 &&
      !usedIds.has(entry.id) &&
      matchesTargetAtPosition(entry, position, targetChar, targetZhuyin),
  );
}

/** Position-aware counterpart of rankHintCandidates, same gold-priority/same-character-priority tiering. */
export function rankCandidatesAtPosition(
  candidates: ChainEntry[],
  position: IdiomPosition,
  targetChar: string,
  targetZhuyin: string,
  prioritizeQuality = false,
): ChainEntry[] {
  const buckets: ChainEntry[][][] = [[[], [], []], [[], [], []], [[], [], []]];
  for (const entry of candidates) {
    const tier = matchTierAtPosition(entry, position, targetChar, targetZhuyin);
    const levelIdx = 3 - qualityLevel(entry);
    const [primary, secondary] = prioritizeQuality ? [levelIdx, tier] : [tier, levelIdx];
    buckets[primary][secondary].push(entry);
  }
  const ordered: ChainEntry[] = [];
  for (const primaryBucket of buckets) {
    for (const secondaryBucket of primaryBucket) {
      ordered.push(...shuffle(secondaryBucket));
    }
  }
  const result: ChainEntry[] = [];
  const seenMasks = new Set<string>();
  for (const entry of ordered) {
    const mask = maskHint(entry.word);
    if (seenMasks.has(mask)) continue;
    seenMasks.add(mask);
    result.push(entry);
  }
  return result;
}

export function pickRandomStart(pool: ChainEntry[]): ChainEntry {
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Picks a random character (+ its toned zhuyin) for the 一字成語王 slot machine to land on — drawn
 * from well-explained idioms' first characters only (curated/MOE/custom), so the landed character is
 * always one a kid would recognize, even though editorial-only entries can still fill in the blanks.
 */
export function pickRandomCharacter(pool: ChainEntry[]): { char: string; zhuyin: string } | null {
  const candidates = pool.filter((entry) => entry.source !== 'editorial');
  if (candidates.length === 0) return null;
  const entry = candidates[Math.floor(Math.random() * candidates.length)];
  return { char: entry.firstChar, zhuyin: entry.firstZhuyin };
}

export function findByWord(pool: ChainEntry[], word: string): ChainEntry | undefined {
  const trimmed = word.trim();
  return pool.find((entry) => entry.word === trimmed);
}

/** Derives a character → toned zhuyin lookup from whatever's currently loaded in the pool. */
export function buildCharZhuyinMap(pool: ChainEntry[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const entry of pool) {
    if (entry.firstZhuyin && !map[entry.firstChar]) map[entry.firstChar] = entry.firstZhuyin;
    if (entry.char2 && entry.char2Zhuyin && !map[entry.char2]) map[entry.char2] = entry.char2Zhuyin;
    if (entry.char3 && entry.char3Zhuyin && !map[entry.char3]) map[entry.char3] = entry.char3Zhuyin;
    if (entry.lastZhuyin && !map[entry.lastChar]) map[entry.lastChar] = entry.lastZhuyin;
  }
  return map;
}

export function maskHint(word: string): string {
  const chars = word.split('');
  if (chars.length <= 2) return word;
  const midStart = 1;
  const midEnd = chars.length - 2;
  return chars.map((ch, i) => (i >= midStart && i <= midEnd ? '＿' : ch)).join('');
}
