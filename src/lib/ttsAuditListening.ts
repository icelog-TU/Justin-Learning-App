import type { PronunciationAuditStatus } from '../data/guwenPronunciationAudit';

export type TtsAuditListeningFilter = 'all' | 'unheard' | 'heard';

export function isTtsAuditItemHeard(status: PronunciationAuditStatus): boolean {
  return status !== 'pending';
}

export function matchesTtsAuditListeningFilter(
  status: PronunciationAuditStatus,
  filter: TtsAuditListeningFilter,
): boolean {
  if (filter === 'unheard') return !isTtsAuditItemHeard(status);
  if (filter === 'heard') return isTtsAuditItemHeard(status);
  return true;
}
