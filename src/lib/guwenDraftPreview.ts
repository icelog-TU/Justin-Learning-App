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
  source?: DraftField;
};

export type DraftDecodingKey = {
  code: DraftField;
  decodedEvidence: DraftField;
};

export type DraftQuestionKind =
  | 'evidence'
  | 'reconstruction'
  | 'choice'
  | 'reveal'
  | 'sequence'
  | 'causal'
  | 'multiselect';

export type DraftSequenceCard = DraftField & {
  id: string;
};

export type DraftMultiSelectOption = DraftField & {
  correct: boolean;
};

export type DraftQuestion = {
  number: number;
  title: string;
  status: string;
  line: number;
  kind: DraftQuestionKind;
  target?: DraftField;
  intro?: DraftField;
  preAnswerKeys: DraftDecodingKey[];
  clues: DraftClue[];
  question?: DraftField;
  options: DraftField[];
  sequenceCards: DraftSequenceCard[];
  sequenceCorrectOrder: string[];
  multiSelectOptions: DraftMultiSelectOption[];
  causalNodes: DraftField[];
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

export type DraftSourceResolution = {
  index?: number;
  error?: string;
};

export function resolveDraftSource(
  lessonPath: string | null,
  legacyLessonId: string | null,
): DraftSourceResolution {
  if (lessonPath !== null) {
    const index = DRAFT_SOURCES.findIndex((source) => source.path === lessonPath);
    return index >= 0
      ? { index }
      : { error: `找不到指定教材主檔：${lessonPath}` };
  }
  if (legacyLessonId !== null) {
    const index = DRAFT_SOURCES.findIndex((source) => source.lessonId === legacyLessonId);
    return index >= 0
      ? { index }
      : { error: `找不到指定教材代碼：${legacyLessonId}` };
  }
  return { index: 0 };
}

export function draftQuestionIndexByNumber(
  questions: DraftQuestion[],
  questionNumber: number,
): number {
  const found = questions.findIndex((question) => question.number === questionNumber);
  return found >= 0 ? found : 0;
}

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
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/ {2,}$/gm, '')
    .trim();
}

