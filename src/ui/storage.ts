import { DEFAULT_CONFIG, type GameState, type RulesConfig } from '../engine';

export interface Best {
  months: number;
  victory: boolean;
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

export const loadBest = () => read<Best | null>('wwr.best', null);
export const loadConfig = () => read<RulesConfig>('wwr.config.v3', DEFAULT_CONFIG);
export const saveConfig = (c: RulesConfig) => write('wwr.config.v3', c);

export function recordResult(months: number, victory: boolean): Best {
  const prev = loadBest();
  const better = !prev || (victory && !prev.victory) || (victory === prev.victory && months > prev.months);
  const best = better ? { months, victory } : prev!;
  write('wwr.best', best);
  return best;
}

const SAVE_KEY = 'wwr.save.v2';

/** The voyage in progress, saved after every move so it survives a reload. */
export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    const game = raw ? (JSON.parse(raw) as GameState) : null;
    return game && game.phase !== 'gameOver' && game.phase !== 'victory' ? game : null;
  } catch {
    return null;
  }
}

export function saveGame(game: GameState | null) {
  try {
    if (game && game.phase !== 'gameOver' && game.phase !== 'victory') localStorage.setItem(SAVE_KEY, JSON.stringify(game));
    else localStorage.removeItem(SAVE_KEY);
  } catch {
    /* storage unavailable */
  }
}
