export const GACHA_BASES = [2, 3, 5, 6, 7] as const;
export const MAX_EXPONENT = 33;
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
export const CHAIN_MILESTONE_BONUS_COINS = 15;
export const CHAIN_MILESTONE_BONUS_STARS = 8;

export const COIN_PER_ASSOCIATION_ANSWER = 6;
export const STAR_PER_ASSOCIATION_ANSWER = 3;
export const ASSOCIATION_COMPLETE_BONUS_COINS = 25;
export const ASSOCIATION_COMPLETE_BONUS_STARS = 12;

export const BASE_EMOJI: Record<number, string> = {
  2: '🔵',
  3: '🟢',
  5: '🟠',
  6: '🔴',
  7: '🟣',
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
 * Rainbow hue for a specific exponent (1..MAX_EXPONENT), so every character in a 33-member
 * collection is its own distinct color instead of one flat base color repeated 33 times —
 * exponent 1 is red, exponent 33 is violet, sweeping smoothly through the spectrum between.
 */
export function characterColor(exponent: number, maxExponent: number = MAX_EXPONENT): string {
  const hue = maxExponent > 1 ? ((exponent - 1) / (maxExponent - 1)) * 300 : 0;
  return `hsl(${hue.toFixed(0)}, 70%, 50%)`;
}

/** Which base is currently open for gacha pulls: the first base in order that isn't fully collected yet. */
export function currentUnlockedBase(characters: Record<string, number>): number | null {
  for (const base of GACHA_BASES) {
    const ownedCount = Array.from({ length: MAX_EXPONENT }, (_, i) => i + 1).filter(
      (exp) => characters[characterId(base, exp)] !== undefined,
    ).length;
    if (ownedCount < MAX_EXPONENT) return base;
  }
  return null; // fully collected everything
}

export function ownedCountForBase(characters: Record<string, number>, base: number): number {
  let count = 0;
  for (let exp = 1; exp <= MAX_EXPONENT; exp++) {
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

/** Ten levels tied to total characters collected (0 up to the full 165-character collection). */
export const LEVELS: LevelInfo[] = [
  { level: 1, title: '初心者', icon: '🥚', threshold: 0 },
  { level: 2, title: '幼幼班', icon: '🐣', threshold: 5 },
  { level: 3, title: '練習生', icon: '🌱', threshold: 15 },
  { level: 4, title: '小學徒', icon: '📖', threshold: 30 },
  { level: 5, title: '進步生', icon: '✏️', threshold: 50 },
  { level: 6, title: '用功生', icon: '📚', threshold: 75 },
  { level: 7, title: '小達人', icon: '🎯', threshold: 100 },
  { level: 8, title: '高手', icon: '🥉', threshold: 125 },
  { level: 9, title: '大師', icon: '🥈', threshold: 150 },
  { level: 10, title: '中文高手', icon: '👑', threshold: 165 },
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
