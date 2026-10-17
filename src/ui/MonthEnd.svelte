<script lang="ts">
  import { HUMAN_ID, type GameState, type DuelSummary } from '../engine';
  import { t } from '../i18n';
  import { jokerList, name } from './format';

  let { game, onnext, onmenu }: { game: GameState; onnext: () => void; onmenu: () => void } = $props();

  const report = $derived(game.report!);
  const res = $derived(report.duel.result);
  const foe = $derived(report.duel.players[1]);
  const won = $derived(res.winner === 0);
  const mine = $derived(report.popularity[HUMAN_ID]);
  const over = $derived(game.phase === 'gameOver' || game.phase === 'victory');

  const headline = $derived(
    game.phase === 'gameOver' ? t('end.gameOver')
    : game.phase === 'victory' ? t('end.winGame')
    : res.winner === null ? t('end.draw')
    : won ? t('end.victory') : t('end.catastrophe'),
  );

  function duelLine(d: DuelSummary): string {
    const r = d.result;
    if (r.winner === null) return t('end.duelDraw', { a: name(d.players[0]), b: name(d.players[1]) });
    const moved = r.dumped.length + r.communityTaken.length;
    return (
      t('end.duel', { winner: name(d.players[r.winner]), loser: name(d.players[1 - r.winner]), hand: t(`hand.${r.hands[r.winner].category}`) }) +
      (moved ? ' ' + t('end.jokersMoved', { n: moved }) : '')
    );
  }
</script>

<div class="overlay">
  <div class="intertitle">
    <div class="flourish">❦ ❦ ❦</div>
    <h1>{headline}</h1>

    {#if game.phase === 'gameOver'}
      <p>{t('end.gameOverBody', { month: game.month })}</p>
    {:else if game.phase === 'victory'}
      <p>{report.month < game.config.months ? t('end.lastStanding') : t('end.winGameBody', { month: game.month })}</p>
    {/if}

    <div class="ledger">
      {#if res.winner === null}
        <p>{t('end.draw.body')}</p>
      {:else if won}
        <p>{t('end.youWon', { name: name(foe), hand: t(`hand.${res.hands[0].category}`) })}</p>
        <p class="big">{t('end.gain', { n: res.gain })}</p>
        {#if res.dumped.length}<p>{t('end.dumped', { jokers: jokerList(res.dumped) })}</p>{/if}
        {#if res.communityTaken.length}<p>{t('end.dodged', { name: name(foe), jokers: jokerList(res.communityTaken) })}</p>{/if}
      {:else}
        <p>{t('end.youLost', { name: name(foe), hand: t(`hand.${res.hands[1].category}`) })}</p>
        {#if res.dumped.length}<p class="big">{t('end.gotDumped', { name: name(foe), jokers: jokerList(res.dumped) })}</p>{/if}
        {#if res.communityTaken.length}<p class="big">{t('end.tookCommunity', { jokers: jokerList(res.communityTaken) })}</p>{/if}
      {/if}
      {#if mine?.drained}<p>{t('end.drain', { n: mine.drained })}</p>{/if}
      {#if mine}<p class="pop">{t('table.popularity')}: {mine.before}% → <b>{mine.after}%</b></p>{/if}
    </div>

    {#if report.offscreen.length || report.eliminated.length || report.joined.length}
      <div class="news">
        <h2>{t('end.meanwhile')}</h2>
        {#each report.offscreen as d}<p>{duelLine(d)}</p>{/each}
        {#each report.eliminated.filter((id) => id !== HUMAN_ID) as id}<p><b>{t('end.eliminated', { name: name(id) })}</b></p>{/each}
        {#each report.joined as id}<p><b>{t('end.joined', { name: name(id) })}</b></p>{/each}
      </div>
    {/if}

    <div class="buttons">
      {#if over}
        <button onclick={onmenu}>{t('end.again')}</button>
      {:else}
        <button onclick={onnext}>{t('end.next')}</button>
        <button class="ghost" onclick={onmenu}>{t('end.menu')}</button>
      {/if}
    </div>
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    display: grid;
    place-items: center;
    padding: 1rem;
    z-index: 20;
    animation: iris 0.5s ease-out;
  }
  @keyframes iris {
    from { clip-path: circle(0% at 50% 50%); }
    to { clip-path: circle(150% at 50% 50%); }
  }
  .intertitle {
    max-height: 92vh;
    overflow: auto;
  }
  .ledger p {
    margin: 0.35rem 0;
  }
  .big {
    font-family: var(--title-font);
    font-size: 1.4rem;
  }
  .pop {
    color: var(--grey);
  }
  .pop b {
    color: var(--paper);
  }
  .news {
    margin-top: 1.25rem;
    padding-top: 0.75rem;
    border-top: 1px dashed var(--grey);
    font-size: 0.9rem;
    color: var(--grey);
  }
  .news h2 {
    font-size: 1.2rem;
    color: var(--paper);
  }
  .news p {
    margin: 0.25rem 0;
  }
  .buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-top: 1.5rem;
  }
</style>
