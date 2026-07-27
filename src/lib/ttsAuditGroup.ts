import type { PronunciationTarget } from '../data/guwenPronunciationAudit';

export const TTS_AUDIT_REUSE_GROUP_VERSION = 1;

/**
 * 跨篇免重聽只允許完全相同的讀音群組。
 *
 * usage 必須是會影響讀音判斷的穩定用法名稱；不得只憑同字同音自動合併。
 */
export function buildPronunciationReuseGroupKey(
  target: PronunciationTarget,
): string | null {
  if (!target.ttsBehavior) return null;
  return [
    `reuse-v${TTS_AUDIT_REUSE_GROUP_VERSION}`,
    target.character,
    target.zhuyin,
    target.usage,
    target.ttsBehavior,
  ].join('|');
}
