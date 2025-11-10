class AddStoryView {
    constructor() {
        this._map = null;
        this._selectedLocation = null;
        this._marker = null;
        this._stream = null;
    }

    getTemplate() {
        return `
      <section class="container">
        <div class="form-container">
          <h1 class="form-title">Tambah Cerita Baru</h1>
          <p class="form-subtitle">Bagikan pengalaman dan cerita menarik Anda</p>

          <form id="add-story-form" class="story-form" novalidate>
            <!-- Description -->
            <div class="form-group">
              <label for="description" class="form-label">
                Cerita Anda <span class="required" aria-label="wajib diisi">*</span>
              </label>
              <textarea 
                id="description" 
                name="description" 
                class="form-control" 
                rows="5" 
                placeholder="Ceritakan pengalaman Anda (minimal 10 karakter)..."
                required
                aria-required="true"
                aria-describedby="description-error"
              ></textarea>
              <div id="description-error" class="error-message" role="alert" aria-live="polite"></div>
              <div class="char-counter">
                <span id="char-count">0</span> karakter
              </div>
            </div>

            <!-- Photo Upload -->
            <div class="form-group">
              <label for="photo" class="form-label">
                Foto <span class="required" aria-label="wajib diisi">*</span>
              </label>
              
              <div class="photo-upload-section">
                <!-- Camera Option -->
                <div class="camera-section">
                  <button 
                    type="button" 
                    id="open-camera-btn" 
                    class="btn btn-secondary"
                    aria-label="Buka kamera untuk mengambil foto"
                  >
                    Ambil dari Kamera
                  </button>
                  
                  <div id="camera-container" class="camera-container hidden">
                    <video id="camera-video" class="camera-video" autoplay playsinline aria-label="Preview kamera"></video>
                    <div class="camera-controls">
                      <button 
                        type="button" 
                        id="capture-btn" 
                        class="btn btn-primary"
                        aria-label="Ambil foto"
                      >
                        Ambil Foto
                      </button>
                      <button 
                        type="button" 
                        id="close-camera-btn" 
                        class="btn btn-danger"
                        aria-label="Tutup kamera"
                      >
                        ✖ Tutup Kamera
                      </button>
                    </div>
                  </div>
                  
                  <canvas id="camera-canvas" class="hidden"></canvas>
                </div>

                <!-- File Upload Option -->
                <div class="file-upload-section">
                  <label for="photo" class="file-upload-label">
                    <span class="upload-icon"></span>
                    <span class="upload-text">Pilih dari File</span>
                  </label>
                  <input 
                    type="file" 
                    id="photo" 
                    name="photo" 
                    class="file-input" 
                    accept="image/jpeg,image/jpg,image/png"
                    required
                    aria-required="true"
                    aria-describedby="photo-error"
                  />
                </div>
              </div>

              <div id="photo-error" class="error-message" role="alert" aria-live="polite"></div>
              
              <!-- Photo Preview -->
              <div id="photo-preview-container" class="photo-preview-container hidden">
                <img id="photo-preview" src="" alt="Preview foto yang akan diunggah" class="photo-preview" />
                <button 
                  type="button" 
                  id="remove-photo-btn" 
                  class="btn-remove-photo"
                  aria-label="Hapus foto"
                >
                  ✖
                </button>
              </div>
            </div>

            <!-- Location Selection -->
            <div class="form-group">
              <label for="map-picker" class="form-label">
                Pilih Lokasi <span class="required" aria-label="wajib diisi">*</span>
              </label>
              <p class="form-help">
                Klik pada peta untuk memilih lokasi cerita Anda.
                <span class="keyboard-hint">Gunakan Tab untuk fokus ke peta, lalu klik untuk memilih lokasi.</span>
              </p>
              <div
                id="map-picker"
                class="map-picker"
                role="application"
                aria-label="Peta untuk memilih lokasi cerita. Klik pada peta untuk memilih lokasi."
                tabindex="0"
              ></div>
              <div id="location-error" class="error-message" role="alert" aria-live="polite"></div>
              <div id="selected-location" class="selected-location hidden">
                <span class="location-icon"></span>
                <span id="location-text"></span>
              </div>
            </div>

            <!-- Submit Button -->
            <div class="form-actions">
              <button 
                type="submit" 
                id="submit-btn" 
                class="btn btn-primary btn-large"
                aria-label="Kirim cerita"
              >
                Bagikan Cerita
              </button>
              <a href="#/" class="btn btn-secondary btn-large">Batal</a>
            </div>

            <!-- Form Messages -->
            <div id="form-message" class="form-message hidden" role="alert" aria-live="assertive"></div>
          </form>
        </div>
      </section>
    `;
    }

    initializeMap() {
        if (this._map) {
            this._map.remove();
        }

        this._map = L.map('map-picker').setView([-2.5489, 118.0149], 5);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
        }).addTo(this._map);

        this._map.on('click', (e) => {
            this._selectLocation(e.latlng);
        });
    }

    _selectLocation(latlng) {
        this._selectedLocation = latlng;


        if (this._marker) {
            this._map.removeLayer(this._marker);
        }

        this._marker = L.marker(latlng).addTo(this._map);


        const locationText = document.querySelector('#location-text');
        const selectedLocationDiv = document.querySelector('#selected-location');
        const locationError = document.querySelector('#location-error');

        if (locationText && selectedLocationDiv) {
            locationText.textContent = `Lat: ${latlng.lat.toFixed(6)}, Lon: ${latlng.lng.toFixed(6)}`;
            selectedLocationDiv.classList.remove('hidden');
        }

        if (locationError) {
            locationError.textContent = '';
        }
    }

    getSelectedLocation() {
        return this._selectedLocation;
    }

    showValidationError(message) {
        const formMessage = document.querySelector('#form-message');
        if (formMessage) {
            formMessage.className = 'form-message error-message';
            formMessage.textContent = message;
            formMessage.classList.remove('hidden');
            formMessage.focus();
        }
    }

    showError(message) {
        this.showValidationError(message);
        const submitBtn = document.querySelector('#submit-btn');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Bagikan Cerita';
        }
    }

    showSubmitting() {
        const submitBtn = document.querySelector('#submit-btn');
        const formMessage = document.querySelector('#form-message');

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Mengirim...';
        }

        if (formMessage) {
            formMessage.classList.add('hidden');
        }
    }

    showSuccess(message) {
        const formMessage = document.querySelector('#form-message');
        if (formMessage) {
            formMessage.className = 'form-message success-container';
            formMessage.textContent = message;
            formMessage.classList.remove('hidden');
            formMessage.focus();
        }

        const form = document.querySelector('#add-story-form');
        if (form) {
            const inputs = form.querySelectorAll('input, textarea, button');
            inputs.forEach(input => input.disabled = true);
        }
    }

    getStream() {
        return this._stream;
    }

    setStream(stream) {
        this._stream = stream;
    }

    stopCamera() {
        if (this._stream) {
            this._stream.getTracks().forEach(track => track.stop());
            this._stream = null;
        }
    }
}

export default AddStoryView;