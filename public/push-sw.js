self.addEventListener("push", (event) => {
	const data = event.data.json();
	const title = data.title || "Doorstep";
	const options = {
		body: data.body || "You have a new update.",
		icon: "/icon-192x192.png",
		badge: "/badge-72x72.png",
		data: {
			url: data.url || "/",
		},
	};

	const notificationPromise = self.registration.showNotification(title, options);

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
	event.notification.close();
	const urlToOpen =
		event.notification.data.url || new URL("/", self.location.origin).href;

	event.waitUntil(
		self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(
			(windowClients) => {
				let client = windowClients.find((c) => c.url === urlToOpen);
				if (client) {
					return client.focus();
				} else if (self.clients.openWindow) {
					return self.clients.openWindow(urlToOpen);
				}
			},
		),
	);
});
