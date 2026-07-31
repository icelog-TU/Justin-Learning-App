/** Deliberately skips bases that would collide with an existing power series.
 * Every base here has a distinct prime-factor ratio, so no two positive powers in the supported range
 * can evaluate to the same character value. For example, 12 = 2²×3 and 15 = 3×5 are both safe additions. */
export const GACHA_BASES = [2, 3, 5, 6, 7, 11, 12, 15] as const;
/** Per-base max exponent — every base runs equally deep (46). */
export const BASE_MAX_EXPONENT: Record<number, number> = {
  2: 46,
  3: 46,
  5: 46,
  6: 46,
  7: 46,
  11: 46,
  12: 46,
  15: 46,
};
export function maxExponentForBase(base: number): number {
  return BASE_MAX_EXPONENT[base] ?? 46;
}
export const SQUARE_CHARACTER_COUNT = 50;
export const CUBE_CHARACTER_COUNT = 50;
export const TRIANGULAR_CHARACTER_COUNT = 50;
export const FIBONACCI_CHARACTER_COUNT = 30;
export const PRIME_CHARACTER_COUNT = 50;
export const FACTORIAL_CHARACTER_COUNT = 20;

export type SequenceCharacterKind =
  | 'square'
  | 'cube'
  | 'triangular'
  | 'fibonacci'
  | 'prime'
  | 'factorial';

export interface SequenceCollectionDefinition {
  kind: SequenceCharacterKind;
  slug: string;
  name: string;
  rangeLabel: string;
  symbol: string;
  count: number;
}

/** Unlock order after the eight power-series collections. Existing square/cube order never moves. */
export const SEQUENCE_CHARACTER_COLLECTIONS: readonly SequenceCollectionDefinition[] = [
  { kind: 'square', slug: 'squares', name: '平方角色', rangeLabel: '1² 到 50²', symbol: '■', count: SQUARE_CHARACTER_COUNT },
  { kind: 'cube', slug: 'cubes', name: '立方角色', rangeLabel: '1³ 到 50³', symbol: '▲', count: CUBE_CHARACTER_COUNT },
  { kind: 'triangular', slug: 'triangular', name: '三角數角色', rangeLabel: '第 1～50 個三角數', symbol: '▼', count: TRIANGULAR_CHARACTER_COUNT },
  { kind: 'fibonacci', slug: 'fibonacci', name: '斐波那契角色', rangeLabel: '第 1～30 個斐波那契數', symbol: '◆', count: FIBONACCI_CHARACTER_COUNT },
  { kind: 'prime', slug: 'primes', name: '質數角色', rangeLabel: '前 50 個質數', symbol: '⬢', count: PRIME_CHARACTER_COUNT },
  { kind: 'factorial', slug: 'factorials', name: '階乘角色', rangeLabel: '1! 到 20!', symbol: '✦', count: FACTORIAL_CHARACTER_COUNT },
];

/** Existing power-series slots stay first; sequence collections follow the order above. */
export const POWER_CHARACTER_SLOTS = GACHA_BASES.reduce((sum, base) => sum + maxExponentForBase(base), 0);
export const TOTAL_CHARACTER_SLOTS = POWER_CHARACTER_SLOTS
  + SEQUENCE_CHARACTER_COLLECTIONS.reduce((sum, collection) => sum + collection.count, 0);
export const GACHA_COST_COINS = 10;
export const HEART_COST_STARS = 3;
/** Pity system: a brand-new character is guaranteed at least once every this many rolls. */
export const GACHA_PITY_LIMIT = 6;

export const COIN_PER_CORRECT = 5;
export const STAR_PER_CORRECT = 2;
export const COIN_PER_SENTENCE_PASS = 8;
export const STAR_PER_SENTENCE_PASS = 5;
export const QUIZ_PERFECT_BONUS_COINS = 20;
export const QUIZ_PERFECT_BONUS_STARS = 10;
export const DUPE_CONSOLATION_STARS = 5;

/** Shared per-idiom reward for both 成語接龍 and 一字成語王. */
export const COIN_PER_CHAIN_LINK = 5;
export const STAR_PER_CHAIN_LINK = 4;
export const CHAIN_MILESTONE_INTERVAL = 5;
/** Per-milestone-level bonus base — multiplied by the milestone number, so the 10th-link bonus is bigger than the 5th's. */
export const CHAIN_MILESTONE_BONUS_COINS = 15;
export const CHAIN_MILESTONE_BONUS_STARS = 8;

