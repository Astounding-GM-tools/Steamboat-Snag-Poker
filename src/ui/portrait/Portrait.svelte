<script lang="ts">
  import { cubicOut } from 'svelte/easing';
  import { Tween } from 'svelte/motion';
  import { untrack } from 'svelte';
  import { FACES, POSES, type Backdrop, type Effect, type Face, type FaceId, type MoodBlend, type Part, type Pose } from './faces';

  /**
   * A face: one rig for everyone, in plain SVG, on a cream backdrop clipped
   * to its oval. A mood is a pose of the rig's numbers (a face may rest
   * somewhere of its own, and play a mood its own way), so moods blend and
   * glide into each other; the rest moves in CSS, as the boat does. Effects
   * are written once, here, and work on any face: `play` sets one off, and a
   * face's own tic sets it off now and then. Hats, pipes and beards may break
   * out of the oval.
   */
  let { id, mood = 'neutral', still = false, backdrop }: { id: FaceId; mood?: MoodBlend; still?: boolean; backdrop?: Backdrop } = $props();
  const face: Face = $derived(FACES[id]);
  const uid = $props.id();

  /** A mood, or a blend, as numbers, from where the face rests: its temper says how much of it shows. */
  function poseFor(blend: MoodBlend, who: Face): Pose {
    const weights = typeof blend === 'string' ? { [blend]: 1 } : blend;
    const total = Object.values(weights).reduce((a, b) => a + (b ?? 0), 0) || 1;
    const out = { ...POSES.neutral, ...who.rest };
    for (const [mood, weight] of Object.entries(weights)) {
      const own = who.moods?.[mood as keyof typeof POSES];
      const pose = own ? { ...POSES.neutral, ...own } : POSES[mood as keyof typeof POSES];
      for (const k of Object.keys(out) as (keyof Pose)[]) out[k] += ((pose[k] - POSES.neutral[k]) * (weight ?? 0) * who.temper) / total;
    }
    if (who.dry) out.sweat = 0;
    return out;
  }

  const pose = new Tween<Pose>(
    untrack(() => poseFor(mood, FACES[id])),
    { duration: 420, easing: cubicOut },
  );
  $effect(() => {
    pose.target = poseFor(mood, face);
  });
  const p = $derived(pose.current);

  // --- Effects ------------------------------------------------------------
  let acting = $state<Effect | null>(null);
  let actTimer: ReturnType<typeof setTimeout> | undefined;
  export function play(effect: Effect) {
    clearTimeout(actTimer);
    acting = null;
    requestAnimationFrame(() => {
      acting = effect;
      actTimer = setTimeout(() => (acting = null), 1500);
    });
  }
  // A face's tic: now and then, never on the beat; a tell only in its mood.
  const weightOf = (m: string) => (typeof mood === 'string' ? (mood === m ? 1 : 0) : ((mood as Record<string, number>)[m] ?? 0) / (Object.values(mood).reduce((a, b) => a + (b ?? 0), 0) || 1));
  $effect(() => {
    const tic = face.tic;
    if (!tic || still) return;
    let timer: ReturnType<typeof setTimeout>;
    const again = () => {
      timer = setTimeout(
        () => {
          if (!tic.when || weightOf(tic.when) >= 0.5) play(tic.effect);
          again();
        },
        tic.every * 1000 * (0.6 + Math.random() * 0.8),
      );
    };
    again();
    return () => clearTimeout(timer);
  });

  // --- The drawing --------------------------------------------------------
  const COLOUR = { ink: 'var(--ink, #111)', paper: 'var(--paper, #f2efe6)', sand: '#cfc8b4', grey: '#8f8c84', umber: '#70675d', tan: '#a3927d', none: 'none' };
  const fillOf = (part: Part) => COLOUR[part.fill ?? 'none'];

  const headPath = $derived.by(() => {
    const h = face.head;
    if ('outline' in h) return h.outline;
    const { width: w, top, jaw, chin, bottom } = h;
    return `M${50 - w} 46 C${50 - w} ${top} ${50 + w} ${top} ${50 + w} 46 C${50 + w} ${jaw} ${50 + chin} ${bottom} 50 ${bottom} C${50 - chin} ${bottom} ${50 - w} ${jaw} ${50 - w} 46 Z`;
  });

  /** A brow: `side` −1 is theirs on the left of the picture. The inner end tips with the mood. */
  function brow(side: -1 | 1) {
    const b = face.brows;
    const inner = 50 + side * (b.gap - b.length / 2);
    const outer = 50 + side * (b.gap + b.length / 2);
    const lift = -p.browLift - (side === 1 ? Math.max(0, p.browCock) : Math.max(0, -p.browCock));
    const tip = p.browTilt * 4;
    const y = b.y + lift;
    // Under a brim, a brow shows whole or not at all.
    const top = Math.min(y + tip, y - b.arch / 2, y - tip * 0.3) - b.weight / 2;
    if (face.brim !== undefined && top < face.brim) return '';
    return `M${inner} ${y + tip} Q${(inner + outer) / 2} ${y - b.arch} ${outer} ${y - tip * 0.3}`;
  }

  /** A pie eye: black, with a wedge of light that shows where it's looking (a dark face's eyes are round: see below). */
  function wedge(side: -1 | 1) {
    const e = face.eyes;
    const cx = 50 + side * e.gap;
    const a = Math.PI * -0.3 + p.lookX * 1.1;
    const r = Math.max(e.rx, e.ry) * 1.1;
    // Squashed with the eye, so a half-shut eye keeps its light inside it.
    const open = Math.max(0.1, p.eyeOpen);
    const tipX = cx + p.lookX * e.rx * 0.5;
    const tipY = e.y + (1 + p.lookY * e.ry * 0.5) * open;
    return `M${tipX} ${tipY} L${cx + Math.cos(a - 0.42) * r} ${e.y + Math.sin(a - 0.42) * r * 1.3 * open} L${cx + Math.cos(a + 0.42) * r} ${e.y + Math.sin(a + 0.42) * r * 1.3 * open} Z`;
  }

  const mouth = $derived.by(() => {
    const m = face.mouth;
    const left = 50 - m.width;
    const right = 50 + m.width;
    const yL = m.y - p.mouthCurve * 3 + p.smirk * 2.5;
    const yR = m.y - p.mouthCurve * 3 - p.smirk * 4;
    const mid = m.y + p.mouthCurve * 7;
    const top = p.wobble > 0.05 ? wobbled(left, yL, right, yR, mid) : `M${left} ${yL} Q50 ${mid} ${right} ${yR}`;
    if (p.mouthOpen < 0.03) return top;
    return `${top} Q50 ${mid + p.mouthOpen * 40} ${left} ${yL} Z`;
  });
  /** A nervous mouth: the line shakes. */
  function wobbled(x0: number, y0: number, x1: number, y1: number, mid: number) {
    const n = 6;
    let d = `M${x0} ${y0}`;
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      const x = x0 + (x1 - x0) * t;
      const curve = 4 * t * (1 - t) * (mid - (y0 + y1) / 2);
      // Uneven: each kink its own size.
      const y = y0 + (y1 - y0) * t + curve + (i % 2 ? 1 : -1) * 2.2 * p.wobble * (0.55 + 0.45 * Math.abs(Math.sin(i * 2.3))) * (i === n ? 0 : 1);
      d += ` L${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    return d;
  }

  const nose = $derived.by(() => {
    const n = face.nose;
    if (!n) return '';
    const { y, size: s } = n;
    if (n.kind === 'bulb') return `M${50 - s} ${y} C${50 - s * 1.4} ${y + s * 1.7} ${50 + s * 1.4} ${y + s * 1.7} ${50 + s} ${y} C${50 + s * 0.6} ${y - s * 1.1} ${50 - s * 0.6} ${y - s * 1.1} ${50 - s} ${y} Z`;
    if (n.kind === 'hook') return `M${50} ${y - s} C${50 + s * 1.6} ${y} ${50 + s * 1.2} ${y + s * 1.1} ${50 - s * 0.4} ${y + s * 0.8}`;
    return `M${50 - s} ${y} a${s} ${s * 0.8} 0 1 0 ${s * 2} 0 a${s} ${s * 0.8} 0 1 0 ${-s * 2} 0 Z`;
  });
  /** Faces fill their oval: drawn a little larger than the box, about the middle of the face. */
  const zoom = $derived(`translate(50 58) scale(${face.zoom ?? 1.16}) translate(-50 -58)`);
  const partsIn = (layer: Part['layer']) => (face.parts ?? []).filter((x) => x.layer === layer);
  /** The moustache's lift goes with the corners of the mouth. */
  const mouthShift = $derived(-p.mouthCurve * 2 - p.browLift * 0.1);
</script>

{#snippet drawn(part: Part)}
  <path transform={part.tilt ? `rotate(${part.tilt.join(' ')})` : undefined} d={part.d} fill={fillOf(part)} stroke={part.stroke ? COLOUR[part.stroke] : 'none'} stroke-width={part.width ?? 0} stroke-linejoin="round" stroke-linecap="round" />
{/snippet}

<svg class="portrait-rig" class:slow-blink={face.slowBlink} class:still class:shifty={acting === 'shifty'} class:twitch={acting === 'twitch'} class:wrinkle={acting === 'wrinkle'} viewBox="0 0 100 100" aria-hidden="true" style="--blink: {face.blink}s">
  <defs>
    <clipPath id="frame-{uid}"><circle cx="50" cy="50" r="50" /></clipPath>
    <mask id="outside-{uid}" maskUnits="userSpaceOnUse" x="-50" y="-50" width="200" height="200">
      <rect x="-50" y="-50" width="200" height="200" fill="#fff" />
      <circle cx="50" cy="50" r="50" fill="#000" />
    </mask>
    <radialGradient id="cream-{uid}" cx="50%" cy="42%" r="60%">
      <stop offset="0%" stop-color="#e4ddcb" />
      <stop offset="75%" stop-color="#cdc5b0" />
      <stop offset="100%" stop-color="#a9a18c" />
    </radialGradient>
  </defs>
  <!-- Inside the portrait's oval, its backdrop first; `over` parts and smoke break out of it. -->
  <g clip-path="url(#frame-{uid})">
  {#if (backdrop ?? face.backdrop ?? 'cream') === 'cream'}<circle cx="50" cy="50" r="50" fill="url(#cream-{uid})" />{/if}
  <g transform={zoom}><g transform="rotate({p.lean} 50 92)">
    {#each face.grains ?? [] as [x, y], i (i)}
      <circle class="grain" cx={x} cy={y} r={0.9 + (i % 3) * 0.35} fill={COLOUR.sand} style="--d: {(i * 0.73) % 2.6}s" />
    {/each}
    {#each partsIn('back') as part, i (i)}{@render drawn(part)}{/each}
    <path class="head" d={headPath} fill={COLOUR[face.fill ?? 'paper']} stroke={COLOUR.ink} stroke-width="2.8" stroke-linejoin="round" />
    {#each partsIn('face') as part, i (i)}{@render drawn(part)}{/each}

    <g class="eyes">
      {#each [-1, 1] as const as side (side)}
        {@const cx = 50 + side * face.eyes.gap}
        {@const open = Math.max(0.1, p.eyeOpen)}
        {#if face.eyes.soft}
          <ellipse {cx} cy={face.eyes.y} rx={face.eyes.rx + 1.3} ry={(face.eyes.ry + 1.1) * open} fill={COLOUR.sand} opacity="0.55" />
        {/if}
        <ellipse {cx} cy={face.eyes.y} rx={face.eyes.rx} ry={face.eyes.ry * open} fill={COLOUR.ink} />
        {#if face.eyes.lashes && p.eyeOpen > 0.3}
          {@const top = face.eyes.y - face.eyes.ry * open}
          <path d="M{cx + side * face.eyes.rx * 0.5} {top + 1} l{side * 2.6} -3 M{cx + side * face.eyes.rx * 0.95} {top + 2.6} l{side * 3} -2" fill="none" stroke={COLOUR.ink} stroke-width="1.5" stroke-linecap="round" />
        {/if}
        {#if p.eyeOpen > 0.3}
          {#if face.eyes.soft}
            <circle class="wedge" cx={cx + p.lookX * face.eyes.rx * 0.45 + 1.5} cy={face.eyes.y - face.eyes.ry * 0.3 + p.lookY * 1.5} r={face.eyes.rx * 0.36} fill={COLOUR.paper} />
          {:else}
            <path class="wedge" d={wedge(side)} fill={COLOUR[face.fill ?? 'paper']} />
          {/if}
        {/if}
      {/each}
    </g>
    <!-- The brows over the eyes, so a brow hangs over a lid rather than under a pupil. -->
    <g class="brows" fill="none" stroke={COLOUR.ink} stroke-width={face.brows.weight} stroke-linecap="round">
      <path d={brow(-1)} />
      <path class="brow-right" d={brow(1)} />
    </g>
    {#if nose}<path class="nose" d={nose} fill={face.nose?.kind === 'hook' ? 'none' : face.nose?.tint ? COLOUR[face.nose.tint] : face.nose?.pale ? COLOUR[face.fill ?? 'paper'] : COLOUR.ink} stroke={COLOUR.ink} stroke-width="2.4" stroke-linecap="round" />{/if}
    {#if !face.mouth.hidden}<path class="mouth" d={mouth} fill={p.mouthOpen < 0.03 ? 'none' : COLOUR.ink} stroke={COLOUR.ink} stroke-width={3 - Math.min(1, p.wobble) * 1.2} stroke-linecap="round" stroke-linejoin="round" />{/if}
    <g transform="translate(0 {mouthShift})">
      {#each partsIn('mouth') as part, i (i)}{@render drawn(part)}{/each}
    </g>
    {#if p.sweat > 0.05}
      <path class="sweat" d="M73 26 C70 31 69 34 73 35 C77 34 76 31 73 26 Z" fill={COLOUR.paper} stroke={COLOUR.ink} stroke-width="1.5" opacity={Math.min(1, p.sweat)} />
    {/if}
    {#each partsIn('front') as part, i (i)}{@render drawn(part)}{/each}
  </g></g></g>
  <g transform={zoom}><g transform="rotate({p.lean} 50 92)">
    {#each partsIn('over').filter((x) => !x.swing && !x.withMouth) as part, i (i)}{@render drawn(part)}{/each}
    <g transform={face.pivot ? `rotate(${p.pipe * 7 * (face.leftSide ? -1 : 1)} ${face.pivot[0]} ${face.pivot[1]})` : undefined}>
    {#each partsIn('over').filter((x) => x.swing) as part, i (i)}{@render drawn(part)}{/each}
    {#if face.smoke && !still}
      {#each [0, 1, 2] as i (i)}
        <circle class="smoke" cx={face.smoke[0]} cy={face.smoke[1]} r={1.8 + i * 0.5} fill={COLOUR.grey} style="--d: {i * 1.1}s" />
      {/each}
    {/if}
  </g>
    <g transform="translate(0 {mouthShift})">
      {#each partsIn('over').filter((x) => x.withMouth) as part, i (i)}{@render drawn(part)}{/each}
    </g>
  </g></g>
  <!-- What spills past the frame (a beard): drawn again, only outside it. -->
  <g mask="url(#outside-{uid})"><g transform={zoom}><g transform="rotate({p.lean} 50 92)">
    {#each (face.parts ?? []).filter((x) => x.spill) as part, i (i)}
      <g transform={part.layer === 'mouth' ? `translate(0 ${mouthShift})` : undefined}>{@render drawn(part)}</g>
    {/each}
  </g></g></g>
</svg>

<style>
  .portrait-rig {
    display: block;
    width: 100%;
    height: 100%;
    overflow: visible;
  }
  /* Every so often, shut and open. */
  .eyes {
    transform-box: fill-box;
    transform-origin: center;
    animation: blink var(--blink) infinite;
  }
  /* Lids that take their time: down, a long moment shut, and up again. */
  .slow-blink .eyes {
    animation-name: blink-slow;
  }
  @keyframes blink-slow {
    0%,
    62%,
    100% {
      transform: scaleY(1);
    }
    76%,
    84% {
      transform: scaleY(0.08);
    }
  }
  @keyframes blink {
    0%,
    95%,
    100% {
      transform: scaleY(1);
    }
    97% {
      transform: scaleY(0.08);
    }
  }
  /* The eyes slide off to the side and back. */
  .shifty .wedge {
    animation: shifty 1.4s ease-in-out;
  }
  @keyframes shifty {
    25%,
    45% {
      transform: translateX(-4px);
    }
    65%,
    80% {
      transform: translateX(4px);
    }
  }
  .brow-right {
    transform-box: fill-box;
    transform-origin: left center;
  }
  /* One brow jumps. */
  .twitch .brow-right {
    animation: twitch 0.5s ease-out 2;
  }
  @keyframes twitch {
    35% {
      transform: translateY(-3.5px) rotate(-7deg);
    }
  }
  /* The nose wrinkles. */
  .nose {
    transform-box: fill-box;
    transform-origin: center bottom;
  }
  .wrinkle .nose {
    animation: wrinkle 0.6s ease-in-out 2;
  }
  @keyframes wrinkle {
    50% {
      transform: scale(1.14, 0.78) translateY(-1px);
    }
  }
  /* Sand runs off it, a grain at a time. */
  .grain {
    animation: grain 2.6s linear infinite;
    animation-delay: var(--d);
    opacity: 0;
  }
  @keyframes grain {
    0% {
      opacity: 0;
      transform: translate(0, 0);
    }
    12% {
      opacity: 1;
    }
    100% {
      opacity: 0;
      transform: translate(-3px, 30px);
    }
  }
  /* A slow curl of smoke. */
  .smoke {
    transform-box: fill-box;
    transform-origin: center;
    animation: smoke 3.3s ease-out infinite;
    animation-delay: var(--d);
    opacity: 0;
  }
  @keyframes smoke {
    10% {
      opacity: 0.8;
    }
    100% {
      opacity: 0;
      transform: translate(6px, -26px) scale(1.8);
    }
  }
  /* A bead forms (under a cap, as often as not), trickles down into view, stays a moment, and is gone; a breath, and another. */
  .sweat {
    animation: sweat 3.6s ease-in-out infinite;
  }
  @keyframes sweat {
    0% {
      opacity: 0;
      transform: translateY(0);
    }
    8% {
      opacity: 1;
      transform: translateY(0);
    }
    58% {
      opacity: 1;
      transform: translateY(14px);
    }
    /* Still, at the end of its run, for about half a second. */
    72% {
      opacity: 1;
      transform: translateY(14px);
    }
    80%,
    100% {
      opacity: 0;
      transform: translateY(15px);
    }
  }
  .still *,
  .still {
    animation: none !important;
  }
  @media (prefers-reduced-motion: reduce) {
    .portrait-rig * {
      animation: none !important;
    }
  }
</style>
