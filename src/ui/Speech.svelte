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
    /** The words; a list is said in beats, each part on a line of its own, a moment after the last. */
    text: string | string[];
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
     * or lost it with the game going on (a win either `dumped` a snag on them
     * or `kept` yours), or the game is over, all the money yours or all of
     * it theirs.
     */
    when?: 'won' | 'dumped' | 'kept' | 'lost' | 'wonAll' | 'lostAll';
    /** They show their hand (even after a fold): the cards turn face up, and the words follow. */
    show?: boolean;
    /** Only while these snags (by number) are where it says: with `you`, or with `them`. Snags outlive the game. */
    holding?: { snag: number; by: 'you' | 'them' }[];
    /**
     * Where the table puts it, if not by size: `low` over your side (lines
     * after a hand, so the cards they talk about stay in view), `mid` over
     * the empty board (lines before the deal, so their snags stay in view).
     */
    at?: 'low' | 'mid';
  }

  /** How long a line stays up when it closes by itself. */
  export function autoMs(line: SpeechLine): number | null {
    const auto = line.auto ?? (line.size === 'aside' && !line.replies && !line.require);
    if (typeof auto === 'number') return auto;
    return auto ? 3500 + beats(line).join(' ').length * 45 + (beats(line).length - 1) * BEAT_MS : null;
  }

  /** The pause before each further beat of a line. */
  export const BEAT_MS = 1400;
  export const beats = (line: SpeechLine): string[] => (Array.isArray(line.text) ? line.text : [line.text]);
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
   * table, and need no name (but the full size, covering the portrait, has
   * both). Anyone else (Willie, a passer-by, you) has their name over the
   * line and their portrait in the caption's corner, where the countdown runs.
   * The table places it (`top`, `bottom` in px within the table).
   */
  let {
    line,
    name,
    opponent,
    top,
    bottom,
    grow = false,
    onnext,
  }: {
    line: SpeechLine;
    /** The speaker's name, shown unless they are the opponent at the table. */
    name: string;
    /** The speaker is the opponent: the notch, no name, the countdown on the table portrait. */
    opponent: boolean;
    top: number;
    bottom: number;
    /** Grows upward past `top` when the words need more room (`top` is then its least height's edge). */
    grow?: boolean;
    /** Tapping the caption: absent while the line waits for an answer or a move. */
    onnext?: () => void;
  } = $props();

  const ms = $derived(autoMs(line));

</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<div
  class="speech {line.size}"
  class:low={line.at === 'low'}
  class:after-show={line.show}
  class:notch={opponent && line.size !== 'full'}
  class:waits={!onnext}
  style={grow ? `bottom: ${bottom}px; min-height: calc(100% - ${top + bottom}px)` : `top: ${top}px; bottom: ${bottom}px`}
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
      {#if !opponent || line.size === 'full'}<span class="who">{name}</span>{/if}
      <p>
        {#each beats(line) as beat, i}<span class="beat" style="animation-delay: {i * BEAT_MS}ms">{beat}</span>{/each}
      </p>
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
  /* Cards first, then the words about them. */
  .after-show .words {
    animation-delay: 0.8s;
    animation-fill-mode: backwards;
  }
  p {
    margin: 0;
    line-height: 1.35;
  }
  /* Each beat on a line of its own, broken evenly: captions read best balanced. */
  .beat {
    display: block;
    text-wrap: balance;
    animation: appear 0.3s ease-out backwards;
  }
  /* Separate sentences, separate paragraphs (in an aside, beats sit closer). */
  .beat + .beat {
    margin-top: 0.9em;
  }
  .aside .beat + .beat {
    margin-top: 0.2em;
  }
  .aside p {
    font-size: 1rem;
    line-height: 1.25;
  }
  .scene p {
    font-size: 1.2rem;
  }
  /* Over your side there's a little less room. */
  .low p {
    font-size: 1.05rem;
  }
  .low .who {
    margin-bottom: 0.35rem;
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
    .words,
    .beat {
      animation: none;
    }
  }
</style>
