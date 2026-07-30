import fs from 'node:fs';
import path from 'node:path';
import { parseDraftQuestions, parseDraftSourcesFromProjectStatus } from '../src/lib/guwenDraftPreview';
import { childSnapshot, childSnapshotPayload } from './guwen-master-child-snapshot';

const DRAFT_SOURCES = parseDraftSourcesFromProjectStatus(
  fs.readFileSync('GUWEN-PROJECT-STATUS.md', 'utf8'),
);

const headingAliases = new Map<string, string>([
  ['本篇原文', '本篇完整原文（成人審稿用）'],
  ['本輪審稿原文', '本篇完整原文（成人審稿用）'],
  ['本題使用的原文', '本篇完整原文（成人審稿用）'],
  ['本輪處理句子', '本輪處理的句子'],
  ['本題處理的目標句', '本輪處理的句子'],
  ['待破解的目標句', '本輪處理的句子'],
  ['待重建的目標句', '本輪處理的句子'],
  ['本題學習目標', '學習目標（成人編輯）'],
  ['學習目標', '學習目標（成人編輯）'],
  ['App 引導語', '孩子端｜麻煩古文破譯家幫忙'],
  ['比較任務', '請古文破譯家提交解法'],
  ['推理提問', '請古文破譯家提交解法'],
  ['推理問題', '請古文破譯家提交解法'],
  ['破譯問題', '請古文破譯家提交解法'],
  ['重建問題', '請古文破譯家提交解法'],
  ['提交假說', '請古文破譯家提交解法'],
  ['提交重建結果', '請古文破譯家提交解法'],
  ['提交排序結果', '請古文破譯家提交解法'],
  ['提交證據檢查', '請古文破譯家提交解法'],
  ['麻煩古文破譯家幫忙', '請古文破譯家提交解法'],
  ['題目', '請古文破譯家提交解法'],
  ['正解', '正確答案'],
  ['答錯提示', '第一次答錯提示'],
  ['放回本篇', '放回原文'],
  ['放回本篇原文', '放回原文'],
  ['故事畫面更新', '故事畫面更新（作答後）'],
  ['密碼鑰匙收入工具箱', '本題取得的密碼鑰匙（作答後才顯示）'],
  ['取得密碼鑰匙', '本題取得的密碼鑰匙（作答後才顯示）'],
  ['本題要取得的密碼鑰匙（作答後才顯示）', '本題取得的密碼鑰匙（作答後才顯示）'],
  ['答對回饋（自動播放語音）', '答對回饋'],
  ['答對回饋（自動播放）', '答對回饋'],
]);

// 第三篇舊稿區原本把兩條來源放在題目區塊外；以下逐字搬自同檔的「第 N 題線索來源」。
const detachedSourceByClue = new Map<string, string>([
  ['上忽發火。子猷【遽】走避', '真實古文線索；《世說新語・雅量》：<https://ctext.org/text.pl?if=gb&node=91139&show=parallel>'],
  ['崔驚懼【遽】走', '真實古文線索；段成式《酉陽雜俎續集・支諾皋上》：<https://zh.wikisource.org/zh-hant/酉陽雜俎/續集/卷一>'],
  ['越人【契】臂', '混種古文線索（真實語料骨架＋AI 情境）；真實骨架出自《淮南子・齊俗訓》：<https://ctext.org/huainanzi/qi-su-xun/zh>'],
  ['古人【契】龜甲', '混種古文線索（真實語料骨架＋AI 情境）；真實骨架出自《詩經・大雅・緜》：<https://ctext.org/book-of-poetry/mian/zh>'],
  ['【是】鳥也', '《莊子・逍遙遊》：<https://ctext.org/zhuangzi/enjoyment-in-untroubled-ease/zh>'],
  ['【是】日也', '王羲之〈蘭亭集序〉：<https://ctext.org/wiki.pl?chapter=795512&if=gb>'],
  ['【吾】十有五而志于學', '《論語・為政》：<https://ctext.org/analects/wei-zheng/zh>'],
  ['【吾】楯之堅', '《韓非子・難一》：<https://ctext.org/hanfeizi/nan-yi>'],
  ['見漁人，乃大驚，問【所從來】', '陶淵明〈桃花源記〉：<https://ctext.org/wiki.pl?chapter=945919&if=gb>'],
  ['客至，主人問【所從來】', 'AI 仿古推理線索（非古籍原文）。'],
]);

