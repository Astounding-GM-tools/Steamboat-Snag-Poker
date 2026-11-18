/**
 * The playtest bot: plays the voyage (chapter one, Muscatine to the top of the rapids) as a captain
 * of a given temper would, and records how it went. Headless, but faithful to what the UI adds on top
 * of the pure voyage (src/ui/Journey.svelte): the river's event stream at `legSeconds` 420, with the
 * open-water debris it puts in her way (a stretch's set pieces first), the islands' busy stretches,
 * her gathering way, and her creeping on during a hand. (Until 2026-11-17 the river kept quiet while
 * Willie typed: `typing: true` plays it that way.)
 *
 * What the UI adds that the bot can only approximate is marked APPROX: the seconds a hand takes a
 * person, how long the departure from Muscatine plays, Willie's typing speed (the average of
 * TypedLine's random delays, drawn here from the voyage's own Rng).
 *
 * Pure, like the voyage: the same seed and persona, the same run. The runner is
 * scripts/playtest.sim.ts; the report docs/playtest-2026-11-17.md.
 */
import { chooseAction, viewFor, type SeatView } from '../../engine/ai';
import type { AiId } from '../../engine/characters';
import type { RulesConfig } from '../../engine/config';
import { Rng } from '../../engine/rng';
import { legalActions, type Action } from '../../engine/round';
import { RIVER, RIVER_START } from '../river';
import {
  ITEMS,
  buy,
  canBuy,
  castOff,
  choose,
  closeMenu,
  currentStep,
  driftOnRiver,
  goTo,
  handDone,
  hubOptions,
  leaveEncounter,
  meetDebris,
  meetOnRiver,
  morningStrength,
  setPieceDue,
  laneCrateFlag,
  laneCratesNow,
  myMoveOwed,
  mySeatAt,
  newJourney,
  playEncounter,
  proceed,
  pushAgain,
  DOCK_FEE,
  snagDef,
  turnBack,
  writeLog,
  type JourneyState,
  type Step,
  type StoryDef,
} from '../mechanics';
import { nextOnRiver, creepRoom, type Fork } from '../mechanics/stream';
import { DEBRIS_FLOOR, crateAnteFor, debrisAt, debrisStep, type Debris } from '../characters/debris';
import { FLAG } from '../flags';
import { CLIMB_COAL, GAYLORD_FEE, GAYLORD_FIRST_HIRE, GAYLORD_LAST_HIRE, MORNING_ENTRY, READY_STRENGTH } from '../numbers';
import { CHOICE_RECORDS, DOCK_FEE_FLAG, LEAVING_MUSCATINE, UNDER_WAY_AGAIN, ENCOUNTER_RECORDS, firstCrateRecord, islandRecord, leftMuscatine, castOffRecord } from '../log';
import { DOCK_FEE_AMOUNT } from '../numbers';
import { BOAT, shipStrength } from '../mechanics/boat';
import { crept, REAL_PACE_PX } from '../../ui/map/creep';

// --- The river, as the UI sees it ---------------------------------------------------------------

/** Seconds for a whole leg (src/ui/map/tuning.svelte.ts, `voyage.legSeconds`). */
export const LEG_SECONDS = 420;
/** Chapter one's leg (public/maptiles/mrc-1894/legs/chapter-1-upbound.json): its islands, and its length in map px. */
export const CHAPTER_1 = 'chapter-1-upbound';
/** (`main`: the main channel's side of the river, `left` the Illinois bank: upbound, `left` is starboard.) */
export const CHAPTER_1_ISLANDS: (Fork & { name: string | null; main: 'left' | 'right' })[] = [
  { from: 0.3399, to: 0.3602, name: null, main: 'right' },
  { from: 0.3708, to: 0.3949, name: null, main: 'right' },
  { from: 0.4906, to: 0.519, name: 'Horse Island', main: 'left' },
  { from: 0.686, to: 0.6931, name: null, main: 'right' },
  { from: 0.8656, to: 0.8838, name: 'Spencer Island', main: 'left' },
  { from: 0.9631, to: 0.9753, name: null, main: 'right' },
  { from: 0.9771, to: 0.9856, name: null, main: 'right' },
];
/** The leg's channel, in map px (measured from the sidecar). */
export const CHAPTER_1_PX = 41125;
/** Journey.svelte's own: gathering way, and the quiet before Willie writes her under way. */
const GATHER_WAY_S = 10;
const GATHER_WAY_LANDING_S = 36;
const CAST_OFF_QUIET_S = 8;
const AFTER_DEPARTURE_S = 3;
const AFTER_TYPING_S = 12;
const CREEP_TAIL = 90;
/** APPROX: how long the departure from Muscatine plays (backing out, swinging round), seconds. */
const DEPARTURE_S = 30;
/** The stream is asked twice a second; the boat moves in steps of this many seconds. */
const DT = 0.1;

