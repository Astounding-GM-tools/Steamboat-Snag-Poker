<script lang="ts">
  import type { Snippet } from 'svelte';
  import { heavy } from './heavy';

  /**
   * The two buttons, the same on every screen: black on the left half, white
   * on the right, nearest the thumb. Call, Swap and Play hand are held, not
   * tapped (heavy.ts). More replies than two, or longer ones than half the
   * row holds, stack up over the table (`.stack`), the row keeping its height
   * with an invisible `.stand-in`.
   */
  interface Props {
    children: Snippet;
    /** The table is busy: nothing can be pressed. */
    inert?: boolean;
    /** Nothing to do: the buttons stay, invisible, so nothing moves. */
    idle?: boolean;
    /** Its row on the table's grid. */
    row?: number;
    el?: HTMLElement;
  }
  let { children, inert = false, idle = false, row, el = $bindable() }: Props = $props();
</script>

<div class="actions" class:idle {inert} style:grid-row={row} bind:this={el} use:heavy>
  {@render children()}
</div>

<style>
  .actions {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: subgrid;
    /* Above the film's vignette and grain: the buttons must read clearly, whatever the edges do. */
    position: relative;
    z-index: 51;
  }
  .actions > :global(:first-child) {
    grid-column: 1 / 7;
  }
  .actions > :global(:last-child) {
    grid-column: 7 / 13;
  }
  .actions > :global(.stand-in) {
    grid-column: 1 / -1;
    visibility: hidden;
  }
  .actions > :global(.stack) {
    grid-column: 1 / -1;
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    padding-top: 0.6rem;
    background: #0c0c0b;
    box-shadow: 0 -0.6rem 0.8rem #0c0c0b;
  }
  .actions :global(.stack button) {
    width: 100%;
  }
  .actions :global(.stack button.ghost) {
    background: #0c0c0b;
  }
  .actions :global(button:not(.ghost)) {
    outline-offset: -2px;
  }
  .actions :global(button) {
    padding-top: 0.6em;
    padding-bottom: 0.6em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  /* The outer bottom corners follow the screen's own rounded corners (on a phone, a little way out from them). */
  .actions {
    --corner: 18px;
  }
  .actions > :global(button:first-child) {
    border-bottom-left-radius: var(--corner);
  }
  .actions > :global(button:last-child) {
    border-bottom-right-radius: var(--corner);
  }
  .actions :global(.stack > button:last-child) {
    border-bottom-left-radius: var(--corner);
    border-bottom-right-radius: var(--corner);
  }
  .actions.idle {
    visibility: hidden;
  }
  @media (max-width: 600px) {
    .actions :global(button) {
      font-size: 1.15rem;
      padding-left: 0.5em;
      padding-right: 0.5em;
    }
  }
</style>
