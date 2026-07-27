import fs from 'node:fs';

const sourcePath = new URL('../lessons/01-guwen-wangrong-rewrite.md', import.meta.url);
const outputPath = new URL('../src/data/wangRongPronunciationAudit.ts', import.meta.url);
const reportPath = new URL('../lessons/01-guwen-wangrong-polyphonic-stage1.md', import.meta.url);
const lines = fs.readFileSync(sourcePath, 'utf8').split(/\r?\n/);

const polyphonicCharacters = new Set(
  [...'與看折著答少和過都還幾為卒數中重好只當供得便長處結會落行省'],
);

function isPlayableHeading(heading, part) {
  if (part === 'opening') {
    return heading.startsWith('任務開場') || heading === '播放本篇原文';
  }
  if (!part.startsWith('q')) return false;
  return (
    heading === '本輪處理句子' ||
    heading === 'App 引導語' ||
    /^(古文|仿古|混種古文|真實古文)?線索[一二]$/.test(heading) ||
    heading === '已破解為' ||
    heading === '比較任務' ||
    heading === '重建任務' ||
    heading.startsWith('麻煩古文破譯家') ||
    heading === '選項' ||
    heading.startsWith('答對回饋') ||
    heading === '答錯提示' ||
    heading.startsWith('畫面初始顯示順序') ||
    heading.startsWith('待判斷的八張敘述')
  );
}

