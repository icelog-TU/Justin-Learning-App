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
  formatBigNumber,
  characterLabelFromId,
  characterValueFromId,
  SEQUENCE_CHARACTER_COLLECTIONS,
  getSequenceCollection,
  getSequenceCollectionBySlug,
  sequenceCharacterId,
  ownedSequenceCharacterCount,
  isSequenceCollectionUnlocked,
  type SequenceCharacterKind,
} from '../lib/rewards';
import { playHeartSound } from '../lib/sound';
import { CharacterAvatar } from '../components/CharacterAvatar';

type CharacterSort = 'exponent-asc' | 'exponent-desc' | 'missing-desc' | 'missing-asc';
type CollectionSelection = number | SequenceCharacterKind;

const SEQUENCE_THEME: Record<SequenceCharacterKind, {
  selected: string;
  idle: string;
  symbol: string;
  selectedSubtext: string;
  cardText: string;
}> = {
  square: {
    selected: 'bg-violet-500 text-white border-violet-500',
    idle: 'bg-white text-gray-600 border-gray-200 hover:border-violet-300',
    symbol: 'text-violet-500',
    selectedSubtext: 'text-violet-100',
    cardText: 'text-violet-600',
  },
  cube: {
    selected: 'bg-sky-500 text-white border-sky-500',
    idle: 'bg-white text-gray-600 border-gray-200 hover:border-sky-300',
    symbol: 'text-sky-500',
    selectedSubtext: 'text-sky-100',
    cardText: 'text-sky-600',
  },
  triangular: {
    selected: 'bg-rose-500 text-white border-rose-500',
    idle: 'bg-white text-gray-600 border-gray-200 hover:border-rose-300',
    symbol: 'text-rose-500',
    selectedSubtext: 'text-rose-100',
    cardText: 'text-rose-600',
  },
  fibonacci: {
    selected: 'bg-amber-500 text-white border-amber-500',
    idle: 'bg-white text-gray-600 border-gray-200 hover:border-amber-300',
    symbol: 'text-amber-500',
    selectedSubtext: 'text-amber-100',
    cardText: 'text-amber-600',
  },
  prime: {
    selected: 'bg-emerald-500 text-white border-emerald-500',
    idle: 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300',
    symbol: 'text-emerald-500',
    selectedSubtext: 'text-emerald-100',
    cardText: 'text-emerald-600',
  },
  factorial: {
    selected: 'bg-indigo-500 text-white border-indigo-500',
    idle: 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300',
    symbol: 'text-indigo-500',
    selectedSubtext: 'text-indigo-100',
    cardText: 'text-indigo-600',
  },
};

