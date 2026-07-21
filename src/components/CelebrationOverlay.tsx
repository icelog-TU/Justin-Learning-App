import { useEffect, useState } from 'react';
import { playCoinSound, playStarSound, playSuccessChime } from '../lib/sound';

export interface CelebrationTrigger {
  coins: number;
  stars: number;
  nonce: number;
  big?: boolean;
}

interface Particle {
  id: number;
  emoji: string;
  tx: number;
  ty: number;
  rot: number;
  delay: number;
}

function buildParticles(coins: number, stars: number): Particle[] {
  const coinCount = coins > 0 ? Math.min(10, Math.max(3, Math.round(coins / 3))) : 0;
  const starCount = stars > 0 ? Math.min(8, Math.max(2, Math.round(stars / 2))) : 0;
  const particles: Particle[] = [];
  let id = 0;
  for (let i = 0; i < coinCount; i++) {
    particles.push({
      id: id++,
      emoji: '🪙',
      tx: (Math.random() - 0.5) * 260,
      ty: -(110 + Math.random() * 160),
      rot: (Math.random() - 0.5) * 360,
      delay: Math.random() * 0.25,
    });
  }
  for (let i = 0; i < starCount; i++) {
    particles.push({
      id: id++,
      emoji: '⭐',
      tx: (Math.random() - 0.5) * 260,
      ty: -(110 + Math.random() * 160),
      rot: (Math.random() - 0.5) * 360,
      delay: Math.random() * 0.25,
    });
  }
  return particles;
}

export default function CelebrationOverlay({ trigger }: { trigger: CelebrationTrigger | null }) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [textVisible, setTextVisible] = useState(false);
  const [label, setLabel] = useState('');

  useEffect(() => {
    if (!trigger) return;

    setParticles(buildParticles(trigger.coins, trigger.stars));
    const parts: string[] = [trigger.big ? '🎉 太棒了！' : '✅ 答對了！'];
    if (trigger.coins > 0) parts.push(`🪙+${trigger.coins}`);
    if (trigger.stars > 0) parts.push(`⭐+${trigger.stars}`);
    setLabel(parts.join(' '));
    setTextVisible(true);

    playSuccessChime(trigger.big);
    const coinTimer = trigger.coins > 0 ? window.setTimeout(() => playCoinSound(), 130) : null;
    const starTimer = trigger.stars > 0 ? window.setTimeout(() => playStarSound(), 280) : null;
    const clearTimer = window.setTimeout(() => {
      setParticles([]);
      setTextVisible(false);
    }, 1450);

    return () => {
      if (coinTimer) window.clearTimeout(coinTimer);
      if (starTimer) window.clearTimeout(starTimer);
      window.clearTimeout(clearTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger?.nonce]);

  if (!trigger || (particles.length === 0 && !textVisible)) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
      <div className="absolute left-1/2 top-[38%]">
        {particles.map((p) => (
          <span
            key={p.id}
            className="absolute text-3xl left-0 top-0"
            style={
              {
                '--tx': `${p.tx}px`,
                '--ty': `${p.ty}px`,
                '--rot': `${p.rot}deg`,
                animation: `burst-particle 1.1s ease-out ${p.delay}s forwards`,
              } as React.CSSProperties
            }
          >
            {p.emoji}
          </span>
        ))}
      </div>

      {textVisible && (
        <div
          className="absolute left-1/2 top-[22%] whitespace-nowrap text-xl sm:text-2xl font-extrabold text-white bg-gradient-to-r from-orange-500 to-pink-500 px-5 py-2.5 rounded-full shadow-lg"
          style={{ animation: 'pop-text 1.3s ease-out forwards' }}
        >
          {label}
        </div>
      )}
    </div>
  );
}
