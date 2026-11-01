<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import {
    HUMAN_ID,
    highRollersResult,
    mySeat,
    newHighRollers,
    nextHighRollersHand,
    placings,
    playHighRollers,
    type Action,
    type HighRollersResult,
    type HighRollersSetup,
    type HighRollersState,
  } from '../engine';
  import { t } from '../i18n';
  import Table, { type TableView } from './Table.svelte';
  import { clink } from './clink';
  import { reducedMotion } from './coins';
  import { dollars, tagName } from './format';

  /**
   * High Rollers: four captains at one table, until the first is broke and
   * then The Last Hand (see docs/high-rollers.md). It keeps the game and
   * shows it at the table (Table.svelte); the end is its own: the placings,
   * one at a time from the bottom, then what you walk away with, counted out.
   *
   * Reusable: `setup` seats the table (rivals, purses, stakes); with
   * `onfinish` the table ends with Continue and hands back how it went,
   * without it (the mode on its own) with Again.
   */
  let {
    onmenu,
    setup,
    onfinish,
    saved,
    onsave,
  }: {
    onmenu: () => void;
    setup?: HighRollersSetup;
    onfinish?: (result: HighRollersResult) => void;
    /** The table as it stood when the voyage was put down: it carries on from there. */
    saved?: HighRollersState;
    /** Every move, for saving with the voyage. */
    onsave?: (table: HighRollersState) => void;
  } = $props();

  /** A table picked up again carries on where it was; a new one is seated (from a voyage, with its seed). */
  let game = $state.raw<HighRollersState>(untrack(() => saved) ?? newHighRollers(untrack(() => setup?.seed) ?? Date.now() >>> 0, untrack(() => setup)));
  // Saved with every move.
  $effect(() => {
    const g = game;
    untrack(() => onsave?.(g));
  });
  /** Which table this is (Again deals a new one). */
  let tableNo = $state(0);
  /** Every captain's purse when the hand began. */
  let startMoney = $state(untrack(() => game.players.map((p) => p.money)));
  /** The table is over and the placings are up. */
  let over = $state(false);

  const view = $derived.by((): TableView => {
    const round = game.round!;
    // Whoever went broke this hand is named ("You & King", "You, Walrus & King"); and if that brings on the last hand, so is that.
    const broke = game.players.filter((p) => p.out && p.outOn === game.hand);
    const named = (id: string) => (id === HUMAN_ID ? t('character.captain.you') : tagName(id));
    const names = broke.map((p) => named(p.id));
    const list = names.length > 1 ? `${names.slice(0, -1).join(', ')} & ${names.at(-1)}` : names[0];
    const out = !broke.length ? '' : broke.length > 1 ? t('hr.areOut', { names: list }) : broke[0].id === HUMAN_ID ? t('hr.isOut.you') : t('hr.isOut', { name: named(broke[0].id) });
    return {
      round,
      config: game.config,
      hand: game.hand,
      ids: game.seated.map((i) => game.players[i].id),
      me: mySeat(game),
      chairs: game.players.flatMap((p, i) => (p.id === HUMAN_ID ? [] : [{ id: p.id, seat: game.seated.indexOf(i) }])),
      start: game.seated.map((i) => startMoney[i]),
      money: game.seated.map((i) => game.players[i].money),
      phase: game.phase,
      aftermath: [out, game.phase === 'handEnd' && game.lastHand ? t('hr.lastHandNext') : ''].filter(Boolean).join(' '),
    };
  });

  function play(action: Action | null) {
    game = playHighRollers(game, action);
  }

  /** After the verdict: the next hand, or the placings. */
  function next() {
    if (game.phase === 'over') {
      over = true;
      void ceremony();
    } else if (game.phase === 'handEnd') {
      game = nextHighRollersHand(game);
      startMoney = game.players.map((p) => p.money);
    }
  }

  function again() {
    game = newHighRollers(Date.now() >>> 0, setup);
    startMoney = game.players.map((p) => p.money);
    over = false;
    tableNo++;
  }

  // The end: the placings one at a time from the bottom, then your takings counted out.
  let placed = $state(99);
  let counted = $state(0);
  const PLACE_MS = 900;
  const COUNT_MS = 1400;
  const pause = (ms: number) => (reducedMotion() ? Promise.resolve() : new Promise<void>((r) => setTimeout(r, ms)));
  async function ceremony() {
    const order = placings(game);
    const score = highRollersResult(game).score;
    placed = 0;
    counted = 0;
    for (let i = 0; i < order.length; i++) {
      await pause(PLACE_MS);
      placed = i + 1;
    }
    await pause(PLACE_MS / 2);
    if (reducedMotion() || !score) counted = score;
    else {
      const start = performance.now();
      await new Promise<void>((done) => {
        const step = (now: number) => {
          const f = Math.min(1, (now - start) / COUNT_MS);
          counted = Math.round(score * (1 - Math.pow(1 - f, 3)));
          if (counted >= score) return done();
          requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
      clink();
    }
  }

  // Picked up again after the table was over: straight to the placings.
  onMount(() => {
    if (game.phase === 'over' && game.round?.result) next();
  });
</script>

{#snippet ending()}
  <button class="ghost" onclick={onmenu}>{t('end.pause')}</button>
  {#if onfinish}<button onclick={() => onfinish(highRollersResult(game))}>{t('show.continue')}</button>{:else}<button onclick={again}>{t('hr.again')}</button>{/if}
{/snippet}

<div class="high-rollers">
<!-- A new table (Again) starts afresh: purses laid out new. -->
{#key tableNo}
  <Table table={view} onplay={play} onnext={next} {onmenu} buttons={over ? ending : undefined} />
{/key}

{#if over}
  <!-- The placings: those still standing take gold, silver and bronze by purse; what you walk away with is your score. -->
  {@const result = highRollersResult(game)}
  {@const order = placings(game)}
  <div class="placings">
    <!-- Placed one at a time, from the bottom up; then what you walk away with, counted out. -->
    <ol>
      {#each order as p, i (p.id)}
        <li class:me={p.id === HUMAN_ID} class:out={p.out} class:placed={i >= order.length - placed}>
          <span class="medal {p.out ? '' : `m${i}`}">{p.out ? '' : i + 1}</span>
          <span>{p.id === HUMAN_ID ? t('character.captain.you') : tagName(p.id)}</span>
          <span>{p.out ? t('table.out') : t(`hr.place.${i}`)}</span>
          <span>{p.out ? '' : dollars(p.money)}</span>
        </li>
      {/each}
    </ol>
    <p class="score" class:shown={placed >= order.length}>{result.score ? t('hr.walkAway', { amount: dollars(counted) }) : t('hr.broke')}</p>
  </div>
{/if}
</div>

<style>
  .high-rollers {
    position: relative;
  }  .placings {
    position: absolute;
    left: 1rem;
    right: 1rem;
    max-width: calc(480px - 2rem);
    margin-inline: auto;
    top: 30%;
    margin: 0;
    padding: 1rem;
    background: #0c0c0b;
    border: 2px solid var(--paper);
    outline: 1px solid var(--paper);
    outline-offset: 4px;
    z-index: 60;
  }
  .placings ol {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .placings li.out {
    color: var(--grey);
  }
  /* Placed one at a time: each line arrives when its turn comes. */
  .placings li {
    visibility: hidden;
  }
  .placings li.placed {
    visibility: visible;
    animation: placed 0.4s ease-out;
  }
  @keyframes placed {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
  }
  .score {
    visibility: hidden;
  }
  .score.shown {
    visibility: visible;
  }
  /* Medals in black and white: bright, pale, dark. */
  .medal {
    display: inline-grid;
    place-items: center;
    width: 1.4em;
    height: 1.4em;
    border-radius: 50%;
    font-family: var(--title-font);
    font-size: 0.8em;
  }
  .medal.m0 {
    background: var(--paper);
    color: #0c0c0b;
    box-shadow:
      0 0 0 2px #0c0c0b,
      0 0 0 3px var(--paper);
  }
  .medal.m1 {
    background: #a9a69e;
    color: #0c0c0b;
  }
  .medal.m2 {
    background: #5d5a54;
    color: var(--paper);
  }
  .score {
    margin: 0.75rem 0 0;
    text-align: center;
    font-family: var(--title-font);
    font-size: 1.2rem;
  }
  .placings li {
    display: grid;
    grid-template-columns: auto 1fr auto auto;
    align-items: center;
    gap: 0.75rem;
    padding: 0.3rem 0;
  }
  .placings li.me {
    font-weight: bold;
  }
</style>
