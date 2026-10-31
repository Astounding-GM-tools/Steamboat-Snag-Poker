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
  R0: number; // the raise at the first hand (0: no raise; -1: the raise is the ante itself, creeping with it)
  growth: number; // per hand, compounding
  scaleRaiseAt?: number; // shifts every style's raise threshold (tuning how often anyone raises)
  onOut?: number; // once the first captain is out, the ante (so the fees, and the raise) is multiplied by this
  lastHand?: number; // The Last Hand: after the first knockout, one more hand at these stakes, and the table ends
  start?: number; // starting purses (default START)
}

const START = 120;
/** Starting purses to compare for The Last Hand (bigger purses: longer before anyone goes broke). */
const PURSES = [120, 160, 200, 240];
const START_HAND = 24;
/** Calibration: who gives up early, and what swaps cost a seat that stays. */
const FOLD_EARLY_BELOW = Number(process.env.SIM_FOLD ?? 0.12);
const SWAPS = Number(process.env.SIM_SWAPS ?? 10);
/** Snag upkeep a seat pays on average (in the engine: $4 a snag, about one each), and forfeits. */
const UPKEEP = Number(process.env.SIM_UPKEEP ?? 5);

function table(seed: number, p: Params) {
  const start = p.start ?? START;
  const r = rng(seed);
  const order = [...RIVALS].sort(() => r() - 0.5).slice(0, 3);
  const names = ['you', ...order];
  const money = names.map(() => start);
  const out = names.map(() => false);
  let hand = START_HAND;
  let hands = 0;
  /** Hands played when the first captain went out. */
  let firstOut = -1;
  const st = { rivers: 0, raised: 0, raisers: 0, facing: 0, matched: 0, potBefore: 0, potFinal: 0, doubleUps: 0, bluffsWon: 0 };
  const history: number[][] = [];
  /** When each captain went out (hands played), for the placings. */
  const outAt = names.map(() => Infinity);
  /** The Last Hand: purses and order going into it. */
  let intoLast: number[] | null = null;

  while (p.lastHand ? out.filter((o) => !o).length > 1 && !(intoLast && hands > firstOut) : out.filter((o) => !o).length > 2) {
    if (hands >= 200) break;
    const last = !!p.lastHand && firstOut >= 0;
    if (last) intoLast = [...money];
    const stakes = last ? p.lastHand! : p.onOut && out.some((o) => o) ? p.onOut : 1;
    const ante = Math.round(Math.ceil(hand / 3) * stakes);
    const raise = p.R0 < 0 ? ante : p.R0 ? Math.round(p.R0 * stakes * Math.pow(1 + p.growth, hand - START_HAND)) : 0;
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
      if (money[i] <= 0 && !out[i]) {
        out[i] = true;
        outAt[i] = hands + 1;
      }
      if (before[i] > 0 && before[i] < start / 2 && money[i] >= 2 * before[i]) st.doubleUps++;
    });
    history.push([...money]);
    hand++;
    hands++;
    if (firstOut < 0 && out.some((o) => o)) firstOut = hands;
  }
  const standing = names.map((_, i) => i).filter((i) => !out[i]).sort((a, b) => money[b] - money[a]);
  // Placings: those standing by purse; then the broke, the latest out first (on the same hand, the smaller debt first).
  const placing = [...standing, ...names.map((_, i) => i).filter((i) => out[i]).sort((a, b) => outAt[b] - outAt[a] || money[b] - money[a])];
  const lastHand = intoLast && {
    standing: standing.length,
    keptGold: intoLast.indexOf(Math.max(...intoLast.filter((_, i) => outAt[i] >= firstOut))) === placing[0],
    // Did the Last Hand change the order of those who went into it?
    reshuffled: names
      .map((_, i) => i)
      .filter((i) => outAt[i] >= firstOut)
      .sort((a, b) => intoLast![b] - intoLast![a])
      .some((i, k) => placing[k] !== i),
    yourPlace: placing.indexOf(0),
  };
  const half = history[Math.max(0, Math.ceil(history.length / 2) - 1)];
  const leader = half.indexOf(Math.max(...half));
  return { hands, afterOut: hands - firstOut, firstOut, lastHand, ...st, leaderWon: leader === standing[0], youFirst: standing[0] === 0, youTop2: standing.includes(0) };
}

