import fs from 'node:fs';
import path from 'node:path';
import {
  DRAFT_SOURCES,
  draftQuestionIndexByNumber,
  parseDraftQuestions,
} from '../src/lib/guwenDraftPreview';

let failed = false;

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
const thirdLessonQuestionFour = parseDraftQuestions(thirdLessonMarkdown).find((item) => item.number === 4);
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
