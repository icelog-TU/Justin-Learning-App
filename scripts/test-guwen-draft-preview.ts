import fs from 'node:fs';
import path from 'node:path';
import {
  DRAFT_SOURCES,
  draftQuestionIndexByNumber,
  parseDraftQuestions,
  resolveDraftSource,
} from '../src/lib/guwenDraftPreview';

let failed = false;

const thirdLessonPathIndex = DRAFT_SOURCES.findIndex((source) => source.path === '03-guwen-kezhouqiujian-decoder-content.md');
if (resolveDraftSource('03-guwen-kezhouqiujian-decoder-content.md', null).index !== thirdLessonPathIndex) {
  failed = true;
  console.error('  ERROR: active MD 路徑沒有正確定位到第三篇');
}
if (resolveDraftSource(null, 'ke-zhou-qiu-jian').index !== thirdLessonPathIndex) {
  failed = true;
  console.error('  ERROR: 舊 lessonId 連結不再相容第三篇');
}
if (resolveDraftSource('not-a-real-active-master.md', null).index !== undefined) {
  failed = true;
  console.error('  ERROR: 無效 active MD 路徑仍默默退回第一篇');
}
if (!resolveDraftSource('not-a-real-active-master.md', null).error) {
  failed = true;
  console.error('  ERROR: 無效 active MD 路徑沒有回報錯誤');
}
if (resolveDraftSource('03-guwen-kezhouqiujian-decoder-content.md', 'wrong-legacy-id').index !== thirdLessonPathIndex) {
  failed = true;
  console.error('  ERROR: 同時提供參數時沒有優先採用 active MD 路徑');
}
if (resolveDraftSource('not-a-real-active-master.md', 'ke-zhou-qiu-jian').index !== undefined) {
  failed = true;
  console.error('  ERROR: 無效 active MD 路徑被舊 lessonId 掩蓋');
}
if (resolveDraftSource(null, null).index !== 0) {
  failed = true;
  console.error('  ERROR: 未指定教材時無法開啟預覽首頁');
}

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

const thirdLessonMarkdown = fs.readFileSync(path.resolve('03-guwen-kezhouqiujian-decoder-content.md'), 'utf8');
const thirdLessonQuestions = parseDraftQuestions(thirdLessonMarkdown);
const thirdLessonQuestionFour = thirdLessonQuestions.find((item) => item.number === 4);
const thirdLessonQuestionFive = thirdLessonQuestions.find((item) => item.number === 5);
const thirdLessonQuestionEight = thirdLessonQuestions.find((item) => item.number === 8);
const thirdLessonQuestionSixteen = thirdLessonQuestions.find((item) => item.number === 16);
const thirdLessonQuestionNineteen = thirdLessonQuestions.find((item) => item.number === 19);
const thirdLessonQuestionTwenty = thirdLessonQuestions.find((item) => item.number === 20);
if (thirdLessonQuestions.length !== 20 || thirdLessonQuestions.at(-1)?.number !== 20) {
  failed = true;
  console.error('  ERROR: 第三篇沒有依新版題數控制保留第 1～20 題');
}
const expectedExplanationParts = [
  '第一條線索中，碗原本在手中',
  '第二條線索中，算袋原本也在手中',
  '兩條線索共同出現的位置變化',
  '【墜】＝從原來的位置往下掉',
  '這把鑰匙說明的是移動方向',
];
for (const expected of expectedExplanationParts) {
  if (!thirdLessonQuestionFour?.explanation?.text.includes(expected)) {
    failed = true;
    console.error(`  ERROR: 第三篇第 4 題詳解沒有完整抓到「${expected}」`);
  }
}
if (thirdLessonQuestionFour?.key) {
  failed = true;
  console.error('  ERROR: 第三篇第 4 題的成人編輯欄位被誤顯示為孩子端密碼鑰匙');
}
const expectedQuestionFiveKeys = [
  ['其劍', '前面那位楚國人的劍'],
  ['自舟中', '從船裡'],
  ['墜', '從原來的位置往下掉'],
  ['於水', '到水裡'],
];
expectedQuestionFiveKeys.forEach(([code, decodedEvidence], index) => {
  const actual = thirdLessonQuestionFive?.preAnswerKeys[index];
  if (actual?.code.text !== code || actual.decodedEvidence.text !== decodedEvidence) {
    failed = true;
    console.error(`  ERROR: 第三篇第 5 題沒有正確抓到第 ${index + 1} 把作答前密碼鑰匙`);
  }
});
if (thirdLessonQuestionEight?.preAnswerKeys.some((key) => key.code.text === '原文密碼')) {
  failed = true;
  console.error('  ERROR: 第三篇第 8 題把密碼表標題誤當成一把鑰匙');
}

const fifthLessonMarkdown = fs.readFileSync(path.resolve('05-guwen-yamiaozhuzhang-decoder-content.md'), 'utf8');
const fifthLessonQuestionNine = parseDraftQuestions(fifthLessonMarkdown).find((item) => item.number === 9);
const expectedQuestionNineKeys = [
  ['芒芒然歸', '疲累地回家'],
  ['謂其人曰', '對家人說'],
  ['今日病矣', '今天真是累壞了'],
  ['予', '說話者自己，相當於「我」'],
];
if (
  fifthLessonQuestionNine?.preAnswerKeys.length !== expectedQuestionNineKeys.length
  || expectedQuestionNineKeys.some(([code, decodedEvidence], index) => {
    const actual = fifthLessonQuestionNine?.preAnswerKeys[index];
    return actual?.code.text !== code || actual.decodedEvidence.text !== decodedEvidence;
  })
) {
  failed = true;
  console.error('  ERROR: 第五篇第 9 題沒有排除「原文／密碼鑰匙」表頭，或未正確抓到四把鑰匙');
}

