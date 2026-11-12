<script lang="ts" module>
  /** What a figure is doing: each is a short loop, drawn at a station on the boat. */
  export type Doing = 'walk' | 'stroll' | 'stoke' | 'fish' | 'cards' | 'deal' | 'read' | 'cook' | 'pilot' | 'horn' | 'drum';
  export type Hat = 'none' | 'cap' | 'boater' | 'bowler' | 'toque';
</script>

<script lang="ts">
  /**
   * One of the people aboard, in the rubber-hose manner: a round head, a pear of a body,
   * noodle limbs. About 11 boat units tall, feet at (0, 0), facing forward (+x). Ink, with
   * a paper halo (the boat's `boat-halo` filter) so they read on the dark main deck and on
   * the white cabin alike. Every loop is CSS, like the title's boat.
   */
  let {
    doing,
    hat = 'none',
    delay = 0,
    flip = false,
    toWater = 24,
  }: { doing: Doing; hat?: Hat; delay?: number; flip?: boolean; toWater?: number } = $props();

  const seated = $derived(doing === 'cards' || doing === 'deal' || doing === 'read');
  const perched = $derived(doing === 'fish');
  const walking = $derived(doing === 'walk' || doing === 'stroll');
  /** Where the hip is: standing, on a stool, on the edge of the deck. */
  const hip = $derived(perched ? -0.6 : seated ? -3.4 : -4.5);
  const up = $derived(hip + 4.5);
</script>

