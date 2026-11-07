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
  nervous: { ...NEUTRAL, browLift: 3, browTilt: -1, eyeOpen: 1.2, lookX: -0.7, lookY: -0.2, mouthCurve: -0.5, wobble: 1, lean: 4, sweat: 1, pipe: 1.7 },
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
  eyes: { y: number; gap: number; rx: number; ry: number; soft?: boolean; lashes?: boolean };
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
  // Nervous, the grin has further to fall.
  moods: { nervous: { browLift: 3, browTilt: -1, eyeOpen: 1.2, lookX: -0.7, lookY: -0.2, mouthCurve: -0.55, wobble: 1.3, lean: 4, sweat: 1 } },
};

/**
 * Ellie Sawyer, the rapids pilot, and a swashbuckler by her own account: a dark
 * pilot's cap with a ship's wheel on the badge, worn raked over one eye; black
 * curls in a bob, a kiss curl; big eyes, a narrow chin, and a smile that dares
 * you to try the Long Reach.
 */
const ellie: Face = {
  head: { width: 24, top: 14, jaw: 78, chin: 11, bottom: 90 },
  eyes: { y: 51, gap: 10, rx: 4.4, ry: 6.6, lashes: true },
  brows: { y: 40, gap: 10, length: 9, weight: 2, arch: 3.5 },
  nose: { kind: 'button', y: 62, size: 2.2 },
  mouth: { y: 74, width: 8 },
  parts: [
    // Black curls, to the jaw.
    { layer: 'back', d: 'M22 70 C14 66 16 58 20 56 C13 50 16 42 21 40 C17 32 24 24 30 25 C30 17 40 14 46 18 C50 12 60 13 62 19 C68 15 78 20 77 27 C84 28 87 37 81 42 C87 46 86 55 80 58 C85 62 83 70 77 70 C74 66 72 62 72 58 L28 58 C28 63 26 67 22 70 Z', fill: 'ink' },
    { layer: 'front', d: 'M25 46 C24 36 30 30 38 30 C36 34 33 37 30 38 C28 40 26 43 25 46 Z M75 46 C76 36 70 30 62 30 C64 34 67 37 70 38 C72 40 74 43 75 46 Z', fill: 'ink' },
    // A kiss curl on her brow.
    { layer: 'front', d: 'M42 34 C40 38 44 41 47 39 C49 37 47 34 45 35', fill: 'none', stroke: 'ink', width: 2 },
    // A neckerchief, knotted.
    { layer: 'front', d: 'M35 90 C42 95 58 95 65 90 L62 98 L57 94 L50 101 L43 94 L38 98 Z', fill: 'grey', stroke: 'ink', width: 2 },
    // The pilot's cap: dark, a ship's wheel on the badge, raked over one eye.
    { layer: 'over', tilt: [-14, 50, 30], d: 'M22 31 C17 10 81 10 76 31 Z', fill: 'ink' },
    { layer: 'over', tilt: [-14, 50, 30], d: 'M22 32 C40 27 58 27 76 32 L76 27 C58 22 40 22 22 27 Z', fill: 'grey', stroke: 'ink', width: 1.4 },
    { layer: 'over', tilt: [-14, 50, 30], d: 'M24 32 C38 36 52 37 62 34 C54 44 32 44 24 32 Z', fill: 'ink' },
    { layer: 'over', tilt: [-14, 50, 30], d: 'M44.5 18 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0 Z', fill: 'paper' },
    { layer: 'over', tilt: [-14, 50, 30], d: 'M49.5 12 V24 M43.5 18 H55.5 M45.3 13.8 L53.7 22.2 M53.7 13.8 L45.3 22.2', fill: 'none', stroke: 'ink', width: 1.1 },
  ],
  blink: 4.6,
  temper: 1,
  rest: { mouthCurve: 0.35, smirk: 0.55, browCock: 1.5 },
};

