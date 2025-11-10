import HomePage from '../pages/home/home-page.js';
import AddStoryPage from '../pages/add-story/add-story-page.js';
import LoginPage from '../pages/login/login-page.js';
import FavoritesPage from '../pages/favorites/favorites-page.js';

const routes = {
  '/': HomePage,
  '/add-story': AddStoryPage,
  '/favorites': FavoritesPage,
  '/login': LoginPage,
};

export default routes;

