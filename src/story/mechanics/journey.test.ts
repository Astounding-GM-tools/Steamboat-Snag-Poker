import { describe, expect, it } from 'vitest';
import { SANDY } from '../characters/sandy';
import { RIVER, RIVER_START, RIVER_TALK } from '../river';
import type { RoundScript } from './script';
import { chooseAction, viewFor } from '../../engine/ai';
import { jokerCard } from '../../engine/cards';
import {
  buy,
  canBuy,
  canCastOff,
  castOff,
  choose,
  closingLines,
  currentStep,
  handDone,
  leaveEncounter,
  mySeatAt,
  myMoveOwed,
  newJourney,
  playEncounter,
  proceed,
  chooseLane,
  passIsland,
  turnIn,
  goTo,
  hubOptions,
  closeMenu,
  deckCrew,
  pushAgain,
  turnBack,
  jumpTo,
  meetDebris,
  setStation,
  setRehire,
  type Slot,
  type JourneyState,
  type Step,
  type StoryDef,
  STORY_CONFIG,
} from './journey';
import { BOAT, shipStrength } from './boat';
import { Rng } from '../../engine/rng';
import { newSession, nextSessionHand, submit, type TableSession } from '../../engine/session';
import { DOCK_FEE, TROUBLE, coveredHands } from './snags';
import { CRATE_ANTE, crateAnteFor, debrisAt, debrisStep } from '../characters/debris';

/** Plays the voyage as a careful captain would; returns every state passed through. */
function autopilot(seed: number, guard = 40000): JourneyState[] {
  let s = newJourney(seed, RIVER, RIVER_START);
  const seen = [s];
  const rng = new Rng(seed);
  for (let i = 0; i < guard && !s.done; i++) {
    const step = currentStep(s, RIVER)!;
    if (step.type === 'caption' || step.type === 'steam') s = proceed(s, RIVER);
    else if (step.type === 'council') s = castOff(s, RIVER);
    else if (step.type === 'fork') s = pushAgain(s, RIVER);
    else if (step.type === 'hub') {
      const can = (id: string) => hubOptions(s, RIVER).some((o) => o.option.id === id && o.open);
      s = goTo(s, RIVER, s.time === 'evening' ? 'anchor' : can('tournament') ? 'tournament' : 'depot');
    } else if (step.type === 'encounter') {
      const e = s.encounter!;
      if (e.outcome) s = leaveEncounter(s, RIVER);
      else if (step.choices) s = choose(s, RIVER, Object.keys(step.choices).at(-1)!);
      else if (e.session.phase === 'hand') {
        const me = mySeatAt(e);
        s = playEncounter(s, myMoveOwed(s) ? chooseAction('careful', viewFor(e.session.round!, me, e.session.config), e.session.config, rng) : null);
      } else s = handDone(s, RIVER);
    } else throw new Error(`Stopped at a ${step.type}`);
    seen.push(s);
  }
  return seen;
}

describe('the voyage', () => {
  it('opens on the river, then a hand with Bill', () => {
    let s = newJourney(1, RIVER, RIVER_START);
    expect(currentStep(s, RIVER)?.type).toBe('caption');
    s = proceed(s, RIVER);
    expect(s.encounter?.def.id).toBe('bill');
    expect(s.encounter?.session.round?.potMode).toBe(false);
  });

  it('makes the crew\'s strength at dawn, sells at the council what the landing has, and casts off only with the coal for the day', () => {
    const story: StoryDef = {
      days: [{ day: 1, place: 'muscatine', steps: [{ type: 'dawn' }, { type: 'council', advice: [], trader: ['coal', 'hammocks'], coal: 2 }, { type: 'caption', lines: [] }] }],
      stuckNight: [],
    };
    let s = newJourney(1, story, RIVER_START);
    expect(s.strength).toBe(18);
    // The first morning's wages are already paid.
    expect(s.purse).toBe(RIVER_START.purse);
    expect(canBuy(s, story, 'whistle')).toBe(false);
    s = buy(s, story, 'hammocks');
    expect(s.strength).toBe(21);
    expect(canBuy(s, story, 'hammocks')).toBe(false);
    s = { ...s, coal: 1 };
    expect(canCastOff(s, story)).toBe(false);
    s = buy(s, story, 'coal');
    expect(canCastOff(s, story)).toBe(true);
    expect(currentStep(castOff(s, story), story)?.type).toBe('caption');
  });

  it('plays the first days through, whatever the cards, and survives a trip through JSON at every step', { timeout: 120000 }, () => {
    for (const seed of [1, 2, 3]) {
      const states = autopilot(seed);
      const last = states.at(-1)!;
      expect(last.done, `seed ${seed}: nights ${last.nights} day ${last.day}, step ${last.step}, ${currentStep(last, RIVER)?.type} ${last.encounter?.def.id} hand ${last.encounter?.session.hand}, pending ${last.pending.length}`).toBe(true);
      for (const s of states.filter((_, k) => k % 50 === 0)) expect(JSON.parse(JSON.stringify(s))).toEqual(s);
    }
  });

  it('turns in from the deck game when you like', () => {
    const story: StoryDef = {
      days: [{ day: 1, place: 'muscatine', steps: [{ type: 'dawn' }, { type: 'encounter', solved: [], encounter: { id: 'deck', stake: 'strength', rivals: 'crew', goal: { type: 'evening' }, hands: 3 } }] }],
      stuckNight: [],
    };
    let s = newJourney(3, story, RIVER_START);
    const rng = new Rng(3);
    while (s.encounter!.session.phase === 'hand') {
      const c = s.encounter!;
      s = playEncounter(s, chooseAction('careful', viewFor(c.session.round!, mySeatAt(c), c.session.config), c.session.config, rng));
    }
    expect(turnIn(s, story).encounter?.outcome).toBe('solved');
  });
});

