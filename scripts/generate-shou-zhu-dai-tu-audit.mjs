import fs from 'node:fs';

const sourcePath = new URL('../04-guwen-shouzhudaitu-decoder-content.md', import.meta.url);
const outputPath = new URL('../src/data/shouZhuDaiTuPronunciationAudit.ts', import.meta.url);
const reportPath = new URL(
  '../lessons/04-guwen-shouzhudaitu-polyphonic-stage1.md',
  import.meta.url,
);
const lines = fs.readFileSync(sourcePath, 'utf8').split(/\r?\n/);

const polyphonicCharacters = new Set(
  [
    ...'沒中得倒種處見大過哪還長更難假落只為會看著都好重便行結覺數和當幾給說要發分轉傳提折夫地角答將挑擔相樂強量解頸衣雨從待空幹累',
  ],
);

const playableQuestionHeadings = new Set([
  '孩子端｜麻煩古文破譯家幫忙',
  '線索一',
  '線索二',
  '提交假說',
  '提交重建結果',
  '提交排序結果',
  '提交證據檢查',
  '排序卡',
  '分類卡',
  '答對回饋',
  '第一次答錯提示',
]);

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

function isPlayableHeading(heading, lessonPart) {
  if (lessonPart === 'opening') {
    return /^(?:畫面[一二三]|第[一二三]頁)｜/.test(heading);
  }
  return lessonPart.startsWith('q') && playableQuestionHeadings.has(heading);
}

const rawUnits = [];
let lessonPart = '';
let heading = '';
const unitCountByPart = new Map();

function addUnit(rawText, lineNumber, sourceOverride = '') {
  const text = cleanMarkdown(rawText);
  if (!text) return;
  // The listening lead-in was added when the low-pressure two-screen opening was restored. Give this new
  // speech unit a semantic ID and keep it out of the legacy sequence counter so every already-audited
  // opening utterance retains its original stable ID (especially opening-speech-005).
  const fixedSpeechUnitId =
    lessonPart === 'opening' && text === '首先，跟我們一起聽一遍全文。'
      ? 'opening-listening-lead-in'
      : '';
  const unitNumber = fixedSpeechUnitId
    ? (unitCountByPart.get(lessonPart) ?? 0)
    : (unitCountByPart.get(lessonPart) ?? 0) + 1;
  if (!fixedSpeechUnitId) unitCountByPart.set(lessonPart, unitNumber);
  const partLabel =
    lessonPart === 'opening' ? '任務開場' : `第${lessonPart.slice(1)}題`;
  rawUnits.push({
    questionId:
      lessonPart === 'opening' ? 'opening' : `question-${lessonPart.slice(1)}`,
    speechUnitId:
      fixedSpeechUnitId || `${lessonPart}-speech-${String(unitNumber).padStart(3, '0')}`,
    source: `《守株待兔》${partLabel}｜${sourceOverride || heading}（主檔第 ${lineNumber} 行）`,
    text,
    order: rawUnits.length,
  });
}

