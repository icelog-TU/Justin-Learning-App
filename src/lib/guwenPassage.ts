/** Remove authoring-only target markers before matching a lesson step to the full passage. */
export function normalizeGuwenPassageText(text: string): string {
  return text.replace(/[【】\s]/g, '');
}

/**
 * A step can target a complete passage chunk or only one phrase inside it.
 * Match both shapes after removing the 【】 markers used to highlight the word
 * currently being decoded.
 */
export function guwenSentenceMatchesTarget(sentence: string, targetSentence: string): boolean {
  const normalizedSentence = normalizeGuwenPassageText(sentence);
  const normalizedTarget = normalizeGuwenPassageText(targetSentence);

  if (!normalizedSentence || !normalizedTarget) return false;
  return (
    normalizedSentence.includes(normalizedTarget)
    || normalizedTarget.includes(normalizedSentence)
  );
}
