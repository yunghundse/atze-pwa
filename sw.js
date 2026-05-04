/* crew. Service Worker v2 — PWA + Push */
const CACHE = 'crew-v3-' + Date.now();
const ASSETS = ['/clean.html', '/manifest.json', '/img/icon-192.png', '/img/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => null)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.hostname.includes('supabase.co') || url.hostname.includes('jsdelivr.net') || url.hostname.includes('unpkg.com')) return;
  if (url.hostname.includes('basemaps.cartocdn.com') || url.hostname.includes('qrserver.com')) return;
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      if (res && res.status === 200 && url.origin === location.origin){
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    }).catch(() => caches.match('/clean.html')))
  );
});

self.addEventListener('push', e => {
  let data = {};
  try { data = e.data.json(); } catch(_) {}
  const title = data.title || 'crew.';
  const opts = {
    body: data.body || '',
    icon: '/img/icon-192.png',
    badge: '/img/favicon-32.png',
    data: data.payload || {},
    tag: data.tag || 'crew',
    requireInteraction: data.urgent || false,
    vibrate: data.urgent ? [200, 100, 200, 100, 200] : [100]
  };
  e.waitUntil(self.registration.showNotification(title, opts));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const link = (e.notification.data && e.notification.data.link_to) || '/clean.html';
  const url = link.startsWith('http') ? link : (location.origin + '/clean.html' + (link.startsWith('?') ? link : ''));
  e.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clientList => {
      for (const c of clientList){
        if (c.url.includes('clean.html')) { c.focus(); return c.navigate(url); }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
