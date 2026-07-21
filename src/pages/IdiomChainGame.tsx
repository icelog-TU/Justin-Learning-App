import { useEffect, useRef, useState } from 'react';
import { useAppDataContext } from '../lib/AppDataContext';
import { findCandidates, findByWord, matchesTarget, maskHint, pickRandomStart } from '../lib/chainGame';
import type { ChainIdiom } from '../data/idiomChain';
import {
  COIN_PER_CHAIN_LINK,
  STAR_PER_CHAIN_LINK,
  CHAIN_MILESTONE_INTERVAL,
  CHAIN_MILESTONE_BONUS_COINS,
  CHAIN_MILESTONE_BONUS_STARS,
} from '../lib/rewards';

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

export default function IdiomChainGame() {
  const { data, reward, addChainLink, reportChainLength } = useAppDataContext();
  const [targetChar, setTargetChar] = useState('');
  const [targetPinyin, setTargetPinyin] = useState('');
  const [chainHistory, setChainHistory] = useState<ChainIdiom[]>([]);
  const [usedIds, setUsedIds] = useState<Set<string>>(new Set());
  const [inputValue, setInputValue] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [hintEntry, setHintEntry] = useState<ChainIdiom | null>(null);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<MinimalSpeechRecognition | null>(null);
  const speechSupported = getSpeechRecognitionCtor() !== null;

  function startNewChain() {
    const start = pickRandomStart();
    setTargetChar(start.firstChar);
    setTargetPinyin(start.firstPinyin);
    setChainHistory([]);
    setUsedIds(new Set());
    setInputValue('');
    setHintEntry(null);
    setFeedback(null);
  }

  useEffect(() => {
    startNewChain();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const candidates = targetChar ? findCandidates(usedIds, targetChar, targetPinyin) : [];
  const deadEnd = targetChar !== '' && candidates.length === 0;

  function handleReroll() {
    if (chainHistory.length > 0) {
      reportChainLength(chainHistory.length);
    }
    startNewChain();
  }

  function handleSubmit() {
    const raw = inputValue.trim();
    if (!raw) return;

    const entry = findByWord(raw);
    if (!entry) {
      setFeedback({ type: 'error', message: '這個成語我們的題庫裡還沒有喔，換一個試試看？' });
      return;
    }
    if (usedIds.has(entry.id)) {
      setFeedback({ type: 'error', message: '這個成語已經接過了，換一個吧！' });
      return;
    }
    if (!matchesTarget(entry, targetChar, targetPinyin)) {
      setFeedback({
        type: 'error',
        message: `「${entry.word}」的開頭要接得上「${targetChar}」（同字或同音）才行喔，再想想！`,
      });
      return;
    }

    const nextHistory = [...chainHistory, entry];
    const nextUsedIds = new Set(usedIds);
    nextUsedIds.add(entry.id);

    reward(COIN_PER_CHAIN_LINK, STAR_PER_CHAIN_LINK);
    addChainLink();

    let bonusMessage = '';
    if (nextHistory.length % CHAIN_MILESTONE_INTERVAL === 0) {
      reward(CHAIN_MILESTONE_BONUS_COINS, CHAIN_MILESTONE_BONUS_STARS);
      bonusMessage = `🎉 接了 ${nextHistory.length} 個成語，額外獎勵 🪙${CHAIN_MILESTONE_BONUS_COINS}、⭐${CHAIN_MILESTONE_BONUS_STARS}！`;
    }

    setChainHistory(nextHistory);
    setUsedIds(nextUsedIds);
    setTargetChar(entry.lastChar);
    setTargetPinyin(entry.lastPinyin);
    setInputValue('');
    setHintEntry(null);
    setFeedback({
      type: 'success',
      message: bonusMessage || `✅ 接對了！獲得 🪙${COIN_PER_CHAIN_LINK}、⭐${STAR_PER_CHAIN_LINK}`,
    });
  }

  function handleHint() {
    if (candidates.length === 0) {
      setFeedback({ type: 'info', message: '這個字暫時接不下去了，換一個新的開頭字試試吧！' });
      return;
    }
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    setHintEntry(pick);
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

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-800">成語接龍</h2>
        <p className="text-sm text-gray-500">
          接一個開頭是這個字、或是<span className="font-semibold text-teal-600">讀音相同</span>的成語，可以無限接下去！
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow p-6 text-center space-y-3">
        <p className="text-xs text-gray-400">請接一個成語，開頭是……</p>
        <p className="text-5xl font-extrabold text-teal-600">{targetChar}</p>
        <p className="text-xs text-gray-400">（讀音：{targetPinyin}）</p>

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

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={handleHint}
            className="flex-1 bg-sky-100 text-sky-700 rounded-full py-2 text-sm font-medium hover:bg-sky-200"
          >
            💡 提示
          </button>
          <button
            type="button"
            onClick={handleReroll}
            className="flex-1 bg-gray-100 text-gray-600 rounded-full py-2 text-sm font-medium hover:bg-gray-200"
          >
            🔄 換新的開頭字
          </button>
        </div>

        {hintEntry && (
          <div className="bg-sky-50 rounded-xl p-4 text-left space-y-1">
            <p className="text-2xl font-bold text-sky-700 tracking-widest text-center">{maskHint(hintEntry.word)}</p>
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-500">意思：</span>
              {hintEntry.meaning}
            </p>
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
              <div key={entry.id} className="flex items-center gap-2">
                <span className="bg-teal-50 text-teal-700 font-semibold text-sm rounded-full px-3 py-1">
                  {entry.word}
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
    </div>
  );
}
