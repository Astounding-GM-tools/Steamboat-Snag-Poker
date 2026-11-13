<script lang="ts">
  /**
   * A line of the First Mate's Log, in Willie's typewriter. A new entry types itself out a key at a
   * time, as Willie does: he's new at it, so unevenly, slow, a pause now and then to find the next
   * key, each key struck (it lands with a little jolt, and a clack). In the header, an entry of
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

  /** A beginner's pace: a key about every eighth of a second, never even, and now and then a hunt for the next one. */
  function delay(c: string): number {
    const base = 90 + Math.random() * 110;
    if (c === ' ') return base + 60;
    if (/[.,:;!?]/.test(c)) return base + 280 + Math.random() * 300;
    return Math.random() < 0.07 ? base + 350 + Math.random() * 600 : base;
  }

  $effect(() => {
    const entry = text;
    if (first && !untrack(() => fresh)) {
      first = false;
      return;
    }
    first = false;
    const lines = linesOf(entry);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !lines.length) {
      done = settled(entry);
      line = struck = '';
      untrack(() => ontyped?.());
      return;
    }
    let timer: ReturnType<typeof setTimeout>;
    let l = 0, i = 0;
    typing = true;
    done = line = struck = '';
    const key = () => {
      const whole = lines[l];
      if (i === 0) clack('line');
      const c = whole[i++];
      line = whole.slice(0, i - 1);
      struck = c;
      strikes++;
      clack(c === ' ' ? 'space' : 'key');
      if (i < whole.length) {
        timer = setTimeout(key, delay(c));
        return;
      }
      // The line's done: a pause, then the next line (below it in the log; in its place in the header).
      timer = setTimeout(
        () => {
          line = struck = '';
          if (++l >= lines.length) {
            done = settled(entry);
            typing = false;
            untrack(() => ontyped?.());
            return;
          }
          done = wrap ? lines.slice(0, l).join('\n') : '';
          i = 0;
          timer = setTimeout(key, 350);
        },
        wrap ? 500 : 1600,
      );
    };
    timer = setTimeout(key, 400);
    return () => clearTimeout(timer);
  });
</script>

<span class="typed" class:typing class:wrap aria-live="polite"
  >{done}{#if typing}{#if wrap && done}{'\n'}{/if}{line}{#key strikes}<span class="struck">{struck}</span>{/key}{/if}</span
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
  }
  /* In the open log: the page's own type, wrapping as it goes, a line to each thought. */
  .wrap {
    display: inline;
    font-size: inherit;
    color: inherit;
    opacity: 1;
    white-space: pre-line;
  }
  /* The key just struck lands: a hair high and pale, then settles. */
  .struck {
    display: inline-block;
    white-space: pre;
    animation: strike 0.12s ease-out;
  }
  @keyframes strike {
    from {
      translate: 0 -0.12em;
      opacity: 0.4;
    }
  }
  /* The carriage, at the end of the line while he types. */
  .typing::after {
    content: '▌';
    opacity: 0.6;
    animation: caret 0.6s steps(2) infinite;
  }
  @keyframes caret {
    50% {
      opacity: 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .struck {
      animation: none;
    }
  }
</style>
