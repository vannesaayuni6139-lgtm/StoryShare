import StoryAPI from '../data/api.js';

class HomePresenter {
  constructor(view) {
    this._view = view;
  }

  async loadStories() {
    try {
      this._view.showLoading();
      const stories = await StoryAPI.getAllStories();
      this._view.showStories(stories);
    } catch (error) {
      this._view.showError(error.message);
    }
  }

  handleStoryClick(storyId, stories) {
    const story = stories.find(s => s.id === storyId);
    if (story) {
      this._view.highlightStory(story);
    }
  }
}

export default HomePresenter;

