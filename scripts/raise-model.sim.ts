/**
 * High Rollers with a River raise (an idea, not in the game), as a bare model (no cards): each seat gets
 * a hand strength u, uniform in 0..1, and the strongest hand wins. Against n
 * others, a hand of strength u wins with chance u^n exactly, so the captains'
 * reasoning is exact and cheap. Money moves as in the engine: antes, the
 * Turn and River fees, swaps, early folds. Calibrated so that with no raise
 * a table lasts about as long as the engine's (median 7 hands) with about
 * $120 in the pot at the River (see raise-engine.sim.ts, the slow version
 * over the real engine).
 *
 *   npx vitest run --config vitest.sim.config.ts scripts/raise-model.sim.ts
 *
 * SIM_TABLES (default 20000 a row); SIM_FOLD, SIM_SWAPS, SIM_UPKEEP retune the
 * calibration; SIM_CALIBRATE=1 prints only the no-raise row. Results go to
 * raise-model-latest.txt.
 */
import { writeFileSync } from 'node:fs';
import { it } from 'vitest';
type Style = { raiseAt: number; bluff: number; nerve: number; always?: boolean };
const STYLES: Record<string, Style> = {
  bill: { raiseAt: 0.6, bluff: 0, nerve: 0, always: true }, // never folds
  finlay: { raiseAt: 0.45, bluff: 0.12, nerve: 0.75 }, // loose
  lenny: { raiseAt: 0.75, bluff: 0, nerve: 1.6 }, // defeatist
  walrus: { raiseAt: 0.55, bluff: 0.04, nerve: 1.0 }, // solid
  gaylord: { raiseAt: 0.5, bluff: 0.08, nerve: 1.0 }, // calculates
  eliza: { raiseAt: 0.5, bluff: 0.06, nerve: 0.9 }, // patient, ruthless
  you: { raiseAt: 0.6, bluff: 0, nerve: 1.0 }, // careful
};
const RIVALS = ['bill', 'finlay', 'lenny', 'walrus', 'gaylord', 'eliza'];

// A small seeded generator (mulberry32).
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Params {
  R0: number; // the raise at the first hand (0: no raise)
  growth: number; // per hand, compounding
  scaleRaiseAt?: number; // shifts every style's raise threshold (tuning how often anyone raises)
}

const START = 120;
const START_HAND = 24;
/** Calibration: who gives up early, and what swaps cost a seat that stays. */
const FOLD_EARLY_BELOW = Number(process.env.SIM_FOLD ?? 0.12);
const SWAPS = Number(process.env.SIM_SWAPS ?? 10);
/** Snag upkeep a seat pays on average (in the engine: $4 a snag, about one each), and forfeits. */
const UPKEEP = Number(process.env.SIM_UPKEEP ?? 5);

function table(seed: number, p: Params) {
  const r = rng(seed);
  const order = [...RIVALS].sort(() => r() - 0.5).slice(0, 3);
  const names = ['you', ...order];
  const money = names.map(() => START);
  const out = names.map(() => false);
  let hand = START_HAND;
  let hands = 0;
  const st = { rivers: 0, raised: 0, raisers: 0, facing: 0, matched: 0, potBefore: 0, potFinal: 0, doubleUps: 0, bluffsWon: 0 };
  const history: number[][] = [];

  while (out.filter((o) => !o).length > 2 && hands < 200) {
    const ante = Math.ceil(hand / 3);
    const raise = p.R0 ? Math.round(p.R0 * Math.pow(1 + p.growth, hand - START_HAND)) : 0;
    const seats = names.map((_, i) => i).filter((i) => !out[i]);
    const before = [...money];
    const u = new Map(seats.map((i) => [i, r()]));
    const bet = new Map(seats.map((i) => [i, ante + Math.round(UPKEEP * 2 * r())]));
    // The Flop and the Turn: the weakest give up early (losing the ante, or the Turn fee too); the rest pay their way to the River.
    let inHand = seats.filter((i) => {
      if (u.get(i)! < FOLD_EARLY_BELOW && STYLES[names[i]].always !== true) {
        if (r() < 0.5) bet.set(i, bet.get(i)! + Math.floor(ante / 2));
        return false;
      }
      bet.set(i, bet.get(i)! + Math.floor(ante / 2) + ante + Math.round(SWAPS * (0.5 + r())));
      return true;
    });
    if (inHand.length === 0) inHand = [seats[0]];
    st.rivers++;
    st.potBefore += [...bet.values()].reduce((a, b) => a + b, 0);
    if (raise && inHand.length > 1) {
      const n = inHand.length - 1;
      const chance = (i: number) => Math.pow(u.get(i)!, n);
      const raisers = inHand.filter((i) => {
        const s = STYLES[names[i]];
        return chance(i) >= s.raiseAt * (p.scaleRaiseAt ?? 1) || r() < s.bluff;
      });
      if (raisers.length) {
        st.raised++;
        st.raisers += raisers.length;
        for (const i of raisers) bet.set(i, bet.get(i)! + raise);
        const pot = [...bet.values()].reduce((a, b) => a + b, 0);
        inHand = inHand.filter((i) => {
          if (raisers.includes(i)) return true;
          st.facing++;
          const s = STYLES[names[i]];
          const price = raise / (pot + raise);
          if (s.always || chance(i) >= price * s.nerve) {
            st.matched++;
            bet.set(i, bet.get(i)! + raise);
            return true;
          }
          return false;
        });
      }
    }
    const pot = [...bet.values()].reduce((a, b) => a + b, 0);
    st.potFinal += pot;
    const winner = inHand.reduce((w, i) => (u.get(i)! > u.get(w)! ? i : w));
    for (const [i, b] of bet) money[i] -= b;
    money[winner] += pot;
    seats.forEach((i) => {
      if (money[i] <= 0) out[i] = true;
      if (before[i] > 0 && before[i] < START / 2 && money[i] >= 2 * before[i]) st.doubleUps++;
    });
    history.push([...money]);
    hand++;
    hands++;
  }
  const standing = names.map((_, i) => i).filter((i) => !out[i]).sort((a, b) => money[b] - money[a]);
  const half = history[Math.max(0, Math.ceil(history.length / 2) - 1)];
  const leader = half.indexOf(Math.max(...half));
  return { hands, ...st, leaderWon: leader === standing[0], youFirst: standing[0] === 0, youTop2: standing.includes(0) };
}

