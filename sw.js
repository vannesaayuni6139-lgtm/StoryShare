const CACHE_NAME = 'storyshare-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/app.bundle.js',
  '/favicon.png',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://fonts.googleapis.com/css2?family=Libertinus+Serif+Display&display=swap'
];


self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - cleanup old caches
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
    }).then(() => self.clients.claim())
  );
});


self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.origin === 'https://story-api.dicoding.dev') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          
          const responseClone = response.clone();
          
  
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          
          return response;
        })
        .catch(() => {
    
          return caches.match(request);
        })
    );
  } 
  
  else {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            return response;
          }
          
          return fetch(request).then((response) => {
          
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
            
            return response;
          });
        })
    );
  }
});

// Push Notification event
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received');
  
  let notification = {
    title: 'StoryShare',
    body: 'Ada update baru!',
    icon: '/favicon.png',
    badge: '/favicon.png',
    data: {}
  };

  
  if (event.data) {
    try {
      const data = event.data.json();
      notification = {
        title: data.title || notification.title,
        body: data.body || notification.body,
        icon: data.icon || notification.icon,
        badge: data.badge || notification.badge,
        data: data.data || {},
        actions: data.actions || [
          {
            action: 'open',
            title: 'Lihat Cerita'
          },
          {
            action: 'close',
            title: 'Tutup'
          }
        ]
      };
    } catch (error) {
      console.error('[Service Worker] Error parsing notification data:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notification.title, {
      body: notification.body,
      icon: notification.icon,
      badge: notification.badge,
      data: notification.data,
      actions: notification.actions
    })
  );
});


self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event.action);
  
  event.notification.close();

  if (event.action === 'open') {
    
    const storyId = event.notification.data?.storyId;
    const url = storyId ? `/#/story/${storyId}` : '/';
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          
          for (const client of clientList) {
            if (client.url.includes(self.location.origin) && 'focus' in client) {
              client.navigate(url);
              return client.focus();
            }
          }
          
          if (clients.openWindow) {
            return clients.openWindow(url);
          }
        })
    );
  }
});


self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  
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
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (stories.length === 0) {
      console.log('[Service Worker] No offline stories to sync');
      return;
    }

    console.log(`[Service Worker] Syncing ${stories.length} offline stories`);

    let syncedCount = 0;

  
    for (const story of stories) {
      try {
      
        const photoBlob = await base64ToBlob(story.photoBase64, story.photoType);

        const formData = new FormData();
        formData.append('description', story.description);
        formData.append('photo', photoBlob, story.photoName);

        if (story.lat && story.lon) {
          formData.append('lat', story.lat);
          formData.append('lon', story.lon);
        }

        const response = await fetch('https://story-api.dicoding.dev/v1/stories', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${story.token}`
          },
          body: formData
        });

        if (response.ok) {
          // Remove from IndexedDB 
          await new Promise((resolve, reject) => {
            const deleteTx = db.transaction('offline-stories', 'readwrite');
            const deleteStore = deleteTx.objectStore('offline-stories');
            const deleteRequest = deleteStore.delete(story.id);

            deleteRequest.onsuccess = () => resolve();
            deleteRequest.onerror = () => reject(deleteRequest.error);
          });

          console.log('[Service Worker] Story synced and removed:', story.id);
          syncedCount++;
        } else {
          console.error('[Service Worker] Failed to sync story, server error:', response.status);
        }
      } catch (error) {
        console.error('[Service Worker] Failed to sync story:', error);
      }
    }


    if (syncedCount > 0) {
      self.registration.showNotification('StoryShare', {
        body: `${syncedCount} cerita berhasil disinkronkan!`,
        icon: '/favicon.png',
        badge: '/favicon.png'
      });
    }

  } catch (error) {
    console.error('[Service Worker] Error in sync:', error);
  }
}

function base64ToBlob(base64, mimeType) {
  return fetch(base64)
    .then(res => res.blob())
    .then(blob => new Blob([blob], { type: mimeType }));
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('storyshare-db', 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}