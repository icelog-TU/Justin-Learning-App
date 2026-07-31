import {
  BASE_MAX_EXPONENT,
  GACHA_BASES,
  LEVELS,
  ORIGINAL_POWER_EXPONENT_LIMIT,
  TOTAL_CHARACTER_SLOTS,
  characterCollectionIndexFromId,
  characterId,
  characterValue,
  currentLevel,
  currentUnlockedBase,
  maxExponentForBase,
} from '../src/lib/rewards';
import { numberToChineseWords } from '../src/lib/chineseNumber';
import { characterInteractionTemplateIndex } from '../src/lib/characterInteractions';

const expectedLimits: Record<number, number> = {
  2: 100,
  3: 100,
  5: 100,
  6: 100,
  7: 100,
  11: 50,
  12: 50,
  15: 50,
};

for (const base of GACHA_BASES) {
  if (BASE_MAX_EXPONENT[base] !== expectedLimits[base]) {
    throw new Error(`${base} 的上限應為 ${expectedLimits[base]}，實際為 ${BASE_MAX_EXPONENT[base]}`);
  }
}
if (TOTAL_CHARACTER_SLOTS !== 900) throw new Error(`角色總數應為 900，實際為 ${TOTAL_CHARACTER_SLOTS}`);

// Simulate Justin's existing completed 2^1..46 and 3^1..46 collection. No ids or heart counts are rewritten.
const existingCharacters: Record<string, number> = {};
for (const base of GACHA_BASES) {
  for (let exponent = 1; exponent <= ORIGINAL_POWER_EXPONENT_LIMIT; exponent++) {
    existingCharacters[characterId(base, exponent)] = exponent % 7;
  }
}
if (existingCharacters['2^46'] !== 4 || existingCharacters['3^46'] !== 4) {
  throw new Error('既有角色或愛心資料被改寫');
}
if (currentUnlockedBase(existingCharacters) !== 2) throw new Error('擴充後應先回到 2 的次方');

for (let exponent = 47; exponent <= maxExponentForBase(2); exponent++) {
  existingCharacters[characterId(2, exponent)] = 0;
}
if (currentUnlockedBase(existingCharacters) !== 3) throw new Error('抽滿 2 的次方後應輪到 3 的次方');
for (let exponent = 47; exponent <= maxExponentForBase(3); exponent++) {
  existingCharacters[characterId(3, exponent)] = 0;
}
if (currentUnlockedBase(existingCharacters) !== 5) throw new Error('抽滿 3 的次方後應輪到 5 的次方');

// Old thresholds and activity shuffle positions must stay fixed, especially Justin's current Lv.6.
if (currentLevel(96).level !== 6 || currentLevel(127).level !== 6 || currentLevel(128).level !== 7) {
  throw new Error('既有 Lv.6 門檻遭到改動');
}
if (LEVELS.at(-1)?.threshold !== TOTAL_CHARACTER_SLOTS || LEVELS.at(-1)?.level !== 45) {
  throw new Error('最高等級沒有對齊新的角色總數');
}
if (characterCollectionIndexFromId('3^46') !== 91 || characterCollectionIndexFromId('square:1') !== 368) {
  throw new Error('既有角色的互動排列種子遭到改動');
}

// A 100-heart character has 50 interactions: greeting, chat, then 48 unique activities/icons.
const templateIndexes = Array.from({ length: 50 }, (_, index) =>
  characterInteractionTemplateIndex(0, index, 50));
if (templateIndexes[0] !== 0 || templateIndexes[1] !== 1 || new Set(templateIndexes).size !== 50) {
  throw new Error('100 次方角色的互動模板出現重複');
}

const largestValue = characterValue(7, 100);
if (largestValue.toString().length !== 85) throw new Error('7 的 100 次方位數不符預期');
const spoken = numberToChineseWords(largestValue);
if (!spoken || spoken.includes('undefined')) throw new Error('最大角色的中文讀數無法安全產生');

console.log('百次方擴充測試通過：900 隻角色、舊資料保留、轉蛋順序正確、50 種互動不重複。');
