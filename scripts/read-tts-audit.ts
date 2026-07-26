import fs from 'node:fs';
import process from 'node:process';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import {
  GUWEN_PRONUNCIATION_AUDIT_CATALOG,
  type PronunciationAuditCatalogItem,
} from '../src/data/guwenPronunciationAudit';

type CloudResult = {
  resultId: string;
  status: 'correct' | 'incorrect';
  checkedAt: string;
  receivedAt: number;
  environment: {
    userAgent: string;
    zhTwVoiceNames?: string[];
    selectedVoice?: {
      name: string;
      voiceURI: string;
      lang: string;
      default: boolean;
      selection: 'explicit' | 'unresolved_default';
    };
  };
  auditRevision?: number;
  utteranceFingerprint?: string;
  targetFingerprint?: string;
  displayText?: string;
  ttsInput?: string;
};

type CloudItem = {
  id: string;
  source: string;
  text: string;
  target: string;
  intendedReading: string;
  results?: CloudResult[];
};

type CloudLesson = {
  lessonId: string;
  lessonNumber: number;
  lessonTitle: string;
  items?: Record<string, CloudItem>;
};

const source = fs.readFileSync(new URL('../src/lib/firebase.ts', import.meta.url), 'utf8');

function configValue(key: string): string {
  const match = source.match(new RegExp(`${key}: '([^']+)'`));
  if (!match) throw new Error(`找不到 Firebase 設定：${key}`);
  return match[1];
}

function isCurrent(item: PronunciationAuditCatalogItem, result: CloudResult): boolean {
  return (
    result.auditRevision === item.auditRevision &&
    result.utteranceFingerprint === item.utteranceFingerprint &&
    result.targetFingerprint === item.targetFingerprint &&
    result.displayText === item.displayText &&
    result.ttsInput === item.ttsInput
  );
}

function latestCurrent(item: PronunciationAuditCatalogItem, cloudItem: CloudItem): CloudResult | null {
  return (
    [...(cloudItem.results ?? [])]
      .filter((result) => isCurrent(item, result))
      .sort((a, b) => b.receivedAt - a.receivedAt)[0] ?? null
  );
}

function environmentLabel(result: CloudResult): string {
  const selected = result.environment.selectedVoice;
  if (selected?.selection === 'explicit') {
    return `${selected.name}（${selected.lang}；${selected.voiceURI}）`;
  }
  return result.environment.zhTwVoiceNames?.join('、') || result.environment.userAgent;
}

const app = initializeApp({
  apiKey: configValue('apiKey'),
  authDomain: configValue('authDomain'),
  projectId: configValue('projectId'),
  storageBucket: configValue('storageBucket'),
  messagingSenderId: configValue('messagingSenderId'),
  appId: configValue('appId'),
});

const auth = getAuth(app);
await signInAnonymously(auth);
const db = getFirestore(app);
const indexSnapshot = await getDoc(doc(db, 'families', 'GUWENTTS-INDEX-V1'));

