/**
 * Builds a Google search URL phrased to nudge Google's AI Overview toward a kid-friendly
 * explanation. Google's AI Overview isn't a fully prompt-steerable chat model — it won't always
 * honor this — but including "用6到8歲小朋友聽得懂的簡單說法" measurably shifts the tone simpler
 * and more concrete for most idioms, at no cost and no extra API integration.
 */
export function buildIdiomSearchUrl(word: string): string {
  const query = `成語「${word}」是什麼意思？請用6到8歲小朋友聽得懂的簡單白話文解釋這個成語的意思和典故故事`;
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}
