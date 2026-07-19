import { useMemo, useState } from 'react';
import { idioms, type Idiom } from '../data/idioms';
import { pickRandom, shuffle } from '../lib/quizUtils';
import { useAppDataContext } from '../lib/AppDataContext';
import { COIN_PER_CORRECT, STAR_PER_CORRECT, QUIZ_PERFECT_BONUS_COINS, QUIZ_PERFECT_BONUS_STARS } from '../lib/rewards';

const QUIZ_LENGTH = 10;

type QuestionType = 'wordToMeaning' | 'meaningToWord';

interface Question {
  idiom: Idiom;
  type: QuestionType;
  options: string[];
  correctAnswer: string;
}

function buildQuestions(): Question[] {
  const chosen = pickRandom(idioms, Math.min(QUIZ_LENGTH, idioms.length));
  return chosen.map((idiom) => {
    const type: QuestionType = Math.random() < 0.5 ? 'wordToMeaning' : 'meaningToWord';
    if (type === 'wordToMeaning') {
      const distractors = pickRandom(idioms, 3, idiom).map((i) => i.meaning);
      return {
        idiom,
        type,
        correctAnswer: idiom.meaning,
        options: shuffle([idiom.meaning, ...distractors]),
      };
    }
    const distractors = pickRandom(idioms, 3, idiom).map((i) => i.word);
    return {
      idiom,
      type,
      correctAnswer: idiom.word,
      options: shuffle([idiom.word, ...distractors]),
    };
  });
}

export default function IdiomsQuiz() {
  const { answer, reward } = useAppDataContext();
  const [questions, setQuestions] = useState<Question[]>(() => buildQuestions());
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [wrongList, setWrongList] = useState<Idiom[]>([]);
  const [finished, setFinished] = useState(false);

  const current = questions[index];

  const progressPct = useMemo(() => Math.round((index / questions.length) * 100), [index, questions.length]);

  function handleSelect(option: string) {
    if (selected) return;
    setSelected(option);
    const correct = option === current.correctAnswer;
    answer('idiomStats', current.idiom.id, correct);
    if (correct) {
      setScore((s) => s + 1);
      reward(COIN_PER_CORRECT, STAR_PER_CORRECT);
    } else {
      setWrongList((w) => [...w, current.idiom]);
    }
  }

  function handleNext() {
    if (index + 1 >= questions.length) {
      if (score === questions.length) {
        reward(QUIZ_PERFECT_BONUS_COINS, QUIZ_PERFECT_BONUS_STARS);
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
            className="mt-2 bg-orange-500 text-white rounded-full px-6 py-2 font-medium hover:bg-orange-600"
          >
            再測一次
          </button>
        </div>

        {wrongList.length > 0 && (
          <div className="bg-white rounded-2xl shadow p-5 space-y-3">
            <h3 className="font-bold text-gray-800">需要加強的成語</h3>
            {wrongList.map((idiom) => (
              <div key={idiom.id} className="border-b last:border-0 border-gray-100 pb-2">
                <p className="font-semibold text-orange-600">{idiom.word}</p>
                <p className="text-sm text-gray-600">{idiom.meaning}</p>
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
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>第 {index + 1} / {questions.length} 題</span>
          <span>得分 {score}</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-orange-500 transition-all" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-6 space-y-4">
        {current.type === 'wordToMeaning' ? (
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-2">這個成語的意思是？</p>
            <p className="text-3xl font-bold text-orange-600">{current.idiom.word}</p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-2">哪一個成語符合這個意思？</p>
            <p className="text-lg font-medium text-gray-800">{current.idiom.meaning}</p>
          </div>
        )}

        <div className="grid gap-3">
          {current.options.map((option) => {
            const isCorrect = option === current.correctAnswer;
            const isSelected = option === selected;
            let style = 'border-gray-200 hover:border-orange-300 bg-white';
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
                className={`text-left border-2 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${style}`}
                disabled={!!selected}
              >
                {option}
              </button>
            );
          })}
        </div>

        {selected && (
          <div className="pt-2">
            {selected === current.correctAnswer ? (
              <p className="text-emerald-600 text-sm font-medium mb-3">✅ 答對了！{current.idiom.example}</p>
            ) : (
              <p className="text-red-500 text-sm font-medium mb-3">
                ❌ 答錯了，正確答案是「{current.correctAnswer}」。{current.idiom.example}
              </p>
            )}
            <button
              type="button"
              onClick={handleNext}
              className="w-full bg-orange-500 text-white rounded-full py-2.5 font-medium hover:bg-orange-600"
            >
              {index + 1 >= questions.length ? '看結果' : '下一題'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
