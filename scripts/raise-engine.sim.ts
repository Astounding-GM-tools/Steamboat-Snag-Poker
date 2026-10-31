/**
 * High Rollers with a River raise (an idea, not in the game): a simulation
 * over the real engine. Slow (about a third of a second a table: the AI's own
 * odds), so tune with raise-model.sim.ts and check the result here.
 *
 *   SIM_TABLES=50 npx vitest run --config vitest.sim.config.ts scripts/raise-engine.sim.ts
 *
 * At the River every seat lays its hand (the engine's own AI), then decides,
 * in secret, whether to raise (one fixed size; raises don't stack). Those who
 * didn't raise then match or fold. Then the showdown, as the engine does it.
 * The house covers: a purse may go below zero, and below zero you're out.
 *
 * Raise size: R0 × (1 + growth)^(hands played so far), rounded.
 */
import { writeFileSync } from 'node:fs';
import { it } from 'vitest';
import {
  DEFAULT_CONFIG,
  HUMAN_ID,
  Rng,
  baseAnte,
  bestScore,
  chooseAction,
  fullDeck,
  inHand,
  isJoker,
  mySeat,
  newHighRollers,
  nextHighRollersHand,
  playHighRollers,
  resolveTableStreet,
  tableView,
  type Action,
  type AiId,
  type Card,
  type HighRollersState,
} from '../src/engine';

const config = DEFAULT_CONFIG;

/** How each style raises and matches: raise from this win chance, bluff this often, and match when the odds beat the price × `nerve`. */
const STYLE: Partial<Record<AiId, { raiseAt: number; bluff: number; nerve: number; always?: boolean }>> = {
  stubborn: { raiseAt: 0.6, bluff: 0, nerve: 0, always: true }, // Bill: never folds
  loose: { raiseAt: 0.45, bluff: 0.12, nerve: 0.75 }, // Finlay
  defeatist: { raiseAt: 0.75, bluff: 0, nerve: 1.6 }, // Lenny
  shark: { raiseAt: 0.55, bluff: 0.04, nerve: 1.0 }, // Walrus
  gambler: { raiseAt: 0.5, bluff: 0.08, nerve: 1.0 }, // Gaylord
  predator: { raiseAt: 0.5, bluff: 0.06, nerve: 0.9 }, // Eliza
  careful: { raiseAt: 0.6, bluff: 0, nerve: 1.0 }, // you, played carefully
};

/**
 * A hand's chance of beating every other hand still in: against one unseen
 * hand (three hole cards from what's not on show, the best they could make,
 * snags aside) by sampling; then against several, as if independent.
 */
function winChance(my: (Card | null)[], board: Card[], seen: Card[], opponents: number, rng: Rng, samples = 24): number {
  const mine = bestScore(my, board, { min: my.length, max: my.length });
  const shown = new Set(seen.map((c) => c.id));
  const pool = fullDeck().filter((c) => !shown.has(c.id));
  let wins = 0;
  for (let s = 0; s < samples; s++) {
    const hole: Card[] = [];
    while (hole.length < 3) {
      const c = pool[rng.int(pool.length)];
      if (!hole.includes(c)) hole.push(c);
    }
    const theirs = bestScore(hole, board, { min: 0, max: 3 });
    wins += mine > theirs ? 1 : mine === theirs ? 0.5 : 0;
  }
  return Math.pow(wins / samples, opponents);
}

interface Stats {
  hands: number;
  rivers: number;
  raisedRivers: number;
  raisers: number;
  facing: number;
  matched: number;
  folded: number;
  potBeforeRaise: number;
  potFinal: number;
  showdowns: number;
  /** The halfway chip leader went on to win. */
  leaderWon: boolean;
  /** A captain at under half the table's average purse at least doubled it in one hand. */
  doubleUps: number;
  youFirst: boolean;
  youTop2: boolean;
}

