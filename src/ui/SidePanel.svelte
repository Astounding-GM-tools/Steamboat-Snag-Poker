<script lang="ts">
  import { HUMAN_ID, isJoker, player, type GameState } from '../engine';
  import { t } from '../i18n';
  import { name } from './format';

  let { game, opponentId, onmenu }: { game: GameState; opponentId: string; onmenu: () => void } = $props();

  const captain = $derived(player(game, HUMAN_ID));
  const seat = $derived(game.round?.seats[0]);
  const myJokerCount = $derived(seat ? seat.jokers.length + seat.slots.filter(isJoker).length : captain.jokers.length);
  const statusOrder = { active: 0, waiting: 1, eliminated: 2 } as const;
  const league = $derived(
    [...game.players].sort((a, b) => statusOrder[a.status] - statusOrder[b.status] || b.popularity - a.popularity),
  );
  const meterLevel = (p: number) => (p < 20 ? 'danger' : p < 35 ? 'warn' : '');
</script>

<aside class="side">
  <div class="month">{t('table.month', { month: game.month, total: game.config.months })}</div>
  <div class="meter {meterLevel(captain.popularity)}">
    <div class="fill" style="height: {captain.popularity}%"></div>
    <span class="pct">{captain.popularity}%</span>
  </div>
  <div class="label">{t('table.popularity')}</div>
  <div class="label">🃏 × {myJokerCount}</div>

  <h3>{t('table.league')}</h3>
  <ul class="league">
    {#each league as p (p.id)}
      <li class:out={p.status !== 'active'} class:me={p.id === HUMAN_ID} class:foe={p.id === opponentId}>
        <span>{p.id === opponentId ? '► ' : ''}{p.id === HUMAN_ID ? t('character.captain.you') : name(p.id)}</span>
        <span>
          {#if p.status === 'eliminated'}{t('table.out')}
          {:else if p.status === 'waiting'}{t('table.waiting')}
          {:else}{p.popularity}% · 🃏{p.jokers.length}{/if}
        </span>
      </li>
    {/each}
  </ul>
  <p class="preset">{t(`preset.${game.config.preset}`)}</p>
  <button class="ghost menu" onclick={onmenu}>{t('table.menu')}</button>
</aside>
