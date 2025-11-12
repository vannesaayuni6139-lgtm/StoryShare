import CONFIG from '../config.js';

const ENDPOINTS = {
  REGISTER: `${CONFIG.BASE_URL}/register`,
  LOGIN: `${CONFIG.BASE_URL}/login`,
  STORIES: `${CONFIG.BASE_URL}/stories`,
  ADD_STORY: `${CONFIG.BASE_URL}/stories`,
};

class StoryAPI {
  static getToken() {
    return localStorage.getItem('authToken');
  }

  static setToken(token) {
    localStorage.setItem('authToken', token);
  }

  static removeToken() {
    localStorage.removeItem('authToken');
  }

  static isAuthenticated() {
    return !!this.getToken();
  }

  static async register({ name, email, password }) {
    try {
      const response = await fetch(ENDPOINTS.REGISTER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const responseJson = await response.json();

      if (!responseJson.error) {
        return responseJson;
      } else {
        throw new Error(responseJson.message);
      }
    } catch (error) {
      console.error('Error registering:', error);
      throw error;
    }
  }

  static async login({ email, password }) {
    try {
      const response = await fetch(ENDPOINTS.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const responseJson = await response.json();

      if (!responseJson.error) {
       
        this.setToken(responseJson.loginResult.token);
        
        
        localStorage.setItem('userId', responseJson.loginResult.userId);
        localStorage.setItem('userName', responseJson.loginResult.name);
       
        console.log(' Login berhasil, triggering user-logged-in event');
        window.dispatchEvent(new CustomEvent('user-logged-in', {
          detail: {
            userId: responseJson.loginResult.userId,
            userName: responseJson.loginResult.name,
            token: responseJson.loginResult.token
          }
        }));
        
        return responseJson.loginResult;
      } else {
        throw new Error(responseJson.message);
      }
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  }


  static logout() {
    console.log(' Logging out user');
    
 
    this.removeToken();
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    

    window.dispatchEvent(new Event('user-logged-out'));
    

    window.location.hash = '#/login';
    

    setTimeout(() => {
      window.location.reload();
    }, 100);
  }

  static async getAllStories() {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('Please login first');
      }


      const response = await fetch(`${ENDPOINTS.STORIES}?location=1`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const responseJson = await response.json();

      if (!responseJson.error) {
        return responseJson.listStory;
      } else {
        if (responseJson.message === 'Missing authentication' || 
            responseJson.message === 'Invalid token signature') {
          this.logout();
        }
        throw new Error(responseJson.message);
      }
    } catch (error) {
      console.error('Error fetching stories:', error);
      throw error;
    }
  }

  static async addStory({ description, photo, lat, lon }) {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('Please login first');
      }

      const formData = new FormData();
      formData.append('description', description);
      formData.append('photo', photo);

      if (lat && lon) {
        formData.append('lat', lat);
        formData.append('lon', lon);
      }

      const response = await fetch(ENDPOINTS.ADD_STORY, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const responseJson = await response.json();

      if (!responseJson.error) {
        console.log(' Story berhasil ditambahkan');

        window.dispatchEvent(new CustomEvent('story-added', {
          detail: {
            message: responseJson.message,
            timestamp: new Date().toISOString()
          }
        }));
        
        return responseJson;
      } else {
        if (responseJson.message === 'Missing authentication' || 
            responseJson.message === 'Invalid token signature') {
          this.logout();
        }
        throw new Error(responseJson.message);
      }
    } catch (error) {
      console.error('Error adding story:', error);
      throw error;
    }
  }


  static getUserInfo() {
    return {
      userId: localStorage.getItem('userId'),
      userName: localStorage.getItem('userName'),
      token: this.getToken()
    };
  }


  static async validateToken() {
    try {
      const token = this.getToken();
      if (!token) {
        return false;
      }


      const response = await fetch(`${ENDPOINTS.STORIES}?size=1`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const responseJson = await response.json();
      
      if (responseJson.error) {
      
        this.logout();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating token:', error);
      return false;
    }
  }
}

export default StoryAPI;