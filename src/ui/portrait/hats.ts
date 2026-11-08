/**
 * Hats, by rule: a hat sits on the head it's drawn for. Its crown keeps its own
 * shape (a bowler's dome, a cap's puff, an officer's flat top), but its opening
 * is the head: the crown meets the head's outline where the band goes, so it
 * can't float above it or swallow it. The brim or peak is free to jut. A tilted
 * hat turns about the middle of the head, so it still sits on it, at an angle.
 */
import type { Part } from './rig';

/** A head's numbers, as in `Face.head`: the rig's jowly oval. */
export interface Head {
  width: number;
  top: number;
  jaw: number;
  chin: number;
  bottom: number;
}

type Colour = 'ink' | 'paper' | 'grey' | 'sand';
type Badge = 'anchor' | 'wheel' | 'dot';

export interface HatSpec {
  kind: 'beanie' | 'flat' | 'soft' | 'bowler' | 'top' | 'porkpie' | 'boater' | 'officer';
  /** Where the band sits: the crown's lower edge, across the brow. */
  band: number;
  /** Degrees, about the middle of the head. */
  tilt?: number;
  /** `over` lets the hat break out of the frame. */
  layer?: 'front' | 'over';
  /** The crown's colour (the band's, for an officer's cap with a white top). */
  colour?: Colour;
  /** A brim's half width, a peak's half width, or a top hat's height: see each kind. */
  size?: number;
  badge?: Badge;
  badgeColour?: Colour;
  /** Braid on the band (a sea dog's cap). */
  braid?: boolean;
  /** Room for hair: the opening is this much wider than the head (a mass of curls). */
  fit?: number;
}

const BOW = 2.5;
const r = (n: number) => Math.round(n * 10) / 10;

/** A point on the head's top curve, at t from 0 (left, at y 46) to 1 (right). */
function at(h: Head, t: number): [number, number] {
  return [50 - h.width + 2 * h.width * (3 * t * t - 2 * t * t * t), 46 - 3 * (46 - h.top) * (t - t * t)];
}
/** Where the curve crosses height y, on the left (the right is 1 − t). */
function crossing(h: Head, y: number): number {
  const k = (46 - y) / (3 * (46 - h.top));
  return (1 - Math.sqrt(Math.max(0, 1 - 4 * k))) / 2;
}
const apexY = (h: Head) => 46 - 0.75 * (46 - h.top);

/** Where the head's edge is at height y (pushed out by d). */
function edges(h: Head, y: number, d = 2): [number, number] {
  const [x] = at(h, crossing(h, y));
  return [r(x - d), r(100 - x + d)];
}
/** A hat's straight sides, from the band up to `height`: a top hat, a porkpie, a boater. */
function cylinder(h: Head, band: number, height: number, flare = 1): string {
  const [l, rt] = edges(h, band, 1.5);
  const top = band - height;
  return `M${l} ${band} L${r(l - flare)} ${top} Q50 ${r(top - 3)} ${r(rt + flare)} ${top} L${rt} ${band} Q50 ${r(band + 2 * BOW)} ${l} ${band} Z`;
}
/** A crown of its own shape, opening onto the head at the band: `top` is its height, `spread` how far it bulges past the opening, `puff` how far forward and over it leans. */
function shaped(h: Head, band: number, top: number, spread: number, flat = 0.6): string {
  const [l, rt] = edges(h, band, 1);
  const y = band - top;
  const k = flat * spread;
  return `M${l} ${band} C${r(l - spread)} ${r(band - top * 0.45)} ${r(l - k)} ${r(y)} 50 ${r(y)} C${r(rt + k)} ${r(y)} ${r(rt + spread)} ${r(band - top * 0.45)} ${rt} ${band} Q50 ${r(band + 2 * BOW)} ${l} ${band} Z`;
}
/** A strip round the crown between two heights (a band, a ribbon, a turn-up). */
function strip(xl: number, xr: number, low: number, high: number): string {
  return `M${xl} ${low} Q50 ${r(low + 2 * BOW)} ${xr} ${low} L${xr} ${high} Q50 ${r(high + 2 * BOW)} ${xl} ${high} Z`;
}
/** A brim: free to jut, a crescent along the band. */
function brim(band: number, half: number, depth: number): string {
  return `M${50 - half} ${band - 1} Q50 ${r(band + 2 * BOW)} ${50 + half} ${band - 1} Q${50 + half - 1} ${band + depth} 50 ${r(band + depth + BOW)} Q${50 - half + 1} ${band + depth} ${50 - half} ${band - 1} Z`;
}
/** A peak: out in front, over the eyes. */
function peak(band: number, half: number, depth: number): string {
  return `M${50 - half} ${band} Q50 ${r(band + 2 * BOW)} ${50 + half} ${band} Q${50 + half - 4} ${band + depth} 50 ${r(band + depth + 2)} Q${50 - half + 4} ${band + depth} ${50 - half} ${band} Z`;
}
function badge(kind: Badge, y: number, colour: Colour): Omit<Part, 'layer'>[] {
  if (kind === 'dot') return [{ d: `M46 ${y} a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 Z`, fill: colour }];
  if (kind === 'anchor') return [{ d: `M50 ${y - 5} V${y + 4} M46 ${y + 1} C47 ${y + 5} 53 ${y + 5} 54 ${y + 1} M47.5 ${y - 4} H52.5`, fill: 'none', stroke: colour === 'paper' ? 'paper' : 'ink', width: 1.5 }];
  return [
    { d: `M45 ${y} a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0 Z`, fill: colour },
    { d: `M50 ${y - 6} V${y + 6} M44 ${y} H56 M45.8 ${y - 4.2} L54.2 ${y + 4.2} M54.2 ${y - 4.2} L45.8 ${y + 4.2}`, fill: 'none', stroke: 'ink', width: 1.1 },
  ];
}

