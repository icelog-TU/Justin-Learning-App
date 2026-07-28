import { useAppDataContext } from '../lib/AppDataContext';
import { buildIdiomSearchUrl } from '../lib/googleSearch';

const MOE_ATTRIBUTION = '資料來源：教育部《成語典》（創用CC 姓名標示－禁止改作 3.0 台灣授權條款）';

export default function NotebookPage() {
  const { data, toggleBookmark } = useAppDataContext();
  const bookmarks = data.bookmarkedIdioms;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-800">⭐ 成語筆記本</h2>
        <p className="text-sm text-gray-500">收藏接龍時學到的成語，之後可以隨時回來複習。</p>
      </div>

      {bookmarks.length === 0 ? (
        <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-400 text-sm">
          還沒有收藏任何成語喔！在「成語接龍師」的提示卡片或接龍紀錄上按 ☆ 就可以收藏。
        </div>
      ) : (
        <div className="space-y-3">
          {bookmarks.map((entry) => (
            <div key={entry.word} className="bg-white rounded-2xl shadow p-4 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xl font-bold text-teal-700">{entry.word}</p>
                <button
                  type="button"
                  onClick={() => toggleBookmark(entry)}
                  className="text-xl leading-none shrink-0"
                  aria-label="取消收藏"
                  title="取消收藏"
                >
                  ⭐
                </button>
              </div>
              {entry.meaning ? (
                <>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold text-gray-500">意思：</span>
                    {entry.meaning}
                  </p>
                  {entry.source === 'moe' && <p className="text-[11px] text-gray-400">{MOE_ATTRIBUTION}</p>}
                </>
              ) : (
                <p className="text-xs text-gray-400">還沒有這個成語的解釋</p>
              )}
              <div className="flex justify-end pt-1">
                <a
                  href={buildIdiomSearchUrl(entry.word)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-xs font-medium bg-sky-500 text-white rounded-full px-3 py-1.5 hover:bg-sky-600"
                >
                  🔍 查意思／典故
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