/**
 * APPROX: seconds Willie takes to type an entry in the header (src/ui/TypedLine.svelte): a pause before
 * it, then each line typed at about 0.2 s a key (85 to 195 ms, more after a space or a stop, a hunt now
 * and then), left to be read (5 s and 0.11 s a character), rolled up.
 */
export function typingSeconds(text: string, rng?: Rng): number {
  const lines = text.split('\n').filter((l) => l.trim());
  let s = 4;
  for (const l of lines) {
    let keys = 0;
    for (const c of l) {
      const base = 0.085 + (rng ? rng.next() : 0.5) * 0.11;
      keys += c === ' ' ? base + 0.06 : /[.,:;!?]/.test(c) ? base + 0.26 + 0.15 : base + 0.06 * 0.625;
    }
    s += 0.15 + keys + 5 + l.length * 0.11 + 0.45;
  }
  return s;
}

// --- Personas -----------------------------------------------------------------------------------

export type PersonaId = 'careful' | 'loose' | 'novice' | 'reckless' | 'savvy';

export interface Persona {
  id: PersonaId;
  /** How they play a hand. */
  table: AiId;
  /** Stand pat on every draw (the novice): the style only makes the hand at the River. */
  standPat?: boolean;
  /** At the harbour master's: pay the fee outright, or play for it. */
  dockFee: 'pay' | 'snag';
  /** At the coal depot: play to win, or (having worked it out, after a first visit) throw the hands. */
  depot: 'play' | 'learn';
  /** Strength they want the crew to make before going for the rapids. */
  ready: number;
  /** Buy the boiler overhaul, hire a fireman and buy food the day before. */
  upgrades: boolean;
  /** Evenings at the Bettendorf saloon when the purse is at least this (Infinity: never). */
  saloonAt: number;
  /** Gaylord at breakfast: hire him, take his loan, or neither. */
  gaylord: 'hire' | 'loan' | 'pass';
  /** Runs coal: the depot's for a dozen dollars lost, sold at the Mercantile at $8 a load (while saving up). */
  sellsCoal?: boolean;
  /** A hand's seconds on the river (APPROX: a person reading the talk and choosing). */
  handSeconds: (rng: Rng) => number;
}

const normalHands = (rng: Rng) => (rng.int(12) === 0 ? 90 + rng.int(150) : 25 + rng.int(35));
const quickHands = (rng: Rng) => 12 + rng.int(20);

export const PERSONAS: Record<PersonaId, Persona> = {
  careful: { id: 'careful', table: 'careful', dockFee: 'snag', depot: 'learn', ready: READY_STRENGTH, upgrades: true, saloonAt: 30, gaylord: 'pass', handSeconds: normalHands },
  loose: { id: 'loose', table: 'loose', dockFee: 'snag', depot: 'learn', ready: 26, upgrades: true, saloonAt: 15, gaylord: 'hire', handSeconds: quickHands },
  novice: { id: 'novice', table: 'stubborn', standPat: true, dockFee: 'pay', depot: 'play', ready: 0, upgrades: true, saloonAt: Infinity, gaylord: 'pass', handSeconds: normalHands },
  savvy: { id: 'savvy', table: 'careful', dockFee: 'snag', depot: 'learn', ready: READY_STRENGTH, upgrades: true, saloonAt: Infinity, gaylord: 'pass', sellsCoal: true, handSeconds: normalHands },
  reckless: { id: 'reckless', table: 'swashbuckler', dockFee: 'snag', depot: 'play', ready: 0, upgrades: false, saloonAt: 0, gaylord: 'loan', handSeconds: quickHands },
};

// --- The record ---------------------------------------------------------------------------------

export interface DebrisMet {
  kind: 'crate' | 'sawyer' | 'deadhead' | 'driftPile';
  won: boolean;
  /** Where on the leg (t). */
  at: number;
  /** Before the Sandbar, or after. */
  afterSandbar: boolean;
  strengthBefore: number;
  strengthAfter: number;
  /** The trouble it left her with. */
  struck?: number;
  salvage?: number;
}

