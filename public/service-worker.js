self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  self.clients.claim();
});

self.addEventListener('push', event => {
  const data = event.data.json();
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: data.icon
  });
});