/** Cornelius Tripp, the Old Guard of Davenport: bald on top, white mutton chops that spill past the frame, a monocle, a mouth set against change. */
const tripp: Face = {
  head: { width: 29, top: 10, jaw: 86, chin: 22, bottom: 90 },
  eyes: { y: 48, gap: 11, rx: 3.4, ry: 4.6 },
  brows: { y: 39, gap: 11, length: 12, weight: 4.5, arch: 1 },
  nose: { kind: 'bulb', y: 58, size: 5, pale: true },
  mouth: { y: 73, width: 9 },
  parts: [
    { layer: 'back', d: 'M22 47 C15 43 15 58 23 58 Z', fill: 'paper', stroke: 'ink', width: 2.4 },
    { layer: 'back', d: 'M78 47 C85 43 85 58 77 58 Z', fill: 'paper', stroke: 'ink', width: 2.4 },
    // A fringe of white hair round the back of a bald head.
    { layer: 'back', d: 'M19 52 C16 36 20 28 26 26 C24 34 24 42 26 50 Z M81 52 C84 36 80 28 74 26 C76 34 76 42 74 50 Z', fill: 'paper', stroke: 'ink', width: 2 },
    // A shine on the dome.
    { layer: 'face', d: 'M38 20 C42 17 48 16 52 17', fill: 'none', stroke: 'grey', width: 2 },
    // Mutton chops, down to the jaw and out past the frame.
    { layer: 'face', spill: true, d: 'M21 50 C17 66 20 82 30 88 C34 80 34 70 33 62 C30 58 25 56 21 50 Z M79 50 C83 66 80 82 70 88 C66 80 66 70 67 62 C70 58 75 56 79 50 Z', fill: 'paper', stroke: 'ink', width: 2.2 },
    // The monocle, on its cord.
    { layer: 'front', d: 'M55.5 48 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0 Z', fill: 'none', stroke: 'ink', width: 2 },
    { layer: 'front', d: 'M67.5 50 C72 62 70 76 64 90', fill: 'none', stroke: 'grey', width: 1.2 },
  ],
  blink: 6.6,
  temper: 0.6,
  rest: { mouthCurve: -0.25, browTilt: 0.4 },
  tic: { effect: 'twitch', every: 10 },
};

/** Tommy Rourke, on the picket line at Rock Island: a soft cap with a strike button, stubble, and a matchstick in the corner of his mouth. */
const rourke: Face = {
  head: { width: 27, top: 12, jaw: 84, chin: 20, bottom: 90 },
  eyes: { y: 49, gap: 11, rx: 4, ry: 5.6 },
  brows: { y: 39, gap: 11, length: 11, weight: 3.2, arch: 2 },
  nose: { kind: 'hook', y: 58, size: 4.5 },
  mouth: { y: 74, width: 12 },
  parts: [
    { layer: 'back', d: 'M24 48 C17 44 17 59 25 59 Z', fill: 'paper', stroke: 'ink', width: 2.4 },
    { layer: 'back', d: 'M76 48 C83 44 83 59 75 59 Z', fill: 'paper', stroke: 'ink', width: 2.4 },
    { layer: 'face', d: 'M37 80 h.1 M42 83 h.1 M48 84 h.1 M54 84 h.1 M60 82 h.1 M64 79 h.1 M45 87 h.1 M55 87 h.1', stroke: 'grey', width: 1.8 },
    // A soft cap, eight panels and a button, worn over one eye.
    { layer: 'front', d: 'M18 34 C10 18 30 6 52 7 C74 8 88 18 82 32 C66 26 40 26 18 34 Z', fill: 'grey', stroke: 'ink', width: 2.2 },
    { layer: 'front', d: 'M50 8 C46 16 44 22 44 28 M32 12 C36 18 38 24 38 29 M68 11 C64 18 62 24 62 28', fill: 'none', stroke: 'ink', width: 1.2 },
    { layer: 'front', d: 'M18 34 C34 28 50 28 64 33 C52 39 32 40 18 34 Z', fill: 'ink' },
    // The strike button.
    { layer: 'front', d: 'M64 20 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 Z', fill: 'paper', stroke: 'ink', width: 1.6 },
    { layer: 'front', d: 'M66.5 20 h3', fill: 'none', stroke: 'ink', width: 1.4 },
    // A matchstick.
    { layer: 'over', swing: true, d: 'M60 74 L78 70', fill: 'none', stroke: 'ink', width: 2 },
    { layer: 'over', swing: true, d: 'M76.5 70.3 L80 69.5', fill: 'none', stroke: 'ink', width: 3.6 },
  ],
  pivot: [60, 74],
  blink: 4.3,
  temper: 1,
  rest: { mouthCurve: 0.35, smirk: 0.4, eyeOpen: 0.9 },
};

