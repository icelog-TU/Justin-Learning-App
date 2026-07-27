export type DraftSource = {
  lessonId: string;
  title: string;
  path: string;
};

export type DraftField = {
  text: string;
  heading: string;
  line: number;
  pronunciationCues?: string[];
};

export type DraftClue = DraftField & {
  meaning?: DraftField;
};

export type DraftQuestion = {
  number: number;
  title: string;
  status: string;
  line: number;
  target?: DraftField;
  intro?: DraftField;
  clues: DraftClue[];
  question?: DraftField;
  options: DraftField[];
  correctIndex?: number;
  correctAnswer?: DraftField;
  correctFeedback?: DraftField;
  retryHint?: DraftField;
  explanation?: DraftField;
  key?: DraftField;
  diagnostics: string[];
};

export const DRAFT_SOURCES: DraftSource[] = [
  { lessonId: 'wang-rong-bu-qu-dao-pang-li', title: '第一篇｜王戎不取道旁李', path: 'lessons/01-guwen-wangrong-rewrite.md' },
  { lessonId: 'si-ma-guang-po-weng-jiu-you', title: '第二篇｜司馬光破甕救友', path: '02-guwen-simaguang-decoder-content.md' },
  { lessonId: 'ke-zhou-qiu-jian', title: '第三篇｜刻舟求劍', path: '03-guwen-kezhouqiujian-decoder-content.md' },
  { lessonId: 'shou-zhu-dai-tu', title: '第四篇｜守株待兔', path: '04-guwen-shouzhudaitu-decoder-content.md' },
  { lessonId: 'ya-miao-zhu-zhang', title: '第五篇｜揠苗助長', path: '05-guwen-yamiaozhuzhang-decoder-content.md' },
  { lessonId: 'yan-er-dao-zhong', title: '第六篇｜掩耳盜鐘', path: '06-guwen-yanerdaozhong-decoder-content.md' },
  { lessonId: 'zheng-ren-mai-lv', title: '第七篇｜鄭人買履', path: '07-guwen-zhengrenmailv-decoder-content.md' },
  { lessonId: 'chang-gan-ru-cheng', title: '第八篇｜長竿入城', path: '08-guwen-changganrucheng-decoder-content.md' },
  { lessonId: 'yang-shi-zhi-zi', title: '第九篇｜楊氏之子', path: '09-guwen-yangshizi-decoder-content.md' },
];

type Section = {
  heading: string;
  level: number;
  line: number;
  lines: string[];
};

const chineseDigits: Record<string, number> = {
  零: 0, 〇: 0, 一: 1, 二: 2, 兩: 2, 三: 3, 四: 4,
  五: 5, 六: 6, 七: 7, 八: 8, 九: 9,
};

function parseQuestionNumber(raw: string): number {
  if (/^\d+$/.test(raw)) return Number(raw);
  if (raw === '十') return 10;
  const ten = raw.indexOf('十');
  if (ten >= 0) {
    const tens = ten === 0 ? 1 : (chineseDigits[raw[ten - 1]] ?? 0);
    const ones = ten === raw.length - 1 ? 0 : (chineseDigits[raw[ten + 1]] ?? 0);
    return tens * 10 + ones;
  }
  return chineseDigits[raw] ?? 0;
}

function cleanInline(text: string): string {
  return text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/ {2,}$/gm, '')
    .trim();
}

