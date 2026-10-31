/**
 * Balance simulation: lets an AI play the Captain for many games under each
 * rules preset and prints how long games last.
 *   npm run sim
 *   SIM_GAMES=10 SIM_PRESETS=kansas,texas SIM_DRAIN=3 npm run sim
 *   SIM_CAPTAINS=careful,gambler (skip the clueless captain, who never wins)
 *
 * "final4": how often the Captain is still afloat when four captains are left
 * on the river (where the League would hand over to the High Rollers table),
 * the crossing it happens, and the four purses then (yours, and the richest's).
 */
import { writeFileSync } from 'node:fs';
import { it } from 'vitest';
import { HUMAN_ID, PRESETS, chooseAction, newGame, nextMonth, player, submitAction, viewFor, Rng, type AiId } from '../src/engine';

const GAMES = Number(process.env.SIM_GAMES ?? 30);
const PRESET_NAMES = (process.env.SIM_PRESETS ?? Object.keys(PRESETS).join(',')).split(',');
const overrides = {
  ...(process.env.SIM_DRAIN ? { drainPerJoker: Number(process.env.SIM_DRAIN) } : {}),
  ...(process.env.SIM_JOKERS ? { totalJokers: Number(process.env.SIM_JOKERS) } : {}),
  ...(process.env.SIM_ANTE ? { anteEvery: Number(process.env.SIM_ANTE) } : {}),
  ...(process.env.SIM_FORFEIT ? { jokerForfeit: Number(process.env.SIM_FORFEIT) } : {}),
  ...(process.env.SIM_LOSER ? { loserPays: Number(process.env.SIM_LOSER) } : {}),
  ...(process.env.SIM_EVERY ? { shuffledJokerEveryMonths: Number(process.env.SIM_EVERY) } : {}),
};

it('balance', () => {
  const rows: string[] = [`games/row=${GAMES} overrides=${JSON.stringify(overrides)}`];
  for (const presetName of PRESET_NAMES) {
    const config = { ...PRESETS[presetName], ...overrides };
    for (const captainAi of (process.env.SIM_CAPTAINS ?? 'clueless,careful,gambler').split(',') as AiId[]) {
      let months = 0, winMonths = 0, wins = 0, peakJokers = 0, captainDuels = 0, captainWins = 0, jokersShed = 0;
      let final4 = 0, final4Month = 0, final4Mine = 0, final4Top = 0, final4Low = 0;
      const cats: Record<string, number> = {};
      const t0 = performance.now();
      for (let g = 0; g < GAMES; g++) {
        let s = newGame(1000 + g, config);
        const rng = new Rng(g);
        let maxJ = 0;
        let reached = false;
        while (s.phase === 'duel' || s.phase === 'monthEnd') {
          const afloat = s.players.filter((p) => p.status !== 'eliminated');
          if (!reached && afloat.length <= 4 && player(s, HUMAN_ID).status !== 'eliminated') {
            reached = true;
            final4++;
            final4Month += s.month;
            const purses = afloat.map((p) => p.money);
            final4Mine += player(s, HUMAN_ID).money;
            final4Top += Math.max(...purses);
            final4Low += Math.min(...purses);
          }
          if (s.phase === 'monthEnd') s = nextMonth(s);
          else {
            s = submitAction(s, chooseAction(captainAi, viewFor(s.round!, 0), config, rng));
            if (s.report) {
              const r = s.report.duel.result;
              captainDuels++;
              if (r.winner === 0) {
                captainWins++;
                jokersShed += r.dumped.length;
              }
              for (const h of [r.hands[0], r.hands[1]]) cats[h.category] = (cats[h.category] ?? 0) + 1;
            }
          }
          maxJ = Math.max(maxJ, player(s, HUMAN_ID).jokers.length);
        }
        months += s.month;
        peakJokers += maxJ;
        if (s.phase === 'victory') {
          wins++;
          winMonths += s.month; // how long a won tournament takes: the endgame drag shows here
        }
      }
      const ms = (performance.now() - t0) / GAMES;
      const pct = (n: number, d: number) => `${((100 * n) / Math.max(1, d)).toFixed(0)}%`;
      rows.push(
        `${presetName.padEnd(15)} captain=${captainAi.padEnd(9)} avgMonths=${(months / GAMES).toFixed(1).padStart(5)} ` +
          `gameWin=${pct(wins, GAMES).padStart(4)} winMonths=${(winMonths / Math.max(1, wins)).toFixed(1).padStart(5)} duelWin=${pct(captainWins, captainDuels).padStart(4)} ` +
          `shed/game=${(jokersShed / GAMES).toFixed(1)} peakJ=${(peakJokers / GAMES).toFixed(1)} ` +
          `final4=${pct(final4, GAMES).padStart(4)} at=${(final4Month / Math.max(1, final4)).toFixed(1)} purses: you $${(final4Mine / Math.max(1, final4)).toFixed(0)} top $${(final4Top / Math.max(1, final4)).toFixed(0)} low $${(final4Low / Math.max(1, final4)).toFixed(0)} ${ms.toFixed(0)}ms/game`,
      );
      if (captainAi === 'gambler') {
        const total = Object.values(cats).reduce((a, b) => a + b, 0);
        rows.push('    hands: ' + Object.entries(cats).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${pct(v, total)}`).join(', '));
      }
    }
  }
  writeFileSync('scripts/balance-latest.txt', rows.join('\n') + '\n');
  console.error(rows.join('\n'));
});