/** Otto Pfeiffer, "Odds", the bookmaker of Bettendorf: a straw boater, round cheeks, a little curled moustache, and a pencil behind his ear for the book. */
const odds: Face = {
  head: { width: 28, top: 13, jaw: 86, chin: 26, bottom: 88 },
  eyes: { y: 50, gap: 11, rx: 3.8, ry: 5.2 },
  brows: { y: 41, gap: 11, length: 10, weight: 3, arch: 3 },
  nose: { kind: 'button', y: 60, size: 4 },
  mouth: { y: 74, width: 12 },
  parts: [
    // The pencil behind his ear, point up: his head hides the rest.
    { layer: 'back', d: 'M70 64 L86 34 L89.6 35.8 L73.6 65.8 Z', fill: 'paper', stroke: 'ink', width: 1.6 },
    { layer: 'back', d: 'M86 34 L88.6 28.4 L89.6 35.8 Z', fill: 'ink' },
    { layer: 'back', d: 'M23 49 C16 45 16 60 24 60 Z', fill: 'paper', stroke: 'ink', width: 2.4 },
    { layer: 'back', d: 'M77 49 C84 45 84 60 76 60 Z', fill: 'paper', stroke: 'ink', width: 2.4 },
    // Round cheeks.
    { layer: 'face', d: 'M27 66 C29 62 34 62 36 66 M73 66 C71 62 66 62 64 66', fill: 'none', stroke: 'grey', width: 1.8 },
    { layer: 'mouth', d: 'M50 68 C46 66 41 66 38 68 C36 69 35 67 36 65 C33 67 35 71 39 70 C43 70 47 69 50 69 C53 69 57 70 61 70 C65 71 67 67 64 65 C65 67 64 69 62 68 C59 66 54 66 50 68 Z', fill: 'ink' },
    // The boater: a flat straw crown, a black band, a wide brim.
    { layer: 'front', d: 'M27 30 C38 32 62 32 73 30 L72 16 C60 13 40 13 28 16 Z', fill: 'sand', stroke: 'ink', width: 2 },
    { layer: 'front', d: 'M27.6 25 C38 27 62 27 72.4 25 L72.2 20 C62 22 38 22 27.8 20 Z', fill: 'ink' },
    { layer: 'front', d: 'M30 18 H70 M29 29 H71', fill: 'none', stroke: 'grey', width: 1 },
    { layer: 'front', d: 'M12 30 C16 27 22 27 28 30 C38 33 62 33 72 30 C78 27 84 27 88 30 C84 36 66 38 50 38 C34 38 16 36 12 30 Z', fill: 'sand', stroke: 'ink', width: 2 },
  ],
  blink: 3.9,
  temper: 1,
  rest: { mouthCurve: 0.45, browLift: 1 },
  tic: { effect: 'shifty', every: 9 },
};

/** Lenny King, the troubadour: curly hair, sad brows, a face that expects the worst, and the scroll of a cardboard violin at his shoulder. */
const lenny: Face = {
  head: { width: 25, top: 14, jaw: 84, chin: 17, bottom: 92 },
  eyes: { y: 50, gap: 10.5, rx: 3.6, ry: 5.2 },
  brows: { y: 40, gap: 10.5, length: 10, weight: 2.8, arch: 1.5 },
  nose: { kind: 'button', y: 60, size: 3.2 },
  mouth: { y: 75, width: 9 },
  parts: [
    { layer: 'back', d: 'M25 49 C18 45 18 60 26 60 Z', fill: 'paper', stroke: 'ink', width: 2.4 },
    { layer: 'back', d: 'M75 49 C82 45 82 60 74 60 Z', fill: 'paper', stroke: 'ink', width: 2.4 },
    // Curls.
    { layer: 'front', d: 'M24 44 C16 38 20 28 26 28 C24 20 32 14 38 18 C40 10 50 10 52 16 C56 9 66 11 66 18 C72 14 80 20 76 28 C82 30 84 40 76 44 C74 38 70 34 64 33 C58 31 42 31 36 33 C30 34 26 38 24 44 Z', fill: 'ink' },
    // The violin's scroll and neck, at his shoulder.
    { layer: 'over', d: 'M80 104 L90 80', fill: 'none', stroke: 'ink', width: 4 },
    { layer: 'over', d: 'M86 80 C84 74 90 70 94 73 C97 76 94 80 91 78 C90 76 92 75 93 76', fill: 'sand', stroke: 'ink', width: 2 },
    { layer: 'over', d: 'M87 84 L93 85 M86 87 L92 88', fill: 'none', stroke: 'ink', width: 1.4 },
  ],
  blink: 5.8,
  temper: 0.9,
  rest: { browTilt: -0.7, mouthCurve: -0.35, eyeOpen: 0.8, lookY: 0.3 },
};