function sectionParts(
  section?: Section,
  options: { preserveMixedParagraphs?: boolean } = {},
): { text: string; pronunciationCues: string[] } {
  if (!section) return { text: '', pronunciationCues: [] };
  const quoted = section.lines
    .filter((line) => /^\s*>/.test(line))
    .map((line) => line.replace(/^\s*>\s?/, ''));
  const allContent = section.lines
    .filter((line) => {
        const trimmed = line.trim();
        return !/^\|/.test(trimmed)
          && !/^\[↑/.test(trimmed)
          && !/^---+$/.test(trimmed)
          && !/^<a\b[^>]*><\/a>$/.test(trimmed);
      })
    .map((line) => line.replace(/^\s*>\s?/, ''));
  const source = options.preserveMixedParagraphs
    ? allContent
    : quoted.length
      ? quoted
      : allContent.filter((line) => line.trim());
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

function field(
  section?: Section,
  options: { preserveMixedParagraphs?: boolean } = {},
): DraftField | undefined {
  const { text, pronunciationCues } = sectionParts(section, options);
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

function isClueSection(section: Section): boolean {
  return /(?:古文|真實古文)?線索[一二三四五六七八九十\d]/.test(section.heading)
    && !/來源|出處|核對|類型/.test(section.heading);
}

function sourceFieldFromLines(
  heading: string,
  lines: Array<{ text: string; line: number }>,
): DraftField | undefined {
  const useful = lines
    .map(({ text, line }) => ({
      text: text
        .replace(/^\s*[-*]\s+/, '')
        .trim(),
      line,
    }))
    .filter(({ text }) => text && !/^(?:教材處理|本題保留)/.test(text));
  if (!useful.length) return undefined;
  return {
    heading,
    line: useful[0].line,
    text: cleanInline(useful.map(({ text }) => text).join('\n')),
  };
}

function consolidatedClueSources(sections: Section[]): Map<number, DraftField> {
  const result = new Map<number, DraftField>();
  const sourceSections = sections.filter((section) =>
    /線索類型與來源|成人編輯備註/.test(section.heading),
  );
  for (const section of sourceSections) {
    let currentNumber: number | undefined;
    let currentLines: Array<{ text: string; line: number }> = [];
    const save = () => {
      if (!currentNumber || result.has(currentNumber)) return;
      const parsed = sourceFieldFromLines('線索類型與來源', currentLines);
      if (parsed) result.set(currentNumber, parsed);
    };
    section.lines.forEach((line, index) => {
      const start = line.match(/^\s*-\s*線索([一二三四五六七八九十\d]+)(?:為|是|：|:)\s*(.*)$/);
      if (start) {
        save();
        currentNumber = parseQuestionNumber(start[1]);
        currentLines = [{ text: start[2], line: section.line + index + 1 }];
      } else if (currentNumber !== undefined) {
        if (/^\s*-\s+\S/.test(line) && !/^\s{2,}-\s+/.test(line)) {
          save();
          currentNumber = undefined;
          currentLines = [];
        } else {
          currentLines.push({ text: line, line: section.line + index + 1 });
        }
      }
    });
    save();
  }
  return result;
}

function optionFields(sections: Section[]): DraftField[] {
  const explicitOptions = sections.find((section) => /^選項$/.test(section.heading));
  const interactiveOptions = sections.find((section) => /^(畫面初始顯示順序|待判斷.*敘述)/.test(section.heading));
  const submitOptions = sections.find((section) =>
    /^(請古文破譯家提交解法|提交假說|提交重建結果|提交排序結果|提交證據檢查)/.test(section.heading),
  );
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

function sequenceCardFields(sections: Section[]): DraftSequenceCard[] {
  const section = firstSection(sections, [/^事件卡$/, /事件.*卡片/]);
  if (!section) return [];
  const cards: DraftSequenceCard[] = [];
  section.lines.forEach((line, index) => {
    const match = line.trim().match(/^[-*]\s*卡片\s*([A-Za-zＡ-Ｚａ-ｚ])\s*[：:]\s*(.+)$/);
    if (!match) return;
    cards.push({
      id: match[1].normalize('NFKC').toUpperCase(),
      text: cleanInline(match[2]),
      heading: section.heading,
      line: section.line + index + 1,
    });
  });
  return cards;
}

function multiSelectOptionFields(sections: Section[]): DraftMultiSelectOption[] {
  const section = firstSection(sections, [/^勾選項目$/, /待判斷.*敘述/]);
  if (!section) return [];
  const supported = field(firstSection(sections, [/^應勾選$/]))?.text ?? '';
  const supportedNumbers = new Set(
    [...supported.matchAll(/(?:^|\n)\s*[-*]?\s*([1-9]\d*)[.、]/g)].map((match) => Number(match[1])),
  );
  const options: DraftMultiSelectOption[] = [];
  section.lines.forEach((line, index) => {
    const match = line.trim().match(/^([1-9]\d*)[.、]\s*(.+)$/);
    if (!match) return;
    const number = Number(match[1]);
    options.push({
      text: cleanInline(match[2]),
      heading: section.heading,
      line: section.line + index + 1,
      correct: supportedNumbers.has(number),
    });
  });
  return options;
}

function sequenceOrder(correctAnswer?: DraftField): string[] {
  if (!correctAnswer) return [];
  return [...correctAnswer.text.matchAll(/[A-Za-zＡ-Ｚａ-ｚ]/g)]
    .map((match) => match[0].normalize('NFKC').toUpperCase());
}

function causalNodeFields(sections: Section[]): DraftField[] {
  const section = firstSection(sections, [/^因果鏈$/, /因果.*階段/, /^推理鏈$/]);
  if (!section) return [];
  const nodes: DraftField[] = [];
  section.lines.forEach((line, index) => {
    const match = line.trim().match(/^(?:[-*]\s*|[1-9]\d*[.、]\s*)(.+)$/);
    if (!match) return;
    nodes.push({
      text: cleanInline(match[1]),
      heading: section.heading,
      line: section.line + index + 1,
    });
  });
  return nodes;
}

function decodingKeyFields(section?: Section): DraftDecodingKey[] {
  if (!section) return [];
  const keys: DraftDecodingKey[] = [];
  section.lines.forEach((line, index) => {
    const cells = line
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((cell) => cleanInline(cell.trim()));
    if (cells.length < 2) return;
    const [code, decodedEvidence] = cells;
    if (!code || !decodedEvidence) return;
    if (/^(?:密碼|原文密碼|原文|字詞)$/.test(code) && /^(?:已取得的)?(?:線索|意思|解法)$/.test(decodedEvidence)) return;
    if (/^:?-{3,}:?$/.test(code) && /^:?-{3,}:?$/.test(decodedEvidence)) return;
    const lineNumber = section.line + index + 1;
    keys.push({
      code: { text: code, heading: section.heading, line: lineNumber },
      decodedEvidence: { text: decodedEvidence, heading: section.heading, line: lineNumber },
    });
  });
  return keys;
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
    /^本輪處理的句子$/,
    /本輪處理.*(?:句子|範圍)/,
    /本題處理.*(?:目標句|範圍)/,
    /待破解.*目標句/,
    /待重建.*目標句/,
    /放回.*原文/,
  ]));
  const introSection = firstSection(sections, [
    /^孩子端｜麻煩古文破譯家幫忙$/,
    /App 引導語/,
    /孩子端.*幫忙/,
    /麻煩古文破譯家/,
    /古文破譯家.*任務/,
  ]);
  const intro = field(introSection);
  const preAnswerKeys = decodingKeyFields(firstSection(sections, [
    /^作答前可見的(?:密碼|舊)?鑰匙$/,
    /^已取得的密碼鑰匙$/,
  ]));
  let question = field(firstSection(sections, [
    /^請古文破譯家提交解法$/,
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
  const correctAnswer = field(firstSection(sections, [/^正確答案$/, /^正解$/, /^正確順序$/]));
  const correctMatch = correctAnswer?.text.match(/^\s*([1-9]\d*)[.、]/);
  const correctIndex = correctMatch ? Number(correctMatch[1]) - 1 : undefined;
  const clues: DraftClue[] = [];
  const fallbackSources = consolidatedClueSources(sections);
  sections.forEach((section, index) => {
    if (!isClueSection(section)) return;
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
    const nextClueIndex = sections.findIndex((candidate, candidateIndex) =>
      candidateIndex > index && isClueSection(candidate),
    );
    const nearbySections = sections.slice(index + 1, nextClueIndex >= 0 ? nextClueIndex : sections.length);
    const directSource = field(nearbySections.find((candidate) =>
      /^(?:出處|來源|線索類型)|線索類型與出處/.test(candidate.heading),
    ));
    const clueNumber = clues.length + 1;
    clues.push({
      ...clue,
      meaning: field(meaningSection),
      source: directSource ?? fallbackSources.get(clueNumber),
    });
  });
  const options = optionFields(sections);
  const sequenceCards = sequenceCardFields(sections);
  const sequenceCorrectOrder = sequenceOrder(correctAnswer);
  const multiSelectOptions = multiSelectOptionFields(sections);
  const causalNodes = causalNodeFields(sections);
  const title = cleanInline(header[4] ?? `第 ${parseQuestionNumber(header[2])} 題`);
  const kind: DraftQuestionKind = sequenceCards.length
    ? 'sequence'
    : multiSelectOptions.length
      ? 'multiselect'
      : causalNodes.length
        ? 'causal'
        : clues.length
          ? 'evidence'
          : preAnswerKeys.length
            ? 'reconstruction'
            : options.length < 2
              ? 'reveal'
              : 'choice';
  const diagnostics: string[] = [];
  if (!target && kind !== 'sequence' && kind !== 'multiselect') diagnostics.push('找不到「本輪處理的句子」');
  if (!intro) diagnostics.push('找不到「孩子端｜麻煩古文破譯家幫忙」');
  if (!question && !['sequence', 'multiselect'].includes(kind)) diagnostics.push('找不到「請古文破譯家提交解法」');
  if (!['sequence', 'multiselect', 'reveal'].includes(kind) && options.length < 2) {
    diagnostics.push(`只抓到 ${options.length} 個選項`);
  }
  if (kind === 'sequence' && sequenceCards.length < 2) diagnostics.push(`只抓到 ${sequenceCards.length} 張事件卡`);
  if (kind === 'sequence' && sequenceCorrectOrder.length !== sequenceCards.length) {
    diagnostics.push('事件卡正確順序不完整');
  }
  if (kind === 'multiselect' && multiSelectOptions.length < 2) {
    diagnostics.push(`只抓到 ${multiSelectOptions.length} 個勾選項目`);
  }
  if (kind === 'multiselect' && !multiSelectOptions.some((option) => option.correct)) {
    diagnostics.push('找不到應勾選項目');
  }
  if (!correctAnswer && kind !== 'multiselect') diagnostics.push('找不到「正確答案」');
  const correctFeedbackSection = firstSection(sections, [/^答對回饋/]);
  const explanationSection = firstSection(sections, [/^詳解/]);
  const canonicalChildKeySection = firstSection(sections, [/^本題取得的密碼鑰匙（作答後才顯示）$/]);
  const legacyEditorialKeySection = firstSection(sections, [
    /本題要取得的密碼鑰匙/,
    /^取得密碼鑰匙/,
    /密碼鑰匙收入工具箱/,
  ]);
  const legacyChildKeySection = legacyEditorialKeySection?.lines.some((line) => /^\s*>/.test(line))
    ? legacyEditorialKeySection
    : undefined;
  const childKeySection = canonicalChildKeySection ?? legacyChildKeySection;
  if (!correctFeedbackSection) diagnostics.push('找不到「答對回饋」');
  if (legacyEditorialKeySection && !legacyChildKeySection && !canonicalChildKeySection) {
    diagnostics.push(`「${legacyEditorialKeySection.heading}」不是孩子端作答後密碼鑰匙，不會顯示`);
  }
  clues.forEach((clue, index) => {
    if (!clue.source) diagnostics.push(`線索 ${index + 1} 找不到出處`);
  });

  return {
    number: parseQuestionNumber(header[2]),
    status: cleanInline(header[3] ?? ''),
    title,
    line: start + 1,
    kind,
    target,
    intro,
    preAnswerKeys,
    clues,
    question,
    options,
    sequenceCards,
    sequenceCorrectOrder,
    multiSelectOptions,
    causalNodes,
    correctIndex,
    correctAnswer,
    correctFeedback: field(correctFeedbackSection),
    retryHint: field(firstSection(sections, [/^第一次答錯提示/, /^答錯提示/])),
    explanation: field(explanationSection, { preserveMixedParagraphs: true }),
    key: field(childKeySection),
    diagnostics,
  };
}

export function parseDraftQuestions(markdown: string): DraftQuestion[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const declaredTotalMatch = markdown.match(/新版預計總數[：:]\s*([一二三四五六七八九十百兩〇零\d]+)\s*題/);
  const declaredTotal = declaredTotalMatch ? parseQuestionNumber(declaredTotalMatch[1]) : undefined;
  const headers: Array<{ index: number; match: RegExpMatchArray }> = [];
  lines.forEach((line, index) => {
    const match = line.match(/^(#{1,2})\s+第\s*([一二三四五六七八九十百兩〇零\d]+)\s*題(?:（([^）]+)）)?(?:\s*[｜|]\s*(.+))?\s*$/);
    if (match) headers.push({ index, match });
  });
  const parsed = headers.map(({ index, match }, headerIndex) => {
    const end = headers[headerIndex + 1]?.index ?? lines.length;
    return parseOneQuestion(match, lines.slice(index + 1, end), index);
  });
  // Rewrites can coexist temporarily in one active master. Keep the explicit simplified revision when
  // present; otherwise the later occurrence is current. Returning both made questionNumber links open an
  // arbitrary archived copy and made the adult preview's question count misleading.
  const latestByNumber = new Map<number, DraftQuestion>();
  parsed.forEach((question) => {
    if (declaredTotal === undefined || question.number <= declaredTotal) {
      const current = latestByNumber.get(question.number);
      const isActiveSimplifiedRevision = /簡化修訂稿待審/.test(question.status);
      const currentIsActiveSimplifiedRevision = /簡化修訂稿待審/.test(current?.status ?? '');
      if (!currentIsActiveSimplifiedRevision || isActiveSimplifiedRevision) {
        latestByNumber.set(question.number, question);
      }
    }
  });
  return [...latestByNumber.values()].sort((a, b) => a.number - b.number);
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