export interface RunRecord {
  seed: number;
  persona: PersonaId;
  /** Played to the slice's end; or stopped (too many days, too many moves), or an error thrown. */
  end: 'done' | 'timeout' | 'error';
  error?: string;
  /** Where it stopped, if it didn't finish. */
  stoppedAt?: string;
  /** Mornings (days of the voyage) when done. */
  days: number;
  /** Nights stuck on The Sandbar, and on which try it was cleared (1: the first day). */
  sandbarNights: number;
  sandbarCleared: number | null;
  /** Each morning: purse, strength, coal, salvage, as dawn made them. */
  dawns: { day: number; purse: number; strength: number; coal: number; salvage: number; snags: number }[];
  /** Arriving at the Tri-Cities. */
  atTriCities?: { purse: number; strength: number; coal: number; salvage: number; troubles: number; day: number };
  debris: DebrisMet[];
  /** Debris called while the crew had no strength (the UI then puts nothing in the water). */
  debrisSkippedNoStrength: number;
  /** Crates played at salvage camp, below the rapids. */
  campCrates: number;
  /** Crates met in a passage round an island. */
  laneCrates: number;
  /** The stream's main event: where it came (t), and whether the stretch ended before it (an anomaly). */
  sandbarAt?: number;
  /** Troubles taken on (by what gave them), and fixed (at the deck game). */
  troublesTaken: { snag: number; from: string }[];
  troublesFixed: number;
  /** Salvage fished out (dollars), and sold. */
  salvageEarned: number;
  salvageSold: number;
  /** What was bought at the councils and the mercantile, by item. */
  bought: Record<string, number>;
  spent: number;
  /** Hub options taken, by id. */
  hub: Record<string, number>;
  /** Each encounter (by id): played, solved, failed. */
  encounters: Record<string, { played: number; solved: number; failed: number }>;
  /** What each game at the depot cost the purse (its goal: lose 12 to 25 at showdowns). */
  depotCost: number[];
  /** What each table played for the purse did to it, by encounter (dollars won, or lost: negative). */
  purseDelta: Record<string, number[]>;
  /** The morning each thing first happened: the boiler bought, the first day at the Games, the first noon won, the climb done. */
  milestones: { boiler?: number; firstGames?: number; firstNoonWin?: number; ready?: number };
  /** Odd jobs (a stake found when nearly broke). */
  oddJobs: number;
  lowestPurse: number;
  /** The Games: days queued, mornings won, noons won; the climb: pushes, and how each stage went. */
  tournaments: number;
  pushes: { stage: string; strength: number; taken: number; cleared: boolean }[];
  climbs: number;
  turnedBack: number;
  /** Anything that looked wrong along the way (impossible states). */
  oddities: string[];
}

// --- The driver ---------------------------------------------------------------------------------

export interface PlayOptions {
  /** Give up after this many mornings (a softlock, or a captain who never gets ready). */
  maxDays?: number;
  /** The old rule: the river kept quiet while Willie typed, and 12 s after (the UI until 2026-11-17; off now). */
  typing?: boolean;
  /** Seconds a whole leg takes. */
  legSeconds?: number;
  /** Changes to try (re-simulated tuning): the story to play. */
  story?: StoryDef;
  start?: { purse: number; coal: number };
  /** Tuning to try: no debris called with the crew's strength at or below this (the game's: DEBRIS_FLOOR). */
  debrisFloor?: number;
  /** Told what the river does, as it does it (debugging the stream). */
  trace?: (line: string) => void;
}

/** The bot's own clock and Willie's typewriter: entries typed one after another, the river quiet meanwhile. */
class Typewriter {
  busyUntil = -Infinity;
  constructor(private rng: Rng, private on: boolean) {}
  write(text: string, at: number) {
    if (!this.on) return;
    const start = Math.max(at, this.busyUntil);
    this.busyUntil = start + typingSeconds(text, this.rng);
  }
  quiet(now: number) {
    return this.on && now < this.busyUntil + AFTER_TYPING_S;
  }
}

