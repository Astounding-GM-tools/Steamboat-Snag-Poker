<script lang="ts">
  import { jokerCard, parseCard, type Card } from '../engine';
  import ActionBar from '../ui/ActionBar.svelte';
  import Board from '../ui/Board.svelte';
  import MyCards from '../ui/MyCards.svelte';
  import OpponentSeat, { type SeatCard } from '../ui/OpponentSeat.svelte';
  import PotBand from '../ui/PotBand.svelte';
  import SnagFan from '../ui/SnagFan.svelte';
  import { thrownCard } from '../ui/coinflow.svelte';
  import { cardPrefs } from '../ui/cards.svelte';
  import { switchFaces } from '../ui/settings.svelte';
  import Frame from './Frame.svelte';

  /**
   * The bench (development only): the table's pieces in their variants, at
   * a phone's width, without playing to the moment they appear. Edit a
   * component and it updates here as you save.
   */
  const WIDTHS = [320, 375, 430, 480];
  let width = $state(375);

  const c = (codes: string) => codes.split(' ').map(parseCard);
  const snags = (n: number, from = 0) => Array.from({ length: n }, (_, i) => jokerCard(from + i));
  const thrown = () => thrownCard(false);
  const pot = (n: number) => ({ amount: n, start: n });

  /** Their cards: dealt face down, at the showdown (two played, one held back), or folded. */
  const dealtDown = (): SeatCard[] => [0, 1, 2].map((i) => ({ key: `h${i}`, faceDown: true, held: true }));
  const shownDown = (codes: string): SeatCard[] => {
    const [a, b, held] = c(codes);
    return [
      { key: a.id, card: a },
      { key: b.id, card: b },
      { key: held.id, card: held, faded: true },
    ];
  };
  const foldedDown = (): SeatCard[] => [0, 1, 2].map((i) => ({ key: `f${i}`, faceDown: true, faded: true }));

  const RIVALS = ['gaylord', 'walrus', 'steamboatBill'];
  const noLook = () => ({});
  const mine = c('Kd Ks 7h');
</script>