describe('a table with an obstacle', () => {
  function play(s: TableSession, rng: Rng): TableSession {
    while (s.phase === 'hand') {
      const me = s.seated.indexOf(0);
      s = submit(s, me, s.round!.result?.rides ? { type: 'ride' } : chooseAction('careful', viewFor(s.round!, me, s.config), s.config, rng));
    }
    return s;
  }
  const config = { ...newSession(1, [{ id: 'a' }, { id: 'b' }]).config, totalJokers: 0 };

  it('never pays you more than you put in; what you lose turns to its pile', () => {
    const rng = new Rng(2);
    let s = newSession(3, [{ id: 'captain', money: 30 }, { id: 'sandbar', ai: 'stubborn', money: 20, obstacle: true }], config);
    for (let h = 0; h < 8 && s.phase !== 'over'; h++) {
      const before = s.seats.map((p) => p.money);
      s = play(s, rng);
      const r = s.round!.result!;
      const mine = s.seats[0].money - before[0];
      expect(mine).toBeLessThanOrEqual(0);
      if (r.winners.includes(s.seated.indexOf(1)) && r.winners.length === 1) expect(s.seats[1].money - before[1]).toBe(-mine);
      if (s.phase === 'handEnd') s = nextSessionHand(s);
    }
  });

  it('gives back a loss in a covered hand', () => {
    const rng = new Rng(5);
    let s = newSession(7, [{ id: 'captain', money: 30, cover: [1, 2, 3, 4, 5, 6] }, { id: 'sandbar', ai: 'stubborn', money: 20, obstacle: true }], config);
    for (let h = 0; h < 6 && s.phase !== 'over'; h++) {
      s = play(s, rng);
      expect(s.seats[0].money).toBe(30);
      if (s.phase === 'handEnd') s = nextSessionHand(s);
    }
  });

  it('lets a crew member absorb the troubles they fix', () => {
    const rng = new Rng(1);
    let absorbed = 0;
    for (let g = 0; g < 40; g++) {
      let s = newSession(g, [{ id: 'captain', money: 20, jokers: [jokerCard(17), jokerCard(17)] }, { id: 'gus', ai: 'defeatist', money: 20, fixes: [17] }], config);
      s = play(s, rng);
      absorbed += s.settled!.absorbed.length;
      expect(s.seats[1].jokers.some((j) => j.index === 17)).toBe(false);
    }
    expect(absorbed).toBeGreaterThan(0);
  });
});

describe('the deck game', () => {
  it('takes every snag you play, win or lose', () => {
    const config = { ...STORY_CONFIG, drainPerJoker: 0, jokerForfeit: 0 };
    for (let g = 0; g < 10; g++) {
      let s = newSession(g, [{ id: 'captain', money: 20, unhands: true, jokers: [jokerCard(14), jokerCard(17)] }, { id: 'gus', ai: 'careful', money: 20, fixes: [14, 17] }], config);
      while (s.phase === 'hand') {
        const round = s.round!;
        const me = s.seated.indexOf(0);
        const hand = round.seats[me].hand.map((c) => c.id);
        s = submit(s, me, round.street === 2 ? { type: 'compose', cardIds: hand.slice(0, 2), jokers: 2 } : { type: 'draw', cardIds: [] });
      }
      expect(s.seats[0].jokers).toEqual([]);
      expect(s.settled!.absorbed.map((a) => a.snag).sort()).toEqual([14, 17]);
    }
  });
});

describe('snag tempers', () => {
  it('covers the hands each volunteer works', () => {
    const mule = jokerCard(7);
    const inLaws = jokerCard(1);
    const mail = jokerCard(6);
    expect(coveredHands([mule], 8, 1)).toEqual([6, 7, 8]);
    expect(coveredHands([inLaws, mule], 8, 1)).toEqual([1, 6, 7, 8]);
    expect(coveredHands([mail], 8, 1)).toEqual([]);
    expect(coveredHands([jokerCard(10)], 8, 4)).toEqual([4]);
  });
});

describe('round the islands', () => {
  const out = () => ({ ...newJourney(1, RIVER, RIVER_START), strength: 10 });
  it('remembers the passage chosen', () => {
    expect(chooseLane(out(), 'leg:0.3', 'left').lanes).toEqual({ 'leg:0.3': 'left' });
  });
  it('passes each island once', () => {
    const once = passIsland(out(), 'leg:0.3');
    expect(passIsland(once, 'leg:0.3').passed).toEqual(['leg:0.3']);
    expect(passIsland(once, 'leg:0.4').passed).toEqual(['leg:0.3', 'leg:0.4']);
  });
});

