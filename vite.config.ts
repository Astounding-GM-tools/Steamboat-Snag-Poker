import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { publicWithoutAssets } from './scripts/public-without-assets.js';

export default defineConfig({
  // The chart's tiles and the band's records stay out of the build: it fetches them from the bucket (.env.production).
  plugins: [svelte(), publicWithoutAssets(['maptiles', 'music'])],
  test: {
    include: ['src/**/*.test.ts'],
    testTimeout: 60_000,
  },
});
