/* Service worker de Mis Finanzas: cachea la app para que abra sin conexión.
   Las llamadas a Google Apps Script van siempre por red (nunca se cachean). */

const CACHE = 'mis-finanzas-v5';
const ASSETS = ['./', './index.html', './manifest.json', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Datos: solo red (la app maneja su propia cola offline).
  if (url.hostname.includes('script.google') || url.hostname.includes('googleusercontent')) return;
  if (e.request.method !== 'GET') return;

  // App: red primero (para recibir actualizaciones), caché si no hay conexión.
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('./index.html')))
  );
});
