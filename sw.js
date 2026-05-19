const CACHE_NAME = 'questlist-v11';
const STATIC_ASSETS = [
  '/todo-gamification/',
  '/todo-gamification/index.html',
  '/todo-gamification/style.css',
  '/todo-gamification/app.js',
  '/todo-gamification/firebase-config.js',
  '/todo-gamification/manifest.json',
  '/todo-gamification/icon-192.png',
  '/todo-gamification/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (!e.request.url.startsWith('http')) return;
  if (e.request.method !== 'GET') return;

  const isFirebase = e.request.url.includes('firestore.googleapis.com') ||
                     e.request.url.includes('firebase');

  if (isFirebase) {
    // Network first — prova rete, fallback cache
    e.respondWith(
      fetch(e.request)
        .then(response => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(c => {
              try { c.put(e.request, clone); } catch (_) {}
            });
          }
          return response;
        })
        .catch(() => caches.match(e.request).then(cached => cached || Response.error()))
    );
  } else {
    // Cache first — prova cache, fallback rete
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request))
    );
  }
});
