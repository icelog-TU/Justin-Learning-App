import assert from "node:assert/strict";
import fs from "node:fs";
import { guwenLessons, totalGuwenLessonItems } from "../src/data/guwenLesson";
import { ziXiangMaoDunLesson } from "../src/data/ziXiangMaoDunLesson";
import { parseDraftQuestions } from "../src/lib/guwenDraftPreview";

const activeMaster = fs.readFileSync(
  new URL("../10-guwen-zixiangmaodun-decoder-content.md", import.meta.url),
  "utf8",
);
const approvedQuestions = parseDraftQuestions(activeMaster);

assert.equal(ziXiangMaoDunLesson.id, "zi-xiang-mao-dun");
assert.equal(ziXiangMaoDunLesson.contentRevision, "2026-07-30-approved-20");
assert.equal(
  guwenLessons[9]?.id,
  ziXiangMaoDunLesson.id,
  "第十篇必須排在正式 App 的第十個位置",
);
assert.equal(approvedQuestions.length, 20, "active 主檔應解析出 20 題");
assert(
  approvedQuestions.every((question) => question.status === "已核准"),
  "第十篇 active 主檔的 20 題都必須已核准",
);
assert(
  approvedQuestions.every((question) => question.diagnostics.length === 0),
  "第十篇 active 主檔不得有預覽解析診斷",
);
assert.equal(
  ziXiangMaoDunLesson.steps.length,
  19,
  "第 1–19 題應是一般作答 step",
);
assert.equal(
  totalGuwenLessonItems(ziXiangMaoDunLesson),
  20,
  "第 20 題應以證據多選 closing 計入總題數",
);
assert.equal(ziXiangMaoDunLesson.sequenceOrderingClosing, undefined);
assert.equal(ziXiangMaoDunLesson.causalChainClosing, undefined);
assert.equal(
  ziXiangMaoDunLesson.evidenceMultiSelectClosing?.id,
  "closing_evidence_multiselect",
);
assert.equal(ziXiangMaoDunLesson.preserveAuthoredOptionOrder, true);
assert.equal(ziXiangMaoDunLesson.badgeClaimMode, "scroll-end");
assert.equal(ziXiangMaoDunLesson.badgeName, "矛楯檢驗徽章");

assert.equal(
  ziXiangMaoDunLesson.sentences.join(""),
  ziXiangMaoDunLesson.fullText,
  "分句接合後必須逐字等於本課採用原文",
);
assert.equal(
  ziXiangMaoDunLesson.fullText,
  "楚人有鬻楯與矛者，譽之曰：「吾楯之堅，物莫能陷也。」又譽其矛曰：「吾矛之利，於物無不陷也。」或曰：「以子之矛，陷子之楯，何如？」其人弗能應也。夫不可陷之楯，與無不陷之矛，不可同世而立。",
  "正式 App 原文必須逐字保留核准版本",
);

for (let index = 0; index < ziXiangMaoDunLesson.steps.length; index += 1) {
  const step = ziXiangMaoDunLesson.steps[index];
  const approved = approvedQuestions[index];
  assert.equal(
    step.targetSentence,
    approved.target?.text,
    `${step.id} 的本輪處理句子未同步核准主檔`,
  );
  assert.equal(
    step.intro,
    approved.intro?.text,
    `${step.id} 的孩子端引導語未同步核准主檔`,
  );
  assert.equal(
    step.question,
    approved.question?.text,
    `${step.id} 的提問未同步核准主檔`,
  );
  assert.deepEqual(
    step.options,
    approved.options.map((option) => option.text),
    `${step.id} 的選項未同步核准主檔`,
  );
  assert.equal(
    step.correctIndex,
    approved.correctIndex,
    `${step.id} 的正解位置未同步核准主檔`,
  );
  assert.equal(
    step.correctFeedback,
    approved.correctFeedback?.text,
    `${step.id} 的核心解答未同步核准主檔`,
  );
  assert.equal(
    step.retryHint,
    approved.retryHint?.text,
    `${step.id} 的答錯提示未同步核准主檔`,
  );
  assert.equal(
    step.explanation,
    approved.explanation?.text,
    `${step.id} 的詳解未同步核准主檔`,
  );
  assert.deepEqual(
    step.keys?.map((key) => [key.code, key.decodedEvidence]) ?? [],
    approved.preAnswerKeys.map((key) => [
      key.code.text,
      key.decodedEvidence.text,
    ]),
    `${step.id} 的作答前密碼鑰匙未同步核准主檔`,
  );
  if (approved.clues.length > 0) {
    assert.equal(
      step.type,
      "evidence",
      `${step.id} 有線索時必須是 evidence 題型`,
    );
    if (step.type !== "evidence") continue;
    approved.clues.forEach((clue, clueIndex) => {
      assert.equal(
        step.clues[clueIndex]?.text,
        clue.text,
        `${step.id} 線索 ${clueIndex + 1} 原文未同步`,
      );
      assert.equal(
        step.clues[clueIndex]?.unlockedMeaning,
        clue.meaning?.text,
        `${step.id} 線索白話未同步`,
      );
      assert.equal(
        step.clues[clueIndex]?.source,
        clue.source?.text,
        `${step.id} 線索出處未同步`,
      );
    });
  }
}

const q20 = approvedQuestions[19];
assert.equal(
  ziXiangMaoDunLesson.evidenceMultiSelectClosing?.intro,
  q20.intro?.text,
  "第 20 題引導語未同步",
);
assert.deepEqual(
  ziXiangMaoDunLesson.evidenceMultiSelectClosing?.options.map((option) => [
    option.correct,
    option.text,
  ]),
  q20.multiSelectOptions.map((option) => [option.correct, option.text]),
  "第 20 題多選卡順序或正解未同步",
);
assert.equal(
  ziXiangMaoDunLesson.evidenceMultiSelectClosing?.correctFeedback,
  q20.correctFeedback?.text,
);
assert.equal(
  ziXiangMaoDunLesson.evidenceMultiSelectClosing?.retryHint,
  q20.retryHint?.text,
);
assert.equal(
  ziXiangMaoDunLesson.evidenceMultiSelectClosing?.finalNote,
  q20.explanation?.text,
);

const requiredIds = [
  ...ziXiangMaoDunLesson.steps.map((step) => step.id),
  "closing_evidence_multiselect",
];
assert.deepEqual(
  ziXiangMaoDunLesson.finalVerification.prerequisiteStepIds,
  requiredIds,
  "白話卷軸必須等全部 20 題完成",
);
assert.equal(
  ziXiangMaoDunLesson.finalVerification.translation,
  "有一個楚國人，在賣楯和矛。他誇獎自己的楯說：「我的楯很堅固，沒有任何東西能刺穿。」他又誇獎自己的矛說：「我的矛很鋒利，碰到任何東西都能刺穿。」有人問：「用你的矛刺你的楯，結果會怎樣？」那個人不能回答。不能被刺穿的楯，和沒有東西刺不穿的矛，不可能同時成立。",
  "白話驗證卷軸必須同步核准全文",
);
assert.equal(ziXiangMaoDunLesson.introPronunciationCues, undefined);
assert.equal(ziXiangMaoDunLesson.fullTextPronunciationCues, undefined);
assert.equal(ziXiangMaoDunLesson.sentencePronunciationCues, undefined);

console.log("第十篇《自相矛盾》App 資料驗證通過。");
