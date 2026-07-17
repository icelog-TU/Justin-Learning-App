import { idioms } from '../data/idioms';
import { confusableQuestions } from '../data/confusables';
import { useAppDataContext } from '../lib/AppDataContext';
import { getStreakDays } from '../lib/storage';

function badgeFor(points: number) {
  if (points >= 600) return { label: '中文高手', icon: '👑' };
  if (points >= 300) return { label: '成語小達人', icon: '🥇' };
  if (points >= 100) return { label: '進步中的學習者', icon: '🌱' };
  return { label: '初學者', icon: '🐣' };
}

export default function ProgressPage() {
  const { data } = useAppDataContext();
  const streak = getStreakDays(data.visitDates);
  const badge = badgeFor(data.points);

  const idiomAttempts = Object.values(data.idiomStats);
  const idiomAttemptedCount = idiomAttempts.length;
  const idiomCorrectCount = idiomAttempts.filter((s) => s.lastCorrect).length;

  const confusableAttempts = Object.values(data.confusableStats);
  const confusableAttemptedCount = confusableAttempts.length;
  const confusableCorrectCount = confusableAttempts.filter((s) => s.lastCorrect).length;

  const sentencePassed = data.sentenceLog.filter((s) => s.passed).length;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-800">學習紀錄</h2>
        <p className="text-sm text-gray-500">看看自己累積了多少進步！</p>
      </div>

      <div className="bg-white rounded-2xl shadow p-6 text-center space-y-2">
        <p className="text-4xl">{badge.icon}</p>
        <p className="font-bold text-lg text-gray-800">{badge.label}</p>
        <div className="flex justify-center gap-6 pt-2 text-sm">
          <div>
            <p className="text-2xl font-bold text-orange-600">{data.points}</p>
            <p className="text-gray-400">總分</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-500">{streak}</p>
            <p className="text-gray-400">連續天數</p>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow p-5">
          <h3 className="font-bold text-gray-800 mb-2">📖 成語測驗</h3>
          <p className="text-sm text-gray-600">
            已練習 {idiomAttemptedCount} / {idioms.length} 個成語
          </p>
          <p className="text-sm text-gray-600">上次答對 {idiomCorrectCount} 個</p>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-orange-500"
              style={{ width: `${idioms.length ? (idiomAttemptedCount / idioms.length) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow p-5">
          <h3 className="font-bold text-gray-800 mb-2">🔍 錯別字測驗</h3>
          <p className="text-sm text-gray-600">
            已練習 {confusableAttemptedCount} / {confusableQuestions.length} 題
          </p>
          <p className="text-sm text-gray-600">上次答對 {confusableCorrectCount} 題</p>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-purple-500"
              style={{
                width: `${confusableQuestions.length ? (confusableAttemptedCount / confusableQuestions.length) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-5">
        <h3 className="font-bold text-gray-800 mb-2">✏️ 成語造句</h3>
        <p className="text-sm text-gray-600 mb-3">
          總共寫了 {data.sentenceLog.length} 句，通過檢查 {sentencePassed} 句
        </p>
        {data.sentenceLog.length === 0 ? (
          <p className="text-sm text-gray-400">還沒有練習過造句，快去試試看吧！</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {data.sentenceLog.slice(0, 20).map((entry, i) => (
              <div key={i} className="text-sm border-b last:border-0 border-gray-100 pb-2">
                <p className="text-gray-700">
                  {entry.passed ? '✅' : '📝'} <span className="font-semibold text-orange-600">{entry.word}</span>：
                  {entry.sentence}
                </p>
                <p className="text-xs text-gray-400">{new Date(entry.date).toLocaleString('zh-TW')}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