describe('debris on the river', () => {
  /** Under way from Muscatine, a little way out, with buttons to play. */
  const underWay = (): JourneyState => {
    const steps = RIVER.days[0].steps;
    const i = steps.findIndex((s) => s.type === 'steam');
    const j = jumpTo({ ...newJourney(3, RIVER, RIVER_START), step: i + 1 }, RIVER, [steps[i]]);
    return { ...j, strength: 12, river: { leg: 'chapter-1-upbound', t: 0.05 } };
  };
  /** One hand played out, carefully. */
  const playHand = (j: JourneyState) => {
    const rng = new Rng(9);
    for (let guard = 0; j.encounter && !j.encounter.outcome && guard < 40; guard++) {
      const e = j.encounter;
      if (e.session.phase === 'hand') j = playEncounter(j, myMoveOwed(j) ? chooseAction('careful', viewFor(e.session.round!, mySeatAt(e), e.session.config), e.session.config, rng) : null);
      else j = handDone(j, RIVER);
    }
    return j;
  };
  it('is a coin flip, the same each time for the same spot', () => {
    const kinds = Array.from({ length: 200 }, (_, k) => debrisAt(7, `spot:${k}`).kind);
    const crates = kinds.filter((k) => k === 'crate').length;
    expect(crates).toBeGreaterThan(70);
    expect(crates).toBeLessThan(130);
    expect(debrisAt(7, 'spot:3')).toEqual(debrisAt(7, 'spot:3'));
  });
  it('stops her for one hand, and the stretch (and its main event) goes on after', () => {
    const j = underWay();
    const met = meetDebris(j, RIVER, 0.1, debrisStep({ kind: 'crate' }, crateAnteFor(j, 'chapter-1-upbound')), true);
    expect(currentStep(met, RIVER)?.type).toBe('encounter');
    expect(met.cratesMet).toEqual({ leg: 'chapter-1-upbound', n: 1 });
    expect(crateAnteFor(met, 'chapter-1-upbound')).toBe(CRATE_ANTE + 1);
    const after = playHand(met);
    expect(after.encounter?.outcome).not.toBeNull();
    const on = leaveEncounter(after, RIVER);
    const rest = currentStep(on, RIVER);
    expect(rest?.type).toBe('steam');
    if (rest?.type === 'steam') {
      expect(rest.main?.steps.length).toBe(2);
      // Its window is where it was on the river, as shares of what's left of the stretch.
      const at = (s: number) => 0.1 + s * (rest.to - 0.1);
      // (Her stretch began where she was, 0.05.)
      expect(at(rest.main!.window[0])).toBeCloseTo(0.05 + 0.55 * (0.6429 - 0.05));
      expect(at(rest.main!.window[1])).toBeCloseTo(0.05 + 0.75 * (0.6429 - 0.05));
    }
    // Won, the crate is salvage worth its ante; lost, nothing.
    expect(on.salvage ?? 0).toBe(after.encounter!.outcome === 'solved' ? CRATE_ANTE : 0);
  });
  it('leaves her with the obstacle’s snag only if it gets the better of her', () => {
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const j = { ...underWay(), rngState: seed };
      const after = playHand(meetDebris(j, RIVER, 0.1, debrisStep({ kind: 'obstacle', id: 'sawyer', snag: TROUBLE.fouledWheel }, CRATE_ANTE), false));
      const on = leaveEncounter(after, RIVER);
      const struck = on.snags.filter((s) => s.index === TROUBLE.fouledWheel).length;
      expect(struck, `seed ${seed}`).toBeLessThanOrEqual(1);
      if (after.encounter!.outcome === 'solved') expect(struck, `seed ${seed}`).toBe(0);
      expect(on.cratesMet).toBeUndefined();
    }
  });
});

