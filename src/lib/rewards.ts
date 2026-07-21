export const GACHA_BASES = [2, 3, 4, 5, 6] as const;
export const MAX_EXPONENT = 33;
export const GACHA_COST_COINS = 10;
export const HEART_COST_STARS = 3;

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

export const BASE_EMOJI: Record<number, string> = {
  2: '🔵',
  3: '🟢',
  4: '🟡',
  5: '🟠',
  6: '🔴',
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
