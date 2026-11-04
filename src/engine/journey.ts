/**
 * The story's voyage (Steamboat to St. Louis): the boat, her purse and her
 * crew's strength, day after day, step after step (docs/story.md). The days
 * themselves are content (src/story/river.ts): a list of steps, which this
 * plays through generically. Each step is a caption to read, the morning
 * council (buy, hire, cast off), a run up or down the river (it burns coal),
 * or an encounter played at the table: a duel or a table at a landing for the
 * purse, an obstacle on the river for the crew's strength, the deck game
 * after supper for buttons. Plain, serializable data, and every function
 * pure, like the rest of the engine.
 */
import { type JokerCard, jokerCard } from './cards';
import type { AiId } from './characters';
import { DEFAULT_CONFIG, type RulesConfig } from './config';
import { BOAT, CREW, ITEMS, STARTING_CREW } from './boat';
import { CATEGORIES } from './evaluate';
import { Rng } from './rng';
import type { Action } from './round';
import { newSession, nextSessionHand, playOn, seatOf, submit, waitingFor, type TableSession } from './session';
import { coveredHands, fixedBy, snagDef } from './snags';

/** A line said in a caption: by someone (a character's id, `willie`, `you`), or the intertitle's own words (no `who`). */
export interface StoryLine {
  who?: string;
  text: string;
}

/** How an encounter is won. */
export type Goal =
  /** Take one pot (the harbour master clears the boat when you've beaten him once). */
  | { type: 'winPot' }
  /** The obstacle's pile gone, before the day's hands run out. */
  | { type: 'clear' }
  /** Until someone wins a hand with three of a kind or better (the Tri-Cities' rule): it simply ends. */
  | { type: 'trips' }
  /** Lose between `min` and `max` at showdowns, never by folding (the foreman's game). */
  | { type: 'lose'; min: number; max: number }
  /** The evening's game aboard: played till the hands run out, or you turn in. */
  | { type: 'evening' };

export interface Rival {
  id: string;
  ai: AiId;
  money: number;
  /** Snags they sit down with (indices). */
  jokers?: number[];
  obstacle?: boolean;
}

export interface EncounterDef {
  id: string;
  /** What you play with: the purse (coins), or the crew's strength (buttons). */
  stake: 'purse' | 'strength';
  /** Who you play: rivals, an obstacle, or (`crew`) everyone aboard. */
  rivals: Rival[] | 'crew';
  goal: Goal;
  /** Hands at most (the day's hours, against an obstacle). */
  hands: number;
  /** The story's rules, changed for this encounter (an obstacle forfeits nothing for its snags). */
  rules?: Partial<RulesConfig>;
}

/** What a step does when it's done (an encounter solved, a caption read). */
export interface Effects {
  coal?: number;
  purse?: number;
  flag?: string;
  /** A snag handed to you. */
  snag?: number;
  /** A bill settled: if you hold this snag, you pay (as far as the purse goes) and it's gone. */
  settle?: { snag: number; amount: number };
}

/** An answer in the talk at the table that decides what happens: these effects, and this many of the steps ahead skipped. */
export interface Choice {
  effects?: Effects;
  skip?: number;
}

export type Step =
  | { type: 'caption'; title?: string; lines: StoryLine[]; effects?: Effects }
  /** A new day: the crew's strength made, wages paid, yesterday's hired hands paid off. */
  | { type: 'dawn' }
  /** The morning council: the crew's advice, the landing's trader, and casting off (with `coal` loads aboard at least). */
  | {
      type: 'council';
      advice: StoryLine[];
      trader: string[];
      coal: number;
      /** What leaving the council is called (default: casting off). */
      leave?: string;
    }
  /** Under way: it burns the coal, and you arrive. */
  | { type: 'travel'; coal: number; to: string }
  | {
      type: 'encounter';
      encounter: EncounterDef;
      /** Said when it's over, by how it went. */
      solved: StoryLine[];
      failed?: StoryLine[];
      effects?: Effects;
      /** Failing an obstacle: stuck for the night (the deck game aboard), and at it again in the morning. */
      stuck?: boolean;
      /**
       * Failing it a second time, the river relents (a passing boat tows you off, the foreman gives in):
       * these lines, and it counts as solved. Nobody stays stuck for good.
       */
      relent?: StoryLine[];
      /** It hits you: the picture lurches as the table comes up. */
      jolt?: boolean;
      /** Which try this is (the first, or again after a night stuck). */
      attempt?: number;
      /** What a reply in the talk can decide, by its effect (see `choose`): the encounter ends there. */
      choices?: Record<string, Choice>;
    };