/** settle() from highrollers.ts, which isn't exported: pay out, move snags, mark who's out. */
function settle(state: HighRollersState) {
  const round = state.round!;
  const res = round.result!;
  round.seats.forEach((seat, k) => {
    const p = state.players[state.seated[k]];
    p.money += res.share[k] - round.bets[k] - res.forfeit[k];
    p.jokers = seat.jokers;
  });
  state.pool.push(...res.returnedToPool);
  for (const p of state.players) {
    if (!p.out && p.money <= 0) {
      p.out = true;
      p.outOn = state.hand;
    }
  }
  state.phase = state.players.filter((p) => !p.out).length <= 2 ? 'over' : 'handEnd';
}

function playTable(seed: number, R0: number, growth: number): Stats {
  let g = newHighRollers(seed);
  const rng = new Rng(seed * 7919 + 13);
  const total = g.players.reduce((a, p) => a + p.money, 0);
  const st: Stats = { hands: 0, rivers: 0, raisedRivers: 0, raisers: 0, facing: 0, matched: 0, folded: 0, potBeforeRaise: 0, potFinal: 0, showdowns: 0, leaderWon: false, doubleUps: 0, youFirst: false, youTop2: false };
  const history: number[][] = [];
  const startHand = g.hand;

  for (let guard = 0; g.phase !== 'over' && guard < 300; guard++) {
    if (g.phase === 'handEnd') {
      g = nextHighRollersHand(g);
      continue;
    }
    const round = g.round!;
    const me = mySeat(g);
    if (round.street < 2) {
      const mine = me < 0 || round.seats[me].folded ? null : chooseAction('careful', tableView(round, me), g.config, rng);
      const before = g.players.map((p) => p.money);
      g = playHighRollers(g, mine);
      if (g.round!.result) endOfHand(before);
      continue;
    }
    // The River, by hand: lay the hands, then the raise.
    const before = g.players.map((p) => p.money);
    g = structuredClone(g);
    const r = g.round!;
    const seats = inHand(r);
    const styleOf = (s: number) => STYLE[g.players[g.seated[s]].ai ?? 'careful'] ?? STYLE.careful!;
    const actions: (Action | null)[] = r.seats.map((s, i) => (s.folded ? null : chooseAction(g.players[g.seated[i]].ai ?? 'careful', tableView(r, i), g.config, rng)));
    const raise = R0 ? Math.round(R0 * Math.pow(1 + growth, g.hand - startHand)) : 0;
    st.rivers++;
    const pot0 = r.bets.reduce((a, b) => a + b, 0);
    st.potBeforeRaise += pot0;
    if (raise) {
      // Each seat's hand as laid, and its chance against the others still in.
      const chance = new Map<number, number>();
      for (const s of seats) {
        const a = actions[s] as Extract<Action, { type: 'compose' }>;
        const cards = a.cardIds.map((id) => r.seats[s].hand.find((c) => c.id === id)!);
        const laid: (Card | null)[] = [...cards, ...Array.from({ length: a.jokers }, () => null)];
        chance.set(s, winChance(laid, r.community, [...r.seats[s].hand, ...r.community, ...r.discards], seats.length - 1, rng));
      }
      const raisers = seats.filter((s) => {
        const st_ = styleOf(s);
        return chance.get(s)! >= st_.raiseAt || rng.next() < st_.bluff;
      });
      if (raisers.length) {
        st.raisedRivers++;
        st.raisers += raisers.length;
        for (const s of raisers) r.bets[s] += raise;
        const pot = r.bets.reduce((a, b) => a + b, 0);
        for (const s of seats.filter((x) => !raisers.includes(x))) {
          st.facing++;
          const st_ = styleOf(s);
          // Pot odds: match when the chance of winning beats the price of staying in.
          const price = raise / (pot + raise);
          const match = st_.always || chance.get(s)! >= price * st_.nerve;
          if (match) {
            st.matched++;
            r.bets[s] += raise;
          } else {
            st.folded++;
            r.seats[s].folded = true;
            actions[s] = null;
          }
        }
      }
    }
    resolveTableStreet(r, actions, g.config);
    st.potFinal += r.result!.pot;
    if (!r.result!.byFolds) st.showdowns++;
    settle(g);
    endOfHand(before);
  }

  function endOfHand(before: number[]) {
    st.hands++;
    const after = g.players.map((p) => p.money);
    history.push(after);
    const live = before.filter((m, i) => m > 0 && !g.players[i].out || m > 0);
    const avg = live.reduce((a, b) => a + b, 0) / Math.max(1, live.length);
    before.forEach((m, i) => {
      if (m > 0 && m < avg / 2 && after[i] >= 2 * m) st.doubleUps++;
    });
  }

  const final = g.players.map((p) => p.money);
  if (Math.abs(final.reduce((a, b) => a + b, 0) - total) > 0) throw new Error(`money not conserved: seed ${seed}`);
  const standing = g.players.map((p, i) => ({ i, p })).filter((x) => !x.p.out).sort((a, b) => b.p.money - a.p.money);
  const winner = standing[0]?.i;
  const half = history[Math.max(0, Math.ceil(history.length / 2) - 1)] ?? final;
  const leader = half.indexOf(Math.max(...half));
  st.leaderWon = leader === winner;
  st.youFirst = g.players[winner]?.id === HUMAN_ID;
  st.youTop2 = standing.some((x) => x.p.id === HUMAN_ID);
  return st;
}

