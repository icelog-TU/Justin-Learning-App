import fs from 'node:fs';
import process from 'node:process';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { doc, getDoc, getFirestore } from 'firebase/firestore';

const source = fs.readFileSync(new URL('../src/lib/firebase.ts', import.meta.url), 'utf8');

function configValue(key) {
  const match = source.match(new RegExp(`${key}: '([^']+)'`));
  if (!match) throw new Error(`找不到 Firebase 設定：${key}`);
  return match[1];
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
  const lessons = [];
  for (const entry of index.lessonDocs ?? []) {
    const snapshot = await getDoc(doc(db, 'families', entry.docId));
    if (snapshot.exists()) lessons.push(snapshot.data());
  }

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify({ updatedAt: index.updatedAt, lessons }, null, 2));
  } else {
    console.log('# 古文破譯家多音字中央實測庫');
    console.log('');
    console.log(`- 最後更新：${index.updatedAt ? new Date(index.updatedAt).toISOString() : '尚無'}`);
    console.log(`- 篇章數：${lessons.length}`);
    console.log('');
    for (const lesson of lessons.sort((a, b) => a.lessonNumber - b.lessonNumber)) {
      console.log(`## 第 ${lesson.lessonNumber} 篇《${lesson.lessonTitle}》`);
      console.log('');
      const items = Object.values(lesson.items ?? {});
      for (const item of items) {
        const latest = [...(item.results ?? [])].sort((a, b) => b.receivedAt - a.receivedAt)[0];
        console.log(`- ${item.source}`);
        console.log(`  - 完整語音單元：${item.text}`);
        console.log(`  - 候選字：${item.target}`);
        console.log(`  - 指定讀音：${item.intendedReading}`);
        console.log(`  - 最新結果：${latest?.status === 'correct' ? '念對／不需加註' : latest?.status === 'incorrect' ? '念錯／需要處理' : '待實聽'}`);
        if (latest) {
          console.log(`  - 實聽日期：${latest.checkedAt}`);
          console.log(`  - 裝置／聲音：${latest.environment.zhTwVoiceNames?.join('、') || latest.environment.userAgent}`);
        }
      }
      console.log('');
    }
  }
}

process.exit(process.exitCode ?? 0);
