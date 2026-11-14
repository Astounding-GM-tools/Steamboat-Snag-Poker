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

  interface Props {
    text: string;
    fresh?: boolean;
    ontyped?: () => void;
    wrap?: boolean;
    /** The line of the entry to start at: he picks up where he left off (the header was away at a table). */
    from?: number;
    /** Each line as it's finished, so whoever shows this can say where he'd got to. */
    online?: (line: number) => void;
    /** Hold off (she's racing: nobody types at full steam); he goes on when it's lifted. */
    paused?: boolean;
  }
  let { text, fresh = false, ontyped, wrap = false, from = 0, online, paused = false }: Props = $props();

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
   * River speed. A beginner's pace at the keys: a key every tenth to fifth of a second, never even, a
   * hunt for the next one now and then. Each line held long enough to read, then (in the header) the
   * paper rolls up and it goes, under the heading, before he types the next. Between sections (a
   * blank line in the entry) and between entries, a good long pause: this is the river.
   */
  function delay(c: string): number {
    const base = 85 + Math.random() * 110;
    if (c === ' ') return base + 60;
    if (/[.,:;!?]/.test(c)) return base + 260 + Math.random() * 300;
    return Math.random() < 0.06 ? base + 350 + Math.random() * 550 : base;
  }
  /** How long a typed line stays to be read: a few seconds, longer for a longer line. */
  const readingTime = (l: string) => 5000 + l.length * 110;
  /** The roll of the paper, and the pause between sections and before an entry. */
  const ROLL_MS = 450;
  const SECTION_MS = 10000;
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
    let l = Math.min(untrack(() => from), lines.length - 1), i = 0;
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
      if (paused) return later(key, 300);
      const whole = lines[l];
      if (i === 0) clack('line');
      const c = whole[i++];
      line = whole.slice(0, i - 1);
      struck = c;
      strikes++;
      clack(c === ' ' ? 'space' : 'key');
      if (i < whole.length) return later(key, delay(c));
      // The line's typed: left to be read, then on.
      untrack(() => online?.(l + 1));
      const next = () => {
        if (paused) return later(next, 300);
        if (l + 1 >= lines.length) {
          done = settled(entry);
          line = struck = '';
          typing = false;
          untrack(() => ontyped?.());
          return;
        }
        // The line stays while he pauses (a long pause at a section's end), then the carriage
        // return: the paper rolls it up under the rule, and he types the next.
        const pause = sectionAfter.has(l) ? SECTION_MS : 0;
        l++;
        i = 0;
        if (wrap) {
          done = lines.slice(0, l).join('\n');
          line = struck = '';
          later(key, pause + 350);
        } else later(() => roll(() => later(key, 150)), pause);
      };
      later(next, wrap ? 500 : readingTime(whole));
    };
    typing = true;
    // A new entry: what's there stays a while yet, then rolls away and he starts. (Read untracked: the
    // typing itself changes what's showing, and mustn't start the entry over.)
    later(
      () =>
        untrack(() =>
          roll(() => {
            done = wrap ? '' : done;
            later(key, 150);
          }),
        ),
      wrap ? 400 : ENTRY_MS,
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
    /* The rule under the heading: the line rolls up under it and is gone. */
    border-top: 1px solid rgba(242, 239, 230, 0.4);
    margin-top: 0.2rem;
    padding-top: 0.15rem;
  }
  .paper {
    display: block;
  }
  /* The paper rolls up: the line goes up and out of view, cut off by the rule, not faded. */
  .rolling {
    animation: roll 0.45s ease-in forwards;
  }
  @keyframes roll {
    to {
      translate: 0 -130%;
    }
  }
  .wrap .paper {
    display: inline;
  }
  /* In the open log: the page's own type, wrapping as it goes, a line to each thought. */
  .wrap {
    border-top: none;
    margin-top: 0;
    padding-top: 0;
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
