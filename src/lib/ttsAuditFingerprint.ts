export const TTS_AUDIT_FINGERPRINT_VERSION = 1;

type FingerprintTarget = {
  character: string;
  occurrence: number;
  zhuyin: string;
};

export type AuditFingerprintInput = {
  displayText: string;
  ttsInput: string;
  targets: FingerprintTarget[];
  auditRevision: number;
};

export type AuditFingerprintRecord = {
  displayText?: string;
  ttsInput?: string;
  auditRevision?: number;
  targetFingerprint?: string;
  utteranceFingerprint?: string;
};

function stableHash(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function buildTargetFingerprint(targets: FingerprintTarget[]): string {
  const exactTargets = targets.map(({ character, occurrence, zhuyin }) => ({
    character,
    occurrence,
    zhuyin,
  }));
  return `target-v${TTS_AUDIT_FINGERPRINT_VERSION}-${stableHash(JSON.stringify(exactTargets))}`;
}

export function isMatchingAuditFingerprint(
  current: Required<AuditFingerprintRecord>,
  recorded: AuditFingerprintRecord,
): boolean {
  return (
    recorded.auditRevision === current.auditRevision &&
    recorded.utteranceFingerprint === current.utteranceFingerprint &&
    recorded.targetFingerprint === current.targetFingerprint &&
    recorded.displayText === current.displayText &&
    recorded.ttsInput === current.ttsInput
  );
}

export function buildUtteranceFingerprint({
  displayText,
  ttsInput,
  targets,
  auditRevision,
}: AuditFingerprintInput): string {
  return `utterance-v${TTS_AUDIT_FINGERPRINT_VERSION}-${stableHash(
    JSON.stringify({
      auditRevision,
      displayText,
      ttsInput,
      targetFingerprint: buildTargetFingerprint(targets),
    }),
  )}`;
}
