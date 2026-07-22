import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, ensureSignedIn } from './firebase';
import type { AppData } from './storage';

export interface CloudRecord {
  data: AppData;
  updatedAt: number;
}

function familyDoc(syncCode: string) {
  return doc(db, 'families', syncCode);
}

/** One-time fetch of whatever's currently in the cloud for this sync code (null if nothing saved yet). */
export async function fetchCloudData(syncCode: string): Promise<CloudRecord | null> {
  await ensureSignedIn();
  const snap = await getDoc(familyDoc(syncCode));
  if (!snap.exists()) return null;
  const raw = snap.data() as { data?: AppData; updatedAt?: number };
  if (!raw.data) return null;
  return { data: raw.data, updatedAt: raw.updatedAt ?? 0 };
}

export async function pushCloudData(syncCode: string, data: AppData, updatedAt: number): Promise<void> {
  await ensureSignedIn();
  await setDoc(familyDoc(syncCode), { data, updatedAt });
}

/**
 * Listens for changes made by *other* devices sharing this sync code. Local writes still show up as
 * snapshots, but with `hasPendingWrites: true` (the optimistic local echo before the server confirms) —
 * those are skipped here since we already applied that state locally before writing it.
 */
export function subscribeCloudData(syncCode: string, onChange: (record: CloudRecord) => void): () => void {
  return onSnapshot(
    familyDoc(syncCode),
    (snap) => {
      if (snap.metadata.hasPendingWrites || !snap.exists()) return;
      const raw = snap.data() as { data?: AppData; updatedAt?: number };
      if (!raw.data) return;
      onChange({ data: raw.data, updatedAt: raw.updatedAt ?? 0 });
    },
    () => {
      // Network/permission errors are surfaced via syncStatus in useAppData, not thrown here —
      // the app must keep working from localStorage alone when the cloud is unreachable.
    },
  );
}
