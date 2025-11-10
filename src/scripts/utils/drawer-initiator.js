import StoryAPI from '../data/api.js';

const DrawerInitiator = {
  init({ button, nav }) {
    button.addEventListener('click', (event) => {
      this._toggleDrawer(event, nav, button);
    });

    document.addEventListener('click', (event) => {
      const isClickInsideDrawer = nav.contains(event.target);
      const isClickOnButton = button.contains(event.target);

      if (!isClickInsideDrawer && !isClickOnButton && nav.classList.contains('open')) {
        this._closeDrawer(nav, button);
      }
    });


    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && nav.classList.contains('open')) {
        this._closeDrawer(nav, button);
        button.focus();
      }
    });

    window.addEventListener('hashchange', () => {
      if (nav.classList.contains('open')) {
        this._closeDrawer(nav, button);
      }
      this._updateNavVisibility();
    });

 
    const handleLogout = (event) => {
      if (event.target.id === 'logout-btn' || event.target.closest('#logout-btn')) {
        event.preventDefault();
        if (confirm('Apakah Anda yakin ingin logout?')) {
          StoryAPI.logout();
        }
      }
    };

    document.addEventListener('click', handleLogout);

 
    document.addEventListener('keypress', (event) => {
      if ((event.key === 'Enter' || event.key === ' ') &&
          (event.target.id === 'logout-btn' || event.target.closest('#logout-btn'))) {
        event.preventDefault();
        if (confirm('Apakah Anda yakin ingin logout?')) {
          StoryAPI.logout();
        }
      }
    });

    this._updateNavVisibility();
  },

  _updateNavVisibility() {
    const authOnlyItems = document.querySelectorAll('.auth-only');
    const isAuthenticated = StoryAPI.isAuthenticated();

    authOnlyItems.forEach(item => {
      if (isAuthenticated) {
        item.style.display = '';
      } else {
        item.style.display = 'none';
      }
    });
  },

  _toggleDrawer(event, nav, button) {
    event.stopPropagation();
    
    if (nav.classList.contains('open')) {
      this._closeDrawer(nav, button);
    } else {
      this._openDrawer(nav, button);
    }
  },

  _openDrawer(nav, button) {
    nav.classList.add('open');
    button.setAttribute('aria-expanded', 'true');
  },

  _closeDrawer(nav, button) {
    nav.classList.remove('open');
    button.setAttribute('aria-expanded', 'false');
  },
};

export default DrawerInitiator;

