<script lang="ts">
  import { HUMAN_ID, type GameState } from '../engine';
  import { t } from '../i18n';
  import { shortName } from './format';

  /**
   * The end of a voyage on the river (the crossings' own results are told on
   * the table): broke, or the last captain afloat. Says only what matters.
   */
  interface Props {
    game: GameState;
    onpause: () => void;
    onagain: () => void;
  }
  let { game, onpause, onagain }: Props = $props();

  /** Rivals still afloat when you go broke: with only one, they take the river. */
  const rivalsLeft = $derived(game.players.filter((p) => p.id !== HUMAN_ID && p.status === 'active'));
</script>

<div class="overlay">
  <div class="intertitle">
    <div class="flourish">❦ ❦ ❦</div>
    {#if game.phase === 'gameOver'}
      <h1>{t('end.gameOver')}</h1>
      <p>{t('end.gameOverBody')}</p>
      <p>{rivalsLeft.length === 1 ? t('end.gameOverKing', { name: shortName(rivalsLeft[0].id) }) : t('end.gameOverMany')}</p>
    {:else}
      <h1>{t('end.winGame')}</h1>
      <p>{t('end.lastStanding', { month: game.month })}</p>
    {/if}

    <div class="buttons">
      <button onclick={onagain}>{t('end.again')}</button>
      <button class="ghost" onclick={onpause}>{t('end.toTitle')}</button>
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
    width: 100%;
    max-height: 94vh;
    overflow: auto;
  }
  /* A phone: less padding, so the summary fits the screen. */
  @media (max-width: 480px) {
    .intertitle {
      padding: 1.25rem 1rem;
    }
  }
  .buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    justify-content: center;
    margin-top: 1.5rem;
  }
</style>