/** 一字成語王: extra bonus for solving all 4 positions of a character in one round (on top of each row's own reward). */
export const ASSOCIATION_COMPLETE_BONUS_COINS = 20;
export const ASSOCIATION_COMPLETE_BONUS_STARS = 10;
/** 一字成語王: bonus for every N distinct characters fully cracked, scaled by milestone number like the chain game. */
export const ASSOCIATION_CHAR_MILESTONE_INTERVAL = 5;
export const ASSOCIATION_CHAR_MILESTONE_BONUS_COINS = 20;
export const ASSOCIATION_CHAR_MILESTONE_BONUS_STARS = 10;

/** 古文破譯家: reward for decoding one古文字/密碼 puzzle — deliberately well above COIN_PER_CORRECT/STAR_PER_CORRECT
 * (a single idiom question), since one of these requires reading and comparing real classical clues, not just
 * recognizing one modern sentence. */
export const COIN_PER_GUWEN_WORD = 8;
export const STAR_PER_GUWEN_WORD = 4;
/** 古文破譯家: extra bonus for fully decoding every word/step in a whole classical text — deliberately the
 * single biggest bonus anywhere in the app (bigger than QUIZ_PERFECT_BONUS, CHAIN_MILESTONE_BONUS, or
 * ASSOCIATION_COMPLETE_BONUS), since finishing an entire classical text is a much larger, standalone
 * accomplishment than a single quiz round. */
export const GUWEN_TEXT_COMPLETE_BONUS_COINS = 80;
export const GUWEN_TEXT_COMPLETE_BONUS_STARS = 40;
/** 古文破譯家: replaying a text/lesson that's already been fully completed at least once before still pays
 * out — reset progress is not a punishment, and redoing is always allowed with no cap on attempts — but at
 * a stepped-down rate per attempt number, so the very first clear stays the biggest payday and grinding the
 * same text over and over eventually stops paying out at all. Index 0 = the very first attempt (100%),
 * index 1 = the first redo (2nd attempt, 60%), and so on; any attempt past the end of this list (5th+) earns
 * zero coins/stars — still lets the child replay for fun/practice, just without farming currency from it.
 * Applies to both COIN/STAR_PER_GUWEN_WORD and the completion bonus alike. */
export const GUWEN_REDO_REWARD_TIERS = [1, 0.6, 0.3, 0.1];

/** `timesCompleted` is how many times this text was already fully finished *before* the attempt in
 * progress — 0 for a first-ever attempt, 1 once it's been redone once, etc. — so it doubles directly as an
 * index into GUWEN_REDO_REWARD_TIERS. */
export function guwenRedoMultiplier(timesCompleted: number): number {
  return GUWEN_REDO_REWARD_TIERS[timesCompleted] ?? 0;
}

export const BASE_EMOJI: Record<number, string> = {
  2: '🔵',
  3: '🟢',
  5: '🟠',
  6: '🔴',
  7: '🟣',
  11: '🟡',
  12: '🟤',
  15: '⚪',
};

export interface CharacterInfo {
  id: string;
  base: number;
  exponent: number;
  value: bigint;
}

export function characterId(base: number, exponent: number): string {
  return `${base}^${exponent}`;
}

export function squareCharacterId(squareBase: number): string {
  return sequenceCharacterId('square', squareBase);
}

export function cubeCharacterId(cubeBase: number): string {
  return sequenceCharacterId('cube', cubeBase);
}

export function sequenceCharacterId(kind: SequenceCharacterKind, index: number): string {
  return `${kind}:${index}`;
}

export function getSequenceCollection(kind: SequenceCharacterKind): SequenceCollectionDefinition {
  return SEQUENCE_CHARACTER_COLLECTIONS.find((collection) => collection.kind === kind)!;
}

export function getSequenceCollectionBySlug(slug: string | null): SequenceCollectionDefinition | null {
  return SEQUENCE_CHARACTER_COLLECTIONS.find((collection) => collection.slug === slug) ?? null;
}

export function isSquareCharacterId(id: string): boolean {
  return id.startsWith('square:');
}

export function isCubeCharacterId(id: string): boolean {
  return id.startsWith('cube:');
}

