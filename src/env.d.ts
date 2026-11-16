/// <reference types="vite/client" />

/** Where the game's big assets are served from (.env.development, .env.production). */
interface ImportMetaEnv {
  readonly VITE_MAP_ROOT?: string;
  readonly VITE_MUSIC_ROOT?: string;
}
