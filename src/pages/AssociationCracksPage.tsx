import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LoadMoreButton } from '../components/LoadMoreButton';
import { useAppDataContext } from '../lib/AppDataContext';

const CHARACTERS_PER_BATCH = 30;

export default function AssociationCracksPage() {
  const { data } = useAppDataContext();
  const [visibleCount, setVisibleCount] = useState(CHARACTERS_PER_BATCH);
  const entries = Object.entries(data.associationCracked).sort(([charA], [charB]) => {
    const dateA = data.associationCrackLog[charA]?.[0]?.crackedAt ?? '';
    const dateB = data.associationCrackLog[charB]?.[0]?.crackedAt ?? '';
    return dateB.localeCompare(dateA);
  });
  const visibleEntries = entries.slice(0, visibleCount);

  return (
    <div className="space-y-4">
      <Link to="/progress" className="text-teal-600 text-sm font-medium underline">
        ← 回學習紀錄
      </Link>

      <div>
        <h2 className="text-xl font-bold text-gray-800">🔓 一字成語王破解字典</h2>
        <p className="text-sm text-gray-500">已破解 {entries.length} 個不同的字，最近破解的排在前面。</p>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        {visibleEntries.length === 0 ? (
          <p className="text-sm text-gray-400">還沒有破解任何字，去「一字成語王」挑戰看看！</p>
        ) : (
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-8">
            {visibleEntries.map(([char, count]) => (
              <Link
                key={char}
                to={`/progress/association/${encodeURIComponent(char)}`}
                className="min-h-16 rounded-2xl bg-violet-50 px-2 py-3 text-center text-violet-700 hover:bg-violet-100"
              >
                <span className="block text-2xl font-extrabold">{char}</span>
                <span className="block text-[11px] text-violet-400">破解 {count} 次</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <LoadMoreButton
        shown={visibleEntries.length}
        total={entries.length}
        batchSize={CHARACTERS_PER_BATCH}
        noun="個字"
        onLoadMore={() => setVisibleCount((count) => count + CHARACTERS_PER_BATCH)}
        accentClass="text-violet-700 border-violet-200 bg-violet-50 hover:bg-violet-100"
      />
    </div>
  );
}
