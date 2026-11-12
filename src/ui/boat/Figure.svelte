<script lang="ts" module>
  /** What a figure is doing: each is a short loop, drawn at a station on the boat. */
  export const DOINGS = [
    'walk', 'stroll', 'stoke', 'fish', 'cards', 'deal', 'read', 'cook', 'pilot',
    // The band
    'trumpet', 'sax', 'trombone', 'bass', 'drums',
  ] as const;
  export type Doing = (typeof DOINGS)[number];
  export const HATS = ['none', 'cap', 'boater', 'bowler', 'toque', 'topper'] as const;
  export type Hat = (typeof HATS)[number];
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

  const seated = $derived(doing === 'cards' || doing === 'deal' || doing === 'read' || doing === 'drums');
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
  {:else if doing === 'stoke'}
    <polyline points="-1.9,0 0,-4.5 2.1,0" />
  {:else}
    <polyline points="-1.2,0 0,-4.5 1.2,0" />
  {/if}

  {#snippet kit()}
    <line class="thin" x1="3.6" y1="-5.6" x2="3.6" y2="0" />
    <line class="thin" x1="8" y1="0" x2="8" y2="-10.4" />
    <ellipse class="solid" cx="8" cy="-10.6" rx="2.4" ry="0.5" transform="rotate(-12 8 -10.6)" />
    <circle class="pale" cx="6.2" cy="-3.2" r="3.2" />
    <circle class="hair-dot" cx="6.2" cy="-3.2" r="0.6" />
    <ellipse class="pale" cx="3.6" cy="-5.9" rx="1.8" ry="0.6" />
  {/snippet}

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
        <g class="arm swing" style="transform-origin: 0px -7.4px"><line x1="0" y1="-7.4" x2="0.4" y2="-4.4" /></g>
        {#if doing === 'stroll'}
          <!-- A parasol over the shoulder -->
          <line x1="0" y1="-7.4" x2="1.6" y2="-9.4" />
          <line class="thin" x1="1.6" y1="-9.4" x2="-0.8" y2="-14.6" />
          <path class="pale" d="M -4.6 -13 Q -1.6 -17.6 2.8 -15.6 Z" />
        {:else}
          <g class="arm swing other" style="transform-origin: 0px -7.4px"><line x1="0" y1="-7.4" x2="0.4" y2="-4.4" /></g>
        {/if}
      {:else if doing === 'stoke'}
        <!-- Scoop off the deck, lift, and chuck it into the firebox -->
        <g class="arm shovel" style="transform-origin: 0px -7.4px">
          <polyline points="0,-7.4 1.2,-4.5" />
          <polyline points="0,-7.4 2.2,-5.4 2.8,-3.5" />
          <line class="thin" x1="-0.6" y1="-5.6" x2="5.6" y2="-1.6" />
          <path class="solid" d="M 5 -2.4 L 8 -0.8 L 7.2 0.4 L 4.4 -1.2 Z" />
          <ellipse class="pale load" cx="6.3" cy="-1.5" rx="1.3" ry="0.6" />
        </g>
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
        <!-- A hand on the hip, the pan held level, and a pancake going over -->
        <polyline points="0,-7.4 -1.3,-5.8 -0.3,-4.9" />
        <g class="arm toss" style="transform-origin: 0px -7.4px">
          <polyline points="0,-7.4 1.6,-5.6 3.2,-5.8" />
          <line class="thin" x1="3" y1="-5.8" x2="4.8" y2="-5.9" />
          <path class="solid" d="M 4.6 -6.3 L 9.4 -6.3 Q 9.2 -5 7.8 -4.9 L 6.1 -4.9 Q 4.8 -5 4.6 -6.3 Z" />
          <ellipse class="pale cake" cx="7" cy="-6.7" rx="1.9" ry="0.45" style="transform-origin: 7px -6.7px" />
        </g>
      {:else if doing === 'pilot'}
        <polyline points="0,-7.4 2,-6.4 2.8,-7.8" />
        <polyline points="0,-7.4 1.6,-5.8 2.8,-6.2" />
      {:else if doing === 'trumpet'}
        <polyline points="0,-7.4 2,-7.6 2.6,-8.6" />
        <polyline points="0,-7.4 1.8,-6.2 3,-8.2" />
        <path class="solid" d="M 1.8 -8.8 L 5.4 -8.6 L 7.2 -10.2 L 7.4 -6.8 L 5.4 -8 L 1.8 -8.2 Z" />
      {:else if doing === 'sax'}
        <polyline points="0,-7.4 1.6,-7.6 1.9,-6.8" />
        <polyline points="0,-7.4 1.1,-5.4 2.1,-4.6" />
        <path class="tube" d="M 1.7 -9.5 Q 2.5 -9.3 2.1 -8.1 L 1.5 -4.4 Q 1.3 -2.3 2.9 -2.5 Q 3.9 -2.7 3.9 -4.5" />
        <path class="solid" d="M 3 -4.4 L 5 -5.3 L 4.6 -3.9 Z" />
      {:else if doing === 'trombone'}
        <polyline points="0,-7.4 1.4,-8.2 2.3,-9.3" />
        <line class="tube" x1="1.8" y1="-9.6" x2="7" y2="-9.6" />
        <path class="solid" d="M 6.6 -9.6 L 9.2 -11.3 L 9.2 -7.9 Z" />
        <line class="tube" x1="2.2" y1="-9.6" x2="2.8" y2="-8.4" />
        <g class="slide"><polyline class="tube" points="2.8,-8.4 10.4,-8.4 10.4,-7.3 4.2,-7.3" /></g>
        <g class="arm reach" style="transform-origin: 0px -7.4px"><line x1="0" y1="-7.4" x2="5" y2="-7.9" /></g>
      {:else if doing === 'bass'}
        <!-- The double bass, taller than he is, leaning into him -->
        <g transform="rotate(-8 4 0)">
          <path class="solid" d="M 4 -0.4 C 1.2 -0.4 1.3 -3.5 2.8 -4.4 C 2 -5.4 2.2 -7.8 3.3 -8 L 3.6 -14 L 4.4 -14 L 4.7 -8 C 5.8 -7.8 6 -5.4 5.2 -4.4 C 6.7 -3.5 6.8 -0.4 4 -0.4 Z" />
          <line class="string" x1="4" y1="-13.6" x2="4" y2="-1.8" />
          <circle class="solid" cx="4" cy="-14.6" r="0.8" />
        </g>
        <polyline points="0,-7.4 1.8,-9.6 3,-11" />
        <g class="arm pluck" style="transform-origin: 0px -7.4px"><polyline points="0,-7.4 1.3,-5.4 3,-4.8" /></g>
      {:else if doing === 'drums'}
        <!-- Sticks: one on the snare, one on the cymbal -->
        <g class="arm stick" style="transform-origin: 0px -7.4px">
          <polyline points="0,-7.4 1.6,-5.8 2.4,-6.4" />
          <line class="thin" x1="2.4" y1="-6.4" x2="4.4" y2="-7.6" />
        </g>
        <g class="arm stick other" style="transform-origin: 0px -7.4px">
          <polyline points="0,-7.4 2,-8 3.2,-8.8" />
          <line class="thin" x1="3.2" y1="-8.8" x2="5.8" y2="-10.4" />
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
        {:else if hat === 'topper'}
          <rect class="solid" x="-1.6" y="-16.6" width="3.2" height="5.2" />
          <line class="hatband" x1="-1.6" y1="-12.4" x2="1.6" y2="-12.4" />
          <line x1="-2.9" y1="-11.5" x2="2.9" y2="-11.5" />
        {:else if hat === 'toque'}
          <path class="pale" d="M -1.6 -11.6 L -2 -14.4 Q 0 -16 2 -14.4 L 1.6 -11.6 Z" />
        {/if}
      </g>
    </g>
  </g>
  {#if doing === 'drums'}{@render kit()}{/if}
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
  .figure .tube {
    stroke-width: 0.8;
  }
  .figure .string,
  .figure .hatband {
    stroke: var(--paper, #f2efe6);
    stroke-width: 0.25;
  }
  .figure .hatband {
    stroke-width: 0.5;
  }
  .figure .face {
    fill: var(--paper, #f2efe6);
  }
  .figure * {
    transform-box: view-box;
  }

  /* Walking: legs and arms swing against each other. */
  .leg,
  .swing {
    animation: swing 0.6s ease-in-out var(--dl) infinite alternate;
  }
  .leg.other,
  .swing:not(.other) {
    animation-direction: alternate-reverse;
  }
  .stroll .swing {
    animation: none;
  }
  @keyframes swing {
    from { transform: rotate(-26deg); }
    to { transform: rotate(26deg); }
  }

  /* Stoking: bend and scoop off the deck, straighten with the load, chuck it into the
     firebox, and back. The body and the shovel arms keep one beat. */
  .upper.stoke {
    animation: stoke 1.8s ease-in-out var(--dl) infinite;
  }
  @keyframes stoke {
    0%, 100% { transform: rotate(4deg); }
    22% { transform: rotate(36deg); }
    34% { transform: rotate(40deg); }
    52% { transform: rotate(4deg); }
    62% { transform: rotate(14deg); }
    72% { transform: rotate(9deg); }
  }
  .arm.shovel {
    animation: shovel 1.8s ease-in-out var(--dl) infinite;
  }
  @keyframes shovel {
    0%, 100% { transform: rotate(-8deg); }
    22% { transform: rotate(-43deg); }
    34% { transform: rotate(-44deg); }
    52% { transform: rotate(-48deg); }
    60% { transform: rotate(-74deg); }
    72% { transform: rotate(-58deg); }
  }
  .load {
    animation: load 1.8s linear var(--dl) infinite;
  }
  @keyframes load {
    0%, 32% { opacity: 0; }
    35%, 59% { opacity: 1; }
    61%, 100% { opacity: 0; }
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

  /* The cook tosses the pan; the pancake goes up, over, and lands. */
  .arm.toss {
    animation: toss 2.6s ease-in-out var(--dl) infinite;
  }
  @keyframes toss {
    0%, 34%, 56%, 100% { transform: rotate(0deg); }
    38% { transform: rotate(-14deg); }
    43% { transform: rotate(3deg); }
    60% { transform: rotate(-3deg); }
  }
  .cake {
    animation: flip 2.6s linear var(--dl) infinite;
  }
  @keyframes flip {
    0%, 38% { transform: translateY(0) rotate(0deg); animation-timing-function: ease-out; }
    48% { transform: translateY(-6px) rotate(180deg); animation-timing-function: ease-in; }
    58%, 100% { transform: translateY(0) rotate(360deg); }
  }

  /* The pilot leans into the wheel and back, watching the river. */
  .upper.pilot {
    animation: lean 6s ease-in-out var(--dl) infinite alternate;
  }
  @keyframes lean {
    from { transform: rotate(-4deg); }
    to { transform: rotate(5deg); }
  }

  /* The band. The trumpet rocks; the sax dips into it; the trombone's slide runs out
     and back, the arm stretching after it (rubber hose); the bass is plucked; the
     drummer keeps time on the snare and rides the cymbal. */
  .upper.trumpet {
    animation: rock 0.9s ease-in-out var(--dl) infinite alternate;
  }
  @keyframes rock {
    from { transform: rotate(-9deg); }
    to { transform: rotate(6deg); }
  }
  .upper.sax {
    animation: dip 1.3s ease-in-out var(--dl) infinite alternate;
  }
  @keyframes dip {
    from { transform: rotate(-5deg); }
    to { transform: rotate(11deg); }
  }
  .slide {
    animation: slide 0.9s ease-in-out var(--dl) infinite alternate;
  }
  @keyframes slide {
    to { transform: translateX(3.2px); }
  }
  .arm.reach {
    animation: reach 0.9s ease-in-out var(--dl) infinite alternate;
  }
  @keyframes reach {
    to { transform: scaleX(1.64); }
  }
  .upper.bass {
    animation: lean 2.4s ease-in-out var(--dl) infinite alternate;
  }
  .arm.pluck {
    animation: pluck 0.45s ease-in-out var(--dl) infinite alternate;
  }
  @keyframes pluck {
    from { transform: rotate(-7deg); }
    to { transform: rotate(6deg); }
  }
  .arm.stick {
    animation: beat 0.3s ease-in var(--dl) infinite alternate;
  }
  .arm.stick.other {
    animation-duration: 0.6s;
    animation-delay: calc(var(--dl) - 0.15s);
  }
  @keyframes beat {
    from { transform: rotate(-24deg); }
    to { transform: rotate(8deg); }
  }
  .drums .head {
    animation: nod 0.6s ease-in-out var(--dl) infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    .figure * {
      animation: none !important;
    }
  }
</style>
