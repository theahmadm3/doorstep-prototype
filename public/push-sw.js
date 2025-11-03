self.addEventListener("push", function (event) {
    console.log("[Service Worker] Push Received.");

    // Default data if payload is empty
    let pushTitle = "New Notification";
    let pushBody = "Something new happened!";

    // Try to parse the data from the push event
    if (event.data) {
        try {
            // Try to parse as JSON
            const data = event.data.json();
            console.log("[Service Worker] Push data is JSON:", data);
            pushTitle = data.title;
            pushBody = data.body;
        } catch (e) {
            // This is the error you are seeing
            console.error("[Service Worker] Push event data was not valid JSON", e);

            // Fallback to plain text
            const textData = event.data.text();
            console.log("[Service Worker] Falling back to text():", textData);
            pushTitle = "Notification"; // Use a default title
            pushBody = textData; // Use the raw text as the body
        }
    }

    const options = {
        body: pushBody,
        icon: "https://placehold.co/192x192/blue/white?text=Icon", // Optional icon
        badge: "https://placehold.co/96x96/blue/white?text=Badge", // Optional badge
    };

    console.log(
        `[Service Worker] Showing notification with title: "${pushTitle}" and body: "${pushBody}"`
    );

    // This shows the notification
    const notificationPromise = self.registration.showNotification(
        pushTitle,
        options
    );

    event.waitUntil(notificationPromise);
});

/**
 * Optional: Handle notification click
 */
self.addEventListener("notificationclick", function (event) {
    console.log("[Service Worker] Notification click Received.");
    event.notification.close();

    // This focuses an existing window or opens a new one
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