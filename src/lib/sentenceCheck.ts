export interface SentenceCheckResult {
  passed: boolean;
  messages: string[];
}

export function checkSentence(word: string, sentence: string): SentenceCheckResult {
  const trimmed = sentence.trim();
  const messages: string[] = [];

  if (trimmed.length === 0) {
    return { passed: false, messages: ['請先寫出你的句子喔！'] };
  }

  const containsWord = trimmed.includes(word);
  if (!containsWord) {
    messages.push(`句子裡沒有找到「${word}」，記得要把成語完整地用進句子中喔。`);
  }

  const minLength = word.length + 4;
  if (trimmed.length < minLength) {
    messages.push('句子有點太短了，試著把事情發生的原因或情況說清楚吧。');
  }

  const punctuation = ['。', '！', '？', '，', '~'];
  const endsWithPunctuation = punctuation.some((p) => trimmed.endsWith(p));
  if (!endsWithPunctuation) {
    messages.push('別忘了在句子最後加上標點符號（例如：。）。');
  }

  const passed = containsWord && trimmed.length >= minLength;
  if (passed && messages.length === 0) {
    messages.push('寫得很好！句子完整又通順。');
  } else if (passed) {
    messages.push('已經用對成語了，再注意一下小細節會更棒！');
  }

  return { passed, messages };
}