export function parseCharacterId(id: string):
  | { kind: 'power'; base: number; exponent: number }
  | { kind: SequenceCharacterKind; index: number } {
  for (const collection of SEQUENCE_CHARACTER_COLLECTIONS) {
    const prefix = `${collection.kind}:`;
    if (id.startsWith(prefix)) {
      return { kind: collection.kind, index: Number(id.slice(prefix.length)) };
    }
  }
  const [base, exponent] = id.split('^').map(Number);
  return { kind: 'power', base, exponent };
}

export function characterValue(base: number, exponent: number): bigint {
  return BigInt(base) ** BigInt(exponent);
}

export function formatCharacterLabel(base: number, exponent: number): string {
  const superscripts: Record<string, string> = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  };
  const sup = String(exponent).split('').map((d) => superscripts[d]).join('');
  return `${base}${sup}`;
}

export function formatSquareCharacterLabel(squareBase: number): string {
  return formatCharacterLabel(squareBase, 2);
}

export function formatCubeCharacterLabel(cubeBase: number): string {
  return formatCharacterLabel(cubeBase, 3);
}

function formatSubscriptNumber(value: number): string {
  const subscripts: Record<string, string> = {
    '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
    '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
  };
  return String(value).split('').map((digit) => subscripts[digit]).join('');
}

export function formatSequenceCharacterLabel(kind: SequenceCharacterKind, index: number): string {
  if (kind === 'square') return formatSquareCharacterLabel(index);
  if (kind === 'cube') return formatCubeCharacterLabel(index);
  if (kind === 'triangular') return `△${formatSubscriptNumber(index)}`;
  if (kind === 'fibonacci') return `F${formatSubscriptNumber(index)}`;
  if (kind === 'prime') return `P${formatSubscriptNumber(index)}`;
  return `${index}!`;
}

export function triangularValue(index: number): bigint {
  return BigInt(index * (index + 1) / 2);
}

export function fibonacciValue(index: number): bigint {
  if (index <= 2) return 1n;
  let previous = 1n;
  let current = 1n;
  for (let position = 3; position <= index; position++) {
    [previous, current] = [current, previous + current];
  }
  return current;
}

export function primeValue(index: number): bigint {
  let found = 0;
  let candidate = 1;
  while (found < index) {
    candidate += 1;
    let isPrime = true;
    for (let divisor = 2; divisor * divisor <= candidate; divisor++) {
      if (candidate % divisor === 0) {
        isPrime = false;
        break;
      }
    }
    if (isPrime) found += 1;
  }
  return BigInt(candidate);
}

export function factorialValue(index: number): bigint {
  let result = 1n;
  for (let factor = 2; factor <= index; factor++) result *= BigInt(factor);
  return result;
}

export function sequenceCharacterValue(kind: SequenceCharacterKind, index: number): bigint {
  if (kind === 'square') return characterValue(index, 2);
  if (kind === 'cube') return characterValue(index, 3);
  if (kind === 'triangular') return triangularValue(index);
  if (kind === 'fibonacci') return fibonacciValue(index);
  if (kind === 'prime') return primeValue(index);
  return factorialValue(index);
}

export function characterMaxHearts(id: string): number {
  const parsed = parseCharacterId(id);
  return parsed.kind === 'power' ? parsed.exponent : parsed.index;
}

export function characterInteractionTierCount(maxHearts: number): number {
  return Math.max(1, Math.round(maxHearts / 2));
}

/** Zero-based interaction position -> the heart count that unlocks it. */
export function characterInteractionRequiredHearts(tierIndex: number, maxHearts: number): number {
  const tierCount = characterInteractionTierCount(maxHearts);
  return Math.round(((tierIndex + 1) / tierCount) * maxHearts);
}

/** New number-pattern families always expose both greeting and explanation, even for their first members. */
export function characterInteractionTierCountForId(id: string): number {
  const parsed = parseCharacterId(id);
  const tierCount = characterInteractionTierCount(characterMaxHearts(id));
  return parsed.kind === 'triangular'
    || parsed.kind === 'fibonacci'
    || parsed.kind === 'prime'
    || parsed.kind === 'factorial'
    ? Math.max(2, tierCount)
    : tierCount;
}

export function characterInteractionRequiredHeartsForId(id: string, tierIndex: number): number {
  const maxHearts = characterMaxHearts(id);
  const tierCount = characterInteractionTierCountForId(id);
  return Math.max(1, Math.round(((tierIndex + 1) / tierCount) * maxHearts));
}

