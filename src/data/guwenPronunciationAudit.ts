export type PronunciationAuditStatus = 'pending' | 'correct' | 'incorrect';

export type PronunciationTarget = {
  character: string;
  occurrence: number;
  zhuyin: string;
  homophoneCue: string;
  usage: string;
};

export type PronunciationVerification = {
  status: Exclude<PronunciationAuditStatus, 'pending'>;
  verifiedDate: string;
  environmentLabel: string;
  evidence: string;
};

export type PronunciationAuditCatalogItem = {
  id: string;
  lessonId: string;
  lessonNumber: number;
  lessonTitle: string;
  questionId: string;
  speechUnitId: string;
  source: string;
  text: string;
  target: string;
  intendedReading: string;
  targets: PronunciationTarget[];
  initialVerifications: PronunciationVerification[];
};

const USER_CONFIRMED_CORRECT: PronunciationVerification[] = [
  {
    status: 'correct',
    verifiedDate: '2026-07-26',
    environmentLabel: '孩子實際使用的裝置（裝置與聲音名稱尚未回傳）',
    evidence: '教材編輯者在多音字 TTS 實聽台逐項播放後，於對話中確認七個測試項目全部念對。',
  },
];

/**
 * 《古文破譯家》正式多音字語音單元資料庫。
 *
 * 新增教材候選時，必須先在這裡建立穩定 ID 與完整語音單元，再交給
 * /#/tts-audit 實聽。實聽結果另寫入 Firestore 中央資料庫，不得只存在聊天或
 * 瀏覽器 localStorage。
 */
export const GUWEN_PRONUNCIATION_AUDIT_CATALOG: PronunciationAuditCatalogItem[] = [
  {
    id: 'kezhou-q3-nan',
    lessonId: '03-kezhouqiujian',
    lessonNumber: 3,
    lessonTitle: '刻舟求劍',
    questionId: 'question-3',
    speechUnitId: 'q3-intro-nan',
    source: '《刻舟求劍》第三題｜App 引導語',
    text: '下一句出現了其劍，這真的很難懂：它該怎麼接回前面的故事？',
    target: '難',
    intendedReading: '南（ㄋㄢˊ）',
    targets: [{ character: '難', occurrence: 1, zhuyin: 'ㄋㄢˊ', homophoneCue: '南', usage: '不容易' }],
    initialVerifications: USER_CONFIRMED_CORRECT,
  },
  {
    id: 'kezhou-q3-yi-classical',
    lessonId: '03-kezhouqiujian',
    lessonNumber: 3,
    lessonTitle: '刻舟求劍',
    questionId: 'question-3',
    speechUnitId: 'q3-clue-1-classical',
    source: '《刻舟求劍》第三題｜古文線索一',
    text: '楊布換黑衣而歸，其狗不知而吠之。',
    target: '衣',
    intendedReading: '一（ㄧ）',
    targets: [{ character: '衣', occurrence: 1, zhuyin: 'ㄧ', homophoneCue: '一', usage: '衣服' }],
    initialVerifications: USER_CONFIRMED_CORRECT,
  },
  {
    id: 'kezhou-q3-yi-modern',
    lessonId: '03-kezhouqiujian',
    lessonNumber: 3,
    lessonTitle: '刻舟求劍',
    questionId: 'question-3',
    speechUnitId: 'q3-clue-1-unlocked',
    source: '《刻舟求劍》第三題｜線索一已破解白話',
    text: '楊布換穿黑衣回家，其狗沒有認出自己的主人，就向他叫。',
    target: '衣',
    intendedReading: '一（ㄧ）',
    targets: [{ character: '衣', occurrence: 1, zhuyin: 'ㄧ', homophoneCue: '一', usage: '衣服' }],
    initialVerifications: USER_CONFIRMED_CORRECT,
  },
  {
    id: 'kezhou-q3-yu',
    lessonId: '03-kezhouqiujian',
    lessonNumber: 3,
    lessonTitle: '刻舟求劍',
    questionId: 'question-3',
    speechUnitId: 'q3-clue-2-classical',
    source: '《刻舟求劍》第三題｜古文線索二',
    text: '楚人賣盾與矛，又譽其矛曰：「吾矛之利，於物無不陷也。」',
    target: '與',
    intendedReading: '雨（ㄩˇ）',
    targets: [{ character: '與', occurrence: 1, zhuyin: 'ㄩˇ', homophoneCue: '雨', usage: '和' }],
    initialVerifications: USER_CONFIRMED_CORRECT,
  },
  {
    id: 'kezhou-q3-jia',
    lessonId: '03-kezhouqiujian',
    lessonNumber: 3,
    lessonTitle: '刻舟求劍',
    questionId: 'question-3',
    speechUnitId: 'q3-question-jia',
    source: '《刻舟求劍》第三題｜推理提問',
    text: '古文破譯家，哪一個假說能同時解開兩條線索中的其？',
    target: '假',
    intendedReading: '甲（ㄐㄧㄚˇ）',
    targets: [
      { character: '假', occurrence: 1, zhuyin: 'ㄐㄧㄚˇ', homophoneCue: '甲', usage: '根據證據提出的解法' },
    ],
    initialVerifications: USER_CONFIRMED_CORRECT,
  },
  {
    id: 'kezhou-q4-zhong-original',
    lessonId: '03-kezhouqiujian',
    lessonNumber: 3,
    lessonTitle: '刻舟求劍',
    questionId: 'question-4',
    speechUnitId: 'q4-target-sentence',
    source: '《刻舟求劍》第四題｜待破解目標句',
    text: '其劍自舟中墜於水。',
    target: '中',
    intendedReading: '鐘（ㄓㄨㄥ）',
    targets: [{ character: '中', occurrence: 1, zhuyin: 'ㄓㄨㄥ', homophoneCue: '鐘', usage: '裡面' }],
    initialVerifications: USER_CONFIRMED_CORRECT,
  },
  {
    id: 'kezhou-q4-zhong-di',
    lessonId: '03-kezhouqiujian',
    lessonNumber: 3,
    lessonTitle: '刻舟求劍',
    questionId: 'question-4',
    speechUnitId: 'q4-clue-1-classical',
    source: '《刻舟求劍》第四題｜古文線索一',
    text: '椀自手中墜地。',
    target: '中、地',
    intendedReading: '鐘（ㄓㄨㄥ）；弟（ㄉㄧˋ）',
    targets: [
      { character: '中', occurrence: 1, zhuyin: 'ㄓㄨㄥ', homophoneCue: '鐘', usage: '裡面' },
      { character: '地', occurrence: 1, zhuyin: 'ㄉㄧˋ', homophoneCue: '弟', usage: '地面' },
    ],
    initialVerifications: USER_CONFIRMED_CORRECT,
  },
];
