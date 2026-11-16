<script lang="ts">
  /**
   * Development only (`?nudge` in the address): the course's nudges, shown and edited over the chart
   * (docs/map.md, "How to nudge"). Drag the red line to pull it where it should go: that's a nudge, a
   * spot, a push and a reach. Each shows as a dot (its spot) and a handle (where it pushes the line
   * to): drag the handle to change the push, the dot to move the spot; the wheel over either, or
   * [ and ], to change the reach. Delete takes the one picked away. Save writes them to the repo
   * (src/story/map/nudges.json, through the dev server); Copy puts them on the clipboard instead.
   *
   * It lies over everything, but only the line and the handles take the pointer: the game's own
   * controls work round them as ever.
   */
  import { formatNudges, type Nudge } from './nudges';
  import { nudges } from './nudgeStore.svelte';
  import type { Pt } from './route';

  interface Props {
    /** The course as she sails it (map px), to grab. */
    line: readonly Pt[];
    center: Pt;
    scale: number;
    width: number;
    height: number;
  }
  let { line, center, scale, width, height }: Props = $props();

  const ox = $derived(width / 2 - center[0] * scale);
  const oy = $derived(height / 2 - center[1] * scale);
  /** A spot on the screen on the chart. */
  const toMap = (e: PointerEvent | WheelEvent): Pt => [(e.clientX - ox) / scale, (e.clientY - oy) / scale];

  let picked = $state<number | null>(null);
  /** The reach a new nudge gets: the last one set. 300 px is 600 m, about the river's width. */
  let reach = $state(300);
  let status = $state('');
  let saved = $state(formatNudges(nudges.list));
  const dirty = $derived(formatNudges(nudges.list) !== saved);
  /** Shown when the clipboard won't take it (served over the network, not localhost). */
  let paste = $state<string | null>(null);

  /** What's being dragged: a nudge's handle (its push) or its dot (its spot), and from where it was grabbed. */
  let drag: { i: number; part: 'push' | 'at'; grab: Pt; was: Nudge } | null = null;
  /** The pointer's last spot, put into the nudge once a frame (the course is worked out again each time). */
  let pending: Pt | null = null;
  let frame = 0;

  function set(i: number, n: Nudge) {
    nudges.list[i] = n;
  }
  function apply() {
    frame = 0;
    if (!drag || !pending) return;
    const { i, part, grab, was } = drag;
    const dx = pending[0] - grab[0], dy = pending[1] - grab[1];
    if (part === 'push') set(i, { ...was, push: [was.push[0] + dx, was.push[1] + dy] });
    else set(i, { ...was, at: [was.at[0] + dx, was.at[1] + dy] });
  }
  function start(e: PointerEvent, i: number, part: 'push' | 'at') {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    picked = i;
    drag = { i, part, grab: toMap(e), was: $state.snapshot(nudges.list[i]) as Nudge };
  }
  /** Grabbing the line: a new nudge there, its push dragged out from nothing. */
  function grabLine(e: PointerEvent) {
    if (e.button !== 0) return;
    const at = toMap(e);
    nudges.list.push({ at, push: [0, 0], reach });
    start(e, nudges.list.length - 1, 'push');
  }
  function move(e: PointerEvent) {
    if (!drag) return;
    pending = toMap(e);
    frame ||= requestAnimationFrame(apply);
  }
  function end(e: PointerEvent) {
    if (!drag) return;
    if (frame) cancelAnimationFrame(frame);
    pending = toMap(e);
    apply();
    const n = nudges.list[drag.i];
    // A click on the line, not a drag: nothing to keep.
    if (n && Math.hypot(n.push[0], n.push[1]) * scale < 2) remove(drag.i);
    drag = null;
    pending = null;
  }
  function remove(i: number) {
    nudges.list.splice(i, 1);
    picked = null;
  }
  function resize(i: number, by: number) {
    const n = nudges.list[i];
    if (!n) return;
    reach = Math.max(10, Math.min(20000, Math.round(n.reach * by)));
    set(i, { ...$state.snapshot(n), reach } as Nudge);
  }
  function wheel(e: WheelEvent, i: number) {
    e.preventDefault();
    picked = i;
    resize(i, e.deltaY < 0 ? 1.1 : 1 / 1.1);
  }
  function key(e: KeyboardEvent) {
    if (picked === null || (e.target as HTMLElement)?.closest?.('input, textarea')) return;
    if (e.key === 'Delete' || e.key === 'Backspace') remove(picked);
    else if (e.key === ']') resize(picked, 1.1);
    else if (e.key === '[') resize(picked, 1 / 1.1);
    else if (e.key === 'Escape') picked = null;
    else return;
    e.preventDefault();
  }

  async function save() {
    const text = formatNudges(nudges.list);
    try {
      const r = await fetch('/__nudges', { method: 'POST', headers: { 'content-type': 'application/json' }, body: text });
      if (!r.ok) throw new Error(await r.text());
      saved = text;
      status = `Saved ${nudges.list.length} to src/story/map/nudges.json`;
    } catch (err) {
      status = `Not saved (${err}): copy them instead`;
    }
  }
  async function copy() {
    const text = formatNudges(nudges.list);
    try {
      await navigator.clipboard.writeText(text);
      status = 'Copied: paste into src/story/map/nudges.json';
      paste = null;
    } catch {
      status = 'No clipboard here: copy them from the box';
      paste = text;
    }
  }

  const points = $derived(line.map((q) => `${q[0]},${q[1]}`).join(' '));
