import assert from 'node:assert/strict';
import { GUWEN_PRONUNCIATION_AUDIT_CATALOG } from '../src/data/guwenPronunciationAudit';
import {
  getSelectedSpeechVoiceDetails,
  getTtsInput,
  selectZhTwVoice,
} from '../src/lib/speech';
import {
  buildTargetFingerprint,
  buildUtteranceFingerprint,
  isMatchingAuditFingerprint,
} from '../src/lib/ttsAuditFingerprint';
import {
  decisionForTarget,
  formatPronunciationCue,
  pendingTargetStatuses,
  submittedTargetDecisions,
  summarizeTargetStatuses,
  targetDecisionKey,
} from '../src/lib/ttsAuditDecision';

const ids = new Set<string>();
const wangRongGroupKeys = new Set<string>();
let wangRongItemCount = 0;
let wangRongTargetCount = 0;

for (const item of GUWEN_PRONUNCIATION_AUDIT_CATALOG) {
  assert(!ids.has(item.id), `重複的正式候選 ID：${item.id}`);
  ids.add(item.id);

  assert.equal(item.displayText, item.text, `${item.id} 的 displayText 與 text 不一致`);
  assert.equal(item.ttsInput, getTtsInput(item.displayText), `${item.id} 的 TTS 輸入已過期`);
  assert.equal(
    item.targetFingerprint,
    buildTargetFingerprint(item.targets),
    `${item.id} 的目標指紋已過期`,
  );
  assert.equal(
    item.utteranceFingerprint,
    buildUtteranceFingerprint(item),
    `${item.id} 的語音單元指紋已過期`,
  );

  for (const target of item.targets) {
    const occurrences = [...item.displayText].filter((character) => character === target.character).length;
    assert(
      target.occurrence >= 1 && target.occurrence <= occurrences,
      `${item.id} 找不到第 ${target.occurrence} 個「${target.character}」`,
    );
    if (item.lessonId === 'wang-rong-bu-qu-dao-pang-li') {
      const groupKey = `${target.character}|${target.zhuyin}|${target.usage}`;
      assert(!wangRongGroupKeys.has(groupKey), `第一篇有重複讀音群組：${groupKey}`);
      wangRongGroupKeys.add(groupKey);
      wangRongTargetCount += 1;
    }
  }
  if (item.lessonId === 'wang-rong-bu-qu-dao-pang-li') wangRongItemCount += 1;

  const current = {
    auditRevision: item.auditRevision,
    utteranceFingerprint: item.utteranceFingerprint,
    targetFingerprint: item.targetFingerprint,
    displayText: item.displayText,
    ttsInput: item.ttsInput,
  };
  assert(isMatchingAuditFingerprint(current, current), `${item.id} 的現行指紋應相符`);
  assert(
    !isMatchingAuditFingerprint(current, {}),
    `${item.id} 的無指紋舊結果不得被視為有效`,
  );
}

assert.equal(wangRongItemCount, 21, '第一篇減量後應有 21 個代表語音單元');
assert.equal(wangRongTargetCount, 41, '第一篇減量後應涵蓋 41 個讀音群組');
assert(
  GUWEN_PRONUNCIATION_AUDIT_CATALOG.every(
    (item) => item.lessonId === 'wang-rong-bu-qu-dao-pang-li',
  ),
  '正式實聽 catalog 目前只能包含第一篇《王戎不取道旁李》',
);

const sample = GUWEN_PRONUNCIATION_AUDIT_CATALOG[0];
const multiTargetSample = GUWEN_PRONUNCIATION_AUDIT_CATALOG.find(
  (item) => item.targets.length > 1,
);
assert(multiTargetSample, '測試 catalog 必須至少包含一個多目標整句');
const multiStatuses = pendingTargetStatuses(multiTargetSample.targets);
multiStatuses[targetDecisionKey(multiTargetSample.targets[0])] = 'correct';
assert.equal(
  summarizeTargetStatuses(multiTargetSample.targets, multiStatuses),
  'pending',
  '多目標整句未全部判定以前不得送出',
);
assert.equal(
  formatPronunciationCue({
    character: '中',
    occurrence: 1,
    zhuyin: 'ㄓㄨㄥ',
    homophoneCue: '鐘',
    usage: '裡面',
    cueMode: 'known_usage',
  }),
  '中，當作「裡面」時，念作鐘（ㄓㄨㄥ）。',
  '已知用法應產生完整的就近加註文字',
);
assert.equal(
  formatPronunciationCue({
    character: '度',
    occurrence: 1,
    zhuyin: 'ㄉㄨㄛˋ',
    homophoneCue: '墮',
    usage: '測量',
    cueMode: 'unresolved_target',
  }),
  '度，這裡念作墮（ㄉㄨㄛˋ）。',
  '待破解目標的提示不得洩漏字義',
);
multiStatuses[targetDecisionKey(multiTargetSample.targets[1])] = 'incorrect';
assert.equal(
  summarizeTargetStatuses(multiTargetSample.targets, multiStatuses),
  'incorrect',
  '任一目標念錯時整句摘要應為念錯',
);
const decisions = submittedTargetDecisions(multiTargetSample.targets, multiStatuses);
assert(decisions, '全部目標判定後應可建立送出資料');
assert.equal(
  decisionForTarget(multiTargetSample.targets[0], decisions),
  'correct',
  '同一句中念對的目標必須獨立保存',
);
assert.equal(
  decisionForTarget(multiTargetSample.targets[1], decisions),
  'incorrect',
  '同一句中念錯的目標必須獨立保存',
);
const baseInput = {
  displayText: sample.displayText,
  ttsInput: sample.ttsInput,
  targets: sample.targets,
  auditRevision: sample.auditRevision,
};
const baseFingerprint = buildUtteranceFingerprint(baseInput);

assert.notEqual(
  baseFingerprint,
  buildUtteranceFingerprint({ ...baseInput, displayText: `${sample.displayText}。` }),
  '顯示文字改動必須使結果失效',
);
assert.notEqual(
  baseFingerprint,
  buildUtteranceFingerprint({ ...baseInput, ttsInput: `${sample.ttsInput}。` }),
  'TTS 輸入改動必須使結果失效',
);
assert.notEqual(
  baseFingerprint,
  buildUtteranceFingerprint({
    ...baseInput,
    targets: sample.targets.map((target, index) =>
      index === 0 ? { ...target, occurrence: target.occurrence + 1 } : target,
    ),
  }),
  '目標字位置改動必須使結果失效',
);
assert.notEqual(
  baseFingerprint,
  buildUtteranceFingerprint({ ...baseInput, auditRevision: sample.auditRevision + 1 }),
  'audit revision 改動必須使結果失效',
);

const voices = [
  {
    default: false,
    lang: 'zh-TW',
    localService: true,
    name: 'B Voice',
    voiceURI: 'voice-b',
  },
  {
    default: true,
    lang: 'zh-TW',
    localService: false,
    name: 'Default Voice',
    voiceURI: 'voice-default',
  },
  {
    default: true,
    lang: 'en-US',
    localService: true,
    name: 'English Voice',
    voiceURI: 'voice-en',
  },
] as SpeechSynthesisVoice[];
assert.equal(selectZhTwVoice(voices)?.voiceURI, 'voice-default', '應優先選取預設的 zh-TW voice');
assert.equal(
  getSelectedSpeechVoiceDetails([]).selection,
  'unresolved_default',
  '沒有 voice 清單時必須明確標記未解析系統預設',
);

console.log(
  `TTS audit tests passed: ${GUWEN_PRONUNCIATION_AUDIT_CATALOG.length} catalog items and fingerprint invalidation rules verified.`,
);