export interface DayDef {
  day: number;
  /** Where the day begins. */
  place: string;
  steps: Step[];
}

export interface StoryDef {
  days: DayDef[];
  /** The deck game aboard, played when you're stuck for the night. */
  stuckNight: Step[];
}

export interface Encounter {
  def: EncounterDef;
  session: TableSession;
  /** Lost at showdowns so far (the foreman's game), and the times you folded. */
  lostAtShowdown: number;
  folds: number;
  /** Over, and how it went (the step's lines are shown; then on). */
  outcome: 'solved' | 'failed' | null;
  /** The table's money and the player's, when each hand began (for the table's coins). */
  start: number[];
  /** You came to it nearly broke, and Willie found an odd job (this much) to stake you. */
  oddJob?: number;
  /** Troubles fixed along the way (snag indices): bestowed on whoever fixes them. */
  fixed: number[];
}

export interface JourneyState {
  rngState: number;
  day: number;
  place: string;
  /** Where we are in the day: its steps, then whatever was slipped in before them (`pending`, first first). */
  step: number;
  pending: Step[];
  purse: number;
  /** The crew's strength (buttons), made each morning. */
  strength: number;
  /** Strength added to tomorrow morning's only (a good supper). */
  tomorrow: number;
  coal: number;
  crew: string[];
  /** Upgrades bought (items kept). */
  upgrades: string[];
  comfort: number;
  /** Snags carried: cargo, duties, troubles. */
  snags: JokerCard[];
  flags: string[];
  encounter: Encounter | null;
  /** Mornings so far (the boat's figures mean something once the first has dawned). */
  mornings: number;
  /** Nights spent stuck along the way (the calendar runs on: the day shown is `day + nights`). */
  nights: number;
  /** The voyage so far is played out (the slice's end). */
  done: boolean;
}

/**
 * The story's rules: Snag Poker without snags shuffled into the deck (every
 * snag here is somebody's), and lighter on them: a dollar's upkeep for each
 * one carried, a dollar's forfeit for each played in a losing hand.
 */
export const STORY_CONFIG: RulesConfig = { ...DEFAULT_CONFIG, preset: 'story', totalJokers: 0, drainPerJoker: 1, jokerForfeit: 1 };

const clone = <T>(x: T): T => structuredClone(x);
export const PLAYER_ID = 'captain';

export function newJourney(seed: number, story: StoryDef, start: { purse: number; coal: number }): JourneyState {
  const state: JourneyState = {
    rngState: new Rng(seed >>> 0).state,
    day: story.days[0].day,
    place: story.days[0].place,
    step: 0,
    pending: [],
    purse: start.purse,
    strength: 0,
    tomorrow: 0,
    coal: start.coal,
    crew: STARTING_CREW.slice(),
    upgrades: [],
    comfort: BOAT.comfort,
    snags: [],
    flags: [],
    encounter: null,
    mornings: 0,
    nights: 0,
    done: false,
  };
  return arrive(state, story);
}

/** The step we're at (null: the voyage so far is done). */
export function currentStep(state: JourneyState, story: StoryDef): Step | null {
  if (state.pending.length) return state.pending[0];
  const day = story.days.find((d) => d.day === state.day);
  return day?.steps[state.step] ?? null;
}

/** What strength the crew would make this morning. */
export function morningStrength(state: JourneyState): number {
  return state.crew.reduce((a, id) => a + (CREW[id]?.strength ?? 0), 0) + state.comfort + state.tomorrow;
}

/** On to the next step (the pending ones first), then through any that play themselves. */
function advance(state: JourneyState, story: StoryDef): JourneyState {
  if (state.pending.length) state.pending.shift();
  else state.step++;
  const day = story.days.find((d) => d.day === state.day);
  if (!state.pending.length && day && state.step >= day.steps.length) {
    const next = story.days.find((d) => d.day === state.day + 1);
    if (next) {
      state.day = next.day;
      state.step = 0;
    } else state.done = true;
  }
  return arrive(state, story);
}