const openingPageAliases = new Map<string, string>([
  ['App 畫面 1｜向破譯家求助', '第一頁｜請古文破譯家接受委託'],
  ['第一頁｜AI 前來求助', '第一頁｜請古文破譯家接受委託'],
  ['古文破譯家，新任務來了！', '第一頁｜請古文破譯家接受委託'],
  ['App 畫面 2｜播放未改寫的古文全文', '第二頁｜聆聽本篇原文'],
  ['第二頁｜播放未改寫全文', '第二頁｜聆聽本篇原文'],
  ['播放本篇原文', '第二頁｜聆聽本篇原文'],
  ['播放古文全文', '第二頁｜聆聽本篇原文'],
  ['開場播放原文', '第二頁｜聆聽本篇原文'],
]);

const canonicalHeadingLevels = new Map<string, number>([
  ['本篇完整原文（成人審稿用）', 2],
  ['本輪處理的句子', 2],
  ['學習目標（成人編輯）', 2],
  ['本題取得的密碼鑰匙（作答後才顯示）', 2],
  ['孩子端｜麻煩古文破譯家幫忙', 2],
  ['請古文破譯家提交解法', 2],
  ['選項', 2],
  ['正確答案', 2],
  ['答對回饋', 2],
  ['第一次答錯提示', 2],
  ['詳解', 2],
  ['放回原文', 2],
  ['故事畫面更新（作答後）', 2],
  ['成人編輯備註（不進入孩子端、不朗讀）', 2],
  ['已破解為', 4],
  ['出處（成人資料）', 4],
]);