<g class="figure" filter="url(#boat-halo)" style:--dl="{delay}s" transform={flip ? 'scale(-1 1)' : undefined}>
  <!-- Legs -->
  {#if walking}
    <g class="leg" style="transform-origin: 0px -4.5px"><line x1="0" y1="-4.5" x2="0" y2="0" /></g>
    <g class="leg other" style="transform-origin: 0px -4.5px"><line x1="0" y1="-4.5" x2="0" y2="0" /></g>
  {:else if perched}
    <g class="dangle" style="transform-origin: 0px -0.6px"><polyline points="0,-0.6 2,-0.4 2.2,3.6" /></g>
    <g class="dangle other" style="transform-origin: 0px -0.6px"><polyline points="0,-0.6 1.6,-0.2 1.4,3.8" /></g>
  {:else if seated}
    <polyline points="0,-3.4 2.4,-3.4 2.6,0" />
    <polyline points="0,-3.4 2,-3.2 1.6,0" />
    {#if doing === 'read'}<!-- A deck chair -->
      <polyline class="thin" points="-2.6,-7.5 -1,-3 3.4,-3 4.2,0" />
      <line class="thin" x1="-1" y1="-3" x2="-2" y2="0" />
    {:else}<!-- A stool -->
      <line class="thin" x1="-1.4" y1="-3" x2="1.4" y2="-3" />
      <line class="thin" x1="-1" y1="-3" x2="-1.2" y2="0" />
      <line class="thin" x1="1" y1="-3" x2="1.2" y2="0" />
    {/if}
  {:else}
    <polyline points="-1.2,0 0,-4.5 1.2,0" />
  {/if}

  <g transform="translate(0 {up})">
    <g class="upper {doing}" style="transform-origin: 0px -4.5px">
      <!-- Body: a pear, or a skirt for a lady promenading -->
      {#if doing === 'stroll'}
        <path class="solid" d="M -0.6 -8 L 0.6 -8 L 2.6 -1.4 L -2.6 -1.4 Z" />
      {:else}
        <ellipse class="solid" cx="0" cy="-6.3" rx="1.6" ry="2.3" />
      {/if}

      <!-- Arms, and what they hold -->
      {#if walking}
        <g class="arm" style="transform-origin: 0px -7.4px"><line x1="0" y1="-7.4" x2="0.4" y2="-4.4" /></g>
        {#if doing === 'stroll'}
          <!-- A parasol over the shoulder -->
          <line x1="0" y1="-7.4" x2="1.6" y2="-9.4" />
          <line class="thin" x1="1.6" y1="-9.4" x2="-0.8" y2="-14.6" />
          <path class="pale" d="M -4.6 -13 Q -1.6 -17.6 2.8 -15.6 Z" />
        {:else}
          <g class="arm other" style="transform-origin: 0px -7.4px"><line x1="0" y1="-7.4" x2="0.4" y2="-4.4" /></g>
        {/if}
      {:else if doing === 'stoke'}
        <polyline points="0,-7.4 2,-6 2.8,-4.6" />
        <line class="thin" x1="0.6" y1="-6.6" x2="5.2" y2="-1.4" />
        <path class="solid" d="M 4.4 -2.4 L 6.8 -0.6 L 5.8 0.4 L 3.6 -1.2 Z" />
      {:else if doing === 'fish'}
        <polyline points="0,-7.4 2.2,-6.4 2.8,-7" />
        <g class="rod" style="transform-origin: 2.6px -6.8px">
          <line class="thin" x1="2.6" y1="-6.8" x2="15" y2="-13" />
          <line class="hair" x1="15" y1="-13" x2="16" y2={toWater - up} />
          <circle class="pale" cx="16" cy={toWater - up - 0.4} r="0.7" />
        </g>
      {:else if doing === 'cards' || doing === 'deal'}
        <polyline points="0,-7.4 2,-6.2 3.4,-6.4" />
        <g class="arm {doing}" style="transform-origin: 0px -7.4px">
          <polyline points="0,-7.4 1.6,-5.6 3,-6.6" />
          <rect class="pale" x="2.6" y="-8.2" width="1.4" height="2" />
        </g>
      {:else if doing === 'read'}
        <polyline points="0,-7.4 2,-6.4 2.6,-7.4" />
        <rect class="pale paper" x="2.2" y="-10" width="2.6" height="3.6" style="transform-origin: 2.2px -8px" />
      {:else if doing === 'cook'}
        <polyline points="0,-7.4 1.8,-5.8 2.4,-6" />
        <g class="arm stir" style="transform-origin: 2.6px -5.6px"><line class="thin" x1="2.6" y1="-5.6" x2="3.4" y2="-9.4" /></g>
      {:else if doing === 'pilot'}
        <polyline points="0,-7.4 2,-6.4 2.8,-7.8" />
        <polyline points="0,-7.4 1.6,-5.8 2.8,-6.2" />
      {:else if doing === 'horn'}
        <polyline points="0,-7.4 2,-7.6 2.6,-8.6" />
        <polyline points="0,-7.4 1.8,-6.2 3,-8.2" />
        <path class="solid" d="M 1.8 -8.8 L 5.4 -8.6 L 7.2 -10.2 L 7.4 -6.8 L 5.4 -8 L 1.8 -8.2 Z" />
      {:else if doing === 'drum'}
        <circle class="pale" cx="4" cy="-4" r="3.2" />
        <circle class="hair-dot" cx="4" cy="-4" r="0.6" />
        <g class="arm beat" style="transform-origin: 0px -7.4px">
          <polyline points="0,-7.4 2,-6.2 3.2,-7.6" />
          <circle class="solid" cx="3.4" cy="-7.8" r="0.6" />
        </g>
      {/if}

      <!-- Head, the face's paper patch, and a hat -->
      <g class="head" style="transform-origin: 0px -8.6px">
        <circle class="solid" cx="0" cy="-10.2" r="1.9" />
        <ellipse class="face" cx="0.9" cy="-10" rx="0.9" ry="1.15" />
        <circle class="solid" cx="2.1" cy="-9.8" r="0.45" />
        {#if hat === 'cap'}
          <path class="solid" d="M -1.9 -11 Q 0 -13.2 1.9 -11 L 3.2 -10.8 L 1.8 -10.4 Z" />
        {:else if hat === 'boater'}
          <rect class="pale" x="-1.7" y="-13" width="3.4" height="1.6" />
          <line x1="-3" y1="-11.5" x2="3" y2="-11.5" />
        {:else if hat === 'bowler'}
          <path class="solid" d="M -1.7 -11.4 Q 0 -14.4 1.7 -11.4 Z" />
          <line x1="-2.6" y1="-11.4" x2="2.6" y2="-11.4" />
        {:else if hat === 'toque'}
          <path class="pale" d="M -1.6 -11.6 L -2 -14.4 Q 0 -16 2 -14.4 L 1.6 -11.6 Z" />
        {/if}
      </g>
    </g>
  </g>
</g>

<style>
  .figure :is(line, polyline) {
    fill: none;
    stroke: var(--ink, #111);
    stroke-width: 1.1;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .figure .thin {
    stroke-width: 0.5;
  }
  .figure .hair {
    stroke-width: 0.25;
  }
  .figure .solid,
  .figure .hair-dot {
    fill: var(--ink, #111);
  }
  .figure .pale {
    fill: var(--paper, #f2efe6);
    stroke: var(--ink, #111);
    stroke-width: 0.4;
  }
  .figure .face {
    fill: var(--paper, #f2efe6);
  }
  .figure * {
    transform-box: view-box;
  }

  /* Walking: legs and arms swing against each other. */
  .leg,
  .arm {
    animation: swing 0.6s ease-in-out var(--dl) infinite alternate;
  }
  .leg.other,
  .arm:not(.other) {
    animation-direction: alternate-reverse;
  }
  .stroll .arm {
    animation: none;
  }
  @keyframes swing {
    from { transform: rotate(-26deg); }
    to { transform: rotate(26deg); }
  }

  /* Stoking: bend to the firebox and heave, a shovel a beat and a half. */
  .upper.stoke {
    animation: stoke 1.5s ease-in-out var(--dl) infinite;
  }
  @keyframes stoke {
    0%, 100% { transform: rotate(0deg); }
    35% { transform: rotate(38deg); }
    55% { transform: rotate(30deg); }
    75% { transform: rotate(-8deg); }
  }

  /* Fishing: the legs idly kick; the rod dips when something nibbles. */
  .dangle {
    animation: kick 2.2s ease-in-out var(--dl) infinite alternate;
  }
  .dangle.other {
    animation-delay: calc(var(--dl) - 1.1s);
  }
  @keyframes kick {
    from { transform: rotate(-12deg); }
    to { transform: rotate(16deg); }
  }
  .rod {
    animation: nibble 5s ease-in-out var(--dl) infinite;
  }
  @keyframes nibble {
    0%, 60%, 100% { transform: rotate(0deg); }
    66% { transform: rotate(7deg); }
    70% { transform: rotate(1deg); }
    74% { transform: rotate(8deg); }
    82% { transform: rotate(-2deg); }
  }

  /* Cards: heads nod over the hand; the dealer flicks one across. */
  .cards .head {
    animation: nod 3.4s ease-in-out var(--dl) infinite;
  }
  @keyframes nod {
    0%, 70%, 100% { transform: rotate(0deg); }
    80% { transform: rotate(12deg); }
  }
  .arm.deal {
    animation: deal 2.6s ease-in-out var(--dl) infinite;
  }
  @keyframes deal {
    0%, 60%, 100% { transform: rotate(0deg); }
    70% { transform: rotate(-40deg); }
    78% { transform: rotate(12deg); }
  }
  .arm.cards {
    animation: none;
  }

  /* Reading: the paper turns over now and then. */
  .read .paper {
    animation: page 7s ease-in-out var(--dl) infinite;
  }
  @keyframes page {
    0%, 85%, 100% { transform: scaleX(1); }
    90% { transform: scaleX(-0.3); }
  }

  .arm.stir {
    animation: stir 1.2s linear var(--dl) infinite;
  }
  @keyframes stir {
    0% { transform: rotate(-14deg); }
    50% { transform: rotate(14deg); }
    100% { transform: rotate(-14deg); }
  }

  /* The pilot leans into the wheel and back, watching the river. */
  .upper.pilot {
    animation: lean 6s ease-in-out var(--dl) infinite alternate;
  }
  @keyframes lean {
    from { transform: rotate(-4deg); }
    to { transform: rotate(5deg); }
  }

  /* The band: the cornet rocks; the drum keeps the beat. */
  .upper.horn {
    animation: rock 0.9s ease-in-out var(--dl) infinite alternate;
  }
  @keyframes rock {
    from { transform: rotate(-9deg); }
    to { transform: rotate(6deg); }
  }
  .arm.beat {
    animation: beat 0.45s ease-in var(--dl) infinite alternate;
  }
  @keyframes beat {
    from { transform: rotate(-30deg); }
    to { transform: rotate(10deg); }
  }
  .upper.drum .head {
    animation: nod 0.9s ease-in-out var(--dl) infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    .figure * {
      animation: none !important;
    }
  }
</style>
