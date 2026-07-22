import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppDataContext } from '../lib/AppDataContext';
import {
  GACHA_BASES,
  maxExponentForBase,
  GACHA_COST_COINS,
  BASE_EMOJI,
  currentUnlockedBase,
  ownedCountForBase,
  formatCharacterLabel,
  formatBigNumber,
  characterValue,
  characterId,
  characterColor,
} from '../lib/rewards';
import type { GachaResult } from '../lib/rewards';
import { playGachaSpinSound, playGachaRevealSound } from '../lib/sound';
import { speak } from '../lib/speech';

export default function GachaPage() {
  const { data, rollGacha } = useAppDataContext();
  const [lastResult, setLastResult] = useState<GachaResult | null>(null);
  const [rolling, setRolling] = useState(false);

  const activeBase = currentUnlockedBase(data.characters);
  const canAfford = data.coins >= GACHA_COST_COINS;

  function handleRoll() {
    if (rolling) return;
    setRolling(true);
    setLastResult(null);
    playGachaSpinSound();
    window.setTimeout(() => {
      const result = rollGacha();
      setLastResult(result);
      setRolling(false);
      if (result) {
        playGachaRevealSound(!result.isDupe);
        speak(result.isDupe ? '喔！你轉到已經有的角色了，再接再厲！' : '恭喜！轉到新角色了！');
      }
    }, 500);
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-800">轉蛋</h2>
        <p className="text-sm text-gray-500">用金幣轉蛋，收集 2 的 n 次方角色！</p>
      </div>

      <div className="bg-white rounded-2xl shadow p-6 text-center space-y-4">
        <div className="flex items-center justify-center gap-2 text-lg font-semibold text-gray-700">
          <span>🪙</span>
          <span>{data.coins}</span>
          <span className="text-xs text-gray-400 font-normal">（每次轉蛋需要 {GACHA_COST_COINS} 枚金幣）</span>
        </div>

        {activeBase === null ? (
          <p className="text-emerald-600 font-bold py-6">🎉 恭喜！你已經收集了全部角色！</p>
        ) : (
          <>
            <p className="text-sm text-gray-500">
              目前可以轉到 <span className="font-bold text-orange-600">{activeBase} 的 n 次方</span> 角色（
              {ownedCountForBase(data.characters, activeBase)} / {maxExponentForBase(activeBase)}）
            </p>

            <button
              type="button"
              onClick={handleRoll}
              disabled={!canAfford || rolling}
              className="bg-gradient-to-br from-orange-400 to-pink-500 disabled:from-gray-300 disabled:to-gray-300 text-white text-lg font-bold rounded-full px-8 py-4 shadow-lg hover:scale-105 transition-transform disabled:hover:scale-100"
            >
              {rolling ? '轉蛋中...🎲' : `🎁 轉蛋一次（${GACHA_COST_COINS} 🪙）`}
            </button>
            {!canAfford && <p className="text-xs text-red-400">金幣不夠囉，去完成測驗賺金幣吧！</p>}
          </>
        )}

        {lastResult && (
          <Link
            to={`/characters/${encodeURIComponent(characterId(lastResult.base, lastResult.exponent))}`}
            className="block mt-4 bg-orange-50 hover:bg-orange-100 transition-colors rounded-2xl p-6 space-y-2 animate-in fade-in"
          >
            <div
              className="mx-auto w-20 h-20 rounded-full flex items-center justify-center text-white font-extrabold text-2xl"
              style={{ backgroundColor: characterColor(lastResult.exponent, maxExponentForBase(lastResult.base)) }}
            >
              {lastResult.exponent}
            </div>
            {lastResult.isDupe ? (
              <>
                <p className="font-bold text-gray-700">
                  抽到重複的 {formatCharacterLabel(lastResult.base, lastResult.exponent)}
                </p>
                <p className="text-sm text-gray-500">已經自動換成 ⭐ 星星，可以拿去養角色好感度！</p>
              </>
            ) : (
              <>
                <p className="text-2xl font-extrabold text-orange-600">
                  {formatCharacterLabel(lastResult.base, lastResult.exponent)}
                </p>
                <p className="text-sm text-gray-500">
                  = {formatBigNumber(characterValue(lastResult.base, lastResult.exponent))}
                </p>
                <p className="font-bold text-emerald-600">獲得新角色！</p>
              </>
            )}
            <p className="text-xs font-medium text-orange-500">👉 點我看角色頁面</p>
          </Link>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow p-5">
        <h3 className="font-bold text-gray-800 mb-3">收集進度</h3>
        <div className="space-y-2">
          {GACHA_BASES.map((base) => {
            const owned = ownedCountForBase(data.characters, base);
            const max = maxExponentForBase(base);
            const isActive = base === activeBase;
            const isLocked = activeBase !== null && base > activeBase;
            return (
              <div key={base} className="flex items-center gap-3">
                <span className="text-xl w-7">{BASE_EMOJI[base]}</span>
                <span className="w-16 text-sm font-semibold text-gray-700">{base} 的 n 次方</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${isActive ? 'bg-orange-500' : 'bg-emerald-500'}`}
                    style={{ width: `${(owned / max) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 w-14 text-right">
                  {isLocked ? '🔒 未解鎖' : `${owned}/${max}`}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
