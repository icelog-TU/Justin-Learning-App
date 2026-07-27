import fs from 'node:fs';
import path from 'node:path';
import { DRAFT_SOURCES, parseDraftQuestions } from '../src/lib/guwenDraftPreview';

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

if (failed) process.exit(1);