const TABLES = Number(process.env.SIM_TABLES ?? 20);
const R0s = [0, 8, 16];
const growths = [0, 0.15];
const pct = (x: number) => `${Math.round(x * 100)}%`;
const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

/** Each line of results: printed, and kept for the file. */
const lines: string[] = [];
const say = (line: string) => {
  lines.push(line);
  console.log(line);
};

it('raise over the engine', () => {
  say(`ante at hand 24: $${baseAnte(config, 24)}; tables per row: ${TABLES}`);
  say('raise  growth | hands: median  5-8   (p10-p90) | raised  raisers  matched | pot: before  final | leader wins  doubles/table | you: 1st  top2');
  for (const R0 of R0s) {
    for (const growth of R0 ? growths : [0]) {
      const runs = Array.from({ length: TABLES }, (_, k) => playTable(1000 + k, R0, growth));
      const hands = runs.map((r) => r.hands);
      const sum = (f: (s: Stats) => number) => runs.reduce((a, r) => a + f(r), 0);
      const sorted = [...hands].sort((a, b) => a - b);
      const row = [
        R0 ? `$${R0}`.padStart(4) : ' none',
        R0 ? pct(growth).padStart(6) : '      ',
        '|',
        String(median(hands)).padStart(10),
        pct(hands.filter((h) => h >= 5 && h <= 8).length / TABLES).padStart(5),
        `(${sorted[Math.floor(TABLES * 0.1)]}-${sorted[Math.floor(TABLES * 0.9)]})`.padStart(9),
        '|',
        pct(sum((r) => r.raisedRivers) / Math.max(1, sum((r) => r.rivers))).padStart(6),
        (sum((r) => r.raisers) / Math.max(1, sum((r) => r.raisedRivers))).toFixed(1).padStart(8),
        pct(sum((r) => r.matched) / Math.max(1, sum((r) => r.facing))).padStart(8),
        '|',
        `$${Math.round(sum((r) => r.potBeforeRaise) / Math.max(1, sum((r) => r.rivers)))}`.padStart(11),
        `$${Math.round(sum((r) => r.potFinal) / Math.max(1, sum((r) => r.rivers)))}`.padStart(6),
        '|',
        pct(runs.filter((r) => r.leaderWon).length / TABLES).padStart(12),
        (sum((r) => r.doubleUps) / TABLES).toFixed(2).padStart(14),
        '|',
        pct(runs.filter((r) => r.youFirst).length / TABLES).padStart(9),
        pct(runs.filter((r) => r.youTop2).length / TABLES).padStart(5),
      ];
      say(row.join(' '));
    }
  }
  writeFileSync('scripts/raise-engine-latest.txt', lines.join('\n') + '\n');
});
