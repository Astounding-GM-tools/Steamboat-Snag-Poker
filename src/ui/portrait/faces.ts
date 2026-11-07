/**
 * Who's who, as data: every face is the same rig (see Portrait.svelte) with
 * its own settings. A mood is a pose of that rig, so moods blend, and an
 * effect written once works on any face. All in a 100 × 100 box, the head
 * centred on (50, 50).
 */

/** Where the rig's moving parts stand. */
export interface Pose {
  /** Brows up (+) or down (−), in units. */
  browLift: number;
  /** Brows tipped: + the inner ends down (cross), − up (worried). */
  browTilt: number;
  /** One brow cocked: + the right one goes up by this much, − the left. */
  browCock: number;
  /** How open the eyes are: 1 as drawn. */
  eyeOpen: number;
  /** Where they look, −1 to 1. */
  lookX: number;
  lookY: number;
  /** The mouth's curve: + a smile, − a frown. */
  mouthCurve: number;
  /** How far it's open, 0 to 1. */
  mouthOpen: number;
  /** One corner higher than the other. */
  smirk: number;
  /** A wobble along the mouth, 0 to 1. */
  wobble: number;
  /** The head's lean, in degrees. */
  lean: number;
  /** A bead of sweat, 0 to 1. */
  sweat: number;
  /** A pipe's angle: − jaunty, + sagging. */
  pipe: number;
}

export const MOODS = ['neutral', 'confident', 'nervous'] as const;
export type Mood = (typeof MOODS)[number];
/** A mood, or a blend of them. */
export type MoodBlend = Mood | Partial<Record<Mood, number>>;

const NEUTRAL: Pose = { browLift: 0, browTilt: 0, browCock: 0, eyeOpen: 1, lookX: 0, lookY: 0, mouthCurve: 0, mouthOpen: 0, smirk: 0, wobble: 0, lean: 0, sweat: 0, pipe: 0 };

export const POSES: Record<Mood, Pose> = {
  neutral: NEUTRAL,
  confident: { ...NEUTRAL, browCock: 4, eyeOpen: 0.72, lookX: 0.3, mouthCurve: 0.75, smirk: 0.7, lean: -5, pipe: -1.2 },
  nervous: { ...NEUTRAL, browLift: 3, browTilt: -1, eyeOpen: 1.2, lookX: -0.7, lookY: -0.2, mouthCurve: -0.5, mouthOpen: 0.12, wobble: 1, lean: 4, sweat: 1, pipe: 1.7 },
};

/** Anything drawn on a face that isn't the rig: a hat, a tie, a moustache. */
export interface Part {
  /** Path data. */
  d: string;
  fill?: 'ink' | 'paper' | 'none' | 'sand' | 'grey' | 'umber';
  stroke?: 'ink' | 'paper' | 'grey';
  width?: number;
  /** Swings with the mood, about the face's `pivot` (a pipe in the teeth). */
  swing?: boolean;
  /** Spills past the frame where it reaches it (a beard), and stays in its own layer inside it. */
  spill?: boolean;
  /** An `over` part that moves with the mouth and goes on top of everything: a moustache a holder disappears into. */
  withMouth?: boolean;
  /** Worn at an angle of its own, in degrees, about this point: a hat askew. It still leans with the head. */
  tilt?: [number, number, number];
  /** Behind the head; on it; moving with the mouth; over everything; or over the portrait's own border, not cut off by it. */
  layer: 'back' | 'face' | 'mouth' | 'front' | 'over';
}

