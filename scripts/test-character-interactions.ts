import {
  GACHA_BASES,
  SEQUENCE_CHARACTER_COLLECTIONS,
  characterId,
  characterValueFromId,
  formatBigNumber,
  maxExponentForBase,
  parseCharacterId,
  sequenceCharacterId,
} from '../src/lib/rewards';
import { characterNumberInteractionMessageForId } from '../src/lib/characterInteractions';
import { getTtsInput } from '../src/lib/speech';

const ids = [
  ...GACHA_BASES.flatMap((base) =>
    Array.from({ length: maxExponentForBase(base) }, (_, index) => characterId(base, index + 1))),
  ...SEQUENCE_CHARACTER_COLLECTIONS.flatMap((collection) =>
    Array.from({ length: collection.count }, (_, index) => sequenceCharacterId(collection.kind, index + 1))),
];

for (const id of ids) {
  const parsed = parseCharacterId(id);
  const message = characterNumberInteractionMessageForId(id);
  const expectedValue = formatBigNumber(characterValueFromId(id));

  if (!message.includes(expectedValue)) {
    throw new Error(`${id} 的聊聊天沒有說出自己的數值 ${expectedValue}：${message}`);
  }
  if (parsed.kind === 'power' && !message.includes(`重複 ${parsed.exponent} 次`)) {
    throw new Error(`${id} 使用了錯誤的重複次數：${message}`);
  }
  if (parsed.kind === 'square' && !message.includes('重複 2 次')) {
    throw new Error(`${id} 沒有用平方的 2 次相乘：${message}`);
  }
  if (parsed.kind === 'cube' && !message.includes('重複 3 次')) {
    throw new Error(`${id} 沒有用立方的 3 次相乘：${message}`);
  }
  if (!getTtsInput(message).trim()) {
    throw new Error(`${id} 的聊聊天無法交給語音系統：${message}`);
  }
}

console.log(`角色聊聊天檢查通過：${ids.length} 隻角色都在解釋自己的數字。`);
