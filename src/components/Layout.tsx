import { NavLink, Outlet } from 'react-router-dom';
import { useAppDataContext } from '../lib/AppDataContext';
import { getStreakDays } from '../lib/storage';
import CelebrationOverlay from './CelebrationOverlay';

const NAV_ITEMS = [
  { to: '/', label: '首頁', icon: '🏠', end: true },
  { to: '/idioms', label: '成語卡片', icon: '📖' },
  { to: '/idioms/quiz', label: '成語測驗', icon: '🎯' },
  { to: '/idioms/sentence', label: '成語造句', icon: '✏️' },
  { to: '/idioms/chain', label: '成語接龍', icon: '🔗' },
  { to: '/confusables', label: '錯別字測驗', icon: '🔍' },
  { to: '/gacha', label: '轉蛋', icon: '🎁' },
  { to: '/characters', label: '角色收藏', icon: '🎴' },
  { to: '/progress', label: '學習紀錄', icon: '🏆' },
];

export default function Layout() {
  const { data, celebration } = useAppDataContext();
  const streak = getStreakDays(data.visitDates);

  return (
    <div className="min-h-screen flex flex-col">
      <CelebrationOverlay trigger={celebration} />
      <header className="bg-orange-500 text-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold tracking-wide whitespace-nowrap overflow-hidden text-ellipsis">
              Justin 的中文練功房
            </h1>
            <p className="text-orange-100 text-xs sm:text-sm whitespace-nowrap overflow-hidden text-ellipsis">
              成語 × 錯別字，天天進步一點點！
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-1.5 text-xs sm:text-sm font-semibold shrink-0 max-w-[55%]">
            <div className="bg-white/20 rounded-full px-2.5 py-1 flex items-center gap-1 whitespace-nowrap">
              <span>🪙</span>
              <span key={data.coins} style={{ display: 'inline-block', animation: 'pill-pop 0.4s ease-out' }}>
                {data.coins}
              </span>
            </div>
            <div className="bg-white/20 rounded-full px-2.5 py-1 flex items-center gap-1 whitespace-nowrap">
              <span>⭐</span>
              <span key={data.stars} style={{ display: 'inline-block', animation: 'pill-pop 0.4s ease-out' }}>
                {data.stars}
              </span>
            </div>
            <div className="bg-white/20 rounded-full px-2.5 py-1 flex items-center gap-1 whitespace-nowrap">
              <span>🔥</span>
              <span>{streak} 天</span>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-orange-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-2 flex gap-1 overflow-x-auto">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-1 px-3 py-3 text-sm font-medium whitespace-nowrap border-b-4 transition-colors ${
                  isActive
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-orange-500'
                }`
              }
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>

      <footer className="text-center text-xs text-gray-400 py-4">
        專為 Justin 打造的中文學習小工具 💪
      </footer>
    </div>
  );
}
