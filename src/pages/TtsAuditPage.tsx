import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  GUWEN_PRONUNCIATION_AUDIT_CATALOG,
  type PronunciationAuditCatalogItem,
  type PronunciationAuditStatus,
} from '../data/guwenPronunciationAudit';
import {
  cancelSpeech,
  getSelectedSpeechVoiceDetails,
  getTtsInput,
  speak,
} from '../lib/speech';
import {
  buildTargetFingerprint,
  buildUtteranceFingerprint,
} from '../lib/ttsAuditFingerprint';
import {
  decisionForTarget,
  pendingTargetStatuses,
  submittedTargetDecisions,
  summarizeTargetStatuses,
  targetDecisionKey,
  type TargetDecisionStatus,
} from '../lib/ttsAuditDecision';
import {
  fetchCentralAuditDatabase,
  latestCurrentAuditResult,
  submitAuditResults,
  type AuditEnvironment,
  type CloudAuditDatabase,
  type CloudAuditResult,
} from '../lib/ttsAuditCloud';

type AuditItem = PronunciationAuditCatalogItem & {
  status: PronunciationAuditStatus;
  targetStatuses: Record<string, TargetDecisionStatus>;
  note: string;
  checkedAt?: string;
  cloudSyncedAt?: string;
  cloudReceiptId?: string;
};

type StoredAudit = {
  version: 4;
  items: AuditItem[];
};

type SyncState = 'idle' | 'saving' | 'saved' | 'error';

const STORAGE_KEY = 'guwen-tts-audit-v1';
const DEVICE_ID_KEY = 'guwen-tts-audit-device-v1';

const STATUS_META: Record<PronunciationAuditStatus, { label: string; className: string }> = {
  pending: { label: '待確認', className: 'border-slate-300 bg-slate-50 text-slate-600' },
  correct: { label: '念對', className: 'border-emerald-500 bg-emerald-50 text-emerald-700' },
  incorrect: { label: '念錯', className: 'border-rose-500 bg-rose-50 text-rose-700' },
};

