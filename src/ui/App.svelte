<script lang="ts">
  import { untrack } from 'svelte';
  import { DEFAULT_CONFIG, ROSTER, Rng, finaleSetup, finishFinale, newGame, nextMonth, submitAction, type Action, type GameState, type HighRollersResult, type HighRollersState } from '../engine';
  import CardZoom from './CardZoom.svelte';
  import HandLadder from './HandLadder.svelte';
  import DrawTable from './DrawTable.svelte';
  import HighRollersTable from './HighRollersTable.svelte';
  import MonthEnd from './MonthEnd.svelte';
  import Title from './Title.svelte';
  import { loadBest, loadGame, recordResult, saveGame } from './storage';
  import { giveButtons, newTutorial, rematch, skipToButtons, skipToHands, tutorialScript, TUTORIAL } from '../story/tutorial';
  import { roundScript, type Script } from '../story/script';

  /** Lessons and story encounters, by the id a game carries. */
  const scripts: Record<string, Script> = { [TUTORIAL]: tutorialScript };

  let best = $state(loadBest());
  /** Paused or saved voyage, shown as "Continue" on the title screen. */
  let saved = $state.raw<GameState | null>(loadGame());
  // Engine state is replaced wholesale on every move, so keep it out of deep reactivity.
  let game = $state.raw<GameState | null>(null);
  /** After a duel: 'reveal' plays the showdown on the table, then 'result' shows the standings. */
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
  /**
   * In development: a League of four (you and three rivals, drawn), whose first crossing ends at the final
   * table, for trying the finale without a whole League (finaleSoon() in the console). It's a voyage like any
   * other: it replaces the one in progress.
   */
  function finaleSoon() {
    const drawn = new Rng(Date.now() >>> 0).shuffle(ROSTER.filter((c) => !c.follows && c.tier !== 'rascal')).slice(0, 3);
    stage = 'play';
    setGame(newGame(Date.now() >>> 0, DEFAULT_CONFIG, drawn.map((def) => ({ def, joins: 'start' as const }))));
  }
  /** In development, the High Rollers table on its own (highRollers() in the console; highRollers(40) seats everyone with $40, quicker to an ending; highRollers(40, 2) with two rivals). */
  let highRollers = $state<{ purse?: number; rivals?: number } | null>(null);
  function devTable({ purse, rivals }: { purse?: number; rivals?: number }) {
    const drawn = rivals ? new Rng(Date.now() >>> 0).shuffle(ROSTER.filter((c) => !c.follows && c.tier !== 'rascal')).slice(0, rivals).map((c) => c.id) : undefined;
    return { ...(purse ? { money: purse } : {}), ...(drawn ? { rivals: drawn } : {}) };
  }
  // A voyage in progress opens where it was left (a phone that slept, a page reloaded): the title is a Menu away.
  if (untrack(() => saved)) resume();
  if (import.meta.env.DEV) {
    const w = window as unknown as Record<string, unknown>;
    w.startTutorial = startTutorial;
    // Straight to Morag's lesson on the hands (the tutorial's round three, if you don't know them).
    w.handsLesson = () => {
      stage = 'play';
      setGame(skipToHands(Date.now() >>> 0));
    };
    w.highRollers = (purse?: number, rivals?: number) => (highRollers = { purse, rivals });
    w.finaleSoon = finaleSoon;
    // Straight to the first hand for buttons; give purses (yours, hers) to try an ending.
    w.tutorialButtons = (mine?: number, hers?: number) => {
      const g = skipToButtons(Date.now() >>> 0);
      if (mine) g.players[0].money = mine;
      if (hers) g.players[1].money = hers;
      stage = 'play';
      setGame(g);
    };
  }

  /** Something an answer in a conversation set going. */
  function talkEffect(effect: string) {
    if (effect === 'end') pause();
    else if (effect === 'next') next();
    else if (effect === 'rematch' && game) {
      // Another knockout, for buttons, from the start.
      stage = 'play';
      setGame(rematch(game));
    } else if (effect === 'buttons' && game) {
      // The lesson's last arranged round is over: out come the buttons, and on to a real game.
      game = giveButtons(game);
      next();
    }
    else if (import.meta.env.DEV) console.info('talk effect:', effect);
  }

  /** The showdown is over. A story goes straight on to its next round (or, when the game is over, home); a tournament shows the standings. */
  function revealed() {
    if (!game?.story) stage = 'result';
    else if (game.phase === 'monthEnd') next();
    else pause();
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
      const folded = !!g.round?.result?.byFolds;
      settled = folded;
      if (!folded) stage = 'reveal';
      // A lesson's fold ends in conversation (which says where to go), not in the standings.
      else if (!g.story) {
        // Nothing to reveal: let the pot fly to the winner, then show the result card.
        clearTimeout(endTimer);
        endTimer = setTimeout(() => (stage = 'result'), 1200);
      }
    }
  }

  function next() {
    if (!game) return;
    stage = 'play';
    setGame(nextMonth(game));
  }

  /** The final table, saved with the voyage at every move. */
  function saveTable(table: HighRollersState) {
    if (game?.phase === 'finale') setGame({ ...game, finaleTable: table });
  }

  /** The final table is over: the voyage is finished, recorded, and it's back to the title. */
  function finished(result: HighRollersResult) {
    if (!game) return;
    const g = finishFinale(game, result);
    best = recordResult(g.month, result.place === 0, result.score);
    setGame(g);
    game = null;
  }

  function pause() {
    clearTimeout(endTimer);
    stage = 'play';
    game = null;
  }
</script>

<div class="film">
  {#if highRollers}
    {#key highRollers}<HighRollersTable onmenu={() => (highRollers = null)} setup={devTable(highRollers)} />{/key}
  {:else if game?.phase === 'finale'}
    <!-- The League's last four at the final table (the same deal again if a voyage is picked up here). -->
    {#key game.rngState}<HighRollersTable onmenu={pause} setup={finaleSetup(game)} saved={game.finaleTable} onsave={saveTable} onfinish={finished} />{/key}
  {:else if game}
    <DrawTable {game} {settled} {stage} onaction={act} onmenu={pause} onverdict={() => (settled = true)} onrevealed={revealed} onnext={next} script={game.story ? roundScript(scripts[game.story], game.month) : undefined} ontalk={talkEffect} />
    {#if stage === 'result' && game.report && game.phase !== 'monthEnd'}
      <MonthEnd {game} onpause={pause} onagain={() => start()} />
    {/if}
  {:else}
    <Title savedMonth={saved?.month ?? null} onstart={() => start()} oncontinue={resume} ontutorial={startTutorial} />
  {/if}
</div>
<CardZoom />
<HandLadder />
