<script lang="ts">
  import { newGame, nextMonth, submitAction, type Action, type GameState, type RulesConfig } from '../engine';
  import DebugPanel from './DebugPanel.svelte';
  import DrawTable from './DrawTable.svelte';
  import HandLog from './HandLog.svelte';
  import MonthEnd from './MonthEnd.svelte';
  import Showdown from './Showdown.svelte';
  import Table from './Table.svelte';
  import Title from './Title.svelte';
  import { loadBest, loadConfig, loadGame, recordResult, saveConfig, saveGame } from './storage';

  let config = $state.raw<RulesConfig>(loadConfig());
  let seed = $state(Date.now() >>> 0);
  let peek = $state(false);
  let best = $state(loadBest());
  /** Paused or saved voyage, shown as "Continue" on the title screen. */
  let saved = $state.raw<GameState | null>(loadGame());
  // Engine state is replaced wholesale on every move, so keep it out of deep reactivity.
  let game = $state.raw<GameState | null>(null);
  /** After a duel: 'reveal' plays the showdown, then 'result' shows the month's card. */
  let stage = $state<'play' | 'reveal' | 'result'>('play');
  let endTimer: ReturnType<typeof setTimeout> | undefined;
  let showLog = $state(false);

  function setGame(g: GameState | null) {
    game = g;
    if (g) {
      saveGame(g);
      saved = loadGame();
    }
  }

  function start(newSeed = Date.now() >>> 0) {
    seed = newSeed;
    stage = 'play';
    setGame(newGame(seed, config));
  }

  function resume() {
    if (!saved) return;
    stage = saved.phase === 'duel' ? 'play' : 'result';
    game = saved;
  }

  function act(action: Action) {
    if (!game) return;
    const g = submitAction(game, action);
    if (g.phase === 'gameOver' || g.phase === 'victory') best = recordResult(g.month, g.phase === 'victory');
    setGame(g);
    if (g.phase !== 'duel') {
      if (g.config.playStyle === 'draw') stage = 'reveal';
      else {
        // Slots style: let the showdown sit on the table for a beat.
        clearTimeout(endTimer);
        endTimer = setTimeout(() => (stage = 'result'), 1400);
      }
    }
  }

  function next() {
    if (!game) return;
    stage = 'play';
    setGame(nextMonth(game));
  }

  function pause() {
    clearTimeout(endTimer);
    stage = 'play';
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
    {#if game.round?.playStyle === 'draw'}
      <DrawTable {game} {peek} onaction={act} />
    {:else}
      <Table {game} {peek} onaction={act} onmenu={pause} />
    {/if}
    {#if stage === 'reveal' && game.round?.result}
      <Showdown {game} ondone={() => (stage = 'result')} />
    {:else if stage === 'result' && game.report}
      <MonthEnd {game} onnext={next} onpause={pause} onagain={() => start()} onlog={() => (showLog = true)} />
    {/if}
    {#if showLog}<HandLog {game} onclose={() => (showLog = false)} />{/if}
  {:else}
    <Title {best} savedMonth={saved?.month ?? null} onstart={() => start()} oncontinue={resume} />
  {/if}
</div>
<DebugPanel {config} {seed} {peek} onapply={applyRules} onpeek={(p) => (peek = p)} onlog={game ? () => (showLog = true) : undefined} />
