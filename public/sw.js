/*
 * Service worker: makes the site installable and usable offline.
 *  - App files (HTML/CSS/JS/icons): network first, so updates show up right away;
 *    the cached copy is used when offline.
 *  - Data (/api/*): network first; the last saved response is used when offline.
 *  - Team crests (other sites): cache first, they rarely change.
 * Bump VERSION when the list of app files changes.
 */
const VERSION = 'v1';
const SHELL_CACHE = 'shell-' + VERSION;
const DATA_CACHE = 'data-' + VERSION;
const IMG_CACHE = 'img-' + VERSION;
const MAX_IMAGES = 300;

const SHELL = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/styles.css',
  'js/football-data.js',
  'js/espn-data.js',
  'js/data.js',
  'js/app.js',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/favicon-32.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  const keep = [SHELL_CACHE, DATA_CACHE, IMG_CACHE];
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => !keep.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request, cacheName, fallbackUrl) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(request);
    if (res.ok) cache.put(request, res.clone()).then(() => cacheName === DATA_CACHE && trimCache(DATA_CACHE, 200));
    return res;
  } catch (e) {
    const hit = await cache.match(request, { ignoreSearch: false });
    if (hit) return hit;
    if (fallbackUrl) {
      const fb = await cache.match(fallbackUrl);
      if (fb) return fb;
    }
    throw e;
  }
}

async function trimCache(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

async function cacheFirstImage(request) {
  const cache = await caches.open(IMG_CACHE);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok || res.type === 'opaque') {
    cache.put(request, res.clone()).then(() => trimCache(IMG_CACHE, MAX_IMAGES));
  }
  return res;
}

const offlineJson = () => new Response(
  JSON.stringify({ message: "You're offline and this data hasn't been saved on this device yet." }),
  { status: 503, headers: { 'Content-Type': 'application/json' } }
);

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    if (url.pathname.startsWith('/api/')) {
      event.respondWith(networkFirst(request, DATA_CACHE).catch(offlineJson));
    } else if (request.mode === 'navigate') {
      event.respondWith(networkFirst(request, SHELL_CACHE, 'index.html'));
    } else {
      event.respondWith(networkFirst(request, SHELL_CACHE));
    }
    return;
  }

  if (request.destination === 'image') {
    event.respondWith(cacheFirstImage(request).catch(() => Response.error()));
  }
});
