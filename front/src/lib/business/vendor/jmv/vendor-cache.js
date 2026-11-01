import { VENDOR_CACHE_WORKER } from './runtime-config.js';

export async function prepareVendorCache() {
  if (!VENDOR_CACHE_WORKER || !globalThis.navigator?.serviceWorker) return;
  try {
    // Bound registration AND first-visit claim, including unavailable storage or
    // a stalled worker script download. Java retains its network fallback.
    await new Promise(resolve => {
      const finish = () => {
        clearTimeout(timer);
        navigator.serviceWorker.removeEventListener('controllerchange', finish);
        resolve();
      };
      const timer = setTimeout(finish, 4000);
      navigator.serviceWorker.addEventListener('controllerchange', finish);
      navigator.serviceWorker.register(VENDOR_CACHE_WORKER, { type: 'module', scope: '/web/', updateViaCache: 'none' })
        .then(() => { if (navigator.serviceWorker.controller) finish(); }).catch(finish);
    });
  } catch { /* Storage or worker unavailable: retain exact network Range requests. */ }
}
