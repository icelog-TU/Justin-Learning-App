import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LoadMoreButton } from '../components/LoadMoreButton';
import { guwenLessons } from '../data/guwenLesson';
import { useAppDataContext } from '../lib/AppDataContext';

const BADGES_PER_BATCH = 24;

export default function GuwenBadgesPage() {
  const { data } = useAppDataContext();
  const [visibleCount, setVisibleCount] = useState(BADGES_PER_BATCH);
  const earnedCount = guwenLessons.filter((lesson) => data.guwenProgress[lesson.id]?.completedAt).length;
  const visibleLessons = guwenLessons.slice(0, visibleCount);

  return (
    <div className="space-y-4">
      <Link to="/progress" className="text-teal-600 text-sm font-medium underline">
        ← 回學習紀錄
      </Link>

      <div>
        <h2 className="text-xl font-bold text-gray-800">🏅 古文徽章收藏冊</h2>
        <p className="text-sm text-gray-500">
          已收集 {earnedCount} / {guwenLessons.length} 枚；每次只顯示一部分，收藏再多也不會擠成一長頁。
        </p>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow">
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-8">
          {visibleLessons.map((lesson, index) => {
            const progress = data.guwenProgress[lesson.id];
            const earned = Boolean(progress?.completedAt);
            return (
              <Link
                key={lesson.id}
                to={`/guwen-lesson/${lesson.id}`}
                title={lesson.badgeName ?? lesson.title}
                className={`aspect-square rounded-2xl flex flex-col items-center justify-center text-xs font-bold ${
                  earned
                    ? 'bg-gradient-to-br from-amber-400 to-pink-500 text-white shadow'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                <span className="text-xl leading-none">{earned ? '🏅' : '🔒'}</span>
                <span className="mt-1 leading-none">第 {index + 1} 枚</span>
              </Link>
            );
          })}
        </div>
      </div>

      <LoadMoreButton
        shown={visibleLessons.length}
        total={guwenLessons.length}
        batchSize={BADGES_PER_BATCH}
        noun="枚徽章"
        onLoadMore={() => setVisibleCount((count) => count + BADGES_PER_BATCH)}
        accentClass="text-amber-700 border-amber-200 bg-amber-50 hover:bg-amber-100"
      />
    </div>
  );
}