const arbitraryKeyHeaderExample = parseDraftQuestions(`
# 第 1 題｜測試任意密碼表頭
## 作答前可見的密碼鑰匙
| 任意表頭 | 另一個任意表頭 |
|---|---|
| 其 | 他 |
`);
if (
  arbitraryKeyHeaderExample[0]?.preAnswerKeys.length !== 1
  || arbitraryKeyHeaderExample[0].preAnswerKeys[0]?.code.text !== '其'
) {
  failed = true;
  console.error('  ERROR: 成人預覽解析器只能排除已知欄名，未依 Markdown 表格結構排除表頭');
}

if (
  thirdLessonQuestionSixteen?.title !== '破解「不亦……乎」'
  || thirdLessonQuestionSixteen.clues.length !== 2
  || thirdLessonQuestionSixteen.clues.some((clue) => !/不亦/.test(clue.text))
  || thirdLessonQuestionSixteen.preAnswerKeys.length !== 0
) {
  failed = true;
  console.error('  ERROR: 第三篇第 16 題混入封存區或其他題目的線索／鑰匙');
}
if (
  thirdLessonQuestionNineteen?.kind !== 'sequence'
  || thirdLessonQuestionNineteen.sequenceCards.length !== 5
  || thirdLessonQuestionNineteen.sequenceCorrectOrder.join('') !== 'CEDAB'
) {
  failed = true;
  console.error('  ERROR: 第三篇第 19 題沒有解析成五張事件卡與 CEDAB 正確順序');
}
if (
  thirdLessonQuestionTwenty?.kind !== 'multiselect'
  || thirdLessonQuestionTwenty.multiSelectOptions.length !== 6
  || thirdLessonQuestionTwenty.multiSelectOptions
    .flatMap((option, index) => option.correct ? [index + 1] : [])
    .join(',') !== '1,4,6'
) {
  failed = true;
  console.error('  ERROR: 第三篇第 20 題沒有解析成六項多選題與 1、4、6 正解');
}
for (const source of DRAFT_SOURCES) {
  const markdown = fs.readFileSync(path.resolve(source.path), 'utf8');
  for (const question of parseDraftQuestions(markdown)) {
    if (/---|<a\b/i.test(question.explanation?.text ?? '')) {
      failed = true;
      console.error(`  ERROR: ${source.path} 第 ${question.number} 題詳解混入 Markdown 導航標記`);
    }
  }
}

const canonicalKeyExample = parseDraftQuestions(`
# 第 1 題（測試）｜正式鑰匙欄位

## 本題取得的密碼鑰匙（作答後才顯示）

> 【測】＝正式作答後鑰匙
`)[0];
if (canonicalKeyExample?.key?.text !== '【測】＝正式作答後鑰匙') {
  failed = true;
  console.error('  ERROR: 正式作答後密碼鑰匙欄位沒有正確解析');
}

const archivedBoundaryExample = parseDraftQuestions(`
# 第 1 題（已核准）｜現行第一題
## 孩子端｜麻煩古文破譯家幫忙
現行引導
### 線索一
> 現行線索一
### 線索二
> 現行線索二
## 請古文破譯家提交解法
現行問題
## 選項
1. 甲
2. 乙
## 正確答案
1. 甲
## 答對回饋
> 正確
<details>
<summary>舊版封存</summary>
### 線索一
> 不得混入的封存線索
</details>
## 舊版第二題以後
### 線索二
> 也不得混入的封存線索
<a id="question-2"></a>
# 第 2 題（已核准）｜現行第二題
## 孩子端｜麻煩古文破譯家幫忙
第二題引導
## 請古文破譯家提交解法
第二題問題
## 選項
1. 甲
2. 乙
## 正確答案
1. 甲
## 答對回饋
> 正確
`);
if (
  archivedBoundaryExample[0]?.clues.length !== 2
  || archivedBoundaryExample[0].clues.some((clue) => /封存/.test(clue.text))
  || archivedBoundaryExample[1]?.number !== 2
) {
  failed = true;
  console.error('  ERROR: 成人預覽解析器沒有正確排除封存題目區段');
}

const seventhLessonSource = DRAFT_SOURCES.find((source) => source.lessonId === 'zheng-ren-mai-lv');
if (!seventhLessonSource) {
  failed = true;
  console.error('  ERROR: 找不到第七篇鄭人買履的成人預覽來源');
} else {
  const markdown = fs.readFileSync(path.resolve(seventhLessonSource.path), 'utf8');
  const questions = parseDraftQuestions(markdown);
  const questionIndex = draftQuestionIndexByNumber(questions, 10);
  if (questions[questionIndex]?.number !== 10) {
    failed = true;
    console.error('  ERROR: questionNumber=10 沒有對應到第七篇第十題');
  }
}

if (failed) process.exit(1);
