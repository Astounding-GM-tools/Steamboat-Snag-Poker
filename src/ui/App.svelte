<script lang="ts">
  import { newGame, nextMonth, submitAction, type Action, type GameState, type RulesConfig } from '../engine';
  import DebugPanel from './DebugPanel.svelte';
  import MonthEnd from './MonthEnd.svelte';
  import Table from './Table.svelte';
  import Title from './Title.svelte';
  import { loadBest, loadConfig, recordResult, saveConfig } from './storage';

  let config = $state.raw<RulesConfig>(loadConfig());
  let seed = $state(Date.now() >>> 0);
  let peek = $state(false);
  let best = $state(loadBest());
  // Engine state is replaced wholesale on every move, so keep it out of deep reactivity.
  let game = $state.raw<GameState | null>(null);
  let showEnd = $state(false);
  let endTimer: ReturnType<typeof setTimeout> | undefined;

  function start(newSeed = Date.now() >>> 0) {
    seed = newSeed;
    game = newGame(seed, config);
    showEnd = false;
  }

  function act(action: Action) {
    if (!game) return;
    game = submitAction(game, action);
    if (game.phase !== 'duel') {
      if (game.phase === 'gameOver' || game.phase === 'victory') best = recordResult(game.month, game.phase === 'victory');
      // Let the showdown sit on the table for a beat before the intertitle.
      clearTimeout(endTimer);
      endTimer = setTimeout(() => (showEnd = true), 1400);
    }
  }

  function next() {
    if (!game) return;
    showEnd = false;
    game = nextMonth(game);
  }

  function menu() {
    clearTimeout(endTimer);
    showEnd = false;
    game = null;
  }

  function applyRules(c: RulesConfig, s: number) {
    config = c;
    saveConfig(c);
    start(s);
  }
</script>

<div class="film">
  {#if game}
    <Table {game} {peek} onaction={act} onmenu={menu} />
    {#if showEnd && game.report}
      <MonthEnd {game} onnext={next} onmenu={menu} />
    {/if}
  {:else}
    <Title {best} onstart={() => start()} />
  {/if}
</div>
<DebugPanel {config} {seed} {peek} onapply={applyRules} onpeek={(p) => (peek = p)} />
