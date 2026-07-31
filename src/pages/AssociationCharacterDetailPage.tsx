import { Link, useParams } from 'react-router-dom';
import { useAppDataContext } from '../lib/AppDataContext';
import { speak } from '../lib/speech';
import { buildIdiomSearchUrl } from '../lib/googleSearch';

const ROW_LABEL = ['第一個字', '第二個字', '第三個字', '第四個字'];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

export default function AssociationCharacterDetailPage() {
  const { char } = useParams<{ char: string }>();
  const { data } = useAppDataContext();

  const target = char ?? '';
  const count = data.associationCracked[target] ?? 0;
  const records = data.associationCrackLog[target] ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm font-medium">
        <Link to="/idioms/association" className="text-violet-600 underline">
          ← 回一字成語王
        </Link>
        <Link to="/progress/association" className="text-teal-600 underline">
          回全部破解字 →
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow p-6 text-center space-y-2">
        <button
          type="button"
          onClick={() => speak(target)}
          className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-4xl font-extrabold shadow-lg"
          aria-label={`聽「${target}」的發音`}
          title={`聽「${target}」的發音`}
        >
          {target}
        </button>
        <p className="text-sm text-gray-500">已經破解 {count} 次</p>
      </div>

      <div className="bg-white rounded-2xl shadow p-5">
        <h3 className="font-bold text-gray-800 mb-3">破解紀錄</h3>
        {records.length === 0 ? (
          <p className="text-sm text-gray-400">還沒有這個字的破解紀錄。</p>
        ) : (
          <div className="space-y-3">
            {records.map((record, i) => (
              <div key={i} className="bg-violet-50 rounded-xl p-4 space-y-2">
                <p className="text-xs font-medium text-violet-500">{formatDate(record.crackedAt)}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {record.words.map((word, wi) => (
                    <div key={wi} className="bg-white rounded-lg px-3 py-2 space-y-1">
                      <p className="text-[11px] text-gray-400">{ROW_LABEL[wi]}是「{target}」</p>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-violet-700">{word}</span>
                        <span className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => speak(word)}
                            className="text-sm leading-none"
                            aria-label="聽發音"
                            title="聽發音"
                          >
                            🔊
                          </button>
                          <a
                            href={buildIdiomSearchUrl(word)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm leading-none"
                            aria-label="查意思／典故"
                            title="查意思／典故"
                          >
                            🔍
                          </a>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
