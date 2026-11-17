/// <reference path="./vite-node.d.ts" />
import { writeFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { formatNudges, parseNudges } from './src/ui/map/nudges';
import { publicWithoutAssets } from './scripts/public-without-assets.js';

/**
 * Development only: the nudge overlay (`?nudge`) saves the course's nudges back into the repo, by a
 * POST of the whole list to `/__nudges`. Only well-formed nudges are written; the file is then
 * there to commit. Not in a build: `apply: 'serve'`.
 */
function nudgeFile(): Plugin {
  return {
    name: 'nudge-file',
    apply: 'serve',
    configureServer(server) {
      const file = `${server.config.root}/src/story/map/nudges.json`;
      server.middlewares.use('/__nudges', (incoming, res) => {
        const req = incoming as unknown as DevRequest;
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end();
          return;
        }
        let body = '';
        req.setEncoding('utf8');
        req.on('data', (chunk: string) => {
          body += chunk;
          if (body.length > 1_000_000) req.destroy();
        });
        req.on('end', () => {
          try {
            const data: unknown = JSON.parse(body);
            if (!Array.isArray(data)) throw new Error('not a list of nudges');
            const nudges = parseNudges(data);
            writeFileSync(file, formatNudges(nudges));
            res.setHeader('content-type', 'application/json');
            res.end(JSON.stringify({ saved: nudges.length }));
          } catch (e) {
            res.statusCode = 400;
            res.end(String(e));
          }
        });
      });
    },
  };
}

export default defineConfig({
  // The chart's tiles and the band's records stay out of the build: it fetches them from the bucket (.env.production).
  plugins: [svelte(), nudgeFile(), publicWithoutAssets(['maptiles', 'music'])],
  test: {
    include: ['src/**/*.test.ts'],
    testTimeout: 60_000,
  },
});
