import { migrateGame, type GameState } from '../engine';

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

const SAVE_KEY = 'wwr.save.v2';

/** The voyage in progress, saved after every move so it survives a reload. */
export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    const game = raw ? (JSON.parse(raw) as GameState) : null;
    return game && game.phase !== 'gameOver' && game.phase !== 'victory' && game.phase !== 'finished' ? migrateGame(game) : null;
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
