import StoryAPI from '../data/api.js';
import IndexedDBHelper from '../utils/indexeddb-helper.js';

class AddStoryPresenter {
  constructor(view) {
    this._view = view;
  }

  async submitStory(storyData) {
    try {
      // Validate data
      const validationError = this._validateStoryData(storyData);
      if (validationError) {
        this._view.showValidationError(validationError);
        return;
      }

      this._view.showSubmitting();

      try {
        await StoryAPI.addStory(storyData);
        this._view.showSuccess('Cerita berhasil ditambahkan!');

        setTimeout(() => {
          window.location.hash = '#/';
        }, 2000);
      } catch (error) {
        // If network error, save for offline sync
        if (!navigator.onLine || error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          await this._saveForOfflineSync(storyData);
          this._view.showSuccess('Anda sedang offline. Cerita akan dikirim saat online kembali.');

          setTimeout(() => {
            window.location.hash = '#/';
          }, 2000);
        } else {
          // Other errors (validation, auth, etc)
          throw error;
        }
      }
    } catch (error) {
      this._view.showError(error.message || 'Gagal menambahkan cerita. Silakan coba lagi.');
    }
  }

  async _saveForOfflineSync(storyData) {
    try {
      // Convert photo to base64 for IndexedDB storage
      const photoBase64 = await this._fileToBase64(storyData.photo);

      const offlineStory = {
        description: storyData.description,
        photoBase64: photoBase64,
        photoName: storyData.photo.name,
        photoType: storyData.photo.type,
        lat: storyData.lat,
        lon: storyData.lon,
        token: StoryAPI.getToken(),
        createdAt: new Date().toISOString(),
      };

      await IndexedDBHelper.addOfflineStory(offlineStory);

      if ('serviceWorker' in navigator && 'sync' in navigator.serviceWorker) {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('sync-stories');
        console.log('Background sync registered');
      }
    } catch (error) {
      console.error('Failed to save for offline sync:', error);
      throw new Error('Gagal menyimpan cerita untuk sinkronisasi offline');
    }
  }

  _fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  _validateStoryData(data) {
    if (!data.description || data.description.trim().length === 0) {
      return 'Deskripsi cerita tidak boleh kosong';
    }

    if (data.description.trim().length < 10) {
      return 'Deskripsi cerita minimal 10 karakter';
    }

    if (!data.photo) {
      return 'Foto harus dipilih';
    }

    if (!data.lat || !data.lon) {
      return 'Lokasi harus dipilih dengan klik pada peta';
    }


    if (data.photo.size > 1024 * 1024) {
      return 'Ukuran foto maksimal 1MB';
    }

 
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(data.photo.type)) {
      return 'Format foto harus JPG, JPEG, atau PNG';
    }

    return null;
  }
}

export default AddStoryPresenter;