/** A hat for this head, by kind. */
export function hat(head: Head, spec: HatSpec): Part[] {
  const h = spec.fit ? { ...head, width: head.width + spec.fit } : head;
  const { band, kind } = spec;
  const colour = spec.colour ?? 'ink';
  const parts: Omit<Part, 'layer'>[] = [];
  const top = apexY(h);
  if (kind === 'beanie') {
    parts.push({ d: shaped(h, band, band - h.top + 6, 3, 0.9), fill: colour });
    const [l, rt] = edges(h, band, 2.6);
    parts.push({ d: strip(l, rt, band, band - 7), fill: 'grey', stroke: 'ink', width: 2 });
    const ribs: string[] = [];
    for (let x = l + 6; x < rt - 3; x += 8.5) {
      const bowAt = BOW * (1 - ((x - 50) / (50 - l)) ** 2);
      ribs.push(`M${r(x)} ${r(band - 6 + bowAt)} L${r(x)} ${r(band - 1 + bowAt)}`);
    }
    parts.push({ d: ribs.join(' '), fill: 'none', stroke: 'ink', width: 1.3 });
  } else if (kind === 'flat') {
    parts.push({ d: shaped(h, band, band - h.top + 1, 4, 1.1), fill: colour });
    parts.push({ d: peak(band, spec.size ?? 23, 7), fill: 'grey', stroke: 'ink', width: 2 });
  } else if (kind === 'soft') {
    // Flat and wide: more pancake than pudding.
    const height = band - h.top - 5;
    const crownTop = band - height;
    parts.push({ d: shaped(h, band, height, 7, 1.5), fill: colour, stroke: 'ink', width: 2 });
    const [l, rt] = edges(h, band, 2.4);
    parts.push({ d: `M50 ${r(crownTop + 1)} L${r(l + 8)} ${band} M50 ${r(crownTop + 1)} L50 ${band + BOW} M50 ${r(crownTop + 1)} L${r(rt - 8)} ${band}`, fill: 'none', stroke: 'ink', width: 1.2 });
    parts.push({ d: `M47.5 ${r(crownTop + 1)} a2.5 2.5 0 1 0 5 0 a2.5 2.5 0 1 0 -5 0 Z`, fill: 'ink' });
    parts.push({ d: peak(band, spec.size ?? 22, 7), fill: 'ink' });
  } else if (kind === 'bowler') {
    parts.push({ d: shaped(h, band, band - h.top + 7, 2, 0.9), fill: colour });
    parts.push({ d: brim(band, spec.size ?? h.width + 9, 7), fill: colour });
  } else if (kind === 'top') {
    const height = spec.size ?? 32;
    parts.push({ d: cylinder(h, band, height), fill: colour });
    const [l, rt] = edges(h, band, 1.5);
    parts.push({ d: strip(r(l - 0.2), r(rt + 0.2), band - 4, band - 10), fill: 'grey' });
    parts.push({ d: brim(band, h.width + 12, 8), fill: colour });
  } else if (kind === 'porkpie') {
    parts.push({ d: cylinder(h, band, spec.size ?? 14, 0.6), fill: colour });
    const [l, rt] = edges(h, band, 1.5);
    parts.push({ d: `M${r(l + 3)} ${r(band - (spec.size ?? 14) + 2)} Q50 ${r(band - (spec.size ?? 14))} ${r(rt - 3)} ${r(band - (spec.size ?? 14) + 2)}`, fill: 'none', stroke: 'grey', width: 1.6 });
    parts.push({ d: brim(band, h.width + 7, 6), fill: colour });
  } else if (kind === 'boater') {
    const height = spec.size ?? 13;
    parts.push({ d: cylinder(h, band, height, 0.4), fill: 'sand', stroke: 'ink', width: 2 });
    const [l, rt] = edges(h, band, 1.5);
    parts.push({ d: strip(r(l - 0.1), r(rt + 0.1), band - 3, band - 8), fill: 'ink' });
    parts.push({ d: brim(band, h.width + 13, 7), fill: 'sand', stroke: 'ink', width: 2 });
  } else {
    // An officer's cap: the crown spreads into a flat top, over a band and a peak.
    parts.push({ d: shaped(h, band - 5, band - h.top - 4, 5, 1.3), fill: spec.colour ?? 'ink', stroke: 'ink', width: 2 });
    const [l, rt] = edges(h, band - 2.5, 2.4);
    parts.push({ d: strip(l, rt, band, band - 6), fill: 'grey', stroke: 'ink', width: 1.4 });
    if (spec.braid) {
      const zig: string[] = [];
      for (let x = l + 3; x < rt - 2; x += 4) zig.push(`${r(x)} ${r(band - 3 + ((x - l) % 8 < 4 ? 1.4 : -1.4) + BOW * (1 - ((x - 50) / (50 - l)) ** 2))}`);
      parts.push({ d: `M${zig.join(' L')}`, fill: 'none', stroke: 'ink', width: 1 });
    }
    parts.push({ d: peak(band, spec.size ?? 24, 8), fill: 'ink' });
  }
  if (spec.badge) parts.push(...badge(spec.badge, kind === 'officer' ? band - 12 : band - 9, spec.badgeColour ?? 'paper'));
  const layer = spec.layer ?? 'front';
  return parts.map((part) => ({ ...part, layer, ...(spec.tilt ? { tilt: [spec.tilt, 50, 52] as [number, number, number] } : {}) }));
}
