<script lang="ts">
  import type { Snippet } from 'svelte';

  /**
   * A slice of table for the bench: the tables' own grid (twelve columns, a
   * card two of them and a gap wide) at a phone's width, so a piece looks as
   * it does in play. Each child is a row across it.
   */
  let { width, label, children }: { width: number; label: string; children: Snippet } = $props();
</script>

<figure>
  <figcaption>{label}</figcaption>
  <div class="frame" style:width="{width}px">{@render children()}</div>
</figure>

<style>
  figure {
    margin: 0;
  }
  figcaption {
    margin-bottom: 0.4rem;
    font-size: 0.75rem;
    color: var(--grey);
  }
  .frame {
    --gap: 0.5rem;
    container-type: inline-size;
    position: relative;
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    column-gap: var(--gap);
    row-gap: 1rem;
    max-width: 480px;
    padding: 1rem;
    box-sizing: border-box;
    border: 1px dashed var(--dim);
    background: #0c0c0b;
  }
  .frame > :global(*) {
    --col: calc((100cqw - 11 * var(--gap)) / 12);
    --card-w: calc(2 * var(--col) + var(--gap));
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: subgrid;
  }
  .frame :global(.card:not(.huge)) {
    --w: var(--card-w) !important;
  }
</style>
