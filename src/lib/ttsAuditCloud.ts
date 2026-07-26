import { doc, getDoc, runTransaction, setDoc } from 'firebase/firestore';
import {
  GUWEN_PRONUNCIATION_AUDIT_CATALOG,
  type PronunciationAuditCatalogItem,
  type PronunciationAuditStatus,
  type PronunciationVerification,
} from '../data/guwenPronunciationAudit';
import { db, ensureSignedIn } from './firebase';

const INDEX_DOC_ID = 'GUWENTTS-INDEX-V1';
const DATABASE_KIND = 'guwen-tts-audit-database';
const MAX_SUBMISSIONS_PER_LESSON = 200;
const MAX_RESULTS_PER_ITEM = 20;

export type AuditEnvironment = {
  deviceId: string;
  userAgent: string;
  language: string;
  zhTwVoiceNames: string[];
};

export type AuditResultInput = {
  item: PronunciationAuditCatalogItem;
  status: Exclude<PronunciationAuditStatus, 'pending'>;
  note: string;
  checkedAt: string;
};

export type CloudAuditResult = {
  resultId: string;
  status: Exclude<PronunciationAuditStatus, 'pending'>;
  note: string;
  checkedAt: string;
  receivedAt: number;
  environment: AuditEnvironment;
  source: 'web_audit' | 'editor_confirmation';
};

export type CloudAuditItem = Omit<PronunciationAuditCatalogItem, 'initialVerifications'> & {
  initialVerifications: PronunciationVerification[];
  results: CloudAuditResult[];
};

export type CloudLessonAudit = {
  kind: typeof DATABASE_KIND;
  schemaVersion: 1;
  lessonId: string;
  lessonNumber: number;
  lessonTitle: string;
  items: Record<string, CloudAuditItem>;
  submissions: Array<{
    submissionId: string;
    receivedAt: number;
    itemIds: string[];
    environment: AuditEnvironment;
  }>;
  updatedAt: number;
};

type CloudAuditIndex = {
  kind: typeof DATABASE_KIND;
  schemaVersion: 1;
  lessonDocs: Array<{
    lessonId: string;
    lessonNumber: number;
    lessonTitle: string;
    docId: string;
  }>;
  updatedAt: number;
};

export type CloudAuditDatabase = {
  lessons: CloudLessonAudit[];
  updatedAt: number;
};

function lessonDocId(lessonId: string): string {
  return `GUWENTTS-${lessonId.toUpperCase()}`;
}

function familyDoc(docId: string) {
  return doc(db, 'families', docId);
}

function groupByLesson<T extends { item?: PronunciationAuditCatalogItem; lessonId?: string }>(
  entries: T[],
): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  entries.forEach((entry) => {
    const lessonId = entry.item?.lessonId ?? entry.lessonId;
    if (!lessonId) return;
    grouped.set(lessonId, [...(grouped.get(lessonId) ?? []), entry]);
  });
  return grouped;
}

function initialResult(
  item: PronunciationAuditCatalogItem,
  verification: PronunciationVerification,
  index: number,
): CloudAuditResult {
  return {
    resultId: `initial-${item.id}-${index + 1}`,
    status: verification.status,
    note: verification.evidence,
    checkedAt: verification.verifiedDate,
    receivedAt: Date.parse(`${verification.verifiedDate}T00:00:00+08:00`),
    environment: {
      deviceId: 'user-confirmed-device',
      userAgent: verification.environmentLabel,
      language: 'zh-TW',
      zhTwVoiceNames: [],
    },
    source: 'editor_confirmation',
  };
}

function catalogItemToCloud(item: PronunciationAuditCatalogItem): CloudAuditItem {
  return {
    ...item,
    results: item.initialVerifications.map((verification, index) => initialResult(item, verification, index)),
  };
}