for (let index = 0; index < lines.length; index += 1) {
  const line = lines[index];
  if (line.startsWith('## 五、任務開場')) {
    lessonPart = 'opening';
    heading = '';
    continue;
  }
  const questionMatch = line.match(/^# 第([一二三四五六七八九十]+)題/);
  if (questionMatch) {
    const questionHeadings = [...lines.slice(0, index + 1)].filter((item) =>
      /^# 第[一二三四五六七八九十]+題/.test(item),
    );
    lessonPart = `q${questionHeadings.length}`;
    heading = '';
    continue;
  }
  const headingMatch = line.match(/^(#{2,3})\s+(.+)/);
  if (headingMatch) {
    const nextHeading = cleanMarkdown(headingMatch[2]);
    heading = isPlayableHeading(nextHeading, lessonPart) ? nextHeading : '';
    continue;
  }
  if (!heading) continue;
  if (/^>\s*(?:已破解為：|讀音提示：)/.test(line)) continue;
  if (/^>\s*\S/.test(line)) {
    addUnit(line, index + 1);
    continue;
  }
  if (
    ['提交假說', '提交重建結果', '排序卡', '分類卡'].includes(heading) &&
    /^(?:\d+\.|-)\s+\S/.test(line)
  ) {
    addUnit(line, index + 1, heading === '排序卡' || heading === '分類卡' ? heading : '選項');
  }
}

const exactUnitByText = new Map();
for (const unit of rawUnits) {
  if (!exactUnitByText.has(unit.text)) exactUnitByText.set(unit.text, unit);
}
const exactUnits = [...exactUnitByText.values()];

if (process.argv.includes('--inspect')) {
  const candidateRows = exactUnits
    .map((unit) => ({
      ...unit,
      characters: [...new Set([...unit.text].filter((character) => polyphonicCharacters.has(character)))],
    }))
    .filter((unit) => unit.characters.length > 0);
  console.log(
    JSON.stringify(
      {
        rawUnitCount: rawUnits.length,
        exactUnitCount: exactUnits.length,
        candidateUnitCount: candidateRows.length,
        candidateCharacters: [...new Set(candidateRows.flatMap((unit) => unit.characters))],
        candidateRows,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

function known(zhuyin, homophoneCue, usage, cueMode = 'known_usage') {
  return { zhuyin, homophoneCue, usage, cueMode };
}

function readingFor(character, text, characterIndex, unresolved) {
  const before = text.slice(Math.max(0, characterIndex - 6), characterIndex);
  const after = text.slice(characterIndex + 1, characterIndex + 9);
  const around = `${before}${character}${after}`;
  const cueMode = unresolved ? 'unresolved_target' : 'known_usage';
  const result = (zhuyin, homophoneCue, usage) =>
    known(zhuyin, homophoneCue, usage, cueMode);

  switch (character) {
    case '沒':
      return result('ㄇㄟˊ', '梅', '否定、沒有');
    case '中':
      return result('ㄓㄨㄥ', '鐘', '在範圍、位置或群體裡');
    case '得':
      if (/看得出|覺得|變得|值得/.test(around)) {
        return result('ㄉㄜ˙', '輕聲', '接在動作或狀態後連接結果、程度');
      }
      return result('ㄉㄜˊ', '德', '取得、得到');
    case '倒':
      return result('ㄉㄠˇ', '島', '倒下、失去直立姿勢');
    case '種':
      return /種子/.test(around)
        ? result('ㄓㄨㄥˇ', '腫', '種子')
        : result('ㄓㄨㄥˇ', '腫', '種類');
    case '處':
      return /處理|處置/.test(around)
        ? result('ㄔㄨˇ', '楚', '處理、處置')
        : result('ㄔㄨˋ', '觸', '地方、位置');
    case '見':
      if (/見恕/.test(around)) return result('ㄐㄧㄢˋ', '建', '放在動作前表示被動');
      return result('ㄐㄧㄢˋ', '建', '看見、會面');
    case '大':
      return result('ㄉㄚˋ', '大小的大', '大小、程度大或頭銜用字');
    case '過':
      if (/改過/.test(around)) return result('ㄍㄨㄛˋ', '過年的過', '改正過錯');
      if (/吹過|繞過/.test(around)) return result('ㄍㄨㄛˋ', '過年的過', '經過、通過');
      if (/見過|已.*過|丟過/.test(around)) {
        return result('ㄍㄨㄛˋ', '過年的過', '接在動作後表示曾經發生');
      }
      return result('ㄍㄨㄛˋ', '過年的過', '過去、經歷');
    case '哪':
      return result('ㄋㄚˇ', '哪裡的哪', '疑問代詞');
    case '還':
      return result('ㄏㄞˊ', '孩', '仍然、尚且');
    case '長':
      return result('ㄓㄤˇ', '掌', '生長、長出');
    case '更':
      return result('ㄍㄥˋ', '更改的更', '更加、程度增加');
    case '難':
      return result('ㄋㄢˊ', '南', '困難、不容易');
    case '假':
      return result('ㄐㄧㄚˇ', '甲', '假說、尚待驗證的說法');
    case '落':
      return result('ㄌㄨㄛˋ', '駱', '落下、落空或落到');
    case '只':
      return result('ㄓˇ', '紙', '僅僅、只有');
    case '為':
      if (/為什麼/.test(around)) return result('ㄨㄟˋ', '位置的位', '為什麼');
      if (/分為|揉木為/.test(around)) return result('ㄨㄟˊ', '圍', '成為、做成');
      return result('ㄨㄟˊ', '圍', '被、表示被動');
    case '會':
      return result('ㄏㄨㄟˋ', '惠', '會、可能或能夠');
    case '看':
      return result('ㄎㄢˋ', '看見的看', '觀看、看見');
    case '著':
      return /睡著/.test(around)
        ? result('ㄓㄠˊ', '著火的著', '進入睡眠狀態')
        : result('ㄓㄜ˙', '輕聲', '接在動作後表示持續或承接');
    case '都':
      return result('ㄉㄡ', '兜', '全部');
    case '好':
      return result('ㄏㄠˇ', '好人的好', '完成妥當、準備妥當');
    case '重':
      return result('ㄔㄨㄥˊ', '蟲', '重新組合或再次進行');
    case '便':
      return result('ㄅㄧㄢˋ', '變', '就、於是');
    case '行':
      return result('ㄒㄧㄥˊ', '形', '行走、行動');
    case '結':
      return result('ㄐㄧㄝˊ', '結果的結', '結果、結論');
    case '覺':
      return result('ㄐㄩㄝˊ', '決', '感覺、認為');
    case '數':
      return result('ㄕㄨˋ', '樹', '數量、幾個');
    case '和':
      return result('ㄏㄜˊ', '河', '和、跟或連接並列項目');
    case '當':
      return result('ㄉㄤ', '噹', '視為、當作');
    case '幾':
      return result('ㄐㄧˇ', '己', '多少或不定的少數');
    case '給':
      return result('ㄍㄟˇ', '給你的給', '交付、使對方得到');
    case '說':
      return result('ㄕㄨㄛ', '說話的說', '說明、說出或假說');
    case '要':
      return result('ㄧㄠˋ', '藥', '需要、將要或要求');
    case '發':
      return /發現/.test(around)
        ? result('ㄈㄚ', '發現的發', '發現、察覺')
        : result('ㄈㄚ', '發現的發', '發生、出現');
    case '分':
      return /部分/.test(around)
        ? result('ㄈㄣˋ', '份', '整體中的一部分')
        : result('ㄈㄣ', '分開的分', '分開、區別或分組');
    case '轉':
      return result('ㄓㄨㄢˇ', '轉身的轉', '改變方向或狀態');
    case '傳':
      return result('ㄔㄨㄢˊ', '船', '傳遞、傳出');
    case '提':
      return result('ㄊㄧˊ', '題', '提出、提到');
    case '折':
      return result('ㄓㄜˊ', '哲', '彎折、折斷');
    case '夫':
      return result('ㄈㄨ', '膚', '成年男子或職業名稱後綴');
    case '地':
      return /地面|原地/.test(around)
        ? result('ㄉㄧˋ', '弟', '地面、地方')
        : result('ㄉㄜ˙', '輕聲', '接在修飾語後連接動作');
    case '角':
      return result('ㄐㄧㄠˇ', '腳', '動物頭上的角');
    case '答':
      return result('ㄉㄚˊ', '達', '回答');
    case '將':
      return /將軍/.test(around)
        ? result('ㄐㄧㄤ', '江', '將軍、軍事首領')
        : result('ㄐㄧㄤ', '江', '將要、即將');
    case '挑':
      return result('ㄊㄧㄠ', '挑選的挑', '用肩膀承擔或拿著');
    case '擔':
      return result('ㄉㄢˋ', '蛋', '擔子、用肩挑的物品');
    case '相':
      return /相信/.test(around)
        ? result('ㄒㄧㄤ', '香', '相信')
        : result('ㄒㄧㄤ', '香', '相當於、彼此比較');
    case '樂':
      return result('ㄌㄜˋ', '快樂的樂', '享樂、快樂');
    case '強':
      return result('ㄑㄧㄤˊ', '牆', '強大、富強');
    case '量':
      return result('ㄌㄧㄤˋ', '亮', '力量、力氣');
    case '解':
      return result('ㄐㄧㄝˇ', '姐姐的姐', '破解、解開或解鎖');
    case '頸':
      return result('ㄐㄧㄥˇ', '井', '頸部、脖子');
    case '衣':
      return result('ㄧ', '依', '衣服、衣物');
    case '雨':
      return result('ㄩˇ', '雨水的雨', '雨水、下雨');
    case '從':
      return /仍從/.test(around)
        ? result('ㄘㄨㄥˊ', '叢', '跟隨')
        : result('ㄘㄨㄥˊ', '叢', '從某處開始、由');
    case '待':
      return result('ㄉㄞˋ', '袋', '等待、留到後來');
    case '空':
      return result('ㄎㄨㄥ', '天空的空', '落空、沒有實現');
    case '幹':
      return result('ㄍㄢˋ', '幹部的幹', '樹木的主幹');
    case '累':
      return result('ㄌㄟˇ', '壘', '牽連、連累');
    default:
      throw new Error(`沒有設定「${character}」的讀音：${text}`);
  }
}

function ttsBehaviorFor(character, text, characterIndex) {
  const before = text[characterIndex - 1] ?? '';
  const after = text.slice(characterIndex + 1);
  if (character === '得' && /^「?[兔履]/.test(after)) return '德';
  if (character === '著' && /^[遠遊履]/.test(after)) return '濁';
  if (character === '重' && before === '輕') return '仲';
  if (character === '當' && (before === '相' && after.startsWith('於') || after.startsWith('作'))) {
    return '蕩';
  }
  if (character === '行' && before === '進') return '形';
  return '原字';
}

const targetUnits = exactUnits
  .map((unit) => {
    const occurrences = new Map();
    const targets = [];
    [...unit.text].forEach((character, characterIndex) => {
      if (!polyphonicCharacters.has(character)) return;
      const occurrence = (occurrences.get(character) ?? 0) + 1;
      occurrences.set(character, occurrence);
      const rawUnit = lines[Number(unit.source.match(/主檔第 (\d+) 行/)?.[1]) - 1] ?? '';
      const unresolved = rawUnit.includes(`【${character}】`);
      targets.push({
        character,
        occurrence,
        groupTtsBehavior: ttsBehaviorFor(character, unit.text, characterIndex),
        ...readingFor(character, unit.text, characterIndex, unresolved),
      });
    });
    return { ...unit, targets };
  })
  .filter((unit) => unit.targets.length > 0);

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
    const { groupTtsBehavior, ...catalogTarget } = target;
    retainedTargets.push({ ...catalogTarget, ttsBehavior: groupTtsBehavior });
    uncovered.delete(key);
  }
  selectedUnits.push({ ...chosen.unit, targets: retainedTargets });
}

selectedUnits.sort((left, right) => left.order - right.order);
const emittedRows = selectedUnits
  .map(({ order: _order, ...unit }) => `  ${JSON.stringify(unit)},`)
  .join('\n');

const output = `/* eslint-disable max-lines */
// 此檔由 scripts/generate-shou-zhu-dai-tu-audit.mjs 依核准主檔機械產生。
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

type ShouZhuDaiTuAuditRow = {
  questionId: string;
  speechUnitId: string;
  source: string;
  text: string;
  targets: PronunciationTarget[];
};

const rows: ShouZhuDaiTuAuditRow[] = [
${emittedRows}
];

export const SHOU_ZHU_DAI_TU_PRONUNCIATION_AUDIT_CATALOG: PronunciationAuditCatalogItem[] =
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
      id: \`shouzhudaitu-\${row.speechUnitId}\`,
      lessonId: 'shou-zhu-dai-tu',
      lessonNumber: 4,
      lessonTitle: '守株待兔',
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
        `${target.character}（第 ${target.occurrence} 個，${target.homophoneCue}，${target.zhuyin}，${target.usage}）`,
    )
    .join('；');
  return `${index + 1}. \`shouzhudaitu-${unit.speechUnitId}\`｜${unit.source}
   - 完整代表句：${unit.text}
   - targets：${targets}`;
});

fs.writeFileSync(
  reportPath,
  `# 第四篇《守株待兔》正式多音字實聽第一階段

> lessonId：\`shou-zhu-dai-tu\`
>
> 教材主檔：\`04-guwen-shouzhudaitu-decoder-content.md\`
>
> 原始播放白名單語音單元：${rawUnits.length} 個
>
> 合併完全相同文字後：${exactUnits.length} 個
>
> 含多音字的 exact 語音單元：${targetUnits.length} 個
>
> 減量後完整代表句：${selectedUnits.length} 句
>
> 不重複讀音群組／代表 targets：${targetCount} 個
>
> 掃描範圍只包含任務開場、原文、App 引導語、古文線索與破解白話、題目／任務、選項／卡片、答對回饋及第一次答錯提示。詳解、出處、成人資料、學習目標、故事畫面、正解／排序結果、白話卷軸、完成畫面與徽章均已排除。
>
> 以下只建立待真人實聽候選，不代表任何 target 念錯，也不建立孩子端讀音提示。

${reportRows.join('\n\n')}
`,
  'utf8',
);

console.log(
  `Scanned ${rawUnits.length} whitelist units (${exactUnits.length} exact unique); selected ${selectedUnits.length} representative units covering ${targetCount} pronunciation groups.`,
);
