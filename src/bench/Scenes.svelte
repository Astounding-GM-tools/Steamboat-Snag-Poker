<script lang="ts">
  import SandbarScene from '../ui/scenes/SandbarScene.svelte';
  import { MOODS, type Mood } from '../ui/portrait/faces';

  /**
   * The scenes (development only): each picture with its score to play with.
   * Win and lose a pot, and watch it keep count.
   */
  const START = 20;
  let pile = $state(START);
  let mood = $state<Mood>('neutral');
  let snags = $state([14, 15, 16]);
  let width = $state(300);
  const toggle = (i: number) => (snags = snags.includes(i) ? snags.filter((s) => s !== i) : [...snags, i]);
</script>

<main>
  <h1>Scenes</h1>
  <h2>The Sandbar</h2>
  <div class="controls">
    <button onclick={() => (pile = Math.max(0, pile - 4))}>Win a pot</button>
    <button onclick={() => (pile += 3)}>Lose a pot</button>
    <button class="ghost" onclick={() => (pile = START)}>Again</button>
    <span>Pile {pile} / {START}</span>
    {#each MOODS as m}<button class:ghost={mood !== m} onclick={() => (mood = m)}>{m}</button>{/each}
    {#each [[14, 'Broken Pole'], [15, 'Twisted Axle'], [16, 'Broken Paddle']] as [i, name]}
      <button class:ghost={!snags.includes(i as number)} onclick={() => toggle(i as number)}>{name}</button>
    {/each}
    <label>Width <input type="range" min="200" max="480" bind:value={width} /> {width}px</label>
  </div>
  <div style="width: {width}px"><SandbarScene {pile} start={START} {mood} {snags} /></div>
</main>

<style>
  main {
    max-width: 900px;
    margin: 0 auto;
    padding: 1rem;
  }
  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem 0.8rem;
    align-items: center;
    margin: 0.5rem 0 1rem;
  }
</style>
