/**
 * A few characters have one much more common "default" reading that TTS voices always pick, even when the
 * text needs a rarer one — the Web Speech API takes plain text only (no SSML/phoneme tags), so the standard
 * workaround is substituting a homophone-for-the-intended-reading character purely in the string handed to
 * the speech engine, never in any displayed or stored text (classical text and clues must stay
 * character-for-character faithful — see guwenLesson.ts). Currently: 沒 followed by 水/入 means "submerged"
 * (讀ㄇㄛˋ, mò, as in 沒水中/沒入) — voices default it to the far more common 沒有-style ㄇㄟˊ (méi) negation
 * reading instead, which doesn't collide with any actual 沒有/沒人/沒說-type negation in this app's content.
 */
function ttsSafe(text: string): string {
  return text.replace(/沒(?=[水入])/g, '末');
}

/** Reads text aloud using the browser's built-in text-to-speech (no API cost, works offline once voices are installed). */
export function speak(text: string, onEnd?: () => void) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    onEnd?.();
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(ttsSafe(text));
  utterance.lang = 'zh-TW';
  utterance.rate = 0.95;
  if (onEnd) utterance.onend = onEnd;
  window.speechSynthesis.speak(utterance);
}

/**
 * Queues several lines as separate utterances so they play back-to-back — the browser only advances to
 * the next one once the previous truly finishes speaking, so there's no need to guess how long a line
 * takes (a fixed-delay timer racing against real speech duration is what used to cut the passage off
 * partway through and jump straight to the next line).
 */
export function speakSequence(texts: string[], onDone?: () => void) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    onDone?.();
    return;
  }
  window.speechSynthesis.cancel();
  texts.forEach((text, i) => {
    const utterance = new SpeechSynthesisUtterance(ttsSafe(text));
    utterance.lang = 'zh-TW';
    utterance.rate = 0.95;
    if (i === texts.length - 1 && onDone) utterance.onend = onDone;
    window.speechSynthesis.speak(utterance);
  });
}

export function pauseSpeech() {
  if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.pause();
}

export function resumeSpeech() {
  if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.resume();
}

export function cancelSpeech() {
  if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
}
