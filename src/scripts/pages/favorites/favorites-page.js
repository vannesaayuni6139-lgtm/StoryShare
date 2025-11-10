import IndexedDBHelper from '../../utils/indexeddb-helper.js';
import { showFormattedDate } from '../../utils/index.js';

class FavoritesPage {
  constructor() {
    this._favorites = [];
    this._searchQuery = '';
    this._sortBy = 'date';
    this._sortOrder = 'desc';
  }

  async render() {
    return `
      <div class="favorites-container">
        <div class="favorites-header">
          <h1>Cerita Favorit Saya</h1>
          <p class="favorites-subtitle">Kelola cerita favorit yang telah Anda simpan</p>
        </div>

        <div class="favorites-controls">
          <div class="search-box">
            <input 
              type="search" 
              id="favorites-search" 
              class="form-control search-input" 
              placeholder="Cari cerita favorit..."
              aria-label="Cari cerita favorit"
            />
          </div>

          <div class="sort-controls">
            <label for="sort-by">Urutkan:</label>
            <select id="sort-by" class="form-control sort-select">
              <option value="date">Tanggal</option>
              <option value="name">Nama</option>
            </select>

            <select id="sort-order" class="form-control sort-select">
              <option value="desc">Terbaru</option>
              <option value="asc">Terlama</option>
            </select>
          </div>
        </div>

        <div id="favorites-content" class="favorites-content">
          <div class="loading-spinner">Memuat favorit...</div>
        </div>

        <div id="empty-state" class="empty-state hidden">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
          <h3>Belum Ada Favorit</h3>
          <p>Tambahkan cerita ke favorit untuk melihatnya di sini</p>
          <a href="#/" class="btn btn-primary">Lihat Semua Cerita</a>
        </div>
      </div>
    `;
  }

  async afterRender() {
    await this._loadFavorites();
    this._initializeControls();
  }

  _initializeControls() {
    const searchInput = document.querySelector('#favorites-search');
    const sortBySelect = document.querySelector('#sort-by');
    const sortOrderSelect = document.querySelector('#sort-order');

    // Search input with debounce
    let searchTimeout;
    searchInput?.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        this._searchQuery = e.target.value;
        this._displayFavorites();
      }, 300);
    });

    // Sort controls
    sortBySelect?.addEventListener('change', (e) => {
      this._sortBy = e.target.value;
      
      // Update sort order options based on sort by
      if (e.target.value === 'date') {
        sortOrderSelect.innerHTML = `
          <option value="desc">Terbaru</option>
          <option value="asc">Terlama</option>
        `;
      } else {
        sortOrderSelect.innerHTML = `
          <option value="asc">A-Z</option>
          <option value="desc">Z-A</option>
        `;
      }
      
      this._displayFavorites();
    });

    sortOrderSelect?.addEventListener('change', (e) => {
      this._sortOrder = e.target.value;
      this._displayFavorites();
    });

    // Listen for remove events
    document.addEventListener('click', (e) => {
      if (e.target.closest('.remove-favorite-btn')) {
        const storyId = e.target.closest('.remove-favorite-btn').dataset.storyId;
        this._removeFavorite(storyId);
      }
    });
  }

  async _loadFavorites() {
    try {
      this._favorites = await IndexedDBHelper.getFavorites();
      this._displayFavorites();
    } catch (error) {
      console.error('Error loading favorites:', error);
      this._showError('Gagal memuat favorit');
    }
  }

  _displayFavorites() {
    const content = document.querySelector('#favorites-content');
    const emptyState = document.querySelector('#empty-state');

    // Filter favorites
    let filteredFavorites = this._favorites;

    if (this._searchQuery) {
      const searchLower = this._searchQuery.toLowerCase();
      filteredFavorites = filteredFavorites.filter(story => 
        story.name?.toLowerCase().includes(searchLower) ||
        story.description?.toLowerCase().includes(searchLower)
      );
    }

    // Sort favorites
    filteredFavorites.sort((a, b) => {
      if (this._sortBy === 'name') {
        const nameA = a.name?.toLowerCase() || '';
        const nameB = b.name?.toLowerCase() || '';
        return this._sortOrder === 'desc' 
          ? nameB.localeCompare(nameA)
          : nameA.localeCompare(nameB);
      } else {
        const dateA = new Date(a.favoritedAt || a.createdAt);
        const dateB = new Date(b.favoritedAt || b.createdAt);
        return this._sortOrder === 'desc' 
          ? dateB - dateA
          : dateA - dateB;
      }
    });

    // Show empty state if no favorites
    if (filteredFavorites.length === 0) {
      content.classList.add('hidden');
      emptyState.classList.remove('hidden');
      
      if (this._searchQuery) {
        emptyState.querySelector('h3').textContent = 'Tidak Ditemukan';
        emptyState.querySelector('p').textContent = `Tidak ada hasil untuk "${this._searchQuery}"`;
      } else {
        emptyState.querySelector('h3').textContent = 'Belum Ada Favorit';
        emptyState.querySelector('p').textContent = 'Tambahkan cerita ke favorit untuk melihatnya di sini';
      }
      return;
    }

    // Display favorites
    content.classList.remove('hidden');
    emptyState.classList.add('hidden');

    content.innerHTML = filteredFavorites.map(story => `
      <div class="favorite-card" data-story-id="${story.id}">
        <div class="favorite-image">
          <img src="${story.photoUrl}" alt="${story.name}" loading="lazy" />
        </div>
        <div class="favorite-content">
          <h3 class="favorite-title">${story.name}</h3>
          <p class="favorite-description">${story.description}</p>
          <div class="favorite-meta">
            <span class="favorite-date">
              Ditambahkan: ${showFormattedDate(story.favoritedAt || story.createdAt, 'id-ID')}
            </span>
            ${story.lat && story.lon ? `
              <span class="favorite-location">
                📍 ${story.lat.toFixed(4)}, ${story.lon.toFixed(4)}
              </span>
            ` : ''}
          </div>
          <div class="favorite-actions">
            <button 
              class="btn btn-sm btn-outline remove-favorite-btn" 
              data-story-id="${story.id}"
              aria-label="Hapus dari favorit"
            >
              Hapus dari Favorit
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }

  async _removeFavorite(storyId) {
    if (!confirm('Hapus cerita dari favorit?')) {
      return;
    }

    try {
      await IndexedDBHelper.removeFavorite(storyId);
      
      // Remove from local array
      this._favorites = this._favorites.filter(story => story.id !== storyId);
      
      // Re-display
      this._displayFavorites();
      
      // Show success message
      this._showSuccess('Cerita dihapus dari favorit');
    } catch (error) {
      console.error('Error removing favorite:', error);
      this._showError('Gagal menghapus dari favorit');
    }
  }

  _showError(message) {
    const content = document.querySelector('#favorites-content');
    content.innerHTML = `
      <div class="error-message">
        <p>${message}</p>
      </div>
    `;
  }

  _showSuccess(message) {
    // Simple toast notification
    const toast = document.createElement('div');
    toast.className = 'toast-notification success';
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
}

export default FavoritesPage;