describe('the dock fee', () => {
  /** On to the harbour master's talk: Bill's hands played out, the fee in hand. */
  function atTheHarbour(): JourneyState {
    let s = proceed(newJourney(1, RIVER, RIVER_START), RIVER);
    const rng = new Rng(1);
    while (s.encounter?.def.id === 'bill') {
      const e = s.encounter;
      if (e.outcome) s = leaveEncounter(s, RIVER);
      else if (e.session.phase === 'hand') s = playEncounter(s, chooseAction('careful', viewFor(e.session.round!, mySeatAt(e), e.session.config), e.session.config, rng));
      else s = handDone(s, RIVER);
    }
    return s;
  }

  it('is handed over by Bill, and paying it takes most of the purse and skips the game', () => {
    const s = atTheHarbour();
    expect(s.encounter?.def.id).toBe('harbourTalk');
    expect(s.snags.map((j) => j.index)).toEqual([DOCK_FEE]);
    const paid = choose(s, RIVER, 'pay');
    expect(paid.purse).toBe(13);
    expect(paid.snags).toEqual([]);
    // Out onto the river: the boat steams up to the sandbar, and Willie talks.
    expect(currentStep(paid, RIVER)?.type).toBe('steam');
    const out = proceed(paid, RIVER);
    // She meets the stretch's main event (The Sandbar) at the middle of its window, without the river shown.
    expect(out.river?.leg).toBe('chapter-1-upbound');
    expect(out.river!.t).toBeCloseTo(0.6429 * 0.65);
    expect(out.encounter?.def.id).toBe('underway');
  });

  it('can be played for: five hands, with the bill in your hand', () => {
    const s = choose(atTheHarbour(), RIVER, 'snag');
    expect(s.encounter?.def.id).toBe('harbourMaster');
    expect(s.encounter?.def.hands).toBe(5);
    expect(s.encounter?.session.round?.potMode).toBe(true);
    expect(s.encounter?.session.seats[0].jokers.map((j) => j.index)).toEqual([DOCK_FEE]);
  });

  it('is settled by whoever holds it after the game', () => {
    const s = choose(atTheHarbour(), RIVER, 'snag');
    const end = (holding: boolean): JourneyState => {
      const e = structuredClone(s);
      e.encounter!.outcome = 'solved';
      e.purse = 30;
      e.snags = holding ? [jokerCard(DOCK_FEE)] : [];
      return leaveEncounter(e, RIVER);
    };
    expect(end(true).purse).toBe(0);
    expect(end(true).snags).toEqual([]);
    expect(end(false).purse).toBe(30);
  });
});

describe('table talk', () => {
  const context = { hand: 1, pile: 20, seed: 9, day: 2, trips: false, lost: 0, foldedOut: false, met: false, attempt: 1, journey: newJourney(1, RIVER, RIVER_START), fixed: [] as { id: string; snag: number }[] };
  const sandy = RIVER_TALK.sandbar as unknown as (c: typeof context) => RoundScript;
  const deck = RIVER_TALK.deck as unknown as (c: typeof context) => RoundScript;

  it('never quips over the opening, or the same line twice in a day', () => {
    expect(sandy(context).deal).toHaveLength(1);
    expect(sandy(context).verdict?.some((l) => l.size === 'aside')).toBe(false);
    const seen = [2, 3].map((hand) => String(sandy({ ...context, hand }).verdict?.find((l) => l.size === 'aside')?.text));
    expect(new Set(seen).size).toBe(2);
  });

  it('has whoever takes on a trouble say so at the deck game', () => {
    const lines = deck({ ...context, fixed: [{ id: 'gus', snag: TROUBLE.brokenPaddle }] }).verdict!;
    expect(lines[0].who).toBe('gus');
    expect(lines[0].text).toContain('Broken Paddle');
    expect(deck(context).verdict).toEqual([]);
  });

  it('has whoever takes a trouble that isn\'t theirs hand it to whoever fixes it', () => {
    const lines = deck({ ...context, fixed: [{ id: 'willie', snag: TROUBLE.twistedCrankshaft }] }).verdict!;
    expect(lines.map((l) => l.who)).toEqual(['willie', 'gus']);
    expect(lines[0].text).toContain('Gus');
  });

  it('has the foreman never say what he wants, until he has it', () => {
    const depot = RIVER_TALK.depot as unknown as (c: typeof context) => RoundScript;
    const said = (c: Partial<typeof context>) => depot({ ...context, hand: 3, ...c }).verdict!.map((l) => String(l.text)).join(' ');
    expect(said({ lost: 4 })).not.toContain('sacks have fallen');
    expect(said({ lost: 13 })).toContain('sacks have fallen');
    expect(said({ foldedOut: true })).toContain('Folding');
    expect(said({ fixed: [{ id: 'rourke', snag: DOCK_FEE }] })).toContain('nothing better to do');
  });

  it('has Lars sing until he has a week of words', () => {
    const fixing = (day: number) => deck({ ...context, day, fixed: [{ id: 'lars', snag: TROUBLE.brokenPole }] }).verdict![0].text;
    expect(fixing(2)).toContain('♪');
    expect(fixing(9)).toBe('Ja. Fiks.');
  });
});

