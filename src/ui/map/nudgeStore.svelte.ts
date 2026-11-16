/**
 * The nudges in play (see nudges.ts): the file's, kept in the game's code. In a build they never
 * change. In development the nudge overlay (`?nudge`) edits them live, and saves them back to the
 * file through the dev server (vite.config.ts, `nudgeFile`).
 */
import saved from '../../story/map/nudges.json';
import { parseNudges, type Nudge } from './nudges';

export const nudges = $state<{ list: Nudge[] }>({ list: parseNudges(saved) });

if (import.meta.hot) {
  // The overlay's own save comes back as an update to the file: taken in quietly, no reload. An edit
  // made by hand to the file comes in the same way.
  import.meta.hot.accept('../../story/map/nudges.json', (m) => {
    if (m) nudges.list = parseNudges(m.default);
  });
}
