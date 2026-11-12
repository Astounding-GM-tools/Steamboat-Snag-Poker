/**
 * The Tri-Cities (or four): the first hub. Davenport's queue, Rock Island's
 * coal, Moline's market, Bettendorf's bets.
 */
import { morningStrength, snagDef, type Hub, type HubOption, type Slot, type Step, type Talk } from '../../mechanics';
import { t } from '../../../i18n';
import { NAGS, deckGame, deckLines } from '../../characters/crew';
import { FLAG } from '../../flags';
import { capital } from '../../lines';
import { BREAKFAST_COST, CLIMB_COAL, DOCKING_FEE, GAYLORD_FIRST_HIRE, GAYLORD_LAST_DAY, GAYLORD_LEAVES, JOB_COAL, JOB_PAY, MORNING_ENTRY, READY_STRENGTH } from '../../numbers';
import { gaylordPlaysYourSeat, tournament } from '../03_rapids';
import { breakfast, breakfastTalk, saloon, triCitiesTalk } from './bettendorf';
import { depot, depotTalks } from './depot';

const DAYTIME: Slot[] = ['morning', 'afternoon'];

/** A job: it fills the slot, burns its coal and pays. */
const job = (id: string, text: string, pays: number, flag?: string): HubOption => ({
  id: `job:${id}`,
  times: DAYTIME,
  coal: JOB_COAL,
  ...(flag ? { flag } : {}),
  steps: [{ type: 'caption', lines: [{ text }], effects: { purse: pays, coal: -JOB_COAL, ...(flag ? { clear: flag } : {}) } }, { type: 'slot' }],
});

export const triCities: Hub = {
  advice: (state) => {
    if (state.submenu === 'jobs') return { who: 'willie', text: 'At these coal prices the mail runs don’t pay, Captain.' };
    if (state.flags.includes(FLAG.heardOfPilot) && morningStrength(state) < READY_STRENGTH) return NAGS[state.mornings % NAGS.length];
    const troubled = state.snags.find((j) => snagDef(j.index).kind === 'trouble');
    if (troubled && state.time === 'evening') return { who: 'gus', text: `${capital(t(`joker.${troubled.index}`))} wants seeing to, Captain. A night at anchor would do it.` };
    if (state.purse < MORNING_ENTRY) return { who: 'willie', text: 'We’re near broke, Captain. I could wade ashore and ask around.' };
    if (state.flags.includes(FLAG.heardOfPilot) && state.coal < CLIMB_COAL) return { who: 'gus', text: 'She’ll want a full bunker for the rapids, Captain.' };
    if (state.time === 'evening') return { who: 'willie', text: 'They’re batty about betting in Bettendorf, Captain. Everyone knows that, up and down the river.' };
    return null;
  },
  options: [
    {
      id: 'anchor',
      times: ['evening'],
      steps: [
        { type: 'caption', lines: [{ text: 'You anchor downstream of the dock, where it’s free. Willie wades ashore, looking for work and gossip.' }], effects: { flag: FLAG.jobFound } },
        { ...deckLines, encounter: { ...deckGame, id: 'deckIntel' } } as Step,
        { type: 'dawn' },
      ],
    },
    {
      id: 'mercantile',
      times: DAYTIME,
      cost: DOCKING_FEE,
      steps: [
        {
          type: 'council',
          title: 'hub.mercantile.name',
          advice: [{ who: 'gus', text: 'An overhaul gets twice the work from the same coal, Captain.' }],
          trader: ['coal', 'sellCoal', 'sellSalvage', 'food', 'fireman', 'hammocks', 'boilerOverhaul', 'engineOverhaul'],
          coal: 0,
          leave: 'Done',
        },
        { type: 'slot' },
      ],
    },
    { id: 'depot', times: DAYTIME, steps: depot },
    { id: 'bettendorf', times: ['evening'], steps: saloon },
    { id: 'tournament', times: ['morning'], flag: FLAG.heardOfPilot, coal: CLIMB_COAL, steps: tournament },
    { id: 'seat', times: ['morning'], flag: FLAG.gaylordsClient, from: GAYLORD_LAST_DAY, to: GAYLORD_LAST_DAY, coal: CLIMB_COAL, steps: gaylordPlaysYourSeat },
    { id: 'breakfast', times: ['morning'], cost: BREAKFAST_COST, from: GAYLORD_FIRST_HIRE, to: GAYLORD_LEAVES, steps: breakfast },
    {
      id: 'jobs',
      times: DAYTIME,
      steps: [],
      menu: [
        job('timber', 'You herd timber off the bridge piers all day. It’s bigger than the boat.', JOB_PAY.timber, FLAG.jobFound),
        job('cattle', 'You ferry a herd of cattle across the river, and spend the evening cleaning up the manure.', JOB_PAY.cattle, FLAG.jobFound),
        job('mail', 'You run the mail to Moline and back, and Gus counts every shovel.', JOB_PAY.mail),
      ],
    },
  ],
};

export const triCitiesTalks: Record<string, Talk> = {
  triCities: triCitiesTalk,
  breakfast: breakfastTalk,
  ...depotTalks,
};