<main>
  <header>
    <h1>Bench</h1>
    <label>
      Width
      <select bind:value={width}>
        {#each WIDTHS as w}<option value={w}>{w}px</option>{/each}
      </select>
    </label>
    <button class="ghost" onclick={switchFaces}>Faces: {cardPrefs.face}</button>
  </header>

  <h2>Opponent seats</h2>
  <div class="grid">
    <Frame {width} label="One opponent (the whole table): dealt">
      <div><OpponentSeat id="morag" seat={1} cards={dealtDown()} {thrown} snags={snags(1, 13)} discarded={c('2c 3d')} flopDiscards={1} purse={pot(40)} /></div>
    </Frame>
    <Frame {width} label="One opponent: showdown, with a line">
      <div><OpponentSeat id="morag" seat={1} cards={shownDown('As 4c Kd')} {thrown} snags={snags(2, 13)} snagLook={(card) => ({ lifted: card.id === jokerCard(13).id })} discarded={[]} purse={pot(40)} line="Two pair, Aces and Fours" lineCategory="twoPair" dealer /></div>
    </Frame>
    <Frame {width} label="Two rivals (half each): one swapping, one folded">
      <div>
        <OpponentSeat id={RIVALS[0]} seat={1} span={6} cards={dealtDown()} {thrown} snags={snags(1)} discarded={c('9h 2s')} purse={pot(80)} line="Swaps 2" focus dealer />
        <OpponentSeat id={RIVALS[1]} seat={2} span={6} cards={foldedDown()} {thrown} snags={snags(3, 3)} discarded={[]} purse={pot(55)} line="Folds" folded />
      </div>
    </Frame>
    <Frame {width} label="Three rivals (a third each): showdown, folded, broke">
      <div>
        <OpponentSeat id={RIVALS[0]} seat={1} span={4} cards={shownDown('Qh Qs 5d')} {thrown} snags={snags(1)} snagLook={() => ({ lifted: true })} discarded={c('8c')} purse={pot(120)} line="Pair of Queens" lineCategory="pair" />
        <OpponentSeat id={RIVALS[1]} seat={2} span={4} cards={foldedDown()} {thrown} snags={snags(4, 3)} discarded={[]} purse={pot(30)} line="Folds" folded />
        <OpponentSeat id={RIVALS[2]} seat={-1} span={4} cards={[]} {thrown} snags={[]} discarded={[]} purse={pot(0)} broke />
      </div>
    </Frame>
  </div>

  <h2>Your cards</h2>
  <div class="grid">
    <Frame {width} label="Dealt">
      <div><MyCards played={[]} hand={mine} look={noLook} {thrown} snags={snags(1, 12)} snagLook={noLook} discarded={[]} /></div>
    </Frame>
    <Frame {width} label="Two tapped to swap">
      <div><MyCards played={[]} hand={mine} look={(card) => ({ toss: card.id !== 'Kd' })} {thrown} snags={snags(1, 12)} snagLook={noLook} discarded={c('2c')} flopDiscards={1} /></div>
    </Frame>
    <Frame {width} label="Making your hand: two tapped, a snag riding">
      <div><MyCards played={[]} hand={mine} look={(card) => ({ selected: card.id !== '7h', used: card.id !== '7h' })} ontap={() => {}} {thrown} snags={snags(2, 12)} snagLook={(card) => ({ selected: card.id === jokerCard(12).id })} onsnag={() => {}} discarded={c('2c 9s')} flopDiscards={1} /></div>
    </Frame>
    <Frame {width} label="Showdown: played first, the rest dimmed">
      <div><MyCards played={c('Kd Ks')} hand={c('7h')} look={() => ({ faded: true })} {thrown} snags={snags(1, 12)} snagLook={() => ({ used: true, lifted: true })} discarded={[]} /></div>
    </Frame>
  </div>

  <h2>The board and the pot</h2>
  <div class="grid">
    <Frame {width} label="Empty, then the Flop">
      <div><Board cards={[null, null, null, null, null]} /></div>
      <div><Board cards={[...c('As Jd 4c'), null, null]} /></div>
    </Frame>
    <Frame {width} label="The River, a snag on the board, marks above and below">
      <div><Board cards={[...c('As Jd 4c 4s'), jokerCard(5)] as Card[]} marks={(card) => ({ above: card.id === 'As' || card.id === '4s', below: card.id === 'Jd' })} /></div>
    </Frame>
    <Frame {width} label="Pots: in play, won, lost, a long verdict">
      <div><PotBand count={14} paid={false} /></div>
      <div><PotBand count={0} paid outcome="You win!" won /></div>
      <div><PotBand count={0} paid outcome="6 buttons lost" /></div>
      <div><PotBand count={0} paid outcome="Bill takes the pot! The snags go to you." wordy /></div>
    </Frame>
  </div>

  <h2>Buttons and snags</h2>
  <div class="grid">
    <Frame {width} label="Fold and Call; one reply; stacked replies">
      <ActionBar><button class="ghost">Fold · $3 in</button><button data-heavy="true">Call · $4</button></ActionBar>
      <ActionBar><button class="ghost" disabled style="visibility: hidden" aria-hidden="true"></button><button>Yes, ma’am</button></ActionBar>
      <div style="height: 9rem"></div>
      <ActionBar>
        <button class="stand-in" disabled aria-hidden="true">&nbsp;</button>
        <div class="stack"><button class="ghost">Lout?</button><button class="ghost">Who?</button><button>Snag?</button></div>
      </ActionBar>
    </Frame>
    <Frame {width} label="Snag fans: 1, 3, 6; tiny 1 and 4">
      <!-- At the table a fan gets four columns (yours, a duel opponent's), or sits at the end of a rival's name. -->
      <div><div class="fan"><SnagFan cards={snags(1)} /></div></div>
      <div><div class="fan"><SnagFan cards={snags(3)} /></div></div>
      <div><div class="fan"><SnagFan cards={snags(6)} /></div></div>
      <div><div class="fan tiny"><SnagFan tiny cards={snags(1)} /></div><div class="fan tiny"><SnagFan tiny cards={snags(4)} /></div></div>
    </Frame>
  </div>
</main>

<style>
  main {
    padding: 1rem;
    max-width: 1100px;
    margin: 0 auto;
  }
  header {
    position: sticky;
    top: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem 0;
    background: #0c0c0b;
  }
  h1 {
    margin: 0 auto 0 0;
    font-family: var(--title-font);
    font-weight: normal;
  }
  h2 {
    margin: 2rem 0 0.75rem;
  }
  label {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }
  .fan {
    grid-column: span 4;
    display: flex;
    align-items: flex-end;
  }
  .grid {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    align-items: flex-start;
  }
</style>