/** Max Moritz, "Long Coat": a very tall captain in a very long coat, the collar up to his grin. There's someone else in the coat: two eyes in the gap between the buttons. */
const maxMoritz: Face = {
  head: { width: 24, top: 10, jaw: 72, chin: 20, bottom: 78 },
  eyes: { y: 41, gap: 10, rx: 4, ry: 5.6 },
  brows: { y: 31, gap: 10, length: 9, weight: 3, arch: 3 },
  nose: { kind: 'button', y: 51, size: 3 },
  mouth: { y: 62, width: 13 },
  parts: [
    { layer: 'back', d: 'M26 40 C19 36 19 51 27 51 Z', fill: 'paper', stroke: 'ink', width: 2.4 },
    { layer: 'back', d: 'M74 40 C81 36 81 51 73 51 Z', fill: 'paper', stroke: 'ink', width: 2.4 },
    // A tuft that won't lie flat.
    { layer: 'front', d: 'M40 16 C38 6 46 10 47 3 C51 11 55 4 58 10 C62 6 64 14 60 18 C54 14 46 14 40 16 Z', fill: 'ink' },
    // The coat, collar up to his cheeks, and the eyes in the gap.
    { layer: 'front', d: 'M4 104 L6 72 C14 66 22 62 28 64 C34 70 40 74 50 74 C60 74 66 70 72 64 C78 62 86 66 94 72 L96 104 Z', fill: 'grey', stroke: 'ink', width: 2.4 },
    { layer: 'front', d: 'M28 64 L40 92 L50 80 L60 92 L72 64', fill: 'none', stroke: 'ink', width: 2 },
    { layer: 'front', d: 'M41 83 C43 79 57 79 59 83 C59 94 41 94 41 83 Z', fill: 'ink' },
    { layer: 'front', d: 'M44.4 86 a2.6 3.2 0 1 0 5.2 0 a2.6 3.2 0 1 0 -5.2 0 Z M50.4 86 a2.6 3.2 0 1 0 5.2 0 a2.6 3.2 0 1 0 -5.2 0 Z', fill: 'paper' },
    { layer: 'front', d: 'M47.6 87 h.1 M53.6 87 h.1', fill: 'none', stroke: 'ink', width: 2.2 },
    { layer: 'front', d: 'M50 96 h.1 M50 101 h.1', fill: 'none', stroke: 'ink', width: 2.6 },
  ],
  blink: 3.4,
  temper: 1,
  rest: { mouthCurve: 0.6, smirk: 0.5 },
  tic: { effect: 'shifty', every: 6 },
};

/** Ignatz, the Hurler: a mouse captain with round ears, a sharp snout, whiskers, and a brick held ready. */
const ignatz: Face = {
  head: { width: 22, top: 22, jaw: 76, chin: 10, bottom: 86 },
  eyes: { y: 51, gap: 8, rx: 3.6, ry: 5 },
  brows: { y: 42, gap: 8, length: 8, weight: 3, arch: 1 },
  nose: { kind: 'button', y: 74, size: 3.4 },
  mouth: { y: 79, width: 7 },
  parts: [
    // Round ears.
    { layer: 'back', d: 'M8 28 a15 15 0 1 0 30 0 a15 15 0 1 0 -30 0 Z M62 28 a15 15 0 1 0 30 0 a15 15 0 1 0 -30 0 Z', fill: 'paper', stroke: 'ink', width: 2.4 },
    { layer: 'back', d: 'M14 29 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0 Z M68 29 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0 Z', fill: 'grey' },
    // Whiskers.
    { layer: 'front', d: 'M44 74 L26 70 M44 76 L25 77 M56 74 L74 70 M56 76 L75 77', fill: 'none', stroke: 'ink', width: 1.3 },
    // The brick, held up at his shoulder.
    { layer: 'over', d: 'M74 78 L98 72 L102 88 L78 94 Z', fill: 'grey', stroke: 'ink', width: 2.2 },
    { layer: 'over', d: 'M76 86 L100 80 M86 75.5 L88 83 M89 83 L91 91', fill: 'none', stroke: 'ink', width: 1.4 },
  ],
  blink: 3.1,
  temper: 1.1,
  rest: { browTilt: 1, mouthCurve: -0.2, eyeOpen: 0.85 },
  tic: { effect: 'twitch', every: 5 },
};

