<script lang="ts">
  /**
   * A line of the First Mate's Log, in Willie's typewriter. A new entry types itself out a key at a
   * time, as Willie does: he's new at it, so unevenly, slow, a pause now and then to find the next
   * key, each key struck at once, with a clack (a typewriter shows no cursor, and eases nothing in). In the header, an entry of
   * several lines is typed a line at a time, each replacing the one before, and its last line stays.
   * In the open log (`wrap`) the lines build up below each other.
   *
   * A line already read is simply there when it appears again (a page opened, a voyage resumed);
   * one written while the header was out of sight (at a table) types itself out when it first shows
   * (`fresh`). It wraps within the page, never widening it.
   */
  import { untrack } from 'svelte';
  import { clack } from './typewriter';

  let { text, fresh = false, ontyped, wrap = false }: { text: string; fresh?: boolean; ontyped?: () => void; wrap?: boolean } = $props();

  /** The lines of an entry, blanks (a paragraph's end) dropped. */
  const linesOf = (t: string) => t.split('\n').filter((l) => l.trim());
  /** What shows when nothing's being typed: the header keeps the last line, the open log all of it. */
  const settled = (t: string) => (wrap ? t : (linesOf(t).at(-1) ?? ''));

  /** Typed so far: earlier lines (the open log only) and the line under the keys. */
  let done = $state(untrack(() => (fresh ? '' : settled(text))));
  let line = $state('');
  /** The key just struck, drawn landing. */
  let struck = $state('');
  let strikes = $state(0);
  let typing = $state(false);
  let first = true;

  /**
   * River speed. A beginner's pace at the keys: a key every sixth to third of a second, never even, a
   * hunt for the next one now and then. Each line held long enough to read, then (in the header) the
   * paper rolls up and it goes, under the heading, before he types the next. Between sections (a
   * blank line in the entry) and between entries, a good long pause: this is the river.
   */
  function delay(c: string): number {
    const base = 140 + Math.random() * 180;
    if (c === ' ') return base + 90;
    if (/[.,:;!?]/.test(c)) return base + 400 + Math.random() * 450;
    return Math.random() < 0.08 ? base + 500 + Math.random() * 800 : base;
  }
  /** How long a typed line stays to be read: a few seconds, longer for a longer line. */
  const readingTime = (l: string) => 5000 + l.length * 110;
  /** The roll of the paper, and the pause between sections and before an entry. */
  const ROLL_MS = 700;
  const SECTION_MS = 6000;
  const ENTRY_MS = 4000;
  /** The line rolling up out of view (header only). */
  let rolling = $state(false);

  $effect(() => {
    const entry = text;
    if (first && !untrack(() => fresh)) {
      first = false;
      return;
    }
    first = false;
    // Sections kept apart: a blank line marks where one ends.
    const parts = entry.split('\n');
    const lines = parts.filter((p) => p.trim());
    const sectionAfter = new Set<number>();
    let n = -1;
    for (const p of parts) (p.trim() ? n++ : n >= 0 && sectionAfter.add(n));
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !lines.length) {
      done = settled(entry);
      line = struck = '';
      untrack(() => ontyped?.());
      return;
    }
    let timer: ReturnType<typeof setTimeout>;
    let l = 0, i = 0;
    const later = (fn: () => void, ms: number) => (timer = setTimeout(fn, ms));
    /** The paper rolls up: what's showing goes up under the heading, then `then`. */
    const roll = (then: () => void) => {
      if (wrap || !(done || line || struck)) return then();
      rolling = true;
      later(() => {
        rolling = false;
        done = line = struck = '';
        then();
      }, ROLL_MS);
    };
    const key = () => {
      const whole = lines[l];
      if (i === 0) clack('line');
      const c = whole[i++];
      line = whole.slice(0, i - 1);
      struck = c;
      strikes++;
      clack(c === ' ' ? 'space' : 'key');
      if (i < whole.length) return later(key, delay(c));
      // The line's typed: left to be read, then on.
      later(() => {
        if (l + 1 >= lines.length) {
          done = settled(entry);
          line = struck = '';
          typing = false;
          untrack(() => ontyped?.());
          return;
        }
        const pause = sectionAfter.has(l) ? SECTION_MS : 350;
        l++;
        i = 0;
        if (wrap) {
          done = lines.slice(0, l).join('\n');
          line = struck = '';
          later(key, pause);
        } else roll(() => later(key, pause));
      }, wrap ? 500 : readingTime(whole));
    };
    typing = true;
    // A new entry: what's there rolls away, a pause, and he starts. (Read untracked: the typing itself
    // changes what's showing, and mustn't start the entry over.)
    untrack(() =>
      roll(() => {
        done = wrap ? '' : done;
        later(key, wrap ? 400 : ENTRY_MS);
      }),
    );
    return () => clearTimeout(timer);
  });
</script>

<span class="typed" class:typing class:wrap aria-live="polite"
  ><span class="paper" class:rolling
    >{done}{#if typing}{#if wrap && done}{'\n'}{/if}{line}{#key strikes}<span class="struck">{struck}</span>{/key}{/if}</span
  ></span
>

<style>
  /* Under the heading: it wraps within the page (never widening it); a line at a time, so it stays short. */
  .typed {
    flex-basis: 100%;
    display: block;
    min-width: 0;
    max-width: 100%;
    min-height: 1.3em;
    font-family: 'Special Elite', monospace;
    font-size: 0.85rem;
    color: var(--paper);
    opacity: 0.85;
    white-space: normal;
    overflow-wrap: anywhere;
    overflow: hidden;
  }
  .paper {
    display: block;
  }
  /* The paper rolls up: the line goes up and out of view, under the heading. */
  .rolling {
    animation: roll 0.7s ease-in forwards;
  }
  @keyframes roll {
    to {
      translate: 0 -110%;
      opacity: 0;
    }
  }
  .wrap .paper {
    display: inline;
  }
  /* In the open log: the page's own type, wrapping as it goes, a line to each thought. */
  .wrap {
    display: inline;
    font-size: inherit;
    color: inherit;
    opacity: 1;
    white-space: pre-line;
  }
  /* The key lands at once, sudden and unannounced: a thwack of metal type on the paper, nothing eased. */
  .struck {
    white-space: pre;
  }
</style>
