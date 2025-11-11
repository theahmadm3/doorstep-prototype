// Push notification service worker
self.addEventListener("push", function (event) {
    console.log("[Service Worker] Push Received.");

    // Default data if payload is empty
    let pushTitle = "Doorstep Notification";
    let pushBody = "You have a new notification";

    // Try to parse the data from the push event
    if (event.data) {
        try {
            // Try to parse as JSON
            const data = event.data.json();
            console.log("[Service Worker] Push data is JSON:", data);
            pushTitle = data.title || pushTitle;
            pushBody = data.body || pushBody;
        } catch (e) {
            // If JSON parsing fails, try plain text
            console.error("[Service Worker] Push event data was not valid JSON", e);
            try {
                const textData = event.data.text();
                console.log("[Service Worker] Falling back to text():", textData);
                pushBody = textData; // Use the raw text as the body
            } catch (textError) {
                console.error("[Service Worker] Could not parse as text either", textError);
            }
        }
    }

    const options = {
        body: pushBody,
        icon: "/eren.png",
        badge: "/eren.png",
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
 * Handle notification click
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
