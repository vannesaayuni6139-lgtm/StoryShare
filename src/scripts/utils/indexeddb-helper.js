const DB_NAME = 'storyshare-db';
const DB_VERSION = 1;
const FAVORITES_STORE = 'favorites';
const OFFLINE_STORIES_STORE = 'offline-stories';

class IndexedDBHelper {
  constructor() {
    this.db = null;
  }

  // Initialize database
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB error:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create favorites store
        if (!db.objectStoreNames.contains(FAVORITES_STORE)) {
          const favoritesStore = db.createObjectStore(FAVORITES_STORE, { 
            keyPath: 'id' 
          });
          favoritesStore.createIndex('createdAt', 'createdAt', { unique: false });
          console.log('Favorites store created');
        }

        // Create offline stories store for sync
        if (!db.objectStoreNames.contains(OFFLINE_STORIES_STORE)) {
          const offlineStore = db.createObjectStore(OFFLINE_STORIES_STORE, { 
            keyPath: 'id',
            autoIncrement: true
          });
          offlineStore.createIndex('createdAt', 'createdAt', { unique: false });
          console.log('Offline stories store created');
        }
      };
    });
  }


  async addFavorite(story) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([FAVORITES_STORE], 'readwrite');
      const store = transaction.objectStore(FAVORITES_STORE);
      
      const favoriteData = {
        ...story,
        favoritedAt: new Date().toISOString()
      };

      const request = store.add(favoriteData);

      request.onsuccess = () => {
        console.log('Story added to favorites:', story.id);
        resolve(story.id);
      };

      request.onerror = () => {
        console.error('Error adding to favorites:', request.error);
        reject(request.error);
      };
    });
  }

  async removeFavorite(storyId) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([FAVORITES_STORE], 'readwrite');
      const store = transaction.objectStore(FAVORITES_STORE);
      const request = store.delete(storyId);

      request.onsuccess = () => {
        console.log('Story removed from favorites:', storyId);
        resolve(storyId);
      };

      request.onerror = () => {
        console.error('Error removing from favorites:', request.error);
        reject(request.error);
      };
    });
  }

  async getFavorites(options = {}) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([FAVORITES_STORE], 'readonly');
      const store = transaction.objectStore(FAVORITES_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        let favorites = request.result;

    
        if (options.search) {
          const searchLower = options.search.toLowerCase();
          favorites = favorites.filter(story => 
            story.name?.toLowerCase().includes(searchLower) ||
            story.description?.toLowerCase().includes(searchLower)
          );
        }

  
        if (options.sortBy === 'name') {
          favorites.sort((a, b) => {
            const nameA = a.name?.toLowerCase() || '';
            const nameB = b.name?.toLowerCase() || '';
            return options.sortOrder === 'desc' 
              ? nameB.localeCompare(nameA)
              : nameA.localeCompare(nameB);
          });
        } else if (options.sortBy === 'date') {
          favorites.sort((a, b) => {
            const dateA = new Date(a.favoritedAt || a.createdAt);
            const dateB = new Date(b.favoritedAt || b.createdAt);
            return options.sortOrder === 'desc' 
              ? dateB - dateA
              : dateA - dateB;
          });
        }

        resolve(favorites);
      };

      request.onerror = () => {
        console.error('Error getting favorites:', request.error);
        reject(request.error);
      };
    });
  }

  async isFavorite(storyId) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([FAVORITES_STORE], 'readonly');
      const store = transaction.objectStore(FAVORITES_STORE);
      const request = store.get(storyId);

      request.onsuccess = () => {
        resolve(!!request.result);
      };

      request.onerror = () => {
        console.error('Error checking favorite:', request.error);
        reject(request.error);
      };
    });
  }


  async addOfflineStory(storyData) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([OFFLINE_STORIES_STORE], 'readwrite');
      const store = transaction.objectStore(OFFLINE_STORIES_STORE);
      
      const offlineData = {
        ...storyData,
        createdAt: new Date().toISOString(),
        synced: false,
        retryCount: 0
      };

      const request = store.add(offlineData);

      request.onsuccess = () => {
        console.log('Story saved for offline sync');
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('Error saving offline story:', request.error);
        reject(request.error);
      };
    });
  }

  async getOfflineStories() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([OFFLINE_STORIES_STORE], 'readonly');
      const store = transaction.objectStore(OFFLINE_STORIES_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('Error getting offline stories:', request.error);
        reject(request.error);
      };
    });
  }

  async clearSyncedStories() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([OFFLINE_STORIES_STORE], 'readwrite');
      const store = transaction.objectStore(OFFLINE_STORIES_STORE);
      const request = store.clear();

      request.onsuccess = () => {
        console.log('Synced stories cleared');
        resolve();
      };

      request.onerror = () => {
        console.error('Error clearing synced stories:', request.error);
        reject(request.error);
      };
    });
  }

  async markStorySynced(storyId) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([OFFLINE_STORIES_STORE], 'readwrite');
      const store = transaction.objectStore(OFFLINE_STORIES_STORE);
      const deleteRequest = store.delete(storyId);

      deleteRequest.onsuccess = () => {
        console.log('Offline story marked as synced and removed:', storyId);
        resolve();
      };

      deleteRequest.onerror = () => {
        console.error('Error marking story as synced:', deleteRequest.error);
        reject(deleteRequest.error);
      };
    });
  }

  async incrementRetryCount(storyId) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([OFFLINE_STORIES_STORE], 'readwrite');
      const store = transaction.objectStore(OFFLINE_STORIES_STORE);
      
      const getRequest = store.get(storyId);
      
      getRequest.onsuccess = () => {
        const story = getRequest.result;
        if (story) {
          story.retryCount = (story.retryCount || 0) + 1;
          story.lastRetry = new Date().toISOString();
          
          const putRequest = store.put(story);
          putRequest.onsuccess = () => resolve(story.retryCount);
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve(0);
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }


  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

export default new IndexedDBHelper();
