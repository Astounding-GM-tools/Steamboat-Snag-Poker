<script module lang="ts">
  export type SpeechSize = 'aside' | 'scene' | 'full';
  /** One line of a conversation. `replies` names the two buttons (cautious, bold) while it is up. */
  export interface SpeechLine {
    size: SpeechSize;
    who: string;
    text: string;
    replies?: [string, string];
  }
</script>

<script lang="ts">
  /**
   * A captain speaking at the table, as a silent-film caption laid over it.
   * Three sizes, by how much of the table the line needs:
   *
   * - `aside`: table talk over the speaker's cards, the portrait still in
   *   view above it. It never takes the buttons: play goes on underneath.
   * - `scene`: from their cards down to the board, for a line worth stopping
   *   for. The buttons answer it.
   * - `full`: everything but the buttons, for an introduction or a lesson.
   *
   * The table places it (`top`, `bottom` in px within the table); a tap on
   * the caption moves the conversation on.
   */
  let {
    size,
    who,
    text,
    top,
    bottom,
    onnext,
  }: {
    size: SpeechSize;
    who: string;
    text: string;
    top: number;
    bottom: number;
    onnext: () => void;
  } = $props();
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div
  class="speech {size}"
  style="top: {top}px; bottom: {bottom}px"
  onclick={(e) => (e.stopPropagation(), onnext())}
  role="status"
  aria-live="polite"
>
  {#key text}
    <div class="words">
      {#if size !== 'aside'}<span class="who">{who}</span>{/if}
      <p>{text}</p>
    </div>
  {/key}
</div>

<style>
  .speech {
    position: absolute;
    left: 1rem;
    right: 1rem;
    z-index: 20;
    display: grid;
    place-items: center;
    padding: 0.5rem 1rem;
    background: #0c0c0b;
    border: 2px solid var(--paper);
    outline: 1px solid var(--paper);
    outline-offset: 4px;
    text-align: center;
    cursor: pointer;
    animation: appear 0.25s ease-out;
  }
  /* A notch in the top edge, under the portrait: who is talking. */
  .speech:not(.full)::before {
    content: '';
    position: absolute;
    top: -11px;
    right: calc(12.5% - 9px);
    width: 14px;
    height: 14px;
    background: #0c0c0b;
    border-left: 2px solid var(--paper);
    border-top: 2px solid var(--paper);
    transform: rotate(45deg);
  }
  .full {
    outline-offset: 6px;
    border-width: 3px;
  }
  .words {
    animation: appear 0.3s ease-out;
  }
  p {
    margin: 0;
    line-height: 1.35;
  }
  .aside p {
    font-size: 1rem;
  }
  .scene p {
    font-size: 1.2rem;
  }
  .full p {
    font-size: 1.25rem;
  }
  .who {
    display: block;
    margin-bottom: 0.75rem;
    font-family: var(--title-font);
    font-size: 1.1rem;
    letter-spacing: 0.08em;
    color: var(--grey);
  }
  .full .who {
    font-size: 1.5rem;
    color: var(--paper);
  }
  @keyframes appear {
    from {
      opacity: 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .speech,
    .words {
      animation: none;
    }
  }
</style>
