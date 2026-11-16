import { describe, expect, it } from 'vitest';
import { OKEH_1924, PLACES, musicAt } from './playlist';

describe('the soundtrack', () => {
  // Until 1 January 2027 only the 1924-25 OKeh sides may be named anywhere (docs/story.md, the soundtrack).
  const FREE = ['tulsablues.mp3', 'vinestreet.mp3', 'babydear.mp3', 'asilikeit.mp3'];

  it('names only the OKeh sides', () => {
    for (const track of [...Object.values(OKEH_1924), ...Object.values(PLACES).flat()]) expect(FREE).toContain(track.file);
  });

  it('plays at The Sandbar and the Bettendorf saloon, and nowhere else', () => {
    expect(musicAt('sandbar')?.[0].title).toBe('Tulsa Blues');
    expect(musicAt('triCities')?.[0].title).toBe('Vine Street Blues');
    expect(musicAt('harbourTalk')).toBeNull();
    expect(musicAt(null)).toBeNull();
  });
});
