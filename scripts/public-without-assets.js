// @ts-check
/**
 * The chart's tiles and the band's records live in public/ for development only (untracked, and
 * big: 1.3 GB of tiles, and records not free to ship yet). A build serves them from the bucket
 * (VITE_MAP_ROOT, VITE_MUSIC_ROOT in .env.production), so public/ is copied into dist without them:
 * Vite's own copy is turned off for the build, and this one leaves the named folders behind.
 * (Plain JavaScript, for Node's fs without Node's types; public-without-assets.d.ts says its shape.)
 */
import { cpSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

/** @param {string[]} keptOut folders of public/ that never go into dist */
export function publicWithoutAssets(keptOut) {
  let root = process.cwd();
  let outDir = 'dist';
  return {
    name: 'public-without-assets',
    apply: /** @type {const} */ ('build'),
    config: () => ({ build: { copyPublicDir: false } }),
    /** @param {{ root: string, build: { outDir: string } }} config */
    configResolved(config) {
      root = config.root;
      outDir = resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const from = resolve(root, 'public');
      if (!existsSync(from)) return;
      const skip = new Set(keptOut.map((d) => resolve(from, d)));
      cpSync(from, outDir, { recursive: true, filter: (src) => !skip.has(resolve(src)) && !src.endsWith('.DS_Store') });
    },
  };
}
