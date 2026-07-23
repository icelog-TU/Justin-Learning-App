/**
 * A few characters have one much more common "default" reading that TTS voices always pick, even when the
 * text needs a rarer one — the Web Speech API takes plain text only (no SSML/phoneme tags), so the standard
 * workaround is substituting a homophone-for-the-intended-reading character purely in the string handed to
 * the speech engine, never in any displayed or stored text (classical text and clues must stay
 * character-for-character faithful — see guwenLesson.ts). Currently:
 * - 沒 followed by 水/入 means "submerged" (讀ㄇㄛˋ, mò, as in 沒水中/沒入) — voices default it to the far more
 *   common 沒有-style ㄇㄟˊ (méi) negation reading instead, which doesn't collide with any actual
 *   沒有/沒人/沒說-type negation in this app's content.
 * - 溱 (as in 《詩經．鄭風．褰裳》「褰裳涉溱」, the river name) should read ㄓㄣ (zhēn) — voices default to the
 *   rarer ㄑㄧㄣˊ (qín) reading instead. Substituted globally since this app only ever uses 溱 as this river
 *   name.
 * - 裳 in 褰裳/衣裳 should read the neutral-tone ㄕㄤ (shang, as in colloquial 衣裳), not ㄔㄤˊ (cháng, the
 *   reading used elsewhere in classical Chinese for 裳 as "a skirt/lower garment" on its own, e.g. 裳裳者華) —
 *   scoped to right after 褰/衣 specifically, not a blanket substitution, since a future lesson quoting 裳 in
 *   a genuine cháng context would need the opposite fix.
 * - 好 in 好上高 (as in 柳宗元〈蝜蝂傳〉「又好上高」, "loves to climb high") should read ㄏㄠˋ (hào, "to be fond
 *   of") — voices default to the far more common ㄏㄠˇ (hǎo, "good") reading instead. Scoped tightly to
 *   right before 上高 specifically — 好 as hǎo is one of the single most common characters in this app's
 *   modern-Chinese glosses/explanations, so a blanket swap would break far more than it fixes.
 * - 曾子 (the disciple 曾參, as in the 韓非子 clue「曾子之妻之市」) should read ㄗㄥ (Zēng, the surname) — voices
 *   default to the far more common ㄘㄥˊ (céng, "already/once", as in 曾經) reading instead. Scoped to right
 *   before 子 specifically, since 曾經 appears constantly across this app's explanations/hints and a blanket
 *   swap would break all of it.
 * - 市 right after 徐 (as in 《史記．秦始皇本紀》「徐市入海求神藥」) is a scribal variant of 徐福 and should read
 *   ㄈㄨˊ (fú), not ㄕˋ (shì, "market") — confirmed via search that 徐市/徐巿/徐福 are the same historical
 *   figure. Scoped to right after 徐 specifically — 市 genuinely means "market" elsewhere in this app (e.g.
 *   the 其 clue "曾子之妻之市" two lines above, or 王戎's original guwen.ts corpus), so a blanket swap would be
 *   wrong there.
 * - 樂樂 (as in 《孟子》「與少樂樂，與眾樂樂，孰樂」, used for 眾) is a classical wordplay where the *first* 樂 in
 *   each pair means "to enjoy/appreciate" (讀ㄩㄝˋ, yuè) and the *second* means "happy" (讀ㄌㄜˋ, lè) — voices
 *   default both to lè. Fixed by substituting the first of each pair with 月 (unambiguously yuè), leaving
 *   the second 樂 and every standalone 樂 elsewhere (快樂/不亦樂乎/孰樂) untouched, since lè is already their
 *   correct and default reading.
 */
function ttsSafe(text: string): string {
  return text
    .replace(/沒(?=[水入])/g, '末')
    .replace(/溱/g, '真')
    .replace(/(?<=[褰衣])裳/g, '傷')
    .replace(/好(?=上高)/g, '耗')
    .replace(/曾(?=子)/g, '增')
    .replace(/(?<=徐)市/g, '福')
    .replace(/樂(?=樂)/g, '月');
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
