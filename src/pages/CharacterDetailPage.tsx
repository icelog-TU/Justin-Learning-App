import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAppDataContext } from '../lib/AppDataContext';
import {
  HEART_COST_STARS,
  BASE_EMOJI,
  parseCharacterId,
  formatCharacterLabel,
  formatBigNumber,
  characterValue,
} from '../lib/rewards';
import { playPageEnterSound, playHeartSound, playInteractionSound } from '../lib/sound';

interface Interaction {
  pct: number;
  icon: string;
  label: string;
  message: (base: number, exponent: number, hearts: number) => string;
}

const INTERACTIONS: Interaction[] = [
  {
    pct: 0,
    icon: '👋',
    label: '打招呼',
    message: (base, exponent) => `你好！我是 ${formatCharacterLabel(base, exponent)}，也就是 ${base} 的 ${exponent} 次方！`,
  },
  {
    pct: 0.25,
    icon: '💬',
    label: '聊聊天',
    message: (base, exponent) =>
      `如果每次都變成 ${base} 倍，重複 ${exponent} 次，最後會變成原來的 ${formatBigNumber(characterValue(base, exponent))} 倍喔！`,
  },
  {
    pct: 0.5,
    icon: '🎮',
    label: '一起玩遊戲',
    message: (base, exponent) =>
      exponent > 1
        ? `考考你：${base} 的 ${exponent - 1} 次方是多少？答案是 ${formatBigNumber(characterValue(base, exponent - 1))}！`
        : `我是 ${base} 的 1 次方，就是 ${base} 自己！`,
  },
  {
    pct: 0.75,
    icon: '🤫',
    label: '說悄悄話',
    message: (base, exponent) => `偷偷告訴你，我最要好的朋友是 ${formatCharacterLabel(base, exponent + 1)}！去轉蛋認識他吧～`,
  },
  {
    pct: 1,
    icon: '🌟',
    label: '特別回憶',
    message: (base, exponent) => `謝謝你把愛心都給滿了！${formatCharacterLabel(base, exponent)} 和你是最好的朋友 ❤️`,
  },
];

export default function CharacterDetailPage() {
  const { id: rawId } = useParams<{ id: string }>();
  const id = rawId ? decodeURIComponent(rawId) : '';
  const { data, giveHeart } = useAppDataContext();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    playPageEnterSound();
  }, []);

  const hearts = data.characters[id];

  if (hearts === undefined) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-500">還沒有收集到這個角色喔，去轉蛋試試看吧！</p>
        <Link to="/characters" className="text-teal-600 text-sm font-medium underline">
          ← 回角色收藏
        </Link>
      </div>
    );
  }

  const { base, exponent } = parseCharacterId(id);
  const maxHearts = exponent;
  const isFull = hearts >= maxHearts;
  const canGiveHeart = !isFull && data.stars >= HEART_COST_STARS;

  function handleGiveHeart() {
    if (giveHeart(id)) {
      playHeartSound();
    }
  }

  function handleInteract(interaction: Interaction) {
    setMessage(interaction.message(base, exponent, hearts));
    playInteractionSound();
  }

  return (
    <div className="space-y-4">
      <Link to="/characters" className="text-teal-600 text-sm font-medium underline">
        ← 回角色收藏
      </Link>

      <div className="bg-white rounded-2xl shadow p-6 text-center space-y-2">
        <p className="text-6xl">{BASE_EMOJI[base]}</p>
        <p className="text-3xl font-extrabold text-orange-600">{formatCharacterLabel(base, exponent)}</p>
        <p className="text-sm text-gray-400">= {formatBigNumber(characterValue(base, exponent))}</p>

        <div className="pt-2">
          <p className="text-sm text-gray-600">
            好感度：{hearts > 0 ? formatCharacterLabel(base, hearts) : '尚未培養'}（{hearts} / {maxHearts} 顆愛心
            {isFull && ' 💯'}）
          </p>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-2 max-w-xs mx-auto">
            <div className="h-full bg-pink-500" style={{ width: `${(hearts / maxHearts) * 100}%` }} />
          </div>
        </div>

        <button
          type="button"
          disabled={!canGiveHeart}
          onClick={handleGiveHeart}
          className="mt-2 text-sm font-medium rounded-full px-6 py-2 bg-pink-500 disabled:bg-gray-200 disabled:text-gray-400 text-white"
        >
          {isFull ? '已滿 ❤️' : `給愛心 (${HEART_COST_STARS}⭐)`}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow p-5 space-y-3">
        <h3 className="font-bold text-gray-800">互動</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {INTERACTIONS.map((interaction) => {
            const unlocked = hearts / maxHearts >= interaction.pct;
            return (
              <button
                key={interaction.label}
                type="button"
                disabled={!unlocked}
                onClick={() => handleInteract(interaction)}
                className={`rounded-xl border p-3 text-center space-y-1 ${
                  unlocked
                    ? 'bg-white border-orange-100 hover:border-orange-300'
                    : 'bg-gray-50 border-gray-100 text-gray-300'
                }`}
              >
                <p className="text-2xl">{unlocked ? interaction.icon : '🔒'}</p>
                <p className="text-xs font-medium">{interaction.label}</p>
                {!unlocked && <p className="text-[10px] text-gray-400">好感度達 {interaction.pct * 100}% 解鎖</p>}
              </button>
            );
          })}
        </div>

        {message && (
          <div className="bg-pink-50 rounded-xl p-4 text-sm text-gray-700">
            <span className="font-semibold text-pink-600">{formatCharacterLabel(base, exponent)}：</span>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
