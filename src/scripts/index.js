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

  setTimeout(() => {
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

   
    document.body.insertBefore(installBtn, document.body.firstChild);
    installButtonShown = true;
  }, 1000);
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
      const registration = await navigator.serviceWorker.register('./sw.js');
      await navigator.serviceWorker.ready;
      
      window.swRegistration = registration;
      await PushNotificationHelper.init(registration);

      if (StoryAPI.isAuthenticated()) {
        await autoSubscribePushNotification(registration);
      }

      window.addEventListener('user-logged-in', async () => {
        await autoSubscribePushNotification(registration);
      });

    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  });
}

async function autoSubscribePushNotification(registration) {
  try {
    const isSubscribed = await PushNotificationHelper.isSubscribed();
    if (isSubscribed) return;

    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }

    if (Notification.permission === 'granted') {
      await PushNotificationHelper.subscribe();
      console.log(' Auto-subscribed to push notifications');
    }
  } catch (error) {
    console.error('Auto-subscribe failed:', error);
  }
}

function addNotificationToggle(isSubscribed) {
  const navList = document.querySelector('#nav-list');
  if (!navList || document.querySelector('#notification-toggle')) return;

  const toggleItem = document.createElement('li');
  toggleItem.role = 'none';
  toggleItem.className = 'auth-only';
  toggleItem.innerHTML = `
    <button id="notification-toggle" class="nav-logout-btn" role="menuitem" aria-label="Toggle Push Notifications">
      <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
      </svg>
      <span>${isSubscribed ? 'Matikan Notifikasi' : 'Aktifkan Notifikasi'}</span>
    </button>
  `;

  const logoutItem = navList.querySelector('li:last-child');
  navList.insertBefore(toggleItem, logoutItem);

  const toggleBtn = document.querySelector('#notification-toggle');
  toggleBtn.addEventListener('click', async () => {
    try {
      if (window.pushNotificationSubscribed) {
        await PushNotificationHelper.unsubscribe();
        toggleBtn.querySelector('span').textContent = 'Aktifkan Notifikasi';
        window.pushNotificationSubscribed = false;
      } else {
        const subscribed = await PushNotificationHelper.subscribe();
        if (subscribed) {
          toggleBtn.querySelector('span').textContent = 'Matikan Notifikasi';
          window.pushNotificationSubscribed = true;
        }
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      alert('Gagal mengubah pengaturan notifikasi');
    }
  });
}

document.addEventListener('click', (e) => {
  if (e.target.id === 'logout-btn') {
    e.preventDefault();
    StoryAPI.logout();
  }
});


