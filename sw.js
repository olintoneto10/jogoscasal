const CACHE = 'jd-v7';
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
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fresh = fetch(e.request).then(res => {
        if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
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