if (!indexSnapshot.exists()) {
  console.error('中央多音字資料庫尚未建立。請先開啟實聽台，讓正式目錄完成初始化。');
  process.exitCode = 1;
} else {
  const index = indexSnapshot.data();
  const lessons: CloudLesson[] = [];
  for (const entry of index.lessonDocs ?? []) {
    const snapshot = await getDoc(doc(db, 'families', entry.docId));
    if (snapshot.exists()) lessons.push(snapshot.data() as CloudLesson);
  }

  const cloudItems = new Map(
    lessons.flatMap((lesson) =>
      Object.values(lesson.items ?? {}).map((item) => [item.id, { lesson, item }] as const),
    ),
  );
  const localIds = new Set(GUWEN_PRONUNCIATION_AUDIT_CATALOG.map((item) => item.id));
  const records = GUWEN_PRONUNCIATION_AUDIT_CATALOG.map((item) => {
    const cloud = cloudItems.get(item.id);
    if (!cloud) return { item, state: 'missing' as const, result: null };
    const result = latestCurrent(item, cloud.item);
    if (result) return { item, state: result.status, result };
    return {
      item,
      state: (cloud.item.results?.length ? 'stale' : 'pending') as 'stale' | 'pending',
      result: null,
    };
  });
  const orphans = [...cloudItems.values()].filter(({ item }) => !localIds.has(item.id));
  const summary = {
    total: records.length,
    correct: records.filter((record) => record.state === 'correct').length,
    incorrect: records.filter((record) => record.state === 'incorrect').length,
    pending: records.filter((record) => record.state === 'pending').length,
    stale: records.filter((record) => record.state === 'stale').length,
    missing: records.filter((record) => record.state === 'missing').length,
    orphan: orphans.length,
  };

  if (process.argv.includes('--json')) {
    console.log(
      JSON.stringify(
        {
          updatedAt: index.updatedAt,
          schemaVersion: index.schemaVersion ?? 1,
          summary,
          records: records.map(({ item, state, result }) => ({
            id: item.id,
            lessonId: item.lessonId,
            source: item.source,
            displayText: item.displayText,
            ttsInput: item.ttsInput,
            utteranceFingerprint: item.utteranceFingerprint,
            state,
            result,
          })),
          orphans: orphans.map(({ lesson, item }) => ({
            lessonId: lesson.lessonId,
            id: item.id,
            source: item.source,
          })),
        },
        null,
        2,
      ),
    );
  } else {
    console.log('# 古文破譯家多音字中央實測庫');
    console.log('');
    console.log(`- 最後更新：${index.updatedAt ? new Date(index.updatedAt).toISOString() : '尚無'}`);
    console.log(`- 中央 schema：v${index.schemaVersion ?? 1}`);
    console.log(`- 正式候選：${summary.total}`);
    console.log(`- 有效念對：${summary.correct}`);
    console.log(`- 有效念錯：${summary.incorrect}`);
    console.log(`- 待實聽：${summary.pending}`);
    console.log(`- 待複驗（舊指紋）：${summary.stale}`);
    console.log(`- 中央缺少：${summary.missing}`);
    console.log(`- 中央孤兒紀錄：${summary.orphan}`);
    console.log('');

    const grouped = new Map<number, typeof records>();
    records.forEach((record) => {
      grouped.set(record.item.lessonNumber, [
        ...(grouped.get(record.item.lessonNumber) ?? []),
        record,
      ]);
    });
    for (const lessonRecords of [...grouped.values()].sort(
      (a, b) => a[0].item.lessonNumber - b[0].item.lessonNumber,
    )) {
      const first = lessonRecords[0].item;
      console.log(`## 第 ${first.lessonNumber} 篇《${first.lessonTitle}》`);
      console.log('');
      for (const { item, state, result } of lessonRecords) {
        const status =
          state === 'correct'
            ? '念對／不需加註'
            : state === 'incorrect'
              ? '念錯／需要處理'
              : state === 'stale'
                ? '待複驗／中央只有舊指紋結果'
                : state === 'missing'
                  ? '待同步／中央缺少正式 item'
                  : '待實聽';
        console.log(`- ${item.source}（${item.id}）`);
        console.log(`  - 完整語音單元：${item.displayText}`);
        console.log(`  - 實際 TTS 輸入：${item.ttsInput}`);
        console.log(`  - 候選字：${item.target}`);
        console.log(`  - 指定讀音：${item.intendedReading}`);
        console.log(`  - 指紋：${item.utteranceFingerprint}`);
        console.log(`  - 有效結論：${status}`);
        if (result) {
          console.log(`  - 實聽日期：${result.checkedAt}`);
          console.log(`  - 實際聲音：${environmentLabel(result)}`);
          console.log(`  - 回傳編號：${result.resultId}`);
        }
      }
      console.log('');
    }

    if (orphans.length) {
      console.log('## 中央孤兒紀錄');
      console.log('');
      orphans.forEach(({ lesson, item }) => {
        console.log(`- 第 ${lesson.lessonNumber} 篇《${lesson.lessonTitle}》：${item.id}｜${item.source}`);
      });
      console.log('');
    }
  }

  if (
    process.argv.includes('--strict') &&
    (summary.stale > 0 || summary.missing > 0 || summary.orphan > 0)
  ) {
    process.exitCode = 2;
  }
}

process.exit(process.exitCode ?? 0);
