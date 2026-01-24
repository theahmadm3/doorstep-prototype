'use strict';

console.log('[push-sw.js] Service worker loaded!');
self.addEventListener('install', (e) => console.log('[push-sw.js] Installing...'));
self.addEventListener('activate', (e) => {
  console.log('[push-sw.js] Activated!');
  // This ensures the new service worker takes control immediately.
  e.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
    if (!event.data) {
        console.warn('[SW] Push event received without data');
        return;
    }
    
    console.log('[SW] Push notification received:', event.data.text());

    let data;
    try {
        data = event.data.json();
    } catch (e) {
        console.error('[SW] Failed to parse push data. Payload:', event.data.text(), e);
        return;
    }

    const title = data.title || 'Doorstep';
    const options = {
        body: data.body,
        icon: '/doorstep-logo.png',
        badge: '/eren.png',
        data: {
            url: data.url || '/',
        },
    };

    const notificationPromise = self.registration.showNotification(title, options);
    
    const clientsPromise = self.clients.matchAll({ 
      type: 'window',
      includeUncontrolled: true 
    }).then(clients => {
      console.log('[SW] Found clients:', clients.length);
      
      if (clients.length === 0) {
        console.log('[SW] No clients to notify');
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
      
      console.log('[SW] Broadcasting message:', message);
      
      // iOS needs explicit message sending to each client
      return Promise.all(
        clients.map(client => {
          console.log('[SW] Sending to client:', client.url);
          return client.postMessage(message);
        })
      );
    }).catch(err => {
      console.error('[SW] Error sending messages:', err);
    });

    event.waitUntil(Promise.all([notificationPromise, clientsPromise]));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const urlToOpen = event.notification.data.url || '/';
    event.waitUntil(
        self.clients.matchAll({
            type: 'window',
            includeUncontrolled: true,
        }).then((clientList) => {
            if (clientList.length > 0) {
                let client = clientList[0];
                for (let i = 0; i < clientList.length; i++) {
                    if (clientList[i].focused) {
                        client = clientList[i];
                    }
                }
                return client.focus().then(c => c.navigate(urlToOpen));
            }
            return self.clients.openWindow(urlToOpen);
        }),
    );
});
