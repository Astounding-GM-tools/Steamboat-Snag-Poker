<script lang="ts">
  import { untrack } from 'svelte';
  import { CATEGORIES, HUMAN_ID, Rng, opponentOdds, player, viewFor, type Action, type GameState, type OpponentOdds } from '../engine';
  import { t } from '../i18n';
  import Standings from './Standings.svelte';
  import Table, { type TableView } from './Table.svelte';
  import { name } from './format';
  import type { RoundScript } from '../story/script';

  /**
   * A crossing of the voyage (the League, or Morag's lessons) at the table:
   * you and this crossing's opponent (or, where a story seats them, several). It keeps nothing of the game itself
   * (App does), only what goes over the board between moves: the opponent's
   * details (tap their name: who they are, and mid-hand Willie's reckoning of
   * what they could be holding) and, after the crossing, the standings.
   */
  let {
    game,
    onaction,
    onnext,
    onend,
    onmenu,
    script,
    ontalk,
  }: {
    game: GameState;
    onaction: (action: Action) => void;
    /** On to the next crossing (or to the final table). */
    onnext: () => void;
    /** The voyage is over (broke, or the last afloat): what happens then is App's. */
    onend: () => void;
    onmenu: () => void;
    script?: RoundScript;
    ontalk?: (effect: string) => void;
  } = $props();

  const round = $derived(game.round!);
  const playing = $derived(game.phase === 'duel');
  /** Everyone at your table besides you, by seat from the first after yours. */
  const tableIds = $derived(game.tableIds?.length ? game.tableIds : [game.opponentId!]);

  const view = $derived.by((): TableView => {
    const ids = round.seats.map((s) => s.playerId);
    // During the crossing the purses are as they were when it began; after it, the report says what they were.
    const start = ids.map((id) => game.report?.money[id]?.before ?? player(game, id).money);
    return {
      round,
      config: game.config,
      hand: game.month,
      ids,
      me: 0,
      chairs: tableIds.map((id, k) => ({ id, seat: k + 1 })),
      start,
      money: ids.map((id) => player(game, id).money),
      phase: playing ? 'hand' : 'handEnd',
      currency: game.currency,
      label: t('table.crossing', { month: game.month }),
      heading: showStandings ? t('street.standings') : undefined,
      ending: game.phase === 'victory' ? 'wonAll' : game.phase === 'gameOver' ? 'lostAll' : undefined,
    };
  });

  /** After the crossing: the standings over the board, until Next. */
  let standing = $state(false);
  /** Someone's details over the board (tap their name or portrait, and again, or Back, to close): their seat. */
  let details = $state<number | null>(null);
  const detailsId = $derived(details === null ? null : round.seats[details]?.playerId ?? null);
  // A new crossing clears both.
  let shownMonth = untrack(() => game.month);
  $effect(() => {
    const m = game.month;
    untrack(() => {
      if (m !== shownMonth) {
        shownMonth = m;
        standing = false;
        details = null;
      }
    });
  });

  /** After the verdict: a lesson goes straight on (or home, when the game is over); the League shows the standings; the end of the voyage is App's. */
  function next() {
    details = null;
    if (game.phase === 'gameOver' || game.phase === 'victory') {
      if (game.story) onmenu();
      else onend();
    } else if (game.phase === 'monthEnd') {
      if (game.story) onnext();
      else standing = true;
    }
  }

  /** The standings show while the crossing's report is there to show. */
  const showStandings = $derived(standing && !playing && !!game.report);
  function onwards() {
    standing = false;
    onnext();
  }

  // Willie's reckoning appears in their details while a crossing is being played.
  const odds = $derived.by((): OpponentOdds | null => {
    if (details === null || !playing) return null;
    // Seeded from the visible situation so the numbers stay put while you look.
    const seed = round.community.length * 7919 + round.discards.length * 104729 + round.month;
    return opponentOdds(viewFor(round, 0, game.config), game.config, new Rng(seed), 600);
  });
</script>

{#snippet standings()}
  <div class="standings-over"><Standings {game} />{#if game.finaleNext}<p class="finale-next">{t('finale.next')}</p>{/if}</div>
{/snippet}
{#snippet info()}
  <!-- Their details take the board's place (tap to go back to it): who they are and, mid-crossing, Willie's reckoning. -->
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div class="river-info" onclick={() => (details = null)}>
    <p class="blurb">{t(`character.${detailsId}.blurb`)}</p>
    {#if odds}
      <p class="harbour">{t(tableIds.length > 1 ? 'draw.oddsTitleTable' : 'draw.oddsTitle', { name: name(detailsId!) })}</p>
      <!-- Every rank, even the impossible ones (a reminder of what beats what); not the all-but-mythical straight flush. -->
      {#each [...CATEGORIES].filter((c) => c !== 'straightFlush').reverse() as cat}
        {@const p = odds.categories[cat]}
        <div class="bar" class:none={p === 0}>
          <span>{t(`hand.${cat}`)}</span>
          <span class="track"><span class="fill" style="width: {p * 100}%"></span></span>
          <span class="num">{p === 0 ? '–' : p < 0.005 ? '<1%' : `${Math.round(p * 100)}%`}</span>
        </div>
      {/each}
    {/if}
  </div>
{/snippet}
{#snippet standingButtons()}
  <button class="ghost" onclick={onmenu}>{t('end.pause')}</button>
  <!-- Four left: on to the final table. -->
  <button onclick={onwards}>{game.finaleNext ? t('finale.go') : t('end.next')}</button>
{/snippet}
{#snippet detailButtons()}
  <button class="ghost" disabled>{t('end.pause')}</button>
  <button onclick={() => (details = null)}>{t('draw.back')}</button>
{/snippet}

<Table
  table={view}
  onplay={(action) => action && onaction(action)}
  onnext={next}
  {onmenu}
  onseat={(seat) => (details = details === seat ? null : seat)}
  cover={details !== null ? info : showStandings ? standings : undefined}
  buttons={details !== null ? detailButtons : showStandings ? standingButtons : undefined}
  {script}
  {ontalk}
/>

<style>
  .river-info {
    height: 100%;
    overflow: auto;
    padding: 0.25rem 0.5rem;
    text-align: left;
  }
  .blurb {
    margin: 0 0 0.5rem;
    color: var(--grey);
    font-size: 0.9rem;
  }
  .harbour {
    margin: 0.25rem 0;
    font-family: var(--title-font);
  }
  .bar {
    display: grid;
    grid-template-columns: 7.5rem 1fr 2.5rem;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8rem;
  }
  .bar.none {
    color: var(--dim);
  }
  .track {
    height: 6px;
    background: rgba(255, 255, 255, 0.08);
  }
  .fill {
    display: block;
    height: 100%;
    background: var(--paper);
  }
  .num {
    text-align: right;
  }
  .standings-over {
    height: 100%;
    overflow: auto;
  }
  .finale-next {
    margin: 0.5rem 0 0;
    text-align: center;
    font-family: var(--title-font);
  }
</style>
