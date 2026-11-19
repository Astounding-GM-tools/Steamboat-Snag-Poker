<script module lang="ts">
  import type { MoodBlend } from './portrait/faces';
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
  /** How a hand went, as a line can wait on it. */
  export type Outcome = 'won' | 'dumped' | 'kept' | 'lost' | 'wonAll' | 'lostAll';
  export interface SpeechLine {
    /** How the speaker looks saying it, if they have a face. */
    mood?: MoodBlend;
    /** It hits as it's said: the whole picture lurches (whoever runs the game shakes it: the table's `onjolt`). */
    jolt?: boolean;
    id?: string;
    size: SpeechSize;
    /** A captain's id, `you` or `willie`. */
    who: string;
    /** The words; a list is said in beats, each part a paragraph of its own, a moment after the last. A `\n` breaks a line within one. */
    text: string | string[];
    /**
     * The answers, and the line waits for one: one (on the white button), two
     * (black, white) or more. More than two, or any too long for half the row,
     * stack up from the buttons, the last (white) nearest the thumb.
     */
    replies?: Reply[];
    /** Closes by itself: `true` for a time fitted to the line, or a number of ms. Asides do by default. */
    auto?: boolean | number;
    /**
     * The line waits for a move at the table: these cards tapped, and only
     * these, then the white button. With replies too, the replies stand until
     * the move is tapped; making it then skips ahead past the next line that
     * asks for a move (no need to ask what you already know). A rank (`4`, `T`, `A`) matches any suit;
     * a card (`4c`) only itself. An empty list is standing pat; `fold` is the
     * black button. The move closes it. `help` waits for How it works to be
     * opened and closed again (the lesson shows you where it is).
     */
    require?: string[] | 'fold' | 'help';
    /**
     * "Show me": tap these cards (as for `require`) to see what they make,
     * named over your purse on any street, without it counting as a move
     * (no swap); then the replies unlock. Answering clears the taps.
     */
    names?: string[];
    /**
     * Only after this outcome (for lines after the verdict): you won the hand
     * or lost it with the game going on (a win either `dumped` a snag on them
     * or `kept` yours), or the game is over, all the money yours or all of
     * it theirs. After a story's lines the table moves on by itself.
     */
    when?: Outcome | readonly Outcome[];
    /** They show their hand (even after a fold): the cards turn face up, and the words follow. */
    show?: boolean;
    /** Said as the cards go out: the deal goes ahead beneath it, and it stays until the next lines take its place. */
    dealing?: boolean;
    /** Only reached by a reply that goes to it (by `id`): the conversation passes it by otherwise. */
    branch?: boolean;
    /** The line to go on to (by `id`) once this one's said, in place of the next in order: how a branch runs on. */
    next?: string;
    /** Said once a voyage (a quip that's only funny once): the key it's remembered by. */
    once?: string;
    /** Only while these snags (by number) are where it says: with `you`, or with `them`. Snags outlive the game. */
    holding?: { snag: number; by: 'you' | 'them' }[];
    /**
     * Where the table puts it, if not by size: `low` over your side, `band`
     * between their cards and the board (their lines after a hand, so both
     * stay in view), `mid` over the empty board (lines before the deal, so
     * their snags stay in view).
     */
    at?: 'low' | 'band' | 'mid';
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
  import Portrait from './portrait/Portrait.svelte';
  import { hasFace } from './portrait/faces';
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
    grow,
    onnext,
  }: {
    line: SpeechLine;
    /** The speaker's name, shown unless they are the opponent at the table. */
    name: string;
    /** The speaker is the opponent: the notch, no name, the countdown on the table portrait. */
    opponent: boolean;
    top: number;
    bottom: number;
    /** Grows past its edge when the words need more room: `up` past `top`, `down` past `bottom`. */
    grow?: 'up' | 'down';
    /** Tapping the caption: absent while the line waits for an answer or a move. */
    onnext?: (dir?: number) => void;
  } = $props();

  const ms = $derived(autoMs(line));

  // Swiped aside: a line that can be passed by (it has no answer to wait for) goes the way it's flung.
  const SWIPE_PX = 70;
  let drag = $state<{ x: number; y: number } | null>(null);
  let dx = $state(0);
  let dragged = false;
  function down(e: PointerEvent) {
    if (!onnext || e.button !== 0) return;
    drag = { x: e.clientX, y: e.clientY };
    dragged = false;
  }
  function move(e: PointerEvent) {
    if (!drag) return;
    const x = e.clientX - drag.x;
    if (!dragged && Math.abs(x) > 8 && Math.abs(x) > Math.abs(e.clientY - drag.y)) {
      dragged = true;
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        // (A pointer that's already gone: the drag goes on without it.)
      }
    }
    if (dragged) dx = x;
  }
  function up() {
    if (!drag) return;
    drag = null;
    const flung = Math.abs(dx) > SWIPE_PX ? Math.sign(dx) : 0;
    dx = 0;
    if (flung) onnext?.(flung);
  }