function sectionParts(section?: Section): { text: string; pronunciationCues: string[] } {
  if (!section) return { text: '', pronunciationCues: [] };
  const quoted = section.lines
    .filter((line) => /^\s*>/.test(line))
    .map((line) => line.replace(/^\s*>\s?/, ''));
  const source = quoted.length
    ? quoted
    : section.lines.filter((line) => {
        const trimmed = line.trim();
        return trimmed && !/^\|/.test(trimmed) && !/^\[↑/.test(trimmed);
      });
  const pronunciationCues = source
    .map(cleanInline)
    .filter((line) => /(?:念作|唸作|發音同).*[（(][ㄅ-ㄩ]/.test(line));
  const text = cleanInline(
    source
      .filter((line) => !pronunciationCues.includes(cleanInline(line)))
      .join('\n')
      .replace(/\n{3,}/g, '\n\n'),
  );
  return { text, pronunciationCues };
}

function field(section?: Section): DraftField | undefined {
  const { text, pronunciationCues } = sectionParts(section);
  return section && text
    ? {
        text,
        heading: section.heading,
        line: section.line,
        pronunciationCues: pronunciationCues.length ? pronunciationCues : undefined,
      }
    : undefined;
}

function matches(section: Section, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(section.heading));
}

function firstSection(sections: Section[], patterns: RegExp[]): Section | undefined {
  return sections.find((section) => matches(section, patterns));
}

function optionFields(sections: Section[]): DraftField[] {
  const explicitOptions = sections.find((section) => /^選項$/.test(section.heading));
  const interactiveOptions = sections.find((section) => /^(畫面初始顯示順序|待判斷.*敘述)/.test(section.heading));
  const submitOptions = sections.find((section) => /^(提交假說|提交重建結果|提交排序結果|提交證據檢查)/.test(section.heading));
  const candidates = [explicitOptions ?? interactiveOptions ?? submitOptions].filter((section): section is Section => Boolean(section));
  const options: DraftField[] = [];
  for (const section of candidates) {
    section.lines.forEach((line, index) => {
      const match = line.trim().match(/^(?:[-*]\s*(?:\[[ xX]\]\s*)?)?(?:([1-9]\d*)[.、]|[A-CＡ-Ｃ][.、])\s*(.+)$/);
      if (match) {
        options.push({
          text: cleanInline(match[2]),
          heading: section.heading || '選項',
          line: section.line + index + 1,
        });
      }
    });
  }
  return options.slice(0, 6);
}

function parseSections(lines: string[], offset: number): Section[] {
  const sections: Section[] = [];
  let current: Section = { heading: '題目開頭', level: 7, line: offset + 1, lines: [] };
  sections.push(current);
  lines.forEach((line, index) => {
    const heading = line.match(/^(#{2,5})\s+(.+?)\s*$/);
    if (heading) {
      current = {
        heading: cleanInline(heading[2]),
        level: heading[1].length,
        line: offset + index + 1,
        lines: [],
      };
      sections.push(current);
    } else {
      current.lines.push(line);
    }
  });
  return sections;
}

function parseOneQuestion(header: RegExpMatchArray, lines: string[], start: number): DraftQuestion {
  const sections = parseSections(lines, start + 1);
  const target = field(firstSection(sections, [
    /本輪處理.*(?:句子|範圍)/,
    /本題處理.*(?:目標句|範圍)/,
    /待破解.*目標句/,
    /待重建.*目標句/,
    /放回.*原文/,
  ]));
  const introSection = firstSection(sections, [/App 引導語/, /孩子端.*幫忙/, /麻煩古文破譯家/, /古文破譯家.*任務/]);
  const intro = field(introSection);
  let question = field(firstSection(sections, [
    /^題目$/,
    /^比較任務/,
    /^推理提問/,
    /^推理問題/,
    /^破譯問題/,
    /^重建問題/,
    /^提交假說/,
    /^提交重建結果/,
    /^提交排序結果/,
    /^提交證據檢查/,
    /^問題/,
    /判斷人物分組/,
  ]));
  const interactiveSection = firstSection(sections, [/畫面初始顯示順序/, /待判斷.*敘述/]);
  if (!question && interactiveSection) question = intro;
  const correctAnswer = field(firstSection(sections, [/^正解$/, /^正確答案$/, /^正確順序$/]));
  const correctMatch = correctAnswer?.text.match(/^\s*([1-9]\d*)[.、]/);
  const correctIndex = correctMatch ? Number(correctMatch[1]) - 1 : undefined;
  const clues: DraftClue[] = [];
  sections.forEach((section, index) => {
    if (!/(?:古文|真實古文)?線索[一二三四五六七八九十\d]/.test(section.heading)) return;
    if (/來源|核對|類型/.test(section.heading)) return;
    const inlineMeaningIndex = section.lines.findIndex((line) => /已破解為/.test(line));
    const clueSection = inlineMeaningIndex >= 0
      ? { ...section, lines: section.lines.slice(0, inlineMeaningIndex) }
      : section;
    const clue = field(clueSection);
    if (!clue) return;
    const meaningSection = inlineMeaningIndex >= 0
      ? {
          heading: '已破解為',
          level: section.level + 1,
          line: section.line + inlineMeaningIndex + 1,
          lines: section.lines.slice(inlineMeaningIndex + 1),
        }
      : sections.slice(index + 1, index + 3).find((candidate) => /已破解為/.test(candidate.heading));
    clues.push({ ...clue, meaning: field(meaningSection) });
  });
  const options = optionFields(sections);
  const diagnostics: string[] = [];
  if (!target) diagnostics.push('找不到「本輪處理句子／待破解的目標句」');
  if (!intro) diagnostics.push('找不到「App 引導語／孩子端幫忙」');
  if (!question) diagnostics.push('找不到「比較任務／推理提問／提交假說」');
  if (options.length < 2) diagnostics.push(`只抓到 ${options.length} 個選項`);
  if (!correctAnswer) diagnostics.push('找不到「正解／正確答案」');

  return {
    number: parseQuestionNumber(header[2]),
    status: cleanInline(header[3] ?? ''),
    title: cleanInline(header[4] ?? `第 ${parseQuestionNumber(header[2])} 題`),
    line: start + 1,
    target,
    intro,
    clues,
    question,
    options,
    correctIndex,
    correctAnswer,
    correctFeedback: field(firstSection(sections, [/^答對回饋/])),
    retryHint: field(firstSection(sections, [/^第一次答錯提示/, /^答錯提示/])),
    explanation: field(firstSection(sections, [/^詳解/])),
    key: field(firstSection(sections, [/本題要取得的密碼鑰匙/, /^取得密碼鑰匙/, /密碼鑰匙收入工具箱/])),
    diagnostics,
  };
}

export function parseDraftQuestions(markdown: string): DraftQuestion[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const headers: Array<{ index: number; match: RegExpMatchArray }> = [];
  lines.forEach((line, index) => {
    const match = line.match(/^(#{1,2})\s+第\s*([一二三四五六七八九十百兩〇零\d]+)\s*題(?:（([^）]+)）)?(?:\s*[｜|]\s*(.+))?\s*$/);
    if (match) headers.push({ index, match });
  });
  return headers.map(({ index, match }, headerIndex) => {
    const end = headers[headerIndex + 1]?.index ?? lines.length;
    return parseOneQuestion(match, lines.slice(index + 1, end), index);
  });
}

export function githubRawUrl(source: DraftSource, cacheBuster = Date.now()): string {
  return `https://raw.githubusercontent.com/icelog-TU/Justin-Learning-App/claude/chinese-learning-app-justin-yjcfam/${source.path}?v=${cacheBuster}`;
}

export function githubEditUrl(source: DraftSource, line?: number): string {
  const suffix = line ? `#L${line}` : '';
  return `https://github.com/icelog-TU/Justin-Learning-App/blob/claude/chinese-learning-app-justin-yjcfam/${source.path}${suffix}`;
}

function normalized(text: string): string {
  return text.replace(/[【】「」『』（）()，。！？；：、\s*_]/g, '').toLowerCase();
}

function bigrams(text: string): Set<string> {
  const result = new Set<string>();
  for (let i = 0; i < text.length - 1; i += 1) result.add(text.slice(i, i + 2));
  return result;
}

export type RepetitionWarning = {
  first: string;
  second: string;
  reason: string;
};

export function findAdjacentRepetitions(items: Array<{ label: string; text: string }>): RepetitionWarning[] {
  const warnings: RepetitionWarning[] = [];
  for (let index = 1; index < items.length; index += 1) {
    const first = normalized(items[index - 1].text);
    const second = normalized(items[index].text);
    if (Math.min(first.length, second.length) < 6) continue;
    if (first === second || (Math.min(first.length, second.length) >= 10 && (first.includes(second) || second.includes(first)))) {
      warnings.push({ first: items[index - 1].label, second: items[index].label, reason: '內容相同或大幅包住前一句' });
      continue;
    }
    const a = bigrams(first);
    const b = bigrams(second);
    const overlap = [...a].filter((gram) => b.has(gram)).length;
    const score = (2 * overlap) / Math.max(1, a.size + b.size);
    if (score >= 0.72) {
      warnings.push({ first: items[index - 1].label, second: items[index].label, reason: `文字相似度 ${Math.round(score * 100)}%` });
    }
  }
  return warnings;
}
