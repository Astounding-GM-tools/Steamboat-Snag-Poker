/**
 * How the river map moves: the boat's pace and the map's heights, steaming and at play.
 * One place for them, so the dev sliders (on the steaming screen, in development) can turn
 * them live; settle on numbers there, then write them in here.
 */
export const voyage = $state({
  /** Seconds for a whole leg (0 to 1) at a leisurely pace. */
  legSeconds: 230,
  /** How much quicker she goes with Skip held. */
  race: 12,
  /** The map's height as log2 of its scale (screen px per map px; a map px is 2 m): steaming, and at play. */
  steamZoom: -1.6,
  playZoom: -1.4,
  /** A crew member's chatter closes this many seconds before the next comes up (or she arrives). */
  chatterGap: 5,
});
