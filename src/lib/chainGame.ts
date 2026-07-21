import { idiomChainData, type ChainIdiom } from '../data/idiomChain';

export function isSameSound(pinyinA: string, pinyinB: string): boolean {
  return pinyinA.trim().toLowerCase() === pinyinB.trim().toLowerCase();
}

export function matchesTarget(entry: ChainIdiom, targetChar: string, targetPinyin: string): boolean {
  return entry.firstChar === targetChar || isSameSound(entry.firstPinyin, targetPinyin);
}

export function findCandidates(usedIds: Set<string>, targetChar: string, targetPinyin: string): ChainIdiom[] {
  return idiomChainData.filter((entry) => !usedIds.has(entry.id) && matchesTarget(entry, targetChar, targetPinyin));
}

export function pickRandomStart(): ChainIdiom {
  return idiomChainData[Math.floor(Math.random() * idiomChainData.length)];
}

export function findByWord(word: string): ChainIdiom | undefined {
  const trimmed = word.trim();
  return idiomChainData.find((entry) => entry.word === trimmed);
}

export function maskHint(word: string): string {
  return word
    .split('')
    .map((ch, i) => (i === 1 || i === 2 ? '＿' : ch))
    .join('');
}
