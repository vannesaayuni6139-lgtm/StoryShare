import '../styles/styles.css';
import App from './pages/app.js';
import PushNotificationHelper from './utils/push-notification.js';
import IndexedDBHelper from './utils/indexeddb-helper.js';
import StoryAPI from './data/api.js';

const app = new App({
  drawer: {
    button: document.querySelector('#drawer-button'),
    nav: document.querySelector('#navigation-drawer'),
  },
  content: document.querySelector('#main-content'),
});


IndexedDBHelper.init().catch(error => {
  console.error('Failed to initialize IndexedDB:', error);
});


document.addEventListener('DOMContentLoaded', () => {
  const skipLink = document.querySelector('.skip-to-content');
  const mainContent = document.querySelector('#main-content');

  if (skipLink && mainContent) {
    skipLink.addEventListener('click', (e) => {
      e.preventDefault();
      mainContent.setAttribute('tabindex', '-1');
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Remove tabindex after focus to restore normal tab order
      mainContent.addEventListener('blur', () => {
        mainContent.removeAttribute('tabindex');
      }, { once: true });
    });
  }
});

window.addEventListener('DOMContentLoaded', () => {
  app.renderPage();
});

window.addEventListener('hashchange', () => {
  app.renderPage();
});


let deferredPrompt;
let installButtonShown = false;

window.addEventListener('beforeinstallprompt', (e) => {
  console.log('beforeinstallprompt event fired');
  e.preventDefault();
  deferredPrompt = e;

 
  if (!installButtonShown) {
    showInstallButton();
  }
});

function showInstallButton() {
  
  if (document.getElementById('install-btn')) {
    return;
  }

  if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
    console.log('App is already installed');
    return;
  }

  const installBtn = document.createElement('button');
  installBtn.className = 'install-btn';
  installBtn.id = 'install-btn';
  installBtn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
    <span>Install App</span>
  `;

  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);

    if (outcome === 'accepted') {
      installButtonShown = true;
    }

    deferredPrompt = null;
    installBtn.remove();
  });

  document.body.appendChild(installBtn);
  installButtonShown = true;
}


window.addEventListener('appinstalled', () => {
  console.log('PWA was installed');
  deferredPrompt = null;
  installButtonShown = true;

  const installBtn = document.getElementById('install-btn');
  if (installBtn) {
    installBtn.remove();
  }
});


if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
  console.log('App is running in standalone mode');
  installButtonShown = true;
}


if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);

      
      const isSubscribed = await PushNotificationHelper.init(registration);
      console.log('Push notification initialized:', isSubscribed);

      window.swRegistration = registration;
      window.pushNotificationSubscribed = isSubscribed;

      
      if (StoryAPI.isAuthenticated()) {
        addNotificationToggle(isSubscribed);
      }
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  });
}

window.addEventListener('hashchange', () => {
  const isLoggedIn = StoryAPI.isAuthenticated();
  const toggleExists = document.getElementById('notification-toggle');

  if (isLoggedIn && !toggleExists && window.swRegistration) {
    addNotificationToggle(window.pushNotificationSubscribed || false);
  } else if (!isLoggedIn && toggleExists) {
    const toggleContainer = document.querySelector('.notification-toggle-container');
    if (toggleContainer) {
      toggleContainer.remove();
    }
  }
});


function addNotificationToggle(isSubscribed) {
  const header = document.querySelector('.header-container');
  if (!header) return;

  const toggleContainer = document.createElement('div');
  toggleContainer.className = 'notification-toggle-container';
  toggleContainer.innerHTML = `
    <button id="notification-toggle" class="notification-toggle-btn ${isSubscribed ? 'active' : ''}"
            aria-label="Toggle push notifications">
      <svg class="bell-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
      </svg>
      <span class="toggle-status">${isSubscribed ? 'Aktif' : 'Nonaktif'}</span>
    </button>
  `;

 
  const drawerButton = document.querySelector('#drawer-button');
  if (drawerButton) {
    header.insertBefore(toggleContainer, drawerButton);
  } else {
    header.appendChild(toggleContainer);
  }


  const toggleBtn = document.getElementById('notification-toggle');
  toggleBtn.addEventListener('click', async () => {
    try {
      const currentlySubscribed = await PushNotificationHelper.isSubscribed();

      if (currentlySubscribed) {
   
        await PushNotificationHelper.unsubscribe();
        toggleBtn.classList.remove('active');
        toggleBtn.querySelector('.toggle-status').textContent = 'Nonaktif';
        showToast('Notifikasi dinonaktifkan', 'info');
      } else {
    
        await PushNotificationHelper.subscribe();
        toggleBtn.classList.add('active');
        toggleBtn.querySelector('.toggle-status').textContent = 'Aktif';
        showToast('Notifikasi diaktifkan!', 'success');
      }
    } catch (error) {
      console.error('Error toggling notification:', error);
      showToast('Gagal mengubah pengaturan notifikasi', 'error');
    }
  });
}

function showToast(message, type = 'info') {
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