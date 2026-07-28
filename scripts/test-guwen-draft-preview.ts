import fs from 'node:fs';
import path from 'node:path';
import {
  DRAFT_SOURCES,
  draftQuestionIndexByNumber,
  parseDraftQuestions,
  resolveDraftSource,
} from '../src/lib/guwenDraftPreview';

let failed = false;

const thirdLessonPathIndex = DRAFT_SOURCES.findIndex((source) => source.path === '03-guwen-kezhouqiujian-decoder-content.md');
if (resolveDraftSource('03-guwen-kezhouqiujian-decoder-content.md', null).index !== thirdLessonPathIndex) {
  failed = true;
  console.error('  ERROR: active MD 路徑沒有正確定位到第三篇');
}
if (resolveDraftSource(null, 'ke-zhou-qiu-jian').index !== thirdLessonPathIndex) {
  failed = true;
  console.error('  ERROR: 舊 lessonId 連結不再相容第三篇');
}
if (resolveDraftSource('not-a-real-active-master.md', null).index !== undefined) {
  failed = true;
  console.error('  ERROR: 無效 active MD 路徑仍默默退回第一篇');
}
if (!resolveDraftSource('not-a-real-active-master.md', null).error) {
  failed = true;
  console.error('  ERROR: 無效 active MD 路徑沒有回報錯誤');
}
if (resolveDraftSource('03-guwen-kezhouqiujian-decoder-content.md', 'wrong-legacy-id').index !== thirdLessonPathIndex) {
  failed = true;
  console.error('  ERROR: 同時提供參數時沒有優先採用 active MD 路徑');
}
if (resolveDraftSource('not-a-real-active-master.md', 'ke-zhou-qiu-jian').index !== undefined) {
  failed = true;
  console.error('  ERROR: 無效 active MD 路徑被舊 lessonId 掩蓋');
}
if (resolveDraftSource(null, null).index !== 0) {
  failed = true;
  console.error('  ERROR: 未指定教材時無法開啟預覽首頁');
}

for (const source of DRAFT_SOURCES) {
  const markdown = fs.readFileSync(path.resolve(source.path), 'utf8');
  const questions = parseDraftQuestions(markdown);
  const approved = questions.filter((question) => /核准/.test(question.status));
  const complete = approved.filter((question) => question.diagnostics.length === 0);
  console.log(`${source.title}: ${questions.length} 題，${approved.length} 題核准，${complete.length} 題主要欄位完整`);
  if (!questions.length) {
    failed = true;
    console.error(`  ERROR: ${source.path} 沒有解析出任何題目`);
  }
  for (const question of approved.filter((item) => item.diagnostics.length)) {
    console.warn(`  第 ${question.number} 題：${question.diagnostics.join('；')}`);
  }
}

const representativeSources = [
  {
    path: 'lessons/01-guwen-wangrong-rewrite.md',
    question: 1,
    expected: ['史記', '蘇軾'],
  },
  {
    path: '02-guwen-simaguang-decoder-content.md',
    question: 1,
    expected: ['搜神記', '論語'],
  },
  {
    path: '04-guwen-shouzhudaitu-decoder-content.md',
    question: 1,
    expected: ['說文解字', '錢澄之'],
  },
  {
    path: '09-guwen-yangshizi-decoder-content.md',
    question: 1,
    expected: ['大明高僧傳', '大明高僧傳'],
  },
];

for (const example of representativeSources) {
  const markdown = fs.readFileSync(path.resolve(example.path), 'utf8');
  const question = parseDraftQuestions(markdown).find((item) => item.number === example.question);
  example.expected.forEach((needle, index) => {
    const actual = question?.clues[index]?.source?.text ?? '';
    if (!actual.includes(needle)) {
      failed = true;
      console.error(`  ERROR: ${example.path} 第 ${example.question} 題線索 ${index + 1} 沒有抓到「${needle}」出處`);
    }
  });
}

