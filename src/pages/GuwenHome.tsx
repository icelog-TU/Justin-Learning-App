import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppDataContext } from '../lib/AppDataContext';
import { guwenLessons, totalGuwenLessonItems } from '../data/guwenLesson';

export default function GuwenHome() {
  const { data, resetGuwenText } = useAppDataContext();
  const [confirmResetId, setConfirmResetId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-800">🏺 古文破譯家</h2>
        <p className="text-sm text-gray-500 mt-1">
          你是一位古文破譯專家，就像研究古埃及象形文字的考古學家一樣——沒有人會直接告訴你答案，
          要靠比對證據，自己一步步推理出每個字真正的意思。
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow p-5 space-y-2">
        <h3 className="font-bold text-gray-800">🔍 破譯規則</h3>
        <ul className="text-sm text-gray-600 space-y-1.5 list-disc list-inside">
          <li>每篇古文裡，都藏著好幾個「古文字」——看起來眼熟，意思卻跟現在不一樣。</li>
          <li>我們不會直接公布答案，而是給你幾份「語料」，讓你比對哪一份的用法跟古文裡最像。</li>
          <li>把每個古文字都破譯完，你就會發現：自己竟然真的看懂這篇古文了！</li>
        </ul>
      </div>

      <div className="space-y-3">
        {guwenLessons.map((lesson, index) => {
          const progress = data.guwenProgress[lesson.id];
          const decodedCount = progress?.decodedWordIds.length ?? 0;
          const total = totalGuwenLessonItems(lesson);
          const completed = Boolean(progress?.completedAt);
          return (
            <div key={lesson.id} className="bg-white rounded-2xl shadow hover:shadow-lg transition-shadow p-5">
              <Link to={`/guwen-lesson/${lesson.id}`} className="block">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span className="shrink-0 w-7 h-7 rounded-full bg-amber-100 text-amber-700 text-sm font-bold flex items-center justify-center mt-0.5">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="font-bold text-lg text-gray-800">{lesson.title}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">{lesson.source}</p>
                    </div>
                  </div>
                  {completed && <span className="text-2xl shrink-0">🏆</span>}
                </div>
                <p className="text-sm text-gray-500 mt-2 truncate">{lesson.fullText}</p>
                <div className="mt-3">
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500"
                      style={{ width: `${total ? (decodedCount / total) * 100 : 0}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    已破譯 {decodedCount} / {total} 道密碼{completed ? '　全部破解完成！' : ''}
                  </p>
                </div>
              </Link>

              {decodedCount > 0 &&
                (confirmResetId === lesson.id ? (
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-2 text-sm">
                    <span className="text-gray-500">清空重來？已賺的金幣星星不會收回。</span>
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          resetGuwenText(lesson.id);
                          setConfirmResetId(null);
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg px-2.5 py-1"
                      >
                        確定重來
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmResetId(null)}
                        className="text-gray-400 hover:text-gray-600 text-xs"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setConfirmResetId(lesson.id)}
                      className="text-xs text-gray-400 hover:text-gray-600 underline"
                    >
                      🔄 重新開始（清空重來）
                    </button>
                  </div>
                ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