export interface Face {
  /** The head: a jowly oval by these numbers, or any shape of its own (a heap of sand). */
  head: { width: number; top: number; jaw: number; chin: number; bottom: number } | { outline: string };
  fill?: 'paper' | 'sand' | 'grey' | 'umber';
  /** Pie eyes work on a pale face; on a dark one, `soft`: round eyes with a small round catch of light. */
  eyes: { y: number; gap: number; rx: number; ry: number; soft?: boolean };
  brows: { y: number; gap: number; length: number; weight: number; arch: number };
  nose?: { kind: 'bulb' | 'hook' | 'button'; y: number; size: number; pale?: boolean };
  /** `hidden`: no mouth drawn, the moustache does the talking. */
  mouth: { y: number; width: number; hidden?: boolean };
  parts?: Part[];
  /** Sand running off it: grains falling from these points. */
  grains?: [number, number][];
  /** How large it's drawn in its oval (default 1.16): a square jaw or a jagged sheet of ice wants less. */
  zoom?: number;
  /** Its own backdrop, where cream won't do (none does yet). */
  backdrop?: Backdrop;
  /** Seconds between blinks. */
  blink: number;
  /** How much of a mood shows: Gus gives little away. */
  temper: number;
  /** Where the face rests, before any mood: Willie is smiling already. */
  rest?: Partial<Pose>;
  /** Its own way of showing a mood, in place of the usual pose: Sandy's nervous face is a straight one. */
  moods?: Partial<Record<Mood, Partial<Pose>>>;
  /** Never sweats. */
  dry?: boolean;
  /** Smoke rising from this point. */
  smoke?: [number, number];
  /** A brim's lower edge: a brow that would reach above it isn't drawn at all, rather than cut through. */
  brim?: number;
  /** Where `over` parts pivot with the mood: a pipe, held in the teeth. */
  pivot?: [number, number];
  /** A tic of its own, now and then: an effect, and about how many seconds apart. */
  tic?: { effect: Effect; every: number };
}

/** What's behind a face: cream, like an old photograph (ink reads on it without outlines), or the dark of the table. */
export const BACKDROPS = ['cream', 'dark'] as const;
export type Backdrop = (typeof BACKDROPS)[number];

export const EFFECTS = ['shifty', 'twitch', 'wrinkle'] as const;
export type Effect = (typeof EFFECTS)[number];

/**
 * Gus: the chief engineer. A square head that gives nothing away, a flat cap,
 * a smear of soot, a brush of a moustache, and a corn-cob pipe that rises and
 * sags with his mood: the one thing about him that does.
 */
const gus: Face = {
  head: { width: 30, top: 8, jaw: 84, chin: 21, bottom: 88 },
  eyes: { y: 47, gap: 12, rx: 4.2, ry: 6 },
  brows: { y: 36, gap: 12, length: 13, weight: 4.5, arch: 1 },
  nose: { kind: 'bulb', y: 58, size: 6, pale: true },
  mouth: { y: 76, width: 15 },
  parts: [
    // The ears.
    { layer: 'back', d: 'M21 46 C14 42 13 56 22 57 Z', fill: 'paper', stroke: 'ink', width: 2.5 },
    { layer: 'back', d: 'M79 46 C86 42 87 56 78 57 Z', fill: 'paper', stroke: 'ink', width: 2.5 },
    // The flat cap, and its peak.
    { layer: 'front', d: 'M18 31 C17 13 34 7 53 7 C72 7 86 15 83 31 C64 25 38 25 18 31 Z', fill: 'ink' },
    { layer: 'front', d: 'M16 32 C34 24 60 24 70 29 C60 35 36 36 16 32 Z', fill: 'grey', stroke: 'ink', width: 2 },
    // A smear of soot.
    { layer: 'face', d: 'M66 65 C69 62 74 63 74 66 C72 68 68 68 66 65 Z', fill: 'ink' },
    // The moustache rides on the mouth.
    { layer: 'mouth', d: 'M50 68 C42 64 30 66 27 75 C34 73 42 74 50 72 C58 74 66 73 73 75 C70 66 58 64 50 68 Z', fill: 'ink' },
    // A corn-cob pipe, jutting out past the frame: the stem, then the bowl and its kernels.
    { layer: 'over', swing: true, d: 'M60 77 L88 81', fill: 'none', stroke: 'ink', width: 3.6 },
    { layer: 'over', swing: true, d: 'M60 77 L88 81', fill: 'none', stroke: 'paper', width: 1.4 },
    { layer: 'over', swing: true, d: 'M85 70 L101 68 L100 91 C97 96 90 96 87 91 Z', fill: 'sand', stroke: 'ink', width: 2.4 },
    { layer: 'over', swing: true, d: 'M89 76 h.1 M94 75 h.1 M98 75 h.1 M90 81 h.1 M95 80 h.1 M90 86 h.1 M95 85 h.1 M98 85 h.1', fill: 'none', stroke: 'ink', width: 2 },
  ],
  smoke: [93, 67],
  pivot: [60, 77],
  blink: 6.3,
  temper: 0.6,
  tic: { effect: 'wrinkle', every: 11 },
};

