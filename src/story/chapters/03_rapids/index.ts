/**
 * The Rock Island Rapids: the Pilot Games at Davenport, Ellie Sawyer, and the
 * climb to LeClaire. See docs/story.md, "The Pilot's Tournament".
 */
import { Rng, TROUBLE, morningStrength, type RoundScript, type Step, type StoryLine, type Talk, type TalkContext } from '../../mechanics';
import { hiredTalk, quarrel } from '../../characters/gaylord';
import { FLAG } from '../../flags';
import { say, you } from '../../lines';
import { CLIMB_HANDS, GAYLORD_LAST_DAY, MORNING_ENTRY, NOON_ENTRY, READY_STRENGTH, STAGE_STRENGTH, TOURNAMENT_HANDS } from '../../numbers';
import type { SpeechLine } from '../../../ui/Speech.svelte';

/** Where a day lost at the Games goes on from. */
const DAY_OVER = 'dayOver';

const ENTRANTS = [
  { id: 'konrad', ai: 'bully' as const },
  { id: 'maxMoritz', ai: 'griefer' as const },
  { id: 'ignatz', ai: 'anarchist' as const },
  { id: 'nemo', ai: 'dreamer' as const },
  { id: 'walrus', ai: 'shark' as const },
  { id: 'lenny', ai: 'defeatist' as const },
  { id: 'eliza', ai: 'predator' as const },
];

/** Out of coal on the rapids: back where you started, and the queue again. */
const sweptBack: Step[] = [
  {
    type: 'caption',
    lines: [
      { text: 'The bunker’s empty. The river takes the Best Intentions, and hands her back at Davenport.' },
      { who: 'ellie', text: 'Nobody gets it every time, Captain. Same time tomorrow.' },
      { who: 'gus', text: 'We’ll do better next time, Captain.' },
    ],
  },
  { type: 'nightfall' },
];

/** Calling it off: the same way down, with the coal you saved, and no shame in it. */
const turnedBack: Step[] = [
  {
    type: 'caption',
    lines: [
      { who: 'ellie', text: 'Good. That’s the first sensible thing anyone’s said on this river. Back of the queue, Captain.' },
      { who: 'gus', text: 'We kept the coal, Captain. That counts.' },
    ],
  },
  { type: 'nightfall' },
];

/** A stage of the climb: as many pushes as the coal allows, the crew fresh for each, and it can only be worn down. */
const stage = (id: string, strength: number, jokers: number[]): Step => ({
  type: 'encounter',
  encounter: {
    id,
    stake: 'strength',
    rivals: [{ id, ai: 'stubborn', money: strength, jokers, obstacle: true, steady: true }],
    goal: { type: 'clear' },
    hands: CLIMB_HANDS,
    push: true,
    rules: { jokerForfeit: 0, drainPerJoker: 0 },
  },
  jolt: true,
  solved: [],
  failed: [],
  sweptBack,
  turnedBack,
});

/** The Pilot Tournament, at Davenport. Lost at either table, the day's done. */
export const tournament: Step[] = [
  { type: 'draw', entrants: ENTRANTS, tableSize: 3, finalists: 2, regular: { id: 'gaylord', ai: 'gambler', until: GAYLORD_LAST_DAY, engaged: FLAG.gaylordsClient } },
  {
    type: 'encounter',
    encounter: {
      id: 'morning',
      stake: 'purse',
      rivals: [],
      joined: 'mates',
      entry: MORNING_ENTRY,
      goal: { type: 'lastStanding' },
      hands: TOURNAMENT_HANDS,
      rules: { drainPerJoker: 0, jokerForfeit: 0 },
    },
    solved: [],
    failed: [],
    onFail: DAY_OVER,
  },
  {
    type: 'encounter',
    encounter: {
      id: 'noon',
      stake: 'purse',
      rivals: [{ id: 'ellie', ai: 'swashbuckler', money: NOON_ENTRY }],
      joined: 'finalists',
      entry: NOON_ENTRY,
      marks: { rival: 'gaylord', flag: FLAG.beatGaylord },
      goal: { type: 'lastStanding', host: 'ellie' },
      hands: TOURNAMENT_HANDS,
      rules: { drainPerJoker: 0, jokerForfeit: 0 },
    },
    solved: [{ who: 'ellie', text: 'That’s you, Captain. Get your hat.' }],
    failed: [{ who: 'ellie', text: 'Not today, Captain. Same time tomorrow.' }],
    onFail: DAY_OVER,
  },
  stage('molineChain', STAGE_STRENGTH.molineChain, [TROUBLE.bustedBoiler]),
  stage('campbellsChain', STAGE_STRENGTH.campbellsChain, [TROUBLE.bustedBoiler, TROUBLE.fatigue, TROUBLE.brokenPaddle]),
  { type: 'caption', lines: [{ text: 'Hampton. Deep water close in to the shore, and the only breath you’ll get.' }, { who: 'ellie', text: 'St. Louis chain, Cabin chain, Sycamore, Smith’s. They don’t stop, Captain, so don’t you.' }] },
  stage('longReach', STAGE_STRENGTH.longReach, [TROUBLE.bustedBoiler, TROUBLE.fatigue, TROUBLE.brokenPaddle, TROUBLE.twistedCrankshaft, TROUBLE.brokenPole, TROUBLE.brokenHeart]),
  { type: 'travel', coal: 0, to: 'leClaire' },
  { type: 'leave' },
  { type: 'nightfall', label: DAY_OVER },
];

