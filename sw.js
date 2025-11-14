const CACHE_NAME = 'storyshare-v4';

const OFFLINE_URL = BASE_URL + 'index.html';

const API_URL = 'https://story-api.dicoding.dev';

const BASE_URL = self.location.origin + self.location.pathname.replace(/sw\.js$/, '');

const urlsToCache = [
  BASE_URL,
  BASE_URL + 'index.html',
  BASE_URL + 'manifest.json',
  BASE_URL + 'favicon.png',
  BASE_URL + 'app.bundle.js',
];


self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});


self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;


  if (request.url.startsWith(API_URL)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }


  event.respondWith(
    caches.match(request).then((response) =>
      response ||
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
          }
          return networkResponse;
        })
        .catch(() => {
          if (request.mode === 'navigate') return caches.match(OFFLINE_URL);
          return new Response('Offline', { status: 503 });
        })
    )
  );
});


self.addEventListener('push', (event) => {
  console.log('[SW] Push received');
  let data = {};
  try {
    data = event.data.json();
  } catch (err) {
    data = { title: 'StoryShare', body: 'Ada cerita baru!' };
  }

  const title = data.title || 'StoryShare';
  const options = {
    body: data.body || 'Ada cerita baru yang menarik!',
    icon: './favicon.png',
    badge: './favicon.png',
    data: { url: data.url || './' },
    actions: [
      { action: 'open', title: 'Lihat' },
      { action: 'close', title: 'Tutup' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});


self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  event.notification.close();

  if (event.action === 'close') return;

  const targetUrl = event.notification.data?.url || './';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});

self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  if (event.tag === 'sync-stories') {
    event.waitUntil(syncOfflineStories());
  }
});

async function syncOfflineStories() {
  try {
    const db = await openDatabase();
    const stories = await new Promise((resolve, reject) => {
      const tx = db.transaction('offline-stories', 'readonly');
      const store = tx.objectStore('offline-stories');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    if (stories.length === 0) {
      console.log('[SW] Tidak ada cerita offline untuk disinkronkan.');
      return;
    }

    console.log(`[SW] Menyinkronkan ${stories.length} cerita...`);
    let successCount = 0;

    for (const story of stories) {
      try {
        const blob = await base64ToBlob(story.photoBase64, story.photoType);
        const formData = new FormData();
        formData.append('description', story.description);
        formData.append('photo', blob, story.photoName);
        if (story.lat && story.lon) {
          formData.append('lat', story.lat);
          formData.append('lon', story.lon);
        }

        const res = await fetch(`${API_URL}/v1/stories`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${story.token}` },
          body: formData,
        });

        if (res.ok) {
          await deleteStoryFromDB(db, story.id);
          successCount++;
        }
      } catch (err) {
        console.error('[SW] Gagal upload story offline:', err);
      }
    }

    if (successCount > 0) {
      self.registration.showNotification('StoryShare', {
        body: `${successCount} cerita berhasil disinkronkan!`,
        icon: './favicon.png',
        badge: './favicon.png',
      });
    }
  } catch (err) {
    console.error('[SW] Gagal sinkronisasi offline:', err);
  }
}

function base64ToBlob(base64, mimeType) {
  return fetch(base64)
    .then((res) => res.blob())
    .then((blob) => new Blob([blob], { type: mimeType }));
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('storyshare-db', 1);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function deleteStoryFromDB(db, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offline-stories', 'readwrite');
    const store = tx.objectStore('offline-stories');
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
