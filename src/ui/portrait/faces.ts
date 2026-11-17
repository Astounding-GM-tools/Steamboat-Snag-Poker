/**
 * Who's who: every face in the game, as data for the one rig (rig.ts, drawn
 * by Portrait.svelte), by the id they go by at the table and in the story.
 * A face that wears a hat keeps its head's numbers in a const of its own, so
 * the hat can be cut to it (hats.ts). To add someone, see docs/portraits.md;
 * /portraits.html shows everyone.
 */
import { hat } from './hats';
import type { Face } from './rig';

export * from './rig';

const gusHead = { width: 30, top: 8, jaw: 84, chin: 21, bottom: 88 };
/**
 * Gus: the chief engineer. A square head that gives nothing away, a flat cap,
 * a smear of soot, a brush of a moustache, and a corn-cob pipe that rises and
 * sags with his mood: the one thing about him that does.
 */
const gus: Face = {
  head: gusHead,
  eyes: { y: 47, gap: 12, rx: 4.2, ry: 6 },
  brows: { y: 36, gap: 12, length: 13, weight: 4.5, arch: 1 },
  nose: { kind: 'bulb', y: 58, size: 6, pale: true },
  mouth: { y: 76, width: 15 },
  parts: [
    // The ears.
    { layer: 'back', d: 'M21 46 C14 42 13 56 22 57 Z', fill: 'paper', stroke: 'ink', width: 2.5 },
    { layer: 'back', d: 'M79 46 C86 42 87 56 78 57 Z', fill: 'paper', stroke: 'ink', width: 2.5 },
    // A smear of soot.
    { layer: 'face', d: 'M66 65 C69 62 74 63 74 66 C72 68 68 68 66 65 Z', fill: 'ink' },
    // The moustache rides on the mouth.
    { layer: 'mouth', d: 'M50 68 C42 64 30 66 27 75 C34 73 42 74 50 72 C58 74 66 73 73 75 C70 66 58 64 50 68 Z', fill: 'ink' },
    // A corn-cob pipe, jutting out past the frame: the stem, then the bowl and its kernels.
    { layer: 'over', swing: true, d: 'M60 77 L88 81', fill: 'none', stroke: 'ink', width: 3.6 },
    { layer: 'over', swing: true, d: 'M60 77 L88 81', fill: 'none', stroke: 'paper', width: 1.4 },
    { layer: 'over', swing: true, d: 'M85 70 L101 68 L100 91 C97 96 90 96 87 91 Z', fill: 'sand', stroke: 'ink', width: 2.4 },
    { layer: 'over', swing: true, d: 'M89 76 h.1 M94 75 h.1 M98 75 h.1 M90 81 h.1 M95 80 h.1 M90 86 h.1 M95 85 h.1 M98 85 h.1', fill: 'none', stroke: 'ink', width: 2 },
    // The flat cap and its peak.
    ...hat(gusHead, { kind: 'flat', band: 31 }),

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

const willieHead = { width: 29, top: 13, jaw: 78, chin: 24, bottom: 84 };
/**
 * Willie: a round face, close-cropped hair under the crew's cap, and a smile
 * that needs no reason. The same rig, proportions and smile as everyone else,
 * in a skin tone of the film's own greys; round eyes with a catch of light,
 * since pie eyes only work on a pale face. The old cartoons' minstrel shapes
 * (ink-black skin, a pale ring of a mouth, big lips) have no place on this boat.
 */
const willie: Face = {
  head: willieHead,
  fill: 'umber',
  eyes: { y: 49, gap: 11, rx: 4.4, ry: 5.4, soft: true },
  brows: { y: 37, gap: 11, length: 9, weight: 2.4, arch: 2 },
  nose: { kind: 'bulb', y: 59, size: 3.2, pale: true },
  mouth: { y: 69, width: 13 },
  parts: [
    { layer: 'back', d: 'M22 48 C15 44 15 58 23 58 Z', fill: 'umber', stroke: 'ink', width: 2.5 },
    { layer: 'back', d: 'M78 48 C85 44 85 58 77 58 Z', fill: 'umber', stroke: 'ink', width: 2.5 },
    { layer: 'front', d: 'M22 42 C21 28 30 22 50 21 C70 22 79 28 78 42 C74 34 70 31 50 30 C30 31 26 34 22 42 Z', fill: 'ink' },
    // The crew's cap.
    ...hat(willieHead, { kind: 'beanie', band: 34 }),

  ],
  blink: 4.1,
  temper: 1,
  rest: { mouthCurve: 0.55, browLift: 1 },
};

const larsHead = { width: 31, top: 3, jaw: 90, chin: 24, bottom: 97 };
/** Lars: enormous and nearly silent. A long head, a great beard, small eyes that have seen the furnace. */
const lars: Face = {
  head: larsHead,
  eyes: { y: 38, gap: 11, rx: 2.6, ry: 3.6 },
  brows: { y: 31, gap: 11, length: 13, weight: 5.5, arch: 0.5 },
  nose: { kind: 'hook', y: 47, size: 5 },
  mouth: { y: 66, width: 8 },
  parts: [
    { layer: 'back', d: 'M19 40 C13 36 12 50 20 51 Z', fill: 'paper', stroke: 'ink', width: 2.5 },
    { layer: 'back', d: 'M81 40 C87 36 88 50 80 51 Z', fill: 'paper', stroke: 'ink', width: 2.5 },
    // The beard: the mouth is somewhere in it.
    { layer: 'mouth', spill: true, d: 'M19 48 C22 62 30 56 38 60 C44 56 56 56 62 60 C70 56 78 62 81 48 C86 76 72 100 50 102 C28 100 14 76 19 48 Z M42 69 C46 72 54 72 58 69 C55 66 45 66 42 69 Z', fill: 'grey', stroke: 'ink', width: 2.5 },
    // The crew's cap.
    ...hat(larsHead, { kind: 'beanie', band: 31 }),

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

const gaylordHead = { width: 28, top: 12, jaw: 88, chin: 21, bottom: 93 };
/**
 * Gaylord Montague, Esquire: villain-coded, never a villain. A wide jaw, a cleft
 * chin, a thin scar, and no mouth to speak of: a fat twirled moustache that his
 * cigarette holder disappears into. A top hat worn low and askew, so low his
 * brows stay under the brim. Rattled or not, the moustache keeps its smile. Pleased,
 * his cigarette tips up; rattled, it droops and his eyes glance aside: his only
 * tells. He doesn't sweat.
 */
const gaylord: Face = {
  head: gaylordHead,
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
    // A cigarette in a long holder, from the corner of his mouth out past the frame: held loosely, drooping a little.
    { layer: 'over', swing: true, d: 'M62 75 L91 80', fill: 'none', stroke: 'ink', width: 3 },
    { layer: 'over', swing: true, d: 'M89 79.8 L101 81.3', fill: 'none', stroke: 'paper', width: 3.4 },
    { layer: 'over', swing: true, d: 'M89 79.8 L101 81.3', fill: 'none', stroke: 'ink', width: 0.8 },
    // The top hat, worn low on his brow and askew, too tall for any frame.
    ...hat(gaylordHead, { kind: 'top', band: 34, size: 33, tilt: -6, layer: 'over' }),

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
    nervous: { browCock: -4.5, eyeOpen: 0.82, mouthCurve: 0.15, lean: -4, pipe: 1.6 },
  },
  // His tells, rattled, and only then: his eyes glance aside, and the cigarette droops.
  tic: { effect: 'shifty', every: 8, when: 'nervous' },
};

const steamboatBillHead = { width: 26, top: 12, jaw: 84, chin: 18, bottom: 91 };
/**
 * Steamboat Bill: plain and stone-faced, under a flat porkpie hat. The same
 * doomed stare whatever the cards; that's the joke, and the man.
 */
const steamboatBill: Face = {
  head: steamboatBillHead,
  eyes: { y: 49, gap: 11, rx: 4.4, ry: 6.4 },
  brows: { y: 39, gap: 11, length: 11, weight: 3, arch: 0 },
  nose: { kind: 'hook', y: 57, size: 4 },
  mouth: { y: 74, width: 7 },
  parts: [
    { layer: 'back', d: 'M25 49 C18 45 18 59 26 59 Z', fill: 'paper', stroke: 'ink', width: 2.4 },
    { layer: 'back', d: 'M75 49 C82 45 82 59 74 59 Z', fill: 'paper', stroke: 'ink', width: 2.4 },
    // Hair under the brim.
    { layer: 'front', d: 'M25 42 C24 34 27 31 32 30 L30 37 Z M75 42 C76 34 73 31 68 30 L70 37 Z', fill: 'ink' },
    // The porkpie.
    ...hat(steamboatBillHead, { kind: 'porkpie', band: 31 }),

  ],
  blink: 8.5,
  temper: 0,
  dry: true,
  rest: { browTilt: -0.15 },
};

const konradHead = { width: 30, top: 12, jaw: 84, chin: 24, bottom: 90 };
/** Konrad Marlowe, "Whiteknuckle", captain of the Monarch: a captain's cap with an anchor, white whiskers all round. */
const konrad: Face = {
  head: konradHead,
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
    // The captain's cap: a white top, an anchor.
    ...hat(konradHead, { kind: 'officer', band: 33, colour: 'paper', badge: 'anchor', badgeColour: 'ink' }),

  ],
  // The peak hides his brows, rather than cut through them.
  brim: 43,
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

const harbourMasterHead = { width: 34, top: 12, jaw: 92, chin: 30, bottom: 92 };
/** Horace Quaid, the harbour master: a bulldog's jowls, an official cap, eyes narrowed at the charges. */
const harbourMaster: Face = {
  head: harbourMasterHead,
  eyes: { y: 47, gap: 12, rx: 3.2, ry: 4.2 },
  brows: { y: 39, gap: 10, length: 14, weight: 5, arch: 0 },
  nose: { kind: 'bulb', y: 59, size: 6, pale: true },
  mouth: { y: 77, width: 12 },
  parts: [
    { layer: 'back', d: 'M17 48 C9 44 9 59 18 59 Z', fill: 'paper', stroke: 'ink', width: 2.5 },
    { layer: 'back', d: 'M83 48 C91 44 91 59 82 59 Z', fill: 'paper', stroke: 'ink', width: 2.5 },
    // Jowls.
    { layer: 'face', d: 'M22 70 C24 82 32 88 38 86 M78 70 C76 82 68 88 62 86', fill: 'none', stroke: 'ink', width: 2 },
    // The official cap, with a badge.
    ...hat(harbourMasterHead, { kind: 'officer', band: 34, badge: 'dot' }),

  ],
  // The peak hides his brows, rather than cut through them.
  brim: 44,
  blink: 6.1,
  temper: 0.7,
  // Square as a bollard: drawn smaller, or he fills the frame to the corners.
  zoom: 1.03,
  rest: { eyeOpen: 0.65, mouthCurve: -0.3, browTilt: 0.5 },
  tic: { effect: 'wrinkle', every: 12 },
};

const foremanHead = { width: 31, top: 12, jaw: 86, chin: 26, bottom: 90 };
/** Mick Doolan, the coal yard's foreman: a bowler, coal dust, stubble, and a grin he can't keep down. */
const foreman: Face = {
  head: foremanHead,
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
    ...hat(foremanHead, { kind: 'bowler', band: 31 }),

  ],
  blink: 4.4,
  temper: 1,
  rest: { mouthCurve: 0.5 },
  // Nervous, the grin has further to fall.
  moods: { nervous: { browLift: 3, browTilt: -1, eyeOpen: 1.2, lookX: -0.7, lookY: -0.2, mouthCurve: -0.55, wobble: 1.3, lean: 4, sweat: 1 } },
};

const ellieHead = { width: 24, top: 14, jaw: 78, chin: 11, bottom: 90 };
/**
 * Ellie Sawyer, the rapids pilot, and a swashbuckler by her own account: a dark
 * pilot's cap with a ship's wheel on the badge, worn raked over one eye; black
 * curls in a bob, a kiss curl; big eyes, a narrow chin, and a smile that dares
 * you to try the Long Reach.
 */
const ellie: Face = {
  head: ellieHead,
  eyes: { y: 51, gap: 10, rx: 4.4, ry: 6.6, lashes: true, soft: true },
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
    // The pilot's cap, a ship's wheel on the badge, raked over one eye.
    ...hat(ellieHead, { kind: 'officer', band: 34, badge: 'wheel', tilt: -10, layer: 'over', fit: 6, size: 28 }),

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

const rourkeHead = { width: 27, top: 12, jaw: 84, chin: 20, bottom: 90 };
/** Tommy Rourke, on the picket line at Rock Island, one of the Black miners in the strike: a soft cap with a strike button, stubble, and a matchstick in the corner of his mouth. */
const rourke: Face = {
  head: rourkeHead,
  fill: 'tan',
  eyes: { y: 49, gap: 11, rx: 4, ry: 5.6, soft: true },
  brows: { y: 39, gap: 11, length: 11, weight: 3.2, arch: 2 },
  nose: { kind: 'hook', y: 58, size: 4.5 },
  mouth: { y: 74, width: 12 },
  parts: [
    { layer: 'back', d: 'M24 48 C17 44 17 59 25 59 Z', fill: 'tan', stroke: 'ink', width: 2.4 },
    { layer: 'back', d: 'M76 48 C83 44 83 59 75 59 Z', fill: 'tan', stroke: 'ink', width: 2.4 },
    { layer: 'face', d: 'M37 80 h.1 M42 83 h.1 M48 84 h.1 M54 84 h.1 M60 82 h.1 M64 79 h.1 M45 87 h.1 M55 87 h.1', stroke: 'ink', width: 1.8 },
    // A matchstick.
    { layer: 'over', swing: true, d: 'M60 74 L72 86', fill: 'none', stroke: 'ink', width: 2 },
    { layer: 'over', swing: true, d: 'M71 85 L73.5 87.5', fill: 'none', stroke: 'ink', width: 3.8 },
    // A soft cap, panels and a button.
    ...hat(rourkeHead, { kind: 'soft', band: 34, colour: 'grey' }),
    // The strike button, on the side of his cap.
    { layer: 'front', d: 'M63 24 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 Z', fill: 'paper', stroke: 'ink', width: 1.6 },
    { layer: 'front', d: 'M65.5 24 h3', fill: 'none', stroke: 'ink', width: 1.4 },
  ],
  pivot: [60, 74],
  blink: 4.3,
  temper: 1,
  rest: { mouthCurve: 0.35, smirk: 0.4, eyeOpen: 0.9 },
};

const oddsHead = { width: 28, top: 13, jaw: 86, chin: 26, bottom: 88 };
/** Ottilie Pfeiffer, "Odds", the bookmaker of Bettendorf: a straw boater over pinned-up hair, round cheeks, earrings, and a grin that has already set the odds. */
const odds: Face = {
  head: oddsHead,
  eyes: { y: 50, gap: 11, rx: 3.8, ry: 5.2, lashes: true, soft: true },
  brows: { y: 41, gap: 11, length: 10, weight: 3, arch: 3 },
  nose: { kind: 'button', y: 60, size: 4 },
  mouth: { y: 74, width: 12 },
  parts: [
    { layer: 'back', d: 'M23 49 C16 45 16 60 24 60 Z', fill: 'paper', stroke: 'ink', width: 2.4 },
    { layer: 'back', d: 'M77 49 C84 45 84 60 76 60 Z', fill: 'paper', stroke: 'ink', width: 2.4 },
    // Hair pinned up under the boater, and earrings.
    { layer: 'back', d: 'M20 56 C14 34 26 20 50 20 C74 20 86 34 80 56 C76 48 74 40 70 36 L30 36 C26 40 24 48 20 56 Z', fill: 'ink' },
    { layer: 'front', d: 'M21 61 a2.4 3.2 0 1 0 4.8 0 a2.4 3.2 0 1 0 -4.8 0 Z M74.2 61 a2.4 3.2 0 1 0 4.8 0 a2.4 3.2 0 1 0 -4.8 0 Z', fill: 'paper', stroke: 'ink', width: 1.4 },
    // The boater.
    ...hat(oddsHead, { kind: 'boater', band: 31 }),

  ],
  blink: 3.9,
  temper: 1,
  rest: { mouthCurve: 0.45, browLift: 1 },
  tic: { effect: 'shifty', every: 9 },
};

/** Lenny King, the troubadour: curly hair, heavy lids, a long nose, the face of a man who has seen it all and can change none of it, and the scroll of a cardboard violin at his shoulder. */
const lenny: Face = {
  head: { width: 25, top: 14, jaw: 84, chin: 17, bottom: 92 },
  eyes: { y: 50, gap: 10.5, rx: 3.6, ry: 5.2 },
  brows: { y: 46, gap: 10.5, length: 11, weight: 3.2, arch: 0.5 },
  nose: { kind: 'bulb', y: 63, size: 5.6, pale: true },
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
  rest: { browTilt: -0.25, mouthCurve: -0.3, eyeOpen: 0.55, lookY: 0.5 },
  // The same mouth whatever the cards: it's all hopeless anyway. Everybody knows.
  moods: {
    confident: { browCock: 2, eyeOpen: 0.85, lean: -3 },
    nervous: { browLift: 1.5, browTilt: -0.6, eyeOpen: 1.2, lookX: -0.6, lean: 3, sweat: 1 },
  },
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
    { layer: 'front', d: 'M38 23 C36 13 44 17 45 10 C49 18 53 11 56 17 C60 13 63 21 62 24 C55 20 45 20 38 23 Z', fill: 'ink' },
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

/**
 * Ignatz, the Hurler: all eyes. Very tall ones, puzzled at everything, on a long
 * face that narrows to a small chin; a triangle of hair pointing
 * down onto his forehead, and nothing else. No moods to speak of: he always throws, and sticks it out,
 * and rarely gets it right.
 */
const ignatz: Face = {
  head: { width: 24, top: 14, jaw: 76, chin: 11, bottom: 93 },
  eyes: { y: 50, gap: 8.5, rx: 3.6, ry: 12 },
  brows: { y: 34, gap: 8.5, length: 8, weight: 0, arch: 1 },
  mouth: { y: 84, width: 7, hidden: true },
  parts: [
    { layer: 'back', d: 'M27 50 C20 46 20 60 28 60 Z', fill: 'paper', stroke: 'ink', width: 2.4 },
    { layer: 'back', d: 'M73 50 C80 46 80 60 72 60 Z', fill: 'paper', stroke: 'ink', width: 2.4 },
    // A triangle of hair, pointing down onto his forehead.
    { layer: 'front', d: 'M37 27 L50 38 L63 27', fill: 'none', stroke: 'ink', width: 2.4 },
  ],
  // He hardly ever blinks.
  blink: 31,
  temper: 0,
  dry: true,
  rest: { lookX: 0.35, lookY: -0.35 },
};

/** Nemo, the Sleepwalker: never quite awake. Heavy lids, eyes drifting up after something nobody else can see, one brow puzzled, a bushy, dishevelled mane he's slept in. */
const nemo: Face = {
  head: { width: 27, top: 14, jaw: 82, chin: 22, bottom: 88 },
  eyes: { y: 50, gap: 11, rx: 4, ry: 5.8 },
  brows: { y: 46, gap: 11, length: 10, weight: 2.4, arch: 3 },
  nose: { kind: 'button', y: 60, size: 3 },
  mouth: { y: 72, width: 10 },
  parts: [
    { layer: 'back', d: 'M24 49 C17 45 17 60 25 60 Z', fill: 'paper', stroke: 'ink', width: 2.4 },
    { layer: 'back', d: 'M76 49 C83 45 83 60 75 60 Z', fill: 'paper', stroke: 'ink', width: 2.4 },
    // A bushy, dishevelled mane, slept in.
    { layer: 'back', d: 'M13.5 33.3 Q4.0 26.1 11.7 25.5 Q8.4 19.4 21.9 24.2 Q12.6 12.1 20.1 13.7 Q19.6 6.9 30.0 14.6 Q29.0 5.4 35.2 9.3 Q37.1 2.8 43.8 14.1 Q45.3 -2.3 50.0 3.2 Q54.7 -2.3 57.1 9.4 Q62.3 4.6 62.9 13.8 Q71.9 3.7 72.7 10.4 Q79.7 7.6 75.0 18.8 Q84.4 14.8 82.3 21.2 Q89.8 20.5 81.8 28.8 Q96.0 26.1 91.6 31.7 L74 62 L26 62 Z', fill: 'ink' },
    { layer: 'front', d: 'M22 50 C14 14 86 14 78 50 C76 44 73 41 70 42 C68 35 62 32 58 36 C55 30 48 30 45 35 C41 30 35 32 33 38 C29 37 25 42 22 50 Z', fill: 'ink' },
    // Z, z, z.
    { layer: 'over', d: 'M80 6 H86 L80 12 H86 M89 -2 H93 L89 2 H93', fill: 'none', stroke: 'ink', width: 1.6 },
  ],
  blink: 7,
  slowBlink: true,
  temper: 0.8,
  rest: { eyeOpen: 0.5, browCock: 2.5, lookX: 0.5, lookY: -0.6, mouthCurve: 0.12, smirk: -0.4, lean: 6 },
  // Sleepwalking: worry reaches his brows and eyes, never his mouth, and he doesn't sweat.
  moods: { nervous: { browLift: 2, browTilt: -0.6, eyeOpen: 1.15, lookX: -0.6, lean: 4 } },
  dry: true,
};

const walrusHead = { width: 30, top: 12, jaw: 84, chin: 26, bottom: 90 };
/** The Walrus, an old sea dog and one of the river's few Black captains: a captain's cap with braid, a mighty moustache, and a big straight beard that won't keep to the frame. */
const walrus: Face = {
  head: walrusHead,
  fill: 'umber',
  eyes: { y: 46, gap: 11, rx: 3.2, ry: 4.4, soft: true },
  brows: { y: 37, gap: 11, length: 12, weight: 5, arch: 1 },
  nose: { kind: 'bulb', y: 56, size: 5.5, pale: true },
  mouth: { y: 74, width: 8, hidden: true },
  parts: [
    { layer: 'back', d: 'M21 46 C14 42 14 57 22 57 Z', fill: 'umber', stroke: 'ink', width: 2.4 },
    { layer: 'back', d: 'M79 46 C86 42 86 57 78 57 Z', fill: 'umber', stroke: 'ink', width: 2.4 },
    // The beard: big and straight, down past the frame.
    { layer: 'face', spill: true, d: 'M22 52 C21 68 25 86 32 101 L68 101 C75 86 79 68 78 52 C73 62 66 66 50 66 C34 66 27 62 22 52 Z', fill: 'grey', stroke: 'ink', width: 2.4 },
    { layer: 'face', d: 'M37 72 L38 94 M45 74 L45 98 M55 74 L55 98 M63 72 L62 94', fill: 'none', stroke: 'ink', width: 1.2 },
    // The moustache, mighty, over everything below the nose.
    { layer: 'mouth', d: 'M50 62 C40 58 26 60 22 70 C30 68 40 70 50 68 C60 70 70 68 78 70 C74 60 60 58 50 62 Z', fill: 'paper', stroke: 'ink', width: 2.2 },
    // The captain's cap, braid and an anchor.
    ...hat(walrusHead, { kind: 'officer', band: 33, braid: true, badge: 'anchor' }),

  ],
  blink: 5.4,
  temper: 0.8,
  rest: { eyeOpen: 0.85 },
};

/** Eliza Bathory, Bone Pale: charming, patient, terribly polite, and never once seen to smile. A widow's peak, hair swept up, a stare, a pearl choker, a black collar, and a cigarette in a long holder. */
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
    // A cigarette in a long holder.
    { layer: 'over', swing: true, d: 'M57 74 L88 80', fill: 'none', stroke: 'ink', width: 2.6 },
    { layer: 'over', swing: true, d: 'M86 79.6 L97 81.7', fill: 'none', stroke: 'paper', width: 3 },
    { layer: 'over', swing: true, d: 'M86 79.6 L97 81.7', fill: 'none', stroke: 'ink', width: 0.8 },
  ],
  smoke: [98, 79],
  pivot: [57, 74],
  blink: 7.2,
  temper: 0.6,
  dry: true,
  rest: { mouthCurve: -0.08, browTilt: 0.5, eyeOpen: 1 },
  // She never smiles: pleased, the stare narrows and the cigarette rises; rattled, it widens and looks away.
  moods: {
    confident: { browTilt: 0.9, eyeOpen: 0.75, lean: -3, pipe: -1 },
    nervous: { browTilt: 0.2, eyeOpen: 1.1, lookX: -0.6, pipe: 0.6 },
  },
};

const finlayHead = { width: 31, top: 10, jaw: 86, chin: 26, bottom: 90 };
/** Finlay, the Carouser: a bricklayer who struck it rich and never got used to it. A bald head with three hairs combed over under a bowler tipped jauntily, a big grin, and a fat cigar he chomps on. */
const finlay: Face = {
  head: finlayHead,
  eyes: { y: 47, gap: 12, rx: 3.8, ry: 5.2 },
  brows: { y: 38, gap: 12, length: 11, weight: 3.4, arch: 3 },
  nose: { kind: 'bulb', y: 58, size: 6.5, tint: 'sand' },
  mouth: { y: 73, width: 15 },
  parts: [
    { layer: 'back', d: 'M20 46 C13 42 13 58 21 58 Z', fill: 'paper', stroke: 'ink', width: 2.4 },
    { layer: 'back', d: 'M80 46 C87 42 87 58 79 58 Z', fill: 'paper', stroke: 'ink', width: 2.4 },
    // Three hairs, combed over.
    { layer: 'face', d: 'M34 22 C42 14 56 14 66 20 M36 26 C44 19 56 19 64 24 M38 30 C46 24 56 24 62 28', fill: 'none', stroke: 'ink', width: 1.6 },
    // Stubble: he's been at it a while.
    { layer: 'face', d: 'M30 74 h.1 M34 79 h.1 M39 83 h.1 M45 86 h.1 M51 87 h.1 M57 86 h.1 M63 83 h.1 M68 79 h.1 M72 74 h.1 M36 75 h.1 M42 80 h.1 M58 80 h.1 M64 75 h.1 M48 82 h.1 M54 82 h.1', stroke: 'grey', width: 1.8 },
    // The cigar, from the left of his grin, and the lip that chomps it.
    { layer: 'over', swing: true, d: 'M38 69 L15 65 L14 71 L37 74.5 Z', fill: 'grey', stroke: 'ink', width: 2 },
    { layer: 'over', swing: true, d: 'M28 67.4 L27 73', fill: 'none', stroke: 'ink', width: 1.6 },
    { layer: 'over', swing: true, d: 'M42 69 C41 65 36 65 35 68 M42 75 C40 78 36 77 35 74', fill: 'none', stroke: 'ink', width: 2.2 },
    // A bowler, tipped jauntily.
    ...hat(finlayHead, { kind: 'bowler', band: 32, tilt: 8, layer: 'over' }),

  ],
  smoke: [12, 64],
  pivot: [39, 71],
  blink: 4.2,
  temper: 1.1,
  leftSide: true,
  rest: { mouthCurve: 0.65 },
};

// The debris (story/characters/debris.ts): drafts, for review (docs/drafts-2026-11-17.md).

/**
 * A crate, adrift: a box of planks, a little askew, a nail head for a nose,
 * the river lapping at its bottom slat. Soggy, and so hopeful about it: someone
 * might fish it out. Worried brows that are really just eager ones.
 */
const crate: Face = {
  head: { outline: 'M15 24 L83 19 L87 86 L13 90 Z' },
  fill: 'tan',
  eyes: { y: 45, gap: 13, rx: 4.6, ry: 6.4 },
  brows: { y: 33, gap: 13, length: 11, weight: 3, arch: 2.5 },
  nose: { kind: 'button', y: 56, size: 2.6, tint: 'grey' },
  mouth: { y: 67, width: 12 },
  parts: [
    // The seams between the slats, and the slats' grain.
    { layer: 'face', d: 'M14.4 46 L85.2 42 M13.6 68 L86.3 65', fill: 'none', stroke: 'ink', width: 1.8 },
    { layer: 'face', d: 'M22 31 C30 30 34 32 42 30 M60 28 C66 27 70 29 76 27 M70 54 C74 53 78 55 82 53 M19 76 C25 75 29 77 34 75', fill: 'none', stroke: 'grey', width: 1.2 },
    // Nails at the corners.
    { layer: 'face', d: 'M20 29 h.1 M78 25 h.1 M81 82 h.1 M19 84 h.1', fill: 'none', stroke: 'ink', width: 3 },
    // A corner of the top slat, sprung and drooping.
    { layer: 'front', d: 'M83 19 L95 24 L93 29 L84 27 Z', fill: 'tan', stroke: 'ink', width: 2 },
    // Damp: a dark tide mark along the bottom, and a drip.
    { layer: 'face', d: 'M13.4 80 C30 78 40 82 52 79 C64 77 74 81 86.7 78 L87 86 L13 90 Z', fill: 'umber' },
    { layer: 'front', d: 'M30 80 C29 84 28 86 30 87 C32 86 31 84 30 80 Z M64 79 C63 82 62 84 64 85 C66 84 65 82 64 79 Z', fill: 'paper', stroke: 'ink', width: 1.2 },
    // The river, lapping.
    { layer: 'front', d: 'M0 88 C10 82 18 90 28 85 C38 80 46 89 56 84 C66 79 76 88 86 83 C92 80 96 84 100 83 L100 104 L0 104 Z', fill: 'grey', stroke: 'ink', width: 2 },
    { layer: 'front', d: 'M14 94 C22 91 28 95 36 92 M58 93 C66 90 72 94 82 91', fill: 'none', stroke: 'paper', width: 1.6 },
  ],
  blink: 3.2,
  temper: 1.1,
  zoom: 1.02,
  // Hopeful already: brows up, a small smile. Its nerves are a wobble, and wide eyes.
  rest: { browLift: 2, browTilt: -0.6, mouthCurve: 0.35, lookY: -0.3 },
  moods: { nervous: { browLift: 3, browTilt: -1.2, eyeOpen: 1.25, mouthCurve: -0.25, wobble: 1, lean: 5 } },
  dry: true,
};

/**
 * A sawyer: a whole tree, roots in the mud, nodding up and down in the current.
 * Bark for skin, a knot for a nose, the stubs of branches up top, and the
 * patience of something that has all spring. Heavy lids, a slow blink, a smile
 * that's mostly on one side.
 */
const sawyer: Face = {
  head: { outline: 'M26 104 C28 80 25 56 27 36 C28 22 32 12 38 6 L46 14 L52 4 L60 13 L66 7 C71 16 73 28 74 40 C75 60 72 82 75 104 Z' },
  fill: 'umber',
  eyes: { y: 44, gap: 10.5, rx: 3.8, ry: 5, soft: true },
  brows: { y: 36, gap: 10.5, length: 10, weight: 3.6, arch: 1 },
  nose: { kind: 'hook', y: 54, size: 4.2 },
  mouth: { y: 68, width: 11 },
  parts: [
    // Bark: long furrows down the trunk.
    { layer: 'face', d: 'M33 24 C31 34 32 40 31 50 M35 74 C33 84 34 92 33 102 M67 22 C69 32 68 42 69 50 M66 76 C68 86 67 94 68 102 M50 82 C49 90 51 96 50 104', fill: 'none', stroke: 'ink', width: 1.5 },
    // A knot, and a twig with two leaves: spring's here, even for a sawyer.
    { layer: 'face', d: 'M56 86 C59 83 63 85 62 89 C60 92 56 91 56 86 Z', fill: 'ink' },
    { layer: 'over', d: 'M74 58 L90 50', fill: 'none', stroke: 'ink', width: 3 },
    { layer: 'over', d: 'M84 53 C86 45 93 44 94 46 C93 51 88 54 84 53 Z M88 51 C93 53 96 58 95 59 C90 59 88 55 88 51 Z', fill: 'paper', stroke: 'ink', width: 1.6 },
    // The broken crown: stubs of branches.
    { layer: 'over', d: 'M38 8 L30 -2 M66 9 L76 0 M52 6 L53 -4', fill: 'none', stroke: 'ink', width: 3.4 },
    // Wet to the waterline, and the current about it.
    { layer: 'front', d: 'M0 84 C12 79 20 87 30 83 C40 79 46 86 54 82 C64 78 72 86 82 82 C90 79 96 83 100 82 L100 104 L0 104 Z', fill: 'grey', stroke: 'ink', width: 2 },
    { layer: 'front', d: 'M18 91 C26 88 32 92 40 89 M60 90 C68 87 74 91 84 88', fill: 'none', stroke: 'paper', width: 1.6 },
  ],
  blink: 9.5,
  slowBlink: true,
  temper: 0.7,
  // Sly, and in no hurry: lids half down, one brow up, the smile on one side, nodding with the current.
  rest: { eyeOpen: 0.6, browCock: 2, mouthCurve: 0.3, smirk: 0.5, lean: 4, lookX: 0.25 },
  moods: { nervous: { eyeOpen: 0.9, browLift: 1, mouthCurve: 0, smirk: 0.2, lean: -3, lookX: -0.4 } },
  dry: true,
  tic: { effect: 'shifty', every: 9, when: 'confident' },
};

/**
 * A deadhead: a waterlogged log floating on end, the top of it a hand under the
 * surface. You see its face end-on, rings and all, with the river running over
 * its crown. Sullen and lurking: low brows, eyes looking up from under them, a
 * mouth turned down at the world. It has a grievance, and that grievance is hulls.
 */
const deadhead: Face = {
  head: { outline: 'M50 20 C74 20 86 36 86 56 C86 78 72 94 50 94 C28 94 14 78 14 56 C14 36 26 20 50 20 Z' },
  fill: 'umber',
  eyes: { y: 54, gap: 12, rx: 4.2, ry: 4.6, soft: true },
  brows: { y: 46, gap: 12, length: 13, weight: 4.4, arch: -0.5 },
  mouth: { y: 74, width: 14 },
  parts: [
    // The rings, and a check split in from the edge.
    { layer: 'face', d: 'M50 28 C68 28 78 40 78 55 C78 72 66 84 50 84 C34 84 22 72 22 55 C22 40 32 28 50 28 Z', fill: 'none', stroke: 'ink', width: 1.2 },
    { layer: 'face', d: 'M86 60 L74 63 L76 68', fill: 'none', stroke: 'ink', width: 1.8 },
    // Weed trailing off the bark.
    { layer: 'front', d: 'M18 72 C14 80 18 86 13 94 M22 80 C20 88 24 92 21 100 M80 78 C84 86 80 92 85 100', fill: 'none', stroke: 'ink', width: 1.8 },
    // The river running over the top of it: it lies a hand under the surface.
    { layer: 'front', d: 'M0 36 C12 30 22 39 34 33 C46 27 56 37 68 31 C80 25 90 34 100 30 L100 -4 L0 -4 Z', fill: 'grey', stroke: 'ink', width: 2 },
    { layer: 'front', d: 'M6 22 C16 18 24 24 34 20 M58 23 C68 19 76 25 88 20 M28 12 C36 9 42 13 50 10', fill: 'none', stroke: 'paper', width: 1.8 },
  ],
  blink: 8,
  temper: 0.5,
  zoom: 1.06,
  // Sulking already: cross brows, eyes up from under them, a frown.
  rest: { browTilt: 1.2, browLift: -1, eyeOpen: 0.7, lookY: -0.5, mouthCurve: -0.45 },
  moods: { confident: { browTilt: 1.4, mouthCurve: 0.1, smirk: 0.6, lookX: 0.4, eyeOpen: 0.6 } },
  dry: true,
  tic: { effect: 'shifty', every: 7 },
};

/**
 * A drift pile: brush, branches, and a barn door riding in the middle of it
 * all, which makes a fine face. Planks, battens, a horseshoe still nailed on
 * for luck (not yours), and sticks in every direction. A big grin under cross
 * brows: delighted to see you, and heading for your wheel.
 */
const driftPile: Face = {
  head: { outline: 'M16 24 L80 14 L87 80 L20 90 Z' },
  fill: 'sand',
  eyes: { y: 44, gap: 13, rx: 5, ry: 6.6 },
  brows: { y: 32, gap: 13, length: 12, weight: 4, arch: 1 },
  nose: { kind: 'button', y: 55, size: 3, tint: 'grey' },
  mouth: { y: 69, width: 18 },
  parts: [
    // Brush behind it: branches every which way.
    { layer: 'back', d: 'M20 24 L2 8 M10 16 L4 22 M22 50 L-2 46 M18 76 L0 92 M6 84 L2 78 M80 22 L98 4 M90 12 L98 16 M84 48 L102 54 M82 80 L100 96 M92 88 L98 82 M48 18 L44 0 M62 17 L70 2', fill: 'none', stroke: 'ink', width: 3 },
    { layer: 'back', d: 'M4 34 C10 28 16 32 18 38 C12 40 8 40 4 34 Z M96 66 C90 60 84 64 82 70 C88 72 92 72 96 66 Z', fill: 'grey', stroke: 'ink', width: 1.6 },
    // The door's planks, and its battens.
    { layer: 'face', d: 'M32 21.5 L36 87.5 M48 19 L52 85 M64 16.5 L69 83', fill: 'none', stroke: 'ink', width: 1.4 },
    { layer: 'face', d: 'M17 31 L80 21 M20 82 L86 72', fill: 'none', stroke: 'ink', width: 5 },
    { layer: 'face', d: 'M17 31 L80 21 M20 82 L86 72', fill: 'none', stroke: 'grey', width: 2.8 },
    // A horseshoe, still nailed on, for somebody's luck.
    { layer: 'face', d: 'M43 22 C44 30 56 28 55 20', fill: 'none', stroke: 'ink', width: 2.6 },
    // Brush caught across its corners, a branch through it, and a bird's nest snagged on top.
    { layer: 'over', d: 'M-2 60 L22 63 M78 64 L100 66 M2 98 L34 78 M10 100 L28 84 M70 98 L98 74 M86 100 L94 86 M6 14 L28 34', fill: 'none', stroke: 'ink', width: 3.4 },
    { layer: 'over', d: 'M8 92 C14 86 18 94 24 88 C28 84 32 92 38 86 M66 90 C72 84 76 92 82 86 C86 82 90 88 96 82', fill: 'none', stroke: 'ink', width: 1.6 },
    { layer: 'over', d: 'M76 12 C78 4 92 4 94 12 C90 16 80 16 76 12 Z', fill: 'grey', stroke: 'ink', width: 1.8 },
    { layer: 'over', d: 'M78 10 L92 8 M80 13 L90 11', fill: 'none', stroke: 'ink', width: 1 },
  ],
  blink: 4.4,
  temper: 1,
  zoom: 1.02,
  // Cheerfully menacing: a grin under cross brows, already.
  rest: { browTilt: 1, mouthCurve: 0.7, lean: -3 },
  // Rattled, it keeps the grin and loses the brows.
  moods: { nervous: { browTilt: -0.8, browLift: 2, mouthCurve: 0.45, wobble: 0.8, eyeOpen: 1.2 } },
  dry: true,
  tic: { effect: 'twitch', every: 6 },
};

/** By the id they go by at the table and in the story. */
export const FACES = { gus, willie, lars, sandbar: sandy, iceSheet, gaylord, steamboatBill, morag, konrad, harbourMaster, foreman, ellie, tripp, rourke, odds, lenny, maxMoritz, ignatz, nemo, walrus, eliza, finlay, crate, sawyer, deadhead, driftPile };
export type FaceId = keyof typeof FACES;

export const hasFace = (id: string): id is FaceId => id in FACES;
