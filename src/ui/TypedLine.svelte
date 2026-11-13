<script lang="ts">
  /**
   * A line of the First Mate's Log under the heading, in Willie's typewriter. A new line types
   * itself out, a character at a time, as if he were at the keys: that's what draws the eye to
   * the log. A line already read is simply there when it appears again (a page opened, a voyage
   * resumed); one written while the header was out of sight (at a table) types itself out when it
   * first shows (`fresh`). Long lines end in "…" (the whole of it is in the reading view).
   */
  import { untrack } from 'svelte';

  let { text, fresh = false, ontyped, wrap = false }: { text: string; fresh?: boolean; ontyped?: () => void; wrap?: boolean } = $props();

  /** Milliseconds a character; a space or a stop takes a beat longer, as typing does. */
  const KEY_MS = 38;
  let shown = $state(untrack(() => (fresh ? '' : text)));
  let typing = $state(false);
  let first = true;

  $effect(() => {
    const line = text;
    if (first && !untrack(() => fresh)) {
      first = false;
      return;
    }
    first = false;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      shown = line;
      untrack(() => ontyped?.());
      return;
    }
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    typing = true;
    shown = '';
    const key = () => {
      shown = line.slice(0, ++i);
      if (i >= line.length) {
        typing = false;
        untrack(() => ontyped?.());
        return;
      }
      const c = line[i - 1];
      timer = setTimeout(key, c === ' ' ? KEY_MS * 1.6 : /[.,:;!?]/.test(c) ? KEY_MS * 4 : KEY_MS);
    };
    timer = setTimeout(key, 250);
    return () => clearTimeout(timer);
  });
</script>

<span class="typed" class:typing class:wrap aria-live="polite">{shown}</span>

<style>
  .typed {
    flex-basis: 100%;
    display: block;
    min-height: 1.3em;
    font-family: 'Special Elite', monospace;
    font-size: 0.85rem;
    color: var(--paper);
    opacity: 0.85;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  /* In the open log: the page's own type, wrapping as it goes. */
  .wrap {
    display: inline;
    font-size: inherit;
    color: inherit;
    opacity: 1;
    white-space: normal;
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
</style>
