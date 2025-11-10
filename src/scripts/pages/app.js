import DrawerInitiator from '../utils/drawer-initiator.js';
import { getActiveRoute } from '../routes/url-parser.js';
import routes from '../routes/routes.js';
import StoryAPI from '../data/api.js';

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
    } else {
      // 404 
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
  }

  _scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
}

export default App;