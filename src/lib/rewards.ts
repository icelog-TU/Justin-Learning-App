export const GACHA_BASES = [2, 3, 5, 6, 7, 11] as const;
/** Per-base max exponent — base 2's collection runs deeper (46) than the others (33). */
export const BASE_MAX_EXPONENT: Record<number, number> = {
  2: 46,
  3: 33,
  5: 33,
  6: 33,
  7: 33,
  11: 33,
};
export function maxExponentForBase(base: number): number {
  return BASE_MAX_EXPONENT[base] ?? 33;
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

/** 古文破譯家: reward for decoding one古文字 puzzle. */
export const COIN_PER_GUWEN_WORD = 6;
export const STAR_PER_GUWEN_WORD = 3;
/** 古文破譯家: extra bonus for fully decoding every word in a whole classical text. */
export const GUWEN_TEXT_COMPLETE_BONUS_COINS = 30;
export const GUWEN_TEXT_COMPLETE_BONUS_STARS = 15;

export const BASE_EMOJI: Record<number, string> = {
  2: '🔵',
  3: '🟢',
  5: '🟠',
  6: '🔴',
  7: '🟣',
  11: '🟡',
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
export function characterColor(exponent: number, maxExponent: number = 33): string {
  const hue = maxExponent > 1 ? ((exponent - 1) / (maxExponent - 1)) * 300 : 0;
  return `hsl(${hue.toFixed(0)}, 70%, 50%)`;
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
  return null; // fully collected everything
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

/** Ten levels tied to total characters collected (0 up to the full TOTAL_CHARACTER_SLOTS-character collection). */
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
