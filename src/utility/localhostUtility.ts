
/**
 * ローカルホストか
 */
export const isLocalhost = (): boolean => {
  return window.location.hostname === "localhost" || window.location.hostname === '127.0.0.1';
}