/**
 * Bettendorf: batty about betting. The saloon's table, played till someone
 * wins with three of a kind; and breakfast, where Gaylord is staying.
 */
import { Rng, type RoundScript, type Step, type TalkContext } from '../../mechanics';
import { breakfastTalk, gaylordAtTheSaloon } from '../../characters/gaylord';
import { FLAG } from '../../flags';
import { say, you } from '../../lines';
import { BREAKFAST_STRENGTH, GAYLORD_FEE, GAYLORD_FIRST_HIRE, GAYLORD_LEAVES, GAYLORD_PURSE, LOAN, TRI_CITIES_HANDS, TRI_CITIES_PURSE } from '../../numbers';

export const saloon: Step[] = [
  {
    type: 'encounter',
    encounter: {
      id: 'triCities',
      stake: 'purse',
      rivals: [
        { id: 'odds', ai: 'loose', money: TRI_CITIES_PURSE },
        { id: 'finlay', ai: 'loose', money: TRI_CITIES_PURSE },
      ],
      guests: [
        { rival: { id: 'tripp', ai: 'careful', money: TRI_CITIES_PURSE }, to: GAYLORD_FIRST_HIRE - 1 },
        { rival: { id: 'gaylord', ai: 'gambler', money: GAYLORD_PURSE }, from: GAYLORD_FIRST_HIRE, to: GAYLORD_LEAVES },
        { rival: { id: 'tripp', ai: 'careful', money: TRI_CITIES_PURSE }, from: GAYLORD_LEAVES + 1 },
      ],
      marks: { rival: 'gaylord', flag: FLAG.beatGaylord },
      goal: { type: 'trips' },
      hands: TRI_CITIES_HANDS,
    },
    solved: [],
  },
  { type: 'caption', lines: [{ text: 'The crew stay aboard, playing Snag for buttons while Lars sings.' }] },
  { type: 'dawn' },
];

/** Treating the crew at the saloon. And look, there's Gaylord, what a coincidence. He only brings up what he'd offer you. */
export const breakfast: Step[] = [
  { type: 'caption', lines: [{ text: 'You treat the crew to breakfast at the Bettendorf saloon. Lars has two.' }], effects: { tomorrow: BREAKFAST_STRENGTH } },
  {
    type: 'encounter',
    // Only talk (RIVER_TALK.breakfast): what he brings up depends on who you are to him.
    encounter: { id: 'breakfast', stake: 'purse', rivals: [{ id: 'gaylord', ai: 'gambler', money: 40 }], goal: { type: 'evening' }, hands: 1, rules: { pot: false } },
    solved: [],
    choices: {
      hire: { effects: { purse: -GAYLORD_FEE, flag: FLAG.gaylordsClient } },
      take: { effects: { purse: LOAN, flag: FLAG.owesGaylord } },
      pass: {},
    },
  },
  { type: 'slot' },
];

/** Odds will lay you odds on anything. */
const ODDS = ['Two to one you swap.', 'Evens the River’s red.', 'Eleven to four on rain.', 'Six to four the cat jumps left.', 'Five to one that boat of yours floats.', 'I’ve got a dollar on Finlay. Don’t tell Finlay.'];

/** The Tri-Cities: how many cities there are is a matter of opinion, and so is what settles a game. */
export function triCitiesTalk({ hand, seed, trips, day, met, journey }: TalkContext): RoundScript {
  const client = journey.flags.includes(FLAG.gaylordsClient);
  return {
    // Back again: Tripp (when he's at the table) remembers you, and Gaylord needn't introduce himself twice.
    ...(hand === 1 && met
      ? {
          deal: [
            ...(day < GAYLORD_FIRST_HIRE || day > GAYLORD_LEAVES ? [say('tripp', 'Back again, Captain? Same house rule: three of a kind takes it.')] : []),
            ...gaylordAtTheSaloon(day, client, journey.flags.includes('met:gaylord')),
          ],
        }
      : {}),
    ...(hand === 1 && !met
      ? {
          deal: [
            say('willie', 'Here we are, at Bettendorf. They’re batty about betting here, Captain.'),
            { ...say('tripp', 'House rule: we play till somebody wins with three of a kind. Three cities, three of a kind.'), replies: [{ label: 'Three?' }] },
            you('I counted four cities on the way in.'),
            say('odds', ['Four, if you ask Bettendorf. Bettendorf says hold out for four of a kind.', 'Three to one they win the argument by summer.']),
            ...gaylordAtTheSaloon(day, client),
          ],
        }
      : hand === 3
        ? { flop: [{ size: 'aside', who: 'lenny', text: '♪ Everybody knows that the thaw is flowing, everybody knows that the river’s strong ♪' }] }
        : { flop: [{ size: 'aside', who: 'odds', text: new Rng(seed).shuffle(ODDS)[hand % ODDS.length] }] }),
    verdict: trips
      ? [say('tripp', 'Three of a kind wins the game. That settles it for tonight.')]
      : hand === TRI_CITIES_HANDS
        ? [say('tripp', 'No three of a kind tonight. We’ll call it a draw, and argue about it tomorrow.')]
        : [],
  };
}

export { breakfastTalk };
