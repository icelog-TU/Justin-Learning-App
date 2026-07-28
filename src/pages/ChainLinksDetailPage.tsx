import { Link } from 'react-router-dom';
import { useAppDataContext } from '../lib/AppDataContext';
import type { ChainRoundLog } from '../lib/storage';
import { speak } from '../lib/speech';
import { buildIdiomSearchUrl } from '../lib/googleSearch';

function dateKey(iso: string): string {
  return iso.slice(0, 10);
}

export default function ChainLinksDetailPage() {
  const { data } = useAppDataContext();

  const groups = new Map<string, ChainRoundLog[]>();
  for (const round of data.chainRoundHistory) {
    const key = dateKey(round.completedAt);
    const bucket = groups.get(key);
    if (bucket) bucket.push(round);
    else groups.set(key, [round]);
  }
  const sortedDates = Array.from(groups.keys()).sort().reverse();

  return (
    <div className="space-y-4">
      <Link to="/progress" className="text-teal-600 text-sm font-medium underline">
        ← 回學習紀錄
      </Link>

      <div>
        <h2 className="text-xl font-bold text-gray-800">🔗 成語接龍師紀錄</h2>
        <p className="text-sm text-gray-500">看看每一天接了哪些成語。</p>
      </div>

      <div className="bg-white rounded-2xl shadow p-6 text-center grid grid-cols-2 gap-2">
        <div>
          <p className="text-3xl font-extrabold text-teal-600">{data.chainStats.totalLinks}</p>
          <p className="text-xs text-gray-500 mt-1">累計接龍次數</p>
        </div>
        <div>
          <p className="text-3xl font-extrabold text-amber-500">{data.chainStats.longestChain}</p>
          <p className="text-xs text-gray-500 mt-1">最長連續紀錄</p>
        </div>
      </div>

      {sortedDates.length === 0 ? (
        <div className="bg-white rounded-2xl shadow p-5">
          <p className="text-sm text-gray-400">還沒有接龍紀錄。</p>
        </div>
      ) : (
        sortedDates.map((date) => {
          const dayRounds = groups.get(date)!;
          const dayTotal = dayRounds.reduce((sum, r) => sum + r.length, 0);
          return (
            <div key={date} className="bg-white rounded-2xl shadow p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-800 text-sm">{date}</h3>
                <span className="text-xs text-gray-400">共 {dayTotal} 個成語</span>
              </div>
              {dayRounds.map((round, ri) => (
                <div key={ri} className="flex flex-wrap items-center gap-2">
                  {round.words.map((word, wi) => (
                    <div key={wi} className="flex items-center gap-1">
                      <span className="bg-teal-50 text-teal-700 font-semibold text-sm rounded-full pl-3 pr-1.5 py-1 flex items-center gap-1">
                        {word}
                        <button
                          type="button"
                          onClick={() => speak(word)}
                          className="text-sm leading-none"
                          aria-label="聽發音"
                          title="聽發音"
                        >
                          🔊
                        </button>
                        <a
                          href={buildIdiomSearchUrl(word)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm leading-none"
                          aria-label="查意思／典故"
                          title="查意思／典故"
                        >
                          🔍
                        </a>
                      </span>
                      {wi < round.words.length - 1 && <span className="text-gray-300">→</span>}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          );
        })
      )}
    </div>
  );
}
