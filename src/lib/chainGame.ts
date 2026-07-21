import { idiomChainData } from '../data/idiomChain';
import { getZhuyin } from './zhuyin';

export interface MoeRawEntry {
  id: string;
  word: string;
  meaning: string;
  firstChar: string;
  firstZhuyin: string;
  lastChar: string;
  lastZhuyin: string;
}

/** No meaning field — these come from MOE's 30-reference-book editorial word list, word-only. */
export interface EditorialRawEntry {
  word: string;
  firstChar: string;
  firstZhuyin: string;
  lastChar: string;
  lastZhuyin: string;
}

export interface ChainEntry {
  id: string;
  word: string;
  meaning: string;
  source: 'curated' | 'moe' | 'editorial';
  firstChar: string;
  /** toned zhuyin, e.g. "ㄇㄧㄢˋ" */
  firstZhuyin: string;
  lastChar: string;
  lastZhuyin: string;
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
  }));
}

export function isHintable(entry: ChainEntry): boolean {
  return entry.source !== 'editorial';
}

export function matchesTarget(entry: ChainEntry, targetChar: string, targetZhuyin: string): boolean {
  return entry.firstChar === targetChar || toBaseZhuyin(entry.firstZhuyin) === toBaseZhuyin(targetZhuyin);
}

export function findCandidates(
  pool: ChainEntry[],
  usedIds: Set<string>,
  targetChar: string,
  targetZhuyin: string,
): ChainEntry[] {
  return pool.filter((entry) => !usedIds.has(entry.id) && matchesTarget(entry, targetChar, targetZhuyin));
}

export function pickRandomStart(pool: ChainEntry[]): ChainEntry {
  return pool[Math.floor(Math.random() * pool.length)];
}

export function findByWord(pool: ChainEntry[], word: string): ChainEntry | undefined {
  const trimmed = word.trim();
  return pool.find((entry) => entry.word === trimmed);
}

export function maskHint(word: string): string {
  const chars = word.split('');
  if (chars.length <= 2) return word;
  const midStart = 1;
  const midEnd = chars.length - 2;
  return chars.map((ch, i) => (i >= midStart && i <= midEnd ? '＿' : ch)).join('');
}
