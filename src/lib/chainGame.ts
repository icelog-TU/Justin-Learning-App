import { idiomChainData } from '../data/idiomChain';
import { getZhuyin } from './zhuyin';
import { shuffle } from './quizUtils';

export interface MoeRawEntry {
  id: string;
  word: string;
  meaning: string;
  firstChar: string;
  firstZhuyin: string;
  lastChar: string;
  lastZhuyin: string;
}

/**
 * No meaning field — these come from MOE's 30-reference-book editorial word list, word-only.
 * `frequency` is how many of the 30 reference books include the word (2–18 in our filtered set).
 */
export interface EditorialRawEntry {
  word: string;
  firstChar: string;
  firstZhuyin: string;
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

export interface ChainEntry {
  id: string;
  word: string;
  meaning: string;
  source: 'curated' | 'moe' | 'editorial' | 'custom';
  firstChar: string;
  /** toned zhuyin, e.g. "ㄇㄧㄢˋ" */
  firstZhuyin: string;
  lastChar: string;
  lastZhuyin: string;
  /** Only set for 'editorial' entries — how many of the 30 reference books include the word. */
  frequency?: number;
}

export function toBaseZhuyin(zhuyin: string): string {
  return zhuyin.replace(/[ˊˇˋ˙]/g, '').trim();
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

export function pickRandomStart(pool: ChainEntry[]): ChainEntry {
  return pool[Math.floor(Math.random() * pool.length)];
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
