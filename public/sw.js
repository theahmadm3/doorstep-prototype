// This is a basic service worker.
// It will be registered by the PWA hook but doesn't have complex caching logic yet.

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  // The service worker is installed.
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  // The service worker is activated.
});

self.addEventListener('fetch', (event) => {
  // This service worker doesn't intercept fetch requests for now.
  // It's here to satisfy the basic PWA installability requirements.
});
