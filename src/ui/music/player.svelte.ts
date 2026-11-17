import type { Track } from './playlist';

/**
 * The band, playing quietly where it plays: `playHere(tracks)` as the scene changes, and the music
 * fades out of the last place and into the next (never a hard cut). Plain <audio>, two of them, one
 * fading in while the other fades out; nothing runs between fades. A browser won't play sound before
 * the player has touched the page, so the first tap or key starts whatever was waiting. Off and the
 * volume are remembered on this device; a hidden tab is quiet till it's back.
 *
 * Where the volume can't be set (an iPhone's <audio> is always at full), the two go through a
 * Web Audio gain instead: the same fades, at the same quiet. (Cross-origin, that wants the bucket's
 * CORS, as the chart's JSON does.)
 */
export const MUSIC_ROOT = import.meta.env.VITE_MUSIC_ROOT ?? '/music/pre-1926/';

/** Coming in slowly, going a little quicker: the band strikes up under the talk, and is gone as you leave. */
const FADE_IN_MS = 4000;
const FADE_OUT_MS = 2500;
const TICK_MS = 50;
const KEY = 'wwr.music';

/** What the player chose (on, and how loud), and what's playing now (for the credit). */
export const music = $state({ on: true, volume: 0.35, now: null as Track | null });

try {
  const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}') as { on?: boolean; volume?: number };
  if (typeof saved.on === 'boolean') music.on = saved.on;
  if (typeof saved.volume === 'number' && saved.volume >= 0 && saved.volume <= 1) music.volume = saved.volume;
} catch {
  /* no storage: the defaults */
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ on: music.on, volume: music.volume }));
  } catch {
    /* no storage */
  }
}

/** One of the two players: its records, which is on, and how far faded in (0 to 1) and where it's going. */
interface Deck {
  el: HTMLAudioElement;
  gain: GainNode | null;
  tracks: Track[] | null;
  index: number;
  level: number;
  target: number;
}

const browser = typeof window !== 'undefined' && typeof Audio !== 'undefined';
/** An iPhone reads the volume back as 1 whatever it's set to: there, a gain does the fading. */
const volumeWorks = browser && (() => {
  const probe = new Audio();
  probe.volume = 0.5;
  return probe.volume === 0.5;
})();
let context: AudioContext | null = null;

function newDeck(): Deck {
  const el = new Audio();
  el.preload = 'auto';
  let gain: GainNode | null = null;
  if (!volumeWorks) {
    el.crossOrigin = 'anonymous';
    context ??= new AudioContext();
    gain = context.createGain();
    gain.gain.value = 0;
    context.createMediaElementSource(el).connect(gain).connect(context.destination);
  } else el.volume = 0;
  const deck: Deck = { el, gain, tracks: null, index: 0, level: 0, target: 0 };
  // A playlist of several plays in turn, and round again (one track just loops).
  el.addEventListener('ended', () => {
    if (!deck.tracks || deck.tracks.length < 2) return;
    deck.index = (deck.index + 1) % deck.tracks.length;
    load(deck);
    start(deck);
  });
  el.addEventListener('playing', () => credit(deck));
  // A record that isn't there (not uploaded yet, offline): quiet, and no credit for it.
  el.addEventListener('error', () => {
    if (deck === active && deck.tracks) music.now = null;
  });
  return deck;
}

const decks: Deck[] = browser ? [newDeck(), newDeck()] : [];
/** The deck playing (or to play) here. */
let active: Deck | null = null;
/** What this place wants, even while the music's off or the tab hidden. */
let wanted: Track[] | null = null;
/** The record last heard: a place's list starts on the one after it, so the same side doesn't come round twice running. */
let lastHeard: string | null = null;
const same = (a: Track[] | null, b: Track[] | null) => !!a && !!b && a.length === b.length && a.every((t, i) => t.id === b[i].id);

function apply(deck: Deck) {
  const v = deck.level * music.volume;
  if (deck.gain) deck.gain.gain.value = v;
  else deck.el.volume = Math.min(1, Math.max(0, v));
}

function load(deck: Deck) {
  deck.el.loop = deck.tracks!.length === 1;
  deck.el.src = `${MUSIC_ROOT}${deck.tracks![deck.index].file}`;
}

