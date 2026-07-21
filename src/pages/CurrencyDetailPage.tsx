import { Link, useParams } from 'react-router-dom';
import { useAppDataContext } from '../lib/AppDataContext';

const CURRENCY_INFO = {
  coins: { icon: '🪙', label: '金幣', color: 'text-orange-600' },
  stars: { icon: '⭐', label: '星星', color: 'text-amber-500' },
} as const;

export default function CurrencyDetailPage() {
  const { type } = useParams<{ type: string }>();
  const { data } = useAppDataContext();

  const kind = type === 'stars' ? 'stars' : 'coins';
  const info = CURRENCY_INFO[kind];
  const current = kind === 'coins' ? data.coins : data.stars;
  const totalEarned = kind === 'coins' ? data.totalCoinsEarned : data.totalStarsEarned;
  const spent = Math.max(0, totalEarned - current);

  const recentDays = Object.entries(data.dailyEarnings)
    .filter(([, v]) => (kind === 'coins' ? v.coins : v.stars) > 0)
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .slice(0, 30);

  return (
    <div className="space-y-4">
      <Link to="/progress" className="text-teal-600 text-sm font-medium underline">
        ← 回學習紀錄
      </Link>

      <div>
        <h2 className="text-xl font-bold text-gray-800">
          {info.icon} {info.label}明細
        </h2>
        <p className="text-sm text-gray-500">看看曾經賺了多少{info.label}，還有現在剩下多少。</p>
      </div>

      <div className="bg-white rounded-2xl shadow p-6 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className={`text-2xl font-bold ${info.color}`}>{totalEarned}</p>
          <p className="text-xs text-gray-500 mt-1">曾經賺過</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-700">{current}</p>
          <p className="text-xs text-gray-500 mt-1">目前剩下</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-400">{spent}</p>
          <p className="text-xs text-gray-500 mt-1">已經花費</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-5">
        <h3 className="font-bold text-gray-800 mb-3">每日賺取紀錄</h3>
        {recentDays.length === 0 ? (
          <p className="text-sm text-gray-400">還沒有賺取紀錄。</p>
        ) : (
          <div className="space-y-1.5 max-h-80 overflow-y-auto">
            {recentDays.map(([date, earning]) => (
              <div key={date} className="flex items-center justify-between text-sm border-b last:border-0 border-gray-100 pb-1.5">
                <span className="text-gray-600">{date}</span>
                <span className={`font-semibold ${info.color}`}>
                  +{kind === 'coins' ? earning.coins : earning.stars} {info.icon}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
