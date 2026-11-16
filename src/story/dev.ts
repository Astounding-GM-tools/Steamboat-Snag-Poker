/**
 * In development: jump straight to a scene (the list on the title), with a
 * plausible boat, instead of playing there.
 */
import { jokerCard } from '../engine';
import { FLAG } from './flags';
import { DOCK_FEE, goTo, jumpTo, newJourney, type HubOption, type JourneyState, type Slot, type Step } from './mechanics';
import { RIVER, RIVER_START } from './river';
import { SANDBAR_AT } from './chapters/01_muscatine';

const start = () => ({ ...newJourney(Date.now() >>> 0, RIVER, RIVER_START), mornings: 1, strength: 18 });
const isEncounter = (s: Step, id: string) => s.type === 'encounter' && s.encounter.id === id;
/** The steps an encounter sits among: a scene's, or a stretch's main event's. */
const inner = (s: Step): Step[] | null => (s.type === 'scene' ? s.steps : s.type === 'steam' && s.main ? s.main.steps : null);
/**
 * Day one from the encounter `id` (inside a scene or a stretch's main event, its steps from there; after
 * a main event, the rest of its stretch), and the day's steps after it to follow.
 */
const dayOne = (id: string, state: JourneyState): JourneyState => {
  const steps = RIVER.days[0].steps;
  const i = steps.findIndex((s) => (inner(s) ?? [s]).some((x) => isEncounter(x, id)));
  const s = steps[i];
  const within = inner(s);
  const from = within ? within.slice(within.findIndex((x) => isEncounter(x, id))) : [s];
  const rest: Step[] = s.type === 'steam' ? [{ type: 'steam', leg: s.leg, to: s.to }] : [];
  return jumpTo({ ...state, step: i + 1 }, RIVER, [...from, ...rest]);
};
const hubIndex = RIVER.days[0].steps.findIndex((s) => s.type === 'hub');
const hub = (time: Slot, flags: string[] = [], coal = 2): JourneyState => ({ ...start(), step: hubIndex, pending: [], encounter: null, place: 'triCities', time, flags, coal, purse: 30, mornings: 3 });
const option = (id: string): HubOption => RIVER.hubs!.triCities.options.find((o) => o.id === id)!;
/** The Tournament from a later table (the steps before it passed by, the draw kept). */
const tournament = (skip: number, day = 3): JourneyState => {
  const [draw, ...rest] = option('tournament').steps;
  return jumpTo({ ...hub('morning', [FLAG.heardOfPilot], 6), mornings: day }, RIVER, [draw, ...rest.slice(skip)]);
};

export const SCENES: { label: string; state: () => JourneyState }[] = [
  { label: 'Harbour master', state: () => dayOne('harbourTalk', { ...start(), snags: [jokerCard(DOCK_FEE)] }) },
  // The river and nothing else, round and round: Muscatine to LeClaire, no islands, no chatter, no encounters.
  // The whole river on the chart, Dubuque down to St. Louis, round and round: for looking the chart over (Skip races).
  { label: 'Endless amble: the whole river', state: () => jumpTo({ ...start(), flags: ['dev:endless', 'downbound'] }, RIVER, [{ type: 'steam', leg: 'whole-river', to: 1, seconds: 2500 }]) },
  { label: 'Endless ambling', state: () => jumpTo({ ...start(), flags: ['dev:endless'] }, RIVER, [{ type: 'steam', leg: 'chapter-1-upbound', to: 1 }]) },
  // Out from Muscatine on the river map: the harbour master's done with, the dock fee paid.
  { label: 'Ambling along', state: () => jumpTo({ ...start(), step: RIVER.days[0].steps.findIndex((s) => s.type === 'steam') }, RIVER, []) },
  { label: 'Under way', state: () => dayOne('underway', { ...start(), river: { leg: 'chapter-1-upbound', t: SANDBAR_AT } }) },
  { label: 'Sandbar', state: () => dayOne('sandbar', { ...start(), river: { leg: 'chapter-1-upbound', t: SANDBAR_AT } }) },
  { label: 'Tri-Cities, evening', state: () => hub('evening') },
  { label: 'Tri-Cities, morning', state: () => hub('morning', [FLAG.heardOfPilot, FLAG.jobFound], 6) },
  { label: 'Deck game (Willie’s intel)', state: () => jumpTo(hub('evening'), RIVER, option('anchor').steps.slice(1)) },
  { label: 'Bettendorf Saloon', state: () => goTo(hub('evening'), RIVER, 'bettendorf') },
  { label: 'Coal Depot', state: () => goTo(hub('morning'), RIVER, 'depot') },
  { label: 'Pilot Games, morning', state: () => tournament(0) },
  { label: 'Pilot Games, noon', state: () => tournament(1) },
  { label: 'Pilot Games, noon, the Bingo day', state: () => tournament(1, 5) },
  { label: 'Pilot Games, noon, after Gaylord', state: () => tournament(1, 9) },
  { label: 'The Rapids: Moline Chain', state: () => tournament(2) },
  { label: 'The Rapids: Campbell’s Chain', state: () => tournament(3) },
  { label: 'The Rapids: the Long Reach', state: () => tournament(5) },
  { label: 'Breakfast, Gaylord for hire', state: () => goTo({ ...hub('morning', [FLAG.heardOfPilot], 6), mornings: 3 }, RIVER, 'breakfast') },
  { label: 'Gaylord plays your seat', state: () => goTo({ ...hub('morning', [FLAG.heardOfPilot, FLAG.gaylordsClient], 6), mornings: 8 }, RIVER, 'seat') },
  { label: 'Breakfast, Gaylord’s loan', state: () => goTo({ ...hub('morning', [FLAG.heardOfPilot, FLAG.beatGaylord], 6), mornings: 7 }, RIVER, 'breakfast') },
  { label: 'Bettendorf, after the week', state: () => goTo({ ...hub('evening', [FLAG.heardOfPilot, 'met:triCities'], 6), mornings: 10 }, RIVER, 'bettendorf') },
];
