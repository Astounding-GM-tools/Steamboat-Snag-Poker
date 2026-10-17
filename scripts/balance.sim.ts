/**
 * Balance simulation: lets an AI play the Captain for many games and prints how
 * long games last. Run with `npm run sim`. Tweak SIM_* env vars to explore.
 */
import { writeFileSync } from 'node:fs';
import { it } from 'vitest';
import {
  DEFAULT_CONFIG,
  HUMAN_ID,
  chooseAction,
  newGame,
  nextMonth,
  player,
  submitAction,
  viewFor,
  Rng,
  type AiId,
  type DealMode,
  type JokerMode,
} from '../src/engine';

const GAMES = Number(process.env.SIM_GAMES ?? 40);

it('balance', () => {
  const rows: string[] = [];
  for (const dealMode of ['drip', 'draft', 'holdem'] as DealMode[]) {
    for (const jokerMode of ['slot', 'shuffled'] as JokerMode[]) {
      const config = { ...DEFAULT_CONFIG, dealMode, jokerMode };
      for (const captainAi of ['felix', 'betty', 'sherlock'] as AiId[]) {
        let months = 0, wins = 0, early = 0, peakJokers = 0;
        const t0 = performance.now();
        for (let g = 0; g < GAMES; g++) {
          let s = newGame(1000 + g, config);
          const rng = new Rng(g);
          let maxJ = 0;
          while (s.phase === 'duel' || s.phase === 'monthEnd') {
            if (s.phase === 'monthEnd') s = nextMonth(s);
            else s = submitAction(s, chooseAction(captainAi, viewFor(s.round!, 0), config, rng));
            maxJ = Math.max(maxJ, player(s, HUMAN_ID).jokers.length);
          }
          months += s.month;
          peakJokers += maxJ;
          if (s.phase === 'victory') {
            wins++;
            if (s.month < config.months) early++;
          }
        }
        const ms = (performance.now() - t0) / GAMES;
        rows.push(
          `${dealMode.padEnd(7)} ${jokerMode.padEnd(9)} captain=${captainAi.padEnd(9)} ` +
            `avgMonths=${(months / GAMES).toFixed(1).padStart(5)} win=${((100 * wins) / GAMES).toFixed(0).padStart(3)}% ` +
            `(early ${early}) peakJokers=${(peakJokers / GAMES).toFixed(1)} ${ms.toFixed(0)}ms/game`,
        );
      }
    }
  }
  writeFileSync('scripts/balance-latest.txt', rows.join('\n') + '\n');
  console.log(rows.join('\n'));
});
