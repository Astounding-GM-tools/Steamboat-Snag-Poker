/**
 * Willie's typewriter, heard: a short clack for each key struck, made on the spot (a burst of
 * filtered noise, a little different each time) rather than a sound file. Quiet, and silent until
 * the page has been touched (browsers won't play sound before that) or while it's hidden.
 */

let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;

function audio(): AudioContext | null {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null;
  if (!ctx) {
    ctx = new AudioContext();
    // A tenth of a second of white noise, shared by every clack.
    noise = ctx.createBuffer(1, Math.round(ctx.sampleRate * 0.1), ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  return ctx;
}

/** One key: `space` thumps lower (the space bar), and the first key of a line is the carriage's knock. */
export function clack(kind: 'key' | 'space' | 'line' = 'key') {
  const a = audio();
  if (!a || !noise || document.hidden) return;
  if (a.state === 'suspended') {
    void a.resume();
    return;
  }
  const now = a.currentTime;
  const src = a.createBufferSource();
  src.buffer = noise;
  const band = a.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = (kind === 'space' ? 900 : kind === 'line' ? 600 : 2200) * (0.85 + Math.random() * 0.3);
  band.Q.value = kind === 'key' ? 3 : 1.5;
  const gain = a.createGain();
  const loud = (kind === 'key' ? 0.18 : 0.24) * (0.75 + Math.random() * 0.5);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(loud, now + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0005, now + (kind === 'key' ? 0.04 : 0.08));
  src.connect(band).connect(gain).connect(a.destination);
  src.start(now);
  src.stop(now + 0.1);
}
