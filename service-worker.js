// service-worker.js - source for workbox injectManifest (used by next-pwa)
import { precacheAndRoute } from "workbox-precaching";

precacheAndRoute(self.__WB_MANIFEST || []);

self.addEventListener("push", function (event) {
  console.log("[Service Worker] Push Received.");

  let pushTitle = "New Notification";
  let pushBody = "Something new happened!";

  if (event.data) {
    try {
      const data = event.data.json();
      console.log("[Service Worker] Push data is JSON:", data);
      if (data.title) pushTitle = data.title;
      if (data.body) pushBody = data.body;
    } catch (e) {
      console.error("[Service Worker] Push event data was not valid JSON", e);
      const textData = event.data.text();
      console.log("[Service Worker] Falling back to text():", textData);
      pushTitle = "Notification";
      pushBody = textData;
    }
  }

  const options = {
    body: pushBody,
    icon: "/icons/icon-192.png",
    badge: "/icons/badge-96.png",
    data: { receivedAt: Date.now() },
  };

  const notificationPromise = self.registration.showNotification(pushTitle, options);
  event.waitUntil(notificationPromise);
});

self.addEventListener("notificationclick", function (event) {
  console.log("[Service Worker] Notification click Received.");
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: "window" }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === "/" && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow("/");
      }
    })
  );
});
