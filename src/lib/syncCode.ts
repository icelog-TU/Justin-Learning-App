const SYNC_CODE_KEY = 'justin-chinese-app-sync-code';
/** Excludes visually-ambiguous characters (0/O, 1/I/L) so a kid can read a code aloud without confusion. */
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function randomCode(): string {
  const bytes = new Uint32Array(8);
  crypto.getRandomValues(bytes);
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += CODE_CHARS[bytes[i] % CODE_CHARS.length];
    if (i === 3) code += '-';
  }
  return code;
}

/** Strips whitespace/dashes and re-inserts the canonical dash, so pasted or hand-typed codes still match. */
export function normalizeSyncCode(raw: string): string {
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (cleaned.length !== 8) return cleaned;
  return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
}

export function getOrCreateSyncCode(): string {
  const existing = localStorage.getItem(SYNC_CODE_KEY);
  if (existing) return existing;
  const code = randomCode();
  localStorage.setItem(SYNC_CODE_KEY, code);
  return code;
}

export function setSyncCode(code: string): string {
  const normalized = normalizeSyncCode(code);
  localStorage.setItem(SYNC_CODE_KEY, normalized);
  return normalized;
}
