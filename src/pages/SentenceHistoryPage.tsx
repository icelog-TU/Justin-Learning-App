import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LoadMoreButton } from '../components/LoadMoreButton';
import { useAppDataContext } from '../lib/AppDataContext';

const SENTENCES_PER_BATCH = 20;
type SentenceFilter = 'all' | 'passed' | 'retry';

export default function SentenceHistoryPage() {
  const { data } = useAppDataContext();
  const [filter, setFilter] = useState<SentenceFilter>('all');
  const [visibleCount, setVisibleCount] = useState(SENTENCES_PER_BATCH);
  const passedCount = data.sentenceLog.filter((entry) => entry.passed).length;
  const filteredEntries = data.sentenceLog.filter((entry) => {
    if (filter === 'passed') return entry.passed;
    if (filter === 'retry') return !entry.passed;
    return true;
  });
  const visibleEntries = filteredEntries.slice(0, visibleCount);

  function changeFilter(nextFilter: SentenceFilter) {
    setFilter(nextFilter);
    setVisibleCount(SENTENCES_PER_BATCH);
  }

  return (
    <div className="space-y-4">
      <Link to="/progress" className="text-teal-600 text-sm font-medium underline">
        ← 回學習紀錄
      </Link>

      <div>
        <h2 className="text-xl font-bold text-gray-800">✏️ 成語造句紀錄</h2>
        <p className="text-sm text-gray-500">
          總共寫了 {data.sentenceLog.length} 句，通過檢查 {passedCount} 句。
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-2xl bg-white p-3 shadow">
        {([
          ['all', '全部'],
          ['passed', '✅ 已通過'],
          ['retry', '📝 再練習'],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => changeFilter(value)}
            className={`min-h-11 rounded-xl px-2 py-2 text-sm font-bold ${
              filter === value ? 'bg-orange-500 text-white' : 'bg-orange-50 text-orange-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {visibleEntries.length === 0 ? (
          <div className="rounded-2xl bg-white p-5 text-sm text-gray-400 shadow">這個分類目前沒有造句紀錄。</div>
        ) : (
          visibleEntries.map((entry, index) => (
            <div key={`${entry.date}-${index}`} className="rounded-2xl bg-white p-4 shadow">
              <p className="text-sm text-gray-700">
                {entry.passed ? '✅' : '📝'}{' '}
                <span className="font-bold text-orange-600">{entry.word}</span>：{entry.sentence}
              </p>
              <p className="mt-1 text-xs text-gray-400">{new Date(entry.date).toLocaleString('zh-TW')}</p>
            </div>
          ))
        )}
      </div>

      <LoadMoreButton
        shown={visibleEntries.length}
        total={filteredEntries.length}
        batchSize={SENTENCES_PER_BATCH}
        noun="句"
        onLoadMore={() => setVisibleCount((count) => count + SENTENCES_PER_BATCH)}
        accentClass="text-orange-700 border-orange-200 bg-orange-50 hover:bg-orange-100"
      />
    </div>
  );
}
