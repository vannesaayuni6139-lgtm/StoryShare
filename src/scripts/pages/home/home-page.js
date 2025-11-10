import HomeView from '../../views/home-view.js';
import HomePresenter from '../../presenters/home-presenter.js';

class HomePage {
  constructor() {
    this._view = new HomeView();
    this._presenter = new HomePresenter(this._view);
  }

  async render() {
    return this._view.getTemplate();
  }

  async afterRender() {
    // Wait for DOM to be fully ready
    await new Promise(resolve => setTimeout(resolve, 100));
    await this._presenter.loadStories();
  }
}

export default HomePage;
