import { Fragment, useEffect, useRef, useState } from 'react';
import { useAppDataContext } from '../lib/AppDataContext';
import {
  buildCuratedPool,
  buildMoePool,
  buildEditorialPool,
  buildCustomPool,
  buildCharZhuyinMap,
  findCandidates,
  findByWord,
  matchesTarget,
  maskHint,
  rankHintCandidates,
  pickRandomStart,
  qualityLevel,
  type ChainEntry,
  type MoeRawEntry,
  type EditorialRawEntry,
} from '../lib/chainGame';
import {
  COIN_PER_CHAIN_LINK,
  STAR_PER_CHAIN_LINK,
  CHAIN_MILESTONE_INTERVAL,
  CHAIN_MILESTONE_BONUS_COINS,
  CHAIN_MILESTONE_BONUS_STARS,
} from '../lib/rewards';
import { speak } from '../lib/speech';
import { buildIdiomSearchUrl } from '../lib/googleSearch';

interface MinimalSpeechRecognition {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionCtor = new () => MinimalSpeechRecognition;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  const w = window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

interface Feedback {
  type: 'success' | 'error' | 'info';
  message: string;
}

const MOE_ATTRIBUTION = '資料來源：教育部《成語典》（創用CC 姓名標示－禁止改作 3.0 台灣授權條款）';
const HINT_COUNT_OPTIONS = [3, 6, 9, 12];
const LEVEL_BADGE: Record<1 | 2 | 3, { icon: string; label: string; className: string }> = {
  3: { icon: '🥇', label: '精選', className: 'bg-amber-100 text-amber-700' },
  2: { icon: '🥈', label: '常見', className: 'bg-slate-100 text-slate-600' },
  1: { icon: '🥉', label: '罕見', className: 'bg-orange-50 text-orange-500' },
};

/** First page, last page, and up to 3 pages around `current` (all 0-based) — for a compact page-jump bar. */
function pageWindow(current: number, total: number): number[] {
  if (total <= 0) return [];
  const pages = new Set<number>([0, total - 1]);
  for (let p = current - 1; p <= current + 1; p++) {
    if (p >= 0 && p < total) pages.add(p);
  }
  return Array.from(pages).sort((a, b) => a - b);
}

export default function IdiomChainGame() {
  const { data, reward, addChainLink, reportChainLength, addCustomIdiom, toggleBookmark, recordChainRound } =
    useAppDataContext();
  const [pool, setPool] = useState<ChainEntry[]>(() => [
    ...buildCuratedPool(),
    ...buildCustomPool(data.customIdioms),
  ]);
  const [extraLoaded, setExtraLoaded] = useState(false);
  const [targetChar, setTargetChar] = useState('');
  const [targetZhuyin, setTargetZhuyin] = useState('');
  const [chainHistory, setChainHistory] = useState<ChainEntry[]>([]);
  const [usedIds, setUsedIds] = useState<Set<string>>(new Set());
  const [inputValue, setInputValue] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [hintPool, setHintPool] = useState<ChainEntry[]>([]);
  const [hintPage, setHintPage] = useState(0);
  const [hintCount, setHintCount] = useState(3);
  const [prioritizeQuality, setPrioritizeQuality] = useState(true);
  const [addCandidate, setAddCandidate] = useState<string | null>(null);
  const [newMeaning, setNewMeaning] = useState('');
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<MinimalSpeechRecognition | null>(null);
  const speechSupported = getSpeechRecognitionCtor() !== null;

  const chainHistoryRef = useRef(chainHistory);
  chainHistoryRef.current = chainHistory;

  function startNewChain(fromPool: ChainEntry[]) {
    const start = pickRandomStart(fromPool);
    setTargetChar(start.firstChar);
    setTargetZhuyin(start.firstZhuyin);
    setChainHistory([]);
    setUsedIds(new Set());
    setInputValue('');
    setHintPool([]);
    setHintPage(0);
    setHintCount(3);
    setPrioritizeQuality(true);
    setAddCandidate(null);
    setNewMeaning('');
    setFeedback(null);
  }

  useEffect(() => {
    let cancelled = false;
    const base = import.meta.env.BASE_URL;

    const loadJson = <T,>(path: string): Promise<T | null> =>
      fetch(`${base}${path}`)
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error('fetch failed'))))
        .catch(() => null);

