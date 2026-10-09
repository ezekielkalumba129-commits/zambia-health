const CACHE = 'health-v4';
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c =>
      Promise.all(['/', '/manifest.json', '/icon.svg'].map(u =>
        fetch(u, { cache: 'reload' }).then(r => c.put(u, r))
      ))
    )
  );
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  if (r.mode === 'navigate') {
    e.respondWith(new Promise(res => {
      const t = setTimeout(() => caches.match('/').then(c => c && res(c)), 3000);
      fetch(r).then(n => {
        clearTimeout(t);
        if (n.ok) { const cp = n.clone(); caches.open(CACHE).then(c => c.put('/', cp)); }
        res(n);
      }).catch(() => {
        clearTimeout(t);
        caches.match('/').then(c => res(c || Response.error()));
      });
    }));
    return;
  }
  e.respondWith(caches.match(r).then(c => c || fetch(r)));
});