/**
 * Sandy, the Sandbar, keeps bar: a heap of sand with a bow tie and a
 * waxed moustache, chipper to the last grain.
 */
const sandy: Face = {
  head: { outline: 'M3 92 C10 84 15 76 21 62 C26 44 30 22 45 15 C53 11 62 13 69 24 C77 40 81 60 88 72 C92 80 96 87 98 92 C72 100 28 100 3 92 Z' },
  fill: 'sand',
  eyes: { y: 41, gap: 11.5, rx: 6, ry: 8.5 },
  brows: { y: 28, gap: 11.5, length: 11, weight: 3.2, arch: 3 },
  nose: { kind: 'button', y: 52, size: 4.5 },
  mouth: { y: 70, width: 15 },
  parts: [
    // The moustache, waxed, curling up at the ends.
    { layer: 'mouth', d: 'M50 60 C44 56 36 60 31 62 C27 63 24 60 25 56 C21 62 25 69 33 67 C39 66 45 65 50 63 C55 65 61 66 67 67 C75 69 79 62 75 56 C76 60 73 63 69 62 C64 60 56 56 50 60 Z', fill: 'ink' },
    // The bow tie.
    { layer: 'front', d: 'M50 84 L35 77 L35 92 Z M50 84 L65 77 L65 92 Z', fill: 'ink', stroke: 'paper', width: 1.5 },
    { layer: 'front', d: 'M46 80.5 H54 V87.5 H46 Z', fill: 'paper', stroke: 'ink', width: 1.5 },
  ],
  grains: [[18, 66], [24, 50], [30, 34], [74, 48], [80, 62], [86, 72], [12, 80]],
  blink: 3.6,
  temper: 1.1,
  rest: { mouthCurve: 0.45 },
  moods: { nervous: { mouthCurve: -0.42, browLift: 1 } },
  tic: { effect: 'twitch', every: 8 },
};

/** The crew's cap: knitted, pulled well down, its turned-up edge ribbed. Lars's and Willie's alike. */
const crewCap: Part[] = [
  { layer: 'front', d: 'M17 32 C14 0 86 0 83 32 C62 26 38 26 17 32 Z', fill: 'ink' },
  { layer: 'front', d: 'M16 33 C38 26 62 26 84 33 L83 24 C62 18 38 18 17 24 Z', fill: 'grey', stroke: 'ink', width: 2 },
  { layer: 'front', d: 'M24 23 L24 30 M33 21 L33 28 M42 20 L42 27 M51 20 L51 27 M60 20 L60 27 M69 21 L69 28 M77 23 L77 30', fill: 'none', stroke: 'ink', width: 1.4 },
];

/**
 * Willie: a round face, close-cropped hair under the crew's cap, and a smile
 * that needs no reason. The same rig, proportions and smile as everyone else,
 * in a skin tone of the film's own greys; round eyes with a catch of light,
 * since pie eyes only work on a pale face. The old cartoons' minstrel shapes
 * (ink-black skin, a pale ring of a mouth, big lips) have no place on this boat.
 */
