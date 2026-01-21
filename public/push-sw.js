console.log('[push-sw.js] Service worker loaded!');

self.addEventListener('install', (e) => {
  console.log('[push-sw.js] Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  console.log('[push-sw.js] Activated!');
  e.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  console.log("[SW] Push notification received", event.data.text());

  let data;
  try {
    data = event.data.json();
  } catch (e) {
    console.error("[SW] Failed to parse push data", e);
    data = {
      title: "Doorstep",
      body: "You have a new notification",
      url: "/",
    };
  }

  const { title, body, url } = data;
  const options = {
    body: body,
    icon: "/icon-192x192.png", // Make sure this icon exists
    badge: "/badge-72x72.png", // And this one
    data: {
      url: url,
    },
  };

  const notificationPromise = self.registration.showNotification(title, options);

  const clientsPromise = self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then(clients => {
    console.log('[SW] Found clients:', clients.length);

    if (clients.length === 0) {
      console.log('[SW] No clients found to send message to');
      return;
    }

    const message = {
      type: 'ORDER_UPDATE',
      notification: {
        title: title,
        body: options.body,
        data: data
      }
    };

    console.log('[SW] Sending message:', message);

    clients.forEach((client, index) => {
      console.log(`[SW] Sending to client ${index}:`, client.url);
      client.postMessage(message);
    });
  }).catch(err => {
    console.error('[SW] Error sending messages to clients:', err);
  });

  event.waitUntil(Promise.all([notificationPromise, clientsPromise]));
});

self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked");

  event.notification.close();

  const urlToOpen = event.notification.data.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((clients) => {
        // Check if there's already a window open with the same URL.
        for (const client of clients) {
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus();
          }
        }
        // If not, open a new window.
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      }),
  );
});