describe('the pilot\'s tournament', () => {
  const story: StoryDef = {
    days: [
      {
        day: 1,
        place: 'davenport',
        steps: [
          { type: 'dawn' },
          { type: 'draw', entrants: ['konrad', 'nemo', 'walrus', 'lenny', 'ignatz', 'eliza', 'maxMoritz', 'tripp'].map((id) => ({ id, ai: 'careful' as const })), tableSize: 3, finalists: 2 },
          { type: 'encounter', stuck: true, solved: [], failed: [], encounter: { id: 'noon', stake: 'purse', rivals: [{ id: 'ellie', ai: 'careful', money: 10 }], joined: 'finalists', entry: 10, goal: { type: 'lastStanding', host: 'ellie' }, hands: 40 } },
          { type: 'caption', lines: [] },
        ],
      },
    ],
    stuckNight: [{ type: 'caption', lines: [{ text: 'Supper.' }] }],
  };
  it('takes the entry, seats the morning\'s winners, and pays the table to whoever\'s left', () => {
    const s = newJourney(3, story, RIVER_START);
    expect(s.purse).toBe(RIVER_START.purse - 10);
    expect(s.encounter?.session.seats.map((p) => p.money)).toEqual([10, 10, 10, 10]);
    expect(s.finalists).toHaveLength(2);
    expect(s.mates).toHaveLength(2);
    expect(new Set([...s.mates, ...s.finalists].map((r) => r.id)).size).toBe(4);
  });

  function finish(lastOut: string): JourneyState {
    let s = newJourney(3, story, RIVER_START);
    const rng = new Rng(2);
    while (s.encounter!.session.phase === 'hand') {
      const c = s.encounter!;
      const me = mySeatAt(c);
      s = playEncounter(s, myMoveOwed(s) ? chooseAction('careful', viewFor(c.session.round!, me, c.session.config), c.session.config, rng) : null);
    }
    s = structuredClone(s);
    const session = s.encounter!.session;
    session.phase = 'over';
    for (const p of session.seats) {
      p.out = p.id !== 'ellie';
      p.money = p.id === 'ellie' ? 40 : 0;
    }
    s.encounter!.busted = [session.seats.map((p) => p.id).filter((id) => id !== 'ellie' && id !== lastOut), [lastOut]];
    return handDone(s, story);
  }

  it('lets the runner-up through if the pilot wins it herself, and nobody else', () => {
    expect(finish('captain').encounter?.outcome).toBe('solved');
    const lost = finish(newJourney(3, story, RIVER_START).finalists[0].id);
    expect(lost.encounter?.outcome).toBe('failed');
  });

  it('lets a spare replace what\'s broken', () => {
    const story: StoryDef = { days: [{ day: 1, place: 'triCities', steps: [{ type: 'council', advice: [], trader: ['sparePole'], coal: 0 }, { type: 'caption', lines: [] }] }], stuckNight: [] };
    const s = { ...newJourney(1, story, RIVER_START), snags: [jokerCard(TROUBLE.brokenPole)] };
    expect(buy(s, story, 'sparePole').snags).toEqual([]);
  });
});

describe('the Tri-Cities', () => {
  const at = (time: Slot, flags: string[] = []) => {
    const s = newJourney(1, RIVER, RIVER_START);
    return { ...s, step: RIVER.days[0].steps.findIndex((x) => x.type === 'hub'), encounter: null, time, flags };
  };
  const ids = (s: JourneyState) => hubOptions(s, RIVER).map((o) => o.option.id);

  it('offers what the time of day allows, and what you know about', () => {
    expect(ids(at('evening'))).toEqual(['anchor', 'bettendorf']);
    expect(ids(at('afternoon', ['met:deckIntel']))).toEqual(['mercantile', 'depot', 'jobs']);
    expect(ids(at('morning', ['met:deckIntel']))).toEqual(['mercantile', 'depot', 'tournament', 'jobs']);
  });

  it('won\'t have you at the tournament without the coal for the climb', () => {
    const s = { ...at('morning', ['met:deckIntel']), coal: 5 };
    expect(hubOptions(s, RIVER).find((o) => o.option.id === 'tournament')?.open).toBe(false);
    expect(() => goTo(s, RIVER, 'tournament')).toThrow();
  });

  it('opens the jobs for free, and a job fills the slot and burns its coal', () => {
    const open = goTo({ ...at('morning', ['jobFound']), coal: 3 }, RIVER, 'jobs');
    expect(open.time).toBe('morning');
    expect(ids(open)).toEqual(['job:timber', 'job:cattle', 'job:mail']);
    let s = goTo(open, RIVER, 'job:cattle');
    const purse = s.purse;
    s = proceed(s, RIVER);
    expect(s.purse).toBe(purse + 14);
    expect(s.coal).toBe(2);
    expect(s.time).toBe('afternoon');
    expect(s.flags).not.toContain('jobFound');
    expect(currentStep(s, RIVER)?.type).toBe('hub');
  });

  it('always has the mail, and no job without coal', () => {
    const s = goTo({ ...at('morning'), coal: 0 }, RIVER, 'jobs');
    expect(hubOptions(s, RIVER).map((o) => [o.option.id, o.open])).toEqual([['job:mail', false]]);
    expect(closeMenu(s).submenu).toBeNull();
  });

  it('lets you walk away from the depot and stay where you were', () => {
    let s = goTo(at('morning'), RIVER, 'depot');
    expect(s.encounter?.def.id).toBe('depotTalk');
    s = choose(s, RIVER, 'leave');
    expect(currentStep(s, RIVER)?.type).toBe('hub');
    expect(s.time).toBe('morning');
  });
});

