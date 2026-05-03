const CACHE = 'crew-v110';
const PRECACHE = [
  './',
  './index.html',
  './app.html',
  './config.js',
  './manifest.json',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

// Network-first strategy: always try fresh content, fall back to cache
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(res => {
      if (res && res.status === 200) {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    }).catch(() => caches.match(e.request))
  );
});

// ============== WEB PUSH HANDLERS ==============
self.addEventListener('push', e => {
  let payload = {};
  try { payload = e.data ? e.data.json() : {}; } catch (_) {
    try { payload = { title: 'crew.', body: e.data ? e.data.text() : '' }; } catch (__) {}
  }
  const title = payload.title || 'crew.';
  const opts = {
    body: payload.body || '',
    icon: payload.icon || '/icons/icon-192.png',
    badge: payload.badge || '/icons/icon-192.png',
    tag: payload.tag || 'crew-default',
    requireInteraction: !!payload.requireInteraction,
    renotify: payload.renotify !== false,
    vibrate: payload.tag && payload.tag.indexOf('sos') === 0 ? [200,100,200,100,200] : [80,40,80],
    data: payload.data || {}
  };
  e.waitUntil(self.registration.showNotification(title, opts));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const data = e.notification.data || {};
  const url = data.url || '/app.html';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      for (const c of clients) {
        try {
          const u = new URL(c.url);
          if (u.pathname.endsWith('/app.html') || u.pathname === '/' || u.pathname.endsWith('/index.html')) {
            c.focus();
            try { c.postMessage({ type: 'push:click', url: url, data: data }); } catch(_){}
            return;
          }
        } catch(_){}
      }
      return self.clients.openWindow(url);
    })
  );
});

// Subscription-Change-Handler: bei Token-Erneuerung re-registrieren
self.addEventListener('pushsubscriptionchange', e => {
  e.waitUntil(self.clients.matchAll().then(clients => {
    clients.forEach(c => { try { c.postMessage({ type: 'push:resubscribe' }); } catch(_){} });
  }));
});
