import { Link } from 'react-router-dom';
import { idioms } from '../data/idioms';
import { confusableQuestions } from '../data/confusables';
import { useAppDataContext } from '../lib/AppDataContext';

const CARDS = [
  {
    to: '/idioms',
    icon: '📖',
    title: '成語卡片',
    desc: '瀏覽成語的意思、例句和小故事',
    color: 'bg-orange-100 text-orange-700',
  },
  {
    to: '/idioms/quiz',
    icon: '🎯',
    title: '成語測驗',
    desc: '選擇題測驗，看看記住了多少成語',
    color: 'bg-sky-100 text-sky-700',
  },
  {
    to: '/idioms/sentence',
    icon: '✏️',
    title: '成語造句',
    desc: '練習用成語寫出一個通順的句子',
    color: 'bg-emerald-100 text-emerald-700',
  },
  {
    to: '/confusables',
    icon: '🔍',
    title: '錯別字測驗',
    desc: '形近字、音近字選字練習',
    color: 'bg-purple-100 text-purple-700',
  },
];

export default function Home() {
  const { data } = useAppDataContext();
  const idiomsMastered = Object.values(data.idiomStats).filter((s) => s.correct > 0 && s.lastCorrect).length;

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-2xl shadow p-5 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-orange-600">{idioms.length}</p>
          <p className="text-xs text-gray-500 mt-1">成語總數</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-emerald-600">{idiomsMastered}</p>
          <p className="text-xs text-gray-500 mt-1">已答對成語</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-purple-600">{confusableQuestions.length}</p>
          <p className="text-xs text-gray-500 mt-1">錯別字題目</p>
        </div>
      </section>

      <section className="grid sm:grid-cols-2 gap-4">
        {CARDS.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="bg-white rounded-2xl shadow hover:shadow-lg transition-shadow p-5 flex gap-4 items-start"
          >
            <div className={`text-3xl rounded-xl w-14 h-14 flex items-center justify-center ${card.color}`}>
              {card.icon}
            </div>
            <div>
              <h2 className="font-bold text-lg text-gray-800">{card.title}</h2>
              <p className="text-sm text-gray-500 mt-1">{card.desc}</p>
            </div>
          </Link>
        ))}
      </section>

      <section className="bg-white rounded-2xl shadow p-5">
        <h2 className="font-bold text-gray-800 mb-2">今日小提醒</h2>
        <p className="text-sm text-gray-500">
          建議每天先玩一次「成語測驗」，再挑 1～2 個成語練習「成語造句」，最後花五分鐘做「錯別字測驗」複習形近字，
          養成每天累積一點點的好習慣！
        </p>
      </section>
    </div>
  );
}
