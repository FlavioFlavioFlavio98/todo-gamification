const CACHE = 'questlist-v1';
const ASSETS = [
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
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (!e.request.url.startsWith('http')) return;
  if (e.request.url.includes('firestore.googleapis.com') ||
      e.request.url.includes('firebase')) return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