function normalizeLessonFrame(lines: string[], title: string): void {
  const firstTitle = lines.findIndex((line) => /^#\s+古文破譯家｜/.test(line));
  if (firstTitle >= 0) lines[firstTitle] = `# 古文破譯家｜《${title}》教材主檔`;

  for (let index = 0; index < lines.length; index += 1) {
    const heading = lines[index].match(/^#{1,3}\s+(.+?)\s*$/)?.[1];
    if (!heading) continue;
    if (/^(?:[一二三四五六七八九十]+、)?(?:App )?任務開場(?:白)?(?:（[^）]+）)?$/.test(heading)) {
      lines[index] = '## 任務開場';
      continue;
    }
    const page = openingPageAliases.get(heading);
    if (page) lines[index] = `### ${page}`;
  }

  const opening = lines.findIndex((line) => line === '## 任務開場');
  if (opening < 0) return;
  let end = lines.length;
  for (let index = opening + 1; index < lines.length; index += 1) {
    if (/^#{1,2}\s+/.test(lines[index])) {
      end = index;
      break;
    }
  }
  const hasFirstPage = lines
    .slice(opening + 1, end)
    .some((line) => line === '### 第一頁｜請古文破譯家接受委託');
  if (!hasFirstPage) lines.splice(opening + 1, 0, '', '### 第一頁｜請古文破譯家接受委託');
}

function normalizeQuestionHeader(line: string, number: number): string {
  const match = line.match(/^(#{1,2})\s+第\s*[一二三四五六七八九十百\d]+\s*題(.*)$/);
  return match ? `# 第 ${number} 題${match[2]}` : line;
}

const chineseNumber = new Map([
  ['一', 1], ['二', 2], ['兩', 2], ['三', 3], ['四', 4], ['五', 5],
  ['六', 6], ['七', 7], ['八', 8], ['九', 9],
]);

function questionNumber(line: string): number {
  const raw = line.match(/^#{1,2}\s+第\s*([一二兩三四五六七八九十百\d]+)\s*題/)?.[1];
  if (!raw) throw new Error(`無法讀取題號：${line}`);
  if (/^\d+$/.test(raw)) return Number(raw);
  if (raw === '十') return 10;
  const ten = raw.indexOf('十');
  if (ten >= 0) {
    const tens = ten === 0 ? 1 : (chineseNumber.get(raw[ten - 1]) ?? 0);
    const ones = ten === raw.length - 1 ? 0 : (chineseNumber.get(raw[ten + 1]) ?? 0);
    return tens * 10 + ones;
  }
  return chineseNumber.get(raw) ?? 0;
}

function normalizeHeading(line: string): string {
  const match = line.match(/^(#{2,5})\s+(.+?)\s*$/);
  if (!match) return line;
  const replacement = headingAliases.get(match[2]);
  if (replacement) {
    const level = canonicalHeadingLevels.get(replacement) ?? 2;
    return `${'#'.repeat(level)} ${replacement}`;
  }
  const canonicalLevel = canonicalHeadingLevels.get(match[2]);
  if (canonicalLevel) return `${'#'.repeat(canonicalLevel)} ${match[2]}`;
  if (match[2] === '線索類型與來源') return '### 來源搬移紀錄（成人資料）';
  if (/^(?:真實古文|混種古文|仿古|古文聲音|古文)?線索[一二]$/.test(match[2])) {
    return `### ${match[2].replace(/^(?:真實古文|混種古文|仿古|古文聲音|古文)/, '')}`;
  }
  if (match[2] === '已破解為') return '#### 已破解為';
  if (/^(?:線索類型(?:與出處)?|出處)(?:（成人資料）)?$/.test(match[2])) {
    return '#### 出處（成人資料）';
  }
  return line;
}

function findFullText(markdown: string): string | undefined {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const headingIndex = ['本課採用原文', '固定原文', '本篇完整古文']
    .map((heading) => lines.findIndex((line) => new RegExp(`^#{1,4}\\s+${heading}\\s*$`).test(line)))
    .find((index) => index >= 0) ?? -1;
  if (headingIndex < 0) return undefined;
  const section: string[] = [];
  for (let index = headingIndex + 1; index < lines.length; index += 1) {
    if (/^#{1,4}\s+/.test(lines[index])) break;
    section.push(lines[index]);
  }
  const quotes = section
    .filter((line) => /^>\s*\S/.test(line))
    .map((line) => line.replace(/^>\s*/, '').trim());
  if (quotes.length) return quotes.join('\n');
  const fenced = section.join('\n').match(/```(?:text)?\s*\n([\s\S]*?)\n```/);
  return fenced?.[1].trim();
}

function placeSourcesBesideClues(markdown: string, sourcePath: string): string {
  const questions = parseDraftQuestions(markdown);
  const lines = markdown.split('\n');
  for (let questionIndex = questions.length - 1; questionIndex >= 0; questionIndex -= 1) {
    const question = questions[questionIndex];
    const start = question.line - 1;
    const end = questions[questionIndex + 1]?.line
      ? questions[questionIndex + 1].line - 1
      : lines.length;
    const clueIndexes: number[] = [];
    for (let index = start + 1; index < end; index += 1) {
      if (/^### 線索[一二三四五六七八九十\d]+\s*$/.test(lines[index])) clueIndexes.push(index);
    }
    for (let clueIndex = clueIndexes.length - 1; clueIndex >= 0; clueIndex -= 1) {
      const clueStart = clueIndexes[clueIndex];
      let clueEnd = end;
      for (let index = clueStart + 1; index < end; index += 1) {
        if (/^#{1,2}\s+/.test(lines[index]) || /^### 線索[一二三四五六七八九十\d]+\s*$/.test(lines[index])) {
          clueEnd = index;
          break;
        }
      }
      const hasDirectSource = lines
        .slice(clueStart + 1, clueEnd)
        .some((line) => /^#### 出處（成人資料）\s*$/.test(line));
      if (hasDirectSource) continue;
      const clue = question.clues[clueIndex];
      const detached = [...detachedSourceByClue.entries()]
        .find(([prefix]) => clue?.text.startsWith(prefix))?.[1];
      const sourceText = clue?.source?.text ?? detached;
      if (!sourceText) {
        console.warn(`${sourcePath} 第 ${question.number} 題線索 ${clueIndex + 1}：沒有既有來源可搬移`);
        continue;
      }
      const quoted = sourceText.split('\n').map((line) => `> ${line}`);
      lines.splice(clueEnd, 0, '', '#### 出處（成人資料）', '', ...quoted);
    }
  }
  return lines.join('\n');
}

function migrateOne(markdown: string, sourcePath: string): string {
  const before = childSnapshot(markdown);
  const fullText = findFullText(markdown);
  const cleaned = markdown.replace(
    /(^# 第 \d+ 題線索來源\s*\n)\n## 本篇完整原文（成人審稿用）\n\n> [^\n]+\n/gm,
    '$1',
  );
  const lines = cleaned.replace(/\r\n/g, '\n').split('\n');
  const source = DRAFT_SOURCES.find((candidate) => candidate.path === sourcePath);
  normalizeLessonFrame(lines, source?.title.split('｜').at(-1) ?? sourcePath);
  const headers = lines
    .map((line, index) => (
      /^#{1,2}\s+第\s*[一二三四五六七八九十百\d]+\s*題（/.test(line) ? index : -1
    ))
    .filter((index) => index >= 0);

  for (let questionIndex = headers.length - 1; questionIndex >= 0; questionIndex -= 1) {
    const start = headers[questionIndex];
    const end = headers[questionIndex + 1] ?? lines.length;
    lines[start] = normalizeQuestionHeader(lines[start], questionNumber(lines[start]));
    for (let index = start + 1; index < end; index += 1) lines[index] = normalizeHeading(lines[index]);

    const hasFullText = lines
      .slice(start + 1, end)
      .some((line) => /^## 本篇完整原文（成人審稿用）\s*$/.test(line));
    if (!hasFullText) {
      if (!fullText) throw new Error(`${sourcePath}: 找不到可重貼的本篇完整原文`);
      lines.splice(start + 1, 0, '', '## 本篇完整原文（成人審稿用）', '', `> ${fullText.replace(/\n/g, '\n> ')}`);
    }
  }

  let migrated = lines.join('\n')
    .replace(/<a id="q([1-9])"><\/a>/g, '<a id="q0$1"></a>')
    .replace(/\(#q([1-9])\)/g, '(#q0$1)');
  migrated = placeSourcesBesideClues(migrated, sourcePath);
  if (markdown.endsWith('\n') && !migrated.endsWith('\n')) migrated += '\n';

  const after = childSnapshot(migrated);
  if (before.questionCount !== after.questionCount || before.hash !== after.hash) {
    const nonHeadingCopy = (text: string) => text
      .replace(/\r\n/g, '\n')
      .split('\n')
      .filter((line) => !/^#{1,5}\s+/.test(line))
      .join('\n');
    if (before.questionCount === after.questionCount && nonHeadingCopy(markdown) === nonHeadingCopy(migrated)) {
      console.warn(`${sourcePath}: 只有欄位映射改變，所有非標題文字逐行相同`);
      return migrated;
    }
    const beforePayload = childSnapshotPayload(markdown);
    const afterPayload = childSnapshotPayload(migrated);
    const changed = beforePayload
      .map((question, index) => JSON.stringify(question) === JSON.stringify(afterPayload[index]) ? undefined : question.number)
      .filter(Boolean);
    const firstChangedIndex = beforePayload.findIndex(
      (question, index) => JSON.stringify(question) !== JSON.stringify(afterPayload[index]),
    );
    const detail = firstChangedIndex >= 0
      ? `\n遷移前題目 ${JSON.stringify(beforePayload[firstChangedIndex])}\n遷移後題目 ${JSON.stringify(afterPayload[firstChangedIndex])}`
      : '';
    throw new Error(
      `${sourcePath}: 孩子端指紋改變，拒絕寫入（題目：${changed.join('、')}）\n`
      + `遷移前 ${JSON.stringify(before)}\n遷移後 ${JSON.stringify(after)}${detail}`,
    );
  }
  return migrated;
}

for (const source of DRAFT_SOURCES) {
  const absolute = path.resolve(source.path);
  const before = fs.readFileSync(absolute, 'utf8');
  const after = migrateOne(before, source.path);
  fs.writeFileSync(absolute, after, 'utf8');
  console.log(`${source.path}: 格式已遷移，孩子端指紋不變`);
}
