/**
 * The story's voyage (Steamboat to St. Louis): the boat, her purse and her
 * crew's strength, day after day, step after step (docs/story.md). The days
 * themselves are content (src/story/chapters): a list of steps, which this
 * plays through generically. Each step is a caption to read, the morning
 * council (buy, hire, cast off), a run up or down the river (it burns coal),
 * or an encounter played at the table: a duel or a table at a landing for the
 * purse, an obstacle on the river for the crew's strength, the deck game
 * after supper for buttons. Plain, serializable data, and every function
 * pure, like the rest of the engine.
 */
import { type JokerCard, jokerCard } from '../../engine/cards';
import type { AiId } from '../../engine/characters';
import { chooseAction, viewFor } from '../../engine/ai';
import { DEFAULT_CONFIG, type RulesConfig } from '../../engine/config';
import { BOAT, CREW, GIVE_UP_CHAIR, HIRE_DAYS, ITEMS, STARTING_CREW, shipStrength, type BoatParts, type Station, type Stations } from './boat';
import { CATEGORIES } from '../../engine/evaluate';
import { Rng } from '../../engine/rng';
import type { Action, RoundResult, RoundState } from '../../engine/round';
import { newSession, nextSessionHand, playOn, seatOf, submit, waitingFor, type TableSession } from '../../engine/session';
import { SNAGS, TROUBLES, coveredHands, snagDef } from './snags';

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
  | { type: 'evening' }
  /** The last at the table with money; or, if `host` is, the last to go out before her (the pilot takes the winner, or if she wins it herself, the runner-up). */
  | { type: 'lastStanding'; host?: string };

export interface Rival {
  id: string;
  ai: AiId;
  money: number;
  /** Snags they sit down with (indices). */
  jokers?: number[];
  obstacle?: boolean;
  /** An obstacle that can only be worn down: it gains nothing from what you lose. */
  steady?: boolean;
  /** Takes any snag that comes their way off your hands (striking miners have the time). */
  obliging?: boolean;
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
  /** One push: it burns a load of coal, and the crew come to it fresh. */
  push?: boolean;
  /** Who else may be here, by the day of the voyage (they keep to their calendar, whatever you do). */
  guests?: { rival: Rival; from?: number; to?: number }[];
  /** Finish this table ahead of this rival, and this flag goes up. */
  marks?: { rival: string; flag: string };
  /** Someone else plays your seat, this way; you pay no entry and take no winnings. */
  proxy?: AiId;
  /** A tournament table: this much to sit down (and it's everyone's stack), and the table takes it all. */
  entry?: number;
  /** Who else sits down, besides `rivals`: your table in the morning, or the morning's winners at noon. */
  joined?: 'mates' | 'finalists';
  /** The story's rules, changed for this encounter (an obstacle forfeits nothing for its snags). */
  rules?: Partial<RulesConfig>;
}

/** What a step does when it's done (an encounter solved, a caption read). */
export interface Effects {
  coal?: number;
  purse?: number;
  flag?: string;
  /** Strength added to tomorrow morning's only. */
  tomorrow?: number;
  /** A snag handed to you. */
  snag?: number;
  /** A flag taken down. */
  clear?: string;
  /** A bill settled: if you hold this snag, you pay (as far as the purse goes) and it's gone. */
  settle?: { snag: number; amount: number };
}

