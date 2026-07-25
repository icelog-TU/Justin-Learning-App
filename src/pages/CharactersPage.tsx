import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAppDataContext } from '../lib/AppDataContext';
import {
  GACHA_BASES,
  maxExponentForBase,
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

type CharacterSort = 'exponent-asc' | 'exponent-desc' | 'missing-desc' | 'missing-asc';

export default function CharactersPage() {
  const { data, giveHeart } = useAppDataContext();
  const activeBase = currentUnlockedBase(data.characters);
  const [searchParams] = useSearchParams();
  const baseFromUrl = Number(searchParams.get('base'));
  const initialBase = GACHA_BASES.includes(baseFromUrl as (typeof GACHA_BASES)[number])
    ? baseFromUrl
    : (activeBase ?? GACHA_BASES[0]);
  const [selectedBase, setSelectedBase] = useState<number>(initialBase);
  const [onlyNeedsHearts, setOnlyNeedsHearts] = useState(false);
  const [sortBy, setSortBy] = useState<CharacterSort>('exponent-asc');

  const selectedBaseMaxExponent = maxExponentForBase(selectedBase);
  const exponents = Array.from({ length: selectedBaseMaxExponent }, (_, i) => i + 1)
    .filter((exp) => {
      if (!onlyNeedsHearts) return true;
      const hearts = data.characters[characterId(selectedBase, exp)];
      return hearts !== undefined && hearts < exp;
    })
    .sort((a, b) => {
      const heartsA = data.characters[characterId(selectedBase, a)];
      const heartsB = data.characters[characterId(selectedBase, b)];
      const ownedA = heartsA !== undefined;
      const ownedB = heartsB !== undefined;

      if (sortBy === 'missing-desc' || sortBy === 'missing-asc') {
        if (ownedA !== ownedB) return ownedA ? -1 : 1;
        if (!ownedA || !ownedB) return a - b;
        const missingA = a - (heartsA ?? 0);
        const missingB = b - (heartsB ?? 0);
        const difference = sortBy === 'missing-desc' ? missingB - missingA : missingA - missingB;
        return difference || a - b;
      }

      return sortBy === 'exponent-desc' ? b - a : a - b;
    });

  const needsHeartsCount = Array.from({ length: selectedBaseMaxExponent }, (_, i) => i + 1).filter((exp) => {
    const hearts = data.characters[characterId(selectedBase, exp)];
    return hearts !== undefined && hearts < exp;
  }).length;

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
                  {owned}/{maxExponentForBase(base)}
                </span>
              </span>
              {isLocked && <span>🔒</span>}
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border-2 border-pink-200 bg-pink-50 p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-bold text-pink-700">快速補愛心</p>
            <p className="text-xs text-pink-500">篩選待補角色，再決定排列順序</p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-pink-600 shadow-sm">
            {needsHeartsCount} 隻待補
          </span>
        </div>

        <label className="flex items-center gap-3 rounded-xl bg-white px-3 py-3 text-sm font-semibold text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={onlyNeedsHearts}
            onChange={(event) => setOnlyNeedsHearts(event.target.checked)}
            className="h-5 w-5 accent-pink-500"
          />
          只顯示愛心未填滿的角色
        </label>

        <label className="block text-sm font-semibold text-gray-700">
          <span className="mb-1 block">角色排序</span>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as CharacterSort)}
            className="w-full rounded-xl border border-pink-200 bg-white px-3 py-3 text-sm text-gray-700"
          >
            <option value="exponent-asc">次方：小到大</option>
            <option value="exponent-desc">次方：大到小</option>
            <option value="missing-desc">愛心缺最多的在最上面</option>
            <option value="missing-asc">愛心最接近填滿的在最上面</option>
          </select>
        </label>
      </div>

      <p className="text-xs text-gray-400">
        {ownedCountForBase(data.characters, selectedBase)} / {selectedBaseMaxExponent} 已收集
        {onlyNeedsHearts && `・目前顯示 ${exponents.length} 隻待補愛心角色`}
      </p>

      {exponents.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {exponents.map((exp) => {
            const id = characterId(selectedBase, exp);
            const hearts = data.characters[id];
            const owned = hearts !== undefined;
            const currentHearts = hearts ?? 0;
            const isFull = owned && currentHearts >= exp;
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
                        style={{ backgroundColor: characterColor(exp, selectedBaseMaxExponent) }}
                      >
                        {exp}
                      </div>
                      <p className="text-lg font-extrabold text-orange-600 mt-1">{formatCharacterLabel(selectedBase, exp)}</p>
                      <p className="text-[11px] text-gray-400 leading-tight">
                        {formatBigNumber(characterValue(selectedBase, exp))}
                      </p>
                      <p className="text-xs text-gray-600">
                        好感度：{currentHearts > 0 ? formatCharacterLabel(selectedBase, currentHearts) : '尚未培養'}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {currentHearts} / {exp} 顆愛心{isFull && ' 💯'}
                      </p>
                      {!isFull && <p className="text-[11px] font-medium text-pink-500">還缺 {exp - currentHearts} 顆</p>}
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
      ) : (
        <div className="rounded-2xl bg-emerald-50 p-6 text-center text-sm font-medium text-emerald-700">
          🎉 這一組已收集角色的愛心都填滿了！
        </div>
      )}
    </div>
  );
}
