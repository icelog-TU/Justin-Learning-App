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

if (failed) process.exit(1);
