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
/** Total character slots across every base — used for overall collection totals/progress bars. */
export const TOTAL_CHARACTER_SLOTS = GACHA_BASES.reduce((sum, base) => sum + maxExponentForBase(base), 0);
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

export const COIN_PER_CHAIN_LINK = 8;
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

export function parseCharacterId(id: string): { base: number; exponent: number } {
  const [base, exponent] = id.split('^').map(Number);
  return { base, exponent };
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

export interface GachaResult {
  id: string;
  base: number;
  exponent: number;
  isDupe: boolean;
}

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
