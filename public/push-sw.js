// /public/push-sw.js

console.log('[push-sw.js] Service worker script loaded!');

self.addEventListener('install', (e) => {
  console.log('[push-sw.js] Service worker installing...');
  self.skipWaiting(); // Force the waiting service worker to become the active service worker
});

self.addEventListener('activate', (e) => {
  console.log('[push-sw.js] Service worker activated!');
  e.waitUntil(self.clients.claim()); // Become the service worker for all open tabs
});


self.addEventListener("push", (event) => {
	console.log("[SW] Push notification received!", event.data?.text());
	if (!event.data) {
		console.error("[SW] Push event but no data");
		return;
	}

	const data = event.data.json();
	const title = data.title || "Doorstep";
	const options = {
		body: data.body,
		icon: "/icon-192x192.png",
		badge: "/badge-72x72.png",
		data: {
			url: data.url || "/",
		},
	};

	const notificationPromise = self.registration.showNotification(
		title,
		options,
	);

	const clientsPromise = self.clients
		.matchAll({
			type: "window",
			includeUncontrolled: true,
		})
		.then((clients) => {
			console.log("[SW] Found clients:", clients.length);

			if (clients.length === 0) {
				console.log("[SW] No clients found to send message to");
				return;
			}

			const message = {
				type: "ORDER_UPDATE",
				notification: {
					title: title,
					body: options.body,
					data: data,
				},
			};

			console.log("[SW] Sending message:", message);

			clients.forEach((client, index) => {
				console.log(`[SW] Sending to client ${index}:`, client.url);
				client.postMessage(message);
			});
		})
		.catch((err) => {
			console.error("[SW] Error sending messages to clients:", err);
		});

	event.waitUntil(Promise.all([notificationPromise, clientsPromise]));
});

self.addEventListener("notificationclick", (event) => {
	console.log("[SW] Notification clicked");
	event.notification.close();
	const urlToOpen =
		event.notification.data.url || new URL("/", self.location.origin).href;

	const promiseChain = self.clients
		.matchAll({
			type: "window",
			includeUncontrolled: true,
		})
		.then((windowClients) => {
			let matchingClient = null;

			for (let i = 0; i < windowClients.length; i++) {
				const client = windowClients[i];
				if (client.url === urlToOpen) {
					matchingClient = client;
					break;
				}
			}

			if (matchingClient) {
				return matchingClient.focus();
			} else {
				return self.clients.openWindow(urlToOpen);
			}
		});

	event.waitUntil(promiseChain);
});
