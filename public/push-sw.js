// Push notification service worker
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
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
