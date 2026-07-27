import fs from 'node:fs';
import path from 'node:path';
import { DRAFT_SOURCES, parseDraftQuestions } from '../src/lib/guwenDraftPreview';
import { GUWEN_CHILD_BASELINE } from './guwen-master-child-baseline';
import { childSnapshot } from './guwen-master-child-snapshot';

const forbiddenHeadings = new Set([
  'App 引導語',
  '比較任務',
  '推理提問',
  '推理問題',
  '破譯問題',
  '重建問題',
  '提交假說',
  '提交重建結果',
  '麻煩古文破譯家幫忙',
  '題目',
  '正解',
  '答錯提示',
  '密碼鑰匙收入工具箱',
  '取得密碼鑰匙',
  '線索類型與出處',
  '線索類型與來源',
]);

const errors: string[] = [];
const warnings: string[] = [];

if (DRAFT_SOURCES.length !== 9) errors.push(`catalog 應為 9 篇，目前為 ${DRAFT_SOURCES.length} 篇`);

for (const source of DRAFT_SOURCES) {
  const markdown = fs.readFileSync(path.resolve(source.path), 'utf8');
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const expectedTitle = `# 古文破譯家｜《${source.title.split('｜').at(-1)}》教材主檔`;
  if (!lines.includes(expectedTitle)) errors.push(`${source.path}: 大標題不是「${expectedTitle}」`);

  const baseline = GUWEN_CHILD_BASELINE[source.path];
  const current = childSnapshot(markdown);
  if (!baseline) {
    errors.push(`${source.path}: 缺少孩子端保護指紋`);
  } else if (baseline.questionCount !== current.questionCount || baseline.hash !== current.hash) {
    errors.push(`${source.path}: 孩子端文字或排列已偏離核准指紋`);
  }

  lines.forEach((line, index) => {
    const heading = line.match(/^#{1,5}\s+(.+?)\s*$/)?.[1];
    if (heading && forbiddenHeadings.has(heading)) {
      errors.push(`${source.path}:${index + 1}: 禁用舊標題「${heading}」`);
    }
  });

  const questions = parseDraftQuestions(markdown);
  if (!questions.length) errors.push(`${source.path}: 沒有解析出正式題目`);
  for (let index = 0; index < questions.length; index += 1) {
    const question = questions[index];
    const start = question.line - 1;
    const end = questions[index + 1]?.line ? questions[index + 1].line - 1 : lines.length;
    const block = lines.slice(start, end);
    if (!/^# 第 \d+ 題（[^）]+）/.test(lines[start])) {
      errors.push(`${source.path}:${question.line}: 題目標題未使用「# 第 N 題（狀態）」`);
    }
    if (!block.includes('## 本篇完整原文（成人審稿用）')) {
      errors.push(`${source.path}:${question.line}: 第 ${question.number} 題缺少成人審稿用完整原文`);
    }
    question.clues.forEach((clue, clueIndex) => {
      if (!clue.source?.text) {
        errors.push(`${source.path}:${clue.line}: 第 ${question.number} 題線索 ${clueIndex + 1} 缺少出處`);
      }
      const clueStart = clue.line - 1;
      let clueEnd = end;
      for (let lineIndex = clueStart + 1; lineIndex < end; lineIndex += 1) {
        if (/^#{1,2}\s+/.test(lines[lineIndex]) || /^### 線索[一二三四五六七八九十\d]+\s*$/.test(lines[lineIndex])) {
          clueEnd = lineIndex;
          break;
        }
      }
      if (!lines.slice(clueStart + 1, clueEnd).includes('#### 出處（成人資料）')) {
        errors.push(`${source.path}:${clue.line}: 第 ${question.number} 題線索 ${clueIndex + 1} 的出處未緊鄰線索`);
      }
    });
  }

  if (lines.includes('## 任務開場')) {
    if (!lines.includes('### 第一頁｜請古文破譯家接受委託')) {
      errors.push(`${source.path}: 任務開場缺少統一的第一頁標題`);
    }
    if (!lines.includes('### 第二頁｜聆聽本篇原文')) {
      warnings.push(`${source.path}: 主檔尚未具有可辨識的第二頁聆聽區塊`);
    }
  } else {
    warnings.push(`${source.path}: 主檔尚未具有「## 任務開場」區塊`);
  }

  console.log(`${source.path}: ${questions.length} 題，孩子端指紋與線索出處通過`);
}

warnings.forEach((warning) => console.warn(`WARN: ${warning}`));
if (errors.length) {
  errors.forEach((error) => console.error(`ERROR: ${error}`));
  process.exit(1);
}
console.log('古文主檔唯一格式檢查通過。');
