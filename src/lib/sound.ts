let audioCtx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!audioCtx) audioCtx = new Ctor();
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function tone(
  ctx: AudioContext,
  freq: number,
  startTime: number,
  duration: number,
  type: OscillatorType = 'sine',
  peakGain = 0.15,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.03);
}

export function playCoinSound() {
  const ctx = getContext();
  if (!ctx) return;
  const t = ctx.currentTime;
  tone(ctx, 1400, t, 0.09, 'square', 0.1);
  tone(ctx, 1900, t + 0.07, 0.13, 'square', 0.1);
}

export function playStarSound() {
  const ctx = getContext();
  if (!ctx) return;
  const t = ctx.currentTime;
  [1047, 1319, 1568, 2093].forEach((f, i) => tone(ctx, f, t + i * 0.05, 0.16, 'sine', 0.09));
}

export function playSuccessChime(big = false) {
  const ctx = getContext();
  if (!ctx) return;
  const t = ctx.currentTime;
  const notes = big ? [523, 659, 784, 1047, 1319] : [523, 659, 784];
  notes.forEach((f, i) => tone(ctx, f, t + i * 0.09, 0.28, 'triangle', 0.13));
}

/** Quick whirring clicks while the gacha "wheel" is spinning. */
export function playGachaSpinSound() {
  const ctx = getContext();
  if (!ctx) return;
  const t = ctx.currentTime;
  for (let i = 0; i < 6; i++) {
    tone(ctx, 320 + i * 55, t + i * 0.08, 0.06, 'square', 0.06);
  }
}

/** Plays when the gacha result is revealed — a bright fanfare for a new character, a softer tone for a dupe. */
export function playGachaRevealSound(isNew: boolean) {
  const ctx = getContext();
  if (!ctx) return;
  const t = ctx.currentTime;
  if (isNew) {
    [659, 831, 988, 1319, 1568].forEach((f, i) => tone(ctx, f, t + i * 0.08, 0.3, 'triangle', 0.13));
  } else {
    tone(ctx, 700, t, 0.12, 'sine', 0.08);
    tone(ctx, 550, t + 0.1, 0.16, 'sine', 0.08);
  }
}

/** A soft "whoosh in" for entering a character's own page. */
export function playPageEnterSound() {
  const ctx = getContext();
  if (!ctx) return;
  const t = ctx.currentTime;
  tone(ctx, 880, t, 0.1, 'sine', 0.08);
  tone(ctx, 1175, t + 0.06, 0.14, 'sine', 0.09);
}

/** Plays when giving a character a heart. */
export function playHeartSound() {
  const ctx = getContext();
  if (!ctx) return;
  const t = ctx.currentTime;
  tone(ctx, 1046, t, 0.1, 'sine', 0.1);
  tone(ctx, 1568, t + 0.08, 0.2, 'sine', 0.1);
}

/** Plays when tapping one of a character's unlocked interactions. */
export function playInteractionSound() {
  const ctx = getContext();
  if (!ctx) return;
  const t = ctx.currentTime;
  tone(ctx, 784, t, 0.08, 'triangle', 0.1);
  tone(ctx, 988, t + 0.05, 0.14, 'triangle', 0.1);
}

/** Plays the moment giving a heart pushes a character's affection past a new interaction's unlock threshold. */
export function playUnlockFanfare() {
  const ctx = getContext();
  if (!ctx) return;
  const t = ctx.currentTime;
  [784, 988, 1175, 1568, 1976].forEach((f, i) => tone(ctx, f, t + i * 0.07, 0.25, 'triangle', 0.13));
}
