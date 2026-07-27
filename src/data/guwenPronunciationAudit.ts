import { SIMA_GUANG_PRONUNCIATION_AUDIT_CATALOG } from './simaGuangPronunciationAudit';
import { SHOU_ZHU_DAI_TU_PRONUNCIATION_AUDIT_CATALOG } from './shouZhuDaiTuPronunciationAudit';
import { WANG_RONG_PRONUNCIATION_AUDIT_CATALOG } from './wangRongPronunciationAudit';

export type PronunciationAuditStatus = 'pending' | 'correct' | 'incorrect';

export type PronunciationTarget = {
  character: string;
  occurrence: number;
  zhuyin: string;
  homophoneCue: string;
  usage: string;
  cueMode: 'known_usage' | 'unresolved_target';
  /** 正式 TTS 管線對此位置採用的分組條件；跨篇沿用時必須完全相同。 */
  ttsBehavior?: string;
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
 * 第一篇《王戎不取道旁李》、第二篇《司馬光破甕救友》與
 * 第四篇《守株待兔》使用正式 catalog。
 * 第三篇《刻舟求劍》曾是測試資料，已依教材編輯者指示退役。
 */
export const GUWEN_PRONUNCIATION_AUDIT_CATALOG: PronunciationAuditCatalogItem[] = [
  ...WANG_RONG_PRONUNCIATION_AUDIT_CATALOG,
  ...SIMA_GUANG_PRONUNCIATION_AUDIT_CATALOG,
  ...SHOU_ZHU_DAI_TU_PRONUNCIATION_AUDIT_CATALOG,
];
