// 홈스테드 청소 일정 — 오프라인/빠른 실행용 서비스워커
const VER = 'hs-v2.5';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VER).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VER).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;                                   // 데이터 요청(POST)은 건드리지 않음
  const url = new URL(req.url);
  if (url.hostname.includes('script.google')) return;
  // 화면(HTML): 캐시 먼저 띄우고 뒤에서 최신으로 갱신
  if (req.mode === 'navigate' || url.pathname.endsWith('.html')) {
    e.respondWith(caches.open(VER).then(async c => {
      const hit = await c.match('./index.html');
      const net = fetch(req).then(r => { if (r.ok) c.put('./index.html', r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }
  // 아이콘·폰트 등: 캐시 우선
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok && (url.origin === location.origin || url.hostname.includes('jsdelivr'))) {
      const cp = r.clone(); caches.open(VER).then(c => c.put(req, cp));
    }
    return r;
  })));
});
