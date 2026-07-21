import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAppDataContext } from '../lib/AppDataContext';
import {
  GACHA_BASES,
  MAX_EXPONENT,
  HEART_COST_STARS,
  BASE_EMOJI,
  characterId,
  currentUnlockedBase,
  ownedCountForBase,
  formatCharacterLabel,
  formatBigNumber,
  characterValue,
  characterColor,
} from '../lib/rewards';
import { playHeartSound } from '../lib/sound';

export default function CharactersPage() {
  const { data, giveHeart } = useAppDataContext();
  const activeBase = currentUnlockedBase(data.characters);
  const [searchParams] = useSearchParams();
  const baseFromUrl = Number(searchParams.get('base'));
  const initialBase = GACHA_BASES.includes(baseFromUrl as (typeof GACHA_BASES)[number])
    ? baseFromUrl
    : (activeBase ?? GACHA_BASES[0]);
  const [selectedBase, setSelectedBase] = useState<number>(initialBase);

  const exponents = Array.from({ length: MAX_EXPONENT }, (_, i) => i + 1);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-800">角色收藏</h2>
        <p className="text-sm text-gray-500">
          用 ⭐ 星星給角色愛心，每次花 {HEART_COST_STARS} 顆星星，好感度會用數字顯示（例如 2⁵ 代表已經給了 5 次愛心）。
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {GACHA_BASES.map((base) => {
          const owned = ownedCountForBase(data.characters, base);
          const isLocked = base !== activeBase && owned === 0;
          const isSelected = selectedBase === base;
          return (
            <button
              key={base}
              type="button"
              onClick={() => setSelectedBase(base)}
              className={`px-3 py-2 rounded-xl text-sm font-medium border flex items-center gap-2 ${
                isSelected
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
              }`}
            >
              <span className="text-lg">{BASE_EMOJI[base]}</span>
              <span className="flex-1 text-left leading-tight">
                <span className="block">{base} 的 n 次方</span>
                <span className={`block text-[11px] ${isSelected ? 'text-orange-100' : 'text-gray-400'}`}>
                  {owned}/{MAX_EXPONENT}
                </span>
              </span>
              {isLocked && <span>🔒</span>}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-gray-400">
        {ownedCountForBase(data.characters, selectedBase)} / {MAX_EXPONENT} 已收集
      </p>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {exponents.map((exp) => {
          const id = characterId(selectedBase, exp);
          const hearts = data.characters[id];
          const owned = hearts !== undefined;
          const isFull = owned && hearts >= exp;
          const canGiveHeart = owned && !isFull && data.stars >= HEART_COST_STARS;

          return (
            <div
              key={id}
              className={`rounded-xl border p-3 text-center space-y-1 ${
                owned ? 'bg-white border-orange-100' : 'bg-gray-50 border-gray-100'
              }`}
            >
              {owned ? (
                <>
                  <Link to={`/characters/${encodeURIComponent(id)}`} className="block">
                    <div
                      className="mx-auto w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: characterColor(exp) }}
                    >
                      {exp}
                    </div>
                    <p className="text-lg font-extrabold text-orange-600 mt-1">{formatCharacterLabel(selectedBase, exp)}</p>
                    <p className="text-[11px] text-gray-400 leading-tight">
                      {formatBigNumber(characterValue(selectedBase, exp))}
                    </p>
                    <p className="text-xs text-gray-600">
                      好感度：{hearts > 0 ? formatCharacterLabel(selectedBase, hearts) : '尚未培養'}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {hearts} / {exp} 顆愛心{isFull && ' 💯'}
                    </p>
                  </Link>
                  <button
                    type="button"
                    disabled={!canGiveHeart}
                    onClick={() => {
                      if (giveHeart(id)) playHeartSound();
                    }}
                    className="mt-1 w-full text-xs font-medium rounded-full py-1 bg-pink-500 disabled:bg-gray-200 disabled:text-gray-400 text-white"
                  >
                    {isFull ? '已滿 ❤️' : `給愛心 (${HEART_COST_STARS}⭐)`}
                  </button>
                </>
              ) : (
                <p className="text-2xl text-gray-300 py-3">？</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
