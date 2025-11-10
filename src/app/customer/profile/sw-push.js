// Push notification handlers
console.log('Push notification handlers loaded');

// Push notification handler
self.addEventListener('push', (event) => {
    console.log('Push notification received:', event);

    let data = {};
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            console.error('Failed to parse push data:', e);
            data = {};
        }
    }

    const title = data.title || 'Doorstep Notification';
    const options = {
        body: data.body || 'You have a new notification',
        icon: data.icon || '/eren.png',
        badge: '/eren.png',
        data: data.data || {},
        tag: data.tag || 'doorstep-notification',
        requireInteraction: false,
        vibrate: [200, 100, 200],
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
            .catch(err => console.error('Failed to show notification:', err))
    );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked:', event);
    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                for (const client of clientList) {
                    if (client.url.includes(new URL(urlToOpen, self.location.origin).pathname) && 'focus' in client) {
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
            .catch(err => console.error('Failed to handle notification click:', err))
    );
});

// Handle notification close event
self.addEventListener('notificationclose', (event) => {
    console.log('Notification closed:', event);
});