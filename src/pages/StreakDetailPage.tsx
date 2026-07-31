import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LoadMoreButton } from '../components/LoadMoreButton';
import { useAppDataContext } from '../lib/AppDataContext';
import { getStreakDays } from '../lib/storage';

const DAYS_PER_BATCH = 30;

export default function StreakDetailPage() {
  const { data } = useAppDataContext();
  const [visibleCount, setVisibleCount] = useState(DAYS_PER_BATCH);
  const streak = getStreakDays(data.visitDates);
  const sortedDates = [...data.visitDates].sort().reverse();
  const visibleDates = sortedDates.slice(0, visibleCount);

  return (
    <div className="space-y-4">
      <Link to="/progress" className="text-teal-600 text-sm font-medium underline">
        ← 回學習紀錄
      </Link>

      <div>
        <h2 className="text-xl font-bold text-gray-800">🔥 連續學習天數</h2>
        <p className="text-sm text-gray-500">看看哪幾天打開了 APP 學習，還有每天賺了多少獎勵。</p>
      </div>

      <div className="bg-white rounded-2xl shadow p-6 text-center space-y-1">
        <p className="text-4xl font-extrabold text-red-500">{streak}</p>
        <p className="text-sm text-gray-500">目前連續天數</p>
        <p className="text-xs text-gray-400 pt-1">總共學習了 {sortedDates.length} 天</p>
      </div>

      <div className="bg-white rounded-2xl shadow p-5">
        <h3 className="font-bold text-gray-800 mb-3">學習日期</h3>
        {sortedDates.length === 0 ? (
          <p className="text-sm text-gray-400">還沒有學習紀錄。</p>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              {visibleDates.map((date) => {
                const earning = data.dailyEarnings[date];
                return (
                  <div
                    key={date}
                    className="flex items-center justify-between text-sm border-b last:border-0 border-gray-100 pb-1.5"
                  >
                    <span className="text-gray-600">{date}</span>
                    <span className="flex items-center gap-2 text-xs">
                      <span className="text-orange-600 font-semibold">🪙 {earning?.coins ?? 0}</span>
                      <span className="text-amber-500 font-semibold">⭐ {earning?.stars ?? 0}</span>
                    </span>
                  </div>
                );
              })}
            </div>
            <LoadMoreButton
              shown={visibleDates.length}
              total={sortedDates.length}
              batchSize={DAYS_PER_BATCH}
              noun="天"
              onLoadMore={() => setVisibleCount((count) => count + DAYS_PER_BATCH)}
              accentClass="text-red-600 border-red-200 bg-red-50 hover:bg-red-100"
            />
          </div>
        )}
      </div>
    </div>
  );
}
