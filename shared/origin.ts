/**
 * SSR sırasında mevcut isteğin origin'ini tutar.
 * Sunucuda entry-server setRequestOrigin(origin) çağırır;
 * client'ta getRequestOrigin() undefined döner, AppHead window.__ORIGIN__ kullanır.
 * Böylece sunucu ve client ilk çizimde aynı canonical/og değerlerini üretir (hydration uyumu).
 */
let _requestOrigin: string | undefined;

export function setRequestOrigin(origin: string): void {
  _requestOrigin = origin;
}

export function getRequestOrigin(): string | undefined {
  return _requestOrigin;
}
