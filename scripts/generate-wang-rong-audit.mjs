import fs from 'node:fs';

const sourcePath = new URL('../lessons/01-guwen-wangrong-rewrite.md', import.meta.url);
const outputPath = new URL('../src/data/wangRongPronunciationAudit.ts', import.meta.url);
const reportPath = new URL('../lessons/01-guwen-wangrong-polyphonic-stage1.md', import.meta.url);
const lines = fs.readFileSync(sourcePath, 'utf8').split(/\r?\n/);

const polyphonicCharacters = new Set(
  [...'與看折著答少和過都還幾為卒數中重好只當供得便長處結會落行省'],
);

const includedHeading =
  /任務開場|播放本篇原文|本輪處理句子|密碼鑰匙|畫面鑰匙|關係鑰匙|App 引導語|古文線索|仿古線索|混種古文線索|真實古文線索|線索一$|線索二$|已破解為|比較任務|重建任務|麻煩古文|選項$|答對回饋|答錯提示|詳解|放回|故事畫面|故事證據|證據邊界|已取得|本題取得|本篇已破解|待判斷|畫面初始|卷軸開場|古文原文|完整白話文|白話文證據邊界|App 顯示文案|完成訊息/;

const excludedHeading =
  /成人|學習目標|語音校對|來源核對|線索類型|選項位置|編輯|正解$|完成條件|解鎖條件|共同要求|修改索引|稽核|快速目錄|文件狀態|篇名與出處|^本篇原文$/;

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
      return known('ㄍㄨㄛˋ', '過年的過', '經過或表示動作已完成');
    case '都':
      return known('ㄉㄡ', '兜', '全部');
    case '還':
      return known('ㄏㄞˊ', '孩', '仍然、尚未');
    case '幾':
      return known('ㄐㄧˇ', '己', '多少');
    case '為':
      return /為什麼|因為/.test(around)
        ? known('ㄨㄟˋ', '胃', '為什麼或因為')
        : known('ㄨㄟˊ', '圍', '擔任、成為');
    case '卒':
      return known('ㄗㄨˊ', '足', '去世');
    case '數':
      return known('ㄕㄨˋ', '樹', '數量或好幾個');
    case '中':
      return known('ㄓㄨㄥ', '鐘', '在範圍裡');
    case '重':
      return /重建|重新|重複/.test(around)
        ? known('ㄔㄨㄥˊ', '蟲', '重新組合或再次進行')
        : known('ㄓㄨㄥˋ', '中獎的中', '重量或重要');
    case '好':
      return known('ㄏㄠˇ', '好人的好', '良好、味道好或完成妥當');
    case '只':
      return known('ㄓˇ', '紙', '僅僅、只有');
    case '當':
      return known('ㄉㄤ', '噹', '當時、當作或應當');
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
      return known('ㄐㄧㄝˊ', '結果的結', '長出果實、結果或結論');
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
    !includedHeading.test(heading) ||
    excludedHeading.test(heading) ||
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

const emittedRows = speechUnits
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
} from './guwenPronunciationAudit';

type WangRongAuditRow = {
  id: string;
  questionId: string;
  speechUnitId: string;
  source: string;
  text: string;
  targets: PronunciationTarget[];
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
      initialVerifications: [],
    };
  });
`;

fs.writeFileSync(outputPath, output, 'utf8');
const targetCount = speechUnits.reduce((sum, unit) => sum + unit.targets.length, 0);
const reportRows = speechUnits.map((unit, index) => {
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
> 教材主檔：\`lessons/01-guwen-wangrong-rewrite.md\`  
> 完整語音單元：${speechUnits.length}  
> target occurrence：${targetCount}  
> 狀態：全部待使用者本人在正式實聽台判定；本檔不記錄、也不預選任何「念對／念錯」。

${reportRows.join('\n\n')}
`,
  'utf8',
);
console.log(`Generated ${speechUnits.length} Wang Rong audit units with ${targetCount} target occurrences.`);