function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `tts-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getDeviceId(): string {
  const existing = window.localStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;
  const next = createId();
  window.localStorage.setItem(DEVICE_ID_KEY, next);
  return next;
}

function cloneCatalog(): AuditItem[] {
  return GUWEN_PRONUNCIATION_AUDIT_CATALOG.map((item) => ({
    ...item,
    status: 'pending',
    targetStatuses: pendingTargetStatuses(item.targets),
    note: '',
  }));
}

function legacyItemToAudit(item: Partial<AuditItem> & { id: string; source: string; text: string }): AuditItem {
  const catalogItem = GUWEN_PRONUNCIATION_AUDIT_CATALOG.find((candidate) => candidate.id === item.id);
  if (catalogItem) {
    const fingerprintMatches = item.utteranceFingerprint === catalogItem.utteranceFingerprint;
    const savedStatuses =
      fingerprintMatches && item.targetStatuses
        ? item.targetStatuses
        : fingerprintMatches && catalogItem.targets.length === 1 && item.status && item.status !== 'pending'
          ? {
              [targetDecisionKey(catalogItem.targets[0])]: item.status,
            }
          : pendingTargetStatuses(catalogItem.targets);
    return {
      ...catalogItem,
      status: summarizeTargetStatuses(catalogItem.targets, savedStatuses),
      targetStatuses: savedStatuses,
      note: fingerprintMatches ? (item.note ?? '') : '',
      checkedAt: fingerprintMatches ? item.checkedAt : undefined,
      cloudSyncedAt: fingerprintMatches ? item.cloudSyncedAt : undefined,
      cloudReceiptId: fingerprintMatches ? item.cloudReceiptId : undefined,
    };
  }

  const targets = item.targets ?? [];
  const auditRevision = item.auditRevision ?? 1;
  const displayText = item.displayText ?? item.text;
  const ttsInput = getTtsInput(displayText);
  return {
    id: item.id,
    lessonId: item.lessonId ?? 'unassigned',
    lessonNumber: item.lessonNumber ?? 999,
    lessonTitle: item.lessonTitle ?? '待分類',
    questionId: item.questionId ?? 'unassigned',
    speechUnitId: item.speechUnitId ?? item.id,
    source: item.source,
    text: item.text,
    displayText,
    ttsInput,
    auditRevision,
    targetFingerprint: buildTargetFingerprint(targets),
    utteranceFingerprint: buildUtteranceFingerprint({
      displayText,
      ttsInput,
      targets,
      auditRevision,
    }),
    target: item.target ?? '',
    intendedReading: item.intendedReading ?? '',
    targets: item.targets ?? [],
    initialVerifications: item.initialVerifications ?? [],
    status: item.status ?? 'pending',
    targetStatuses: item.targetStatuses ?? pendingTargetStatuses(targets),
    note: item.note ?? '',
    checkedAt: item.checkedAt,
    cloudSyncedAt: item.cloudSyncedAt,
    cloudReceiptId: item.cloudReceiptId,
  };
}

function loadItems(): AuditItem[] {
  const defaults = cloneCatalog();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as { version?: number; items?: Array<Partial<AuditItem> & { id: string; source: string; text: string }> };
    if (!Array.isArray(parsed.items)) return defaults;

    const catalogIds = new Set(GUWEN_PRONUNCIATION_AUDIT_CATALOG.map((item) => item.id));
    const stored = parsed.items
      .map(legacyItemToAudit)
      .filter(
        (item) =>
          catalogIds.has(item.id) ||
          item.lessonId === 'unassigned' ||
          Object.values(item.targetStatuses).some((status) => status !== 'pending'),
      );
    const storedIds = new Set(stored.map((item) => item.id));
    return [...defaults.filter((item) => !storedIds.has(item.id)), ...stored];
  } catch {
    return defaults;
  }
}

function formatStatus(status: PronunciationAuditStatus): string {
  if (status === 'correct') return '念對，不需加註';
  if (status === 'incorrect') return '念錯，需要處理';
  return '待實聽';
}

function allResults(database: CloudAuditDatabase | null, itemId: string): CloudAuditResult[] {
  if (!database) return [];
  return database.lessons.flatMap((lesson) => lesson.items[itemId]?.results ?? []);
}

export default function TtsAuditPage() {
  const [items, setItems] = useState<AuditItem[]>(loadItems);
  const [draft, setDraft] = useState('');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [syncStates, setSyncStates] = useState<Record<string, SyncState>>({});
  const [database, setDatabase] = useState<CloudAuditDatabase | null>(null);
  const [databaseState, setDatabaseState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [databaseError, setDatabaseError] = useState('');
  const [lastReceipt, setLastReceipt] = useState('');
  const stopSequenceRef = useRef(false);
  const migrationSyncRef = useRef(false);

  const zhTwVoices = useMemo(
    () => voices.filter((voice) => voice.lang.toLowerCase() === 'zh-tw'),
    [voices],
  );
  const selectedVoice = useMemo(() => getSelectedSpeechVoiceDetails(voices), [voices]);

  const environment = useCallback(
    (): AuditEnvironment => ({
      deviceId: getDeviceId(),
      userAgent: navigator.userAgent,
      language: navigator.language,
      zhTwVoiceNames: zhTwVoices.map((voice) => voice.name),
      selectedVoice,
    }),
    [selectedVoice, zhTwVoices],
  );

  const refreshDatabase = useCallback(async () => {
    try {
      const next = await fetchCentralAuditDatabase();
      setDatabase(next);
      setDatabaseState('ready');
      setDatabaseError('');
    } catch (error) {
      setDatabaseState('error');
      setDatabaseError(error instanceof Error ? error.message : '中央資料庫讀取失敗');
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 4, items } satisfies StoredAudit));
  }, [items]);

  useEffect(() => {
    void refreshDatabase();
  }, [refreshDatabase]);

  useEffect(() => {
    if (!database) return;
    setItems((current) =>
      current.map((item) => {
        if (
          item.lessonId === 'unassigned' ||
          Object.values(item.targetStatuses).some((status) => status !== 'pending')
        ) {
          return item;
        }
        const central = latestCurrentAuditResult(item, allResults(database, item.id));
        if (!central) return item;
        const targetStatuses = Object.fromEntries(
          item.targets.map((target) => [
            targetDecisionKey(target),
            decisionForTarget(target, central.targetResults) ??
              (item.targets.length === 1 ? central.status : 'pending'),
          ]),
        ) as Record<string, TargetDecisionStatus>;
        return {
          ...item,
          targetStatuses,
          status: summarizeTargetStatuses(item.targets, targetStatuses),
          checkedAt: central.checkedAt,
          cloudSyncedAt: new Date(central.receivedAt).toISOString(),
          cloudReceiptId: central.resultId,
        };
      }),
    );
  }, [database]);

  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const refreshVoices = () => setVoices(window.speechSynthesis.getVoices());
    refreshVoices();
    window.speechSynthesis.addEventListener('voiceschanged', refreshVoices);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', refreshVoices);
      cancelSpeech();
    };
  }, []);

  const counts = useMemo(
    () =>
      items.reduce(
        (result, item) => {
          result[item.status] += 1;
          return result;
        },
        { pending: 0, correct: 0, incorrect: 0 },
      ),
    [items],
  );

  const centralCounts = useMemo(() => {
    if (!database) return { correct: 0, incorrect: 0, stale: 0, missing: 0, orphan: 0, items: 0 };
    const cloudItems = new Map(
      database.lessons.flatMap((lesson) =>
        Object.values(lesson.items).map((item) => [item.id, item] as const),
      ),
    );
    const catalogIds = new Set(GUWEN_PRONUNCIATION_AUDIT_CATALOG.map((item) => item.id));
    const result = GUWEN_PRONUNCIATION_AUDIT_CATALOG.reduce(
      (result, item) => {
        const cloudItem = cloudItems.get(item.id);
        if (!cloudItem) {
          result.missing += 1;
          result.items += 1;
          return result;
        }
        const latest = latestCurrentAuditResult(item, cloudItem.results);
        if (latest?.status === 'correct') result.correct += 1;
        else if (latest?.status === 'incorrect') result.incorrect += 1;
        else if (cloudItem.results.length) result.stale += 1;
        result.items += 1;
        return result;
      },
      { correct: 0, incorrect: 0, stale: 0, missing: 0, orphan: 0, items: 0 },
    );
    result.orphan = [...cloudItems.keys()].filter((id) => !catalogIds.has(id)).length;
    return result;
  }, [database]);

  const updateItem = (id: string, patch: Partial<AuditItem>) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const syncTestedItems = useCallback(
    async (testedItems: AuditItem[]) => {
      const eligible = testedItems.filter(
        (item): item is AuditItem & { status: 'correct' | 'incorrect'; checkedAt: string } =>
          item.lessonId !== 'unassigned' &&
          GUWEN_PRONUNCIATION_AUDIT_CATALOG.some(
            (catalogItem) =>
              catalogItem.id === item.id &&
              catalogItem.utteranceFingerprint === item.utteranceFingerprint,
          ) &&
          submittedTargetDecisions(item.targets, item.targetStatuses) !== null &&
          item.status !== 'pending' &&
          Boolean(item.checkedAt),
      );
      if (!eligible.length) return;

      setSyncStates((current) => ({
        ...current,
        ...Object.fromEntries(eligible.map((item) => [item.id, 'saving' as const])),
      }));

      try {
        const receipt = await submitAuditResults(
          eligible.map((item) => ({
            item:
              GUWEN_PRONUNCIATION_AUDIT_CATALOG.find(
                (catalogItem) => catalogItem.id === item.id,
              ) ?? item,
            status: item.status,
            targetResults: submittedTargetDecisions(item.targets, item.targetStatuses) ?? [],
            note: item.note,
            checkedAt: item.checkedAt,
          })),
          environment(),
        );
        const syncedAt = new Date(receipt.receivedAt).toISOString();
        const receiptId = receipt.submissionIds.join('、');
        setItems((current) =>
          current.map((item) =>
            eligible.some((eligibleItem) => eligibleItem.id === item.id)
              ? { ...item, cloudSyncedAt: syncedAt, cloudReceiptId: receiptId }
              : item,
          ),
        );
        setSyncStates((current) => ({
          ...current,
          ...Object.fromEntries(eligible.map((item) => [item.id, 'saved' as const])),
        }));
        setLastReceipt(receiptId);
        await refreshDatabase();
      } catch (error) {
        setSyncStates((current) => ({
          ...current,
          ...Object.fromEntries(eligible.map((item) => [item.id, 'error' as const])),
        }));
        setDatabaseState('error');
        setDatabaseError(error instanceof Error ? error.message : '結果尚未回傳');
      }
    },
    [environment, refreshDatabase],
  );

  useEffect(() => {
    if (databaseState !== 'ready' || migrationSyncRef.current) return;
    const locallyTestedButUnsynced = items.filter(
      (item) => item.status !== 'pending' && !item.cloudSyncedAt,
    );
    migrationSyncRef.current = true;
    if (locallyTestedButUnsynced.length) void syncTestedItems(locallyTestedButUnsynced);
  }, [databaseState, items, syncTestedItems]);

  const markStatus = (id: string, status: PronunciationAuditStatus) => {
    const checkedAt = status === 'pending' ? undefined : new Date().toISOString();
    const next = items.find((item) => item.id === id);
    if (!next) return;
    const updated: AuditItem = {
      ...next,
      status,
      checkedAt,
      cloudSyncedAt: undefined,
      cloudReceiptId: undefined,
    };
    updateItem(id, updated);
    const canSync = updated.lessonId !== 'unassigned';
    setSyncStates((current) => ({
      ...current,
      [id]: status === 'pending' || !canSync ? 'idle' : 'saving',
    }));
    if (status !== 'pending' && canSync) void syncTestedItems([updated]);
  };

  const markTargetStatus = (
    id: string,
    targetKey: string,
    status: TargetDecisionStatus,
  ) => {
    const current = items.find((item) => item.id === id);
    if (!current) return;
    const targetStatuses = { ...current.targetStatuses, [targetKey]: status };
    const itemStatus = summarizeTargetStatuses(current.targets, targetStatuses);
    const checkedAt = itemStatus === 'pending' ? undefined : new Date().toISOString();
    const updated: AuditItem = {
      ...current,
      targetStatuses,
      status: itemStatus,
      checkedAt,
      cloudSyncedAt: undefined,
      cloudReceiptId: undefined,
    };
    updateItem(id, updated);
    setSyncStates((states) => ({
      ...states,
      [id]: itemStatus === 'pending' ? 'idle' : 'saving',
    }));
    if (itemStatus !== 'pending') void syncTestedItems([updated]);
  };

  const playOne = (item: AuditItem, onEnd?: () => void) => {
    stopSequenceRef.current = true;
    setPlayingId(item.id);
    speak(item.text, () => {
      setPlayingId(null);
      onEnd?.();
    });
  };

  const playAll = () => {
    if (!items.length) return;
    stopSequenceRef.current = false;
    const playAt = (index: number) => {
      if (stopSequenceRef.current || index >= items.length) {
        setPlayingId(null);
        return;
      }
      const item = items[index];
      setPlayingId(item.id);
      speak(item.text, () => playAt(index + 1));
    };
    playAt(0);
  };

  const stopPlaying = () => {
    stopSequenceRef.current = true;
    cancelSpeech();
    setPlayingId(null);
  };

  const addLines = () => {
    const lines = draft
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (!lines.length) return;
    setItems((current) => [
      ...current,
      ...lines.map((text, index): AuditItem => {
        const id = `${createId()}-${index}`;
        const targets: PronunciationAuditCatalogItem['targets'] = [];
        const ttsInput = getTtsInput(text);
        const auditRevision = 1;
        return {
          id,
          lessonId: 'unassigned',
          lessonNumber: 999,
          lessonTitle: '待分類',
          questionId: 'unassigned',
          speechUnitId: id,
          source: '自行新增',
          text,
          displayText: text,
          ttsInput,
          auditRevision,
          targetFingerprint: buildTargetFingerprint(targets),
          utteranceFingerprint: buildUtteranceFingerprint({
            displayText: text,
            ttsInput,
            targets,
            auditRevision,
          }),
          target: '',
          intendedReading: '',
          targets,
          initialVerifications: [],
          status: 'pending',
          targetStatuses: {},
          note: '',
        };
      }),
    ]);
    setDraft('');
  };

  const restoreDefaults = () => {
    const existingIds = new Set(items.map((item) => item.id));
    const missing = cloneCatalog().filter((item) => !existingIds.has(item.id));
    if (missing.length) setItems((current) => [...missing, ...current]);
  };

  const removeItem = (id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  };

  const resultText = () => {
    const testedAt = new Date().toLocaleString('zh-TW', { hour12: false });
    const voiceNames = zhTwVoices.length
      ? zhTwVoices.map((voice) => `${voice.name}（${voice.lang}）`).join('、')
      : '未讀取到明確的 zh-TW 聲音名稱';
    const lines = [
      '# 多音字 TTS 實聽結果',
      '',
      `- 測試時間：${testedAt}`,
      '- 正式 App 語音設定：zh-TW；系統自動選擇聲音',
      `- 本裝置可見的 zh-TW 聲音：${voiceNames}`,
      `- 裝置／瀏覽器：${navigator.userAgent}`,
      `- 中央回傳編號：${lastReceipt || '尚未取得'}`,
      '',
    ];

    (['incorrect', 'correct', 'pending'] as const).forEach((status) => {
      const matching = items.filter((item) => item.status === status);
      lines.push(`## ${formatStatus(status)}（${matching.length}）`, '');
      if (!matching.length) {
        lines.push('- 無', '');
        return;
      }
      matching.forEach((item) => {
        lines.push(`- 篇章：第 ${item.lessonNumber} 篇《${item.lessonTitle}》`);
        lines.push(`  - 來源：${item.source}`);
        lines.push(`  - 完整句子：${item.text}`);
        lines.push(`  - 候選字：${item.target || '未填'}`);
        lines.push(`  - 正確讀音：${item.intendedReading || '未填'}`);
        if (item.note) lines.push(`  - 備註：${item.note}`);
        lines.push('');
      });
    });
    return lines.join('\n');
  };

  const copyResults = async () => {
    try {
      await navigator.clipboard.writeText(resultText());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <p className="text-xs font-bold tracking-[0.18em] text-teal-700">教材編輯工具</p>
        <h2 className="text-2xl font-black text-slate-800">多音字 TTS 實聽台</h2>
        <p className="text-sm leading-6 text-slate-600">
          這裡和正式 App 使用同一套朗讀與修音規則。點選「念對」或「念錯」後，結果會直接回傳到中央資料庫。
        </p>
      </header>

      <section
        className={`rounded-2xl border p-4 text-sm ${
          databaseState === 'error'
            ? 'border-rose-200 bg-rose-50 text-rose-800'
            : 'border-teal-100 bg-teal-50 text-teal-900'
        }`}
      >
        <p className="font-bold">中央資料庫</p>
        {databaseState === 'loading' && <p className="mt-1">正在連線並讀取既有紀錄……</p>}
        {databaseState === 'ready' && (
          <>
            <p className="mt-1">
              已連線｜正式候選 {centralCounts.items}｜有效念對 {centralCounts.correct}｜有效念錯{' '}
              {centralCounts.incorrect}｜待複驗 {centralCounts.stale}｜中央缺少 {centralCounts.missing}
              {centralCounts.orphan > 0 ? `｜孤兒紀錄 ${centralCounts.orphan}` : ''}
            </p>
            {lastReceipt && <p className="mt-1 break-all text-xs">本次回傳編號：{lastReceipt}</p>}
            {database && database.lessons.length > 0 && (
              <details className="mt-3 rounded-xl bg-white/70 p-3">
                <summary className="cursor-pointer font-bold">查看按篇章整理的中央紀錄</summary>
                <div className="mt-2 space-y-2">
                  {database.lessons
                    .slice()
                    .sort((a, b) => a.lessonNumber - b.lessonNumber)
                    .map((lesson) => {
                      const lessonItems = Object.values(lesson.items);
                      const lessonCatalog = GUWEN_PRONUNCIATION_AUDIT_CATALOG.filter(
                        (item) => item.lessonId === lesson.lessonId,
                      );
                      const effective = lessonCatalog.map((item) => {
                        const cloudItem = lesson.items[item.id];
                        return cloudItem ? latestCurrentAuditResult(item, cloudItem.results) : null;
                      });
                      const correct = effective.filter((result) => result?.status === 'correct').length;
                      const incorrect = effective.filter((result) => result?.status === 'incorrect').length;
                      const stale = lessonCatalog.filter((item) => {
                        const cloudItem = lesson.items[item.id];
                        return (
                          Boolean(cloudItem?.results.length) &&
                          !latestCurrentAuditResult(item, cloudItem.results)
                        );
                      }).length;
                      return (
                        <p key={lesson.lessonId} className="text-xs">
                          第 {lesson.lessonNumber} 篇《{lesson.lessonTitle}》：{lessonItems.length} 個語音單元；
                          有效念對 {correct}，有效念錯 {incorrect}，待複驗 {stale}
                        </p>
                      );
                    })}
                </div>
              </details>
            )}
          </>
        )}
        {databaseState === 'error' && (
          <>
            <p className="mt-1">尚未成功回傳：{databaseError}</p>
            <button type="button" onClick={() => void refreshDatabase()} className="mt-2 font-bold underline">
              重新連線
            </button>
          </>
        )}
      </section>

      <section className="rounded-2xl border border-teal-100 bg-teal-50 p-4 text-sm text-teal-900">
        <p className="font-bold">目前語音環境</p>
        <p className="mt-1">
          語言：zh-TW｜實際選擇：
          {selectedVoice.selection === 'explicit'
            ? selectedVoice.name
            : '瀏覽器未提供名稱，使用未解析的系統預設'}
        </p>
        <p className="mt-1 break-words text-xs text-teal-700">
          這台裝置可見的臺灣中文聲音：
          {zhTwVoices.length ? zhTwVoices.map((voice) => voice.name).join('、') : '尚未讀取到名稱'}
        </p>
      </section>

      <section className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-white p-3 text-center shadow-sm">
          <div className="text-2xl font-black text-slate-600">{counts.pending}</div>
          <div className="text-xs text-slate-500">待確認</div>
        </div>
        <div className="rounded-2xl bg-emerald-50 p-3 text-center shadow-sm">
          <div className="text-2xl font-black text-emerald-700">{counts.correct}</div>
          <div className="text-xs text-emerald-700">念對</div>
        </div>
        <div className="rounded-2xl bg-rose-50 p-3 text-center shadow-sm">
          <div className="text-2xl font-black text-rose-700">{counts.incorrect}</div>
          <div className="text-xs text-rose-700">念錯</div>
        </div>
      </section>

      <section className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={playAll}
          disabled={!items.length}
          className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-700 disabled:bg-slate-300"
        >
          依序播放全部
        </button>
        <button
          type="button"
          onClick={stopPlaying}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          停止播放
        </button>
        <button
          type="button"
          onClick={() => void syncTestedItems(items)}
          disabled={!items.some((item) => item.status !== 'pending')}
          className="rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-sky-700 disabled:bg-slate-300"
        >
          重新同步全部結果
        </button>
        <button
          type="button"
          onClick={copyResults}
          className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-600"
        >
          {copied ? '結果已複製' : '複製備份'}
        </button>
      </section>

      <section className="space-y-3">
        {items.map((item, index) => {
          const centralResults = allResults(database, item.id);
          const central = latestCurrentAuditResult(item, centralResults);
          const hasStaleCentralResult = !central && centralResults.length > 0;
          const syncState = syncStates[item.id] ?? (item.cloudSyncedAt ? 'saved' : 'idle');
          return (
            <article
              key={item.id}
              className={`rounded-2xl border bg-white p-4 shadow-sm transition ${
                playingId === item.id ? 'border-teal-500 ring-2 ring-teal-100' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-teal-700">
                    {index + 1}. {item.source}
                  </p>
                  <p className="mt-2 text-lg font-semibold leading-8 text-slate-800">{item.text}</p>
                </div>
                <button
                  type="button"
                  onClick={() => playOne(item)}
                  className="shrink-0 rounded-xl bg-slate-800 px-3 py-2 text-sm font-bold text-white hover:bg-slate-900"
                >
                  {playingId === item.id ? '播放中…' : '播放'}
                </button>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <label className="text-xs font-semibold text-slate-600">
                  候選字
                  <input
                    type="text"
                    value={item.target}
                    onChange={(event) => updateItem(item.id, { target: event.target.value })}
                    readOnly={item.lessonId !== 'unassigned'}
                    placeholder="例如：中"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal text-slate-800 outline-none read-only:bg-slate-50 focus:border-teal-400"
                  />
                </label>
                <label className="text-xs font-semibold text-slate-600">
                  正確讀音
                  <input
                    type="text"
                    value={item.intendedReading}
                    onChange={(event) => updateItem(item.id, { intendedReading: event.target.value })}
                    readOnly={item.lessonId !== 'unassigned'}
                    placeholder="例如：鐘（ㄓㄨㄥ）"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal text-slate-800 outline-none read-only:bg-slate-50 focus:border-teal-400"
                  />
                </label>
              </div>

              {item.targets.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {item.targets.map((target) => {
                    const key = targetDecisionKey(target);
                    const targetStatus = item.targetStatuses[key] ?? 'pending';
                    return (
                      <div key={key} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-sm font-bold text-slate-700">
                          「{target.character}」第 {target.occurrence} 處｜正確讀音：
                          {target.homophoneCue}（{target.zhuyin}）
                        </p>
                        <div
                          className="mt-2 flex flex-wrap gap-2"
                          role="group"
                          aria-label={`「${target.character}」第 ${target.occurrence} 處實聽結果`}
                        >
                          {(Object.keys(STATUS_META) as TargetDecisionStatus[]).map((status) => (
                            <button
                              key={status}
                              type="button"
                              onClick={() => markTargetStatus(item.id, key, status)}
                              className={`rounded-full border px-3 py-1.5 text-sm font-bold ${
                                targetStatus === status
                                  ? STATUS_META[status].className
                                  : 'border-slate-200 bg-white text-slate-400 hover:bg-slate-50'
                              }`}
                            >
                              {STATUS_META[status].label}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {item.status === 'pending' && item.targets.length > 1 && (
                    <p className="text-xs font-semibold text-amber-700">
                      這句有多個多音字；每一個都選完後才會回傳中央資料庫。
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="臨時實聽結果">
                  {(Object.keys(STATUS_META) as PronunciationAuditStatus[]).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => markStatus(item.id, status)}
                      className={`rounded-full border px-3 py-1.5 text-sm font-bold ${
                        item.status === status
                          ? STATUS_META[status].className
                          : 'border-slate-200 bg-white text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      {STATUS_META[status].label}
                    </button>
                  ))}
                </div>
              )}

              <p
                className={`mt-2 text-xs font-semibold ${
                  syncState === 'error'
                    ? 'text-rose-600'
                    : syncState === 'saved'
                      ? 'text-emerald-700'
                      : 'text-slate-500'
                }`}
              >
                {syncState === 'saving' && '正在回傳中央資料庫……'}
                {syncState === 'saved' && '已回傳中央資料庫'}
                {syncState === 'error' && '回傳失敗；可再點一次結果或使用「重新同步全部結果」'}
                {syncState === 'idle' &&
                  item.lessonId === 'unassigned' &&
                  '待分類句只保存在本機；加入正式候選檔後才可回傳'}
                {syncState === 'idle' &&
                  item.lessonId !== 'unassigned' &&
                  central &&
                  `中央有效紀錄：${formatStatus(central.status)}`}
                {syncState === 'idle' &&
                  item.lessonId !== 'unassigned' &&
                  hasStaleCentralResult &&
                  '中央只有舊版本結果；文字、TTS 輸入或目標位置已無法核對，待複驗'}
                {syncState === 'idle' &&
                  item.lessonId !== 'unassigned' &&
                  !central &&
                  !hasStaleCentralResult &&
                  '尚無中央紀錄'}
              </p>

              <label className="mt-3 block text-xs font-semibold text-slate-600">
                備註
                <input
                  type="text"
                  value={item.note}
                  onChange={(event) => updateItem(item.id, { note: event.target.value })}
                  placeholder="例如：把「中」念成第四聲"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal text-slate-800 outline-none focus:border-teal-400"
                />
              </label>

              <details className="mt-3 text-xs text-slate-500">
                <summary className="cursor-pointer font-semibold">查看實際送入 TTS 的文字</summary>
                <div className="mt-2 space-y-1 break-words rounded-lg bg-slate-50 p-2">
                  <p>{item.ttsInput}</p>
                  <p className="font-mono text-[10px] text-slate-400">
                    指紋：{item.utteranceFingerprint}
                  </p>
                </div>
              </details>

              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="mt-3 text-xs font-semibold text-slate-400 underline decoration-slate-300 underline-offset-2 hover:text-rose-600"
              >
                從本機測試清單移除
              </button>
            </article>
          );
        })}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="font-bold text-slate-800">一次加入更多句子</h3>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          每行貼一個完整語音單元。這裡只供臨時試聽，不會回傳中央資料庫；古文對話必須先把整批句子與每個多音字的正確讀音寫入正式 catalog、部署後，才會成為可回傳的正式候選。
        </p>
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={6}
          placeholder={'其劍自舟中墜於水。\n椀自手中墜地。'}
          className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm leading-6 text-slate-800 outline-none focus:border-teal-400"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={addLines}
            disabled={!draft.trim()}
            className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-700 disabled:bg-slate-300"
          >
            加入測試清單
          </button>
          <button
            type="button"
            onClick={restoreDefaults}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            補回正式測試句
          </button>
        </div>
      </section>

      <p className="text-xs leading-5 text-slate-500">
        本機仍保留離線備份；中央資料庫與孩子的學習進度完全分開。裝置、瀏覽器或語音套件更新後，請重新實聽。
      </p>
    </div>
  );
}
