import AddStoryView from '../../views/add-story-view.js';
import AddStoryPresenter from '../../presenters/add-story-presenter.js';

class AddStoryPage {
  constructor() {
    this._view = new AddStoryView();
    this._presenter = new AddStoryPresenter(this._view);
    this._photoFile = null;
  }

  async render() {
    return this._view.getTemplate();
  }

  async afterRender() {
    this._view.initializeMap();
    this._initializeFormHandlers();
    this._initializeCameraHandlers();
  }

  _initializeFormHandlers() {
    const form = document.querySelector('#add-story-form');
    const descriptionInput = document.querySelector('#description');
    const photoInput = document.querySelector('#photo');
    const charCount = document.querySelector('#char-count');


    if (descriptionInput && charCount) {
      descriptionInput.addEventListener('input', () => {
        charCount.textContent = descriptionInput.value.length;
      });
    }

    if (photoInput) {
      photoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          this._handlePhotoSelection(file);
        }
      });
    }


    document.addEventListener('click', (e) => {
      if (e.target.id === 'remove-photo-btn' || e.target.closest('#remove-photo-btn')) {
        this._removePhoto();
      }
    });

    // Form submission
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this._handleSubmit();
      });
    }
  }

  _initializeCameraHandlers() {
    const openCameraBtn = document.querySelector('#open-camera-btn');
    const closeCameraBtn = document.querySelector('#close-camera-btn');
    const captureBtn = document.querySelector('#capture-btn');

    if (openCameraBtn) {
      openCameraBtn.addEventListener('click', () => this._openCamera());
    }

    if (closeCameraBtn) {
      closeCameraBtn.addEventListener('click', () => this._closeCamera());
    }

    if (captureBtn) {
      captureBtn.addEventListener('click', () => this._capturePhoto());
    }
  }

  async _openCamera() {
    const cameraContainer = document.querySelector('#camera-container');
    const video = document.querySelector('#camera-video');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });

      this._view.setStream(stream);
      
      if (video) {
        video.srcObject = stream;
      }

      if (cameraContainer) {
        cameraContainer.classList.remove('hidden');
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Tidak dapat mengakses kamera. Pastikan Anda memberikan izin akses kamera.');
    }
  }

  _closeCamera() {
    const cameraContainer = document.querySelector('#camera-container');
    const video = document.querySelector('#camera-video');

    this._view.stopCamera();

    if (video) {
      video.srcObject = null;
    }

    if (cameraContainer) {
      cameraContainer.classList.add('hidden');
    }
  }

  _capturePhoto() {
    const video = document.querySelector('#camera-video');
    const canvas = document.querySelector('#camera-canvas');

    if (!video || !canvas) return;

  
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);


    canvas.toBlob((blob) => {
      if (blob) {

        const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' });
        this._handlePhotoSelection(file);
        this._closeCamera();
      }
    }, 'image/jpeg', 0.9);
  }

  _handlePhotoSelection(file) {
    this._photoFile = file;


    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = document.querySelector('#photo-preview');
      const previewContainer = document.querySelector('#photo-preview-container');
      const photoError = document.querySelector('#photo-error');

      if (preview && previewContainer) {
        preview.src = e.target.result;
        previewContainer.classList.remove('hidden');
      }

      if (photoError) {
        photoError.textContent = '';
      }
    };
    reader.readAsDataURL(file);
  }

  _removePhoto() {
    this._photoFile = null;
    
    const photoInput = document.querySelector('#photo');
    const preview = document.querySelector('#photo-preview');
    const previewContainer = document.querySelector('#photo-preview-container');

    if (photoInput) {
      photoInput.value = '';
    }

    if (preview) {
      preview.src = '';
    }

    if (previewContainer) {
      previewContainer.classList.add('hidden');
    }
  }

  async _handleSubmit() {
    const descriptionInput = document.querySelector('#description');
    const location = this._view.getSelectedLocation();

    const storyData = {
      description: descriptionInput?.value || '',
      photo: this._photoFile,
      lat: location?.lat || null,
      lon: location?.lng || null,
    };

    await this._presenter.submitStory(storyData);
  }
}

export default AddStoryPage;

