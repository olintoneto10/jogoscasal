const CACHE = 'jd-v52';
const ASSETS = ['./', './index.html', './manifest.json',
  'https://fonts.googleapis.com/css2?family=Cormorant+SC:wght@400;600;700&family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&family=Jost:wght@300;400;500&display=swap'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(()=>{}));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const req = e.request;
  // App shell (HTML/navegação): network-first — sempre busca a versão mais
  // recente quando online, garantindo que correções cheguem ao usuário.
  // Cai para o cache só quando offline.
  const isShell = req.mode === 'navigate' || req.destination === 'document' ||
                  req.url.endsWith('/') || req.url.endsWith('index.html');
  if (isShell) {
    e.respondWith(
      fetch(req).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      }).catch(() => caches.match(req).then(c => c || caches.match('./index.html')))
    );
    return;
  }
  // Demais assets (fontes, ícones): cache-first com atualização em segundo plano.
  e.respondWith(
    caches.match(req).then(cached => {
      const fresh = fetch(req).then(res => {
        if (res.ok) caches.open(CACHE).then(c => c.put(req, res.clone()));
        return res;
      }).catch(() => cached);
      return cached || fresh;
    })
  );
});
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {title:'Jogos do Desejo 💞', body:'Sua missão da semana está esperando!'};
  e.waitUntil(self.registration.showNotification(data.title, {
    body: data.body, icon: '/jogoscasal/icon-192.png', badge: '/jogoscasal/icon-192.png',
    tag: 'jd-reminder', renotify: true,
    data: { url: '/jogoscasal/' }
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data?.url || '/jogoscasal/'));
});