export default function CharactersPage() {
  const { data, giveHeart } = useAppDataContext();
  const activeBase = currentUnlockedBase(data.characters);
  const [searchParams] = useSearchParams();
  const baseFromUrl = Number(searchParams.get('base'));
  const requestedCollection = searchParams.get('collection');
  const requestedSequence = getSequenceCollectionBySlug(requestedCollection);
  const initialCollection: CollectionSelection = requestedSequence
    ? requestedSequence.kind
    : GACHA_BASES.includes(baseFromUrl as (typeof GACHA_BASES)[number])
      ? baseFromUrl
      : (activeBase ?? GACHA_BASES[0]);
  const [selectedCollection, setSelectedCollection] = useState<CollectionSelection>(initialCollection);
  const [onlyNeedsHearts, setOnlyNeedsHearts] = useState(false);
  const [sortBy, setSortBy] = useState<CharacterSort>('exponent-asc');

  const selectedSequence = typeof selectedCollection === 'number'
    ? null
    : getSequenceCollection(selectedCollection);
  const selectedCount = selectedSequence?.count ?? maxExponentForBase(selectedCollection as number);
  const idForIndex = (index: number) => {
    if (selectedSequence) return sequenceCharacterId(selectedSequence.kind, index);
    return characterId(selectedCollection as number, index);
  };
  const characterIndexes = Array.from({ length: selectedCount }, (_, i) => i + 1)
    .filter((index) => {
      if (!onlyNeedsHearts) return true;
      const hearts = data.characters[idForIndex(index)];
      return hearts !== undefined && hearts < index;
    })
    .sort((a, b) => {
      const heartsA = data.characters[idForIndex(a)];
      const heartsB = data.characters[idForIndex(b)];
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

  const needsHeartsCount = Array.from({ length: selectedCount }, (_, i) => i + 1).filter((index) => {
    const hearts = data.characters[idForIndex(index)];
    return hearts !== undefined && hearts < index;
  }).length;
  const selectedOwnedCount = selectedSequence
    ? ownedSequenceCharacterCount(data.characters, selectedSequence.kind)
    : ownedCountForBase(data.characters, selectedCollection as number);

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-gray-800">角色收藏</h2>
          <Link
            to="/gacha"
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-orange-400 to-pink-500 px-4 py-2 text-sm font-bold text-white shadow-md transition-transform hover:scale-105 active:scale-95"
          >
            🎁 去轉蛋
          </Link>
        </div>
        <p className="text-sm text-gray-500">
          用 ⭐ 星星給角色愛心，每次花 {HEART_COST_STARS} 顆星星；好感度會直接顯示已經獲得的愛心數量。
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {GACHA_BASES.map((base) => {
          const owned = ownedCountForBase(data.characters, base);
          const isLocked = base !== activeBase && owned === 0;
          const isSelected = selectedCollection === base;
          return (
            <button
              key={base}
              type="button"
              onClick={() => setSelectedCollection(base)}
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
        {SEQUENCE_CHARACTER_COLLECTIONS.map((collection) => {
          const isSelected = selectedCollection === collection.kind;
          const theme = SEQUENCE_THEME[collection.kind];
          const owned = ownedSequenceCharacterCount(data.characters, collection.kind);
          const unlocked = isSequenceCollectionUnlocked(data.characters, collection.kind);
          return (
            <button
              key={collection.kind}
              type="button"
              onClick={() => setSelectedCollection(collection.kind)}
              className={`px-3 py-2 rounded-xl text-sm font-medium border flex items-center gap-2 ${
                isSelected ? theme.selected : theme.idle
              }`}
            >
              <span className={`text-xl leading-none ${isSelected ? 'text-white' : theme.symbol}`}>
                {collection.symbol}
              </span>
              <span className="flex-1 text-left leading-tight">
                <span className="block">{collection.rangeLabel}</span>
                <span className={`block text-[11px] ${isSelected ? theme.selectedSubtext : 'text-gray-400'}`}>
                  {owned}/{collection.count}
                </span>
              </span>
              {!unlocked && <span>🔒</span>}
            </button>
          );
        })}
      </div>

      <details className="group rounded-2xl border-2 border-pink-200 bg-pink-50 p-4 shadow-sm">
        <summary className="flex items-center justify-between gap-3 cursor-pointer list-none">
          <div>
            <p className="font-bold text-pink-700">快速補愛心</p>
            <p className="text-xs text-pink-500">預設收合，需要時點這裡展開</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-pink-600 shadow-sm">
              {needsHeartsCount} 隻待補
            </span>
            <span className="text-pink-500 transition-transform group-open:rotate-180">▼</span>
          </div>
        </summary>

        <div className="space-y-3 pt-3">
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
              <option value="exponent-asc">{selectedSequence ? '編號' : '次方'}：小到大</option>
              <option value="exponent-desc">{selectedSequence ? '編號' : '次方'}：大到小</option>
              <option value="missing-desc">愛心缺最多的在最上面</option>
              <option value="missing-asc">愛心最接近填滿的在最上面</option>
            </select>
          </label>
        </div>
      </details>

      <p className="text-xs text-gray-400">
        {selectedOwnedCount} / {selectedCount} 已收集
        {onlyNeedsHearts && `・目前顯示 ${characterIndexes.length} 隻待補愛心角色`}
      </p>

      {characterIndexes.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {characterIndexes.map((index) => {
            const id = idForIndex(index);
            const hearts = data.characters[id];
            const owned = hearts !== undefined;
            const currentHearts = hearts ?? 0;
            const isFull = owned && currentHearts >= index;
            const canGiveHeart = owned && !isFull && data.stars >= HEART_COST_STARS;
            const label = characterLabelFromId(id);
            const value = characterValueFromId(id);
            const labelColor = selectedSequence
              ? SEQUENCE_THEME[selectedSequence.kind].cardText
              : 'text-orange-600';

            return (
              <div
                key={id}
                data-character-card={id}
                className={`overflow-hidden rounded-xl border text-center ${
                  owned ? 'bg-white border-orange-100' : 'bg-gray-50 border-gray-100'
                }`}
              >
                {owned ? (
                  <>
                    <Link
                      to={`/characters/${encodeURIComponent(id)}`}
                      className="block px-3 pb-4 pt-3 hover:bg-orange-50/50"
                    >
                      <CharacterAvatar id={id} className="mx-auto" />
                      <p className={`text-lg font-extrabold mt-1 ${labelColor}`}>
                        {label}
                      </p>
                      <p className="break-all text-[11px] text-gray-400 leading-tight">
                        {formatBigNumber(value)}
                      </p>
                      <p className="text-xs text-gray-600">
                        好感度：{currentHearts > 0 ? `${currentHearts} 顆` : '尚未培養'}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {currentHearts} / {index} 顆愛心{isFull && ' 💯'}
                      </p>
                      {!isFull && <p className="text-[11px] font-medium text-pink-500">還缺 {index - currentHearts} 顆</p>}
                      <p className="mt-2 text-[10px] font-medium text-gray-400">查看角色互動 ›</p>
                    </Link>
                    <div className="border-t-2 border-pink-100 bg-pink-50/80 px-2.5 py-2.5">
                      <button
                        type="button"
                        data-heart-button={id}
                        disabled={!canGiveHeart}
                        onClick={() => {
                          if (giveHeart(id)) playHeartSound();
                        }}
                        className="min-h-11 w-full rounded-xl bg-pink-500 px-2 py-2 text-xs font-bold text-white shadow-sm active:scale-95 disabled:bg-gray-200 disabled:text-gray-400"
                      >
                        {isFull ? '已滿 ❤️' : `給愛心 (${HEART_COST_STARS}⭐)`}
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="p-3 py-6 text-2xl text-gray-300">？</p>
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
