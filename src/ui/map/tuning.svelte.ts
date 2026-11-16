/**
 * How the river map moves: the boat's pace and the map's heights, steaming and at play.
 * One place for them. (Live sliders for them sat on the steaming screen in development, till the
 * numbers settled: commit 33a7372 has them, to bring back.)
 */
export const voyage = $state({
  /** Seconds for a whole leg (0 to 1) at a leisurely pace (slower since she's drawn small: a speck mustn't zip). */
  legSeconds: 420,
  /** How much quicker she goes with Skip held. */
  race: 12,
  /** The map's height as log2 of its scale (screen px per map px; a map px is 2 m): steaming, and at play. */
  steamZoom: -1.6,
  playZoom: -1.4,
  /** At a landing, before she sets out: in close (the tiles' own detail), the boat big enough to see her wheel. */
  dockZoom: 0,
  /**
   * The boat on the map, as a multiple of the first drawing. 0.75 is about four times her real size
   * (a 45 m sternwheeler on a chart of 2 m a pixel): a speck on a big river, but a boat.
   */
  boatSize: 0.75,
  /** Her steam, and the debris in the water, on the same measure: kept big, so a small boat still leaves a trail you can see. */
  steamSize: 3,
  /** Seconds of warning before an island's fork: the call goes up, and port or starboard can be chosen. */
  forkWarning: 12,
  /** A crew member's chatter closes this many seconds before the next comes up (or she arrives). */
  chatterGap: 5,
});