describe('Sandy', () => {
  const context = { hand: 2, pile: 20, seed: 9, day: 2, trips: false, lost: 0, foldedOut: false, met: true, attempt: 1, journey: newJourney(1, RIVER, RIVER_START), fixed: [] as { id: string; snag: number }[] };
  const sandy = RIVER_TALK.sandbar as unknown as (c: typeof context) => RoundScript;

  it('jokes only when you lose or fold a hand, never twice in a day, and says nothing once they run out', () => {
    expect(sandy({ ...context, hand: 2 }).verdict?.filter((l) => l.size === 'aside').every((l) => l.when === 'lost')).toBe(true);
    for (const attempt of [1, 2, 3]) {
      const said = [2, 3, 4, 5, 6, 7, 8].flatMap((hand) => {
        const talk = sandy({ ...context, attempt, hand });
        return (talk.verdict ?? []).filter((l) => l.size === 'aside').map((l) => String(l.text));
      });
      expect(new Set(said).size).toBe(said.length);
      expect(said.length).toBeLessThanOrEqual(SANDY.quips.length);
    }
  });

  it('has a dozen one-liners, exactly', () => {
    expect(SANDY.quips).toHaveLength(12);
  });

  it('repeats its last morning once it has no more', () => {
    const open = [2, 3, 4, 5].map((attempt) => String(sandy({ ...context, hand: 1, attempt }).deal?.[0].text));
    expect(open.at(-1)).toBe(SANDY.mornings.at(-1));
    expect(open.at(-2)).toBe(SANDY.mornings.at(-1));
  });

  it('asks a round before the third hand, in rotation, and calls last orders on the last', () => {
    const round = (attempt: number) => sandy({ ...context, hand: 3, attempt }).deal!;
    expect(round(1)[0].replies?.length).toBe(2);
    expect(round(1)[0].text).not.toEqual(round(2)[0].text);
    expect(sandy({ ...context, hand: 4, attempt: 1 }).deal?.[0].text).toBe(SANDY.lastCall);
  });
});

describe('hired hands', () => {
  const story: StoryDef = {
    days: [{ day: 1, place: 'muscatine', steps: [{ type: 'dawn' }, { type: 'council', advice: [], trader: ['fireman', 'stove', 'cook'], coal: 0 }, { type: 'dawn' }, { type: 'dawn' }, { type: 'caption', lines: [] }] }],
    stuckNight: [],
  };
  const start = () => newJourney(1, story, { purse: 100, coal: 2 });
  const passDays = (s: JourneyState) => castOff(s, story);

  it('lasts the day and the next, then goes, unless re-hired', () => {
    let s = buy(start(), story, 'fireman');
    expect(s.strength).toBe(26);
    expect(deckCrew(s)).toEqual(['gus', 'willie', 'fireman']);
    s = passDays(setRehire(s, 'fireman', false));
    expect(s.crew).not.toContain('fireman');
    expect(s.hires).toEqual([]);
  });

  it('signs on again by default, for the wage', () => {
    const s = buy(start(), story, 'fireman');
    const purse = s.purse;
    const later = passDays(s);
    expect(later.crew).toContain('fireman');
    expect(later.hires[0].days).toBe(2);
    expect(later.purse).toBe(purse - 4 - 6 * 2);
  });

  it('wants a kitchen for the cook, who feeds everyone else', () => {
    let s = start();
    expect(canBuy(s, story, 'cook')).toBe(false);
    s = buy(s, story, 'stove');
    expect(s.parts.kitchen).toBe(1);
    s = buy(s, story, 'cook');
    // Her 2 buttons, and 2 more for each of the other three.
    expect(s.strength).toBe(18 + 2 + 6);
  });
});

describe('the climb', () => {
  const stage = { type: 'encounter', solved: [], failed: [], sweptBack: [{ type: 'caption', lines: [{ text: 'Swept back.' }] }, { type: 'nightfall' }], encounter: { id: 'molineChain', stake: 'strength', push: true, rivals: [{ id: 'molineChain', ai: 'stubborn', money: 15, obstacle: true, steady: true }], goal: { type: 'clear' }, hands: 60 } } as Step;
  const hub = { type: 'hub', hub: 'x' } as Step;
  const story: StoryDef = { days: [{ day: 1, place: 'davenport', steps: [{ type: 'dawn' }, stage, { type: 'caption', lines: [{ text: 'At the top.' }] }, hub] }], stuckNight: [], hubs: { x: { options: [], advice: () => null } } };

  const failPush = (s: JourneyState) => {
    const failed = structuredClone(s);
    failed.encounter!.outcome = 'failed';
    return leaveEncounter(failed, story);
  };

  it('burns a load a push, with the crew fresh each time, until the coal is gone', () => {
    let s = newJourney(1, story, { purse: 50, coal: 3 });
    expect(s.coal).toBe(2);
    expect(s.encounter?.session.seats[0].money).toBe(18);
    for (const left of [1, 0]) {
      s = pushAgain(failPush(s), story);
      expect(s.coal).toBe(left);
      expect(s.encounter?.session.seats[1].money).toBe(15);
    }
    s = failPush(s);
    expect(currentStep(s, story)).toMatchObject({ type: 'caption', lines: [{ text: 'Swept back.' }] });
    expect(proceed(s, story).time).toBe('evening');
  });

  it('lets you turn back with the coal that\'s left', () => {
    let s = failPush(newJourney(1, story, { purse: 50, coal: 3 }));
    expect(currentStep(s, story)?.type).toBe('fork');
    s = turnBack(s, story);
    expect(s.coal).toBe(2);
    expect(currentStep(s, story)).toMatchObject({ type: 'caption', lines: [{ text: 'Swept back.' }] });
  });

  it('nags until she\'s ready, and an overhaul doubles the work', () => {
    const s = { ...newJourney(1, RIVER, RIVER_START), step: RIVER.days[0].steps.findIndex((x) => x.type === 'hub'), encounter: null, flags: ['met:deckIntel'], mornings: 2 };
    expect(RIVER.hubs!.triCities.advice(s)?.who).toBeTruthy();
    expect(shipStrength(['gus', 'lars', 'willie'], s.stations, { ...BOAT.parts, boiler: 2, engine: 2 })).toBe(30);
  });

  it('can only be worn down', () => {
    const rng = new Rng(4);
    let s = newSession(5, [{ id: 'captain', money: 40 }, { id: 'stage', ai: 'stubborn', money: 15, obstacle: true, steady: true }], STORY_CONFIG);
    for (let h = 0; h < 6 && s.phase !== 'over'; h++) {
      const before = s.seats[1].money;
      while (s.phase === 'hand') s = submit(s, s.seated.indexOf(0), s.round!.result?.rides ? { type: 'ride' } : chooseAction('careful', viewFor(s.round!, s.seated.indexOf(0), s.config), s.config, rng));
      expect(s.seats[1].money).toBeLessThanOrEqual(before);
      if (s.phase === 'handEnd') s = nextSessionHand(s);
    }
  });
});

