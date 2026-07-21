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
