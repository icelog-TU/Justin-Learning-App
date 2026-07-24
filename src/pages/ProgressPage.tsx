import { useState } from 'react';
import { Link } from 'react-router-dom';
import { idioms } from '../data/idioms';
import { confusableQuestions } from '../data/confusables';
import { useAppDataContext } from '../lib/AppDataContext';
import { getStreakDays } from '../lib/storage';
import { GACHA_BASES, TOTAL_CHARACTER_SLOTS, maxExponentForBase, currentLevel } from '../lib/rewards';
import { guwenLessons } from '../data/guwenLesson';

const RECENT_ROUNDS_SHOWN = 5;

export default function ProgressPage() {
  const { data } = useAppDataContext();
  const streak = getStreakDays(data.visitDates);
  const [expandedRound, setExpandedRound] = useState<number | null>(null);
  const [showAllRounds, setShowAllRounds] = useState(false);
  const charactersOwned = Object.keys(data.characters).length;
  const level = currentLevel(charactersOwned);

  const idiomAttempts = Object.values(data.idiomStats);
  const idiomAttemptedCount = idiomAttempts.length;
  const idiomCorrectCount = idiomAttempts.filter((s) => s.lastCorrect).length;

  const confusableAttempts = Object.values(data.confusableStats);
  const confusableAttemptedCount = confusableAttempts.length;
  const confusableCorrectCount = confusableAttempts.filter((s) => s.lastCorrect).length;

  const sentencePassed = data.sentenceLog.filter((s) => s.passed).length;
  const visibleRounds = showAllRounds ? data.chainRoundHistory : data.chainRoundHistory.slice(0, RECENT_ROUNDS_SHOWN);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-800">學習紀錄</h2>
        <p className="text-sm text-gray-500">看看自己累積了多少進步！</p>
      </div>

      <div className="bg-white rounded-2xl shadow p-6 text-center space-y-2">
        <Link to="/progress/level" className="block">
          <p className="text-4xl">{level.icon}</p>
          <p className="font-bold text-lg text-gray-800">
            Lv.{level.level} {level.title}
          </p>
        </Link>
        <div className="flex justify-center gap-6 pt-2 text-sm">
          <Link to="/progress/currency/coins" className="block">
            <p className="text-2xl font-bold text-orange-600">🪙 {data.coins}</p>
            <p className="text-gray-400">金幣</p>
          </Link>
          <Link to="/progress/currency/stars" className="block">
            <p className="text-2xl font-bold text-amber-500">⭐ {data.stars}</p>
            <p className="text-gray-400">星星</p>
          </Link>
          <Link to="/progress/streak" className="block">
            <p className="text-2xl font-bold text-red-500">{streak}</p>
            <p className="text-gray-400">連續天數</p>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-5">
        <h3 className="font-bold text-gray-800 mb-2">🎴 角色收藏</h3>
        <p className="text-sm text-gray-600 mb-2">
          已收集 {charactersOwned} / {TOTAL_CHARACTER_SLOTS} 個角色
        </p>
        <div className="grid grid-cols-3 gap-2 text-center text-xs text-gray-500">
          {GACHA_BASES.map((base) => {
            const max = maxExponentForBase(base);
            const owned = Array.from({ length: max }, (_, i) => i + 1).filter(
              (exp) => data.characters[`${base}^${exp}`] !== undefined,
            ).length;
            return (
              <Link key={base} to={`/characters?base=${base}`} className="rounded-lg py-1 hover:bg-gray-50">
                <p className="font-bold text-gray-700">{owned}/{max}</p>
                <p>{base} 的 n 次方</p>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-5">
        <h3 className="font-bold text-gray-800 mb-1">🏅 古文徽章蒐集區</h3>
        <p className="text-xs text-gray-500 mb-3">
          每破解完一篇古文，就能收下一枚編號徽章——已收集 {guwenLessons.filter((l) => data.guwenProgress[l.id]?.completedAt).length}
          {' / '}
          {guwenLessons.length} 枚
        </p>
        <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
          {guwenLessons.map((l, i) => {
            const earned = Boolean(data.guwenProgress[l.id]?.completedAt);
            return (
              <Link
                key={l.id}
                to={`/guwen-lesson/${l.id}`}
                title={l.title}
                className={`aspect-square rounded-full flex flex-col items-center justify-center text-xs font-bold ${
                  earned
                    ? 'bg-gradient-to-br from-amber-400 to-pink-500 text-white shadow'
                    : 'bg-gray-100 text-gray-300'
                }`}
              >
                <span className="text-base leading-none">{earned ? '🏅' : '🔒'}</span>
                <span className="leading-none mt-0.5">{i + 1}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <Link
        to="/progress/chain-links"
        className="block bg-white rounded-2xl shadow hover:shadow-md transition-shadow p-5 grid grid-cols-2 gap-4 text-center"
      >
        <div>
          <h3 className="font-bold text-gray-800 mb-2 text-sm">🔗 累計接龍次數</h3>
          <p className="text-2xl font-bold text-teal-600">{data.chainStats.totalLinks}</p>
        </div>
        <div>
          <h3 className="font-bold text-gray-800 mb-2 text-sm">🔗 最長連續紀錄</h3>
          <p className="text-2xl font-bold text-teal-600">{data.chainStats.longestChain}</p>
        </div>
      </Link>

      <div className="bg-white rounded-2xl shadow p-5">
        <h3 className="font-bold text-gray-800 mb-1">🔓 一字成語王：已破解的字</h3>
        <p className="text-xs text-gray-500 mb-3">已破解 {Object.keys(data.associationCracked).length} 個字，點一個字可以看破解紀錄</p>
        {Object.keys(data.associationCracked).length === 0 ? (
          <p className="text-sm text-gray-400">還沒有破解任何字，去「一字成語王」挑戰看看！</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {Object.entries(data.associationCracked)
              .reverse()
              .map(([char, count]) => (
                <Link
                  key={char}
                  to={`/progress/association/${encodeURIComponent(char)}`}
                  className="bg-violet-50 hover:bg-violet-100 text-violet-700 font-semibold text-sm rounded-full pl-3 pr-2.5 py-1 flex items-center gap-1"
                >
                  {char}
                  {count > 1 && <span className="text-[11px] text-violet-400 font-normal">x{count}</span>}
                </Link>
              ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow p-5">
        <h3 className="font-bold text-gray-800 mb-2">📜 成語接龍歷史紀錄</h3>
        <p className="text-sm text-gray-600 mb-3">
          已經玩了 {data.chainRoundHistory.length} 輪，點一輪可以展開看接了哪些成語
        </p>
        {data.chainRoundHistory.length === 0 ? (
          <p className="text-sm text-gray-400">還沒有完整結束過一輪接龍，換一次新的開頭字後就會留下紀錄！</p>
        ) : (
          <>
            <div className="space-y-2">
              {visibleRounds.map((round, i) => {
                const isOpen = expandedRound === i;
                return (
                  <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setExpandedRound(isOpen ? null : i)}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100"
                    >
                      <span className="font-medium text-gray-700">
                        第 {data.chainRoundHistory.length - i} 輪 · 接了 {round.length} 個成語
                      </span>
                      <span className="flex items-center gap-2 text-xs text-gray-400">
                        {new Date(round.completedAt).toLocaleString('zh-TW')}
                        <span>{isOpen ? '▲' : '▼'}</span>
                      </span>
                    </button>
                    {isOpen && (
                      <div className="flex flex-wrap items-center gap-2 px-3 py-3">
                        {round.words.map((word, j) => (
                          <div key={j} className="flex items-center gap-2">
                            <span className="bg-teal-50 text-teal-700 font-semibold text-sm rounded-full px-3 py-1">
                              {word}
                            </span>
                            {j < round.words.length - 1 && <span className="text-gray-300">→</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {data.chainRoundHistory.length > RECENT_ROUNDS_SHOWN && (
              <button
                type="button"
                onClick={() => setShowAllRounds((v) => !v)}
                className="w-full mt-3 text-sm font-medium text-teal-600 hover:text-teal-700 py-1"
              >
                {showAllRounds ? '▲ 收起，只看最近 5 輪' : `▼ 顯示全部 ${data.chainRoundHistory.length} 輪`}
              </button>
            )}
          </>
        )}
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