/** Nemo, the Sleepwalker: never quite awake. Heavy lids, a long nightcap whose tassel won't keep to the frame, a dreamy half smile. */
const nemo: Face = {
  head: { width: 27, top: 14, jaw: 82, chin: 22, bottom: 88 },
  eyes: { y: 50, gap: 11, rx: 4, ry: 5.8 },
  brows: { y: 40, gap: 11, length: 10, weight: 2.4, arch: 3 },
  nose: { kind: 'button', y: 60, size: 3 },
  mouth: { y: 72, width: 10 },
  parts: [
    { layer: 'back', d: 'M24 49 C17 45 17 60 25 60 Z', fill: 'paper', stroke: 'ink', width: 2.4 },
    { layer: 'back', d: 'M76 49 C83 45 83 60 75 60 Z', fill: 'paper', stroke: 'ink', width: 2.4 },
    // The nightcap, flopping over to one side, the tassel out past the frame.
    { layer: 'over', d: 'M22 38 C18 14 44 6 62 12 C80 18 92 36 93 62 C89 60 86 54 84 46 C80 36 72 31 62 30 C46 28 34 32 22 38 Z', fill: 'paper', stroke: 'ink', width: 2.2 },
    { layer: 'over', d: 'M21 38 C36 30 54 28 70 31 L70 37 C54 34 36 36 21 44 Z', fill: 'grey', stroke: 'ink', width: 1.8 },
    { layer: 'over', d: 'M44 10 C50 16 54 22 56 30 M66 15 C72 22 76 30 78 40', fill: 'none', stroke: 'grey', width: 1.4 },
    { layer: 'over', d: 'M87 64 a6 6 0 1 0 12 0 a6 6 0 1 0 -12 0 Z', fill: 'paper', stroke: 'ink', width: 2 },
    { layer: 'over', d: 'M90 61 L96 67 M96 61 L90 67', fill: 'none', stroke: 'grey', width: 1.2 },
    // Z, z, z.
    { layer: 'over', d: 'M80 6 H86 L80 12 H86 M89 -2 H93 L89 2 H93', fill: 'none', stroke: 'ink', width: 1.6 },
  ],
  blink: 2.6,
  temper: 0.8,
  rest: { eyeOpen: 0.38, mouthCurve: 0.25, lean: 6, lookY: 0.3 },
};

/** The Walrus, an old sea dog: a sailor's cap, a mighty moustache, small eyes, and tusks that won't keep to the frame. */
const walrus: Face = {
  head: { width: 34, top: 14, jaw: 86, chin: 30, bottom: 88 },
  fill: 'grey',
  eyes: { y: 44, gap: 13, rx: 3, ry: 4 },
  brows: { y: 36, gap: 13, length: 10, weight: 3, arch: 2 },
  nose: { kind: 'button', y: 53, size: 4 },
  mouth: { y: 80, width: 8, hidden: true },
  parts: [
    // The moustache: a bristling cushion over everything below the nose.
    { layer: 'face', d: 'M16 62 C16 54 34 52 50 58 C66 52 84 54 84 62 C84 76 66 80 50 74 C34 80 16 76 16 62 Z', fill: 'paper', stroke: 'ink', width: 2.4 },
    { layer: 'face', d: 'M26 64 L28 72 M34 63 L35 73 M42 62 L42 72 M58 62 L58 72 M66 63 L65 73 M74 64 L72 72', fill: 'none', stroke: 'grey', width: 1.4 },
    // Tusks, down past the frame.
    { layer: 'over', withMouth: true, d: 'M36 74 C35 86 37 96 41 104 C43 96 43 86 42 75 Z M64 74 C65 86 63 96 59 104 C57 96 57 86 58 75 Z', fill: 'paper', stroke: 'ink', width: 2 },
    // A sailor's cap.
    { layer: 'front', d: 'M30 27 C28 10 72 10 70 27 Z', fill: 'ink' },
    { layer: 'front', d: 'M29 29 C42 25 58 25 71 29 L71 24 C58 20 42 20 29 24 Z', fill: 'paper', stroke: 'ink', width: 1.6 },
    { layer: 'front', d: 'M30 30 C38 33 46 33 52 30 C46 36 36 36 30 30 Z', fill: 'ink' },
  ],
  blink: 5.4,
  temper: 0.8,
  rest: { eyeOpen: 0.85 },
  zoom: 1.06,
};

