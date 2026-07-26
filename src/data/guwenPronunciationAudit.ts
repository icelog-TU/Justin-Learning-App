import { WANG_RONG_PRONUNCIATION_AUDIT_CATALOG } from './wangRongPronunciationAudit';

export type PronunciationAuditStatus = 'pending' | 'correct' | 'incorrect';

export type PronunciationTarget = {
  character: string;
  occurrence: number;
  zhuyin: string;
  homophoneCue: string;
  usage: string;
  cueMode: 'known_usage' | 'unresolved_target';
};

export type PronunciationVerification = {
  status: Exclude<PronunciationAuditStatus, 'pending'>;
  verifiedDate: string;
  environmentLabel: string;
  evidence: string;
};

export type PronunciationAuditCatalogItem = {
  id: string;
  lessonId: string;
  lessonNumber: number;
  lessonTitle: string;
  questionId: string;
  speechUnitId: string;
  source: string;
  text: string;
  displayText: string;
  ttsInput: string;
  auditRevision: number;
  targetFingerprint: string;
  utteranceFingerprint: string;
  target: string;
  intendedReading: string;
  targets: PronunciationTarget[];
  initialVerifications: PronunciationVerification[];
};

export const RETIRED_PRONUNCIATION_AUDIT_LESSON_IDS = new Set([
  '03-kezhouqiujian',
]);

/**
 * 正式多音字實聽 catalog。
 *
 * 目前只保留第一篇《王戎不取道旁李》。第三篇《刻舟求劍》曾是測試資料，
 * 已依教材編輯者指示從正式實聽流程與中央資料庫退役。
 */
export const GUWEN_PRONUNCIATION_AUDIT_CATALOG: PronunciationAuditCatalogItem[] = [
  ...WANG_RONG_PRONUNCIATION_AUDIT_CATALOG,
];
