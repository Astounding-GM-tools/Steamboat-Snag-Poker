/**
 * The rig's vocabulary: what a face is made of, what a mood is, and the
 * effects every face shares. Drawn by Portrait.svelte, in a 100 × 100 box
 * (the head's widest at y 46, the oval's centre at 50, 50); the cast is in
 * faces.ts, hats in hats.ts. See docs/portraits.md.
 */
import type { Head } from './hats';

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
  fill?: 'ink' | 'paper' | 'none' | 'sand' | 'grey' | 'umber' | 'tan';
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
  head: Head | { outline: string };
  /** The skin: paper, or a tone from the film's own greys (`tan`, `umber`), never ink. */
  fill?: 'paper' | 'sand' | 'grey' | 'umber' | 'tan';
  /** Pie eyes work on a pale face; on a dark one, `soft`: round eyes with a small round catch of light. */
  eyes: { y: number; gap: number; rx: number; ry: number; soft?: boolean; lashes?: boolean };
  brows: { y: number; gap: number; length: number; weight: number; arch: number };
  /** `pale`: the colour of the face; `tint`: coloured in a little (a nose that's seen some port). */
  nose?: { kind: 'bulb' | 'hook' | 'button'; y: number; size: number; pale?: boolean; tint?: 'sand' | 'grey' };
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
  /** Blinks that take their time: lids down, a long moment shut, and slowly up again. */
  slowBlink?: boolean;
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
  /** The pipe or cigar is on the left of the picture, so it rises and sags the other way round. */
  leftSide?: boolean;
  /** A tic of its own, now and then: an effect, and about how many seconds apart; `when`, only in that mood (a tell). */
  tic?: { effect: Effect; every: number; when?: Mood };
}

/** What's behind a face: cream, like an old photograph (ink reads on it without outlines), or the dark of the table. */
export const BACKDROPS = ['cream', 'dark'] as const;
export type Backdrop = (typeof BACKDROPS)[number];

export const EFFECTS = ['shifty', 'twitch', 'wrinkle'] as const;
export type Effect = (typeof EFFECTS)[number];

