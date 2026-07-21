/** Reads text aloud using the browser's built-in text-to-speech (no API cost, works offline once voices are installed). */
export function speak(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-TW';
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
}
