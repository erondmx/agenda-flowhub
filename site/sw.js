// Service worker do Calendário (celular). Gerado por build_mobile.py — não editar sw.js direto.
const VERSION = 'b979cd0451';
const CACHE = 'mcal-' + VERSION;
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k.startsWith('mcal-') && k !== CACHE).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', e => {
    const req = e.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);
    if (url.origin === location.origin) {
        // arquivos do app: rede primeiro (pega versão nova), cai pro cache quando offline
        e.respondWith(
            fetch(req)
                .then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; })
                .catch(() => caches.match(req).then(r => r || caches.match('index.html')))
        );
    } else if (url.hostname === 'www.gstatic.com') {
        // SDK do Firebase: cache primeiro (abre offline), atualiza em segundo plano
        e.respondWith(caches.open(CACHE).then(async c => {
            const hit = await c.match(req);
            const net = fetch(req).then(res => { if (res.ok) c.put(req, res.clone()); return res; }).catch(() => hit);
            return hit || net;
        }));
    }
    // demais origens (Firebase Realtime Database etc.): passa direto, sem interceptar
});
