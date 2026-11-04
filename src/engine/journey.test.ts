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
  type JourneyState,
  type StoryDef,
  STORY_CONFIG,
} from './journey';
import { Rng } from './rng';
import { newSession, nextSessionHand, submit, type TableSession } from './session';
import { DOCK_FEE, TROUBLE, coveredHands } from './snags';

/** Plays the voyage as a careful captain would, buying a little at each council; returns every state passed through. */
function autopilot(seed: number, guard = 3000): JourneyState[] {
  let s = newJourney(seed, RIVER, RIVER_START);
  const seen = [s];
  const rng = new Rng(seed);
  for (let i = 0; i < guard && !s.done; i++) {
    const step = currentStep(s, RIVER)!;
    if (step.type === 'caption') s = proceed(s, RIVER);
    else if (step.type === 'council') {
      for (const item of ['sparePole', 'coal', 'coal']) if (canBuy(s, RIVER, item)) s = buy(s, RIVER, item);
      s = castOff(s, RIVER);
    } else if (step.type === 'encounter') {
      const e = s.encounter!;
      if (e.outcome) s = leaveEncounter(s, RIVER);
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

  it('plays days one and two through, whatever the cards, and survives a trip through JSON at every step', () => {
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const states = autopilot(seed);
      const last = states.at(-1)!;
      expect(last.done, `seed ${seed}: nights ${last.nights} day ${last.day}, step ${last.step}, ${currentStep(last, RIVER)?.type} ${last.encounter?.def.id} hand ${last.encounter?.session.hand}, pending ${last.pending.length}`).toBe(true);
      for (const s of states) expect(JSON.parse(JSON.stringify(s))).toEqual(s);
      // The coal came from the foreman (the bunker never empties for good).
      expect(last.coal).toBeGreaterThan(0);
    }
  });

  it('turns in from the deck game when you like', () => {
    let s = autopilot(3).find((x) => x.encounter?.def.id === 'deck' && x.encounter.session.phase === 'handEnd' && !x.encounter.outcome)!;
    expect(s).toBeTruthy();
    s = turnIn(s, RIVER);
    expect(s.encounter?.outcome).toBe('solved');
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
  const context = { hand: 1, pile: 20, seed: 9, day: 2, fixed: [] as { id: string; snag: number }[] };
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

  it('has Lars sing until he has a week of words', () => {
    const fixing = (day: number) => deck({ ...context, day, fixed: [{ id: 'lars', snag: TROUBLE.brokenPole }] }).verdict![0].text;
    expect(fixing(2)).toContain('♪');
    expect(fixing(9)).toBe('Ja. Fiks.');
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

  it('relents the second time an encounter is failed: on, as if solved, with its effects', () => {
    // A captain who plays nothing at all on the River: every showdown lost.
    let s = newJourney(2, RIVER, RIVER_START);
    let relented = false;
    for (let i = 0; i < 3000 && !s.done; i++) {
      const step = currentStep(s, RIVER)!;
      if (step.type === 'caption') {
        if (step.lines.some((l) => l.text.includes('throws you a line'))) relented = true;
        s = proceed(s, RIVER);
      } else if (step.type === 'council') s = castOff(canCastOff(s, RIVER) ? s : { ...s, coal: 6 }, RIVER);
      else if (step.type === 'encounter') {
        const e = s.encounter!;
        if (e.outcome) s = leaveEncounter(s, RIVER);
        else if (e.session.phase === 'hand') {
          const round = e.session.round!;
          s = playEncounter(s, myMoveOwed(s) ? (round.street === 2 ? { type: 'compose', cardIds: [], jokers: 0 } : { type: 'draw', cardIds: [] }) : null);
        } else s = handDone(s, RIVER);
      }
    }
    expect(s.done).toBe(true);
    expect(relented).toBe(true);
  });
});
