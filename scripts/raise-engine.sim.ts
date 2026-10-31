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
  /** The Last Hand (when played): how many were left standing, whether the leader going into it kept gold, whether it changed the order, and your place (0 gold). */
  last?: { standing: number; keptGold: boolean; reshuffled: boolean; yourPlace: number };
}

interface Options {
  /** The raise at the first hand; -1: the raise is the ante itself (doubling with it in the Last Hand); 0: no raise. */
  R0: number;
  growth?: number;
  /** The Last Hand: after the first knockout, one more hand at this multiple of the ante, and the table ends. */
  lastHand?: number;
  /** Starting purses. */
  start?: number;
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

function playTable(seed: number, { R0, growth = 0, lastHand, start }: Options): Stats {
  let g = newHighRollers(seed, start ? { money: start } : {});
  const rng = new Rng(seed * 7919 + 13);
  const total = g.players.reduce((a, p) => a + p.money, 0);
  const st: Stats = { hands: 0, rivers: 0, raisedRivers: 0, raisers: 0, facing: 0, matched: 0, folded: 0, potBeforeRaise: 0, potFinal: 0, showdowns: 0, leaderWon: false, doubleUps: 0, youFirst: false, youTop2: false };
  const history: number[][] = [];
  const startHand = g.hand;

  /** The Last Hand: 'pending' once someone is out, 'playing' while it's dealt, 'done' after. */
  let lastStage: 'none' | 'pending' | 'playing' | 'done' = 'none';
  let intoLast: number[] = [];

  for (let guard = 0; guard < 300; guard++) {
    if (lastHand ? lastStage === 'done' : g.phase === 'over') break;
    if (g.phase === 'over') break; // one captain left
    if (g.phase === 'handEnd') {
      if (lastStage === 'pending') {
        // Into the Last Hand: its hand number set so the ante (and the fees, and a raise of the ante) is this many times what it would be.
        g = structuredClone(g);
        g.hand = Math.round(lastHand! * (g.hand + 1)) - 1;
        intoLast = g.players.map((p) => p.money);
        lastStage = 'playing';
      }
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
    const raise = R0 < 0 ? baseAnte(config, r.month) : R0 ? Math.round(R0 * Math.pow(1 + growth, g.hand - startHand)) : 0;
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
    if (lastHand) {
      const standingNow = g.players.filter((p) => !p.out).length;
      if (lastStage === 'playing') lastStage = 'done';
      else if (lastStage === 'none' && standingNow < g.players.length) lastStage = standingNow > 1 ? 'pending' : 'done';
      // Two left isn't the end now: the Last Hand is still to come.
      if (lastStage === 'pending' && g.phase === 'over' && standingNow > 1) g.phase = 'handEnd';
    }
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
  if (lastHand && intoLast.length) {
    // Placings: those standing by purse; then the broke, the latest out first (on the same hand, the smaller debt first).
    const idx = g.players.map((_, i) => i);
    const placing = [
      ...standing.map((x) => x.i),
      ...idx.filter((i) => g.players[i].out).sort((a, b) => (g.players[b].outOn ?? 0) - (g.players[a].outOn ?? 0) || g.players[b].money - g.players[a].money),
    ];
    const wentIn = idx.filter((i) => intoLast[i] > 0).sort((a, b) => intoLast[b] - intoLast[a]);
    st.last = {
      standing: standing.length,
      keptGold: wentIn[0] === placing[0],
      reshuffled: wentIn.some((i, k) => placing[k] !== i),
      yourPlace: placing.findIndex((i) => g.players[i].id === HUMAN_ID),
    };
  }
  return st;
}

const TABLES = Number(process.env.SIM_TABLES ?? 20);
const SETTINGS: [string, Options][] = [
  ['two left (now), no raise', { R0: 0 }],
  ['two left, raise = ante', { R0: -1 }],
  ['Last Hand x2, no raise', { R0: 0, lastHand: 2 }],
  ['Last Hand x2, raise = ante', { R0: -1, lastHand: 2 }],
  ['  ...purses $160', { R0: -1, lastHand: 2, start: 160 }],
  ['  ...purses $200', { R0: -1, lastHand: 2, start: 200 }],
];
const pct = (x: number) => `${Math.round(x * 100)}%`;

/** Each line of results: printed, and kept for the file. */
const lines: string[] = [];
const say = (line: string) => {
  lines.push(line);
  console.log(line);
};

it('raise over the engine', () => {
  say(`ante at hand 24: $${baseAnte(config, 24)}; tables per row: ${TABLES}`);
  say('setting                     hands  5-8  p10-p90 | raised matched  pot | left: 3    2    1 | kept gold reshuffled | you: gold silver bronze 4th');
  for (const [label, options] of SETTINGS) {
    const runs = Array.from({ length: TABLES }, (_, k) => playTable(1000 + k, options));
    const hands = runs.map((r) => r.hands).sort((a, b) => a - b);
    const sum = (f: (s: Stats) => number) => runs.reduce((a, r) => a + f(r), 0);
    const last = runs.map((r) => r.last).filter((x): x is NonNullable<Stats['last']> => !!x);
    const share = (f: (x: NonNullable<Stats['last']>) => boolean) => (last.length ? pct(last.filter(f).length / last.length) : '-');
    say(
      [
        label.padEnd(27),
        String(hands[Math.floor(TABLES / 2)]).padStart(5),
        pct(hands.filter((h) => h >= 5 && h <= 8).length / TABLES).padStart(5),
        `(${hands[Math.floor(TABLES * 0.1)]}-${hands[Math.floor(TABLES * 0.9)]})`.padStart(8),
        '|',
        pct(sum((r) => r.raisedRivers) / Math.max(1, sum((r) => r.rivers))).padStart(6),
        pct(sum((r) => r.matched) / Math.max(1, sum((r) => r.facing))).padStart(7),
        `$${Math.round(sum((r) => r.potFinal) / Math.max(1, sum((r) => r.rivers)))}`.padStart(5),
        '|',
        ...[3, 2, 1].map((n) => share((x) => x.standing === n).padStart(n === 3 ? 5 : 4)),
        '|',
        share((x) => x.keptGold).padStart(9),
        share((x) => x.reshuffled).padStart(10),
        '|',
        ...[0, 1, 2, 3].map((k) => share((x) => x.yourPlace === k).padStart(5)),
      ].join(' '),
    );
  }
  writeFileSync('scripts/raise-engine-latest.txt', lines.join('\n') + '\n');
});