</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<div
  class="speech {line.size}"
  class:low={line.at === 'low'}
  class:band={line.at === 'band'}
  class:after-show={line.show}
  class:notch={opponent && line.size !== 'full'}
  class:you={line.who === 'you'}
  class:waits={!onnext}
  style={grow === 'up'
    ? `bottom: ${bottom}px; min-height: calc(100% - ${top + bottom}px)`
    : grow === 'down'
      ? `top: ${top}px; min-height: calc(100% - ${top + bottom}px)`
      : `top: ${top}px; min-height: calc(100% - ${top + bottom}px)`}
  onclick={(e) => (e.stopPropagation(), dragged ? (dragged = false) : onnext?.())}
  onpointerdown={down}
  onpointermove={move}
  onpointerup={up}
  onpointercancel={up}
  style:translate={dx ? `${dx}px 0` : null}
  style:opacity={dx ? Math.max(0.3, 1 - Math.abs(dx) / 300) : null}
  class:dragging={drag !== null}
  role="status"
  aria-live="polite"
>
  {#key line}
    {#if !opponent || line.size === 'full'}
      <span class="face" aria-hidden="true">
        {#if hasFace(line.who)}<span class="likeness"><Portrait id={line.who} mood={line.mood} /></span>{:else if line.who === 'you'}<span class="you-name">{name}</span>{:else}{name[0]}{/if}
        {#if ms}<Countdown {ms} />{/if}
      </span>
    {/if}
    <div class="words">
      {#if !opponent || line.size === 'full'}<span class="who">{name}</span>{/if}
      <p>
        {#each beats(line) as beat, i}<span class="beat" style="animation-delay: calc(var(--beats-after, 0ms) + {i * BEAT_MS}ms)">{beat}</span>{/each}
      </p>
    </div>
  {/key}
</div>

<style>
  /*
   * Sized by the table it's on (its width, cqw): a tablet's captions, portraits and words grow with
   * its table, a phone's stay as they were. Everything inside is in em, from this.
   */
  /*
   * Every caption as wide as the buttons below: its outer line (the outline, 4px out and 1px thick) on their
   * edges (the caption's layer is the table's content box, the buttons' width), and the gap between the two
   * lines filled (the box-shadow), so nothing on the table shows through beside it.
   */
  .speech {
    font-size: var(--u, 1rem);
    position: absolute;
    left: 5px;
    right: 5px;
    box-shadow: 0 0 0 4px #0c0c0b;
    z-index: 20;
    display: grid;
    place-items: center;
    padding: 0.5em 1em;
    background: #0c0c0b;
    border: 2px solid var(--paper);
    outline: 1px solid var(--paper);
    outline-offset: 4px;
    text-align: center;
    cursor: pointer;
    touch-action: pan-y;
    transition: translate 0.2s ease-out, opacity 0.2s ease-out;
  }
  .dragging {
    transition: none;
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
    /* (Its outer line further out: 7px in, for it to sit on the buttons' edges, and the wider gap filled.) */
    left: 7px;
    right: 7px;
    box-shadow: 0 0 0 6px #0c0c0b;
  }
  /* Anyone but the opponent: their portrait sits on the caption's bottom right corner (the top is where the opponent's own portrait looks down from). */
  .face {
    position: absolute;
    bottom: -0.625em;
    right: -0.27em;
    display: grid;
    place-items: center;
    /* In its own em (1.4 of the caption's): about 90px on a phone. */
    width: max(3.9em, 24cqw);
    height: max(3.9em, 24cqw);
    border-radius: 50%;
    background: #0c0c0b;
    border: 2px solid var(--paper);
    font-family: var(--title-font);
    font-size: 1.4em;
    line-height: 1;
  }
  /* Room at the foot for the portrait, so it never sits on the words (in the caption's em: the face's are 1.4 of them, 2 in a full one). */
  .speech:has(> .face) {
    padding-bottom: calc(max(5.46em, 24cqw) - 0.875em);
  }
  .full.speech:has(> .face) {
    padding-bottom: calc(max(8em, 34cqw) + 0.75em);
  }
  .likeness {
    position: absolute;
    inset: 0;
  }
  /*
   * The player's own line: the circle says "You", and sits lower, over the top of the button below (an Art
   * Deco touch). It takes no taps: they go through to the button. (The rest of the caption still does.)
   */
  .you .face {
    bottom: -1em;
    z-index: 1;
    pointer-events: none;
  }
  .you-name {
    font-size: 0.62em;
    letter-spacing: 0.04em;
  }
  /* The full caption fills the screen: its portrait sits inside the frame. */
  .full .face {
    bottom: 0.375em;
    right: 0.375em;
    width: max(4em, 34cqw);
    height: max(4em, 34cqw);
    font-size: 2em;
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
    white-space: pre-line;
    text-wrap: balance;
    animation: appear 0.3s ease-out backwards;
  }
  /* Separate sentences, separate paragraphs (in an aside, beats sit closer). */
  .beat + .beat {
    margin-top: 0.9em;
  }
  .aside:not(.band) .beat + .beat {
    margin-top: 0.2em;
  }
  .aside p {
    font-size: 1em;
    line-height: 1.25;
  }
  .scene p {
    font-size: 1.2em;
  }
  /* Over your side, or between their cards and the board, there's a little less room. */
  .low p,
  .band p {
    font-size: 1.05em;
  }
  .low .who {
    margin-bottom: 0.35em;
  }
  .full p {
    font-size: 1.25em;
  }
  .who {
    display: block;
    margin-bottom: 0.75em;
    font-family: var(--title-font);
    font-size: 1.1em;
    letter-spacing: 0.08em;
    color: var(--grey);
  }
  .aside .who {
    margin-bottom: 0.15em;
    font-size: 0.85em;
  }
  .full .who {
    font-size: 1.5em;
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