function cleanMarkdown(text) {
  return text
    .replace(/^>\s?/, '')
    .replace(/^[-*]\s+/, '')
    .replace(/^\d+\.\s+/, '')
    .replace(/\*\*/g, '')
    .replace(/[【】]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim();
}

function readingFor(character, text, characterIndex) {
  const around = text.slice(Math.max(0, characterIndex - 4), characterIndex + 7);
  const known = (zhuyin, homophoneCue, usage) => ({
    zhuyin,
    homophoneCue,
    usage,
    cueMode: 'known_usage',
  });

  switch (character) {
    case '與':
      return known('ㄩˇ', '雨', '和、跟');
    case '看':
      return known('ㄎㄢˋ', '看見的看', '看到、看見');
    case '折':
      return known('ㄓㄜˊ', '哲', '彎折或折斷');
    case '著':
      return known('ㄓㄜ˙', '輕聲', '放在動作後表示狀態持續');
    case '答':
      return known('ㄉㄚˊ', '達', '回答');
    case '少':
      return /少時|少年|年少/.test(around)
        ? known('ㄕㄠˋ', '哨', '年紀小')
        : known('ㄕㄠˇ', '小', '數量不多或多少');
    case '和':
      return known('ㄏㄜˊ', '河', '和、跟');
    case '過':
      if (/經過|路過|嘗過/.test(around)) return known('ㄍㄨㄛˋ', '過年的過', '經過、路過');
      if (/吃過|發生過|查過|摘過|去過/.test(around)) {
        return known('ㄍㄨㄛˋ', '過年的過', '放在動作後表示已完成');
      }
      return known('ㄍㄨㄛˋ', '過年的過', '過去、經歷');
    case '都':
      return known('ㄉㄡ', '兜', '全部');
    case '還':
      return known('ㄏㄞˊ', '孩', '仍然、尚未');
    case '幾':
      return known('ㄐㄧˇ', '己', '多少');
    case '為':
      return /為什麼|因為/.test(around)
        ? known('ㄨㄟˋ', '胃', '為什麼或因為')
        : known('ㄨㄟˊ', '圍', '認為、視為或成為');
    case '卒':
      return known('ㄗㄨˊ', '足', '去世');
    case '數':
      return /數量|人數/.test(around)
        ? known('ㄕㄨˋ', '樹', '數量')
        : known('ㄕㄨˋ', '樹', '好幾個');
    case '中':
      return known('ㄓㄨㄥ', '鐘', '在範圍裡');
    case '重':
      return /重建|重新|重複/.test(around)
        ? known('ㄔㄨㄥˊ', '蟲', '重新組合或再次進行')
        : known('ㄓㄨㄥˋ', '中獎的中', '重量或重要');
    case '好':
      if (/好幾/.test(around)) return known('ㄏㄠˇ', '好人的好', '好幾個、相當多');
      if (/好朋友|關係良好/.test(around)) return known('ㄏㄠˇ', '好人的好', '關係良好');
      if (/好吃|味道好/.test(around)) return known('ㄏㄠˇ', '好人的好', '味道好');
      return known('ㄏㄠˇ', '好人的好', '完成妥當或良好');
    case '只':
      return known('ㄓˇ', '紙', '僅僅、只有');
    case '當':
      if (/當時/.test(around)) return known('ㄉㄤ', '噹', '那個時間');
      if (/當成|當作/.test(around)) return known('ㄉㄤ', '噹', '視為、當作');
      return known('ㄉㄤ', '噹', '應當');
    case '供':
      return known('ㄍㄨㄥ', '公', '提供');
    case '得':
      return /得布|得到|取得|獲得|所得/.test(around)
        ? known('ㄉㄜˊ', '德', '取得、得到')
        : known('ㄉㄜ˙', '輕聲', '放在動作後連接結果或程度');
    case '便':
      return known('ㄅㄧㄢˋ', '變', '就、於是');
    case '長':
      return /長大|長成|長出|長在|生長|成長/.test(around)
        ? known('ㄓㄤˇ', '掌', '生長、長大')
        : known('ㄔㄤˊ', '常', '長度很長');
    case '處':
      return /處理|處置/.test(around)
        ? known('ㄔㄨˇ', '楚', '處理、處置')
        : known('ㄔㄨˋ', '觸', '地方');
    case '結':
      return /結果|結論/.test(around)
        ? known('ㄐㄧㄝˊ', '結果的結', '結果、結論')
        : known('ㄐㄧㄝˊ', '結果的結', '長出果實');
    case '會':
      return /一會/.test(around)
        ? known('ㄏㄨㄟˇ', '毀', '很短的一段時間')
        : known('ㄏㄨㄟˋ', '惠', '會、能夠');
    case '落':
      return known('ㄌㄨㄛˋ', '駱', '落下或落在後面');
    case '行':
      return known('ㄒㄧㄥˊ', '形', '走、前進或做出行為');
    case '省':
      return /省略/.test(around)
        ? known('ㄕㄥˇ', '省份的省', '省略')
        : known('ㄒㄧㄥˇ', '醒', '反省、檢查自己');
    default:
      throw new Error(`沒有設定「${character}」的讀音`);
  }
}

function ttsBehaviorFor(character, text, characterIndex) {
  const before = text[characterIndex - 1] ?? '';
  const after = text.slice(characterIndex + 1);
  if (character === '長' && (/[不苗生助]/.test(before) || /^[高得]/.test(after))) return '掌';
  if (character === '得' && /^「?[鐘兔活履]/.test(after)) return '德';
  if (character === '著' && /^[遠遊履]/.test(after)) return '濁';
  if (character === '重' && before === '輕') return '仲';
  if (character === '當' && (before === '相' && after.startsWith('於') || after.startsWith('作'))) {
    return '蕩';
  }
  if (character === '行' && before === '進') return '形';
  if (character === '為' && before === '以' && /^(神明|有神)/.test(after)) return '圍';
  return '原字';
}

const speechUnits = [];
let lessonPart = 'opening';
let h2 = '';
let h3 = '';
let h4 = '';
let paragraphLines = [];
let paragraphStart = 0;
let skippingPronunciationCue = false;
const unitCountByPart = new Map();

function currentHeading() {
  return h4 || h3 || h2;
}

function addSpeechUnit(rawText, lineNumber) {
  const text = cleanMarkdown(rawText);
  const heading = currentHeading();
  if (
    !text ||
    !isPlayableHeading(heading, lessonPart) ||
    /念作[^。]*[（(][\u3105-\u3129]/.test(text) ||
    ![...text].some((character) => polyphonicCharacters.has(character))
  ) {
    return;
  }

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

  const unitNumber = (unitCountByPart.get(lessonPart) ?? 0) + 1;
  unitCountByPart.set(lessonPart, unitNumber);
  speechUnits.push({
    id: `wangrong-${lessonPart}-speech-${String(unitNumber).padStart(3, '0')}`,
    questionId: lessonPart === 'opening' || lessonPart === 'scroll' || lessonPart === 'completion'
      ? lessonPart
      : `question-${lessonPart.slice(1)}`,
    speechUnitId: `${lessonPart}-speech-${String(unitNumber).padStart(3, '0')}`,
    source: `《王戎不取道旁李》${lessonPart === 'opening' ? '任務開場' : lessonPart === 'scroll' ? '白話驗證卷軸' : lessonPart === 'completion' ? '完成訊息' : `第${lessonPart.slice(1)}題`}｜${heading}（主檔第 ${lineNumber} 行）`,
    text,
    targets,
  });
}

function flushParagraph() {
  if (paragraphLines.length > 0) {
    addSpeechUnit(paragraphLines.join(''), paragraphStart);
    paragraphLines = [];
  }
}

for (let index = 0; index < lines.length; index += 1) {
  const line = lines[index];
  const headingMatch = line.match(/^(#{2,4})\s+(.+)/);
  if (headingMatch) {
    flushParagraph();
    skippingPronunciationCue = false;
    const level = headingMatch[1].length;
    const heading = cleanMarkdown(headingMatch[2]);
    if (level === 2) {
      h2 = heading;
      h3 = '';
      h4 = '';
      const questionMatch = heading.match(/^第\s*(\d+)\s*題/);
      if (questionMatch) lessonPart = `q${questionMatch[1]}`;
      else if (heading.startsWith('任務開場')) lessonPart = 'opening';
      else if (heading.includes('白話驗證卷軸')) lessonPart = 'scroll';
      else if (heading.includes('破譯完成鼓勵')) lessonPart = 'completion';
    } else if (level === 3) {
      h3 = heading;
      h4 = '';
    } else {
      h4 = heading;
    }
    continue;
  }

  if (/^>\s*讀音提示：/.test(line)) {
    flushParagraph();
    skippingPronunciationCue = true;
    continue;
  }
  if (skippingPronunciationCue) continue;
  if (!line.trim() || /^>\s*$/.test(line)) {
    flushParagraph();
    continue;
  }
  if (/^\[返回|^---$|^<a |^\|/.test(line)) {
    flushParagraph();
    continue;
  }
  if (/^\d+\.\s+|^[-*]\s+/.test(line)) {
    flushParagraph();
    addSpeechUnit(line, index + 1);
    continue;
  }
  if (/^>/.test(line) || (!/^\s/.test(line) && !line.startsWith('#'))) {
    if (paragraphLines.length === 0) paragraphStart = index + 1;
    paragraphLines.push(line);
  }
}
flushParagraph();

const exactTextUnits = [...new Map(speechUnits.map((unit) => [unit.text, unit])).values()];
// 「陳涉少時」的少有使用者確認的 exact 例外結果，必須獨立成項；
// 不讓貪婪減量器同時把這個整句選成其他一般讀音群組的代表句。
const regularExactTextUnits = exactTextUnits.filter(
  (unit) => unit.text !== '陳涉少時，嘗與人傭耕。',
);
const pronunciationGroupKey = (target) =>
  `${target.character}|${target.zhuyin}|${target.usage}|${target.groupTtsBehavior}`;
const allGroupKeys = new Set(
  regularExactTextUnits.flatMap((unit) => unit.targets.map(pronunciationGroupKey)),
);
const uncoveredGroupKeys = new Set(allGroupKeys);
const selectedUnits = [];

// 優先沿用仍存在的既有代表整句與穩定 ID，讓題號縮編不會使完全相同的
// displayText／ttsInput／target fingerprint 失去中央真人實聽結果。
const preferredRepresentativeIds = new Map([
  ['王戎七歲，嘗與諸小兒遊。看道邊李樹多子折枝，諸兒競走取之，唯戎不動。人問之，答曰：「樹在道邊而多子，此必苦李。」取之，信然。', 'wangrong-opening-speech-002'],
  ['少年時，嘗過一村院。', 'wangrong-q1-speech-005'],
  ['追蹤成功！其他孩子都跑去摘李子，只有王戎沒有行動，大家自然會注意到他的不同。', 'wangrong-q13-speech-005'],
  ['曾子曰：「吾日三省吾身。」', 'wangrong-q14-speech-004'],
  ['船已經向前行駛，而落入水中的劍仍留在原來的位置。', 'wangrong-q16-speech-003'],
  ['道路旁邊的李子容易被人發現和摘走；如果好吃，照理不容易還剩這麼多', 'wangrong-q17-speech-005'],
  ['因為李樹長在道路旁邊，所以王戎已經親口吃過每一顆李子，知道它們全都很苦。', 'wangrong-q19-speech-005'],
  ['我找到了兩條線索，請你比較裡面的數量。', 'wangrong-q2-speech-002'],
  ['家有五兒。母卒，諸兒見家人泣，則隨之泣。', 'wangrong-q2-speech-005'],
  ['「取之，信然」可以重建為：有人摘下李子查驗，結果果然如王戎所說，是苦的。', 'wangrong-q22-speech-005'],
  ['沒有被文章明確寫出來的內容，就算聽起來合理，也不能當成文章已經說出的事。', 'wangrong-q24-speech-006'],
  ['王戎七歲時，曾經和一群好朋友一起遊玩。', 'wangrong-q3-speech-006'],
  ['梨樹多子折枝，果農便用長竹竿撐住樹枝。', 'wangrong-q4-speech-006'],
  ['破譯家，下一處待破解的是競。', 'wangrong-q6-speech-001'],
  ['兩個孩子競走；一會兒這個領先，一會兒另一個領先，兩人都不肯落在後面。', 'wangrong-q6-speech-005'],
  ['屠暴起，以刀劈狼首，又數刀斃之。', 'wangrong-q8-speech-003'],
  ['可是回到本篇，「取之」前面出現了好幾個對象，我還不確定孩子們究竟跑去拿什麼。麻煩古文破譯家幫我沿著故事追蹤之的指向。', 'wangrong-q9-speech-003'],
]);
const preferredTargetCharacters = new Map([
  ['wangrong-opening-speech-002', '與答'],
  ['wangrong-q1-speech-005', '少過'],
  ['wangrong-q13-speech-005', '只會'],
  ['wangrong-q14-speech-004', '省'],
  ['wangrong-q16-speech-003', '行落中'],
  ['wangrong-q17-speech-005', '好'],
  ['wangrong-q19-speech-005', '為長過都'],
  ['wangrong-q2-speech-002', '數'],
  ['wangrong-q2-speech-005', '卒'],
  ['wangrong-q22-speech-005', '為結'],
  ['wangrong-q24-speech-006', '當'],
  ['wangrong-q3-speech-006', '好'],
  ['wangrong-q4-speech-006', '便長'],
  ['wangrong-q6-speech-001', '處'],
  ['wangrong-q6-speech-005', '會'],
  ['wangrong-q8-speech-003', '數'],
  ['wangrong-q9-speech-003', '好幾還著'],
]);

preferredRepresentativeIds.forEach((stableId, text) => {
  const unit = regularExactTextUnits.find((candidate) => candidate.text === text);
  if (!unit) return;
  const retainedTargets = [];
  const retainedKeys = new Set();
  unit.targets.forEach((target) => {
    const key = pronunciationGroupKey(target);
    if (
      !preferredTargetCharacters.get(stableId)?.includes(target.character) ||
      !uncoveredGroupKeys.has(key) ||
      retainedKeys.has(key)
    ) return;
    retainedKeys.add(key);
    const { groupTtsBehavior: _groupTtsBehavior, ...catalogTarget } = target;
    retainedTargets.push(catalogTarget);
    uncoveredGroupKeys.delete(key);
  });
  if (retainedTargets.length > 0) {
    selectedUnits.push({ ...unit, id: stableId, targets: retainedTargets });
  }
});

while (uncoveredGroupKeys.size > 0) {
  const candidates = regularExactTextUnits
    .map((unit) => {
      const newTargets = unit.targets.filter((target) =>
        uncoveredGroupKeys.has(pronunciationGroupKey(target)),
      );
      const newGroupCount = new Set(newTargets.map(pronunciationGroupKey)).size;
      return { unit, newTargets, newGroupCount };
    })
    .filter((candidate) => candidate.newGroupCount > 0)
    .sort(
      (left, right) =>
        right.newGroupCount - left.newGroupCount ||
        left.unit.text.length - right.unit.text.length ||
        left.unit.id.localeCompare(right.unit.id),
    );
  const chosen = candidates[0];
  const retainedTargets = [];
  const retainedKeys = new Set();
  chosen.newTargets.forEach((target) => {
    const key = pronunciationGroupKey(target);
    if (retainedKeys.has(key)) return;
    retainedKeys.add(key);
    const { groupTtsBehavior: _groupTtsBehavior, ...catalogTarget } = target;
    retainedTargets.push(catalogTarget);
    uncoveredGroupKeys.delete(key);
  });
  selectedUnits.push({ ...chosen.unit, targets: retainedTargets });
}

// 使用者在正式 App 回聽後確認：同為「年紀小」用法時，
// 「少年時，嘗過一村院。」念對，但「陳涉少時，嘗與人傭耕。」念成三聲。
// 這兩個 exact 語音單元不可繼續共用代表結果。
const chenSheShaoShiUnit = exactTextUnits.find(
  (unit) => unit.text === '陳涉少時，嘗與人傭耕。',
);
if (!chenSheShaoShiUnit) {
  throw new Error('找不到「陳涉少時，嘗與人傭耕。」正式語音單元');
}
const chenSheShaoTarget = chenSheShaoShiUnit.targets.find(
  (target) => target.character === '少' && target.zhuyin === 'ㄕㄠˋ',
);
if (!chenSheShaoTarget) {
  throw new Error('找不到「陳涉少時」的少（ㄕㄠˋ）target');
}
const {
  groupTtsBehavior: _chenSheGroupTtsBehavior,
  ...chenSheBaseCatalogTarget
} = chenSheShaoTarget;
const chenSheCatalogTarget = {
  ...chenSheBaseCatalogTarget,
  homophoneCue: '紹',
  usage: '年輕',
};
selectedUnits.push({
  ...chenSheShaoShiUnit,
  targets: [chenSheCatalogTarget],
  initialVerifications: [
    {
      status: 'incorrect',
      verifiedDate: '2026-07-26',
      environmentLabel: '使用者於正式 App 的實際裝置回聽確認',
      evidence: '使用者回聽「陳涉少時，嘗與人傭耕。」後，確認「少」被念成三聲，應念四聲。',
    },
  ],
});

selectedUnits.sort((left, right) => left.id.localeCompare(right.id));

const emittedRows = selectedUnits
  .map((unit) => `  ${JSON.stringify(unit)},`)
  .join('\n');

const output = `/* eslint-disable max-lines */
// 此檔由 scripts/generate-wang-rong-audit.mjs 依核准主檔機械產生。
// 不得手動改寫候選文字；主檔變更後應重新執行產生器並重新實聽。
import { getTtsInput } from '../lib/speech';
import {
  buildTargetFingerprint,
  buildUtteranceFingerprint,
} from '../lib/ttsAuditFingerprint';
import type {
  PronunciationAuditCatalogItem,
  PronunciationTarget,
  PronunciationVerification,
} from './guwenPronunciationAudit';

type WangRongAuditRow = {
  id: string;
  questionId: string;
  speechUnitId: string;
  source: string;
  text: string;
  targets: PronunciationTarget[];
  initialVerifications?: PronunciationVerification[];
};

const rows: WangRongAuditRow[] = [
${emittedRows}
];

export const WANG_RONG_PRONUNCIATION_AUDIT_CATALOG: PronunciationAuditCatalogItem[] =
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
      lessonId: 'wang-rong-bu-qu-dao-pang-li',
      lessonNumber: 1,
      lessonTitle: '王戎不取道旁李',
      displayText,
      ttsInput,
      auditRevision: 1,
      targetFingerprint: buildTargetFingerprint(row.targets),
      utteranceFingerprint: buildUtteranceFingerprint(fingerprintInput),
      target,
      intendedReading,
      initialVerifications: row.initialVerifications ?? [],
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
  return `${index + 1}. \`${unit.id}\`｜${unit.source}\n   - 完整語音單元：${unit.text}\n   - targets：${targets}`;
});
fs.writeFileSync(
  reportPath,
  `# 第一篇《王戎不取道旁李》多音字正式實聽第一階段清單

> lessonId：\`wang-rong-bu-qu-dao-pang-li\`
>
> 教材主檔：\`lessons/01-guwen-wangrong-rewrite.md\`
>
> 完整語音單元：${selectedUnits.length}
>
> target occurrence：${targetCount}
>
> 篩選方式：只保留任務開場、本篇／目標原文、App 引導語、古文線索、破解白話、任務／題目、選項、答對回饋與答錯提示；再依「字＋讀音＋用法」選一個代表語音單元。
>
> 狀態：本檔只記正式代表句，不保存真人判定；有效結果以中央資料庫最新讀回為準。

${reportRows.join('\n\n')}
`,
  'utf8',
);
console.log(
  `Scanned ${speechUnits.length} playable candidate units; selected ${selectedUnits.length} representative units covering ${targetCount} pronunciation groups.`,
);
