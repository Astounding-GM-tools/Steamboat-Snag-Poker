<script lang="ts">
  import { DEFAULT_CONFIG, newGame, nextMonth, submitAction, type Action, type GameState } from '../engine';
  import CardZoom from './CardZoom.svelte';
  import DrawTable from './DrawTable.svelte';
  import MonthEnd from './MonthEnd.svelte';
  import Showdown from './Showdown.svelte';
  import Table from './Table.svelte';
  import Title from './Title.svelte';
  import { loadBest, loadGame, recordResult, saveGame } from './storage';
  import { newTutorial, tutorialScript, TUTORIAL } from '../story/tutorial';
  import type { Script } from '../story/script';

  /** Lessons and story encounters, by the id a game carries. */
  const scripts: Record<string, Script> = { [TUTORIAL]: tutorialScript };

  let best = $state(loadBest());
  /** Paused or saved voyage, shown as "Continue" on the title screen. */
  let saved = $state.raw<GameState | null>(loadGame());
  // Engine state is replaced wholesale on every move, so keep it out of deep reactivity.
  let game = $state.raw<GameState | null>(null);
  /** After a duel: 'reveal' plays the showdown, then 'result' shows the month's card. */
  let stage = $state<'play' | 'reveal' | 'result'>('play');
  let endTimer: ReturnType<typeof setTimeout> | undefined;
  /** The showdown has shown its verdict: the pot may be paid out on the table. */
  let settled = $state(true);

  function setGame(g: GameState | null) {
    game = g;
    // A lesson is played, not saved: it never takes the place of your voyage.
    if (g && !g.story) {
      saveGame(g);
      saved = loadGame();
    }
  }

  function start() {
    stage = 'play';
    setGame(newGame(Date.now() >>> 0, DEFAULT_CONFIG));
  }

  function startTutorial() {
    stage = 'play';
    setGame(newTutorial(Date.now() >>> 0));
  }
  // For now the lessons start from the address (…/?tutorial) or, in development, the console.
  if (new URLSearchParams(location.search).has('tutorial')) startTutorial();
  if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).startTutorial = startTutorial;

  /** Something an answer in a conversation set going. */
  function talkEffect(effect: string) {
    if (effect === 'end') pause();
    else if (effect === 'next') next();
    else if (import.meta.env.DEV) console.info('talk effect:', effect);
  }

  function resume() {
    if (!saved) return;
    stage = saved.phase === 'duel' ? 'play' : 'result';
    game = saved;
  }

  function act(action: Action) {
    if (!game) return;
    const g = submitAction(game, action);
    if (!g.story && (g.phase === 'gameOver' || g.phase === 'victory')) best = recordResult(g.month, g.phase === 'victory');
    setGame(g);
    if (g.phase !== 'duel') {
      // A fold has nothing to reveal: straight to the result card.
      if (g.config.playStyle === 'draw') {
        const folded = g.round?.result?.folded != null;
        settled = folded;
        if (!folded) stage = 'reveal';
        // A lesson's fold ends in conversation (which says where to go), not in the standings.
        else if (!g.story) {
          // Nothing to reveal: let the pot fly to the winner, then show the result card.
          clearTimeout(endTimer);
          endTimer = setTimeout(() => (stage = 'result'), 1200);
        }
      }
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
</script>

<div class="film">
  {#if game}
    {#if game.round?.playStyle === 'draw'}
      <DrawTable {game} {settled} {stage} onaction={act} onmenu={pause} onverdict={() => (settled = true)} onrevealed={() => (stage = 'result')} onnext={next} script={game.story ? scripts[game.story]?.[game.month - 1] : undefined} ontalk={talkEffect} />
    {:else}
      <Table {game} peek={false} onaction={act} onmenu={pause} />
    {/if}
    {#if stage === 'reveal' && game.round?.result && game.round.playStyle !== 'draw'}
      <Showdown {game} ondone={() => (stage = 'result')} onverdict={() => (settled = true)} />
    {:else if stage === 'result' && game.report && (game.round?.playStyle !== 'draw' || game.phase !== 'monthEnd')}
      <MonthEnd {game} onnext={next} onpause={pause} onagain={() => start()} />
    {/if}
  {:else}
    <Title savedMonth={saved?.month ?? null} onstart={() => start()} oncontinue={resume} />
  {/if}
</div>
<CardZoom />
