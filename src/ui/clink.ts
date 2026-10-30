/**
 * The clink of a silver dollar landing on another: synthesised, no sound
 * files. A few inharmonic ringing partials (a small metal disc rings that way)
 * over a short tick of noise, each a little different in pitch. When coins
 * pour, clinks closer together than a few milliseconds merge into one.
 */
let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;
let last = 0;

/** Partials of a struck coin: frequency ratio, loudness, ring time (s). */
const PARTIALS: [number, number, number][] = [
  [1, 1, 0.12],
  [2.32, 0.55, 0.08],
  [4.25, 0.3, 0.05],
  [6.8, 0.15, 0.03],
];

export function clink(volume = 0.08) {
  if (typeof window === 'undefined') return;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  try {
    ctx ??= new AC();
  } catch {
    return;
  }
  // Browsers start audio only after a tap; the coins only fly after one.
  if (ctx.state === 'suspended') void ctx.resume();
  const now = ctx.currentTime;
  if (now - last < 0.03) return;
  last = now;

  const out = ctx.createGain();
  out.gain.value = volume * (0.7 + Math.random() * 0.3);
  out.connect(ctx.destination);
  const base = 2600 + Math.random() * 1200;
  for (const [ratio, amp, ring] of PARTIALS) {
    const osc = ctx.createOscillator();
    osc.frequency.value = base * ratio * (0.99 + Math.random() * 0.02);
    const env = ctx.createGain();
    env.gain.setValueAtTime(amp, now);
    env.gain.exponentialRampToValueAtTime(0.0001, now + ring);
    osc.connect(env).connect(out);
    osc.start(now);
    osc.stop(now + ring + 0.02);
  }
  // The tick of contact.
  if (!noise) {
    noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.01), ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  }
  const tick = ctx.createBufferSource();
  tick.buffer = noise;
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 5000;
  const tickGain = ctx.createGain();
  tickGain.gain.value = 0.5;
  tick.connect(hp).connect(tickGain).connect(out);
  tick.start(now);
}