/** Steps that play themselves (a new day, a run up the river) are played; an encounter is seated. */
function arrive(state: JourneyState, story: StoryDef): JourneyState {
  const step = currentStep(state, story);
  if (!step || state.done) return state;
  if (step.type === 'dawn') {
    state.crew = state.crew.filter((id) => !CREW[id]?.temporary);
    state.strength = morningStrength(state);
    state.tomorrow = 0;
    state.mornings++;
    // The first morning's wages were settled by the captain before you.
    if (state.mornings > 1) state.purse = Math.max(0, state.purse - state.crew.reduce((a, id) => a + (CREW[id]?.wage ?? 0), 0));
    return advance(state, story);
  }
  if (step.type === 'travel') {
    state.coal = Math.max(0, state.coal - step.coal);
    state.place = step.to;
    return advance(state, story);
  }
  if (step.type === 'encounter' && !state.encounter) seat(state, step.encounter);
  return state;
}

function applyEffects(state: JourneyState, effects: Effects | undefined) {
  if (!effects) return;
  if (effects.coal) state.coal = Math.min(BOAT.bunker, state.coal + effects.coal);
  if (effects.purse) state.purse = Math.max(0, state.purse + effects.purse);
  if (effects.flag && !state.flags.includes(effects.flag)) state.flags.push(effects.flag);
  if (effects.snag !== undefined) state.snags.push(jokerCard(effects.snag));
  if (effects.settle) {
    const { snag, amount } = effects.settle;
    const k = state.snags.findIndex((j) => j.index === snag);
    if (k >= 0) {
      state.snags.splice(k, 1);
      state.purse = Math.max(0, state.purse - amount);
    }
  }
}

/** A caption read: on. */
export function proceed(prev: JourneyState, story: StoryDef): JourneyState {
  const step = currentStep(prev, story);
  if (step?.type !== 'caption') throw new Error('Not a caption');
  const state = clone(prev);
  applyEffects(state, step.effects);
  return advance(state, story);
}

/** Can this be bought now (at this council, affordable, room for it, not already had)? */
export function canBuy(state: JourneyState, story: StoryDef, itemId: string): boolean {
  const step = currentStep(state, story);
  const item = ITEMS[itemId];
  if (step?.type !== 'council' || !item || !step.trader.includes(itemId) || state.purse < item.price) return false;
  if (item.once && state.upgrades.includes(itemId)) return false;
  if (item.effect.coal && state.coal >= BOAT.bunker) return false;
  if (item.effect.hire && state.crew.includes(item.effect.hire)) return false;
  return true;
}

export function buy(prev: JourneyState, story: StoryDef, itemId: string): JourneyState {
  if (!canBuy(prev, story, itemId)) throw new Error(`Can't buy ${itemId}`);
  const state = clone(prev);
  const item = ITEMS[itemId];
  const e = item.effect;
  state.purse -= item.price;
  if (item.once) state.upgrades.push(itemId);
  if (e.coal) state.coal = Math.min(BOAT.bunker, state.coal + e.coal);
  if (e.comfort) {
    state.comfort += e.comfort;
    state.strength += e.comfort;
  }
  if (e.tomorrow) state.tomorrow += e.tomorrow;
  if (e.hire) {
    state.crew.push(e.hire);
    state.strength += CREW[e.hire]?.strength ?? 0;
  }
  return state;
}

/** Casting off needs the day's coal aboard. */
export function canCastOff(state: JourneyState, story: StoryDef): boolean {
  const step = currentStep(state, story);
  return step?.type === 'council' && state.coal >= step.coal;
}

export function castOff(prev: JourneyState, story: StoryDef): JourneyState {
  if (!canCastOff(prev, story)) throw new Error('Not enough coal to cast off');
  return advance(clone(prev), story);
}

/** The troubles a spare saves you from (bought upgrades with `spare`). */
function spared(state: JourneyState): number[] {
  return state.upgrades.flatMap((id) => (ITEMS[id]?.effect.spare !== undefined ? [ITEMS[id].effect.spare!] : []));
}

/** Sits the encounter down: you, and whoever you're playing. */
/** The least you bring to the deck game. */
export const DECK_GAME_LEAST = 3;

/** Never stuck for a stake: come to a table for money with next to none, and there's an odd job to be had. */
export const ODD_JOB = { below: 6, pays: 10 };

