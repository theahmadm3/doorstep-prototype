self.addEventListener("push", function (event) {
	const data = event.data.json();
	const { title, body, ...rest } = data;

	const options = {
		body: body,
		icon: "/icon-192x192.png", // Default icon
		badge: "/badge-72x72.png", // Default badge
		data: rest, // Pass along any other data
	};

	const notificationPromise = self.registration.showNotification(title, options);
	event.waitUntil(notificationPromise);

	// After showing notification, broadcast a message to all clients
	const messagePromise = self.clients
		.matchAll({
			type: "window",
			includeUncontrolled: true,
		})
		.then((clients) => {
			if (clients && clients.length) {
				clients.forEach((client) => {
					client.postMessage({
						type: "ORDER_UPDATE",
						notification: {
							title,
							body,
							data: rest,
						},
					});
				});
			}
		});

	event.waitUntil(Promise.all([notificationPromise, messagePromise]));
});

self.addEventListener("notificationclick", function (event) {
	event.notification.close();

	const urlToOpen = event.notification.data?.url || "/customer/orders";

	event.waitUntil(
		self.clients
			.matchAll({
				type: "window",
				includeUncontrolled: true,
			})
			.then((clients) => {
				// Check if there's already a window open with the target URL
				for (const client of clients) {
					if (client.url.includes(urlToOpen.split("?")[0]) && "focus" in client) {
						return client.focus();
					}
				}
				// If not, open a new window
				if (self.clients.openWindow) {
					return self.clients.openWindow(urlToOpen);
				}
			}),
	);
});
