import StoryAPI from '../../data/api.js';

class LoginPage {
  constructor() {
    this._isLoginMode = true;
  }

  async render() {
    return `
      <div class="auth-container">
        <div class="auth-card">
          <div class="auth-header">
            <img src="favicon.png" alt="StoryShare Logo" class="auth-logo" />
            <h1 class="auth-title">StoryShare</h1>
            <p class="auth-subtitle">Bagikan cerita, bagikan pengalaman</p>
          </div>

          <div class="auth-tabs" role="tablist">
            <button id="login-tab" class="auth-tab active" role="tab" aria-label="Tab Login" aria-selected="true" tabindex="0">
              Login
            </button>
            <button id="register-tab" class="auth-tab" role="tab" aria-label="Tab Register" aria-selected="false" tabindex="0">
              Register
            </button>
          </div>

          <!-- Login Form -->
          <form id="login-form" class="auth-form">
            <div class="form-group">
              <label for="login-email" class="form-label">Email <span class="required">*</span></label>
              <input 
                type="email" 
                id="login-email" 
                class="form-control" 
                placeholder="email@example.com"
                required
                autocomplete="email"
              />
            </div>

            <div class="form-group">
              <label for="login-password" class="form-label">Password <span class="required">*</span></label>
              <input 
                type="password" 
                id="login-password" 
                class="form-control" 
                placeholder="Masukkan password"
                required
                autocomplete="current-password"
              />
            </div>

            <div id="login-error" class="error-message" role="alert"></div>

            <button type="submit" class="btn btn-primary btn-large btn-block">
              Login
            </button>
          </form>

          <!-- Register Form -->
          <form id="register-form" class="auth-form hidden">
            <div class="form-group">
              <label for="register-name" class="form-label">Nama <span class="required">*</span></label>
              <input 
                type="text" 
                id="register-name" 
                class="form-control" 
                placeholder="Nama lengkap"
                required
                autocomplete="name"
              />
            </div>

            <div class="form-group">
              <label for="register-email" class="form-label">Email <span class="required">*</span></label>
              <input 
                type="email" 
                id="register-email" 
                class="form-control" 
                placeholder="email@example.com"
                required
                autocomplete="email"
              />
            </div>

            <div class="form-group">
              <label for="register-password" class="form-label">Password <span class="required">*</span></label>
              <input 
                type="password" 
                id="register-password" 
                class="form-control" 
                placeholder="Minimal 8 karakter"
                required
                minlength="8"
                autocomplete="new-password"
              />
              <p class="form-help">Password minimal 8 karakter</p>
            </div>

            <div id="register-error" class="error-message" role="alert"></div>
            <div id="register-success" class="success-message" role="alert"></div>

            <button type="submit" class="btn btn-primary btn-large btn-block">
              Register
            </button>
          </form>
        </div>
      </div>
    `;
  }

  async afterRender() {
    
    if (StoryAPI.isAuthenticated()) {
      window.location.hash = '#/';
      return;
    }

    this._initializeTabHandlers();
    this._initializeFormHandlers();
  }

  _initializeTabHandlers() {
    const loginTab = document.querySelector('#login-tab');
    const registerTab = document.querySelector('#register-tab');
    const loginForm = document.querySelector('#login-form');
    const registerForm = document.querySelector('#register-form');

    const switchToLogin = () => {
      loginTab.classList.add('active');
      registerTab.classList.remove('active');
      loginForm.classList.remove('hidden');
      registerForm.classList.add('hidden');
      this._isLoginMode = true;
      this._clearMessages();
    };

    const switchToRegister = () => {
      registerTab.classList.add('active');
      loginTab.classList.remove('active');
      registerForm.classList.remove('hidden');
      loginForm.classList.add('hidden');
      this._isLoginMode = false;
      this._clearMessages();
    };

    loginTab?.addEventListener('click', switchToLogin);
    loginTab?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        switchToLogin();
      }
    });

    registerTab?.addEventListener('click', switchToRegister);
    registerTab?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        switchToRegister();
      }
    });
  }

  _initializeFormHandlers() {
    const loginForm = document.querySelector('#login-form');
    const registerForm = document.querySelector('#register-form');

    loginForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      this._handleLogin();
    });

    registerForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      this._handleRegister();
    });
  }

  async _handleLogin() {
    const email = document.querySelector('#login-email')?.value;
    const password = document.querySelector('#login-password')?.value;
    const errorDiv = document.querySelector('#login-error');
    const submitBtn = document.querySelector('#login-form button[type="submit"]');

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Loading...';
      }

      errorDiv.textContent = '';

      const result = await StoryAPI.login({ email, password });
      
      // Redirect to home
      window.location.hash = '#/';
    } catch (error) {
      errorDiv.textContent = error.message || 'Login gagal. Silakan coba lagi.';
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login';
      }
    }
  }

  async _handleRegister() {
    const name = document.querySelector('#register-name')?.value;
    const email = document.querySelector('#register-email')?.value;
    const password = document.querySelector('#register-password')?.value;
    const errorDiv = document.querySelector('#register-error');
    const successDiv = document.querySelector('#register-success');
    const submitBtn = document.querySelector('#register-form button[type="submit"]');

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Loading...';
      }

      errorDiv.textContent = '';
      successDiv.textContent = '';

      await StoryAPI.register({ name, email, password });
      
      successDiv.textContent = 'Registrasi berhasil! Silakan login.';
      
      // Clear form
      document.querySelector('#register-name').value = '';
      document.querySelector('#register-email').value = '';
      document.querySelector('#register-password').value = '';

      // Switch to login tab after 2 seconds
      setTimeout(() => {
        document.querySelector('#login-tab')?.click();
      }, 2000);
    } catch (error) {
      errorDiv.textContent = error.message || 'Registrasi gagal. Silakan coba lagi.';
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Register';
      }
    }
  }

  _clearMessages() {
    document.querySelector('#login-error').textContent = '';
    document.querySelector('#register-error').textContent = '';
    document.querySelector('#register-success').textContent = '';
  }
}

export default LoginPage;

