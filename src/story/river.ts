/**
 * Steamboat to St. Louis: the voyage's chapters put together. The chapters
 * say what happens, story/characters who recurs, story/mechanics how it all
 * plays; docs/story.md says why.
 */
import type { StoryDef, Talk } from './mechanics';
import { deckIntelTalk, deckTalk, stuckNight } from './characters/crew';
import { muscatine, muscatineTalk } from './chapters/01_muscatine';
import { triCities, triCitiesTalks } from './chapters/02_triCities';
import { leClaire, pushReading, rapidsTalk } from './chapters/03_rapids';
import { START_COAL, START_PURSE } from './numbers';
import { debrisTalk } from './characters/debris';

export const RIVER: StoryDef = {
  days: [
    { day: 1, place: 'muscatine', steps: muscatine },
    { day: 2, place: 'leClaire', steps: leClaire },
  ],
  stuckNight,
  hubs: { triCities },
  pushReading,
};

/** Bill leaves the new captain the dock fee and a little over for food and coal, and the bunker as it is. */
export const RIVER_START = { purse: START_PURSE, coal: START_COAL };

/** What's said at the table, by encounter. */
export const RIVER_TALK: Record<string, Talk> = {
  ...muscatineTalk,
  ...triCitiesTalks,
  ...rapidsTalk,
  ...debrisTalk,
  deck: deckTalk,
  deckIntel: deckIntelTalk,
};
