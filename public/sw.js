// 홈 화면 추가(설치) 배너를 띄우기 위한 최소한의 서비스워커.
// 캐싱은 하지 않음 — 이 앱은 서버 API를 계속 호출하므로 캐시가 오히려 데이터를 낡게 만들 수 있음.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
