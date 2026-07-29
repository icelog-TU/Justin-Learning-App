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
 * - 好 in 好上高 (as in 柳宗元〈蝜蝂傳〉「又好上高」, "loves to climb high"), 好乘馬 (as in 《笑府》「有好乘馬者為
 *   人所欺」, "someone who loves riding horses", used for 為), or 好辯 (as in 《孟子・滕文公下》「予豈好辯哉？予
 *   不得已也」, "do I really love arguing?", used for 予) should read ㄏㄠˋ (hào, "to be fond of") — voices
 *   default to the far more common ㄏㄠˇ (hǎo, "good") reading instead. Scoped tightly to right before
 *   上高/乘馬/辯 specifically — 好 as hǎo is one of the single most common characters in this app's
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
 * - 說 in 不亦說乎 (as in 《論語．學而》「學而時習之，不亦說乎」) is a 通假字 for 悅 and should read ㄩㄝˋ (yuè,
 *   "pleased") — voices default to the far more common ㄕㄨㄛ (shuō, "to speak") reading instead. Substituted
 *   with 悅 (which only ever reads yuè, so it's an unambiguous stand-in), scoped tightly to right between 亦
 *   and 乎 — 說 as shuō is one of the most common characters in this app's own explanations/hints, so a
 *   blanket swap would break far more than it fixes.
 * - 卡 (e.g. 守株待兔's clue「羝羊觸藩，羸其角」gloss "羊角被卡住了") should always read Taiwan's ㄎㄚˇ (kǎ, as in
 *   卡片/卡通/信用卡) — this is not a rare-vs-common-reading mixup like the others above, it's a Taiwan-vs-
 *   Mainland standard difference: Mainland dictionaries give 卡 a second reading ㄑㄧㄚˇ (qiǎ) specifically for
 *   the "stuck/jammed" meaning (卡住/關卡), which Taiwan's 教育部 一字多音 standard does not recognize at all —
 *   in Taiwan 卡 is always kǎ regardless of meaning. Substituted globally with 佧 (unambiguously kǎ, no
 *   alternate reading, no "stuck" semantic association to trigger a different pronunciation branch) per the
 *   user's explicit instruction to force the Taiwan reading everywhere this character appears, not just in
 *   the "stuck" sense — every other use in this app (卡片/卡通/關卡) already wants kǎ too, so there's no
 *   context here where the swap could be wrong.
 * - 長 in 揠苗助長's "不長"/"苗長"/"長高"/"長得"/"生長"/"助長" (as in「苗之不長」"the crop isn't growing", 「予助苗
 *   長矣」"I helped the crop grow", and the lesson title/idiom name 揠苗【助長】itself) should read ㄓㄤˇ (zhǎng,
 *   "to grow") — voices default to the far more common ㄔㄤˊ (cháng, "long") reading instead. The user caught
 *   this directly: "應該唸掌...都念成長短的常了" (should read like 掌, it's being read like the cháng in 長短
 *   instead). Substituted with 掌 (unambiguously zhǎng, as the user's own comparison suggested) whenever 長
 *   follows 不/苗/生/助 or precedes 高/得 — this covers every "grow" occurrence checked across the app's
 *   content (不長/苗長/長高/長得/生長/助長, including the pre-existing 拔苗助長 idiom card's own "助長" and
 *   "禾苗長得太慢"), none of which collide with any actual cháng ("long") use of 長 elsewhere (e.g. 長短/長遠/
 *   長時間/長年 all use different surrounding characters, so this scoped pattern leaves them untouched).
 * - 予 used as the first-person pronoun "I/me" (as in 揠苗助長's clues「予欲無言」"I wish to stop speaking",
 *   「予豈好辯哉」"do I really love arguing?", and the本篇's own「予助苗長矣」"I helped the crop grow") should
 *   read ㄩˊ (yú, homophone of 於/余/魚) — voices default to the far more common ㄩˇ (yǔ, "to give", as in
 *   給予) reading instead. The user caught this directly: "所有的予都唸成雨了...要改成於" (every 予 is being
 *   read like 雨/yǔ, should sound like 於 instead). Substituted with 於 (unambiguously yú) everywhere 予
 *   appears EXCEPT right after 給 — this app's only other use of 予 is the compound word 給予 ("to give",
 *   in a confusables.ts tip), which genuinely wants the yǔ reading and must stay untouched.
 * - 得 meaning "to obtain/find" right before 鐘/兔/活 (as in 掩耳盜鐘's「百姓有得鐘者」"someone found a bell",
 *   守株待兔's「冀復得兔」/「不可復得」"hoping to get another rabbit", and 幾死，眾救得活's「得活」"survived") should
 *   read ㄉㄜˊ (dé, "to obtain") — voices default to the far more common neutral-tone ㄉㄜ˙ (de) grammatical-
 *   particle reading instead (as in 覺得/記得/值得/使得/顯得/V得+complement). The user caught this directly:
 *   "得鐘唸成的中了。應該是德中" (得鐘 is being read like 的中, should sound like 德中 instead). Some Android
 *   voices still turn the first syllable into neutral-tone de even when the pair is replaced with 德鐘 or
 *   德宗. For 得鐘, insert a zero-width word boundary after the homophone 德. This keeps the whole sentence
 *   in one utterance (and therefore preserves natural prosody) while preventing the Android tokenizer from
 *   treating 德鐘 as one ambiguous unit. Displayed text remains 得鐘. The narrower 德 substitution remains
 *   for 得兔/得活.
 */
function ttsSafe(text: string): string {
  return text
    .replace(/沒(?=[水入])/g, '末')
    .replace(/(?<=出)沒/g, '末')
    .replace(/溱/g, '真')
    .replace(/(?<=[褰衣])裳/g, '傷')
    .replace(/好(?=上高|乘馬|辯)/g, '耗')
    .replace(/曾(?=子)/g, '增')
    .replace(/(?<=徐)市/g, '福')
    .replace(/樂(?=樂)/g, '月')
    .replace(/(?<=亦)說(?=乎)/g, '悅')
    .replace(/卡/g, '佧')
    .replace(/(?<=[不苗生助])長|長(?=[高得])/g, '掌')
    .replace(/(?<!給)予/g, '於')
    .replace(/得(?=「?鐘)/g, '德\u200B')
    .replace(/得(?=「?[兔活履])/g, '德')
    .replace(/著(?=遠遊履)/g, '濁')
    .replace(/(?<=輕)重/g, '仲')
    .replace(/度(?=其足|身而衣|，然後知長短|唸作墮|」當作「測量)/g, '墮')
    .replace(/(?<=[持信])度|度(?=唸作肚|」當作「尺寸)/g, '肚')
    .replace(/量(?=腹而食)/g, '亮')
    .replace(/量(?=自己的腳|腳|好的尺寸|得的尺寸|過自己的腳|過腳|測量)/g, '良')
    .replace(/(?<=日)中(?=如|，|。)/g, '鐘')
    .replace(/(?<=挑)中/g, '種')
    .replace(/(?<=莫能|打不)中/g, '種')
    .replace(/(?<=[市歌曲])罷|罷(?=唸作爸)/g, '爸')
    .replace(/寧(?=信|可|唸作濘)/g, '濘')
    .replace(/(?<=以)為(?=神明|有神)/g, '圍')
    .replace(/杓/g, '勺')
    .replace(/食(?=無肉)|(?<=而)食/g, '十')
    .replace(/曲(?=罷)/g, '取')
    .replace(/朝(?=向)/g, '潮')
    .replace(/(?<=相)當(?=於)|當(?=作)/g, '蕩')
    .replace(/(?<=進)行/g, '形')
    .replace(/(?<=玉)斗/g, '抖')
    .replace(/(?<=太丘)舍(?=去)/g, '捨');
}

/** Returns the exact string that the production speech path sends to the browser TTS engine. */
export function getTtsInput(text: string): string {
  return ttsSafe(text);
}

export type SelectedSpeechVoice = {
  name: string;
  voiceURI: string;
  lang: string;
  default: boolean;
  selection: 'explicit' | 'unresolved_default';
};

export function selectZhTwVoice(
  voices: SpeechSynthesisVoice[] = typeof window !== 'undefined' && window.speechSynthesis
    ? window.speechSynthesis.getVoices()
    : [],
): SpeechSynthesisVoice | null {
  return (
    voices
      .filter((voice) => voice.lang.toLowerCase() === 'zh-tw')
      .sort(
        (a, b) =>
          Number(b.default) - Number(a.default) ||
          Number(b.localService) - Number(a.localService) ||
          a.name.localeCompare(b.name, 'zh-TW') ||
          a.voiceURI.localeCompare(b.voiceURI),
      )[0] ?? null
  );
}

export function getSelectedSpeechVoiceDetails(
  voices?: SpeechSynthesisVoice[],
): SelectedSpeechVoice {
  const voice = selectZhTwVoice(voices);
  if (!voice) {
    return {
      name: '系統預設聲音（瀏覽器未提供實際名稱）',
      voiceURI: '',
      lang: 'zh-TW',
      default: true,
      selection: 'unresolved_default',
    };
  }
  return {
    name: voice.name,
    voiceURI: voice.voiceURI,
    lang: voice.lang,
    default: voice.default,
    selection: 'explicit',
  };
}

export function isSpeechSynthesisAvailable(): boolean {
  return typeof window !== 'undefined'
    && Boolean(window.speechSynthesis)
    && typeof SpeechSynthesisUtterance !== 'undefined';
}

function queueSpeech(texts: string[], onDone?: () => void) {
  const selectedVoice = selectZhTwVoice();
  texts.map(ttsSafe).forEach((text, i) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-TW';
    utterance.rate = 0.95;
    if (selectedVoice) utterance.voice = selectedVoice;
    if (i === texts.length - 1 && onDone) utterance.onend = onDone;
    window.speechSynthesis.speak(utterance);
  });
}

/** Reads text aloud using the browser's built-in text-to-speech (no API cost, works offline once voices are installed). */
export function speak(text: string, onEnd?: () => void) {
  if (!isSpeechSynthesisAvailable()) {
    onEnd?.();
    return;
  }
  window.speechSynthesis.cancel();
  queueSpeech([text], onEnd);
}

/**
 * Queues several lines as separate utterances so they play back-to-back — the browser only advances to
 * the next one once the previous truly finishes speaking, so there's no need to guess how long a line
 * takes (a fixed-delay timer racing against real speech duration is what used to cut the passage off
 * partway through and jump straight to the next line).
 */
export function speakSequence(texts: string[], onDone?: () => void) {
  if (!isSpeechSynthesisAvailable()) {
    onDone?.();
    return;
  }
  window.speechSynthesis.cancel();
  queueSpeech(texts, onDone);
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
