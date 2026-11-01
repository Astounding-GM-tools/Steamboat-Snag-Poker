<script lang="ts">
  import { untrack } from 'svelte';
  import { DEFAULT_CONFIG, ROSTER, Rng, finaleSetup, finishFinale, newGame, nextMonth, submitAction, type Action, type GameState, type HighRollersResult, type HighRollersState, type SessionPlayer } from '../engine';
  import CardZoom from './CardZoom.svelte';
  import HandLadder from './HandLadder.svelte';
  import LeagueTable from './LeagueTable.svelte';
  import PassAndPlay from './PassAndPlay.svelte';
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
  /** The voyage is over (broke, or the last afloat): its ending card is up. */
  let ended = $state(false);

  /** Which voyage this is: a new one (or one picked up again) gets a fresh table. */
  let voyage = $state(0);
  function newVoyage(g: GameState) {
    voyage++;
    ended = false;
    setGame(g);
  }

  function setGame(g: GameState | null) {
    game = g;
    // A lesson is played, not saved: it never takes the place of your voyage.
    if (g && !g.story) {
      saveGame(g);
      saved = loadGame();
    }
  }

  function start() {
    ended = false;
    newVoyage(newGame(Date.now() >>> 0, DEFAULT_CONFIG));
  }

  function startTutorial() {
    ended = false;
    newVoyage(newTutorial(Date.now() >>> 0));
  }
  /**
   * In development: a League of four (you and three rivals, drawn), whose first crossing ends at the final
   * table, for trying the finale without a whole League (finaleSoon() in the console). It's a voyage like any
   * other: it replaces the one in progress.
   */
  function finaleSoon() {
    const drawn = new Rng(Date.now() >>> 0).shuffle(ROSTER.filter((c) => !c.follows && c.tier !== 'rascal')).slice(0, 3);
    ended = false;
    newVoyage(newGame(Date.now() >>> 0, DEFAULT_CONFIG, drawn.map((def) => ({ def, joins: 'start' as const }))));
  }
  /** In development, the High Rollers table on its own (highRollers() in the console; highRollers(40) seats everyone with $40, quicker to an ending; highRollers(40, 2) with two rivals). */
  let highRollers = $state<{ purse?: number; rivals?: number } | null>(null);
  /** In development, pass-and-play on this device (passAndPlay(2) in the console: two people; passAndPlay(2, 1) and an AI). */
  let passPlay = $state<SessionPlayer[] | null>(null);
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
      ended = false;
      newVoyage(skipToHands(Date.now() >>> 0));
    };
    w.highRollers = (purse?: number, rivals?: number) => (highRollers = { purse, rivals });
    w.passAndPlay = (people = 2, ais = 0) => {
      const drawn = new Rng(Date.now() >>> 0).shuffle(ROSTER.filter((c) => !c.follows && c.tier !== 'rascal'));
      passPlay = [
        ...drawn.slice(0, people).map((c) => ({ id: c.id })),
        ...drawn.slice(people, people + ais).map((c) => ({ id: c.id, ai: c.ai })),
      ];
    };
    w.finaleSoon = finaleSoon;
    // A story's full table: you and n rivals at the first crossing (a story, so never saved; fullTable(2) in the console).
    w.fullTable = (n = 2) => {
      const drawn = new Rng(Date.now() >>> 0).shuffle(ROSTER.filter((c) => !c.follows && c.tier !== 'rascal')).slice(0, 5);
      newVoyage(newGame(Date.now() >>> 0, DEFAULT_CONFIG, drawn.map((def) => ({ def, joins: 'start' as const })), { story: 'fullTable', tables: [drawn.slice(0, n).map((d) => d.id)] }));
    };
    // Straight to the first hand for buttons; give purses (yours, hers) to try an ending.
    w.tutorialButtons = (mine?: number, hers?: number) => {
      const g = skipToButtons(Date.now() >>> 0);
      if (mine) g.players[0].money = mine;
      if (hers) g.players[1].money = hers;
      newVoyage(g);
    };
  }

  /** Something an answer in a conversation set going. */
  function talkEffect(effect: string) {
    if (effect === 'end') pause();
    else if (effect === 'next') next();
    else if (effect === 'rematch' && game) {
      // Another knockout, for buttons, from the start.
      ended = false;
      setGame(rematch(game));
    } else if (effect === 'buttons' && game) {
      // The lesson's last arranged round is over: out come the buttons, and on to a real game.
      game = giveButtons(game);
      next();
    }
    else if (import.meta.env.DEV) console.info('talk effect:', effect);
  }

  function resume() {
    if (!saved) return;
    voyage++;
    ended = false;
    game = saved;
  }

  function act(action: Action) {
    if (!game) return;
    const g = submitAction(game, action);
    if (!g.story && (g.phase === 'gameOver' || g.phase === 'victory')) best = recordResult(g.month, g.phase === 'victory');
    setGame(g);
  }

  function next() {
    if (!game) return;
    ended = false;
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
    ended = false;
    game = null;
  }
</script>

<div class="film">
  <div class="flicker" aria-hidden="true"></div>
  {#if passPlay}
    <PassAndPlay players={passPlay} onmenu={() => (passPlay = null)} />
  {:else if highRollers}
    {#key highRollers}<HighRollersTable onmenu={() => (highRollers = null)} setup={devTable(highRollers)} />{/key}
  {:else if game?.phase === 'finale'}
    <!-- The League's last four at the final table (the same deal again if a voyage is picked up here). -->
    {#key game.rngState}<HighRollersTable onmenu={pause} setup={finaleSetup(game)} saved={game.finaleTable} onsave={saveTable} onfinish={finished} />{/key}
  {:else if game}
    {#key voyage}<LeagueTable {game} onaction={act} onnext={next} onend={() => (ended = true)} onmenu={pause} script={game.story ? roundScript(scripts[game.story], game.month) : undefined} ontalk={talkEffect} />{/key}
    {#if ended}
      <MonthEnd {game} onpause={pause} onagain={() => start()} />
    {/if}
  {:else}
    <Title savedMonth={saved?.month ?? null} onstart={() => start()} oncontinue={resume} ontutorial={startTutorial} />
  {/if}
</div>
<CardZoom />
<HandLadder />
