import { strict as assert } from 'node:assert';
import { drawGuwenPraise, GUWEN_PRAISE_LINES } from '../src/lib/guwenPraise';

assert.equal(GUWEN_PRAISE_LINES.length, 30, '稱讚語句應有 30 句');
assert.equal(new Set(GUWEN_PRAISE_LINES).size, 30, '30 句稱讚語不可重複');

let remaining: string[] = [];
let previous: string | null = null;
const firstRound: string[] = [];
const deterministicRandom = () => 0.37;

for (let index = 0; index < GUWEN_PRAISE_LINES.length; index += 1) {
  const draw = drawGuwenPraise(remaining, previous, deterministicRandom);
  firstRound.push(draw.line);
  remaining = draw.remaining;
  previous = draw.line;
}

assert.equal(new Set(firstRound).size, 30, '同一輪用完以前不可重複');
assert.equal(remaining.length, 0, '完整一輪之後袋子應為空');

const lastOfFirstRound = previous;
const nextRound = drawGuwenPraise(remaining, previous, deterministicRandom);
assert.notEqual(nextRound.line, lastOfFirstRound, '換輪時不可立刻重複上一句');
assert.equal(nextRound.remaining.length, 29, '新一輪抽一句後應剩 29 句');

console.log('古文稱讚語隨機輪播測試通過：30 句一輪不重複，跨輪不連續重複。');
