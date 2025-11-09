// Push notification service worker
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      // Malformed JSON, fallback to empty object
      data = {};
    }
  }
  const title = data.title || 'Doorstep Notification';
  const options = {
    body: data.body || 'You have a new notification',
    icon: data.icon || '/eren.png',
    badge: '/eren.png',
    data: data.data || {},
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});
