import { Link } from 'react-router-dom';
import { useAppDataContext } from '../lib/AppDataContext';
import { TOTAL_CHARACTER_SLOTS } from '../lib/rewards';

const CARDS = [
  {
    to: '/idioms/chain',
    icon: '🔗',
    title: '成語接龍',
    desc: '用打字或語音接成語，可以無限接下去',
    color: 'bg-teal-100 text-teal-700',
  },
  {
    to: '/idioms/association',
    icon: '🎰',
    title: '一字成語王',
    desc: '拉霸機轉出一個字，找出它在成語四個位置的成語',
    color: 'bg-violet-100 text-violet-700',
  },
  {
    to: '/guwen',
    icon: '🏺',
    title: '古文破譯家',
    desc: '像考古學家一樣，比對語料，自己破解古文字的意思',
    color: 'bg-stone-100 text-stone-700',
  },
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
  {
    to: '/gacha',
    icon: '🎁',
    title: '轉蛋',
    desc: '用金幣轉蛋，收集 2 的 n 次方角色',
    color: 'bg-pink-100 text-pink-700',
  },
  {
    to: '/characters',
    icon: '🎴',
    title: '角色收藏',
    desc: '用星星給角色愛心，培養好感度',
    color: 'bg-amber-100 text-amber-700',
  },
  {
    to: '/notebook',
    icon: '⭐',
    title: '成語筆記本',
    desc: '複習接龍時收藏的成語',
    color: 'bg-yellow-100 text-yellow-700',
  },
];

export default function Home() {
  const { data } = useAppDataContext();
  const idiomsMastered = Object.values(data.idiomStats).filter((s) => s.correct > 0 && s.lastCorrect).length;
  const totalCharacters = Object.keys(data.characters).length;
  const totalSlots = TOTAL_CHARACTER_SLOTS;

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-2xl shadow p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
        <Link to="/progress/currency/coins" className="block hover:bg-gray-50 rounded-xl py-1">
          <p className="text-2xl font-bold text-orange-600">🪙 {data.coins}</p>
          <p className="text-xs text-gray-500 mt-1">金幣</p>
        </Link>
        <Link to="/progress/currency/stars" className="block hover:bg-gray-50 rounded-xl py-1">
          <p className="text-2xl font-bold text-amber-500">⭐ {data.stars}</p>
          <p className="text-xs text-gray-500 mt-1">星星</p>
        </Link>
        <Link to="/characters" className="block hover:bg-gray-50 rounded-xl py-1">
          <p className="text-2xl font-bold text-pink-600">
            {totalCharacters}/{totalSlots}
          </p>
          <p className="text-xs text-gray-500 mt-1">角色收藏</p>
        </Link>
        <Link to="/progress" className="block hover:bg-gray-50 rounded-xl py-1">
          <p className="text-2xl font-bold text-emerald-600">{idiomsMastered}</p>
          <p className="text-xs text-gray-500 mt-1">已答對成語</p>
        </Link>
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
