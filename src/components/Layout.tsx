import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAppDataContext } from '../lib/AppDataContext';
import { getStreakDays } from '../lib/storage';
import CelebrationOverlay from './CelebrationOverlay';

const NAV_ITEMS = [
  { to: '/', label: '首頁', icon: '🏠', end: true },
  { to: '/idioms/chain', label: '成語接龍', icon: '🔗' },
  { to: '/idioms', label: '成語卡片', icon: '📖' },
  { to: '/idioms/quiz', label: '成語測驗', icon: '🎯' },
  { to: '/idioms/sentence', label: '成語造句', icon: '✏️' },
  { to: '/confusables', label: '錯別字測驗', icon: '🔍' },
  { to: '/gacha', label: '轉蛋', icon: '🎁' },
  { to: '/characters', label: '角色收藏', icon: '🎴' },
  { to: '/notebook', label: '成語筆記本', icon: '⭐' },
  { to: '/progress', label: '學習紀錄', icon: '🏆' },
];

export default function Layout() {
  const { data, celebration } = useAppDataContext();
  const streak = getStreakDays(data.visitDates);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <div className="min-h-screen flex flex-col">
      <CelebrationOverlay trigger={celebration} />
      <header className="bg-orange-500 text-white shadow-md sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="開啟選單"
            className="shrink-0 text-2xl leading-none hover:opacity-80"
          >
            ☰
          </button>
          <NavLink to="/" className="min-w-0 flex-1">
            <h1 className="text-base sm:text-xl font-bold tracking-wide leading-tight">
              Justin
              <br /> 的中文練功房
            </h1>
          </NavLink>
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

      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}
      <div
        className={`fixed top-0 left-0 h-full w-64 max-w-[80%] bg-white shadow-xl z-40 flex flex-col transition-transform duration-200 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <span className="font-bold text-gray-700">選單</span>
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            aria-label="收起選單"
            className="text-2xl leading-none text-gray-400 hover:text-gray-600 px-1"
          >
            ←
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 text-sm font-medium border-l-4 transition-colors ${
                  isActive
                    ? 'border-orange-500 text-orange-600 bg-orange-50'
                    : 'border-transparent text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>

      <footer className="text-center text-xs text-gray-400 py-4">
        專為 Justin 打造的中文學習小工具 💪
      </footer>
    </div>
  );
}
