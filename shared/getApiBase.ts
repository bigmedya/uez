/**
 * SSR sırasında sunucu tarafında fetch için base URL.
 * entry-server render öncesi globalThis.__API_ORIGIN__ atanır.
 * İstemcide her zaman '' döner (relative URL kullanılır).
 */
declare global {
  // eslint-disable-next-line no-var
  var __API_ORIGIN__: string | undefined;
}

export function getApiBase(): string {
  if (typeof globalThis !== "undefined" && (globalThis as typeof globalThis & { __API_ORIGIN__?: string }).__API_ORIGIN__) {
    return (globalThis as typeof globalThis & { __API_ORIGIN__: string }).__API_ORIGIN__;
  }
  return "";
}