export function playVoyage(seed: number, persona: Persona, opts: PlayOptions = {}): RunRecord {
  const story = opts.story ?? RIVER;
  const maxDays = opts.maxDays ?? 40;
  const legSeconds = opts.legSeconds ?? LEG_SECONDS;
  const rng = new Rng(seed * 7919 + 17);
  const timeRng = new Rng(seed * 104729 + 3);
  const pen = new Typewriter(new Rng(seed + 99), opts.typing ?? false);
  let clock = 0;
  const floor = opts.debrisFloor ?? DEBRIS_FLOOR;
  const ante = (leg: string) => crateAnteFor(s, leg);
  const rec: RunRecord = {
    seed,
    persona: persona.id,
    end: 'done',
    days: 0,
    sandbarNights: 0,
    sandbarCleared: null,
    dawns: [],
    debris: [],
    debrisSkippedNoStrength: 0,
    laneCrates: 0,
    campCrates: 0,
    troublesTaken: [],
    troublesFixed: 0,
    salvageEarned: 0,
    salvageSold: 0,
    bought: {},
    spent: 0,
    hub: {},
    encounters: {},
    depotCost: [],
    purseDelta: {},
    milestones: {},
    oddJobs: 0,
    lowestPurse: Infinity,
    tournaments: 0,
    pushes: [],
    climbs: 0,
    turnedBack: 0,
    oddities: [],
  };
  let s = newJourney(seed, story, opts.start ?? RIVER_START);
  let lastMornings = s.mornings;
  let departed = false;
  let depotVisits = 0;
  /** The debris being played, and the seconds of the hand under way on the river (for her creep). */
  let debrisNow: { debris: Debris; at: number; strength: number } | null = null;
  let creep: { seconds: number } | null = null;
  let purseAtSeat = 0;
  let troublesAtSeat: number[] = [];

  const dockFeeEntry = () => {
    const text = leftMuscatine(s.flags, s.purse, DOCK_FEE_AMOUNT);
    if (s.place === 'muscatine' && !s.log?.some((e) => e.text === text)) log(text);
  };
  const log = (text: string) => {
    s = writeLog(s, text);
    pen.write(text, clock);
  };
  const dawned = () => {
    if (s.mornings === lastMornings) return;
    lastMornings = s.mornings;
    rec.dawns.push({ day: s.mornings, purse: s.purse, strength: s.strength, coal: s.coal, salvage: s.salvage ?? 0, snags: s.snags.length });
  };
  const troubles = (st: JourneyState) => st.snags.filter((j) => snagDef(j.index).kind === 'trouble').map((j) => j.index);
  const tally = (id: string, k: 'played' | 'solved' | 'failed') => ((rec.encounters[id] ??= { played: 0, solved: 0, failed: 0 })[k] += 1);

  /** The captain's move at a table. */
  function move(view: SeatView, config: RulesConfig, encId: string): Action {
    const throwIt = encId === 'depot' && persona.depot === 'learn' && depotVisits > 1;
    if (throwIt) {
      // Worked out what the foreman wants: stand pat, never fold, play nothing of your own.
      if (view.composing) return { type: 'compose', cardIds: [], jokers: 0 };
      return { type: 'draw', cardIds: [] };
    }
    const action = chooseAction(persona.table, view, config, rng);
    if (persona.standPat && action.type === 'draw') return { type: 'draw', cardIds: [] };
    return action;
  }

  /** A stretch of river, steamed as the UI steams it: the stream, the islands, the debris. */
  function steam(step: Extract<Step, { type: 'steam' }>) {
    const from = s.river?.t ?? 0;
    const to = step.to;
    if (step.leg !== CHAPTER_1 || to < from) {
      // Not chapter one's leg, or downbound: no debris there yet (the UI's stream reckons upbound).
      s = proceed(s, story);
      return;
    }
    if (step.landing && !departed) {
      // The departure plays (the effect waits for it): Willie writes as she backs out, and as she turns ahead.
      const text = LEAVING_MUSCATINE.backingOut;
      s = writeLog(s, text);
      pen.write(text, clock);
      clock += DEPARTURE_S;
      log(LEAVING_MUSCATINE.turning);
      departed = true;
    }
    opts.trace?.(`steam ${from.toFixed(3)} to ${to}, typing till +${(pen.busyUntil - clock).toFixed(0)}s`);
    // Leaving Muscatine, nothing yet (the dock fee comes after the river's second piece); elsewhere, a line.
    const first = from === 0 && s.place === 'muscatine';
    const line = from === 0 ? castOffRecord(s.place, 'upbound') : UNDER_WAY_AGAIN;
    let written = !!step.quiet || first;
    const writeAt = step.landing ? AFTER_DEPARTURE_S : CAST_OFF_QUIET_S;
    const at = (share: number) => from + share * (to - from);
    const main = step.main ? { window: [at(step.main.window[0]), at(step.main.window[1])] as [number, number] } : undefined;
    const pace = 1 / legSeconds;
    const least = Math.max(0.02, (REAL_PACE_PX * legSeconds) / CHAPTER_1_PX);
    let t = from, elapsed = 0, asked = -Infinity;
    let adrift: { t: number; debris: Debris } | null = null;
    const passed = new Set(s.passed ?? []);
    for (let guard = 0; guard < 1e6; guard++) {
      elapsed += DT;
      clock += DT;
      if (!written && elapsed >= writeAt) {
        written = true;
        log(line);
      }
      const way = Math.min(1, elapsed / (step.landing ? GATHER_WAY_LANDING_S : GATHER_WAY_S));
      const gathered = way * way * (3 - 2 * way);
      t += Math.min(to - t, DT * pace * Math.max(least, gathered));
      // Round an island: Willie logs the way she went (the main passage: the bot never steers).
      for (const isl of CHAPTER_1_ISLANDS) {
        const key = `${CHAPTER_1}:${isl.from}`;
        if (isl.to > from && isl.to <= to && !passed.has(key) && t >= isl.to) {
          passed.add(key);
          s = { ...s, passed: [...(s.passed ?? []), key] };
          log(islandRecord(isl.name, 'port'));
        }
      }
      // A crate in a passage round an island (the stretch's `laneCrates`): met if she's going that way.
      // (The bot takes the main channel; a savvy captain steers for the crate.)
      const side = laneCratesNow(step);
      if (side && s.strength > floor) {
        for (const isl of CHAPTER_1_ISLANDS) {
          const key = `${CHAPTER_1}:${isl.from}`;
          const mid = (isl.from + isl.to) / 2;
          if (isl.to <= from || isl.to > to || passed.has(key) || s.flags.includes(laneCrateFlag(key)) || t < mid || t >= isl.to) continue;
          const crateSide = side === 'starboard' ? 'left' : 'right';
          if (crateSide !== isl.main && !persona.sellsCoal) continue;
          debrisNow = { debris: { kind: 'crate' }, at: t, strength: s.strength };
          rec.laneCrates++;
          s = meetDebris({ ...s, flags: [...s.flags, laneCrateFlag(key)] }, story, t, debrisStep({ kind: 'crate' }, ante(step.leg)), false);
          return;
        }
      }
      if (adrift && t >= adrift.t) {
        const met = adrift;
        debrisNow = { debris: met.debris, at: t, strength: s.strength };
        s = meetDebris(s, story, t, debrisStep(met.debris, ante(step.leg)), met.debris.kind === 'crate');
        return;
      }
      if (elapsed - asked >= 0.5) {
        asked = elapsed;
        const call = nextOnRiver({
          t,
          to,
          pace,
          forks: CHAPTER_1_ISLANDS.filter((i) => i.to > t && i.from < to),
          ...(main ? { main } : {}),
          sinceFill: elapsed,
        });
        if (call.kind === 'main') {
          rec.sandbarAt = t;
          dockFeeEntry();
          s = meetOnRiver(s, story, t);
          return;
        }
        if (call.kind !== 'river') opts.trace?.(`t ${t.toFixed(3)} +${elapsed.toFixed(0)}s: ${call.kind}${pen.quiet(clock) ? ' (quiet: Willie typing)' : ''}${adrift ? ' (debris already ahead)' : ''}`);
        if (call.kind === 'debris' && !pen.quiet(clock) && !adrift) {
          // A set piece first, if the stretch owes one; then the river's coin flip.
          if (s.strength > floor) adrift = { t: call.at, debris: setPieceDue(step) === 'crate' ? { kind: 'crate' } : debrisAt(s.seed, `${step.leg}:${call.at.toFixed(4)}`) };
          else rec.debrisSkippedNoStrength++;
        }
      }
      if (t >= to) {
        if (step.main) rec.oddities.push(`seed ${seed}: the stretch ended before its main event`);
        s = proceed(s, story);
        return;
      }
    }
    throw new Error('steamed for ever');
  }

  /** What to do at the Tri-Cities, by the slot. */
  function hub() {
    const opts = hubOptions(s, story);
    const open = (id: string) => opts.some((o) => o.option.id === id && o.open);
    const go = (id: string) => {
      rec.hub[id] = (rec.hub[id] ?? 0) + 1;
      if (id === 'depot') depotVisits++;
      if (id === 'tournament' || id === 'seat') {
        rec.tournaments++;
        rec.milestones.firstGames ??= s.mornings;
      }
      s = goTo(s, story, id);
    };
    if (s.submenu === 'jobs') {
      // Cattle or timber when Willie's found it; then salvage camping (no coal) or the mail run.
      const camp = s.strength > DEBRIS_FLOOR && (persona.upgrades || s.coal < 1);
      const job = ['job:cattle', 'job:timber', ...(camp ? ['job:salvage', 'job:mail'] : ['job:mail', 'job:salvage'])].find(open);
      if (job) return go(job);
      s = closeMenu(s);
      return hub();
    }
    const strength = morningStrength(s);
    const troubled = troubles(s).length > 0;
    if (s.time === 'evening') {
      if (!s.flags.includes(FLAG.heardOfPilot) || troubled) return go('anchor');
      return go(s.purse >= persona.saloonAt && open('bettendorf') ? 'bettendorf' : 'anchor');
    }
    const ready = strength >= persona.ready;
    // What she'd make with what this captain buys the day before (a fireman, food): worth filling the bunker for.
    const fireman = persona.upgrades && s.upgrades.includes('boilerOverhaul') && !s.crew.includes('fireman');
    const could = shipStrength([...s.crew, ...(fireman ? ['fireman'] : [])], { ...s.stations, fireman: 'furnace' }, s.parts) + s.comfort + (persona.upgrades ? 4 : 0);
    // Enough to lose a dozen at the depot and still shop for tomorrow and pay the entry.
    const budget = (persona.depot === 'learn' ? 12 : 0) + (persona.upgrades ? 3 + ITEMS.fireman.price + ITEMS.food.price : 0) + MORNING_ENTRY;
    const nearly = ready || (persona.upgrades && s.upgrades.includes('boilerOverhaul') && could >= persona.ready);
    if (s.time === 'morning') {
      if (open('seat')) return go('seat');
      if (open('tournament') && ready) return go('tournament');
      // Gaylord's at breakfast: the hire or the loan, if that's this captain's way.
      const canHire = s.mornings >= GAYLORD_FIRST_HIRE && s.mornings <= GAYLORD_LAST_HIRE && s.flags.includes(FLAG.heardOfPilot) && s.purse >= GAYLORD_FEE + 4;
      const canLoan = s.flags.includes(FLAG.beatGaylord);
      const want = !s.flags.includes(FLAG.owesGaylord) && !s.flags.includes(FLAG.gaylordsClient) && ((persona.gaylord === 'hire' && canHire) || (persona.gaylord === 'loan' && canLoan));
      if (want && open('breakfast')) return go('breakfast');
    }
    // Daytime: coal first (the climb wants a full bunker), then the boat, then money.
    // (A full bunker only when the climb is near: the depot's coal costs a dozen dollars lost at its table.)
    if ((s.coal === 0 || (nearly && s.time === 'morning' && s.coal < CLIMB_COAL && s.purse >= budget)) && open('depot')) return go('depot');
    if (persona.upgrades && open('mercantile') && wantsMercantile()) return go('mercantile');
    // Running coal while saving up: the depot's, sold at the Mercantile.
    if (persona.sellsCoal && saving() && s.coal >= 3 && open('mercantile')) return go('mercantile');
    if ((s.salvage ?? 0) >= 4 && open('mercantile')) return go('mercantile');
    // A job, if it doesn't leave her short of coal for the climb (the depot fills her up again).
    if (open('jobs')) {
      go('jobs');
      return;
    }
    if (open('depot')) return go('depot');
    if (open('mercantile')) return go('mercantile');
    return go(opts.find((o) => o.open && !o.option.menu)!.option.id);
  }

  /** Still saving: no boiler yet, or not the price of the day before the climb (fireman, food, the door, the entry). */
  function saving(): boolean {
    return !s.upgrades.includes('boilerOverhaul') || s.purse < 3 + ITEMS.fireman.price + ITEMS.food.price + MORNING_ENTRY + 12;
  }

  /** The careful captain's shopping list: the boiler, then (ready for tomorrow) a fireman and food. */
  function wantsMercantile(): boolean {
    const boiler = s.upgrades.includes('boilerOverhaul');
    if (!boiler) return s.purse >= ITEMS.boilerOverhaul.price + 3 + MORNING_ENTRY;
    const fireman = s.crew.includes('fireman');
    const tomorrow = s.time === 'afternoon' && s.coal >= CLIMB_COAL;
    return tomorrow && s.purse >= 3 + (fireman ? 0 : ITEMS.fireman.price) + ITEMS.food.price + MORNING_ENTRY && (!fireman || s.tomorrow === 0);
  }

  /** At a council (the mercantile, or the morning's): buy what's wanted, sell what's spare, and on. */
  function council() {
    const purchase = (id: string) => {
      const before = s.purse;
      s = buy(s, story, id);
      rec.bought[id] = (rec.bought[id] ?? 0) + 1;
      if (id === 'boilerOverhaul') rec.milestones.boiler = s.mornings;
      if (ITEMS[id].price > 0) rec.spent += before - s.purse;
      if (id === 'sellSalvage') rec.salvageSold++;
    };
    while (canBuy(s, story, 'sellSalvage') && (s.salvage ?? 0) > 0) purchase('sellSalvage');
    // Coal, sold while saving up (a load kept back for a job).
    if (persona.sellsCoal && saving()) while (s.coal > 1 && canBuy(s, story, 'sellCoal')) purchase('sellCoal');
    if (persona.upgrades) {
      if (canBuy(s, story, 'boilerOverhaul') && s.purse >= ITEMS.boilerOverhaul.price + MORNING_ENTRY) purchase('boilerOverhaul');
      const tomorrow = s.time === 'afternoon' && s.coal >= CLIMB_COAL && s.upgrades.includes('boilerOverhaul');
      if (tomorrow && canBuy(s, story, 'fireman') && s.purse >= ITEMS.fireman.price + MORNING_ENTRY) purchase('fireman');
      if (tomorrow && s.tomorrow === 0 && canBuy(s, story, 'food') && s.purse >= ITEMS.food.price + MORNING_ENTRY) purchase('food');
    }
    // Short of coal for the day, with the money: buy it.
    const step = currentStep(s, story);
    while (step?.type === 'council' && s.coal < step.coal && canBuy(s, story, 'coal')) purchase('coal');
    s = castOff(s, story);
  }

  /** An encounter, a move at a time. */
  function encounter(step: Extract<Step, { type: 'encounter' }>) {
    const e = s.encounter!;
    const id = e.def.id;
    if (e.outcome) {
      // Over: how it went, what it left, then up from the table (Willie logs it, as the UI does).
      tally(id, 'played');
      tally(id, e.outcome);
      const before = troublesAtSeat;
      if (e.def.stake === 'purse' && !e.def.proxy && e.def.rules?.pot !== false) (rec.purseDelta[id] ??= []).push(s.purse - purseAtSeat);
      if (id === 'noon' && e.outcome === 'solved') rec.milestones.firstNoonWin ??= s.mornings;
      if (e.oddJob && !e.def.proxy) rec.oddJobs++;
      if (id === 'depot') rec.depotCost.push(purseAtSeat - s.purse);
      rec.troublesFixed += e.fixed.filter((i) => snagDef(i).kind === 'trouble').length;
      if (debrisNow) {
        const won = e.outcome === 'solved';
        const struck = e.session.seats[0].jokers.at(-1)?.index;
        const d = debrisNow.debris;
        rec.debris.push({
          kind: d.kind === 'crate' ? 'crate' : d.id,
          won,
          at: debrisNow.at,
          afterSandbar: rec.sandbarCleared !== null,
          strengthBefore: debrisNow.strength,
          strengthAfter: e.session.seats[0].money,
          ...(struck !== undefined && d.kind === 'obstacle' && !won ? { struck } : {}),
          ...(d.kind === 'crate' && won ? { salvage: step.effects?.salvage ?? 0 } : {}),
        });
        if (d.kind === 'crate' && won) rec.salvageEarned += step.effects?.salvage ?? 0;
        // As the UI writes it: out of Muscatine the first is the set-piece crate; after the second, the dock fee.
        const n = s.place === 'muscatine' && s.fillsMet?.leg === s.river?.leg ? (s.fillsMet?.n ?? 0) : 0;
        log(n === 1 && d.kind === 'crate' ? firstCrateRecord(s.seed, won, step.effects?.salvage ?? 0) : d.kind === 'crate' ? 'Salvaged goods, worth $2 at the Mercantile.' : 'Steered clear of a snag.');
        if (n === 2) dockFeeEntry();
        debrisNow = null;
      } else {
        const r = ENCOUNTER_RECORDS[id]?.[e.outcome];
        if (r) log(r);
        // A crate at salvage camp, below the rapids.
        if (id === 'crate') {
          rec.campCrates++;
          if (e.outcome === 'solved') rec.salvageEarned += step.effects?.salvage ?? 0;
        }
      }
      if (id === 'sandbar') {
        if (e.outcome === 'solved') rec.sandbarCleared = step.attempt ?? 1;
        else rec.sandbarNights++;
      }
      const stage = e.def.push ? e.def.id : null;
      if (stage) {
        const rival = e.def.rivals !== 'crew' ? e.def.rivals.find((r) => r.obstacle) : undefined;
        const left = e.session.seats.find((p) => p.id === rival?.id)?.money ?? 0;
        rec.pushes.push({ stage, strength: morningStrength(s), taken: rival ? 1 - left / rival.money : 0, cleared: e.outcome === 'solved' });
        if (stage === 'molineChain' && (step.attempt ?? 1) === 1) rec.climbs++;
      }
      // The dock fee played for: whoever holds the bill when the hands are done settles it (the UI marks which).
      if (id === 'harbourMaster') s = { ...s, flags: [...s.flags, s.snags.some((j) => j.index === DOCK_FEE) ? DOCK_FEE_FLAG.snagged : DOCK_FEE_FLAG.dodged] };
      s = leaveEncounter(s, story);
      // Troubles new since it began (each new copy counted once).
      const left = before.slice();
      for (const snag of troubles(s)) {
        const k = left.indexOf(snag);
        if (k >= 0) left.splice(k, 1);
        else rec.troublesTaken.push({ snag, from: id });
      }
      return;
    }
    if (step.choices) {
      const pick = (): string => {
        const keys = Object.keys(step.choices!);
        if (id === 'harbourTalk') return persona.dockFee;
        if (id === 'depotTalk') return 'snag';
        if (id === 'breakfast') {
          const client = s.flags.includes(FLAG.gaylordsClient), owes = s.flags.includes(FLAG.owesGaylord);
          const canHire = s.mornings >= GAYLORD_FIRST_HIRE && s.mornings <= GAYLORD_LAST_HIRE && !owes && !client && s.flags.includes(FLAG.heardOfPilot) && s.purse >= GAYLORD_FEE;
          if (canHire) return persona.gaylord === 'hire' ? 'hire' : 'pass';
          if (s.flags.includes(FLAG.beatGaylord) && !owes && !client) return persona.gaylord === 'loan' ? 'take' : 'pass';
          return 'pass';
        }
        return keys.at(-1)!;
      };
      tally(id, 'played');
      // As the UI does: the answer's record in the log, and the dock fee marked paid.
      const key = pick();
      if (key === 'pay') s = { ...s, flags: [...s.flags, DOCK_FEE_FLAG.paid] };
      if (CHOICE_RECORDS[key]) log(CHOICE_RECORDS[key]);
      s = choose(s, story, key);
      return;
    }
    if (e.session.phase === 'hand') {
      if (e.session.hand === 1 && !e.session.round?.street && !e.session.round?.result) {
        purseAtSeat = s.purse - (e.oddJob ?? 0) + (e.def.entry ?? 0);
        troublesAtSeat = troubles(s);
      }
      const me = mySeatAt(e);
      if (s.river && !step.stuck && !creep) creep = { seconds: 0 };
      if (myMoveOwed(s)) s = playEncounter(s, move(viewFor(e.session.round!, me, e.session.config), e.session.config, id));
      else s = playEncounter(s, null);
      return;
    }
    // A hand's verdict: its seconds pass (a person reads it), then on.
    const seconds = persona.handSeconds(timeRng);
    clock += seconds;
    if (creep) creep.seconds += seconds;
    s = handDone(s, story);
  }

  let moves = 0;
  try {
    for (; !s.done; moves++) {
      if (moves > 200000) throw new Error('too many moves');
      dawned();
      rec.lowestPurse = Math.min(rec.lowestPurse, s.purse);
      if (s.mornings > maxDays) {
        rec.end = 'timeout';
        rec.stoppedAt = `day ${s.mornings}, ${s.place}, ${s.time}; coal ${s.coal}, purse ${s.purse}, strength ${morningStrength(s)}`;
        break;
      }
      // Done creeping (up from a hand on the river): the rest of the stretch starts where she got to.
      const step = currentStep(s, story);
      // (Set in encounter(): TypeScript can't see that from here.)
      const crawled = creep as { seconds: number } | null;
      if (crawled && (step?.type !== 'encounter' || step.stuck) && s.river) {
        const river = s.river;
        const rest = s.pending.find((p) => p.type === 'steam');
        if (rest?.type === 'steam' && rest.leg === river.leg && rest.to > river.t) {
          const at = (share: number) => river.t + share * (rest.to - river.t);
          const room = creepRoom({
            t: river.t,
            to: rest.to,
            pace: 1 / legSeconds,
            forks: CHAPTER_1_ISLANDS.filter((i) => i.to > river.t && i.from < rest.to),
            ...(rest.main ? { main: { window: [at(rest.main.window[0]), at(rest.main.window[1])] as [number, number] } } : {}),
            sinceFill: 0,
          });
          s = driftOnRiver(s, river.t + Math.min(room, crept(crawled.seconds, CREEP_TAIL) / CHAPTER_1_PX));
        }
        creep = null;
      }
      if (!step) throw new Error('no step');
      if (s.place === 'triCities' && !rec.atTriCities) rec.atTriCities = { purse: s.purse, strength: s.strength, coal: s.coal, salvage: s.salvage ?? 0, troubles: troubles(s).length, day: s.mornings };
      switch (step.type) {
        case 'caption':
          clock += 5;
          s = proceed(s, story);
          break;
        case 'steam':
          steam(step);
          break;
        case 'council':
          council();
          break;
        case 'hub':
          hub();
          break;
        case 'fork':
          // A push failed with coal left: go again, unless the coal left can't possibly do the rest.
          if (persona.id === 'careful' && s.coal < 1) {
            rec.turnedBack++;
            s = turnBack(s, story);
          } else s = pushAgain(s, story);
          break;
        case 'encounter':
          encounter(step);
          break;
        default:
          throw new Error(`stopped at a ${step.type}`);
      }
    }
  } catch (err) {
    rec.end = 'error';
    rec.error = String(err instanceof Error ? err.message : err);
    const step = currentStep(s, story);
    rec.stoppedAt = `day ${s.mornings}, ${s.place}, ${step?.type} ${s.encounter?.def.id ?? ''} (move ${moves})`;
  }
  rec.days = s.mornings;
  if (!Number.isFinite(rec.lowestPurse)) rec.lowestPurse = s.purse;
  // Sanity: nothing should ever go negative.
  if (s.purse < 0 || s.coal < 0 || s.strength < 0) rec.oddities.push(`seed ${seed}: negative purse/coal/strength (${s.purse}/${s.coal}/${s.strength})`);
  return rec;
}