const N = Number(process.env.SIM_TABLES ?? 20000);
const pct = (x: number) => `${Math.round(x * 100)}%`;
function row(label: string, p: Params) {
  const runs = Array.from({ length: N }, (_, k) => table(1 + k, p));
  const hands = runs.map((x) => x.hands).sort((a, b) => a - b);
  const sum = (f: (x: (typeof runs)[number]) => number) => runs.reduce((a, x) => a + f(x), 0);
  const q = (f: number) => hands[Math.floor(N * f)];
  say(
    [
      label.padEnd(22),
      `${q(0.5)}`.padStart(6),
      pct(hands.filter((h) => h >= 5 && h <= 8).length / N).padStart(5),
      `(${q(0.1)}-${q(0.9)})`.padStart(8),
      '|',
      pct(sum((x) => x.raised) / sum((x) => x.rivers)).padStart(6),
      (sum((x) => x.raisers) / Math.max(1, sum((x) => x.raised))).toFixed(1).padStart(6),
      pct(sum((x) => x.matched) / Math.max(1, sum((x) => x.facing))).padStart(7),
      '|',
      `$${Math.round(sum((x) => x.potBefore) / sum((x) => x.rivers))}`.padStart(6),
      `$${Math.round(sum((x) => x.potFinal) / sum((x) => x.rivers))}`.padStart(6),
      '|',
      pct(runs.filter((x) => x.leaderWon).length / N).padStart(7),
      (sum((x) => x.doubleUps) / N).toFixed(2).padStart(8),
      '|',
      pct(runs.filter((x) => x.youFirst).length / N).padStart(5),
      pct(runs.filter((x) => x.youTop2).length / N).padStart(5),
    ].join(' '),
  );
}

/** Each line of results: printed, and kept for the file. */
const lines: string[] = [];
const say = (line: string) => {
  lines.push(line);
  console.log(line);
};

it('raise model', () => {
  say(`${N} tables a row. Raise = R0 x (1+growth)^(hands played). "raiseAt x" scales how readily anyone raises (lower: more raises).`);
  say('setting                hands  5-8  p10-p90 | raised  each matched | pot@River final | leader doubles | you1st top2');
  row('no raise', { R0: 0, growth: 0 });
  if (!process.env.SIM_CALIBRATE) {
    for (const R0 of [8, 12, 16, 24, 32]) for (const growth of [0, 0.1, 0.15, 0.2]) row(`$${R0} +${pct(growth)}/hand`, { R0, growth });
    say('-- how readily the captains raise, at $8 +15%:');
    for (const scale of [0.8, 1, 1.2, 1.4]) row(`$8 +15%, raiseAt x${scale}`, { R0: 8, growth: 0.15, scaleRaiseAt: scale });
  }
  writeFileSync('scripts/raise-model-latest.txt', lines.join('\n') + '\n');
});