</script>

<svelte:window onkeydown={key} />

<svg class="nudges" role="application" aria-label="Nudges" {width} {height} onpointermove={move} onpointerup={end} onpointercancel={end}>
  <g transform="translate({ox} {oy}) scale({scale})">
    <!-- The line, to grab: wide and unseen over the red one. -->
    <polyline class="grab" role="button" tabindex="-1" aria-label="The course" {points} fill="none" stroke="transparent" stroke-width="24" vector-effect="non-scaling-stroke" onpointerdown={grabLine} />
    {#each nudges.list as n, i (i)}
      {@const tip = [n.at[0] + n.push[0], n.at[1] + n.push[1]]}
      <g class:picked={picked === i}>
        <circle class="reach" cx={n.at[0]} cy={n.at[1]} r={n.reach} vector-effect="non-scaling-stroke" />
        <line class="arm" x1={n.at[0]} y1={n.at[1]} x2={tip[0]} y2={tip[1]} vector-effect="non-scaling-stroke" />
        <circle class="spot" cx={n.at[0]} cy={n.at[1]} r={5 / scale} role="button" tabindex="-1" aria-label="Nudge spot" onpointerdown={(e) => start(e, i, 'at')} onwheel={(e) => wheel(e, i)} />
        <circle class="handle" cx={tip[0]} cy={tip[1]} r={8 / scale} role="button" tabindex="-1" aria-label="Nudge push" onpointerdown={(e) => start(e, i, 'push')} onwheel={(e) => wheel(e, i)} />
      </g>
    {/each}
  </g>
</svg>

<div class="panel">
  <strong>Nudges: {nudges.list.length}{dirty ? ' (unsaved)' : ''}</strong>
  <p>Drag the line to bend it. Drag a handle to push, a dot to move; wheel or [ ] for the reach; Delete removes.</p>
  <div class="row">
    <button onclick={save} disabled={!dirty}>Save to repo</button>
    <button onclick={copy}>Copy</button>
    {#if picked !== null && nudges.list[picked]}
      <button onclick={() => picked !== null && remove(picked)}>Delete</button>
      <span>reach {Math.round(nudges.list[picked].reach)} px</span>
    {/if}
  </div>
  {#if status}<p>{status}</p>{/if}
  {#if paste !== null}<textarea readonly rows="4" value={paste} onfocus={(e) => e.currentTarget.select()}></textarea>{/if}
</div>

<style>
  .nudges {
    position: fixed;
    inset: 0;
    z-index: 1000;
    pointer-events: none;
    overflow: visible;
  }
  .grab {
    pointer-events: stroke;
    cursor: crosshair;
  }
  .reach {
    fill: rgba(208, 48, 30, 0.06);
    stroke: #d0301e;
    stroke-width: 1;
    stroke-dasharray: 4 4;
    pointer-events: none;
  }
  .arm {
    stroke: #1e5fd0;
    stroke-width: 1.5;
    pointer-events: none;
  }
  .spot,
  .handle {
    pointer-events: all;
    cursor: grab;
    stroke: #fff;
    stroke-width: 1.5;
    vector-effect: non-scaling-stroke;
  }
  .spot {
    fill: #1e5fd0;
  }
  .handle {
    fill: #d0301e;
  }
  .picked .handle,
  .picked .spot {
    stroke: #ffd23a;
    stroke-width: 3;
  }
  .picked .reach {
    fill: rgba(255, 210, 58, 0.1);
  }
  .panel {
    position: fixed;
    left: 12px;
    top: 44px;
    z-index: 1001;
    max-width: 300px;
    padding: 8px 10px;
    background: rgba(20, 16, 12, 0.88);
    color: #f4ecd8;
    font: 12px/1.35 system-ui, sans-serif;
    border-radius: 6px;
    pointer-events: auto;
  }
  .panel p {
    margin: 4px 0;
  }
  .row {
    display: flex;
    gap: 6px;
    align-items: center;
    flex-wrap: wrap;
  }
  textarea {
    width: 100%;
    font: 11px monospace;
  }
</style>
