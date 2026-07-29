import assert from 'node:assert/strict';

class FakeUtterance {
  text: string;
  lang = '';
  rate = 1;
  voice: SpeechSynthesisVoice | null = null;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;

  constructor(text: string) {
    this.text = text;
  }
}

const queued: FakeUtterance[] = [];
let cancelCount = 0;
const fakeSpeechSynthesis = {
  cancel() {
    cancelCount += 1;
  },
  getVoices() {
    return [];
  },
  speak(utterance: FakeUtterance) {
    queued.push(utterance);
  },
};

Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: { speechSynthesis: fakeSpeechSynthesis },
});
Object.defineProperty(globalThis, 'SpeechSynthesisUtterance', {
  configurable: true,
  value: FakeUtterance,
});

const { speakSequence } = await import('../src/lib/speech');
const started: number[] = [];
let completed = false;

speakSequence(
  ['第一句。', '第二句。', '第三句。'],
  () => {
    completed = true;
  },
  (index) => started.push(index),
);

assert.equal(cancelCount, 1, '開始序列朗讀前應取消舊語音');
assert.deepEqual(
  queued.map((utterance) => utterance.text),
  ['第一句。', '第二句。', '第三句。'],
  '逐句朗讀必須保留句子順序',
);

queued[0].onstart?.();
queued[0].onend?.();
assert.deepEqual(started, [0, 1], '前一單元結束時應備援回報下一個索引');
queued[1].onstart?.();
assert.deepEqual(started, [0, 1], '正常開始事件與備援事件不得重複回報');
queued[1].onend?.();
queued[2].onstart?.();
assert.deepEqual(started, [0, 1, 2], '每個語音單元都必須依序回報正確索引');
assert.equal(completed, false, '最後一句結束前不得提早完成');
queued[2].onend?.();
assert.equal(completed, true, '最後一句結束時必須完成序列');

const staleStarted: number[] = [];
speakSequence(['舊句一。', '舊句二。'], undefined, (index) => staleStarted.push(index));
const oldRunUtterances = queued.slice(-2);
speakSequence(['新句。']);
oldRunUtterances[0].onstart?.();
oldRunUtterances[0].onend?.();
assert.deepEqual(staleStarted, [], '已取消的舊序列不得再改變目前高亮');

console.log('逐句語音序列開始事件與完成事件檢查通過。');
