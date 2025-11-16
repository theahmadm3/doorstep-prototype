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

// // Push notification service worker
// self.addEventListener('push', (event) => {
//   let data = {};
//   if (event.data) {
//     try {
//       data = event.data.json();
//     } catch (e) {
//       // Malformed JSON, fallback to empty object
//       data = {};
//     }
//   }
//   const title = data.title || 'Doorstep Notification';
//   const options = {
//     body: data.body || 'You have a new notification',
//     icon: data.icon || '/eren.png',
//     badge: '/eren.png',
//     data: data.data || {},
//   };

//   event.waitUntil(
//     self.registration.showNotification(title, options)
//   );
// });

// self.addEventListener('notificationclick', (event) => {
//   event.notification.close();

//   // Get user type and construct appropriate order page URL
//   const userType = event.notification.data.userType || 'customer'; // customer, rider, or vendor
//   const orderId = event.notification.data.orderId || '';

//   let urlToOpen = '/';

//   // Route to different order pages based on user type
//   if (userType === 'rider') {
//     urlToOpen = `/rider/orders/`;
//   } else if (userType === 'vendor') {
//     urlToOpen = `/vendor/orders/`;
//   } else if (userType === 'customer') {
//     urlToOpen = `/customer/orders/`;
//   }

//   // If a custom URL is provided, use it instead
//   if (event.notification.data.url) {
//     urlToOpen = event.notification.data.url;
//   }

//   event.waitUntil(
//     clients.matchAll({ type: 'window' })
//       .then((windowClients) => {
//         // If any window is open, focus it and navigate
//         if (windowClients.length > 0) {
//           return windowClients[0].focus().then(() => windowClients[0].navigate(urlToOpen));
//         }
//         // Otherwise open a new window
//         return clients.openWindow(urlToOpen);
//       })
//   );
// });
