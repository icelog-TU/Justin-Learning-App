import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppDataContext } from '../lib/AppDataContext';
import {
  GACHA_BASES,
  maxExponentForBase,
  GACHA_COST_COINS,
  BASE_EMOJI,
  currentUnlockedBase,
  ownedCountForBase,
  characterLabelFromId,
  formatBigNumber,
  characterValueFromId,
  TOTAL_CHARACTER_SLOTS,
  arePowerCharactersComplete,
  SEQUENCE_CHARACTER_COLLECTIONS,
  nextIncompleteSequenceCollection,
  ownedSequenceCharacterCount,
  isSequenceCollectionUnlocked,
  type SequenceCharacterKind,
} from '../lib/rewards';
import type { GachaResult } from '../lib/rewards';
import { playGachaSpinSound, playGachaRevealSound } from '../lib/sound';
import { speak } from '../lib/speech';
import { CharacterAvatar } from '../components/CharacterAvatar';

const SEQUENCE_PROGRESS_THEME: Record<SequenceCharacterKind, {
  symbol: string;
  activeBar: string;
  text: string;
}> = {
  square: { symbol: 'text-violet-500', activeBar: 'bg-violet-500', text: 'text-violet-600' },
  cube: { symbol: 'text-sky-500', activeBar: 'bg-sky-500', text: 'text-sky-600' },
  triangular: { symbol: 'text-rose-500', activeBar: 'bg-rose-500', text: 'text-rose-600' },
  fibonacci: { symbol: 'text-amber-500', activeBar: 'bg-amber-500', text: 'text-amber-600' },
  prime: { symbol: 'text-emerald-500', activeBar: 'bg-emerald-500', text: 'text-emerald-600' },
  factorial: { symbol: 'text-indigo-500', activeBar: 'bg-indigo-500', text: 'text-indigo-600' },
};

export default function GachaPage() {
  const { data, rollGacha } = useAppDataContext();
  const [lastResult, setLastResult] = useState<GachaResult | null>(null);
  const [rolling, setRolling] = useState(false);
  const rollingRef = useRef(false);

  const activeBase = currentUnlockedBase(data.characters);
  const powersComplete = arePowerCharactersComplete(data.characters);
  const activeSequenceCollection = powersComplete
    ? nextIncompleteSequenceCollection(data.characters)
    : null;
  const allCollected = powersComplete && activeSequenceCollection === null;
  const canAfford = data.coins >= GACHA_COST_COINS;

  function handleRoll() {
    if (rollingRef.current) return;
    rollingRef.current = true;
    setRolling(true);
    setLastResult(null);
    playGachaSpinSound();
    window.setTimeout(() => {
      const result = rollGacha();
      setLastResult(result);
      setRolling(false);
      rollingRef.current = false;
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
        <p className="text-sm text-gray-500">
          用金幣依序收集次方、平方、立方和四組數字規律角色，共 {TOTAL_CHARACTER_SLOTS} 隻！
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow p-6 text-center space-y-4">
        <div className="flex items-center justify-center gap-2 text-lg font-semibold text-gray-700">
          <span>🪙</span>
          <span>{data.coins}</span>
          <span className="text-xs text-gray-400 font-normal">（每次轉蛋需要 {GACHA_COST_COINS} 枚金幣）</span>
        </div>

        {allCollected ? (
          <p className="text-emerald-600 font-bold py-6">🎉 恭喜！你已經收集了全部 {TOTAL_CHARACTER_SLOTS} 隻角色！</p>
        ) : (
          <>
            <p className="text-sm text-gray-500">
              {activeSequenceCollection ? (
                <>
                  目前可以轉到{' '}
                  <span className={`font-bold ${SEQUENCE_PROGRESS_THEME[activeSequenceCollection.kind].text}`}>
                    {activeSequenceCollection.name}
                  </span>
                  （{ownedSequenceCharacterCount(data.characters, activeSequenceCollection.kind)}
                  {' / '}
                  {activeSequenceCollection.count}）
                </>
              ) : (
                <>
                  目前可以轉到 <span className="font-bold text-orange-600">{activeBase} 的 n 次方</span>角色（
                  {ownedCountForBase(data.characters, activeBase!)} / {maxExponentForBase(activeBase!)}）
                </>
              )}
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
            to={`/characters/${encodeURIComponent(lastResult.id)}`}
            className="block mt-4 bg-orange-50 hover:bg-orange-100 transition-colors rounded-2xl p-6 space-y-2 animate-in fade-in"
          >
            <CharacterAvatar id={lastResult.id} size="medium" className="mx-auto" />
            {lastResult.isDupe ? (
              <>
                <p className="font-bold text-gray-700">
                  抽到重複的 {characterLabelFromId(lastResult.id)}
                </p>
                <p className="text-sm text-gray-500">已經自動換成 ⭐ 星星，可以拿去養角色好感度！</p>
              </>
            ) : (
              <>
                <p className="text-2xl font-extrabold text-orange-600">
                  {characterLabelFromId(lastResult.id)}
                </p>
                <p className="text-sm text-gray-500">
                  = {formatBigNumber(characterValueFromId(lastResult.id))}
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
              <Link
                key={base}
                to={`/characters?base=${base}`}
                className="flex items-center gap-3 rounded-lg hover:bg-gray-50 -mx-1 px-1 py-0.5"
              >
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
              </Link>
            );
          })}
          {SEQUENCE_CHARACTER_COLLECTIONS.map((collection) => {
            const owned = ownedSequenceCharacterCount(data.characters, collection.kind);
            const unlocked = isSequenceCollectionUnlocked(data.characters, collection.kind);
            const isActive = activeSequenceCollection?.kind === collection.kind;
            const theme = SEQUENCE_PROGRESS_THEME[collection.kind];
            return (
              <Link
                key={collection.kind}
                to={`/characters?collection=${collection.slug}`}
                className="flex items-center gap-3 rounded-lg hover:bg-gray-50 -mx-1 px-1 py-0.5"
              >
                <span className={`w-7 text-xl leading-none ${theme.symbol}`}>{collection.symbol}</span>
                <span className="w-20 text-sm font-semibold text-gray-700">{collection.name}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${isActive ? theme.activeBar : 'bg-emerald-500'}`}
                    style={{ width: `${(owned / collection.count) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 w-14 text-right">
                  {!unlocked ? '🔒 未解鎖' : `${owned}/${collection.count}`}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
