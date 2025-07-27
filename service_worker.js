const CACHE_NAME = 'attendance-matching-v2';
const urlsToCache = [
    './',
    './index.html',
    'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
];

// 서비스 워커 설치
self.addEventListener('install', event => {
    console.log('서비스 워커 설치됨');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('캐시 열림');
                return cache.addAll(urlsToCache);
            })
            .catch(error => {
                console.error('캐시 설치 실패:', error);
            })
    );
    // 새 서비스 워커가 즉시 활성화되도록 함
    self.skipWaiting();
});

// 네트워크 요청 가로채기
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // 캐시에서 찾으면 캐시 응답 반환
                if (response) {
                    return response;
                }
                
                // 캐시에 없으면 네트워크에서 가져오기
                return fetch(event.request)
                    .then(response => {
                        // 유효한 응답인지 확인
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // 응답 복사 (한 번만 사용할 수 있기 때문)
                        const responseToCache = response.clone();

                        // 새로운 파일을 캐시에 추가
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    });
            })
            .catch(() => {
                // 오프라인일 때 기본 응답
                if (event.request.destination === 'document') {
                    return new Response(`
                        <!DOCTYPE html>
                        <html lang="ko">
                        <head>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <title>오프라인</title>
                            <style>
                                body {
                                    font-family: Arial, sans-serif;
                                    text-align: center;
                                    padding: 50px;
                                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                    color: white;
                                    min-height: 100vh;
                                    margin: 0;
                                    display: flex;
                                    flex-direction: column;
                                    justify-content: center;
                                    align-items: center;
                                }
                                h1 { font-size: 2em; margin-bottom: 20px; }
                                p { font-size: 1.2em; margin-bottom: 30px; }
                                button {
                                    background: rgba(255,255,255,0.2);
                                    color: white;
                                    border: 2px solid white;
                                    padding: 10px 20px;
                                    border-radius: 25px;
                                    cursor: pointer;
                                    font-size: 1em;
                                }
                                button:hover { background: rgba(255,255,255,0.3); }
                            </style>
                        </head>
                        <body>
                            <h1>📡 오프라인 상태</h1>
                            <p>인터넷 연결을 확인하고 다시 시도해주세요.</p>
                            <button onclick="window.location.reload()">다시 시도</button>
                        </body>
                        </html>
                    `, {
                        headers: { 'Content-Type': 'text/html' }
                    });
                }
            })
    );
});

// 서비스 워커 활성화
self.addEventListener('activate', event => {
    console.log('서비스 워커 활성화됨');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('오래된 캐시 삭제:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    // 즉시 클라이언트 제어
    return self.clients.claim();
});

// 백그라운드 동기화 (선택사항)
self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
        console.log('백그라운드 동기화 실행');
    }
});

// 푸시 알림 처리 (선택사항)
self.addEventListener('push', event => {
    if (event.data) {
        const options = {
            body: event.data.text(),
            icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzQ1YWNmZSI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiM2NjdlZWEiPjwvY2lyY2xlPjx0ZXh0IHg9IjEyIiB5PSIxNiIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iNiI+7YeE7J2065OcPC90ZXh0Pjwvc3ZnPg==',
            badge: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzQ1YWNmZSI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiM2NjdlZWEiPjwvY2lyY2xlPjx0ZXh0IHg9IjEyIiB5PSIxNiIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iNiI+7YeE7J2065OcPC90ZXh0Pjwvc3ZnPg=='
        };
        
        event.waitUntil(
            self.registration.showNotification('출석부 매칭 앱', options)
        );
    }
});