describe('Gaylord\'s week', () => {
  const hub = RIVER.days[0].steps.findIndex((x) => x.type === 'hub');
  const at = (day: number, time: Slot = 'morning', flags = ['met:deckIntel']): JourneyState => ({ ...newJourney(4, RIVER, RIVER_START), step: hub, encounter: null, time, flags, mornings: day, coal: 6, purse: 60 });
  const ids = (s: JourneyState) => hubOptions(s, RIVER).map((o) => o.option.id);

  it('sits at the final on his own calendar, then doesn\'t', () => {
    const noon = (day: number) => {
      const [draw, , ...rest] = hubOptions(at(day), RIVER).find((o) => o.option.id === 'tournament')!.option.steps;
      return jumpTo(at(day), RIVER, [draw, ...rest]).encounter!.session.seats.map((p) => p.id);
    };
    expect(noon(4)).toContain('gaylord');
    expect(noon(8)).toContain('gaylord');
    expect(noon(9)).not.toContain('gaylord');
  });

  const breakfast = (day: number, flags = ['met:deckIntel']) => proceed(goTo(at(day, 'morning', flags), RIVER, 'breakfast'), RIVER);
  const talk = RIVER_TALK.breakfast as unknown as (c: { day: number; journey: JourneyState }) => RoundScript;
  const offered = (o: { day?: number; client?: boolean; flags?: string[] }) => {
    const flags = [...(o.flags ?? ['met:deckIntel']), ...(o.client ? ['hiredGaylord'] : [])];
    return talk({ day: o.day ?? 4, journey: { ...newJourney(1, RIVER, RIVER_START), flags, purse: 40 } }).deal![0].replies!.map((r) => r.effect);
  };

  it('has breakfast on the menu every morning he\'s here, for the crew\'s sake', () => {
    expect(ids(at(2))).not.toContain('breakfast');
    expect(ids(at(10))).toContain('breakfast');
    expect(ids(at(3, 'afternoon'))).not.toContain('breakfast');
    const s = breakfast(4);
    expect(s.purse).toBe(56);
    expect(s.tomorrow).toBe(4);
  });

  it('offers to play your seat on days 3 to 5, if you could use it', () => {
    expect(offered({ day: 3 })).toContain('hire');
    expect(offered({ day: 6 })).not.toContain('hire');
    expect(offered({ client: true })).not.toContain('hire');
    expect(offered({ flags: ['met:deckIntel', 'owesGaylord'] })).not.toContain('hire');
  });

  it('only brings up a loan with someone who has beaten him, once, and never with a client', () => {
    const beaten = ['met:deckIntel', 'beatGaylord'];
    expect(offered({ day: 7 })).not.toContain('take');
    expect(offered({ day: 7, flags: beaten })).toContain('take');
    expect(offered({ day: 7, flags: [...beaten, 'owesGaylord'] })).not.toContain('take');
    expect(offered({ day: 7, flags: beaten, client: true })).not.toContain('take');
    const after = choose(breakfast(7, beaten), RIVER, 'take');
    expect(after.purse).toBe(106);
    expect(after.time).toBe('afternoon');
  });

  it('signs you for the last day of his week: you pay at breakfast, he decides, and his winnings are his', () => {
    const signed = choose(breakfast(3), RIVER, 'hire');
    expect(signed.purse).toBe(46);
    expect(signed.flags).toContain('hiredGaylord');
    expect(signed.time).toBe('afternoon');
    expect(ids({ ...signed, time: 'morning', mornings: 7 })).not.toContain('seat');
    let s = goTo({ ...signed, time: 'morning', mornings: 8 }, RIVER, 'seat');
    expect(s.encounter?.def.proxy).toBe('gambler');
    expect(s.encounter?.session.seats.map((p) => p.id)).not.toContain('gaylord');
    for (let k = 0; k < 400 && !s.encounter?.outcome; k++) {
      const e = s.encounter!;
      if (e.session.phase === 'hand') s = playEncounter(s, myMoveOwed(s) ? { type: 'fold' } : null);
      else s = handDone(s, RIVER);
    }
    expect(s.purse).toBe(46);
  });

  it('leaves the morning spent if you only had breakfast', () => {
    const s = choose(breakfast(9), RIVER, 'pass');
    expect(s.time).toBe('afternoon');
    expect(currentStep(s, RIVER)?.type).toBe('hub');
  });

  it('counts finishing a table ahead of him as beating him', () => {
    const s = goTo(at(4, 'evening'), RIVER, 'bettendorf');
    const end = (mine: number, his: number) => {
      const rng = new Rng(1);
      let g = s;
      while (g.encounter!.session.phase === 'hand') {
        const c = g.encounter!;
        g = playEncounter(g, myMoveOwed(g) ? chooseAction('careful', viewFor(c.session.round!, mySeatAt(c), c.session.config), c.session.config, rng) : null);
      }
      g = structuredClone(g);
      g.encounter!.session.seats[0].money = mine;
      g.encounter!.session.seats.find((p) => p.id === 'gaylord')!.money = his;
      g.encounter!.session.hand = 6;
      return handDone(g, RIVER).flags;
    };
    expect(end(70, 40)).toContain('beatGaylord');
    expect(end(20, 40)).not.toContain('beatGaylord');
  });
});

