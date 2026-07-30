import { characterValue, formatBigNumber } from './rewards';

export function characterNumberInteractionMessage(base: number, repetitions: number): string {
  return `如果每次都變成 ${base} 倍，重複 ${repetitions} 次，會變成原來的 ${formatBigNumber(characterValue(base, repetitions))} 倍！`;
}

/**
 * Every character starts with the same relationship-building sequence:
 * greeting first, then Justin's preferred number lesson. Remaining activities follow a deterministic
 * character-specific shuffle that excludes those two reserved templates and never repeats a template.
 */
export function characterInteractionTemplateIndex(
  characterIndex: number,
  tierIndex: number,
  templateCount: number,
): number {
  if (tierIndex === 0) return 0;
  if (tierIndex === 1) return 1;
  const shuffledTemplateCount = templateCount - 2;
  return 2 + ((characterIndex + (tierIndex - 2) * 7) % shuffledTemplateCount);
}