function seat(state: JourneyState, def: EncounterDef) {
  const rng = new Rng(state.rngState);
  const oddJob = def.stake === 'purse' && def.rules?.pot !== false && state.purse < ODD_JOB.below ? ODD_JOB.pays : 0;
  state.purse += oddJob;
  const seed = rng.int(2 ** 31);
  // At the deck game everyone finds a button or two, however hard the day.
  const money = def.stake === 'purse' ? state.purse : def.rivals === 'crew' ? Math.max(state.strength, DECK_GAME_LEAST) : state.strength;
  const troubles = state.snags.filter((j) => snagDef(j.index).kind === 'trouble');
  // Against an obstacle your snags stay aside (it cares nothing for your duties), but the volunteers among them cover their hands.
  const obstacle = def.rivals !== 'crew' && def.rivals.some((r) => r.obstacle);
  const jokers = obstacle ? [] : def.rivals === 'crew' ? troubles : state.snags;
  const randomHand = 1 + rng.int(def.hands);
  const me = { id: PLAYER_ID, money, jokers, ...(obstacle ? { cover: coveredHands(state.snags, def.hands, randomHand) } : {}) };
  const rivals =
    def.rivals === 'crew'
      ? state.crew.map((id) => ({ id, ai: CREW[id].ai, money: Math.ceil(CREW[id].strength / 2), fixes: fixedBy(id) }))
      : def.rivals.map((r) => ({
          id: r.id,
          ai: r.ai,
          money: r.money,
          jokers: (r.jokers ?? []).filter((i) => !spared(state).includes(i)).map(jokerCard),
          ...(r.obstacle ? { obstacle: true } : {}),
        }));
  const session = newSession(seed, [me, ...rivals], { ...STORY_CONFIG, ...def.rules });
  state.rngState = rng.state;
  state.encounter = {
    def,
    session,
    lostAtShowdown: 0,
    folds: 0,
    outcome: null,
    fixed: [],
    start: session.seated.map((i) => session.seats[i].money),
    ...(oddJob ? { oddJob } : {}),
  };
}

/** Your seat at the encounter's table this hand. */
export function mySeatAt(enc: Encounter): number {
  return seatOf(enc.session, 0);
}

/** Your move at the encounter's table (null: you're out of the hand; the rest play on). */
export function playEncounter(prev: JourneyState, action: Action | null): JourneyState {
  const enc = prev.encounter;
  if (!enc || enc.outcome) throw new Error('No encounter under way');
  const state = clone(prev);
  const e = state.encounter!;
  const me = mySeatAt(e);
  if (action) {
    if (action.type === 'fold') e.folds++;
    e.session = submit(e.session, me, action);
  } else if (!waitingFor(e.session).length) e.session = playOn(e.session);
  return state;
}

/** Is the encounter waiting for your move? */
export function myMoveOwed(state: JourneyState): boolean {
  const enc = state.encounter;
  return !!enc && !enc.outcome && waitingFor(enc.session).includes(mySeatAt(enc));
}

/** After a hand's verdict: the encounter goes on, or it's over (and how). */
export function handDone(prev: JourneyState, story: StoryDef): JourneyState {
  const enc = prev.encounter;
  if (!enc || enc.outcome || enc.session.phase === 'hand') throw new Error('No hand to be done with');
  const state = clone(prev);
  const e = state.encounter!;
  const s = e.session;
  const round = s.round!;
  const res = round.result!;
  const me = mySeatAt(e);
  const mine = s.seats[0];
  const won = me >= 0 && res.winners.includes(me);
  e.fixed.push(...(s.settled?.absorbed.map((a) => a.snag) ?? []));
  if (me >= 0 && !won && !res.byFolds) e.lostAtShowdown += round.bets[me] + res.forfeit[me] - res.share[me];
  const goal = e.def.goal;
  const lastHand = s.hand >= e.def.hands;
  const over = s.phase === 'over';
  let outcome: Encounter['outcome'] = null;
  if (goal.type === 'winPot') outcome = won ? 'solved' : mine.out ? 'failed' : null;
  else if (goal.type === 'clear') {
    const pile = s.seats.find((p) => p.obstacle)!;
    outcome = pile.money <= 0 ? 'solved' : mine.out || lastHand ? 'failed' : null;
  } else if (goal.type === 'trips') {
    const top = res.winners.map((w) => res.hands[w]).find(Boolean);
    const trips = !!top && CATEGORIES.indexOf(top.category) >= CATEGORIES.indexOf('threeOfAKind');
    outcome = trips || lastHand || over ? 'solved' : null;
  } else if (goal.type === 'lose') outcome = e.lostAtShowdown >= goal.min || mine.out ? 'solved' : lastHand ? 'failed' : null;
  // The evening's game ends with your buttons: nobody's left watching from the rail.
  else outcome = lastHand || over || mine.out ? 'solved' : null;
  if (!outcome && over) outcome = mine.out ? 'failed' : 'solved';
  if (outcome) return finish(state, story, outcome);
  e.session = nextSessionHand(s);
  e.start = e.session.seated.map((i) => e.session.seats[i].money);
  return state;
}

