import DrawerInitiator from '../utils/drawer-initiator.js';
import { getActiveRoute } from '../routes/url-parser.js';
import routes from '../routes/routes.js';
import StoryAPI from '../data/api.js';
import PushNotificationHelper from '../utils/push-notification.js';

class App {
  constructor({ drawer, content }) {
    this._drawer = drawer;
    this._content = content;

    this._initialAppShell();
  }

  _initialAppShell() {
    DrawerInitiator.init({
      button: this._drawer.button,
      nav: this._drawer.nav,
    });
  }


  async _initializePushNotification() {
    if (!PushNotificationHelper.isSupported()) {
      console.warn('Push notification not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      console.log('Service Worker ready, initializing push...');

      await PushNotificationHelper.init(registration);

      const isSubscribed = await PushNotificationHelper.isSubscribed();

      if (!isSubscribed && StoryAPI.isAuthenticated()) {
        const permission = await PushNotificationHelper.requestPermission();
        if (permission === 'granted') {
          await PushNotificationHelper.subscribe();
          console.log(' Push notification subscribed successfully');
        } else {
          console.warn(' Push notification permission denied');
        }
      } else if (isSubscribed) {
        console.log(' Already subscribed to push notifications');
      }
    } catch (error) {
      console.error('Failed to initialize push notification:', error);
    }
  }


  _initializeNotificationToggle() {
    const toggleBtn = document.querySelector('#toggle-notification-btn');
    const statusText = document.querySelector('#notification-status');

    if (!toggleBtn) return;

    PushNotificationHelper.isSubscribed().then((subscribed) => {
      if (statusText) {
        statusText.textContent = subscribed ? ' ON' : ' OFF';
      }
    });

    toggleBtn.addEventListener('click', async () => {
      try {
        toggleBtn.disabled = true;
        const isSubscribed = await PushNotificationHelper.isSubscribed();

        if (isSubscribed) {
          await PushNotificationHelper.unsubscribe();
          if (statusText) statusText.textContent = ' OFF';
          alert('🔕 Notifikasi dimatikan');
        } else {
          const permission = await PushNotificationHelper.requestPermission();
          if (permission === 'granted') {
            await PushNotificationHelper.subscribe();
            if (statusText) statusText.textContent = ' ON';
            alert(' Notifikasi diaktifkan');
          } else {
            alert('Izin notifikasi ditolak');
          }
        }
      } catch (error) {
        console.error('Error toggling notification:', error);
        alert(' Gagal mengubah status notifikasi');
      } finally {
        toggleBtn.disabled = false;
      }
    });
  }

  async renderPage() {
    const url = getActiveRoute();

   
    const publicRoutes = ['/login'];
    if (!publicRoutes.includes(url) && !StoryAPI.isAuthenticated()) {
      window.location.hash = '#/login';
      return;
    }

    const page = routes[url];

    if (page) {
      const pageInstance = new page();


      if (document.startViewTransition) {
        document.startViewTransition(async () => {
          this._content.innerHTML = await pageInstance.render();
          await pageInstance.afterRender();
          this._scrollToTop();
        });
      } else {
        this._content.innerHTML = await pageInstance.render();
        await pageInstance.afterRender();
        this._scrollToTop();
      }

      this._initializeNotificationToggle();
    } else {
      this._content.innerHTML = `
        <div class="container">
          <div class="error-container">
            <h2>404 - Halaman Tidak Ditemukan</h2>
            <p>Maaf, halaman yang Anda cari tidak ada.</p>
            <a href="#/" class="btn btn-primary mt-2">Kembali ke Beranda</a>
          </div>
        </div>
      `;
    }


    if ('serviceWorker' in navigator && StoryAPI.isAuthenticated()) {
      await this._initializePushNotification();
    }
  }

  _scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }
}

export default App;
