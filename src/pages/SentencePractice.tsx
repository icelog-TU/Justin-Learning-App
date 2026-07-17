import { useState } from 'react';
import { idioms, type Idiom } from '../data/idioms';
import { checkSentence } from '../lib/sentenceCheck';
import { useAppDataContext } from '../lib/AppDataContext';

function randomIdiom(excludeId?: string): Idiom {
  const pool = excludeId ? idioms.filter((i) => i.id !== excludeId) : idioms;
  return pool[Math.floor(Math.random() * pool.length)];
}

export default function SentencePractice() {
  const { data, logSentence } = useAppDataContext();
  const [idiom, setIdiom] = useState<Idiom>(() => randomIdiom());
  const [sentence, setSentence] = useState('');
  const [result, setResult] = useState<{ passed: boolean; messages: string[] } | null>(null);

  function handleCheck() {
    const check = checkSentence(idiom.word, sentence);
    setResult(check);
    logSentence({
      idiomId: idiom.id,
      word: idiom.word,
      sentence: sentence.trim(),
      passed: check.passed,
      date: new Date().toISOString(),
    });
  }

  function handleNext() {
    setIdiom(randomIdiom(idiom.id));
    setSentence('');
    setResult(null);
  }

  const recentForThisIdiom = data.sentenceLog.filter((entry) => entry.idiomId === idiom.id).slice(0, 3);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-800">成語造句</h2>
        <p className="text-sm text-gray-500">用成語寫一個完整的句子，寫完後可以自己檢查看看喔！</p>
      </div>

      <div className="bg-white rounded-2xl shadow p-6 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-2xl font-bold text-orange-600">{idiom.word}</p>
          <button
            type="button"
            onClick={handleNext}
            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full px-3 py-1.5"
          >
            🔄 換一個成語
          </button>
        </div>
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-gray-500">意思：</span>
          {idiom.meaning}
        </p>

        <textarea
          value={sentence}
          onChange={(e) => setSentence(e.target.value)}
          placeholder={`試著用「${idiom.word}」寫一句話...`}
          rows={3}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
        />

        <button
          type="button"
          onClick={handleCheck}
          disabled={sentence.trim().length === 0}
          className="w-full bg-orange-500 disabled:bg-gray-300 text-white rounded-full py-2.5 font-medium hover:bg-orange-600"
        >
          檢查句子
        </button>

        {result && (
          <div className={`rounded-xl p-4 space-y-1 text-sm ${result.passed ? 'bg-emerald-50' : 'bg-amber-50'}`}>
            <p className={`font-semibold ${result.passed ? 'text-emerald-700' : 'text-amber-700'}`}>
              {result.passed ? '✅ 完成！' : '📝 再想想'}
            </p>
            {result.messages.map((m, i) => (
              <p key={i} className="text-gray-600">
                {m}
              </p>
            ))}
            <p className="text-gray-500 pt-2 border-t border-gray-200 mt-2">
              參考例句：{idiom.example}
            </p>
            <p className="text-xs text-gray-400 pt-1">
              提醒：這是自動的簡單檢查，最好的方法還是請爸爸媽媽或老師再幫忙看看句子通不通順喔！
            </p>
          </div>
        )}
      </div>

      {recentForThisIdiom.length > 0 && (
        <div className="bg-white rounded-2xl shadow p-5 space-y-2">
          <h3 className="font-bold text-gray-800 text-sm">你之前寫過的句子</h3>
          {recentForThisIdiom.map((entry, i) => (
            <p key={i} className="text-sm text-gray-600">
              {entry.passed ? '✅' : '📝'} {entry.sentence}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