const thirdLessonMarkdown = fs.readFileSync(path.resolve('03-guwen-kezhouqiujian-decoder-content.md'), 'utf8');
const thirdLessonQuestions = parseDraftQuestions(thirdLessonMarkdown);
const thirdLessonQuestionFour = thirdLessonQuestions.find((item) => item.number === 4);
const thirdLessonQuestionFive = thirdLessonQuestions.find((item) => item.number === 5);
const thirdLessonQuestionEight = thirdLessonQuestions.find((item) => item.number === 8);
const thirdLessonQuestionNineteen = thirdLessonQuestions.find((item) => item.number === 19);
const thirdLessonQuestionTwenty = thirdLessonQuestions.find((item) => item.number === 20);
if (thirdLessonQuestions.length !== 20 || thirdLessonQuestions.at(-1)?.number !== 20) {
  failed = true;
  console.error('  ERROR: 第三篇沒有依新版題數控制保留第 1～20 題');
}
const expectedExplanationParts = [
  '第一條線索中，碗原本在手中',
  '第二條線索中，算袋原本也在手中',
  '兩條線索共同出現的位置變化',
  '【墜】＝從原來的位置往下掉',
  '這把鑰匙說明的是移動方向',
];
for (const expected of expectedExplanationParts) {
  if (!thirdLessonQuestionFour?.explanation?.text.includes(expected)) {
    failed = true;
    console.error(`  ERROR: 第三篇第 4 題詳解沒有完整抓到「${expected}」`);
  }
}
if (thirdLessonQuestionFour?.key) {
  failed = true;
  console.error('  ERROR: 第三篇第 4 題的成人編輯欄位被誤顯示為孩子端密碼鑰匙');
}
const expectedQuestionFiveKeys = [
  ['其劍', '前面那位楚國人的劍'],
  ['自舟中', '從船裡'],
  ['墜', '從原來的位置往下掉'],
  ['於水', '到水裡'],
];
expectedQuestionFiveKeys.forEach(([code, decodedEvidence], index) => {
  const actual = thirdLessonQuestionFive?.preAnswerKeys[index];
  if (actual?.code.text !== code || actual.decodedEvidence.text !== decodedEvidence) {
    failed = true;
    console.error(`  ERROR: 第三篇第 5 題沒有正確抓到第 ${index + 1} 把作答前密碼鑰匙`);
  }
});
if (thirdLessonQuestionEight?.preAnswerKeys.some((key) => key.code.text === '原文密碼')) {
  failed = true;
  console.error('  ERROR: 第三篇第 8 題把密碼表標題誤當成一把鑰匙');
}
if (
  thirdLessonQuestionNineteen?.kind !== 'sequence'
  || thirdLessonQuestionNineteen.sequenceCards.length !== 5
  || thirdLessonQuestionNineteen.sequenceCorrectOrder.join('') !== 'CEDAB'
) {
  failed = true;
  console.error('  ERROR: 第三篇第 19 題沒有解析成五張事件卡與 CEDAB 正確順序');
}
if (
  thirdLessonQuestionTwenty?.kind !== 'multiselect'
  || thirdLessonQuestionTwenty.multiSelectOptions.length !== 6
  || thirdLessonQuestionTwenty.multiSelectOptions
    .flatMap((option, index) => option.correct ? [index + 1] : [])
    .join(',') !== '1,4,6'
) {
  failed = true;
  console.error('  ERROR: 第三篇第 20 題沒有解析成六項多選題與 1、4、6 正解');
}
for (const source of DRAFT_SOURCES) {
  const markdown = fs.readFileSync(path.resolve(source.path), 'utf8');
  for (const question of parseDraftQuestions(markdown)) {
    if (/---|<a\b/i.test(question.explanation?.text ?? '')) {
      failed = true;
      console.error(`  ERROR: ${source.path} 第 ${question.number} 題詳解混入 Markdown 導航標記`);
    }
  }
}

const canonicalKeyExample = parseDraftQuestions(`
# 第 1 題（測試）｜正式鑰匙欄位

## 本題取得的密碼鑰匙（作答後才顯示）

> 【測】＝正式作答後鑰匙
`)[0];
if (canonicalKeyExample?.key?.text !== '【測】＝正式作答後鑰匙') {
  failed = true;
  console.error('  ERROR: 正式作答後密碼鑰匙欄位沒有正確解析');
}

const seventhLessonSource = DRAFT_SOURCES.find((source) => source.lessonId === 'zheng-ren-mai-lv');
if (!seventhLessonSource) {
  failed = true;
  console.error('  ERROR: 找不到第七篇鄭人買履的成人預覽來源');
} else {
  const markdown = fs.readFileSync(path.resolve(seventhLessonSource.path), 'utf8');
  const questions = parseDraftQuestions(markdown);
  const questionIndex = draftQuestionIndexByNumber(questions, 10);
  if (questions[questionIndex]?.number !== 10) {
    failed = true;
    console.error('  ERROR: questionNumber=10 沒有對應到第七篇第十題');
  }
}

if (failed) process.exit(1);
