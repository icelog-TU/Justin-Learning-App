import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAppDataContext } from '../lib/AppDataContext';
import {
  HEART_COST_STARS,
  parseCharacterId,
  formatCharacterLabel,
  formatBigNumber,
  characterValue,
  characterColor,
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
    message: (base, exponent) => `你好！我是 ${base} 的 ${exponent} 次方！`,
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
    message: (base, exponent) => `偷偷告訴你，我最要好的朋友是 ${base} 的 ${exponent + 1} 次方！去轉蛋認識他吧～`,
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

interface HeartParticle {
  id: number;
  tx: number;
  ty: number;
  rot: number;
  delay: number;
}

function buildHeartParticles(idSeed: number): HeartParticle[] {
  return Array.from({ length: 7 }, (_, i) => ({
    id: idSeed + i,
    tx: (Math.random() - 0.5) * 170,
    ty: -(70 + Math.random() * 110),
    rot: (Math.random() - 0.5) * 200,
    delay: Math.random() * 0.12,
  }));
}

export default function CharacterDetailPage() {
  const { id: rawId } = useParams<{ id: string }>();
  const id = rawId ? decodeURIComponent(rawId) : '';
  const { data, giveHeart } = useAppDataContext();
  const [message, setMessage] = useState<string | null>(null);
  const [justUnlocked, setJustUnlocked] = useState<number | null>(null);
  const [heartParticles, setHeartParticles] = useState<HeartParticle[]>([]);
  const [shaking, setShaking] = useState(false);
  const [seenTiers, setSeenTiers] = useState<Set<number>>(new Set());
  const particleIdRef = useRef(0);

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
  const color = characterColor(exponent);

  function handleGiveHeart() {
    const before = hearts;
    if (!giveHeart(id)) return;
    playHeartSound();

    particleIdRef.current += 7;
    setHeartParticles(buildHeartParticles(particleIdRef.current));
    setShaking(true);
    window.setTimeout(() => setHeartParticles([]), 950);
    window.setTimeout(() => setShaking(false), 650);

    const after = before + 1;
    const newlyUnlockedIndex = tiers.findIndex((tier) => tier.requiredHearts > before && tier.requiredHearts <= after);
    if (newlyUnlockedIndex !== -1) {
      playUnlockFanfare();
      setJustUnlocked(newlyUnlockedIndex);
      window.setTimeout(() => setJustUnlocked(null), 700);
      window.setTimeout(() => speak('恭喜！解鎖新互動！'), 550);
    }
  }

  function handleGreeting() {
    const text = TEMPLATES[0].message(base, exponent, 0);
    setMessage(text);
    speak(text);
  }

  function handleSpeakValue() {
    speak(numberToChineseWords(value));
  }

  function handleInteract(tier: InteractionTier, index: number) {
    setMessage(tier.message);
    playInteractionSound();
    speak(tier.message);
    setSeenTiers((prev) => new Set(prev).add(index));
  }

  return (
    <div className="space-y-4">
      <Link to="/characters" className="text-teal-600 text-sm font-medium underline">
        ← 回角色收藏
      </Link>

      <div className="bg-white rounded-2xl shadow p-6 text-center space-y-3">
        <button type="button" onClick={handleGreeting} className="mx-auto block" aria-label="跟角色打招呼">
          <div className="relative mx-auto w-28 h-28">
            {heartParticles.map((p) => (
              <span
                key={p.id}
                className="absolute text-2xl left-1/2 top-1/2"
                style={
                  {
                    '--tx': `${p.tx}px`,
                    '--ty': `${p.ty}px`,
                    '--rot': `${p.rot}deg`,
                    animation: `heart-burst-particle 0.9s ease-out ${p.delay}s forwards`,
                  } as React.CSSProperties
                }
              >
                💗
              </span>
            ))}
            <div
              className="w-28 h-28 rounded-full flex items-center justify-center text-white font-extrabold text-3xl shadow-inner"
              style={{
                backgroundColor: color,
                animation: shaking ? 'heart-happy 0.65s ease-in-out' : undefined,
              }}
            >
              {exponent}
            </div>
          </div>
          <p className="text-3xl font-extrabold text-orange-600 mt-3">{label}</p>
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
          <p className="text-sm text-gray-600 mb-2">
            好感度：{hearts > 0 ? formatCharacterLabel(base, hearts) : '尚未培養'}（{hearts} / {maxHearts} 顆愛心
            {isFull && ' 💯'}）
          </p>
          <div className="flex flex-wrap justify-center gap-1 max-w-sm mx-auto">
            {Array.from({ length: maxHearts }, (_, i) => (
              <span
                key={i}
                className="text-xl leading-none"
                style={i === hearts - 1 && shaking ? { animation: 'unlock-pop 0.6s ease-out' } : undefined}
              >
                {i < hearts ? '❤️' : '🤍'}
              </span>
            ))}
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
            const unseen = unlocked && !seenTiers.has(i);
            const animations = [
              justUnlocked === i ? 'unlock-pop 0.7s ease-out' : null,
              unseen ? 'twinkle-glow 1.5s ease-in-out infinite' : null,
            ]
              .filter(Boolean)
              .join(', ');
            return (
              <button
                key={i}
                type="button"
                disabled={!unlocked}
                onClick={() => handleInteract(tier, i)}
                style={animations ? { animation: animations } : undefined}
                className={`rounded-xl border p-3 text-center space-y-1 relative ${
                  unlocked
                    ? 'bg-white border-orange-100 hover:border-orange-300'
                    : 'bg-gray-50 border-gray-100 text-gray-300'
                }`}
              >
                {unseen && <span className="absolute -top-1.5 -right-1.5 text-sm">✨</span>}
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
