/**
 * The little of Node that vite.config.ts uses (the nudge file's endpoint), declared here rather
 * than pulling in all of @types/node for one write.
 */
declare module 'node:fs' {
  export function writeFileSync(path: string, data: string): void;
}

/** A request as the dev server's middleware gets it: a stream of the body. */
interface DevRequest {
  method?: string;
  setEncoding(encoding: 'utf8'): void;
  on(event: 'data', listener: (chunk: string) => void): void;
  on(event: 'end', listener: () => void): void;
  destroy(): void;
}