export function characterLabelFromId(id: string): string {
  const parsed = parseCharacterId(id);
  return parsed.kind === 'power'
    ? formatCharacterLabel(parsed.base, parsed.exponent)
    : formatSequenceCharacterLabel(parsed.kind, parsed.index);
}

export function characterValueFromId(id: string): bigint {
  const parsed = parseCharacterId(id);
  return parsed.kind === 'power'
    ? characterValue(parsed.base, parsed.exponent)
    : sequenceCharacterValue(parsed.kind, parsed.index);
}

export function formatBigNumber(n: bigint): string {
  return n.toLocaleString('en-US');
}

/**
 * Rainbow hue for a specific exponent (1..maxExponent), so every character in a base's collection
 * is its own distinct color instead of one flat base color repeated throughout — exponent 1 is red,
 * the base's highest exponent is violet, sweeping smoothly through the spectrum between.
 */
export function characterColor(exponent: number, maxExponent: number = 46): string {
  const hue = maxExponent > 1 ? ((exponent - 1) / (maxExponent - 1)) * 300 : 0;
  return `hsl(${hue.toFixed(0)}, 70%, 50%)`;
}

/** Stable zero-based position of a character in the complete collection. */
export function characterCollectionIndex(base: number, exponent: number): number {
  let offset = 0;
  for (const candidate of GACHA_BASES) {
    if (candidate === base) return offset + Math.max(0, exponent - 1);
    offset += maxExponentForBase(candidate);
  }
  return offset + Math.max(0, exponent - 1);
}

export function characterCollectionIndexFromId(id: string): number {
  const parsed = parseCharacterId(id);
  if (parsed.kind === 'power') return characterCollectionIndex(parsed.base, parsed.exponent);
  let offset = POWER_CHARACTER_SLOTS;
  for (const collection of SEQUENCE_CHARACTER_COLLECTIONS) {
    if (collection.kind === parsed.kind) return offset + Math.max(0, parsed.index - 1);
    offset += collection.count;
  }
  return offset;
}

/** Which base is currently open for gacha pulls: the first base in order that isn't fully collected yet. */
export function currentUnlockedBase(characters: Record<string, number>): number | null {
  for (const base of GACHA_BASES) {
    const max = maxExponentForBase(base);
    const ownedCount = Array.from({ length: max }, (_, i) => i + 1).filter(
      (exp) => characters[characterId(base, exp)] !== undefined,
    ).length;
    if (ownedCount < max) return base;
  }
  return null;
}

export function ownedCountForBase(characters: Record<string, number>, base: number): number {
  let count = 0;
  for (let exp = 1; exp <= maxExponentForBase(base); exp++) {
    if (characters[characterId(base, exp)] !== undefined) count++;
  }
  return count;
}

export function ownedSquareCharacterCount(characters: Record<string, number>): number {
  return ownedSequenceCharacterCount(characters, 'square');
}

export function ownedCubeCharacterCount(characters: Record<string, number>): number {
  return ownedSequenceCharacterCount(characters, 'cube');
}

export function ownedSequenceCharacterCount(
  characters: Record<string, number>,
  kind: SequenceCharacterKind,
): number {
  const collection = getSequenceCollection(kind);
  let count = 0;
  for (let index = 1; index <= collection.count; index++) {
    if (characters[sequenceCharacterId(kind, index)] !== undefined) count++;
  }
  return count;
}

export function arePowerCharactersComplete(characters: Record<string, number>): boolean {
  return currentUnlockedBase(characters) === null;
}

export function areSquareCharactersComplete(characters: Record<string, number>): boolean {
  return isSequenceCollectionComplete(characters, 'square');
}

export function isSequenceCollectionComplete(
  characters: Record<string, number>,
  kind: SequenceCharacterKind,
): boolean {
  const collection = getSequenceCollection(kind);
  return ownedSequenceCharacterCount(characters, kind) >= collection.count;
}

export function nextIncompleteSequenceCollection(
  characters: Record<string, number>,
): SequenceCollectionDefinition | null {
  return SEQUENCE_CHARACTER_COLLECTIONS.find(
    (collection) => !isSequenceCollectionComplete(characters, collection.kind),
  ) ?? null;
}

