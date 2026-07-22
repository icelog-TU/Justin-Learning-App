import { Fragment, useEffect, useRef, useState } from 'react';
import { useAppDataContext } from '../lib/AppDataContext';
import {
  buildCuratedPool,
  buildMoePool,
  buildEditorialPool,
  buildCustomPool,
  findCandidatesAtPosition,
  rankCandidatesAtPosition,
  matchesTargetAtPosition,
  findByWord,
  maskHint,
  pickRandomCharacter,
  qualityLevel,
  type ChainEntry,
  type MoeRawEntry,
  type EditorialRawEntry,
  type IdiomPosition,
} from '../lib/chainGame';
import {
  COIN_PER_ASSOCIATION_ANSWER,
  STAR_PER_ASSOCIATION_ANSWER,
  ASSOCIATION_COMPLETE_BONUS_COINS,
  ASSOCIATION_COMPLETE_BONUS_STARS,
} from '../lib/rewards';
import { speak } from '../lib/speech';
import { buildIdiomSearchUrl } from '../lib/googleSearch';
import { getSpeechRecognitionCtor, type MinimalSpeechRecognition } from '../lib/speechRecognition';
import { playSlotSpinSound, playSlotDingSound, playAssociationCompleteFanfare } from '../lib/sound';

const MOE_ATTRIBUTION = '資料來源：教育部《成語典》（創用CC 姓名標示－禁止改作 3.0 台灣授權條款）';
const HINT_COUNT_OPTIONS = [3, 6, 9, 12];
const LEVEL_BADGE: Record<1 | 2 | 3, { icon: string; label: string; className: string }> = {
  3: { icon: '🥇', label: '精選', className: 'bg-amber-100 text-amber-700' },
  2: { icon: '🥈', label: '常見', className: 'bg-slate-100 text-slate-600' },
  1: { icon: '🥉', label: '罕見', className: 'bg-orange-50 text-orange-500' },
};
const POSITIONS: IdiomPosition[] = [1, 2, 3, 4];
const ROW_LABEL: Record<IdiomPosition, string> = { 1: '第一個字', 2: '第二個字', 3: '第三個字', 4: '第四個字' };

interface Feedback {
  type: 'success' | 'error' | 'info';
  message: string;
}

interface RowState {
  input: string;
  solvedWord: string | null;
  noAnswer: boolean;
  feedback: Feedback | null;
}

function emptyRow(): RowState {
  return { input: '', solvedWord: null, noAnswer: false, feedback: null };
}

function emptyRows(): Record<IdiomPosition, RowState> {
  return { 1: emptyRow(), 2: emptyRow(), 3: emptyRow(), 4: emptyRow() };
}

