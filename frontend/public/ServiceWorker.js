// ServiceWorker.js
// Place at frontend/public/ServiceWorker.js (served from root: /ServiceWorker.js)

// ✅ Install — forces this SW to become active immediately without waiting
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// ✅ Activate — takes control of all open clients/tabs immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// ✅ Push — handles incoming push notifications from your server
self.addEventListener('push', (event) => {
  let payload = { title: 'SkyCast', body: 'Weather update', data: {} };

  if (event.data) {
    try {
      payload = event.data.json();
    } catch (e) {
      payload = { title: 'SkyCast', body: event.data.text(), data: {} };
    }
  }

  const title = payload.title || 'SkyCast';
  const options = {
    body: payload.body || '',
    icon: payload.icon || '/favicon.ico',
    badge: payload.badge || '/favicon.ico',
    data: payload.data || {},
    tag: payload.tag,
    requireInteraction: payload.requireInteraction || false,
    silent: payload.silent || false
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ✅ Notification Click — handles what happens when user clicks the notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // If a tab is already open to the target, focus it
      for (const client of windowClients) {
        try {
          if (
            new URL(client.url).pathname === new URL(target, location.origin).pathname &&
            'focus' in client
          ) {
            return client.focus();
          }
        } catch (e) {
          // ignore URL parse errors
        }
      }
      // Otherwise open a new tab
      if (clients.openWindow) return clients.openWindow(target);
    })
  );
});