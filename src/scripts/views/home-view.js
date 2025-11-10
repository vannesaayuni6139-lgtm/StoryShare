import { showFormattedDate } from '../utils/index.js';
import IndexedDBHelper from '../utils/indexeddb-helper.js';

class HomeView {
  constructor() {
    this._map = null;
    this._markers = [];
    this._activeMarkerId = null;
  }

  getTemplate() {
    return `
      <div class="stories-container">
        <!-- Stories Feed Section -->
        <div class="stories-section">
          <div id="stories-list" class="stories-list" role="list"></div>
        </div>

        <!-- Map Section -->
        <div class="map-section">
          <div id="map" class="map-container" role="application" aria-label="Peta interaktif menampilkan lokasi cerita"></div>
        </div>
      </div>
      <!-- Image modal for HD view -->
      <div id="image-modal" class="image-modal hidden" aria-hidden="true">
        <div class="image-modal-backdrop" data-modal-close></div>
        <div class="image-modal-content" role="dialog" aria-modal="true">
          <button class="modal-close" aria-label="Tutup gambar" data-modal-close>×</button>
          <div id="modal-spinner" class="modal-spinner" aria-hidden="true"></div>
          <img id="modal-image" src="" alt="" class="modal-image hidden" />
        </div>
      </div>
    `;
  }

  showLoading() {
    const storiesList = document.querySelector('#stories-list');
    if (storiesList) {
      storiesList.innerHTML = `
        <div class="loading-spinner">
          <div class="spinner"></div>
          <p>Memuat cerita...</p>
        </div>
      `;
    }
  }

  async showStories(stories) {
    const storiesList = document.querySelector('#stories-list');

    if (!storiesList) {
      console.error('Element #stories-list not found');
      return;
    }

    if (!stories || stories.length === 0) {
      storiesList.innerHTML = `
        <div class="empty-state">
          <p>Belum ada cerita yang dibagikan</p>
          <a href="#/add-story" class="btn btn-primary">Tambah Cerita Pertama</a>
        </div>
      `;
      return;
    }

    // Check which stories are favorited
    const favoriteStates = {};
    for (const story of stories) {
      favoriteStates[story.id] = await IndexedDBHelper.isFavorite(story.id);
    }

    storiesList.innerHTML = stories.map(story => `
      <article class="story-card" data-story-id="${story.id}">
        <div class="story-image">
          <img src="${story.photoUrl}" alt="${story.name}" loading="lazy" />
          <button 
            class="favorite-btn ${favoriteStates[story.id] ? 'active' : ''}"
            data-story-id="${story.id}"
            aria-label="${favoriteStates[story.id] ? 'Hapus dari favorit' : 'Tambah ke favorit'}"
            title="${favoriteStates[story.id] ? 'Hapus dari favorit' : 'Tambah ke favorit'}"
          >
            <svg class="heart-icon" viewBox="0 0 24 24" fill="${favoriteStates[story.id] ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>
        </div>
        <div class="story-content">
          <h3 class="story-title">${story.name}</h3>
          <p class="story-description">${story.description}</p>
          <div class="story-meta">
            <span class="story-date">${showFormattedDate(story.createdAt, 'id-ID')}</span>
            ${story.lat && story.lon ? `
              <button class="story-location-btn" data-lat="${story.lat}" data-lon="${story.lon}" aria-label="Lihat lokasi di peta">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                Lihat di Peta
              </button>
            ` : ''}
          </div>
        </div>
      </article>
    `).join('');

    // Initialize map with markers
    this._initializeMap(stories);

    // Setup event listeners
    this._setupEventListeners(stories);
  }

  _setupEventListeners(stories) {
    // Location buttons
    document.querySelectorAll('.story-location-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const lat = parseFloat(btn.dataset.lat);
        const lon = parseFloat(btn.dataset.lon);
        this._focusLocation(lat, lon);
      });
    });

    // Favorite buttons
    document.querySelectorAll('.favorite-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const storyId = btn.dataset.storyId;
        const story = stories.find(s => s.id === storyId);
        
        if (story) {
          await this._toggleFavorite(btn, story);
        }
      });
    });
  }

  async _toggleFavorite(button, story) {
    try {
      const isFavorite = button.classList.contains('active');
      
      if (isFavorite) {
        await IndexedDBHelper.removeFavorite(story.id);
        button.classList.remove('active');
        button.setAttribute('aria-label', 'Tambah ke favorit');
        button.setAttribute('title', 'Tambah ke favorit');
        
        // Update heart icon
        const heartIcon = button.querySelector('.heart-icon');
        heartIcon.setAttribute('fill', 'none');
        
        this._showToast('Dihapus dari favorit', 'info');
      } else {
        await IndexedDBHelper.addFavorite(story);
        button.classList.add('active');
        button.setAttribute('aria-label', 'Hapus dari favorit');
        button.setAttribute('title', 'Hapus dari favorit');
        
        // Update heart icon
        const heartIcon = button.querySelector('.heart-icon');
        heartIcon.setAttribute('fill', 'currentColor');
        
        this._showToast('Ditambahkan ke favorit', 'success');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      this._showToast('Gagal mengubah favorit', 'error');
    }
  }

  _showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('show');
    }, 100);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  _initializeMap(stories) {
    const mapContainer = document.querySelector('#map');
    
    if (!mapContainer) return;

    // Initialize map
    if (!this._map) {
      this._map = L.map('map').setView([-2.5, 118], 5);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(this._map);
    }

    // Clear existing markers
    this._markers.forEach(marker => marker.remove());
    this._markers = [];

    // Add markers for stories with location
    const storiesWithLocation = stories.filter(story => story.lat && story.lon);

    if (storiesWithLocation.length === 0) {
      return;
    }

    storiesWithLocation.forEach(story => {
      const marker = L.marker([story.lat, story.lon])
        .addTo(this._map)
        .bindPopup(`
          <div class="marker-popup">
            <img src="${story.photoUrl}" alt="${story.name}" class="popup-image" />
            <h4>${story.name}</h4>
            <p>${story.description.substring(0, 100)}${story.description.length > 100 ? '...' : ''}</p>
            <small>${showFormattedDate(story.createdAt, 'id-ID')}</small>
          </div>
        `);

      this._markers.push(marker);
    });

    // Fit bounds to show all markers
    if (storiesWithLocation.length > 0) {
      const group = L.featureGroup(this._markers);
      this._map.fitBounds(group.getBounds().pad(0.1));
    }
  }

  _focusLocation(lat, lon) {
    if (this._map) {
      this._map.setView([lat, lon], 15);
      
      // Scroll to map
      document.querySelector('#map').scrollIntoView({ 
        behavior: 'smooth',
        block: 'center'
      });
    }
  }

  highlightStory(story) {
    if (story.lat && story.lon && this._map) {
      this._focusLocation(story.lat, story.lon);
    }
  }

  showError(message) {
    const storiesList = document.querySelector('#stories-list');

    if (storiesList) {
      storiesList.innerHTML = `
        <div class="error-state">
          <p>❌ ${message}</p>
          <button onclick="location.reload()" class="btn btn-primary">Muat Ulang</button>
        </div>
      `;
    }
  }
}

export default HomeView;