/** Turning in from the deck game (or giving up the evening): it ends there, solved. */
export function turnIn(prev: JourneyState, story: StoryDef): JourneyState {
  const enc = prev.encounter;
  if (!enc || enc.outcome || enc.def.goal.type !== 'evening' || enc.session.phase === 'hand') throw new Error('Not now');
  return finish(clone(prev), story, 'solved');
}

/** The encounter is over: what you have now goes back to the boat; its lines are shown. */
function finish(state: JourneyState, _story: StoryDef, outcome: 'solved' | 'failed'): JourneyState {
  const e = state.encounter!;
  const mine = e.session.seats[0];
  if (e.def.stake === 'purse') state.purse = mine.money;
  else state.strength = mine.money;
  const obstacle = e.def.rivals !== 'crew' && e.def.rivals.some((r) => r.obstacle);
  if (obstacle) state.snags = [...state.snags, ...mine.jokers];
  else if (e.def.rivals === 'crew') state.snags = [...state.snags.filter((j) => snagDef(j.index).kind !== 'trouble'), ...mine.jokers];
  else state.snags = mine.jokers;
  e.outcome = outcome;
  return state;
}

/** A reply at the table decided it: the encounter ends here, and on. */
export function choose(prev: JourneyState, story: StoryDef, key: string): JourneyState {
  const step = currentStep(prev, story);
  const choice = step?.type === 'encounter' ? step.choices?.[key] : undefined;
  if (!choice) throw new Error(`No such choice: ${key}`);
  const state = clone(prev);
  state.encounter = null;
  applyEffects(state, choice.effects);
  for (let k = 0; k < (choice.skip ?? 0); k++) {
    if (state.pending.length) state.pending.shift();
    else state.step++;
  }
  return advance(state, story);
}

/** The encounter's lines read: on (or, stuck, into the night aboard and at it again in the morning). */
export function leaveEncounter(prev: JourneyState, story: StoryDef): JourneyState {
  const step = currentStep(prev, story);
  const enc = prev.encounter;
  if (step?.type !== 'encounter' || !enc?.outcome) throw new Error('No encounter to leave');
  const state = clone(prev);
  state.encounter = null;
  const attempt = step.attempt ?? 1;
  if (enc.outcome === 'failed' && step.stuck && step.relent && attempt >= 2) {
    // The second time, the river relents: its lines on a card of their own, then on as if solved.
    applyEffects(state, step.effects);
    state.pending = [{ type: 'caption', lines: step.relent }, ...state.pending.slice(1)];
    if (!prev.pending.length) state.step++;
    return arrive(state, story);
  }
  if (enc.outcome === 'failed' && step.stuck) {
    // The step stays where it is: the night, then the morning, then at it again (with a full day's hands).
    // What's left of the obstacle is what you face: yesterday's digging counts, and it still has whatever snags it kept.
    const rivals = step.encounter.rivals === 'crew' ? 'crew' : step.encounter.rivals.map((r) => {
      const seat = enc.session.seats.find((p) => p.id === r.id);
      return r.obstacle && seat ? { ...r, money: seat.money, jokers: seat.jokers.map((j) => j.index) } : r;
    });
    const again: Step = { ...step, attempt: attempt + 1, encounter: { ...step.encounter, rivals, hands: Math.max(step.encounter.hands, 8) } };
    state.pending = [...story.stuckNight, { type: 'dawn' }, again, ...state.pending.slice(1)];
    if (!prev.pending.length) state.step++;
    state.nights++;
    return arrive(state, story);
  }
  if (enc.outcome === 'solved') applyEffects(state, step.effects);
  return advance(state, story);
}
