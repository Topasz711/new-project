/// <reference lib="webworker" />
/* eslint-disable no-restricted-globals */

// 1. ตั้งชื่อ Cache (ถ้าแก้โค้ดเว็บแล้วอยากให้เครื่องเพื่อนๆ อัปเดตไวๆ ให้เปลี่ยนเลขเวอร์ชันตรงนี้ เช่น v2)
const CACHE_NAME = 'topaz-quiz-v1';

// 2. รายชื่อไฟล์ที่ต้องการให้โหลดเก็บไว้ทันทีที่เปิดเว็บครั้งแรก (App Shell)
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './main.js',
    './snake.js',
    './labQuiz.js',
    './manifest.json',
    './images/quizlablol.png', // โลโก้
    'https://cdn.tailwindcss.com',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sarabun:wght@400;500;600;700&display=swap'
];

// 3. Install Event: ติดตั้ง Service Worker และโหลดไฟล์จำเป็นลง Cache
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching all: app shell and content');
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
    // บังคับให้ SW ตัวใหม่เริ่มทำงานทันที (Skip Waiting)
    self.skipWaiting();
});

// 4. Activate Event: เคลียร์ Cache เก่าเมื่อมีการเปลี่ยนชื่อ Cache Name
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    // สั่งให้ SW ควบคุมทุกหน้าเว็บทันที
    return self.clients.claim();
});

// 5. Fetch Event: ดักจับการโหลดไฟล์ (หัวใจสำคัญของ Offline Mode)
self.addEventListener('fetch', (event) => {
    // ข้ามการเช็คถ้าไม่ใช่ http/https
    if (!event.request.url.startsWith('http')) return;

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // 5.1 ถ้ามีใน Cache ให้ส่งข้อมูลจาก Cache ไปเลย (Offline Mode)
                if (response) {
                    return response;
                }

                // 5.2 ถ้าไม่มีใน Cache ให้โหลดจากเน็ต
                return fetch(event.request).then(
                    (response) => {
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // ถ้าโหลดสำเร็จ ให้ Copy ข้อมูลเก็บลง Cache ด้วย (Dynamic Caching)
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    }
                );
            })
    );
});