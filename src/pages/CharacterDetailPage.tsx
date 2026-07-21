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
import { numberToChineseWords } from '../lib/chineseNumber';
import { speak } from '../lib/speech';
import { playPageEnterSound, playHeartSound, playInteractionSound, playUnlockFanfare } from '../lib/sound';

interface InteractionTier {
  requiredHearts: number;
  icon: string;
  label: string;
  message: string;
}

const TEMPLATES: {
  icon: string;
  label: string;
  message: (base: number, exponent: number, requiredHearts: number) => string;
}[] = [
  {
    icon: '👋',
    label: '打招呼',
    message: (base, exponent) => `你好！我是 ${formatCharacterLabel(base, exponent)}，也就是 ${base} 的 ${exponent} 次方！`,
  },
  {
    icon: '💬',
    label: '聊聊天',
    message: (base, _exponent, requiredHearts) =>
      `如果每次都變成 ${base} 倍，重複 ${requiredHearts} 次，會變成原來的 ${formatBigNumber(characterValue(base, requiredHearts))} 倍！`,
  },
  {
    icon: '🎮',
    label: '一起玩遊戲',
    message: (base, _exponent, requiredHearts) =>
      requiredHearts > 1
        ? `考考你：${base} 的 ${requiredHearts - 1} 次方是多少？答案是 ${formatBigNumber(characterValue(base, requiredHearts - 1))}！`
        : `我是 ${base} 的 1 次方，就是 ${base} 自己！`,
  },
  {
    icon: '🤫',
    label: '說悄悄話',
    message: (base, exponent) => `偷偷告訴你，我最要好的朋友是 ${formatCharacterLabel(base, exponent + 1)}！去轉蛋認識他吧～`,
  },
  {
    icon: '🌟',
    label: '特別時刻',
    message: (_base, _exponent, requiredHearts) => `謝謝你給我 ${requiredHearts} 顆愛心！我們的感情越來越好了 ❤️`,
  },
];

/** More hearts = more unlockable tiers, roughly one every 2 hearts, so big numbers stay a real journey. */
function buildInteractionTiers(base: number, exponent: number, maxHearts: number): InteractionTier[] {
  const tierCount = Math.max(1, Math.round(maxHearts / 2));
  const tiers: InteractionTier[] = [];
  for (let i = 1; i <= tierCount; i++) {
    const requiredHearts = Math.round((i / tierCount) * maxHearts);
    const template = TEMPLATES[(i - 1) % TEMPLATES.length];
    tiers.push({
      requiredHearts,
      icon: template.icon,
      label: template.label,
      message: template.message(base, exponent, requiredHearts),
    });
  }
  return tiers;
}

export default function CharacterDetailPage() {
  const { id: rawId } = useParams<{ id: string }>();
  const id = rawId ? decodeURIComponent(rawId) : '';
  const { data, giveHeart } = useAppDataContext();
  const [message, setMessage] = useState<string | null>(null);
  const [justUnlocked, setJustUnlocked] = useState<number | null>(null);

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
  const tiers = buildInteractionTiers(base, exponent, maxHearts);
  const value = characterValue(base, exponent);
  const label = formatCharacterLabel(base, exponent);

  function handleGiveHeart() {
    const before = hearts;
    if (!giveHeart(id)) return;
    playHeartSound();
    const after = before + 1;
    const newlyUnlockedIndex = tiers.findIndex((tier) => tier.requiredHearts > before && tier.requiredHearts <= after);
    if (newlyUnlockedIndex !== -1) {
      playUnlockFanfare();
      setJustUnlocked(newlyUnlockedIndex);
      window.setTimeout(() => setJustUnlocked(null), 700);
    }
  }

  function handleGreeting() {
    const text = `你好！我是 ${label}，也就是 ${base} 的 ${exponent} 次方！`;
    setMessage(text);
    speak(text);
  }

  function handleSpeakValue() {
    speak(numberToChineseWords(value));
  }

  function handleInteract(tier: InteractionTier) {
    setMessage(tier.message);
    playInteractionSound();
    speak(tier.message);
  }

  return (
    <div className="space-y-4">
      <Link to="/characters" className="text-teal-600 text-sm font-medium underline">
        ← 回角色收藏
      </Link>

      <div className="bg-white rounded-2xl shadow p-6 text-center space-y-2">
        <button type="button" onClick={handleGreeting} className="mx-auto block" aria-label="跟角色打招呼">
          <p className="text-6xl">{BASE_EMOJI[base]}</p>
          <p className="text-3xl font-extrabold text-orange-600">{label}</p>
        </button>
        <p className="text-sm text-gray-400 flex items-center justify-center gap-1.5">
          = {formatBigNumber(value)}
          <button
            type="button"
            onClick={handleSpeakValue}
            className="text-sky-500 hover:text-sky-600"
            aria-label="唸出這個數字"
            title="唸出這個數字"
          >
            🔊
          </button>
        </p>

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

      {message && (
        <div className="bg-pink-50 rounded-2xl shadow p-4 text-sm text-gray-700">
          <span className="font-semibold text-pink-600">{label}：</span>
          {message}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow p-5 space-y-3">
        <h3 className="font-bold text-gray-800">互動（共 {tiers.length} 種）</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {tiers.map((tier, i) => {
            const unlocked = hearts >= tier.requiredHearts;
            return (
              <button
                key={i}
                type="button"
                disabled={!unlocked}
                onClick={() => handleInteract(tier)}
                style={justUnlocked === i ? { animation: 'unlock-pop 0.7s ease-out' } : undefined}
                className={`rounded-xl border p-3 text-center space-y-1 ${
                  unlocked
                    ? 'bg-white border-orange-100 hover:border-orange-300'
                    : 'bg-gray-50 border-gray-100 text-gray-300'
                }`}
              >
                <p className="text-2xl">{unlocked ? tier.icon : '🔒'}</p>
                <p className="text-xs font-medium">{tier.label}</p>
                <p className={`text-[10px] ${unlocked ? 'text-pink-500' : 'text-gray-400'}`}>
                  需要 {tier.requiredHearts} 顆愛心
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
