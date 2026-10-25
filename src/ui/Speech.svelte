<script module lang="ts">
  export type SpeechSize = 'aside' | 'scene' | 'full';

  /** An answer on one of the two buttons. */
  export interface Reply {
    /** The button's text; defaults to Agree (white) or Decline (black). */
    label?: string;
    /** The line to go to (by its `id`); without one, the next line in order. */
    go?: string;
    /** Ends the conversation. */
    end?: boolean;
    /** Something that happens at the table, handled by whoever started the conversation. */
    effect?: string;
  }

  /** One line of a conversation. */
  export interface SpeechLine {
    id?: string;
    size: SpeechSize;
    /** A captain's id, `you` or `willie`. */
    who: string;
    text: string;
    /** One reply (on the white button) or two (black, white). The line waits for an answer. */
    replies?: [Reply] | [Reply, Reply];
    /** Closes by itself: `true` for a time fitted to the line, or a number of ms. Asides do by default. */
    auto?: boolean | number;
    /**
     * The line waits for a move at the table: these cards tapped, and only
     * these, then the white button. A rank (`4`, `T`, `A`) matches any suit;
     * a card (`4c`) only itself. An empty list is standing pat; `fold` is the
     * black button. The move closes it.
     */
    require?: string[] | 'fold';
    /**
     * Only after this outcome (for lines after the verdict): you won the hand
     * or lost it with the game going on, or the game is over, all the money
     * yours or all of it theirs.
     */
    when?: 'won' | 'lost' | 'wonAll' | 'lostAll';
  }

  /** How long a line stays up when it closes by itself. */
  export function autoMs(line: SpeechLine): number | null {
    const auto = line.auto ?? (line.size === 'aside' && !line.replies && !line.require);
    if (typeof auto === 'number') return auto;
    return auto ? 3500 + line.text.length * 45 : null;
  }
</script>

<script lang="ts">
  import Countdown from './Countdown.svelte';

  /**
   * A captain speaking at the table, as a silent-film caption laid over it.
   * Three sizes, by how much of the table the line needs:
   *
   * - `aside`: over the opponent's cards, the portrait still in view above it.
   *   Play goes on underneath.
   * - `scene`: from their cards down to the board, for a line worth stopping for.
   * - `full`: everything but the buttons, for an introduction or a lesson.
   *
   * The opponent's lines have a notch pointing up at their portrait on the
   * table. Anyone else (Willie, a passer-by, you) has their name over the
   * line and their portrait in the caption's corner, where the countdown runs.
   * The table places it (`top`, `bottom` in px within the table).
   */
  let {
    line,
    name,
    opponent,
    top,
    bottom,
    onnext,
  }: {
    line: SpeechLine;
    /** The speaker's name, shown unless they are the opponent at the table. */
    name: string;
    /** The speaker is the opponent: the notch, no name, the countdown on the table portrait. */
    opponent: boolean;
    top: number;
    bottom: number;
    /** Tapping the caption: absent while the line waits for an answer or a move. */
    onnext?: () => void;
  } = $props();

  const ms = $derived(autoMs(line));
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<div
  class="speech {line.size}"
  class:notch={opponent && line.size !== 'full'}
  class:waits={!onnext}
  style="top: {top}px; bottom: {bottom}px"
  onclick={(e) => (e.stopPropagation(), onnext?.())}
  role="status"
  aria-live="polite"
>
  {#key line}
    {#if !opponent || line.size === 'full'}
      <span class="face" aria-hidden="true">
        {name[0]}
        {#if ms}<Countdown {ms} />{/if}
      </span>
    {/if}
    <div class="words">
      {#if !opponent || line.size !== 'aside'}<span class="who">{name}</span>{/if}
      <p>{line.text}</p>
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
    animation: pop 0.15s ease-out;
  }
  .waits {
    cursor: default;
  }
  /* A notch in the top edge, under the portrait: who is talking. */
  .notch::before {
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
  /* Anyone but the opponent: their portrait sits on the caption's top right corner. */
  .face {
    position: absolute;
    top: -14px;
    right: -6px;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: #0c0c0b;
    border: 2px solid var(--paper);
    font-family: var(--title-font);
    font-size: 1.4rem;
    line-height: 1;
  }
  /* The full caption reaches the top of the screen: its portrait sits inside the frame. */
  .full .face {
    top: 12px;
    right: 12px;
    width: 64px;
    height: 64px;
    font-size: 2rem;
  }
  .words {
    animation: appear 0.2s ease-out;
  }
  p {
    margin: 0;
    line-height: 1.35;
  }
  .aside p {
    font-size: 1rem;
    line-height: 1.25;
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
  .aside .who {
    margin-bottom: 0.15rem;
    font-size: 0.85rem;
  }
  .full .who {
    font-size: 1.5rem;
    color: var(--paper);
  }
  @keyframes pop {
    from {
      opacity: 0;
      transform: scale(0.97);
    }
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