/** The credit, once it's actually heard (not while it waits on a first tap). */
function credit(deck: Deck) {
  const track = deck === active && deck.tracks ? deck.tracks[deck.index] : null;
  if (track) lastHeard = track.id;
  if (track && music.now?.id !== track.id) music.now = track;
}

function start(deck: Deck) {
  // Already playing (taken back up as it faded): credited now, as 'playing' won't come again.
  if (!deck.el.paused) credit(deck);
  if (document.hidden || !music.on) return;
  if (context?.state === 'suspended') context.resume().catch(() => {});
  // Refused (no tap yet): it starts on the first one.
  deck.el.play().catch(() => {});
  fade();
}

/** Back to silence and nothing loaded: a deck at rest costs nothing. */
function rest(deck: Deck) {
  deck.el.pause();
  deck.el.removeAttribute('src');
  deck.el.load();
  deck.tracks = null;
  deck.level = deck.target = 0;
  apply(deck);
  if (context && decks.every((d) => !d.tracks)) context.suspend().catch(() => {});
}

let ticking: ReturnType<typeof setInterval> | null = null;
function fade() {
  if (ticking) return;
  ticking = setInterval(() => {
    let moving = false;
    for (const d of decks) {
      if (!d.tracks) continue;
      if (d.target === 0 && d.level === 0) {
        rest(d);
        continue;
      }
      if (d.level === d.target) continue;
      // Waiting on the first tap (or loading), it holds at silence: the fade begins when the music does (start() calls again).
      if (d.el.paused && d.target > d.level) continue;
      const up = d.target > d.level;
      const step = TICK_MS / (up ? FADE_IN_MS : FADE_OUT_MS);
      d.level = up ? Math.min(d.target, d.level + step) : Math.max(d.target, d.level - step);
      apply(d);
      moving = true;
    }
    if (!moving) {
      clearInterval(ticking!);
      ticking = null;
    }
  }, TICK_MS);
}

/** What plays here (from playlist.ts's `musicAt`), or nothing: the last place fades out, this one in. */
export function playHere(tracks: Track[] | null) {
  if (!browser) return;
  wanted = tracks;
  if (same(tracks, active?.tracks ?? null)) return;
  if (active) {
    active.target = 0;
    fade();
  }
  active = null;
  music.now = null;
  if (!tracks || !music.on) return;
  // Back where we just were (it's still fading out): it comes up again, not over from the top.
  const back = decks.find((d) => same(d.tracks, tracks));
  if (back) {
    active = back;
    back.target = 1;
    start(back);
    return;
  }
  // A free deck, or the quieter of the two cut short.
  const deck = decks.find((d) => !d.tracks) ?? decks.reduce((a, b) => (a.level <= b.level ? a : b));
  if (deck.tracks) rest(deck);
  active = deck;
  deck.tracks = tracks;
  deck.index = (tracks.findIndex((t) => t.id === lastHeard) + 1) % tracks.length;
  deck.target = 1;
  load(deck);
  start(deck);
}

export function setMusicOn(on: boolean) {
  music.on = on;
  save();
  if (!on) {
    for (const d of decks) d.target = 0;
    active = null;
    music.now = null;
    fade();
  } else {
    const here = wanted;
    wanted = null;
    playHere(here);
  }
}

/** The slider as it moves; `save` when it's let go. */
export function setVolume(volume: number, keep = false) {
  music.volume = Math.min(1, Math.max(0, volume));
  decks.forEach(apply);
  if (keep) save();
}

if (browser) {
  const unlock = () => {
    context?.resume().catch(() => {});
    if (active?.tracks && active.el.paused) start(active);
    window.removeEventListener('pointerdown', unlock, true);
    window.removeEventListener('keydown', unlock, true);
  };
  window.addEventListener('pointerdown', unlock, true);
  window.addEventListener('keydown', unlock, true);
  // A hidden tab is quiet (and costs nothing); back, and the band strikes up again.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      for (const d of decks) {
        if (d === active) d.el.pause();
        else if (d.tracks) rest(d);
      }
      if (active) active.level = 0;
    } else if (active?.tracks) {
      apply(active);
      start(active);
    }
  });
}