// --- Tuning, re-simulated ----------------------------------------------------------------------

/** Changes to try, by encounter id: the obstacle's (or first rival's) pile, and the hands. */
export type Tuning = Record<string, { money?: number; hands?: number }>;

/** The story with these encounters changed (wherever they are: the days, a stretch's main event, the hubs). */
export function tuned(story: StoryDef, tuning: Tuning): StoryDef {
  const walk = (steps: Step[]): Step[] => steps.map(one);
  const one = (step: Step): Step => {
    if (step.type === 'scene') return { ...step, steps: walk(step.steps) };
    if (step.type === 'steam' && step.main) return { ...step, main: { ...step.main, steps: walk(step.main.steps) } };
    if (step.type !== 'encounter') return step;
    const t = tuning[step.encounter.id];
    if (!t) return step;
    const rivals = step.encounter.rivals === 'crew' ? 'crew' : step.encounter.rivals.map((r, k) => (t.money !== undefined && (r.obstacle || k === 0) ? { ...r, money: t.money } : r));
    return { ...step, encounter: { ...step.encounter, rivals, ...(t.hands ? { hands: t.hands } : {}) } };
  };
  return {
    ...story,
    days: story.days.map((d) => ({ ...d, steps: walk(d.steps) })),
    hubs: Object.fromEntries(Object.entries(story.hubs ?? {}).map(([k, h]) => [k, { ...h, options: h.options.map((o) => ({ ...o, steps: walk(o.steps), ...(o.menu ? { menu: o.menu.map((m) => ({ ...m, steps: walk(m.steps) })) } : {}) })) }])),
  };
}
