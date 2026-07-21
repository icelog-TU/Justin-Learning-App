import { Link } from 'react-router-dom';
import { useAppDataContext } from '../lib/AppDataContext';
import { LEVELS, currentLevel, nextLevel } from '../lib/rewards';

export default function LevelDetailPage() {
  const { data } = useAppDataContext();
  const charactersOwned = Object.keys(data.characters).length;
  const level = currentLevel(charactersOwned);
  const next = nextLevel(charactersOwned);

  return (
    <div className="space-y-4">
      <Link to="/progress" className="text-teal-600 text-sm font-medium underline">
        ← 回學習紀錄
      </Link>

      <div>
        <h2 className="text-xl font-bold text-gray-800">等級系統</h2>
        <p className="text-sm text-gray-500">收集越多角色，等級就會越高，總共有 {LEVELS.length} 級！</p>
      </div>

      <div className="bg-white rounded-2xl shadow p-6 text-center space-y-2">
        <p className="text-5xl">{level.icon}</p>
        <p className="font-bold text-lg text-gray-800">
          Lv.{level.level} {level.title}
        </p>
        <p className="text-sm text-gray-500">已收集 {charactersOwned} 個角色</p>
        {next ? (
          <>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-2 max-w-xs mx-auto">
              <div
                className="h-full bg-emerald-500"
                style={{ width: `${Math.min(100, (charactersOwned / next.threshold) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-400">
              再收集 {next.threshold - charactersOwned} 個角色就能升到 Lv.{next.level} {next.icon} {next.title}！
            </p>
          </>
        ) : (
          <p className="text-sm font-bold text-emerald-600">🎉 已經達到最高等級了！</p>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow p-5">
        <h3 className="font-bold text-gray-800 mb-3">升級條件（收集角色數）</h3>
        <div className="space-y-2">
          {LEVELS.map((lvl) => {
            const reached = charactersOwned >= lvl.threshold;
            const isCurrent = lvl.level === level.level;
            return (
              <div
                key={lvl.level}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 ${
                  isCurrent ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50'
                }`}
              >
                <span className="text-2xl">{lvl.icon}</span>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${reached ? 'text-gray-800' : 'text-gray-400'}`}>
                    Lv.{lvl.level} {lvl.title}
                  </p>
                  <p className="text-xs text-gray-400">需要收集 {lvl.threshold} 個角色</p>
                </div>
                {reached && <span className="text-emerald-500 text-sm">✓</span>}
                {isCurrent && <span className="text-[10px] bg-emerald-500 text-white rounded-full px-2 py-0.5">目前</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
