<script lang="ts">
  /**
   * A ring that runs round a circular portrait while a caption waits to close
   * by itself. Purely a picture: the table keeps the time. Lay it over the
   * portrait (the parent must be positioned); it starts afresh when created.
   */
  let { ms }: { ms: number } = $props();
</script>

<svg class="countdown" viewBox="0 0 100 100" aria-hidden="true" style="--ms: {ms}ms">
  <circle cx="50" cy="50" r="48" pathLength="100" />
</svg>

<style>
  .countdown {
    position: absolute;
    inset: -4px;
    width: calc(100% + 8px);
    height: calc(100% + 8px);
    transform: rotate(-90deg);
    pointer-events: none;
    overflow: visible;
  }
  circle {
    fill: none;
    stroke: var(--paper);
    stroke-width: 3;
    vector-effect: non-scaling-stroke;
    stroke-dasharray: 100;
    stroke-dashoffset: 0;
    animation: run var(--ms) linear forwards;
  }
  /* The ring empties as the time runs out. */
  @keyframes run {
    to {
      stroke-dashoffset: 100;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    circle {
      animation: none;
    }
  }
</style>
