/**
 * In development: jump straight to a scene (the list on the title), with a
 * plausible boat, instead of playing there.
 */
import { DOCK_FEE, goTo, jokerCard, jumpTo, newJourney, type HubOption, type JourneyState, type Slot, type Step } from '../engine';
import { RIVER, RIVER_START } from './river';

const start = () => ({ ...newJourney(Date.now() >>> 0, RIVER, RIVER_START), mornings: 1, strength: 18 });
const dayOne = (id: string): Step[] => {
  const steps = RIVER.days[0].steps;
  return steps.slice(steps.findIndex((s) => s.type === 'encounter' && s.encounter.id === id));
};
const hubIndex = RIVER.days[0].steps.findIndex((s) => s.type === 'hub');
const hub = (time: Slot, flags: string[] = [], coal = 2): JourneyState => ({ ...start(), step: hubIndex, pending: [], encounter: null, place: 'triCities', time, flags, coal, purse: 30, mornings: 3 });
const option = (id: string): HubOption => RIVER.hubs!.triCities.options.find((o) => o.id === id)!;
/** The Tournament from a later table (the steps before it passed by, the draw kept). */
const tournament = (skip: number, day = 3): JourneyState => {
  const [draw, ...rest] = option('tournament').steps;
  return jumpTo({ ...hub('morning', ['met:deckIntel'], 6), mornings: day }, RIVER, [draw, ...rest.slice(skip)]);
};

export const SCENES: { label: string; state: () => JourneyState }[] = [
  { label: 'Harbour master', state: () => jumpTo({ ...start(), snags: [jokerCard(DOCK_FEE)] }, RIVER, dayOne('harbourTalk')) },
  { label: 'Under way', state: () => jumpTo(start(), RIVER, dayOne('underway')) },
  { label: 'Sandbar', state: () => jumpTo(start(), RIVER, dayOne('sandbar')) },
  { label: 'Tri-Cities, evening', state: () => hub('evening') },
  { label: 'Tri-Cities, morning', state: () => hub('morning', ['met:deckIntel', 'jobFound'], 6) },
  { label: 'Deck game (Willie’s intel)', state: () => jumpTo(hub('evening'), RIVER, option('anchor').steps.slice(1)) },
  { label: 'Bettendorf Saloon', state: () => goTo(hub('evening'), RIVER, 'bettendorf') },
  { label: 'Coal Depot', state: () => goTo(hub('morning'), RIVER, 'depot') },
  { label: 'Pilot Games, morning', state: () => tournament(0) },
  { label: 'Pilot Games, noon', state: () => tournament(1) },
  { label: 'Pilot Games, noon, the Bingo day', state: () => tournament(1, 5) },
  { label: 'Pilot Games, noon, after Gaylord', state: () => tournament(1, 9) },
  { label: 'The Rapids', state: () => tournament(2) },
  { label: 'Gaylord plays your seat', state: () => goTo({ ...hub('morning', ['met:deckIntel'], 6), mornings: 3 }, RIVER, 'gaylord') },
  { label: 'Gaylord’s loan', state: () => goTo({ ...hub('morning', ['met:deckIntel', 'beatGaylord'], 6), mornings: 7 }, RIVER, 'loan') },
  { label: 'Bettendorf, after the week', state: () => goTo({ ...hub('evening', ['met:deckIntel', 'met:triCities'], 6), mornings: 10 }, RIVER, 'bettendorf') },
];