export function isSequenceCollectionUnlocked(
  characters: Record<string, number>,
  kind: SequenceCharacterKind,
): boolean {
  if (!arePowerCharactersComplete(characters)) return false;
  for (const collection of SEQUENCE_CHARACTER_COLLECTIONS) {
    if (collection.kind === kind) return true;
    if (!isSequenceCollectionComplete(characters, collection.kind)) return false;
  }
  return false;
}

export interface PowerGachaResult {
  kind: 'power';
  id: string;
  base: number;
  exponent: number;
  isDupe: boolean;
}

export interface SequenceGachaResult {
  kind: SequenceCharacterKind;
  id: string;
  index: number;
  isDupe: boolean;
}

export type GachaResult = PowerGachaResult | SequenceGachaResult;

export interface LevelInfo {
  level: number;
  title: string;
  icon: string;
  /** How many characters owned in total (across every base) are needed to reach this level. */
  threshold: number;
}

/** Existing level thresholds never move; collection expansions add new levels only at the end. */
export const LEVELS: LevelInfo[] = [
  { level: 1, title: '初心者', icon: '🥚', threshold: 0 },
  { level: 2, title: '幼幼班', icon: '🐣', threshold: 6 },
  { level: 3, title: '練習生', icon: '🌱', threshold: 19 },
  { level: 4, title: '小學徒', icon: '📖', threshold: 38 },
  { level: 5, title: '進步生', icon: '✏️', threshold: 64 },
  { level: 6, title: '用功生', icon: '📚', threshold: 96 },
  { level: 7, title: '小達人', icon: '🎯', threshold: 128 },
  { level: 8, title: '高手', icon: '🥉', threshold: 160 },
  { level: 9, title: '大師', icon: '🥈', threshold: 192 },
  { level: 10, title: '中文高手', icon: '👑', threshold: 211 },
  { level: 11, title: '國學新秀', icon: '🏵️', threshold: 224 },
  { level: 12, title: '文學才子', icon: '🖋️', threshold: 237 },
  { level: 13, title: '博學多聞', icon: '📜', threshold: 250 },
  { level: 14, title: '一代宗師', icon: '🏆', threshold: 263 },
  { level: 15, title: '中文之神', icon: '🌟', threshold: 276 },
  { level: 16, title: '典籍守護者', icon: '🛡️', threshold: 299 },
  { level: 17, title: '文字探險王', icon: '🧭', threshold: 322 },
  { level: 18, title: '萬卷智者', icon: '💫', threshold: 345 },
  { level: 19, title: '練功房傳奇', icon: '🌌', threshold: 368 },
  { level: 20, title: '平方探索家', icon: '🔲', threshold: 385 },
  { level: 21, title: '平方大師', icon: '🧮', threshold: 402 },
  { level: 22, title: '數字宇宙王', icon: '🚀', threshold: 418 },
  { level: 23, title: '立方探索家', icon: '🧊', threshold: 435 },
  { level: 24, title: '立方大師', icon: '🧠', threshold: 452 },
  { level: 25, title: '次方傳奇', icon: '🌠', threshold: 468 },
  { level: 26, title: '三角數探索家', icon: '🔻', threshold: 485 },
  { level: 27, title: '三角數大師', icon: '📐', threshold: 502 },
  { level: 28, title: '圖形數傳奇', icon: '🔺', threshold: 518 },
  { level: 29, title: '數列小偵探', icon: '🔍', threshold: 533 },
  { level: 30, title: '斐波那契大師', icon: '🌀', threshold: 548 },
  { level: 31, title: '質數探索家', icon: '💎', threshold: 565 },
  { level: 32, title: '質數大師', icon: '🧩', threshold: 582 },
  { level: 33, title: '質數守護者', icon: '🛡️', threshold: 598 },
  { level: 34, title: '階乘挑戰者', icon: '✖️', threshold: 608 },
  { level: 35, title: '數字規律之王', icon: '👑', threshold: 618 },
];

export function currentLevel(charactersOwned: number): LevelInfo {
  let current = LEVELS[0];
  for (const lvl of LEVELS) {
    if (charactersOwned >= lvl.threshold) current = lvl;
  }
  return current;
}

export function nextLevel(charactersOwned: number): LevelInfo | null {
  return LEVELS.find((lvl) => lvl.threshold > charactersOwned) ?? null;
}