const N = Number(process.env.SIM_TABLES ?? 20000);
/** The Last Hand: how long tables run, how many are left standing, and how much the final hand decides. */
function lastRow(label: string, p: Params) {
  const runs = Array.from({ length: N }, (_, k) => table(1 + k, p));
  const hands = runs.map((x) => x.hands).sort((a, b) => a - b);
  const q = (f: number) => hands[Math.floor(N * f)];
  const lh = runs.map((x) => x.lastHand).filter((x): x is NonNullable<typeof x> => !!x);
  const share = (f: (x: (typeof lh)[number]) => boolean) => pct(lh.filter(f).length / lh.length);
  say(
    [
      label.padEnd(26),
      `${q(0.5)}`.padStart(5),
      pct(hands.filter((h) => h >= 5 && h <= 8).length / N).padStart(5),
      `(${q(0.1)}-${q(0.9)})`.padStart(8),
      '|',
      share((x) => x.standing === 3).padStart(5),
      share((x) => x.standing === 2).padStart(5),
      share((x) => x.standing === 1).padStart(5),
      '|',
      share((x) => x.keptGold).padStart(9),
      share((x) => x.reshuffled).padStart(10),
      '|',
      ...[0, 1, 2, 3].map((k) => share((x) => x.yourPlace === k).padStart(5)),
    ].join(' '),
  );
}
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
      '|',
      `${[...runs.map((x) => x.afterOut)].sort((a, b) => a - b)[Math.floor(N / 2)]}`.padStart(6),
      pct(runs.filter((x) => x.afterOut >= 3 && x.afterOut <= 4).length / N).padStart(6),
      pct(runs.filter((x) => x.afterOut <= 1).length / N).padStart(6),
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
  say('setting                hands  5-8  p10-p90 | raised  each matched | pot@River final | leader doubles | you1st top2 | after 1st out: median  3-4  0-1');
  row('no raise', { R0: 0, growth: 0 });
  if (!process.env.SIM_CALIBRATE) {
    for (const R0 of [8, 12, 16, 24, 32]) for (const growth of [0, 0.1, 0.15, 0.2]) row(`$${R0} +${pct(growth)}/hand`, { R0, growth });
    say('-- the stakes go up when the first captain is out (ante, fees and raise):');
    for (const m of [1.25, 1.5, 2]) row(`no raise, x${m} on out`, { R0: 0, growth: 0, onOut: m });
    for (const m of [1.25, 1.5, 2]) row(`$8 flat, x${m} on out`, { R0: 8, growth: 0, onOut: m });
    row('$8 +15%, x2 on out', { R0: 8, growth: 0.15, onOut: 2 });
    say('-- the raise is the ante itself (creeping a dollar every three hands), stepped up at the first knockout:');
    for (const m of [1, 1.25, 1.5, 2]) row(`raise = ante, x${m} on out`, { R0: -1, growth: 0, onOut: m === 1 ? undefined : m });
    say('');
    say('== The Last Hand: after the first knockout, one more hand, and the table ends (raise = the ante) ==');
    say('setting                    hands  5-8  p10-p90 | left: 3    2    1 | kept gold  reshuffled | you: gold silver bronze 4th');
    for (const m of [1, 1.5, 2, 3]) lastRow(`Last Hand at x${m}`, { R0: -1, growth: 0, lastHand: m });
    lastRow('Last Hand x2, no raise', { R0: 0, growth: 0, lastHand: 2 });
    for (const start of PURSES.slice(1)) lastRow(`Last Hand x2, purses $${start}`, { R0: -1, growth: 0, lastHand: 2, start });
    say('');
    say('-- how readily the captains raise, at $8 +15%:');
    for (const scale of [0.8, 1, 1.2, 1.4]) row(`$8 +15%, raiseAt x${scale}`, { R0: 8, growth: 0.15, scaleRaiseAt: scale });
  }
  writeFileSync('scripts/raise-model-latest.txt', lines.join('\n') + '\n');
});
