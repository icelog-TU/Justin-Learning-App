import { useMemo, useState } from 'react';
import { idioms, IDIOM_CATEGORIES, type IdiomCategory } from '../data/idioms';
import IdiomCard from '../components/IdiomCard';

export default function IdiomsBrowse() {
  const [category, setCategory] = useState<IdiomCategory | '全部'>('全部');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return idioms.filter((idiom) => {
      const matchCategory = category === '全部' || idiom.category === category;
      const matchSearch = search.trim() === '' || idiom.word.includes(search.trim()) || idiom.meaning.includes(search.trim());
      return matchCategory && matchSearch;
    });
  }, [category, search]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-800">成語卡片</h2>
        <p className="text-sm text-gray-500">點卡片可以翻面，看成語的意思、例句和小故事。</p>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="搜尋成語或關鍵字..."
        className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
      />

      <div className="flex gap-2 overflow-x-auto pb-1">
        {(['全部', ...IDIOM_CATEGORIES] as const).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-medium border ${
              category === c
                ? 'bg-orange-500 text-white border-orange-500'
                : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-400">共 {filtered.length} 個成語</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((idiom) => (
          <IdiomCard key={idiom.id} idiom={idiom} />
        ))}
      </div>
    </div>
  );
}
