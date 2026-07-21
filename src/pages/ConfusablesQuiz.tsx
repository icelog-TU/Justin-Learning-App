import { useMemo, useState } from 'react';
import { confusableQuestions, confusableGroups, type ConfusableQuestion } from '../data/confusables';
import { pickRandom, shuffle } from '../lib/quizUtils';
import { useAppDataContext } from '../lib/AppDataContext';
import { COIN_PER_CORRECT, STAR_PER_CORRECT, QUIZ_PERFECT_BONUS_COINS, QUIZ_PERFECT_BONUS_STARS } from '../lib/rewards';

const QUIZ_LENGTH = 12;

interface RoundQuestion extends ConfusableQuestion {
  shuffledOptions: string[];
}

function buildQuestions(): RoundQuestion[] {
  const chosen = pickRandom(confusableQuestions, Math.min(QUIZ_LENGTH, confusableQuestions.length));
  return chosen.map((q) => ({ ...q, shuffledOptions: shuffle(q.options) }));
}

function groupTitle(groupId: string) {
  return confusableGroups.find((g) => g.id === groupId)?.title ?? '';
}

export default function ConfusablesQuiz() {
  const { answer, reward } = useAppDataContext();
  const [questions, setQuestions] = useState<RoundQuestion[]>(() => buildQuestions());
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [wrongList, setWrongList] = useState<RoundQuestion[]>([]);
  const [finished, setFinished] = useState(false);

  const current = questions[index];
  const progressPct = useMemo(() => Math.round((index / questions.length) * 100), [index, questions.length]);

  function handleSelect(option: string) {
    if (selected) return;
    setSelected(option);
    const correct = option === current.answer;
    answer('confusableStats', current.id, correct);
    if (correct) {
      setScore((s) => s + 1);
      reward(COIN_PER_CORRECT, STAR_PER_CORRECT);
    } else {
      setWrongList((w) => [...w, current]);
    }
  }

  function handleNext() {
    if (index + 1 >= questions.length) {
      if (score === questions.length) {
        reward(QUIZ_PERFECT_BONUS_COINS, QUIZ_PERFECT_BONUS_STARS, { big: true });
      }
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
  }

  function handleRestart() {
    setQuestions(buildQuestions());
    setIndex(0);
    setSelected(null);
    setScore(0);
    setWrongList([]);
    setFinished(false);
  }

  if (finished) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-2xl shadow p-6 text-center space-y-2">
          <p className="text-4xl">{score === questions.length ? '🏆' : score >= questions.length * 0.7 ? '🎉' : '💪'}</p>
          <h2 className="text-xl font-bold text-gray-800">
            測驗結束！答對 {score} / {questions.length} 題
          </h2>
          <p className="text-sm text-gray-500">
            獲得 🪙 {score * COIN_PER_CORRECT + (score === questions.length ? QUIZ_PERFECT_BONUS_COINS : 0)}、
            ⭐ {score * STAR_PER_CORRECT + (score === questions.length ? QUIZ_PERFECT_BONUS_STARS : 0)}
            {score === questions.length && '（滿分獎勵！）'}
          </p>
          <button
            type="button"
            onClick={handleRestart}
            className="mt-2 bg-purple-500 text-white rounded-full px-6 py-2 font-medium hover:bg-purple-600"
          >
            再測一次
          </button>
        </div>

        {wrongList.length > 0 && (
          <div className="bg-white rounded-2xl shadow p-5 space-y-3">
            <h3 className="font-bold text-gray-800">需要加強的字</h3>
            {wrongList.map((q) => (
              <div key={q.id} className="border-b last:border-0 border-gray-100 pb-2">
                <p className="font-semibold text-purple-600">{groupTitle(q.groupId)}</p>
                <p className="text-sm text-gray-600">{q.sentence.replace('___', `【${q.answer}】`)}</p>
                <p className="text-xs text-gray-400">{q.explanation}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-1">錯別字測驗</h2>
        <p className="text-sm text-gray-500 mb-3">選出空格中正確的字。</p>
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>第 {index + 1} / {questions.length} 題</span>
          <span>得分 {score}</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-purple-500 transition-all" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-6 space-y-4">
        <p className="text-xs text-gray-400">{groupTitle(current.groupId)}</p>
        <p className="text-xl font-medium text-gray-800 leading-relaxed">
          {current.sentence.split('___')[0]}
          <span className="inline-block border-b-2 border-purple-400 min-w-[2.5rem] text-center text-purple-500">
            ＿＿
          </span>
          {current.sentence.split('___')[1]}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {current.shuffledOptions.map((option) => {
            const isCorrect = option === current.answer;
            const isSelected = option === selected;
            let style = 'border-gray-200 hover:border-purple-300 bg-white';
            if (selected) {
              if (isCorrect) style = 'border-emerald-500 bg-emerald-50 text-emerald-700';
              else if (isSelected) style = 'border-red-400 bg-red-50 text-red-600';
              else style = 'border-gray-100 bg-gray-50 text-gray-400';
            }
            return (
              <button
                key={option}
                type="button"
                onClick={() => handleSelect(option)}
                className={`text-center border-2 rounded-xl px-4 py-4 text-2xl font-bold transition-colors ${style}`}
                disabled={!!selected}
              >
                {option}
              </button>
            );
          })}
        </div>

        {selected && (
          <div className="pt-2">
            {selected === current.answer ? (
              <p className="text-emerald-600 text-sm font-medium mb-3">✅ 答對了！{current.explanation}</p>
            ) : (
              <p className="text-red-500 text-sm font-medium mb-3">
                ❌ 答錯了，正確答案是「{current.answer}」。{current.explanation}
              </p>
            )}
            <button
              type="button"
              onClick={handleNext}
              className="w-full bg-purple-500 text-white rounded-full py-2.5 font-medium hover:bg-purple-600"
            >
              {index + 1 >= questions.length ? '看結果' : '下一題'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