/** Renders a 4-character idiom row with the fixed target character shown at `position`, blanks elsewhere. */
function PositionDisplay({ position, char }: { position: IdiomPosition; char: string }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {POSITIONS.map((p) => (
        <span
          key={p}
          className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl font-extrabold ${
            p === position ? 'bg-violet-500 text-white' : 'bg-violet-50 text-violet-200 border-2 border-dashed border-violet-200'
          }`}
        >
          {p === position ? char : '?'}
        </span>
      ))}
    </div>
  );
}

export default function IdiomAssociationGame() {
  const { reward } = useAppDataContext();
  const [pool, setPool] = useState<ChainEntry[]>(() => [...buildCuratedPool(), ...buildCustomPool([])]);
  const [extraLoaded, setExtraLoaded] = useState(false);

  const [spinning, setSpinning] = useState(false);
  const [reelChar, setReelChar] = useState('？');
  const [targetChar, setTargetChar] = useState('');
  const [targetZhuyin, setTargetZhuyin] = useState('');
  const [rows, setRows] = useState<Record<IdiomPosition, RowState>>(emptyRows());
  const [roundComplete, setRoundComplete] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const [hintModal, setHintModal] = useState<{
    position: IdiomPosition;
    hintPool: ChainEntry[];
    hintPage: number;
    hintCount: number;
    prioritizeQuality: boolean;
  } | null>(null);

  const [listeningPosition, setListeningPosition] = useState<IdiomPosition | null>(null);
  const recognitionRef = useRef<MinimalSpeechRecognition | null>(null);
  const speechSupported = getSpeechRecognitionCtor() !== null;
  const spinTimerRef = useRef<number | null>(null);

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
      setPool((prev) => [...prev, ...(moeRaw ? buildMoePool(moeRaw) : []), ...(editorialRaw ? buildEditorialPool(editorialRaw) : [])]);
      setExtraLoaded(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (spinTimerRef.current) window.clearInterval(spinTimerRef.current);
    };
  }, []);

  function detectNoAnswerRows(char: string, zhuyin: string, currentPool: ChainEntry[]): Record<IdiomPosition, RowState> {
    const next = emptyRows();
    for (const position of POSITIONS) {
      const candidates = findCandidatesAtPosition(currentPool, position, char, zhuyin, new Set());
      if (candidates.length === 0) {
        next[position] = { input: '', solvedWord: null, noAnswer: true, feedback: null };
      }
    }
    return next;
  }

  function handleSpin() {
    if (spinning || pool.length === 0) return;
    setSpinning(true);
    setRoundComplete(false);
    setShowCelebration(false);
    setHintModal(null);
    setTargetChar('');
    setRows(emptyRows());
    playSlotSpinSound();

    const reelChars = pool.map((e) => e.firstChar).filter(Boolean);
    let ticks = 0;
    spinTimerRef.current = window.setInterval(() => {
      setReelChar(reelChars[Math.floor(Math.random() * reelChars.length)] ?? '？');
      ticks += 1;
      if (ticks >= 18) {
        if (spinTimerRef.current) window.clearInterval(spinTimerRef.current);
        const landed = pickRandomCharacter(pool);
        const char = landed?.char ?? reelChars[0] ?? '人';
        const zhuyin = landed?.zhuyin ?? '';
        setReelChar(char);
        setTargetChar(char);
        setTargetZhuyin(zhuyin);
        setRows(detectNoAnswerRows(char, zhuyin, pool));
        setSpinning(false);
        playSlotDingSound();
        window.setTimeout(() => speak(char), 250);
      }
    }, 110);
  }

  function updateRow(position: IdiomPosition, patch: Partial<RowState>) {
    setRows((prev) => ({ ...prev, [position]: { ...prev[position], ...patch } }));
  }

  function checkRoundComplete(current: Record<IdiomPosition, RowState>) {
    const done = POSITIONS.every((p) => current[p].solvedWord !== null || current[p].noAnswer);
    if (!done || roundComplete) return;
    setRoundComplete(true);
    setShowCelebration(true);
    reward(ASSOCIATION_COMPLETE_BONUS_COINS, ASSOCIATION_COMPLETE_BONUS_STARS, { big: true });
    playAssociationCompleteFanfare();
    window.setTimeout(() => speak(`恭喜，你完成了「${targetChar}」的一字成語王挑戰！`), 300);
    window.setTimeout(() => setShowCelebration(false), 2600);
  }

  function handleSubmitRow(position: IdiomPosition) {
    const row = rows[position];
    const raw = row.input.trim();
    if (!raw) return;

    const entry = findByWord(pool, raw);
    if (!entry) {
      updateRow(position, { feedback: { type: 'error', message: '這個成語我們的題庫裡還沒有喔，換一個試試看？' } });
      return;
    }
    if (!matchesTargetAtPosition(entry, position, targetChar, targetZhuyin)) {
      updateRow(position, {
        feedback: {
          type: 'error',
          message: `「${entry.word}」的${ROW_LABEL[position]}要是「${targetChar}」（同字或同音）才行喔，再想想！`,
        },
      });
      return;
    }

    reward(COIN_PER_ASSOCIATION_ANSWER, STAR_PER_ASSOCIATION_ANSWER);
    setRows((prev) => {
      const next = {
        ...prev,
        [position]: { input: entry.word, solvedWord: entry.word, noAnswer: false, feedback: { type: 'success' as const, message: `✅ 答對了！「${entry.word}」` } },
      };
      checkRoundComplete(next);
      return next;
    });
    setHintModal(null);
  }

  function openHint(position: IdiomPosition, quality = true) {
    const candidates = findCandidatesAtPosition(pool, position, targetChar, targetZhuyin, new Set());
    setHintModal({
      position,
      hintPool: rankCandidatesAtPosition(candidates, position, targetChar, targetZhuyin, quality),
      hintPage: 0,
      hintCount: 3,
      prioritizeQuality: quality,
    });
  }

  function reHint(count?: number, quality?: boolean) {
    if (!hintModal) return;
    const c = count ?? hintModal.hintCount;
    const q = quality ?? hintModal.prioritizeQuality;
    const candidates = findCandidatesAtPosition(pool, hintModal.position, targetChar, targetZhuyin, new Set());
    setHintModal({
      position: hintModal.position,
      hintPool: rankCandidatesAtPosition(candidates, hintModal.position, targetChar, targetZhuyin, q),
      hintPage: 0,
      hintCount: c,
      prioritizeQuality: q,
    });
  }

  function startListening(position: IdiomPosition) {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;
    const recognition = new Ctor();
    recognition.lang = 'zh-TW';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      updateRow(position, { input: transcript.replace(/[，。！？\s、]/g, '') });
    };
    recognition.onerror = () => {
      setListeningPosition(null);
      updateRow(position, { feedback: { type: 'info', message: '語音辨識沒有成功，可以再說一次，或改用打字輸入喔！' } });
    };
    recognition.onend = () => setListeningPosition(null);
    recognitionRef.current = recognition;
    setListeningPosition(position);
    updateRow(position, { feedback: null });
    recognition.start();
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setListeningPosition(null);
  }

  const totalHintPages = hintModal && hintModal.hintPool.length > 0 ? Math.ceil(hintModal.hintPool.length / hintModal.hintCount) : 0;
  const hintEntries = hintModal ? hintModal.hintPool.slice(hintModal.hintPage * hintModal.hintCount, hintModal.hintPage * hintModal.hintCount + hintModal.hintCount) : [];

  function goToHintPage(page: number) {
    if (!hintModal) return;
    setHintModal({ ...hintModal, hintPage: Math.max(0, Math.min(page, totalHintPages - 1)) });
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-800">一字成語王</h2>
        <p className="text-sm text-gray-500">拉霸機轉出一個字，找出它在四個字成語的每個位置上的成語！</p>
        <p className="text-xs text-gray-400 mt-1">
          題庫共 {pool.length} 個成語{!extraLoaded && '（教育部成語資料載入中…）'}
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow p-6 text-center space-y-4">
        <div
          className="mx-auto w-28 h-28 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-6xl font-extrabold shadow-lg"
          style={spinning ? { animation: 'slot-spin 0.11s linear infinite' } : targetChar ? { animation: 'slot-land 0.4s ease-out' } : undefined}
        >
          {reelChar}
        </div>

        <button
          type="button"
          onClick={handleSpin}
          disabled={spinning || pool.length === 0}
          className="bg-gradient-to-br from-violet-500 to-fuchsia-500 disabled:from-gray-300 disabled:to-gray-300 text-white text-lg font-bold rounded-full px-8 py-4 shadow-lg hover:scale-105 transition-transform disabled:hover:scale-100"
        >
          {spinning ? '轉動中...🎰' : targetChar ? '🎰 再轉一次' : '🎰 拉霸開始！'}
        </button>

        {targetChar && !spinning && (
          <button
            type="button"
            onClick={() => speak(targetChar)}
            className="text-sm text-violet-600 flex items-center justify-center gap-1 mx-auto"
          >
            🔊 再聽一次「{targetChar}」的發音
          </button>
        )}
      </div>

      {targetChar && !spinning && (
        <div className="space-y-3">
          {POSITIONS.map((position) => {
            const row = rows[position];
            return (
              <div key={position} className="bg-white rounded-2xl shadow p-5 space-y-3">
                <h3 className="text-sm font-bold text-gray-700">{ROW_LABEL[position]}是「{targetChar}」的成語</h3>
                <PositionDisplay position={position} char={targetChar} />

                {row.noAnswer ? (
                  <p className="text-sm text-amber-600 bg-amber-50 rounded-lg px-3 py-2 text-center">
                    這種情況沒有答案，太特別了！這一格可以跳過～
                  </p>
                ) : row.solvedWord ? (
                  <p className="text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2 text-center font-semibold">
                    ✅ {row.solvedWord}
                  </p>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={row.input}
                        onChange={(e) => updateRow(position, { input: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmitRow(position)}
                        placeholder="輸入成語..."
                        className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-violet-300"
                      />
                      {speechSupported && (
                        <button
                          type="button"
                          onClick={() => (listeningPosition === position ? stopListening() : startListening(position))}
                          className={`shrink-0 rounded-xl px-3 text-xl ${
                            listeningPosition === position ? 'bg-red-500 text-white animate-pulse' : 'bg-violet-100 text-violet-700'
                          }`}
                          aria-label="語音輸入"
                        >
                          🎤
                        </button>
                      )}
                    </div>

                    {row.feedback && (
                      <p
                        className={`text-sm font-medium rounded-lg px-3 py-2 ${
                          row.feedback.type === 'success'
                            ? 'bg-emerald-50 text-emerald-700'
                            : row.feedback.type === 'error'
                              ? 'bg-red-50 text-red-600'
                              : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {row.feedback.message}
                      </p>
                    )}

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleSubmitRow(position)}
                        disabled={row.input.trim().length === 0}
                        className="flex-1 bg-violet-500 disabled:bg-gray-300 text-white rounded-full py-2 text-sm font-medium hover:bg-violet-600"
                      >
                        送出
                      </button>
                      <button
                        type="button"
                        onClick={() => openHint(position)}
                        className="flex-1 bg-sky-100 text-sky-700 rounded-full py-2 text-sm font-medium hover:bg-sky-200"
                      >
                        💡 提示
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {hintModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-3" onClick={() => setHintModal(null)}>
          <div
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-5 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-800">
                💡 {ROW_LABEL[hintModal.position]}是「{targetChar}」的成語提示
              </h3>
              <button type="button" onClick={() => setHintModal(null)} className="text-2xl leading-none text-gray-400 hover:text-gray-600 px-1" aria-label="關閉">
                ×
              </button>
            </div>

            {hintModal.hintPool.length === 0 ? (
              <p className="text-sm text-amber-600 bg-amber-50 rounded-lg px-3 py-2 text-center">
                這種情況沒有答案，太特別了！這一格可以跳過～
              </p>
            ) : (
              <>
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                  <span className="text-xs text-gray-400">提示數量：</span>
                  {HINT_COUNT_OPTIONS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => reHint(n)}
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        hintModal.hintCount === n ? 'bg-sky-500 text-white' : 'bg-sky-50 text-sky-600 hover:bg-sky-100'
                      }`}
                    >
                      {n} 個
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                  <span className="text-xs text-gray-400">排序方式：</span>
                  <button
                    type="button"
                    onClick={() => reHint(undefined, false)}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      !hintModal.prioritizeQuality ? 'bg-violet-500 text-white' : 'bg-violet-50 text-violet-600 hover:bg-violet-100'
                    }`}
                  >
                    同字優先
                  </button>
                  <button
                    type="button"
                    onClick={() => reHint(undefined, true)}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      hintModal.prioritizeQuality ? 'bg-violet-500 text-white' : 'bg-violet-50 text-violet-600 hover:bg-violet-100'
                    }`}
                  >
                    🥇 金牌優先
                  </button>
                </div>

                <div className="space-y-2">
                  {hintEntries.map((entry) => (
                    <div key={entry.id} className="bg-sky-50 rounded-xl p-4 text-left space-y-1 relative">
                      <span
                        className={`absolute top-2 left-2 text-[11px] font-medium rounded-full px-2 py-0.5 ${LEVEL_BADGE[qualityLevel(entry)].className}`}
                      >
                        {LEVEL_BADGE[qualityLevel(entry)].icon} {LEVEL_BADGE[qualityLevel(entry)].label}
                      </span>
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

                {totalHintPages > 1 && (
                  <div className="flex items-center justify-center flex-wrap gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => goToHintPage(hintModal.hintPage - 1)}
                      disabled={hintModal.hintPage === 0}
                      className="rounded-full px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-600 disabled:opacity-40 hover:bg-gray-200"
                    >
                      ⬅ 上一頁
                    </button>
                    {Array.from({ length: totalHintPages }, (_, i) => i).map((p) => (
                      <Fragment key={p}>
                        <button
                          type="button"
                          onClick={() => goToHintPage(p)}
                          className={`rounded-full w-7 h-7 text-xs font-medium ${
                            p === hintModal.hintPage ? 'bg-sky-500 text-white' : 'bg-sky-50 text-sky-600 hover:bg-sky-100'
                          }`}
                        >
                          {p + 1}
                        </button>
                      </Fragment>
                    ))}
                    <button
                      type="button"
                      onClick={() => goToHintPage(hintModal.hintPage + 1)}
                      disabled={hintModal.hintPage >= totalHintPages - 1}
                      className="rounded-full px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-600 disabled:opacity-40 hover:bg-gray-200"
                    >
                      下一頁 ➡
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 pointer-events-none">
          <div className="bg-white rounded-3xl shadow-2xl px-8 py-10 text-center space-y-3" style={{ animation: 'slot-land 0.5s ease-out' }}>
            <p className="text-5xl">🎉👑🎉</p>
            <p className="text-xl font-extrabold text-violet-600">恭喜，你完成了「{targetChar}」的一字成語王挑戰！</p>
            <p className="text-sm text-gray-500">
              🪙+{ASSOCIATION_COMPLETE_BONUS_COINS} ⭐+{ASSOCIATION_COMPLETE_BONUS_STARS}
            </p>
          </div>
        </div>
      )}

      <p className="text-center text-[11px] text-gray-400">
        {MOE_ATTRIBUTION}
        <br />
        部分成語詞目引用自教育部《成語典》編輯總資料庫（30 種成語工具書彙編，僅列詞目未含釋義）
      </p>
    </div>
  );
}
