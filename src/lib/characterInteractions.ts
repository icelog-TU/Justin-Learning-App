import {
  characterValue,
  fibonacciValue,
  formatBigNumber,
  getSequenceCollection,
  parseCharacterId,
  sequenceCharacterValue,
} from './rewards';

export function characterNumberInteractionMessage(base: number, repetitions: number): string {
  return `如果每次都變成 ${base} 倍，重複 ${repetitions} 次，會變成原來的 ${formatBigNumber(characterValue(base, repetitions))} 倍！`;
}

export function characterGreetingMessage(id: string): string {
  const parsed = parseCharacterId(id);
  if (parsed.kind === 'power') {
    return `你好！我是 ${parsed.base} 的 ${parsed.exponent} 次方！`;
  }
  if (parsed.kind === 'square') return `你好！我是 ${parsed.index} 的平方！`;
  if (parsed.kind === 'cube') return `你好！我是 ${parsed.index} 的立方！`;

  const value = formatBigNumber(sequenceCharacterValue(parsed.kind, parsed.index));
  if (parsed.kind === 'triangular') return `你好！我是第 ${parsed.index} 個三角數，${value}！`;
  if (parsed.kind === 'fibonacci') return `你好！我是第 ${parsed.index} 個斐波那契數，${value}！`;
  if (parsed.kind === 'prime') return `你好！我是第 ${parsed.index} 個質數，${value}！`;
  return `你好！我是 ${parsed.index} 的階乘，${value}！`;
}

export function characterNumberInteractionMessageForId(id: string, repetitions: number): string {
  const parsed = parseCharacterId(id);
  if (parsed.kind === 'power') {
    return characterNumberInteractionMessage(parsed.base, repetitions);
  }
  if (parsed.kind === 'square' || parsed.kind === 'cube') {
    return characterNumberInteractionMessage(parsed.index, repetitions);
  }

  const value = formatBigNumber(sequenceCharacterValue(parsed.kind, parsed.index));
  if (parsed.kind === 'triangular') {
    return `我是第 ${parsed.index} 個三角數。把 1 到 ${parsed.index} 全部加起來，也就是 ${parsed.index} 乘以 ${parsed.index + 1} 再除以 2，就得到 ${value}。`;
  }
  if (parsed.kind === 'fibonacci') {
    if (parsed.index <= 2) {
      return `斐波那契數列的前兩個數都從 1 開始，所以我是第 ${parsed.index} 個斐波那契數，數字是 1。`;
    }
    const previousTwo = formatBigNumber(fibonacciValue(parsed.index - 2));
    const previousOne = formatBigNumber(fibonacciValue(parsed.index - 1));
    return `我是第 ${parsed.index} 個斐波那契數。前兩個數 ${previousTwo} 和 ${previousOne} 相加，就得到 ${value}。`;
  }
  if (parsed.kind === 'prime') {
    return `我是第 ${parsed.index} 個質數，數字是 ${value}。${value} 只能被 1 和自己整除，所以它是質數。`;
  }
  return `我是 ${parsed.index} 的階乘。階乘的意思，是把 1 到 ${parsed.index} 的整數全部乘起來，所以得到 ${value}。`;
}

export function characterSecretMessage(id: string): string {
  const parsed = parseCharacterId(id);
  if (parsed.kind === 'power') {
    return `偷偷告訴你，我最要好的朋友是 ${parsed.base} 的 ${Math.min(46, parsed.exponent + 1)} 次方！`;
  }
  const collection = getSequenceCollection(parsed.kind);
  return `偷偷告訴你，我住在${collection.name}家族，是第 ${parsed.index} 號！`;
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
