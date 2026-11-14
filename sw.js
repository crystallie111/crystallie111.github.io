/* Service worker for the locked portfolio.
   Once a visitor has unlocked the site, the decryption key (a non-extractable
   CryptoKey) is in IndexedDB. This worker answers page, script, image and PDF
   requests by fetching the matching encrypted blob and decrypting it in the
   browser. Without a valid key it does nothing, and the lock page is served. */
const DB = 'yro-gate', STORE = 'session';
const PASS_THROUGH = /^(sw\.js|m\.bin|robots\.txt|d\/)/;
let state = null;   // { key, manifest, exp }

function record() {
  return new Promise((resolve) => {
    const open = indexedDB.open(DB, 1);
    open.onupgradeneeded = () => open.result.createObjectStore(STORE);
    open.onerror = () => resolve(null);
    open.onsuccess = () => {
      const get = open.result.transaction(STORE).objectStore(STORE).get('current');
      get.onsuccess = () => resolve(get.result || null);
      get.onerror = () => resolve(null);
    };
  });
}
async function unseal(key, url) {
  const response = await fetch(url, { cache: 'no-cache' });
  if (!response.ok) throw new Error('missing');
  const data = await response.arrayBuffer();
  return crypto.subtle.decrypt({ name: 'AES-GCM', iv: data.slice(0, 12) }, key, data.slice(12));
}
async function session() {
  if (state && state.exp > Date.now()) return state;
  state = null;
  const saved = await record();
  if (!saved || saved.exp <= Date.now()) return null;
  try {
    const manifest = JSON.parse(new TextDecoder().decode(await unseal(saved.key, new URL('m.bin', self.registration.scope))));
    state = { key: saved.key, manifest, exp: saved.exp };
  } catch { state = null; }   // wrong or outdated key (the code was changed): stay locked
  return state;
}

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('message', (event) => { if (event.data === 'reset') state = null; });

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const scope = new URL(self.registration.scope);
  if (event.request.method !== 'GET' || url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;
  let path = decodeURIComponent(url.pathname.slice(scope.pathname.length));
  if (path === '' || path.endsWith('/')) path += 'index.html';
  if (PASS_THROUGH.test(path)) return;
  event.respondWith((async () => {
    const live = await session();
    const entry = live && live.manifest[path];
    if (!entry) return fetch(event.request);   // locked, or not part of the site: the lock page / 404 answers
    try {
      const body = await unseal(live.key, new URL('d/' + entry.f, scope));
      return new Response(body, { headers: { 'Content-Type': entry.t, 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
    } catch {
      return new Response('This file could not be opened. Reload the page and enter the access code again.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }
  })());
});
