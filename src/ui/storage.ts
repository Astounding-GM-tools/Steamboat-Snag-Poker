import type { GameState } from '../engine';
import type { JourneyState } from '../story/mechanics';

export interface Best {
  /** Tournaments won. */
  wins: number;
  /** Most crossings survived in one voyage. */
  longest: number;
  /** The most you've walked away with from a final table. */
  highScore: number;
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: fine for a prototype */
  }
}

/** Reads the record; older saves stored only the best single voyage. */
export function loadBest(): Best {
  const raw = read<Partial<Best> & { months?: number; victory?: boolean }>('wwr.best', {});
  return {
    wins: raw.wins ?? (raw.victory ? 1 : 0),
    longest: raw.longest ?? raw.months ?? 0,
    highScore: raw.highScore ?? 0,
  };
}

/** A voyage's end: won (gold at the final table, or last afloat), how long it lasted, and what you walked away with. */
export function recordResult(months: number, victory: boolean, score = 0): Best {
  const prev = loadBest();
  const best = { wins: prev.wins + (victory ? 1 : 0), longest: Math.max(prev.longest, months), highScore: Math.max(prev.highScore, score) };
  write('wwr.best', best);
  return best;
}

/**
 * Where the voyage in progress is kept. Saves aren't converted when the
 * game's state changes shape: the key moves on, and an older voyage is
 * simply left behind (a fresh start costs nothing while it's a prototype).
 */
const SAVE_KEY = 'wwr.save.v5';
/** Left behind: older voyages, and the settings of the retired rules lab. */
const OLD_KEYS = ['wwr.save.v2', 'wwr.save.v3', 'wwr.save.v4', 'wwr.config.v2', 'wwr.config.v3'];

/** The voyage in progress, saved after every move so it survives a reload. */
export function loadGame(): GameState | null {
  try {
    for (const key of OLD_KEYS) localStorage.removeItem(key);
    const raw = localStorage.getItem(SAVE_KEY);
    const game = raw ? (JSON.parse(raw) as GameState) : null;
    return game && game.phase !== 'gameOver' && game.phase !== 'victory' && game.phase !== 'finished' ? game : null;
  } catch {
    return null;
  }
}

export function saveGame(game: GameState | null) {
  try {
    if (game && game.phase !== 'gameOver' && game.phase !== 'victory' && game.phase !== 'finished') localStorage.setItem(SAVE_KEY, JSON.stringify(game));
    else localStorage.removeItem(SAVE_KEY);
  } catch {
    /* storage unavailable */
  }
}

/** The story's voyage in progress, saved after every move (its own key: it never takes the League's place). */
const JOURNEY_KEY = 'wwr.river.v1';

export function loadJourney(): JourneyState | null {
  try {
    const raw = localStorage.getItem(JOURNEY_KEY);
    const journey = raw ? (JSON.parse(raw) as JourneyState) : null;
    return journey && !journey.done ? journey : null;
  } catch {
    return null;
  }
}

export function saveJourney(journey: JourneyState | null) {
  try {
    if (journey && !journey.done) localStorage.setItem(JOURNEY_KEY, JSON.stringify(journey));
    else localStorage.removeItem(JOURNEY_KEY);
  } catch {
    /* storage unavailable */
  }
}

const ON_RIVER_KEY = 'wwr.onRiver';

/** Whether the story was on screen when the page went (a phone that slept): it opens there again. */
export function wasOnRiver(): boolean {
  try {
    return localStorage.getItem(ON_RIVER_KEY) === '1';
  } catch {
    return false;
  }
}

export function setOnRiver(on: boolean) {
  try {
    if (on) localStorage.setItem(ON_RIVER_KEY, '1');
    else localStorage.removeItem(ON_RIVER_KEY);
  } catch {
    /* storage unavailable */
  }
}