/** An answer in the talk at the table that decides what happens: these effects, and `end` ends the scene there. */
export interface Choice {
  effects?: Effects;
  end?: boolean;
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
      /** Its heading, as a menu opened from a hub (the default: the morning council). */
      title?: string;
      /** What leaving the council is called (default: casting off). */
      leave?: string;
    }
  /** A push failed, with coal left: go again, or call it off. */
  | { type: 'fork'; lines: StoryLine[]; stage: Step; turnedBack: Step[] }
  /** Steps that belong together: a choice in them can end the lot (a hub's option is a scene too). */
  | { type: 'scene'; steps: Step[] }
  /** Evening comes, whatever slot it was (a day spent). A label: somewhere to go on from (`onFail`). */
  | { type: 'nightfall'; label?: string }
  /** That took the slot: on to the next. */
  | { type: 'slot' }
  /** A place with things to do: its options (`StoryDef.hubs`) are offered, and we come back here after each. */
  | { type: 'hub'; hub: string }
  /** On from the hub: whatever was going on there is done with. */
  | { type: 'leave' }
  /** The day's draw: tables of `entrants`, yours filled first; the others are played out unseen, and we meet whoever won. */
  | {
      type: 'draw';
      entrants: { id: string; ai: AiId }[];
      tableSize: number;
      finalists: number;
      /** Someone who comes through their table every day until the day given (that last day only if the flag isn't up: they've someone else to play for). */
      regular?: { id: string; ai: AiId; until: number; engaged?: string };
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
      /** It hits you: the picture lurches as the table comes up. */
      jolt?: boolean;
      /** In place of `solved`: closing lines taken in turn, a different set each day (the evenings' endings). */
      closers?: StoryLine[][];
      /** Failing it, you may push again while the coal lasts; when it's gone, these steps, and all the rest are off. */
      sweptBack?: Step[];
      /** Calling it off instead: these steps, and all the rest are off. */
      turnedBack?: Step[];
      /** Failing it, on from the step with this label: what's between is passed by (a tournament lost is a day done). */
      onFail?: string;
      /** Which try this is (the first, or again after a night stuck). */
      attempt?: number;
      /** What a reply in the talk can decide, by its effect (see `choose`): the encounter ends there. */
      choices?: Record<string, Choice>;
    };

/** The day's three slots: everything at a landing fills one. */
export type Slot = 'morning' | 'afternoon' | 'evening';

/** Something to do at a hub. */
export interface HubOption {
  id: string;
  /** When it can be done (the default: any time). */
  times?: Slot[];
  /** It opens a list of its own, free to look at. */
  menu?: HubOption[];
  /** What it costs to do at all. */
  cost?: number;
  /** Only with this flag up. */
  flag?: string;
  /** Not with any of these flags up. */
  notFlag?: string[];
  /** Only from this day of the voyage, and until this one. */
  from?: number;
  to?: number;
  /** Only with this much coal aboard. */
  coal?: number;
  steps: Step[];
}

export interface Hub {
  options: HubOption[];
  /** Someone aboard says what's on their mind. */
  advice: (state: JourneyState) => StoryLine | null;
}

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
  hubs?: Record<string, Hub>;
  /** What's said after a failed push, by how much of the stage it took (0 to 1). */
  pushReading?: (taken: number) => StoryLine;
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
  /** Seats gone from a tournament table, hand by hand (the last of them are the runners-up). */
  busted: string[][];
  /** You came to it nearly broke, and Willie found an odd job (this much) to stake you. */
  oddJob?: number;
  /** Troubles fixed along the way (snag indices): bestowed on whoever fixes them. */
  fixed: number[];
}

