importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: 'AIzaSyDuSMNqqsmjGbJy-etiFSSekxDBVoohACM',
  authDomain: 'wayland-square-connect.firebaseapp.com',
  projectId: 'wayland-square-connect',
  storageBucket: 'wayland-square-connect.firebasestorage.app',
  messagingSenderId: '75469249866',
  appId: '1:75469249866:web:506e449c39248ecbab75b3'
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

async function applyAppBadge(count) {
  const safe = Math.max(0, Number(count) || 0);
  try {
    if (self.registration && 'setAppBadge' in self.registration) {
      if (safe > 0) await self.registration.setAppBadge(safe);
      else if ('clearAppBadge' in self.registration) await self.registration.clearAppBadge();
      return;
    }
  } catch (err) {
    console.warn('Service worker registration badge sync failed', err);
  }
  try {
    if (self.navigator && 'setAppBadge' in self.navigator) {
      if (safe > 0) await self.navigator.setAppBadge(safe);
      else if ('clearAppBadge' in self.navigator) await self.navigator.clearAppBadge();
    }
  } catch (err) {
    console.warn('Service worker navigator badge sync failed', err);
  }
}

async function syncBadgeFromPayload(payload) {
  const raw = payload && payload.data ? payload.data.badgeCount : 0;
  await applyAppBadge(raw);
}

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'WSC_SYNC_BADGE') {
    event.waitUntil(applyAppBadge(event.data.count));
  }
});

messaging.onBackgroundMessage((payload) => {
  syncBadgeFromPayload(payload);
  const data = payload.data || {};
  if (data.showBanner === 'false') return;
  const title = (payload.notification && payload.notification.title) || data.title || 'Wayland Square Connect';
  const options = {
    body: (payload.notification && payload.notification.body) || data.body || 'New update in Wayland Square Connect.',
    icon: 'icon-512.png',
    badge: 'apple-touch-icon.png',
    silent: data.playSound === 'false',
    data
  };
  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification && event.notification.data ? event.notification.data.target : '';
  const url = target ? './#' + target : './';
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
    for (const client of clientList) {
      if ('focus' in client) {
        if (target && 'navigate' in client) return client.navigate(url).then(() => client.focus());
        return client.focus();
      }
    }
    if (clients.openWindow) return clients.openWindow(url);
  }));
});