    Promise.all([
      loadJson<MoeRawEntry[]>('data/moe-idioms.json'),
      loadJson<EditorialRawEntry[]>('data/editorial-idioms.json'),
    ]).then(([moeRaw, editorialRaw]) => {
      if (cancelled) return;
      const fullPool = [
        ...pool,
        ...(moeRaw ? buildMoePool(moeRaw) : []),
        ...(editorialRaw ? buildEditorialPool(editorialRaw) : []),
      ];
      setPool(fullPool);
      setExtraLoaded(true);
      // The very first target character (picked below, before this data arrives) only had our small
      // hand-curated set to draw from. Re-roll it once the full ~9,800-word pool is ready, but only
      // if Justin hasn't chained anything yet — don't yank the target out from under an active game.
      if (chainHistoryRef.current.length === 0) {
        startNewChain(fullPool);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    startNewChain(pool);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (chainHistoryRef.current.length > 0) {
        recordChainRound(chainHistoryRef.current.map((entry) => entry.word));
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (targetChar) speak(targetChar);
  }, [targetChar]);

  const candidates = targetChar ? findCandidates(pool, usedIds, targetChar, targetZhuyin) : [];
  const deadEnd = targetChar !== '' && candidates.length === 0;

  function handleReroll() {
    if (chainHistory.length > 0) {
      reportChainLength(chainHistory.length);
      recordChainRound(chainHistory.map((entry) => entry.word));
    }
    startNewChain(pool);
  }

  function handleSubmit() {
    const raw = inputValue.trim();
    if (!raw) return;

    const entry = findByWord(pool, raw);
    if (!entry) {
      const canAdd = raw.length === 4 && raw[0] === targetChar;
      setFeedback({ type: 'error', message: '這個成語我們的題庫裡還沒有喔，換一個試試看？' });
      setAddCandidate(canAdd ? raw : null);
      return;
    }
    setAddCandidate(null);
    if (usedIds.has(entry.id)) {
      setFeedback({ type: 'error', message: '這個成語已經接過了，換一個吧！' });
      return;
    }
    if (!matchesTarget(entry, targetChar, targetZhuyin)) {
      setFeedback({
        type: 'error',
        message: `「${entry.word}」的開頭要接得上「${targetChar}」（同字或同音）才行喔，再想想！`,
      });
      return;
    }

    const nextHistory = [...chainHistory, entry];
    const nextUsedIds = new Set(usedIds);
    nextUsedIds.add(entry.id);
    addChainLink();

    const isMilestone = nextHistory.length % CHAIN_MILESTONE_INTERVAL === 0;
    const totalCoins = COIN_PER_CHAIN_LINK + (isMilestone ? CHAIN_MILESTONE_BONUS_COINS : 0);
    const totalStars = STAR_PER_CHAIN_LINK + (isMilestone ? CHAIN_MILESTONE_BONUS_STARS : 0);
    reward(totalCoins, totalStars, { big: isMilestone });

    setChainHistory(nextHistory);
    setUsedIds(nextUsedIds);
    setTargetChar(entry.lastChar);
    setTargetZhuyin(entry.lastZhuyin);
    setInputValue('');
    setHintPool([]);
    setHintPage(0);
    setAddCandidate(null);
    setNewMeaning('');
    setFeedback({
      type: 'success',
      message: isMilestone
        ? `🎉 接了 ${nextHistory.length} 個成語，額外獎勵 🪙${totalCoins}、⭐${totalStars}！`
        : `✅ 接對了！獲得 🪙${totalCoins}、⭐${totalStars}`,
    });
  }

  function handleHint(count: number = hintCount, quality: boolean = prioritizeQuality) {
    if (candidates.length === 0) {
      setFeedback({ type: 'info', message: '這個字暫時接不下去了，換一個新的開頭字試試吧！' });
      return;
    }
    setHintCount(count);
    setPrioritizeQuality(quality);
    setHintPool(rankHintCandidates(candidates, targetChar, targetZhuyin, quality));
    setHintPage(0);
  }

  const totalHintPages = hintPool.length > 0 ? Math.ceil(hintPool.length / hintCount) : 0;
  const hintEntries = hintPool.slice(hintPage * hintCount, hintPage * hintCount + hintCount);

  function goToHintPage(page: number) {
    setHintPage(Math.max(0, Math.min(page, totalHintPages - 1)));
  }

  function handleAddCustomIdiom() {
    if (!addCandidate) return;
    const word = addCandidate;
    const lastChar = word[word.length - 1];
    const charMap = buildCharZhuyinMap(pool);
    const newEntry = {
      word,
      meaning: newMeaning.trim(),
      firstChar: targetChar,
      firstZhuyin: targetZhuyin,
      lastChar,
      lastZhuyin: charMap[lastChar] ?? '',
      addedAt: new Date().toISOString(),
    };
    addCustomIdiom(newEntry);
    setPool((prev) => [
      ...prev,
      {
        id: `custom-${word}`,
        word,
        meaning: newEntry.meaning,
        source: 'custom' as const,
        firstChar: newEntry.firstChar,
        firstZhuyin: newEntry.firstZhuyin,
        lastChar: newEntry.lastChar,
        lastZhuyin: newEntry.lastZhuyin,
      },
    ]);
    setAddCandidate(null);
    setNewMeaning('');
    setInputValue(word);
    setFeedback({ type: 'info', message: `✅ 已經把「${word}」加進你的題庫了，再按一次「送出」就可以接龍！` });
  }

  function startListening() {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;
    const recognition = new Ctor();
    recognition.lang = 'zh-TW';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputValue(transcript.replace(/[，。！？\s、]/g, ''));
    };
    recognition.onerror = () => {
      setListening(false);
      setFeedback({ type: 'info', message: '語音辨識沒有成功，可以再說一次，或改用打字輸入喔！' });
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    setFeedback(null);
    recognition.start();
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  function isBookmarked(word: string): boolean {
    return data.bookmarkedIdioms.some((b) => b.word === word);
  }

  function handleToggleBookmark(entry: ChainEntry) {
    toggleBookmark({
      word: entry.word,
      meaning: entry.meaning,
      source: entry.source,
      addedAt: new Date().toISOString(),
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-800">成語接龍</h2>
        <p className="text-sm text-gray-500">
          接一個開頭是這個字、或是<span className="font-semibold text-teal-600">讀音相同</span>的成語，可以無限接下去！
        </p>
        <p className="text-xs text-gray-400 mt-1">
          題庫共 {pool.length} 個成語{!extraLoaded && '（教育部成語資料載入中…）'}
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow p-6 text-center space-y-3">
        <p className="text-xs text-gray-400">請接一個成語，開頭是……</p>
        <button
          type="button"
          onClick={() => targetChar && speak(targetChar)}
          className="text-5xl font-extrabold text-teal-600 mx-auto flex items-center justify-center gap-2"
          aria-label="再聽一次發音"
          title="再聽一次發音"
        >
          {targetChar}
          <span className="text-xl">🔊</span>
        </button>
        <p className="text-xs text-gray-400">（讀音：{targetZhuyin}）</p>

        {deadEnd && (
          <p className="text-sm text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
            這個字題庫裡暫時接不下去了，可以點下面「換新的開頭字」繼續玩！
          </p>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="輸入成語..."
            className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-teal-300"
          />
          {speechSupported && (
            <button
              type="button"
              onClick={listening ? stopListening : startListening}
              className={`shrink-0 rounded-xl px-4 text-xl ${
                listening ? 'bg-red-500 text-white animate-pulse' : 'bg-teal-100 text-teal-700'
              }`}
              aria-label="語音輸入"
            >
              🎤
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={inputValue.trim().length === 0}
          className="w-full bg-teal-500 disabled:bg-gray-300 text-white rounded-full py-2.5 font-medium hover:bg-teal-600"
        >
          送出
        </button>

        {feedback && (
          <p
            className={`text-sm font-medium rounded-lg px-3 py-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-700'
                : feedback.type === 'error'
                  ? 'bg-red-50 text-red-600'
                  : 'bg-amber-50 text-amber-700'
            }`}
          >
            {feedback.message}
          </p>
        )}

        {addCandidate && (
          <div className="bg-amber-50 rounded-xl p-4 text-left space-y-2">
            <p className="text-sm text-gray-700">
              要把「<span className="font-bold text-amber-700">{addCandidate}</span>」加進你的題庫嗎？
            </p>
            <input
              type="text"
              value={newMeaning}
              onChange={(e) => setNewMeaning(e.target.value)}
              placeholder="這個成語的意思（可以留空）"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAddCustomIdiom}
                className="flex-1 bg-amber-500 text-white rounded-full py-2 text-sm font-medium hover:bg-amber-600"
              >
                ➕ 新增到題庫
              </button>
              <button
                type="button"
                onClick={() => setAddCandidate(null)}
                className="flex-1 bg-gray-100 text-gray-600 rounded-full py-2 text-sm font-medium hover:bg-gray-200"
              >
                取消
              </button>
            </div>
            <p className="text-[11px] text-gray-400">新增的成語只會存在這台裝置上，不會同步到別的手機或電腦。</p>
          </div>
        )}

        <div className="flex items-center justify-center gap-1.5 pt-1 flex-wrap">
          <span className="text-xs text-gray-400">提示數量：</span>
          {HINT_COUNT_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => handleHint(n)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                hintCount === n && hintPool.length > 0
                  ? 'bg-sky-500 text-white'
                  : 'bg-sky-50 text-sky-600 hover:bg-sky-100'
              }`}
            >
              {n} 個
            </button>
          ))}
        </div>

        <div className="flex items-center justify-center gap-1.5 pt-1 flex-wrap">
          <span className="text-xs text-gray-400">排序方式：</span>
          <button
            type="button"
            onClick={() => handleHint(hintCount, false)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              !prioritizeQuality ? 'bg-teal-500 text-white' : 'bg-teal-50 text-teal-600 hover:bg-teal-100'
            }`}
          >
            同字優先
          </button>
          <button
            type="button"
            onClick={() => handleHint(hintCount, true)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              prioritizeQuality ? 'bg-teal-500 text-white' : 'bg-teal-50 text-teal-600 hover:bg-teal-100'
            }`}
          >
            🥇 金牌優先
          </button>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={() => handleHint()}
            className="flex-1 bg-sky-100 text-sky-700 rounded-full py-2 text-sm font-medium hover:bg-sky-200"
          >
            💡 提示（{hintCount} 個）
          </button>
          <button
            type="button"
            onClick={handleReroll}
            className="flex-1 bg-gray-100 text-gray-600 rounded-full py-2 text-sm font-medium hover:bg-gray-200"
          >
            🔄 換新的開頭字
          </button>
        </div>

        {hintEntries.length > 0 && (
          <div className="space-y-2">
            {hintEntries.map((entry) => (
              <div key={entry.id} className="bg-sky-50 rounded-xl p-4 text-left space-y-1 relative">
                <span
                  className={`absolute top-2 left-2 text-[11px] font-medium rounded-full px-2 py-0.5 ${LEVEL_BADGE[qualityLevel(entry)].className}`}
                  title={`成語等級：${LEVEL_BADGE[qualityLevel(entry)].label}`}
                >
                  {LEVEL_BADGE[qualityLevel(entry)].icon} {LEVEL_BADGE[qualityLevel(entry)].label}
                </span>
                <button
                  type="button"
                  onClick={() => handleToggleBookmark(entry)}
                  className="absolute top-2 right-2 text-xl leading-none"
                  aria-label={isBookmarked(entry.word) ? '取消收藏' : '收藏到筆記本'}
                  title={isBookmarked(entry.word) ? '取消收藏' : '收藏到筆記本'}
                >
                  {isBookmarked(entry.word) ? '⭐' : '☆'}
                </button>
                <p className="text-2xl font-bold text-sky-700 tracking-widest text-center pt-4">{maskHint(entry.word)}</p>
                <div className="flex justify-center pb-1">
                  <button
                    type="button"
                    onClick={() => speak(entry.word)}
                    className="flex items-center gap-1 text-xs font-medium text-sky-600 bg-white border border-sky-200 rounded-full px-3 py-1 hover:bg-sky-50"
                  >
                    🔊 聽發音
                  </button>
                </div>
                {entry.meaning ? (
                  <>
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold text-gray-500">意思：</span>
                      {entry.meaning}
                      <button
                        type="button"
                        onClick={() => speak(entry.meaning)}
                        className="ml-1 text-sky-500 hover:text-sky-600 align-middle"
                        aria-label="唸出意思"
                        title="唸出意思"
                      >
                        🔊
                      </button>
                    </p>
                    {entry.source === 'moe' && <p className="text-[11px] text-gray-400">{MOE_ATTRIBUTION}</p>}
                  </>
                ) : (
                  <p className="text-xs text-gray-400">我們題庫裡還沒有這個成語的解釋</p>
                )}
                <div className="flex justify-end pt-1">
                  <a
                    href={buildIdiomSearchUrl(entry.word)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-xs font-medium bg-sky-500 text-white rounded-full px-3 py-1.5 hover:bg-sky-600"
                  >
                    🔍 查意思／典故
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalHintPages > 1 && (
          <div className="flex items-center justify-center flex-wrap gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => goToHintPage(hintPage - 1)}
              disabled={hintPage === 0}
              className="rounded-full px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-600 disabled:opacity-40 hover:bg-gray-200"
            >
              ⬅ 上一頁
            </button>
            {pageWindow(hintPage, totalHintPages).map((p, i, arr) => (
              <Fragment key={p}>
                {i > 0 && p - arr[i - 1] > 1 && <span className="text-gray-300 px-0.5">…</span>}
                <button
                  type="button"
                  onClick={() => goToHintPage(p)}
                  className={`rounded-full w-7 h-7 text-xs font-medium ${
                    p === hintPage ? 'bg-sky-500 text-white' : 'bg-sky-50 text-sky-600 hover:bg-sky-100'
                  }`}
                >
                  {p + 1}
                </button>
              </Fragment>
            ))}
            <button
              type="button"
              onClick={() => goToHintPage(hintPage + 1)}
              disabled={hintPage >= totalHintPages - 1}
              className="rounded-full px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-600 disabled:opacity-40 hover:bg-gray-200"
            >
              下一頁 ➡
            </button>
          </div>
        )}
      </div>

      {chainHistory.length > 0 && (
        <div className="bg-white rounded-2xl shadow p-5">
          <h3 className="font-bold text-gray-800 mb-3 text-sm">
            這一輪已經接了 {chainHistory.length} 個成語
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            {chainHistory.map((entry, i) => (
              <div key={entry.id} className="flex items-center gap-1">
                <span className="bg-teal-50 text-teal-700 font-semibold text-sm rounded-full pl-3 pr-1.5 py-1 flex items-center gap-1">
                  {entry.word}
                  <button
                    type="button"
                    onClick={() => handleToggleBookmark(entry)}
                    className="text-sm leading-none"
                    aria-label={isBookmarked(entry.word) ? '取消收藏' : '收藏到筆記本'}
                    title={isBookmarked(entry.word) ? '取消收藏' : '收藏到筆記本'}
                  >
                    {isBookmarked(entry.word) ? '⭐' : '☆'}
                  </button>
                </span>
                {i < chainHistory.length - 1 && <span className="text-gray-300">→</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow p-5 text-center grid grid-cols-2 gap-4">
        <div>
          <p className="text-2xl font-bold text-teal-600">{data.chainStats.totalLinks}</p>
          <p className="text-xs text-gray-500 mt-1">累計接龍次數</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-amber-500">{Math.max(data.chainStats.longestChain, chainHistory.length)}</p>
          <p className="text-xs text-gray-500 mt-1">最長連續紀錄</p>
        </div>
      </div>

      <p className="text-center text-[11px] text-gray-400">
        {MOE_ATTRIBUTION}
        <br />
        部分成語詞目引用自教育部《成語典》編輯總資料庫（30 種成語工具書彙編，僅列詞目未含釋義）
      </p>
    </div>
  );
}
