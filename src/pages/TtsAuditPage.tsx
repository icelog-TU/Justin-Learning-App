import { useEffect, useMemo, useRef, useState } from 'react';
import { cancelSpeech, getTtsInput, speak } from '../lib/speech';

type AuditStatus = 'pending' | 'correct' | 'incorrect';

type AuditItem = {
  id: string;
  source: string;
  text: string;
  target: string;
  intendedReading: string;
  status: AuditStatus;
  note: string;
  checkedAt?: string;
};

type StoredAudit = {
  version: 1;
  items: AuditItem[];
};

const STORAGE_KEY = 'guwen-tts-audit-v1';

const DEFAULT_ITEMS: AuditItem[] = [
  {
    id: 'kezhou-q3-nan',
    source: '《刻舟求劍》第三題｜App 引導語',
    text: '下一句出現了其劍，這真的很難懂：它該怎麼接回前面的故事？',
    target: '難',
    intendedReading: '南（ㄋㄢˊ）',
    status: 'pending',
    note: '',
  },
  {
    id: 'kezhou-q3-yi-classical',
    source: '《刻舟求劍》第三題｜古文線索一',
    text: '楊布換黑衣而歸，其狗不知而吠之。',
    target: '衣',
    intendedReading: '一（ㄧ）',
    status: 'pending',
    note: '',
  },
  {
    id: 'kezhou-q3-yi-modern',
    source: '《刻舟求劍》第三題｜線索一已破解白話',
    text: '楊布換穿黑衣回家，其狗沒有認出自己的主人，就向他叫。',
    target: '衣',
    intendedReading: '一（ㄧ）',
    status: 'pending',
    note: '',
  },
  {
    id: 'kezhou-q3-yu',
    source: '《刻舟求劍》第三題｜古文線索二',
    text: '楚人賣盾與矛，又譽其矛曰：「吾矛之利，於物無不陷也。」',
    target: '與',
    intendedReading: '雨（ㄩˇ）',
    status: 'pending',
    note: '',
  },
  {
    id: 'kezhou-q3-jia',
    source: '《刻舟求劍》第三題｜推理提問',
    text: '古文破譯家，哪一個假說能同時解開兩條線索中的其？',
    target: '假',
    intendedReading: '甲（ㄐㄧㄚˇ）',
    status: 'pending',
    note: '',
  },
  {
    id: 'kezhou-q4-zhong-original',
    source: '《刻舟求劍》第四題｜待破解目標句',
    text: '其劍自舟中墜於水。',
    target: '中',
    intendedReading: '鐘（ㄓㄨㄥ）',
    status: 'pending',
    note: '',
  },
  {
    id: 'kezhou-q4-zhong-di',
    source: '《刻舟求劍》第四題｜古文線索一',
    text: '椀自手中墜地。',
    target: '中、地',
    intendedReading: '鐘（ㄓㄨㄥ）；弟（ㄉㄧˋ）',
    status: 'pending',
    note: '',
  },
];

const STATUS_META: Record<AuditStatus, { label: string; className: string }> = {
  pending: { label: '待確認', className: 'border-slate-300 bg-slate-50 text-slate-600' },
  correct: { label: '念對', className: 'border-emerald-500 bg-emerald-50 text-emerald-700' },
  incorrect: { label: '念錯', className: 'border-rose-500 bg-rose-50 text-rose-700' },
};

function cloneDefaults(): AuditItem[] {
  return DEFAULT_ITEMS.map((item) => ({ ...item }));
}

function loadItems(): AuditItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return cloneDefaults();
    const parsed = JSON.parse(raw) as StoredAudit;
    if (parsed.version !== 1 || !Array.isArray(parsed.items)) return cloneDefaults();
    return parsed.items;
  } catch {
    return cloneDefaults();
  }
}

function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `tts-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function formatStatus(status: AuditStatus): string {
  if (status === 'correct') return '念對，不需加註';
  if (status === 'incorrect') return '念錯，需要處理';
  return '待實聽';
}

export default function TtsAuditPage() {
  const [items, setItems] = useState<AuditItem[]>(loadItems);
  const [draft, setDraft] = useState('');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const stopSequenceRef = useRef(false);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, items } satisfies StoredAudit));
  }, [items]);

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

  const zhTwVoices = useMemo(
    () => voices.filter((voice) => voice.lang.toLowerCase() === 'zh-tw'),
    [voices],
  );

  const updateItem = (id: string, patch: Partial<AuditItem>) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const markStatus = (id: string, status: AuditStatus) => {
    updateItem(id, {
      status,
      checkedAt: status === 'pending' ? undefined : new Date().toISOString(),
    });
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
      ...lines.map((text, index) => ({
        id: `${createId()}-${index}`,
        source: '自行新增',
        text,
        target: '',
        intendedReading: '',
        status: 'pending' as const,
        note: '',
      })),
    ]);
    setDraft('');
  };

  const restoreDefaults = () => {
    const existingIds = new Set(items.map((item) => item.id));
    const missing = cloneDefaults().filter((item) => !existingIds.has(item.id));
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
        lines.push(`- 來源：${item.source}`);
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
          這裡和正式 App 使用同一套朗讀與修音規則。請在孩子實際使用的裝置上播放完整句子，再標記念對或念錯。
        </p>
      </header>

      <section className="rounded-2xl border border-teal-100 bg-teal-50 p-4 text-sm text-teal-900">
        <p className="font-bold">目前語音環境</p>
        <p className="mt-1">語言：zh-TW｜聲音：由系統自動選擇，與正式 App 相同</p>
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
          onClick={copyResults}
          className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-600"
        >
          {copied ? '結果已複製' : '複製測試結果'}
        </button>
      </section>

      <section className="space-y-3">
        {items.map((item, index) => (
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
                  placeholder="例如：中"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal text-slate-800 outline-none focus:border-teal-400"
                />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                正確讀音
                <input
                  type="text"
                  value={item.intendedReading}
                  onChange={(event) => updateItem(item.id, { intendedReading: event.target.value })}
                  placeholder="例如：鐘（ㄓㄨㄥ）"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal text-slate-800 outline-none focus:border-teal-400"
                />
              </label>
            </div>

            <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="實聽結果">
              {(Object.keys(STATUS_META) as AuditStatus[]).map((status) => (
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
              <p className="mt-2 break-words rounded-lg bg-slate-50 p-2">{getTtsInput(item.text)}</p>
            </details>

            <button
              type="button"
              onClick={() => removeItem(item.id)}
              className="mt-3 text-xs font-semibold text-slate-400 underline decoration-slate-300 underline-offset-2 hover:text-rose-600"
            >
              移除這一句
            </button>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="font-bold text-slate-800">一次加入更多句子</h3>
        <p className="mt-1 text-xs leading-5 text-slate-500">每行貼一個完整語音單元。加入後可再填候選字與正確讀音。</p>
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
            補回預設測試句
          </button>
        </div>
      </section>

      <p className="text-xs leading-5 text-slate-500">
        測試結果只保存在這台裝置的瀏覽器中，不會更動孩子的學習進度。裝置、瀏覽器或語音套件更新後，請重新實聽。
      </p>
    </div>
  );
}
