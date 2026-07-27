import { characterValue, formatBigNumber } from './rewards';

export function characterNumberInteractionMessage(base: number, repetitions: number): string {
  return `如果每次都變成 ${base} 倍，重複 ${repetitions} 次，會變成原來的 ${formatBigNumber(characterValue(base, repetitions))} 倍！`;
}

/**
 * Keep every character's established deterministic activities, but reserve the second interaction for
 * the number lesson Justin prefers. The activity displaced from position two swaps into the position that
 * previously held the number template, so no other activity is lost and every tier remains unique.
 */
export function characterInteractionTemplateIndex(
  characterIndex: number,
  tierIndex: number,
  templateCount: number,
): number {
  const originalTemplateIndex = (characterIndex + tierIndex * 7) % templateCount;
  const originalSecondTemplateIndex = (characterIndex + 7) % templateCount;
  if (tierIndex === 1) return 1;
  if (originalTemplateIndex === 1) return originalSecondTemplateIndex;
  return originalTemplateIndex;
}