const willie: Face = {
  head: { width: 29, top: 13, jaw: 78, chin: 24, bottom: 84 },
  fill: 'umber',
  eyes: { y: 49, gap: 11, rx: 4.4, ry: 5.4, soft: true },
  brows: { y: 37, gap: 11, length: 9, weight: 2.4, arch: 2 },
  nose: { kind: 'bulb', y: 59, size: 3.2, pale: true },
  mouth: { y: 69, width: 13 },
  parts: [
    { layer: 'back', d: 'M22 48 C15 44 15 58 23 58 Z', fill: 'umber', stroke: 'ink', width: 2.5 },
    { layer: 'back', d: 'M78 48 C85 44 85 58 77 58 Z', fill: 'umber', stroke: 'ink', width: 2.5 },
    { layer: 'front', d: 'M22 42 C21 28 30 22 50 21 C70 22 79 28 78 42 C74 34 70 31 50 30 C30 31 26 34 22 42 Z', fill: 'ink' },
    ...crewCap,
  ],
  blink: 4.1,
  temper: 1,
  rest: { mouthCurve: 0.55, browLift: 1 },
};

/** Lars: enormous and nearly silent. A long head, a great beard, small eyes that have seen the furnace. */
const lars: Face = {
  head: { width: 31, top: 3, jaw: 90, chin: 24, bottom: 97 },
  eyes: { y: 38, gap: 11, rx: 2.6, ry: 3.6 },
  brows: { y: 31, gap: 11, length: 13, weight: 5.5, arch: 0.5 },
  nose: { kind: 'hook', y: 47, size: 5 },
  mouth: { y: 66, width: 8 },
  parts: [
    { layer: 'back', d: 'M19 40 C13 36 12 50 20 51 Z', fill: 'paper', stroke: 'ink', width: 2.5 },
    { layer: 'back', d: 'M81 40 C87 36 88 50 80 51 Z', fill: 'paper', stroke: 'ink', width: 2.5 },
    // The beard: the mouth is somewhere in it.
    { layer: 'mouth', spill: true, d: 'M19 48 C22 62 30 56 38 60 C44 56 56 56 62 60 C70 56 78 62 81 48 C86 76 72 100 50 102 C28 100 14 76 19 48 Z M42 69 C46 72 54 72 58 69 C55 66 45 66 42 69 Z', fill: 'grey', stroke: 'ink', width: 2.5 },
    ...crewCap,
  ],
  blink: 7.7,
  temper: 0.4,
  dry: true,
};

/** A sheet of the ice jam: all edges, frost for brows, and it knows something you don't. */
const iceSheet: Face = {
  head: { outline: 'M8 62 L16 33 L33 24 L38 10 L57 17 L72 12 L80 33 L95 44 L90 69 L95 88 L72 84 L58 95 L38 86 L19 92 Z' },
  fill: 'grey',
  eyes: { y: 47, gap: 13, rx: 5, ry: 6.5 },
  brows: { y: 35, gap: 13, length: 14, weight: 3.5, arch: -1 },
  mouth: { y: 69, width: 16 },
  parts: [
    // Cracks.
    { layer: 'face', d: 'M38 10 L42 22 L36 30 M95 44 L84 50 L86 58 M19 92 L27 80 L24 72', fill: 'none', stroke: 'ink', width: 1.6 },
    { layer: 'face', d: 'M60 19 L63 27 L70 28', fill: 'none', stroke: 'paper', width: 1.6 },
    // A pale shine along one edge.
    { layer: 'face', d: 'M18 38 L33 29 L28 41 L20 47 Z', fill: 'paper' },
    // Icicles.
    { layer: 'front', d: 'M30 89 L33 100 L37 88 Z M56 94 L59 104 L63 90 Z M76 85 L78 94 L82 85 Z', fill: 'paper', stroke: 'ink', width: 1.5 },
  ],
  blink: 9.1,
  temper: 1,
  zoom: 1,
  rest: { eyeOpen: 0.75, browTilt: 0.8, mouthCurve: 0.2, wobble: 0.6 },
  moods: { nervous: { mouthCurve: -0.2, wobble: -0.6 } },
  tic: { effect: 'shifty', every: 6 },
};