async function ensureCentralCatalog(): Promise<void> {
  const user = await ensureSignedIn();
  if (!user) throw new Error('無法登入中央資料庫');

  const grouped = groupByLesson(GUWEN_PRONUNCIATION_AUDIT_CATALOG);
  const now = Date.now();
  const lessonDocs: CloudAuditIndex['lessonDocs'] = [];

  for (const [lessonId, catalogItems] of grouped) {
    const first = catalogItems[0];
    const docId = lessonDocId(lessonId);
    lessonDocs.push({
      lessonId,
      lessonNumber: first.lessonNumber,
      lessonTitle: first.lessonTitle,
      docId,
    });

    const ref = familyDoc(docId);
    const existing = await getDoc(ref);
    if (!existing.exists()) {
      const items = Object.fromEntries(catalogItems.map((item) => [item.id, catalogItemToCloud(item)]));
      const lesson: CloudLessonAudit = {
        kind: DATABASE_KIND,
        schemaVersion: 1,
        lessonId,
        lessonNumber: first.lessonNumber,
        lessonTitle: first.lessonTitle,
        items,
        submissions: [],
        updatedAt: now,
      };
      await setDoc(ref, lesson);
      continue;
    }

    const current = existing.data() as CloudLessonAudit;
    const items = { ...current.items };
    let changed = false;
    catalogItems.forEach((item) => {
      const saved = items[item.id];
      if (!saved) {
        items[item.id] = catalogItemToCloud(item);
        changed = true;
        return;
      }
      const latestCatalog = { ...item, results: saved.results };
      if (JSON.stringify(latestCatalog) !== JSON.stringify(saved)) {
        items[item.id] = latestCatalog;
        changed = true;
      }
    });
    if (changed) await setDoc(ref, { ...current, items, updatedAt: now });
  }

  const indexRef = familyDoc(INDEX_DOC_ID);
  const indexSnap = await getDoc(indexRef);
  const existingIndex = indexSnap.exists() ? (indexSnap.data() as Partial<CloudAuditIndex>) : null;
  const existingDocs = existingIndex?.lessonDocs ?? [];
  const merged = new Map(existingDocs.map((entry) => [entry.lessonId, entry]));
  lessonDocs.forEach((entry) => merged.set(entry.lessonId, entry));

  const nextIndex: CloudAuditIndex = {
    kind: DATABASE_KIND,
    schemaVersion: 1,
    lessonDocs: [...merged.values()].sort((a, b) => a.lessonNumber - b.lessonNumber),
    updatedAt: now,
  };
  if (JSON.stringify(existingIndex?.lessonDocs ?? []) !== JSON.stringify(nextIndex.lessonDocs)) {
    await setDoc(indexRef, nextIndex);
  }
}

export async function fetchCentralAuditDatabase(): Promise<CloudAuditDatabase> {
  await ensureCentralCatalog();
  const indexSnap = await getDoc(familyDoc(INDEX_DOC_ID));
  if (!indexSnap.exists()) return { lessons: [], updatedAt: 0 };
  const index = indexSnap.data() as CloudAuditIndex;
  const lessons = (
    await Promise.all(
      index.lessonDocs.map(async ({ docId }) => {
        const snap = await getDoc(familyDoc(docId));
        return snap.exists() ? (snap.data() as CloudLessonAudit) : null;
      }),
    )
  ).filter((lesson): lesson is CloudLessonAudit => lesson !== null);
  return { lessons, updatedAt: index.updatedAt };
}

export async function submitAuditResults(
  inputs: AuditResultInput[],
  environment: AuditEnvironment,
): Promise<{ submissionIds: string[]; receivedAt: number }> {
  if (!inputs.length) return { submissionIds: [], receivedAt: Date.now() };
  const user = await ensureSignedIn();
  if (!user) throw new Error('無法登入中央資料庫');

  await ensureCentralCatalog();
  const receivedAt = Date.now();
  const grouped = groupByLesson(inputs);
  const submissionIds: string[] = [];

  for (const [lessonId, lessonInputs] of grouped) {
    const ref = familyDoc(lessonDocId(lessonId));
    const submissionId = `${receivedAt}-${environment.deviceId}-${lessonId}`;
    submissionIds.push(submissionId);

    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(ref);
      const existing = snapshot.exists() ? (snapshot.data() as CloudLessonAudit) : null;
      const first = lessonInputs[0].item;
      const items: Record<string, CloudAuditItem> = { ...(existing?.items ?? {}) };

      lessonInputs.forEach(({ item, status, note, checkedAt }) => {
        const current = items[item.id] ?? catalogItemToCloud(item);
        const result: CloudAuditResult = {
          resultId: `${submissionId}-${item.id}`,
          status,
          note,
          checkedAt,
          receivedAt,
          environment,
          source: 'web_audit',
        };
        const otherEnvironments = current.results.filter(
          (entry) => entry.environment.deviceId !== environment.deviceId,
        );
        items[item.id] = {
          ...current,
          ...item,
          results: [...otherEnvironments, result].slice(-MAX_RESULTS_PER_ITEM),
        };
      });

      const submissions = [
        ...(existing?.submissions ?? []),
        {
          submissionId,
          receivedAt,
          itemIds: lessonInputs.map(({ item }) => item.id),
          environment,
        },
      ].slice(-MAX_SUBMISSIONS_PER_LESSON);

      const next: CloudLessonAudit = {
        kind: DATABASE_KIND,
        schemaVersion: 1,
        lessonId,
        lessonNumber: existing?.lessonNumber ?? first.lessonNumber,
        lessonTitle: existing?.lessonTitle ?? first.lessonTitle,
        items,
        submissions,
        updatedAt: receivedAt,
      };
      transaction.set(ref, next);
    });
  }

  return { submissionIds, receivedAt };
}
