'use strict';

// Single service worker for the Doorstep PWA.
//   - Satisfies PWA install criteria (has a fetch handler).
//   - Receives web push payloads, surfaces notifications, broadcasts updates
//     to open tabs so they can refetch order data immediately.
//   - On notification click, focuses an existing tab (no new window) and asks
//     it to navigate to the user's orders page. Falls back to opening a fresh
//     tab if none exist.

const DEV =
  self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';
const log = (...args) => {
  if (DEV) console.log('[push-sw]', ...args);
};

self.addEventListener('install', () => {
  log('Installing — calling skipWaiting()');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  log('Activating — calling clients.claim()');
  event.waitUntil(self.clients.claim());
});

// Minimal fetch handler. We don't cache anything: the app is API-driven and
// caching would risk staleness. The handler only exists because Chromium's
// PWA install heuristic requires the SW to have a non-empty fetch listener.
self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return;
  event.respondWith(fetch(event.request));
});

self.addEventListener('push', (event) => {
  if (!event.data) {
    log('Push received with no data — ignoring');
    return;
  }

  let payload;
  try {
    payload = event.data.json();
  } catch (e) {
    try {
      payload = { title: 'Doorstep', body: event.data.text() };
    } catch {
      log('Push payload was neither JSON nor text — aborting');
      return;
    }
  }

  const title = payload.title || 'Doorstep';
  const body = payload.body || '';
  const data = {
    url: payload.url || null,
    ...(payload.data || {}),
  };

  const showPromise = self.registration.showNotification(title, {
    body,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    data,
  });

  const broadcastPromise = self.clients
    .matchAll({ type: 'window', includeUncontrolled: true })
    .then((clients) => {
      const message = {
        type: 'ORDER_UPDATE',
        notification: { title, body, data },
      };
      log('Broadcasting ORDER_UPDATE to', clients.length, 'client(s)');
      clients.forEach((client) => client.postMessage(message));
    })
    .catch((err) => log('Broadcast failed', err));

  event.waitUntil(Promise.all([showPromise, broadcastPromise]));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const explicitUrl = event.notification.data && event.notification.data.url;

  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      if (clients.length > 0) {
        // Tab is already open — focus it and let the React listener navigate
        // in-place via React Router (no full reload, no new window).
        const target = clients.find((c) => c.focused) ?? clients[0];
        try {
          await target.focus();
        } catch (err) {
          log('focus() failed', err);
        }
        target.postMessage({
          type: explicitUrl ? 'NAVIGATE' : 'NAVIGATE_TO_ORDERS',
          url: explicitUrl ?? null,
        });
        return;
      }

      // No tab open — open one. If we have an explicit url, use it directly;
      // otherwise hit '/' with a flag so Login.tsx redirects the user to the
      // role-appropriate orders page after the auth check.
      const fallback = explicitUrl ?? '/?openOrders=1';
      await self.clients.openWindow(fallback);
    })(),
  );
});