/**
 * Gaylord Montague, Esquire: villain-coded, never a villain. A wide jaw, a cleft
 * chin, a thin scar, and no mouth to speak of: a fat twirled moustache that his
 * cigarette holder disappears into. A top hat worn low and askew, so low his
 * brows stay under the brim. Rattled or not, the moustache keeps its smile: his
 * eyes narrow and the cigarette tips up, and that's all. He doesn't sweat.
 */
const gaylord: Face = {
  head: { width: 28, top: 12, jaw: 88, chin: 21, bottom: 93 },
  eyes: { y: 52, gap: 10.5, rx: 3.8, ry: 5.3 },
  brows: { y: 43, gap: 10.5, length: 11, weight: 2.6, arch: 3.5 },
  nose: { kind: 'hook', y: 59, size: 5 },
  mouth: { y: 79, width: 11, hidden: true },
  parts: [
    { layer: 'back', d: 'M23 50 C17 47 17 59 24 59 Z', fill: 'paper', stroke: 'ink', width: 2.2 },
    { layer: 'back', d: 'M77 50 C83 47 83 59 76 59 Z', fill: 'paper', stroke: 'ink', width: 2.2 },
    // Hair, slick, showing under the hat at the temples.
    { layer: 'front', d: 'M23 44 C22 36 24 33 28 32 L28 40 Z M77 44 C78 36 76 33 72 32 L72 40 Z', fill: 'ink' },
    // A thin scar on his right cheek, away from the cigarette.
    { layer: 'face', d: 'M30 58 L37.5 67', fill: 'none', stroke: 'ink', width: 1.3 },
    { layer: 'face', d: 'M31 61.5 L33.8 59.6 M33.2 64.3 L36 62.4', fill: 'none', stroke: 'ink', width: 1 },
    // The cleft in his chin.
    { layer: 'face', d: 'M50 88 C48.5 90.5 51.5 91 50 93', fill: 'none', stroke: 'ink', width: 1.8 },
    // The moustache, twirled up at the ends.
    { layer: 'over', withMouth: true, d: 'M50 70 C44 67 38 68 34 71 C30 73 26 71 27 66 C23 71 26 80 33 79 C40 79 45 77 50 77 C55 77 60 79 67 79 C74 80 77 71 73 66 C74 71 70 73 66 71 C62 68 56 67 50 70 Z', fill: 'ink' },
    // The top hat, worn low on his brow, and too tall for any frame.
    { layer: 'over', tilt: [-7, 50, 34.5], d: 'M27.7 32.5 C39.4 35.5 60.6 35.5 72.3 32.5 L74.4 -1.5 C60.6 -5.5 39.4 -5.5 25.6 -1.5 Z', fill: 'ink' },
    { layer: 'over', tilt: [-7, 50, 34.5], d: 'M28.1 27.5 C39.4 30.5 60.6 30.5 71.9 27.5 L72.3 21.5 C60.6 24.5 39.4 24.5 27.7 21.5 Z', fill: 'grey' },
    { layer: 'over', tilt: [-7, 50, 34.5], d: 'M9.7 30.5 C12.9 27.5 19.3 27.5 27.7 30.5 C39.4 34.5 60.6 34.5 72.3 30.5 C80.7 27.5 87.1 27.5 90.3 30.5 C86 38.5 67 41.5 50 41.5 C33 41.5 14 38.5 9.7 30.5 Z', fill: 'ink' },
    // A cigarette in a long holder, from the corner of his mouth out past the frame: held loosely, drooping a little.
    { layer: 'over', swing: true, d: 'M62 75 L91 80', fill: 'none', stroke: 'ink', width: 3 },
    { layer: 'over', swing: true, d: 'M89 79.8 L101 81.3', fill: 'none', stroke: 'paper', width: 3.4 },
    { layer: 'over', swing: true, d: 'M89 79.8 L101 81.3', fill: 'none', stroke: 'ink', width: 0.8 },
  ],
  smoke: [102, 79],
  pivot: [59, 76],
  brim: 41.5,
  blink: 5.2,
  temper: 1,
  dry: true,
  rest: { mouthCurve: 0.6, smirk: 0.5, browCock: 1.5, eyeOpen: 0.88 },
  moods: {
    confident: { browCock: 3, eyeOpen: 0.82, mouthCurve: 0.15, lean: -4, pipe: -1 },
    nervous: { browCock: -4.5, eyeOpen: 0.82, mouthCurve: 0.15, lean: -4, pipe: -1 },
  },
  tic: { effect: 'shifty', every: 7 },
};

