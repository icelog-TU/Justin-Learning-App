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

const ids = new Set<string>();

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
  }

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

const sample = GUWEN_PRONUNCIATION_AUDIT_CATALOG[0];
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