export interface JourneyState {
  /** The voyage's own seed: what's said can be drawn from it without repeating. */
  seed: number;
  rngState: number;
  /** The slot of the day, for a hub's options. */
  time: Slot;
  /** A hub's option with a list of its own, open. */
  submenu: string | null;
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
  /** Who stands where. */
  stations: Stations;
  /** Hands hired by the day: days left, and whether to sign them on again. */
  hires: { id: string; days: number; rehire: boolean }[];
  /** The boat's own features. */
  parts: BoatParts;
  /** Upgrades bought (items kept). */
  upgrades: string[];
  comfort: number;
  /** Snags carried: cargo, duties, troubles. */
  snags: JokerCard[];
  flags: string[];
  encounter: Encounter | null;
  /** Today's draw: who's at your table, and who came through the other tables. */
  mates: { id: string; ai: AiId }[];
  finalists: { id: string; ai: AiId }[];
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
    seed: seed >>> 0,
    time: 'morning',
    submenu: null,
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
    stations: Object.fromEntries(STARTING_CREW.map((id) => [id, CREW[id].home])),
    hires: [],
    parts: { ...BOAT.parts },
    snags: [],
    flags: [],
    encounter: null,
    mates: [],
    finalists: [],
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
  return shipStrength(state.crew, state.stations, state.parts) + state.comfort + state.tomorrow;
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
    tickHires(state);
    state.strength = morningStrength(state);
    state.tomorrow = 0;
    state.time = 'morning';
    state.mornings++;
    // The first morning's wages were settled by the captain before you.
    if (state.mornings > 1) state.purse = Math.max(0, state.purse - state.crew.reduce((a, id) => a + (CREW[id]?.temporary ? 0 : (CREW[id]?.wage ?? 0)), 0));
    return advance(state, story);
  }
  if (step.type === 'scene') {
    if (state.pending.length) state.pending.shift();
    else state.step++;
    state.pending = [...clone(step.steps), ...state.pending];
    return arrive(state, story);
  }
  if (step.type === 'nightfall') {
    state.time = 'evening';
    return advance(state, story);
  }
  if (step.type === 'slot') {
    state.time = state.time === 'morning' ? 'afternoon' : 'evening';
    return advance(state, story);
  }
  if (step.type === 'leave') {
    state.pending = [];
    return advance(state, story);
  }
  if (step.type === 'draw') {
    drawTables(state, step);
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
  if (effects.coal) state.coal = Math.max(0, Math.min(BOAT.bunker, state.coal + effects.coal));
  if (effects.purse) state.purse = Math.max(0, state.purse + effects.purse);
  if (effects.flag && !state.flags.includes(effects.flag)) state.flags.push(effects.flag);
  if (effects.tomorrow) state.tomorrow += effects.tomorrow;
  if (effects.clear) state.flags = state.flags.filter((f) => f !== effects.clear);
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

/** The hub we're at, and whether each of its options can be taken now: the time's right, and you can pay for it (`shown`: it's on the list at all). */
export function hubOptions(state: JourneyState, story: StoryDef): { option: HubOption; open: boolean }[] {
  const step = currentStep(state, story);
  if (step?.type !== 'hub') return [];
  const top = story.hubs?.[step.hub].options ?? [];
  const list = (state.submenu && top.find((o) => o.id === state.submenu)?.menu) || top;
  return list
    .filter(
      (option) =>
        (!option.times || option.times.includes(state.time)) &&
        (!option.flag || state.flags.includes(option.flag)) &&
        !option.notFlag?.some((f) => state.flags.includes(f)) &&
        state.mornings >= (option.from ?? 0) &&
        state.mornings <= (option.to ?? Infinity),
    )
    .map((option) => ({ option, open: state.purse >= (option.cost ?? 0) && state.coal >= (option.coal ?? 0) }));
}

/** In development: straight to these steps, whatever's going on (the scene list on the title). */
export function jumpTo(prev: JourneyState, story: StoryDef, steps: Step[]): JourneyState {
  const state = clone(prev);
  state.encounter = null;
  state.pending = clone(steps);
  return arrive(state, story);
}

/** One of the hub's options taken: its steps, then back here. */
export function goTo(prev: JourneyState, story: StoryDef, id: string): JourneyState {
  const choice = hubOptions(prev, story).find((o) => o.option.id === id);
  if (!choice?.open) throw new Error(`Can't go to ${id}`);
  const state = clone(prev);
  if (choice.option.menu) {
    state.submenu = id;
    return state;
  }
  state.submenu = null;
  state.purse -= choice.option.cost ?? 0;
  state.pending = clone(choice.option.steps);
  return arrive(state, story);
}

/** Out of a hub's list, back to the main one. */
export function closeMenu(prev: JourneyState): JourneyState {
  return { ...prev, submenu: null };
}

/** A new day: a hire's time runs down; at the end of it they're signed on again if you said so and can pay, or they're gone. */
function tickHires(state: JourneyState) {
  for (const hire of state.hires) hire.days--;
  for (const hire of state.hires.filter((h) => h.days <= 0)) {
    const wage = CREW[hire.id]?.wage ?? 0;
    if (hire.rehire && state.purse >= wage) {
      state.purse -= wage;
      hire.days = HIRE_DAYS;
    } else state.crew = state.crew.filter((id) => id !== hire.id);
  }
  state.hires = state.hires.filter((h) => h.days > 0);
}

/** Send a hand to another station (it shows in tomorrow's strength). */
export function setStation(prev: JourneyState, id: string, station: Station): JourneyState {
  return { ...prev, stations: { ...prev.stations, [id]: station } };
}

/** Sign a hire on again when their time is up, or don't. */
export function setRehire(prev: JourneyState, id: string, rehire: boolean): JourneyState {
  return { ...prev, hires: prev.hires.map((h) => (h.id === id ? { ...h, rehire } : h)) };
}

/** Who sits down at the deck game: a hire takes Lars's chair, a second Willie's. */
export function deckCrew(state: JourneyState): string[] {
  const out = GIVE_UP_CHAIR.slice(0, state.hires.length);
  return state.crew.filter((id) => !out.includes(id));
}

/** Can this be bought now (at this council, affordable, room for it, not already had)? */
export function canBuy(state: JourneyState, story: StoryDef, itemId: string): boolean {
  const step = currentStep(state, story);
  const item = ITEMS[itemId];
  if (step?.type !== 'council' || !item || !step.trader.includes(itemId) || state.purse < item.price) return false;
  if (item.once && state.upgrades.includes(itemId)) return false;
  if (item.effect.coal && (state.coal + item.effect.coal > BOAT.bunker || state.coal + item.effect.coal < 0)) return false;
  if (item.effect.hire && state.crew.includes(item.effect.hire)) return false;
  if (item.effect.needs && state.parts[item.effect.needs.name] < item.effect.needs.tier) return false;
  return true;
}

export function buy(prev: JourneyState, story: StoryDef, itemId: string): JourneyState {
  if (!canBuy(prev, story, itemId)) throw new Error(`Can't buy ${itemId}`);
  const state = clone(prev);
  const item = ITEMS[itemId];
  const e = item.effect;
  state.purse -= item.price;
  if (item.once) state.upgrades.push(itemId);
  if (e.coal) state.coal += e.coal;
  if (e.comfort) {
    state.comfort += e.comfort;
    state.strength += e.comfort;
  }
  if (e.tomorrow) state.tomorrow += e.tomorrow;
  // A spare replaces what's broken, if it is already.
  if (e.spare !== undefined) {
    const k = state.snags.findIndex((j) => j.index === e.spare);
    if (k >= 0) state.snags.splice(k, 1);
  }
  const before = shipStrength(state.crew, state.stations, state.parts);
  if (e.part) state.parts[e.part.name] = e.part.tier;
  if (e.hire) {
    state.crew.push(e.hire);
    state.stations[e.hire] = CREW[e.hire].home;
    state.hires.push({ id: e.hire, days: HIRE_DAYS, rehire: true });
  }
  state.strength += shipStrength(state.crew, state.stations, state.parts) - before;
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
/** What each of the crew brings to the deck game. */
const DECK_STACK = 12;

/** The least you bring to the deck game. */
export const DECK_GAME_LEAST = 3;

/** The other tables are played out unseen, for real: AIs against AIs, to the last one with money. */
function drawTables(state: JourneyState, step: Extract<Step, { type: 'draw' }>) {
  const rng = new Rng(state.rngState);
  const entrants = rng.shuffle(step.entrants);
  state.mates = entrants.slice(0, step.tableSize - 1);
  const rest = entrants.slice(step.tableSize - 1);
  state.finalists = Array.from({ length: step.finalists }, (_, k) => {
    const table = rest.slice(k * step.tableSize, (k + 1) * step.tableSize);
    let s = newSession(rng.int(2 ** 31), table.map((r) => ({ ...r, money: 5 })), STORY_CONFIG);
    for (let guard = 0; s.phase !== 'over' && guard < 400; guard++) s = s.phase === 'hand' ? playOn(s) : nextSessionHand(s);
    return table.find((r) => !s.seats.find((p) => p.id === r.id)?.out) ?? table[0];
  });
  const engaged = step.regular?.engaged && state.mornings === step.regular.until && state.flags.includes(step.regular.engaged);
  if (step.regular && state.mornings <= step.regular.until && !engaged) state.finalists[0] = { id: step.regular.id, ai: step.regular.ai };
  state.rngState = rng.state;
}

/** Never stuck for a stake: come to a table for money with next to none, and there's an odd job to be had. */
export const ODD_JOB = { below: 6, pays: 10 };

function seat(state: JourneyState, def: EncounterDef) {
  if (def.push) {
    state.coal = Math.max(0, state.coal - 1);
    state.strength = morningStrength(state);
  }
  const rng = new Rng(state.rngState);
  const oddJob = def.stake === 'purse' && !def.proxy && def.rules?.pot !== false && state.purse < (def.entry ?? ODD_JOB.below) ? ODD_JOB.pays : 0;
  state.purse += oddJob - (def.proxy ? 0 : (def.entry ?? 0));
  const seed = rng.int(2 ** 31);
  // At the deck game everyone finds a button or two, however hard the day.
  const money = def.entry ? def.entry : def.stake === 'purse' ? state.purse : def.rivals === 'crew' ? Math.max(state.strength, DECK_GAME_LEAST) : state.strength;
  const troubles = state.snags.filter((j) => snagDef(j.index).kind === 'trouble');
  // Against an obstacle your snags stay aside (it cares nothing for your duties), but the volunteers among them cover their hands.
  const obstacle = def.rivals !== 'crew' && def.rivals.some((r) => r.obstacle);
  const jokers = obstacle || def.proxy ? [] : def.rivals === 'crew' ? troubles : state.snags;
  const randomHand = 1 + rng.int(def.hands);
  const me = {
    id: PLAYER_ID,
    money,
    jokers,
    ...(obstacle ? { cover: coveredHands(state.snags, def.hands, randomHand) } : {}),
    ...(def.rivals === 'crew' ? { unhands: true } : {}),
  };
  const joined = (def.joined === 'mates' ? state.mates : def.joined === 'finalists' ? state.finalists : []).map((r) => ({ ...r, money: def.entry ?? 0 }));
  const guests = (def.guests ?? []).filter((g) => state.mornings >= (g.from ?? 0) && state.mornings <= (g.to ?? Infinity)).map((g) => g.rival);
  const rivals =
    def.rivals === 'crew'
      ? deckCrew(state).map((id) => ({ id, ai: CREW[id].ai, money: DECK_STACK, fixes: TROUBLES }))
      : def.rivals.map((r) => ({
          id: r.id,
          ai: r.ai,
          money: r.money,
          jokers: (r.jokers ?? []).filter((i) => !spared(state).includes(i)).map(jokerCard),
          ...(r.obstacle ? { obstacle: true } : {}),
          ...(r.steady ? { steady: true } : {}),
          ...(r.obliging ? { fixes: SNAGS.map((j) => j.index).filter((i) => !r.jokers?.includes(i)) } : {}),
        }));
  const session = newSession(seed, [me, ...rivals, ...guests, ...joined], { ...STORY_CONFIG, ...def.rules });
  state.rngState = rng.state;
  state.encounter = {
    def,
    session,
    lostAtShowdown: 0,
    folds: 0,
    outcome: null,
    fixed: [],
    busted: [],
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
  if (action?.type === 'ride') e.session = submit(e.session, me, action);
  else if (action) {
    let move: Action = action;
    if (e.def.proxy) {
      // Whoever's in your seat decides: you only said when.
      const rng = new Rng(state.rngState);
      move = chooseAction(e.def.proxy, viewFor(e.session.round!, me, e.session.config), e.session.config, rng);
      state.rngState = rng.state;
    }
    if (move.type === 'fold') e.folds++;
    e.session = submit(e.session, me, move);
  } else if (!waitingFor(e.session).length) e.session = playOn(e.session);
  return state;
}

/** Is the encounter waiting for your move? */
export function myMoveOwed(state: JourneyState): boolean {
  const enc = state.encounter;
  return !!enc && !enc.outcome && waitingFor(enc.session).includes(mySeatAt(enc));
}

/** The hand went to three of a kind or better. */
export function wonWithTrips(result: RoundResult): boolean {
  const top = result.winners.map((w) => result.hands[w]).find(Boolean);
  return !!top && CATEGORIES.indexOf(top.category) >= CATEGORIES.indexOf('threeOfAKind');
}

/** What the hand just played costs you at a showdown (folding doesn't count: see the foreman). */
export function lostAtThisShowdown(round: RoundState, seat: number): number {
  const res = round.result;
  if (!res || seat < 0 || res.byFolds || res.winners.includes(seat)) return 0;
  return round.bets[seat] + res.forfeit[seat] - res.share[seat];
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
  e.lostAtShowdown += lostAtThisShowdown(round, me);
  const goal = e.def.goal;
  const lastHand = s.hand >= e.def.hands;
  const over = s.phase === 'over';
  let outcome: Encounter['outcome'] = null;
  const gone = s.seats.filter((p) => p.out && !e.busted.flat().includes(p.id)).map((p) => p.id);
  if (gone.length) e.busted.push(gone);
  if (goal.type === 'lastStanding') {
    const left = s.seats.find((p) => !p.out);
    if (over) outcome = left?.id === PLAYER_ID || (left?.id === goal.host && e.busted.at(-1)?.includes(PLAYER_ID)) ? 'solved' : 'failed';
    // Out of a table with no host, there's nothing left for you to watch.
    else if (mine.out && !goal.host) outcome = 'failed';
  } else if (goal.type === 'winPot') outcome = won ? 'solved' : mine.out ? 'failed' : null;
  else if (goal.type === 'clear') {
    const pile = s.seats.find((p) => p.obstacle)!;
    outcome = pile.money <= 0 ? 'solved' : mine.out || lastHand ? 'failed' : null;
  } else if (goal.type === 'trips') {
    outcome = wonWithTrips(res) || lastHand || over ? 'solved' : null;
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
  if (e.def.proxy) {
    e.outcome = outcome;
    return state;
  }
  const marked = e.def.marks && e.session.seats.find((p) => p.id === e.def.marks!.rival);
  if (marked && mine.money > marked.money && !state.flags.includes(e.def.marks!.flag)) state.flags.push(e.def.marks!.flag);
  if (e.def.entry) state.purse += mine.money;
  else if (e.def.stake === 'purse') state.purse = mine.money;
  else state.strength = mine.money;
  const obstacle = e.def.rivals !== 'crew' && e.def.rivals.some((r) => r.obstacle);
  if (obstacle) state.snags = [...state.snags, ...mine.jokers];
  else if (e.def.rivals === 'crew') state.snags = [...state.snags.filter((j) => snagDef(j.index).kind !== 'trouble'), ...mine.jokers];
  else state.snags = mine.jokers;
  e.outcome = outcome;
  return state;
}

/** What's read after an encounter (nothing: straight on). */
export function closingLines(state: JourneyState, step: Extract<Step, { type: 'encounter' }>, outcome: 'solved' | 'failed'): StoryLine[] {
  if (outcome === 'failed') return step.failed ?? step.solved;
  return step.closers ? step.closers[state.mornings % step.closers.length] : step.solved;
}

/** Go again at the stage. */
export function pushAgain(prev: JourneyState, story: StoryDef): JourneyState {
  const step = currentStep(prev, story);
  if (step?.type !== 'fork') throw new Error('Nothing to push at');
  const state = clone(prev);
  state.pending[0] = step.stage;
  return arrive(state, story);
}

/** Call it off, with the coal that's left. */
export function turnBack(prev: JourneyState, story: StoryDef): JourneyState {
  const step = currentStep(prev, story);
  if (step?.type !== 'fork') throw new Error('Nothing to turn back from');
  const state = clone(prev);
  state.pending = clone(step.turnedBack);
  return arrive(state, story);
}

/** A reply at the table decided it: the encounter ends here, and on. */
export function choose(prev: JourneyState, story: StoryDef, key: string): JourneyState {
  const step = currentStep(prev, story);
  const choice = step?.type === 'encounter' ? step.choices?.[key] : undefined;
  if (!choice) throw new Error(`No such choice: ${key}`);
  const state = clone(prev);
  state.encounter = null;
  applyEffects(state, choice.effects);
  if (choice.end) {
    state.pending = [];
    return arrive(state, story);
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
  state.flags = state.flags.includes(`met:${enc.def.id}`) ? state.flags : [...state.flags, `met:${enc.def.id}`];
  const attempt = step.attempt ?? 1;
  if (enc.outcome === 'failed' && step.sweptBack) {
    if (state.coal <= 0) {
      state.pending = clone(step.sweptBack);
      return arrive(state, story);
    }
    const rival = step.encounter.rivals === 'crew' ? null : step.encounter.rivals.find((r) => r.obstacle);
    const left = enc.session.seats.find((p) => p.id === rival?.id)?.money ?? 0;
    const taken = rival ? 1 - left / rival.money : 0;
    const fork: Step = {
      type: 'fork',
      lines: story.pushReading ? [story.pushReading(taken)] : [],
      stage: { ...step, attempt: attempt + 1 },
      turnedBack: step.turnedBack ?? step.sweptBack,
    };
    state.pending = [fork, ...state.pending.slice(1)];
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
  else if (step.onFail) {
    const on = state.pending.findIndex((p) => p.type === 'nightfall' && p.label === step.onFail);
    if (on > 1) state.pending.splice(1, on - 1);
  }
  return advance(state, story);
}
