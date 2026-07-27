import fs from 'node:fs';

const sourcePath = new URL('../02-guwen-simaguang-decoder-content.md', import.meta.url);
const outputPath = new URL('../src/data/simaGuangPronunciationAudit.ts', import.meta.url);
const reportPath = new URL('../lessons/02-guwen-simaguang-polyphonic-stage1.md', import.meta.url);
const lines = fs.readFileSync(sourcePath, 'utf8').split(/\r?\n/);

const playableHeadings = new Set([
  'App 引導語',
  '真實古文線索一',
  '真實古文線索二',
  '已破解為',
  '推理提問',
  '選項',
  '答對回饋',
  '第一次答錯提示',
  '畫面初始顯示順序（必須打亂）',
  '待判斷的六張敘述（畫面順序）',
]);

// 逐題候選表只作交叉核對；正式掃描使用完整播放白名單與本字集。
// 字集沿用第一篇正式掃描口徑，並加入第二篇白名單實際出現的常用多音字。
const polyphonicCharacters = new Set(
  [...'沒中宿得倒種處見大過哪還露長更難假落只為曾會看著都好重便行結覺數和當幾給說要發分轉傳提'],
);

function cleanMarkdown(text) {
  return text
    .replace(/^>\s?/, '')
    .replace(/^\d+\.\s+/, '')
    .replace(/\*\*/g, '')
    .replace(/[【】]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim();
}

function known(zhuyin, homophoneCue, usage, cueMode = 'known_usage') {
  return { zhuyin, homophoneCue, usage, cueMode };
}

function readingFor(character, text, characterIndex) {
  const before = text.slice(Math.max(0, characterIndex - 5), characterIndex);
  const after = text.slice(characterIndex + 1, characterIndex + 8);
  const around = `${before}${character}${after}`;

  switch (character) {
    case '沒':
      if (/出沒/.test(around)) return known('ㄇㄛˋ', '默', '出現或隱沒');
      if (/沒水中|沒入/.test(around)) {
        return known('ㄇㄛˋ', '默', '沉入水中或進入水面以下', 'unresolved_target');
      }
      return known('ㄇㄟˊ', '梅', '否定、沒有或不曾');
    case '中':
      return /不中|莫能中/.test(around)
        ? known('ㄓㄨㄥˋ', '種田的種', '擊中、打中')
        : known('ㄓㄨㄥ', '鐘', '在範圍或水裡');
    case '宿':
      return known('ㄙㄨˋ', '素', '住宿、過夜');
    case '得':
      if (/得請/.test(around)) return known('ㄉㄟˇ', '得要的得', '必須、需要');
      if (/得活/.test(around)) {
        return known('ㄉㄜˊ', '德', '得以存活、保住性命', 'unresolved_target');
      }
      if (/得了/.test(around)) return known('ㄉㄜˊ', '德', '得到、患上');
      if (/得到|取得|共同得到/.test(around)) return known('ㄉㄜˊ', '德', '取得、得到');
      return known('ㄉㄜ˙', '輕聲', '接在動作後表示結果、程度或感受');
    case '倒':
      return /倒進/.test(around)
        ? known('ㄉㄠˋ', '到', '把液體傾入')
        : known('ㄉㄠˇ', '島', '倒下、失去直立姿勢');
    case '種':
      return known('ㄓㄨㄥˇ', '腫', '種類');
    case '處':
      return /處理|處置/.test(around)
        ? known('ㄔㄨˇ', '楚', '處理、處置')
        : known('ㄔㄨˋ', '觸', '地方、位置');
    case '見':
      return known('ㄐㄧㄢˋ', '建', '看見、發現');
    case '大':
      return /大人/.test(around)
        ? known('ㄉㄚˋ', '大小的大', '成年人')
        : known('ㄉㄚˋ', '大小的大', '大小或程度大');
    case '過':
      if (/事情經過/.test(around)) return known('ㄍㄨㄛˋ', '過年的過', '事情發展的過程');
      if (/過夜/.test(around)) return known('ㄍㄨㄛˋ', '過年的過', '度過一段時間');
      if (/流過|走過/.test(around)) return known('ㄍㄨㄛˋ', '過年的過', '經過、通過');
      return known('ㄍㄨㄛˋ', '過年的過', '事情的經歷或已完成');
    case '哪':
      return known('ㄋㄚˇ', '哪裡的哪', '疑問代詞');
    case '還':
      return known('ㄏㄞˊ', '孩', '仍然、尚且');
    case '露':
      return known('ㄌㄨˋ', '路', '顯露在外');
    case '長':
      return /長柄/.test(around)
        ? known('ㄔㄤˊ', '常', '長度很長')
        : known('ㄓㄤˇ', '掌', '年長的人');
    case '更':
      return known('ㄍㄥˋ', '更改的更', '更加、程度增加');
    case '難':
      return known('ㄋㄢˊ', '南', '困難、不容易');
    case '假':
      return known('ㄐㄧㄚˇ', '甲', '假說、尚待驗證的說法');
    case '落':
      return known('ㄌㄨㄛˋ', '駱', '落下或落入水中');
    case '只':
      return known('ㄓˇ', '紙', '僅僅、只有');
    case '為':
      return /為了/.test(around)
        ? known('ㄨㄟˋ', '位置的位', '為了、表示目的')
        : known('ㄨㄟˋ', '位置的位', '因為、表示原因');
    case '曾':
      return /曾公亮/.test(around)
        ? known('ㄗㄥ', '增', '姓氏「曾」')
        : known('ㄘㄥˊ', '層', '曾經、過去發生過');
    case '會':
      return known('ㄏㄨㄟˋ', '惠', '會、可能或能夠');
    case '看':
      return known('ㄎㄢˋ', '看見的看', '觀看、看見');
    case '著':
      return known('ㄓㄜ˙', '輕聲', '接在動作後表示狀態持續');
    case '都':
      return known('ㄉㄡ', '兜', '全部');
    case '好':
      return known('ㄏㄠˇ', '好人的好', '良好或完成妥當');
    case '重':
      return known('ㄔㄨㄥˊ', '蟲', '重新組合或再次進行');
    case '便':
      return known('ㄅㄧㄢˋ', '變', '就、於是');
    case '行':
      return known('ㄒㄧㄥˊ', '形', '行走、行動或進行');
    case '結':
      return known('ㄐㄧㄝˊ', '結果的結', '結果、結論');
    case '覺':
      return known('ㄐㄩㄝˊ', '決', '感覺、察覺');
    case '數':
      return known('ㄕㄨˋ', '樹', '幾個、數量');
    case '和':
      return known('ㄏㄜˊ', '河', '和、跟或連接並列項目');
    case '當':
      return known('ㄉㄤ', '噹', '視為、當作');
    case '幾':
      return known('ㄐㄧˇ', '己', '多少或不定的少數');
    case '給':
      return known('ㄍㄟˇ', '給你的給', '交付、使對方得到');
    case '說':
      return /假說/.test(around)
        ? known('ㄕㄨㄛ', '說話的說', '假說、尚待驗證的說法')
        : known('ㄕㄨㄛ', '說話的說', '說明、說出');
    case '要':
      return known('ㄧㄠˋ', '藥', '需要、將要或要求');
    case '發':
      if (/發現/.test(around)) return known('ㄈㄚ', '發現的發', '發現、察覺');
      if (/發出/.test(around)) return known('ㄈㄚ', '發現的發', '發出、產生');
      return known('ㄈㄚ', '發現的發', '發生、出現');
    case '分':
      return known('ㄈㄣ', '分開的分', '分開、區別或分組');
    case '轉':
      return known('ㄓㄨㄢˇ', '轉身的轉', '改變方向或轉換敘述焦點');
    case '傳':
      return known('ㄔㄨㄢˊ', '船', '傳遞、傳出');
    case '提':
      return known('ㄊㄧˊ', '題', '提出、提到');
    default:
      throw new Error(`沒有設定「${character}」的讀音：${text}`);
  }
}

function ttsBehaviorFor(character, text, characterIndex) {
  const before = text[characterIndex - 1] ?? '';
  const after = text.slice(characterIndex + 1);
  if (character === '沒' && /^[水入]/.test(after)) return '末';
  if (character === '得' && /^「?活/.test(after)) return '德';
  if (character === '著' && /^[遠遊履]/.test(after)) return '濁';
  if (character === '重' && before === '輕') return '仲';
  if (character === '當' && after.startsWith('作')) return '蕩';
  if (character === '行' && before === '進') return '形';
  return '原字';
}

const rawUnits = [];
let lessonPart = 'opening';
let heading = '';
let unitCount = 0;

function addUnit(rawText, lineNumber) {
  const text = cleanMarkdown(rawText);
  if (!text) return;
  unitCount += 1;
  const occurrences = new Map();
  const targets = [];
  [...text].forEach((character, characterIndex) => {
    if (!polyphonicCharacters.has(character)) return;
    const occurrence = (occurrences.get(character) ?? 0) + 1;
    occurrences.set(character, occurrence);
    targets.push({
      character,
      occurrence,
      groupTtsBehavior: ttsBehaviorFor(character, text, characterIndex),
      ...readingFor(character, text, characterIndex),
    });
  });
  rawUnits.push({
    order: rawUnits.length,
    questionId:
      lessonPart === 'opening' ? 'opening' : `question-${lessonPart.slice(1)}`,
    speechUnitId: `${lessonPart}-speech-${String(unitCount).padStart(3, '0')}`,
    source: `《司馬光破甕救友》${lessonPart === 'opening' ? '任務開場' : `第${lessonPart.slice(1)}題`}｜${heading}（主檔第 ${lineNumber} 行）`,
    text,
    targets,
  });
}

for (let index = 0; index < lines.length; index += 1) {
  const line = lines[index];
  const questionMatch = line.match(/^# 第([一二三四五六七八九十]+)題/);
  if (questionMatch) {
    const questionNumber = [...lines.slice(0, index + 1)].filter((item) =>
      /^# 第.+題/.test(item),
    ).length;
    lessonPart = `q${questionNumber}`;
    heading = '';
    unitCount = 0;
    continue;
  }
  const headingMatch = line.match(/^(#{2,3})\s+(.+)/);
  if (headingMatch) {
    const nextHeading = cleanMarkdown(headingMatch[2]);
    if (lessonPart === 'opening') {
      heading =
        nextHeading.startsWith('App 畫面 1') || nextHeading.startsWith('App 畫面 2')
          ? nextHeading
          : '';
    } else {
      heading = playableHeadings.has(nextHeading) ? nextHeading : '';
    }
    continue;
  }
  if (!heading) continue;
  // 第二階段新增的讀音提示是修正既有 TTS 的輔助語，不再遞迴送入多音字候選掃描。
  if (/^>\s*讀音提示（(?:顯示|TTS)）/.test(line)) continue;
  if (/^>\s*\S/.test(line)) {
    addUnit(line, index + 1);
  } else if (
    ['選項', '畫面初始顯示順序（必須打亂）', '待判斷的六張敘述（畫面順序）'].includes(
      heading,
    ) &&
    /^\d+\.\s+\S/.test(line)
  ) {
    addUnit(line, index + 1);
  }
}

const exactUnits = [...new Map(rawUnits.map((unit) => [unit.text, unit])).values()];
const targetUnits = exactUnits.filter((unit) => unit.targets.length > 0);
const groupKey = (target) =>
  `${target.character}|${target.zhuyin}|${target.usage}|${target.groupTtsBehavior}`;
const uncovered = new Set(targetUnits.flatMap((unit) => unit.targets.map(groupKey)));
const selectedUnits = [];

while (uncovered.size > 0) {
  const candidates = targetUnits
    .map((unit) => {
      const newTargets = unit.targets.filter((target) => uncovered.has(groupKey(target)));
      return {
        unit,
        newTargets,
        newGroupCount: new Set(newTargets.map(groupKey)).size,
      };
    })
    .filter((candidate) => candidate.newGroupCount > 0)
    .sort(
      (left, right) =>
        right.newGroupCount - left.newGroupCount ||
        left.unit.text.length - right.unit.text.length ||
        left.unit.order - right.unit.order,
    );
  const chosen = candidates[0];
  const retainedKeys = new Set();
  const retainedTargets = [];
  for (const target of chosen.newTargets) {
    const key = groupKey(target);
    if (retainedKeys.has(key)) continue;
    retainedKeys.add(key);
    const { groupTtsBehavior: _groupTtsBehavior, ...catalogTarget } = target;
    retainedTargets.push(catalogTarget);
    uncovered.delete(key);
  }
  selectedUnits.push({ ...chosen.unit, targets: retainedTargets });
}

selectedUnits.sort((left, right) => left.order - right.order);
const emittedRows = selectedUnits
  .map(({ order: _order, ...unit }) => `  ${JSON.stringify(unit)},`)
  .join('\n');

const output = `/* eslint-disable max-lines */
// 此檔由 scripts/generate-sima-guang-audit.mjs 依核准主檔機械產生。
// 不得手動改寫候選文字；主檔變更後應重新執行產生器並重新實聽。
import { getTtsInput } from '../lib/speech';
import {
  buildTargetFingerprint,
  buildUtteranceFingerprint,
} from '../lib/ttsAuditFingerprint';
import type {
  PronunciationAuditCatalogItem,
  PronunciationTarget,
} from './guwenPronunciationAudit';

type SimaGuangAuditRow = {
  questionId: string;
  speechUnitId: string;
  source: string;
  text: string;
  targets: PronunciationTarget[];
};

const rows: SimaGuangAuditRow[] = [
${emittedRows}
];

export const SIMA_GUANG_PRONUNCIATION_AUDIT_CATALOG: PronunciationAuditCatalogItem[] =
  rows.map((row) => {
    const displayText = row.text;
    const ttsInput = getTtsInput(displayText);
    const target = row.targets.map((item) => item.character).join('、');
    const intendedReading = row.targets
      .map((item) => \`\${item.homophoneCue}（\${item.zhuyin}）\`)
      .join('；');
    const fingerprintInput = {
      displayText,
      ttsInput,
      targets: row.targets,
      auditRevision: 1,
    };
    return {
      ...row,
      id: \`simaguang-\${row.speechUnitId}\`,
      lessonId: 'sima-guang-po-weng',
      lessonNumber: 2,
      lessonTitle: '司馬光破甕救友',
      displayText,
      ttsInput,
      auditRevision: 1,
      targetFingerprint: buildTargetFingerprint(row.targets),
      utteranceFingerprint: buildUtteranceFingerprint(fingerprintInput),
      target,
      intendedReading,
      initialVerifications: [],
    };
  });
`;
fs.writeFileSync(outputPath, output, 'utf8');

const targetCount = selectedUnits.reduce((sum, unit) => sum + unit.targets.length, 0);
const reportRows = selectedUnits.map((unit, index) => {
  const targets = unit.targets
    .map(
      (target) =>
        `${target.character}第${target.occurrence}處＝${target.homophoneCue}（${target.zhuyin}，${target.usage}）`,
    )
    .join('；');
  return `${index + 1}. \`simaguang-${unit.speechUnitId}\`｜${unit.source}\n   - 完整語音單元：${unit.text}\n   - targets：${targets}`;
});
fs.writeFileSync(
  reportPath,
  `# 第二篇《司馬光破甕救友》多音字正式實聽第一階段清單

> lessonId：\`sima-guang-po-weng\`
>
> 教材主檔：\`02-guwen-simaguang-decoder-content.md\`
>
> 原始播放白名單：${rawUnits.length} 個語音單元
>
> 合併完全相同文字後：${exactUnits.length} 個語音單元
>
> 含候選多音字：${targetUnits.length} 個語音單元
>
> 減量後正式代表句：${selectedUnits.length} 句
>
> 不重複讀音群組／代表 targets：${targetCount} 個
>
> 篩選方式：只保留任務開場、本篇原文、App 引導語、古文線索、破解白話、任務／題目、選項、答對回饋與第一次答錯提示；排除詳解、出處、成人資料、故事畫面、排序結果、白話卷軸與其他純顯示文字；再依「字＋讀音＋用法＋TTS 條件」選取最少完整代表句。
>
> 狀態：本檔只記錄正式 catalog；實際「念對／念錯／待實聽」結果一律以中央資料庫為準，不由產生器預設或覆寫。

${reportRows.join('\n\n')}
`,
  'utf8',
);

console.log(
  `Scanned ${rawUnits.length} whitelist units (${exactUnits.length} exact unique); selected ${selectedUnits.length} representative units covering ${targetCount} pronunciation groups.`,
);
