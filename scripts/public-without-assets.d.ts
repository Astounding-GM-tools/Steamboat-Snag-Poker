import type { Plugin } from 'vite';

/** public/ into dist, but for the named folders (the chart's tiles, the records): those come from the bucket. */
export function publicWithoutAssets(keptOut: string[]): Plugin;