/** Eliza Bathory, Bone Pale: charming, patient, terribly polite. A widow's peak, hair swept up, a pearl choker, a black collar, and a small, knowing smile. */
const eliza: Face = {
  head: { width: 24, top: 12, jaw: 82, chin: 15, bottom: 90 },
  eyes: { y: 49, gap: 10.5, rx: 3.6, ry: 5, lashes: true },
  brows: { y: 39, gap: 10.5, length: 10, weight: 2, arch: 4 },
  nose: { kind: 'hook', y: 58, size: 3.6 },
  mouth: { y: 73, width: 8 },
  parts: [
    // Dark hair swept up and back, with a widow's peak.
    { layer: 'back', d: 'M22 56 C14 26 30 4 50 4 C70 4 86 26 78 56 Z', fill: 'ink' },
    { layer: 'front', d: 'M26 44 C24 24 36 16 50 16 C64 16 76 24 74 44 C70 30 60 24 50 32 C40 24 30 30 26 44 Z', fill: 'ink' },
    // Earrings.
    { layer: 'front', d: 'M24 62 a2.2 3 0 1 0 4.4 0 a2.2 3 0 1 0 -4.4 0 Z M71.6 62 a2.2 3 0 1 0 4.4 0 a2.2 3 0 1 0 -4.4 0 Z', fill: 'paper', stroke: 'ink', width: 1.4 },
    // A high black collar and a pearl choker.
    { layer: 'front', d: 'M30 102 L34 88 C42 94 58 94 66 88 L70 102 Z', fill: 'ink' },
    { layer: 'front', d: 'M37 89 h.1 M41 91 h.1 M45.5 92 h.1 M50 92.3 h.1 M54.5 92 h.1 M59 91 h.1 M63 89 h.1', fill: 'none', stroke: 'paper', width: 3 },
  ],
  blink: 7.2,
  temper: 0.6,
  dry: true,
  rest: { mouthCurve: 0.3, smirk: 0.25, eyeOpen: 0.82 },
  moods: { nervous: { mouthCurve: -0.1, eyeOpen: 0.9 } },
};

/** Finlay, the Carouser: a bricklayer who struck it rich and never got used to it. A bald head with three hairs combed over, a big grin, and a fat cigar. */
const finlay: Face = {
  head: { width: 31, top: 10, jaw: 86, chin: 26, bottom: 90 },
  eyes: { y: 47, gap: 12, rx: 3.8, ry: 5.2 },
  brows: { y: 38, gap: 12, length: 11, weight: 3.4, arch: 3 },
  nose: { kind: 'bulb', y: 58, size: 6.5, pale: true },
  mouth: { y: 73, width: 15 },
  parts: [
    { layer: 'back', d: 'M20 46 C13 42 13 58 21 58 Z', fill: 'paper', stroke: 'ink', width: 2.4 },
    { layer: 'back', d: 'M80 46 C87 42 87 58 79 58 Z', fill: 'paper', stroke: 'ink', width: 2.4 },
    // Three hairs, combed over.
    { layer: 'face', d: 'M34 22 C42 14 56 14 66 20 M36 26 C44 19 56 19 64 24 M38 30 C46 24 56 24 62 28', fill: 'none', stroke: 'ink', width: 1.6 },
    // A rosy nose.
    { layer: 'face', d: 'M45 60 h.1 M53 59 h.1', fill: 'none', stroke: 'grey', width: 2 },
    // The cigar.
    { layer: 'over', swing: true, d: 'M60 74 L84 70 L85 76 L61 79 Z', fill: 'grey', stroke: 'ink', width: 2 },
    { layer: 'over', swing: true, d: 'M70 72 L71 77.6', fill: 'none', stroke: 'ink', width: 1.6 },
  ],
  smoke: [87, 70],
  pivot: [60, 76],
  blink: 4.2,
  temper: 1.1,
  rest: { mouthCurve: 0.65 },
};

/** By the id they go by at the table and in the story. */
export const FACES = { gus, willie, lars, sandbar: sandy, iceSheet, gaylord, steamboatBill, morag, konrad, harbourMaster, foreman, ellie, tripp, rourke, odds, lenny, maxMoritz, ignatz, nemo, walrus, eliza, finlay };
export type FaceId = keyof typeof FACES;

export const hasFace = (id: string): id is FaceId => id in FACES;
