import { describe, expect, it } from 'vitest';
import { RIVER, RIVER_START, RIVER_TALK } from '../story/river';
import type { RoundScript } from '../story/script';
import { chooseAction, viewFor } from './ai';
import { jokerCard } from './cards';
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
  turnIn,
  goTo,
  hubOptions,
  type JourneyState,
  type StoryDef,
  STORY_CONFIG,
} from './journey';
import { Rng } from './rng';
import { newSession, nextSessionHand, submit, type TableSession } from './session';
import { DOCK_FEE, TROUBLE, coveredHands } from './snags';

/** Plays the voyage as a careful captain would; returns every state passed through. */
function autopilot(seed: number, guard = 40000): JourneyState[] {
  let s = newJourney(seed, RIVER, RIVER_START);
  const seen = [s];
  const rng = new Rng(seed);
  for (let i = 0; i < guard && !s.done; i++) {
    const step = currentStep(s, RIVER)!;
    if (step.type === 'caption') s = proceed(s, RIVER);
    else if (step.type === 'council') s = castOff(s, RIVER);
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
      // The coal came from the foreman (the bunker never empties for good).
      expect(last.coal).toBeGreaterThan(0);
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
      s = submit(s, me, chooseAction('careful', viewFor(s.round!, me, s.config), s.config, rng));
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
    expect(paid.encounter?.def.id).toBe('underway');
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
  const context = { hand: 1, pile: 20, seed: 9, day: 2, trips: false, lost: 0, foldedOut: false, met: false, attempt: 1, fixed: [] as { id: string; snag: number }[] };
  const sandy = RIVER_TALK.sandbar as (c: typeof context) => RoundScript;
  const deck = RIVER_TALK.deck as (c: typeof context) => RoundScript;

  it('never quips over the opening, or the same line twice in a day', () => {
    expect(sandy(context).flop).toHaveLength(2);
    const seen = [2, 4].map((hand) => String(sandy({ ...context, hand }).flop?.[0].text));
    expect(new Set(seen).size).toBe(2);
  });

  it('has whoever takes on a trouble say so at the deck game', () => {
    const lines = deck({ ...context, fixed: [{ id: 'gus', snag: TROUBLE.brokenPaddle }] }).verdict!;
    expect(lines[0].who).toBe('gus');
    expect(lines[0].text).toContain('Broken Paddle');
    expect(deck(context).verdict).toEqual([]);
  });

  it('has whoever takes a trouble that isn\'t theirs hand it to whoever fixes it', () => {
    const lines = deck({ ...context, fixed: [{ id: 'willie', snag: TROUBLE.twistedAxle }] }).verdict!;
    expect(lines.map((l) => l.who)).toEqual(['willie', 'gus']);
    expect(lines[0].text).toContain('Gus');
  });

  it('has the foreman never say what he wants, until he has it', () => {
    const depot = RIVER_TALK.depot as (c: typeof context) => RoundScript;
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
  const at = (time: 'morning' | 'evening', flags: string[] = []) => {
    const s = newJourney(1, RIVER, RIVER_START);
    return { ...s, step: RIVER.days[0].steps.findIndex((x) => x.type === 'hub'), encounter: null, time, flags };
  };
  const ids = (s: JourneyState) => hubOptions(s, RIVER).map((o) => o.option.id);

  it('offers what the time of day allows, and what you know about', () => {
    expect(ids(at('evening'))).toEqual(['anchor', 'bettendorf', 'chandler', 'mercantile']);
    expect(ids(at('morning'))).toEqual(['chandler', 'mercantile', 'depot']);
    expect(ids(at('morning', ['met:deckIntel', 'jobFound']))).toEqual(['chandler', 'mercantile', 'depot', 'tournament', 'job:timber', 'job:cattle', 'job:mail']);
  });

  it('won\'t have you at the tournament without the coal for the climb', () => {
    const s = { ...at('morning', ['met:deckIntel']), coal: 5 };
    expect(hubOptions(s, RIVER).find((o) => o.option.id === 'tournament')?.open).toBe(false);
    expect(() => goTo(s, RIVER, 'tournament')).toThrow();
  });

  it('comes back to the hub after an option, the day moved on', () => {
    let s = goTo(at('morning', ['jobFound']), RIVER, 'job:cattle');
    const purse = s.purse;
    s = proceed(s, RIVER);
    expect(s.purse).toBeGreaterThan(purse);
    expect(currentStep(s, RIVER)?.type).toBe('hub');
    expect(s.time).toBe('evening');
    expect(s.flags).not.toContain('jobFound');
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
  const context = { hand: 2, pile: 20, seed: 9, day: 2, trips: false, lost: 0, foldedOut: false, met: true, attempt: 1, fixed: [] as { id: string; snag: number }[] };
  const sandy = RIVER_TALK.sandbar as (c: typeof context) => RoundScript;

  it('doesn\'t repeat itself from one day to the next', () => {
    const said = [1, 2, 3].flatMap((attempt) => [2, 4, 6, 8].map((hand) => String(sandy({ ...context, attempt, hand }).flop?.[0].text)));
    expect(new Set(said).size).toBe(said.length);
  });

  it('opens each morning differently', () => {
    const open = [2, 3, 4].map((attempt) => String(sandy({ ...context, hand: 1, attempt }).deal?.[0].text));
    expect(new Set(open).size).toBe(3);
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