/** Lost at noon, the day's over; won, the climb. In your seat, Gaylord. */
const noon = tournament.find((s) => s.type === 'encounter' && s.encounter.id === 'noon') as Extract<Step, { type: 'encounter' }>;
const climb = tournament.slice(tournament.indexOf(noon) + 1);
export const gaylordPlaysYourSeat: Step[] = [
  { type: 'draw', entrants: ENTRANTS, tableSize: 3, finalists: 2 },
  { ...noon, encounter: { ...noon.encounter, id: 'hired', proxy: 'gambler' } },
  ...climb,
];

/** The queue at Davenport. */
function morningTalk({ met }: TalkContext): RoundScript {
  return met ? {} : { deal: [say('willie', 'Five dollars in, Captain. Last one with money sits down with Ellie at noon.')] };
}

function noonTalk({ met, day }: TalkContext): RoundScript {
  const intro = [say('ellie', ['Ellie Sawyer, out of Cordova. I take one boat up the rapids today.', 'Whoever wins this table. Or if I win it myself, the runner-up.']), say('willie', 'They say you’re crazy, taking boats up on the thaw.'), say('ellie', 'Crazy is going up without me.')];
  return { deal: [...(met ? [] : intro), ...quarrel(day)] };
}

/** The climb: Ellie calling the marks, the chains named for what they sank, and nobody joking. */
const climbLines = (): Record<string, { first: SpeechLine[]; marks: string[]; cleared: string }> => ({
  molineChain: {
    first: [say('ellie', 'Mr. Klemm, every pound of steam you have. Captain, do as I say and nothing else.'), say('gus', 'Every push burns a load, Captain. We’ve six. There’s no more where they came from.')],
    marks: ['Jackstaff on the white house. Hold her there.', 'That’s Brazil Rock. She was a good boat, the Brazil.', 'Mason’s Rock to port. Don’t look at it.', 'Duck Creek chain. The War Eagle sat here a week.'],
    cleared: 'That’s the Moline chain, Captain. That was the easy one.',
  },
  campbellsChain: {
    first: [say('ellie', 'Campbell’s chain. The Danube, the Louisville, the Little Eagle. Standing wave off the head of the island.')],
    marks: ['Take the wave on the bow. On the bow!', 'Hold her. Hold her. Now.', 'The Danube’s down there, somewhere.', 'Next mark’s the church. If you can see it.'],
    cleared: 'Campbell’s is behind us. Tell your man to breathe.',
  },
  longReach: {
    first: [say('ellie', 'Get a line ashore to the ring. Capstan, every hand. We’ll haul her up if we can’t steam her.')],
    marks: ['St. Louis chain. The St. Louis was the dearest loss on the river.', 'Cabin chain! Mind the Mary C.!', 'Sycamore. Limestone. It doesn’t give.', 'Smith’s. Nearly. Don’t you dare.'],
    cleared: 'That’s the top. That’s LeClaire. You can breathe, Captain.',
  },
});

function climbTalk(id: string) {
  return ({ hand, seed, attempt, journey }: TalkContext): RoundScript => {
    const { coal } = journey;
    const warned: SpeechLine[] =
      id === 'molineChain' && morningStrength(journey) < READY_STRENGTH
        ? [{ ...say('gus', 'She hasn’t the strength for this, Captain.'), replies: [{ label: 'Full steam' }] }, you('Just give me all she’s got, Mr. Klemm.'), say('gus', 'It does not work like that, Captain.')]
        : [];
    const { first, marks, cleared } = climbLines()[id];
    const mark = new Rng(seed + attempt).shuffle(marks)[hand % marks.length];
    const spent = coal > 0 ? `That’s a load gone, Captain. ${coal} left.` : 'That’s the last of the coal, Captain.';
    return {
      ...(hand === 1 && attempt === 1 ? { deal: [...warned, ...first] } : {}),
      ...(hand % 2 === 0 ? { flop: [{ size: 'aside' as const, who: 'ellie', text: mark }] } : {}),
      verdict: [
        { ...say('ellie', cleared), when: 'wonAll' },
        { ...say('gus', spent), when: 'lostAll' },
      ],
    };
  };
}

/** Gus, after a failed push: how much of it you took. */
export function pushReading(taken: number): StoryLine {
  return {
    who: 'gus',
    text:
      taken < 0.25
        ? 'She barely felt that, Captain.'
        : taken < 0.5
          ? 'We dented her, Captain. A quarter, no more.'
          : taken < 0.75
            ? 'Half of her, Captain. It wasn’t enough.'
            : 'Nearly, Captain. Another push like that…',
  };
}

export const rapidsTalk: Record<string, Talk> = {
  morning: morningTalk,
  noon: noonTalk,
  hired: hiredTalk,
  molineChain: climbTalk('molineChain'),
  campbellsChain: climbTalk('campbellsChain'),
  longReach: climbTalk('longReach'),
};

/** Above the rapids, so far. */
export const leClaire: Step[] = [{ type: 'caption', title: 'To be continued', lines: [] }];