describe('stations', () => {
  const crew = ['gus', 'lars', 'willie'];
  const home = { gus: 'engine', lars: 'furnace', willie: 'galley' } as const;
  const parts = BOAT.parts;

  it('makes the crew\'s strength from who stands where', () => {
    expect(shipStrength(crew, home, parts)).toBe(18);
    // A better engine doubles Gus's work.
    expect(shipStrength(crew, home, { ...parts, engine: 2 })).toBe(24);
    // Willie in the engine room halves it; Gus at the deck adds nothing.
    expect(shipStrength(crew, { gus: 'deck', lars: 'furnace', willie: 'engine' }, parts)).toBe(15);
    // Lars can't run an engine.
    expect(shipStrength(crew, { gus: 'furnace', lars: 'engine', willie: 'galley' }, parts)).toBe(9);
  });

  it('feeds everyone else as well as the best cook in the galley, once there\'s a kitchen', () => {
    expect(shipStrength(crew, home, { ...parts, kitchen: 1 })).toBe(20);
  });

  it('takes effect the next morning', () => {
    const story: StoryDef = { days: [{ day: 1, place: 'muscatine', steps: [{ type: 'dawn' }, { type: 'caption', lines: [] }, { type: 'dawn' }, { type: 'caption', lines: [] }] }], stuckNight: [] };
    const s = setStation(newJourney(1, story, RIVER_START), 'gus', 'deck');
    expect(s.strength).toBe(18);
    expect(proceed(s, story).strength).toBe(12);
  });
});

describe('evenings', () => {
  it('end differently from one day to the next', () => {
    const step = RIVER.stuckNight.find((x) => x.type === 'encounter');
    if (step?.type !== 'encounter') throw new Error('No deck game');
    const on = (mornings: number) => closingLines({ ...newJourney(1, RIVER, RIVER_START), mornings }, step, 'solved')[0].text;
    expect(on(1)).not.toBe(on(2));
    expect(on(1)).toBe(on(1 + step.closers!.length));
  });
});

describe('nobody stays stuck', () => {
  it('faces what\'s left of the obstacle the next day', () => {
    const story: StoryDef = {
      days: [{ day: 1, place: 'muscatine', steps: [{ type: 'dawn' }, { type: 'encounter', stuck: true, solved: [], encounter: { id: 'sandbar', stake: 'strength', rivals: [{ id: 'sandbar', ai: 'stubborn', money: 20, obstacle: true }], goal: { type: 'clear' }, hands: 4 } }] }],
      stuckNight: [{ type: 'caption', lines: [] }],
    };
    const s = structuredClone(newJourney(1, story, RIVER_START));
    s.encounter!.session.seats[1].money = 7;
    s.encounter!.outcome = 'failed';
    const next = proceed(leaveEncounter(s, story), story);
    expect(next.encounter?.session.seats[1].money).toBe(7);
    expect(next.encounter?.def.hands).toBe(8);
  });

  it('never pulls you off: a day stuck is a night aboard and another try, for as long as it takes', () => {
    const story: StoryDef = {
      days: [{ day: 1, place: 'muscatine', steps: [{ type: 'dawn' }, { type: 'encounter', stuck: true, solved: [], encounter: { id: 'sandbar', stake: 'strength', rivals: [{ id: 'sandbar', ai: 'stubborn', money: 20, obstacle: true }], goal: { type: 'clear' }, hands: 4 } }] }],
      stuckNight: [{ type: 'caption', lines: [] }],
    };
    let s = newJourney(1, story, RIVER_START);
    for (let k = 1; k <= 4; k++) {
      const failed = structuredClone(s);
      failed.encounter!.outcome = 'failed';
      s = proceed(leaveEncounter(failed, story), story);
      expect(s.encounter?.def.id).toBe('sandbar');
      expect(s.mornings).toBe(k + 1);
    }
  });
});
