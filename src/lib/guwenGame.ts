import type { GuwenWord } from '../data/guwen';

export interface GuwenToken {
  text: string;
  wordId: string | null;
}

/**
 * Greedily matches the longest configured word at each position of the passage, so a two-character
 * word like "信然" is captured as one token instead of being split into two unrelated single-character
 * matches. Everything else (punctuation, characters not being decoded) comes back as plain tokens.
 */
export function tokenizeGuwenText(fullText: string, words: GuwenWord[]): GuwenToken[] {
  const byLengthDesc = [...words].sort((a, b) => b.char.length - a.char.length);
  const tokens: GuwenToken[] = [];
  let i = 0;
  while (i < fullText.length) {
    const match = byLengthDesc.find((w) => fullText.startsWith(w.char, i));
    if (match) {
      tokens.push({ text: match.char, wordId: match.id });
      i += match.char.length;
    } else {
      tokens.push({ text: fullText[i], wordId: null });
      i += 1;
    }
  }
  return tokens;
}