/**
 * Steamboat Bill: plain and stone-faced, under a flat porkpie hat. The same
 * doomed stare whatever the cards; that's the joke, and the man.
 */
const steamboatBill: Face = {
  head: { width: 26, top: 12, jaw: 84, chin: 18, bottom: 91 },
  eyes: { y: 49, gap: 11, rx: 4.4, ry: 6.4 },
  brows: { y: 39, gap: 11, length: 11, weight: 3, arch: 0 },
  nose: { kind: 'hook', y: 57, size: 4 },
  mouth: { y: 74, width: 7 },
  parts: [
    { layer: 'back', d: 'M25 49 C18 45 18 59 26 59 Z', fill: 'paper', stroke: 'ink', width: 2.4 },
    { layer: 'back', d: 'M75 49 C82 45 82 59 74 59 Z', fill: 'paper', stroke: 'ink', width: 2.4 },
    // Hair under the brim.
    { layer: 'front', d: 'M25 42 C24 34 27 31 32 30 L30 37 Z M75 42 C76 34 73 31 68 30 L70 37 Z', fill: 'ink' },
    // The porkpie: a flat crown, a short brim.
    { layer: 'front', d: 'M31 30 C42 32 58 32 69 30 L67 15 C57 12 43 12 33 15 Z', fill: 'ink' },
    { layer: 'front', d: 'M35 16 C45 14 55 14 65 16', fill: 'none', stroke: 'grey', width: 1.6 },
    { layer: 'front', d: 'M16 29 C20 26 26 26 32 29 C42 32 58 32 68 29 C74 26 80 26 84 29 C80 35 64 37 50 37 C36 37 20 35 16 29 Z', fill: 'ink' },
  ],
  blink: 8.5,
  temper: 0,
  dry: true,
  rest: { browTilt: -0.15 },
};

/** Konrad Marlowe, "Whiteknuckle", captain of the Monarch: a captain's cap with an anchor, white whiskers all round. */
const konrad: Face = {
  head: { width: 30, top: 12, jaw: 84, chin: 24, bottom: 90 },
  eyes: { y: 48, gap: 11, rx: 3.6, ry: 5 },
  brows: { y: 38, gap: 11, length: 12, weight: 5, arch: 1.5 },
  nose: { kind: 'bulb', y: 58, size: 6, pale: true },
  mouth: { y: 72, width: 11 },
  parts: [
    { layer: 'back', d: 'M21 48 C14 44 14 58 22 58 Z', fill: 'paper', stroke: 'ink', width: 2.5 },
    { layer: 'back', d: 'M79 48 C86 44 86 58 78 58 Z', fill: 'paper', stroke: 'ink', width: 2.5 },
    // White whiskers, cheek to cheek under the chin; the mouth shows through.
    { layer: 'face', spill: true, d: 'M21 44 C18 66 26 94 50 98 C74 94 82 66 79 44 C76 56 70 62 63 64 C58 69 42 69 37 64 C30 62 24 56 21 44 Z', fill: 'paper', stroke: 'ink', width: 2.2 },
    { layer: 'face', d: 'M30 74 C32 80 35 84 38 86 M70 74 C68 80 65 84 62 86 M44 84 C46 88 54 88 56 84', fill: 'none', stroke: 'grey', width: 1.4 },
    { layer: 'mouth', d: 'M50 65 C43 62 33 63 31 69 C37 67 44 68 50 67 C56 68 63 67 69 69 C67 63 57 62 50 65 Z', fill: 'paper', stroke: 'ink', width: 1.8 },
    // The captain's cap: white top, black band and peak, an anchor on the front.
    { layer: 'front', d: 'M21 29 C18 9 82 9 79 29 Z', fill: 'paper', stroke: 'ink', width: 2.4 },
    { layer: 'front', d: 'M21 31 C40 25 60 25 79 31 L79 25 C60 19 40 19 21 25 Z', fill: 'ink' },
    { layer: 'front', d: 'M23 31 C40 37 60 37 77 31 C67 41 33 41 23 31 Z', fill: 'ink' },
    { layer: 'front', d: 'M50 12 V20 M46 17 C47 21 53 21 54 17 M47.5 13 H52.5', fill: 'none', stroke: 'ink', width: 1.4 },
  ],
  blink: 4.8,
  temper: 0.8,
  rest: { browTilt: -0.4, mouthCurve: 0.2 },
};

