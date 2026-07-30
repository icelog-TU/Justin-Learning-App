import fs from 'node:fs';
import path from 'node:path';
import {
  draftPreviewSwipeDelta,
  draftQuestionIndexByNumber,
  parseDraftQuestions,
  parseDraftSourcesFromProjectStatus,
  resolveDraftSource,
} from '../src/lib/guwenDraftPreview';

let failed = false;
const DRAFT_SOURCES = parseDraftSourcesFromProjectStatus(
  fs.readFileSync('GUWEN-PROJECT-STATUS.md', 'utf8'),
);

if (draftPreviewSwipeDelta({ x: 300, y: 200 }, { x: 120, y: 205 }) !== 1) {
  failed = true;
  console.error('  ERROR: 左滑沒有切換到下一題');
}
if (draftPreviewSwipeDelta({ x: 100, y: 200 }, { x: 260, y: 195 }) !== -1) {
  failed = true;
  console.error('  ERROR: 右滑沒有切換到上一題');
}
if (draftPreviewSwipeDelta({ x: 200, y: 100 }, { x: 205, y: 260 }) !== 0) {
  failed = true;
  console.error('  ERROR: 垂直捲動被誤判為換題手勢');
}

const thirdLessonPathIndex = DRAFT_SOURCES.findIndex((source) => source.path === '03-guwen-kezhouqiujian-decoder-content.md');
if (resolveDraftSource(DRAFT_SOURCES, '03-guwen-kezhouqiujian-decoder-content.md', null).index !== thirdLessonPathIndex) {
  failed = true;
  console.error('  ERROR: active MD 路徑沒有正確定位到第三篇');
}
if (resolveDraftSource(DRAFT_SOURCES, null, 'ke-zhou-qiu-jian').index !== thirdLessonPathIndex) {
  failed = true;
  console.error('  ERROR: 舊 lessonId 連結不再相容第三篇');
}
if (resolveDraftSource(DRAFT_SOURCES, 'not-a-real-active-master.md', null).index !== undefined) {
  failed = true;
  console.error('  ERROR: 無效 active MD 路徑仍默默退回第一篇');
}
if (!resolveDraftSource(DRAFT_SOURCES, 'not-a-real-active-master.md', null).error) {
  failed = true;
  console.error('  ERROR: 無效 active MD 路徑沒有回報錯誤');
}
if (resolveDraftSource(DRAFT_SOURCES, '03-guwen-kezhouqiujian-decoder-content.md', 'wrong-legacy-id').index !== thirdLessonPathIndex) {
  failed = true;
  console.error('  ERROR: 同時提供參數時沒有優先採用 active MD 路徑');
}
if (resolveDraftSource(DRAFT_SOURCES, 'not-a-real-active-master.md', 'ke-zhou-qiu-jian').index !== undefined) {
  failed = true;
  console.error('  ERROR: 無效 active MD 路徑被舊 lessonId 掩蓋');
}
if (resolveDraftSource(DRAFT_SOURCES, null, null).index !== 0) {
  failed = true;
  console.error('  ERROR: 未指定教材時無法開啟預覽首頁');
}

const tenthLessonPath = '10-guwen-zixiangmaodun-decoder-content.md';
const tenthLessonPathIndex = DRAFT_SOURCES.findIndex((source) => source.path === tenthLessonPath);
if (tenthLessonPathIndex !== 9 || resolveDraftSource(DRAFT_SOURCES, tenthLessonPath, null).index !== tenthLessonPathIndex) {
  failed = true;
  console.error('  ERROR: 第十篇沒有由跨篇進度表自動加入成人預覽目錄');
}

const hundredLessonSources = parseDraftSourcesFromProjectStatus(`
| 篇次 | 篇名 | Active 教材主檔 | 狀態 |
|---:|---|---|---|
| 100 | 百篇測試 | \`100-guwen-bai-pian-test-decoder-content.md\` | 草稿 |
| 10 | 第十測試 | \`10-guwen-tenth-test-decoder-content.md\` | 草稿 |
`);
if (
  hundredLessonSources.length !== 2
  || hundredLessonSources[0]?.title !== '第十篇｜第十測試'
  || hundredLessonSources[1]?.title !== '第一百篇｜百篇測試'
  || hundredLessonSources[1]?.path !== '100-guwen-bai-pian-test-decoder-content.md'
) {
  failed = true;
  console.error('  ERROR: 成人預覽目錄無法依篇次自動擴充到第一百篇');
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
    expected: ['嵇含', '錢澄之'],
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
  '碗和算袋原本都在手中',
  '分別到了下面的地面與水裡',
  '兩條線索共同顯示從原處往下移動',
  '「留在原處」沒有位置變化',
  '「從下面往上」則把方向說反了',
];
for (const expected of expectedExplanationParts) {
  if (!thirdLessonQuestionFour?.explanation?.text.includes(expected)) {
    failed = true;
    console.error(`  ERROR: 第三篇第 4 題詳解沒有完整抓到「${expected}」`);
  }
}
if (thirdLessonQuestionFour?.key?.text !== '【墜】表示從原來的位置往下掉。') {
  failed = true;
  console.error('  ERROR: 第三篇第 4 題沒有抓到最新版孩子端密碼鑰匙');
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

const sixthLessonMarkdown = fs.readFileSync(path.resolve('06-guwen-yanerdaozhong-decoder-content.md'), 'utf8');
const sixthLessonQuestionSix = parseDraftQuestions(sixthLessonMarkdown).find((item) => item.number === 6);
const expectedSixthLessonQuestionSixKeys = [
  ['欲', '想要'],
  ['負', '把東西放在背上背著'],
  ['走', '跑、跑開'],
  ['則', '會接出後面的結果'],
  ['不可', '不能'],
];
if (
  sixthLessonQuestionSix?.preAnswerKeys.length !== expectedSixthLessonQuestionSixKeys.length
  || expectedSixthLessonQuestionSixKeys.some(([code, decodedEvidence], index) => {
    const actual = sixthLessonQuestionSix?.preAnswerKeys[index];
    return actual?.code.text !== code || actual.decodedEvidence.text !== decodedEvidence;
  })
) {
  failed = true;
  console.error('  ERROR: 第六篇第 6 題沒有抓到五把段落式已取得密碼鑰匙');
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
  const questionOne = questions.find((item) => item.number === 1);
  if (
    questionOne?.target?.text !== '鄭人有欲買【履】者。'
    || questions.some((item) => /＝/.test(item.target?.text ?? ''))
  ) {
    failed = true;
    console.error('  ERROR: 第七篇舊格式「放回原文」的已取得鑰匙被提前混入待破解目標句');
  }
  const questionIndex = draftQuestionIndexByNumber(questions, 10);
  if (questions[questionIndex]?.number !== 10) {
    failed = true;
    console.error('  ERROR: questionNumber=10 沒有對應到第七篇第十題');
  }
  const questionTwo = questions.find((item) => item.number === 2);
  if (
    questionTwo?.correctFeedback?.text !== '破解了！「度」是測出長短、大小的動作；「度」當作測量時，念作墮（ㄉㄨㄛˋ），所以「度其足」就是量自己的腳有多大。'
    || questionTwo.correctFeedback.pronunciationCues
  ) {
    failed = true;
    console.error('  ERROR: 第七篇第二題的核心解答讀音說明應只保留在主文，不應拆成旁註讀音提示');
  }
}

if (failed) process.exit(1);
