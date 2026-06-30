// Kill-switch service worker.
//
// Earlier builds of this app shipped a `vite-plugin-pwa` generated `sw.js`
// alongside our hand-rolled `push-sw.js`. Two service workers sharing the
// same scope is a bug — they race for control and break push delivery. We
// removed the plugin and now ship only `push-sw.js`.
//
// This file exists solely to unregister any leftover `sw.js` installation
// from a user's browser. The browser update check downloads this byte-diff,
// activates it, the SW unregisters itself, and the only remaining worker
// on the next page load is `push-sw.js`.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', async (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach((c) => c.navigate(c.url));
    })(),
  );
});