/** Morag, the Governess: greying hair, a bun that won't keep to the frame, half-moon spectacles, a high collar, a mouth pursed against the whole business. */
const morag: Face = {
  head: { width: 25, top: 13, jaw: 80, chin: 16, bottom: 88 },
  eyes: { y: 45, gap: 12, rx: 3, ry: 4.4 },
  brows: { y: 36, gap: 12, length: 10, weight: 2, arch: 2.5 },
  nose: { kind: 'hook', y: 54, size: 4.5 },
  mouth: { y: 72, width: 7 },
  parts: [
    // Hair drawn back hard, parted in the middle.
    { layer: 'back', d: 'M22 52 C18 22 32 12 50 12 C68 12 82 22 78 52 Z', fill: 'grey', stroke: 'ink', width: 2.2 },
    { layer: 'front', d: 'M25 40 C23 21 36 15 50 17 C64 15 77 21 75 40 C72 28 62 23 50 26 C38 23 28 28 25 40 Z', fill: 'grey', stroke: 'ink', width: 2.2 },
    { layer: 'front', d: 'M50 17 V26 M33 27 C37 23 42 21 47 21 M67 27 C63 23 58 21 53 21', fill: 'none', stroke: 'ink', width: 1.2 },
    // Half-moon spectacles, low on the nose, on a chain: she looks over them.
    { layer: 'front', d: 'M30 51 H44 A7 5 0 0 1 30 51 Z M56 51 H70 A7 5 0 0 1 56 51 Z M44 52 C47 50 53 50 56 52', fill: 'none', stroke: 'ink', width: 2 },
    { layer: 'front', d: 'M30 52 C25 64 26 78 33 88', fill: 'none', stroke: 'grey', width: 1.2 },
    // A high collar and a brooch.
    { layer: 'front', d: 'M35 87 C41 93 59 93 65 87 L70 101 L30 101 Z', fill: 'paper', stroke: 'ink', width: 2 },
    { layer: 'front', d: 'M47 96 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0 Z', fill: 'ink' },
    // The bun, on top: coiled.
    { layer: 'over', d: 'M37 8 C37 -5 63 -5 63 8 C63 19 37 19 37 8 Z', fill: 'grey', stroke: 'ink', width: 2 },
    { layer: 'over', d: 'M44 7 C44 1 56 1 56 7 C56 12 47 12 46 8 C46 5 52 4 53 7', fill: 'none', stroke: 'ink', width: 1.4 },
  ],
  blink: 6.8,
  temper: 0.7,
  rest: { mouthCurve: -0.15, browTilt: 0.4 },
  tic: { effect: 'twitch', every: 9 },
};

