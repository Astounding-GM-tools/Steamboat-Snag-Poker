import { DEFAULT_CONFIG, type RulesConfig } from '../engine';

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
export const loadConfig = () => read<RulesConfig>('wwr.config.v2', DEFAULT_CONFIG);
export const saveConfig = (c: RulesConfig) => write('wwr.config.v2', c);

export function recordResult(months: number, victory: boolean): Best {
  const prev = loadBest();
  const better = !prev || (victory && !prev.victory) || (victory === prev.victory && months > prev.months);
  const best = better ? { months, victory } : prev!;
  write('wwr.best', best);
  return best;
}
