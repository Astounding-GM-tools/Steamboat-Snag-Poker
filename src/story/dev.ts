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
/** Day one from the encounter `id` (inside a scene, the scene's steps from there), and the day's steps after it to follow. */
const dayOne = (id: string, state: JourneyState): JourneyState => {
  const steps = RIVER.days[0].steps;
  const i = steps.findIndex((s) => (s.type === 'scene' ? s.steps.some((x) => isEncounter(x, id)) : isEncounter(s, id)));
  const s = steps[i];
  const from = s.type === 'scene' ? s.steps.slice(s.steps.findIndex((x) => isEncounter(x, id))) : [s];
  return jumpTo({ ...state, step: i + 1 }, RIVER, from);
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
  // Out from Muscatine on the river map: the harbour master's done with, the dock fee paid.
  { label: 'Ambling along', state: () => jumpTo({ ...start(), step: RIVER.days[0].steps.findIndex((s) => s.type === 'steam') }, RIVER, []) },
  { label: 'Under way', state: () => dayOne('underway', { ...start(), river: { leg: 'chapter-1', t: SANDBAR_AT } }) },
  { label: 'Sandbar', state: () => dayOne('sandbar', { ...start(), river: { leg: 'chapter-1', t: SANDBAR_AT } }) },
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
