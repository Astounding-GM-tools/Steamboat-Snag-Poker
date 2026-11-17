/**
 * The band's records, and where they play (docs/story.md, the soundtrack). Chapter one has only the
 * OKeh sides Bennie Moten's Kansas City Orchestra cut in November 1924, free already: Tulsa Blues and
 * Vine Street Blues, in turn, at The Sandbar and in the Bettendorf saloon alike (two records, so
 * variety over a tune of its own for each place). Baby Dear and As I Like It (1925) are spares.
 *
 * The Victor sides of December 1926 come into the public domain on 1 January 2027, and none of them
 * is named here before then: not even locked (a file in the build is distributed, whether the player
 * can reach it or not). Chapter two's bandstand then gets a playlist of its own, a list of tracks
 * like these in `PLACES`: a list plays in turn and round again; one track loops.
 */
export interface Track {
  id: string;
  title: string;
  band: string;
  year: number;
  /** The file, under VITE_MUSIC_ROOT (public/music/pre-1926 in development, the bucket's music/ in a build). */
  file: string;
}

const MOTEN = 'Bennie Moten’s Kansas City Orchestra';

export const OKEH_1924 = {
  tulsaBlues: { id: 'tulsaBlues', title: 'Tulsa Blues', band: MOTEN, year: 1924, file: 'tulsablues.mp3' },
  vineStreet: { id: 'vineStreet', title: 'Vine Street Blues', band: MOTEN, year: 1924, file: 'vinestreet.mp3' },
  babyDear: { id: 'babyDear', title: 'Baby Dear', band: MOTEN, year: 1924, file: 'babydear.mp3' },
  asILikeIt: { id: 'asILikeIt', title: 'As I Like It', band: MOTEN, year: 1925, file: 'asilikeit.mp3' },
} satisfies Record<string, Track>;

/** Chapter one's two records, played in turn. */
const CHAPTER_ONE: Track[] = [OKEH_1924.tulsaBlues, OKEH_1924.vineStreet];

/**
 * Where the band plays, by the encounter's id: Sandy's house band under the whole Sandbar game, and
 * whoever's on at the Bettendorf saloon (the Tri-Cities' table). Anywhere else, the river's quiet.
 */
export const PLACES: Record<string, Track[]> = {
  sandbar: CHAPTER_ONE,
  triCities: CHAPTER_ONE,
};

/** What plays here (an encounter's id), or nothing. */
export const musicAt = (place: string | null | undefined): Track[] | null => (place && PLACES[place]) || null;