/** Horace Quaid, the harbour master: a bulldog's jowls, an official cap, eyes narrowed at the charges. */
const harbourMaster: Face = {
  head: { width: 34, top: 12, jaw: 92, chin: 30, bottom: 92 },
  eyes: { y: 47, gap: 12, rx: 3.2, ry: 4.2 },
  brows: { y: 39, gap: 10, length: 14, weight: 5, arch: 0 },
  nose: { kind: 'bulb', y: 59, size: 6, pale: true },
  mouth: { y: 77, width: 12 },
  parts: [
    { layer: 'back', d: 'M17 48 C9 44 9 59 18 59 Z', fill: 'paper', stroke: 'ink', width: 2.5 },
    { layer: 'back', d: 'M83 48 C91 44 91 59 82 59 Z', fill: 'paper', stroke: 'ink', width: 2.5 },
    // Jowls.
    { layer: 'face', d: 'M22 70 C24 82 32 88 38 86 M78 70 C76 82 68 88 62 86', fill: 'none', stroke: 'ink', width: 2 },
    // The official cap: dark, a grey band, a badge, the peak.
    { layer: 'front', d: 'M17 31 C13 11 87 11 83 31 Z', fill: 'ink' },
    { layer: 'front', d: 'M17 33 C40 27 60 27 83 33 L83 26 C60 20 40 20 17 26 Z', fill: 'grey', stroke: 'ink', width: 1.6 },
    { layer: 'front', d: 'M19 33 C40 41 60 41 81 33 C71 45 29 45 19 33 Z', fill: 'ink' },
    { layer: 'front', d: 'M46 18 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 Z', fill: 'paper' },
  ],
  blink: 6.1,
  temper: 0.7,
  // Square as a bollard: drawn smaller, or he fills the frame to the corners.
  zoom: 1.03,
  rest: { eyeOpen: 0.65, mouthCurve: -0.3, browTilt: 0.5 },
  tic: { effect: 'wrinkle', every: 12 },
};

/** Mick Doolan, the coal yard's foreman: a bowler, coal dust, stubble, and a grin he can't keep down. */
const foreman: Face = {
  head: { width: 31, top: 12, jaw: 86, chin: 26, bottom: 90 },
  eyes: { y: 47, gap: 12, rx: 4, ry: 5.6 },
  brows: { y: 37, gap: 12, length: 12, weight: 4, arch: 2 },
  nose: { kind: 'bulb', y: 59, size: 5, pale: true },
  mouth: { y: 74, width: 15 },
  parts: [
    { layer: 'back', d: 'M20 47 C12 43 12 58 21 58 Z', fill: 'paper', stroke: 'ink', width: 2.5 },
    { layer: 'back', d: 'M80 47 C88 43 88 58 79 58 Z', fill: 'paper', stroke: 'ink', width: 2.5 },
    // Stubble, and coal dust.
    { layer: 'face', d: 'M34 82 h.1 M40 85 h.1 M46 86 h.1 M54 86 h.1 M60 85 h.1 M66 82 h.1 M37 79 h.1 M63 79 h.1 M50 88 h.1', stroke: 'grey', width: 1.8 },
    { layer: 'face', d: 'M25 60 C28 57 33 58 33 61 C31 64 27 64 25 60 Z M70 66 C72 64 76 65 75 67 C73 69 71 68 70 66 Z', fill: 'grey' },
    // A neckerchief.
    { layer: 'front', d: 'M31 90 L50 99 L69 90 L65 101 L35 101 Z', fill: 'grey', stroke: 'ink', width: 2 },
    // The bowler.
    { layer: 'front', d: 'M27 30 C38 33 62 33 73 30 C76 3 24 3 27 30 Z', fill: 'ink' },
    { layer: 'front', d: 'M13 29 C17 26 23 26 29 29 C40 33 60 33 71 29 C77 26 83 26 87 29 C83 36 66 38 50 38 C34 38 17 36 13 29 Z', fill: 'ink' },
  ],
  blink: 4.4,
  temper: 1,
  rest: { mouthCurve: 0.5 },
  // Nervous, the grin goes to a thin, uneven scribble.
  moods: { nervous: { browLift: 3, browTilt: -1, eyeOpen: 1.2, lookX: -0.7, lookY: -0.2, mouthCurve: -0.55, wobble: 1.3, lean: 4, sweat: 1 } },
};

/** By the id they go by at the table and in the story. */
export const FACES = { gus, willie, lars, sandbar: sandy, iceSheet, gaylord, steamboatBill, morag, konrad, harbourMaster, foreman };
export type FaceId = keyof typeof FACES;

export const hasFace = (id: string): id is FaceId => id in FACES;
