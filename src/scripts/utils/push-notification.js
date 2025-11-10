import CONFIG from '../config.js';

class PushNotificationHelper {
  constructor() {
    this.registration = null;
    this.subscription = null;
  }


  isSupported() {
    return 'serviceWorker' in navigator && 
           'PushManager' in window && 
           'Notification' in window;
  }

  getPermission() {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  
  async requestPermission() {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported');
    }

    const permission = await Notification.requestPermission();
    return permission;
  }


  async init(serviceWorkerRegistration) {
    if (!this.isSupported()) {
      console.warn('Push notifications not supported');
      return false;
    }

    this.registration = serviceWorkerRegistration;

  
    const existingSubscription = await this.registration.pushManager.getSubscription();
    
    if (existingSubscription) {
      this.subscription = existingSubscription;
      console.log('Already subscribed to push notifications');
      return true;
    }

    return false;
  }


  async subscribe() {
    if (!this.registration) {
      throw new Error('Service Worker not registered');
    }

    if (this.getPermission() !== 'granted') {
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }
    }

    try {
    
      const vapidPublicKey = CONFIG.VAPID_PUBLIC_KEY;
      
      if (!vapidPublicKey) {
        throw new Error('VAPID public key not configured');
      }

      
      const convertedVapidKey = this.urlBase64ToUint8Array(vapidPublicKey);

    
      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });

      console.log('Subscribed to push notifications:', this.subscription);
      
      
      await this.sendSubscriptionToServer(this.subscription);

      return this.subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      throw error;
    }
  }

  async unsubscribe() {
    if (!this.subscription) {
      const existingSubscription = await this.registration?.pushManager.getSubscription();
      if (!existingSubscription) {
        console.log('Not subscribed to push notifications');
        return false;
      }
      this.subscription = existingSubscription;
    }

    try {
      await this.subscription.unsubscribe();
      console.log('Unsubscribed from push notifications');
      

      await this.removeSubscriptionFromServer(this.subscription);
      
      this.subscription = null;
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      throw error;
    }
  }

  async isSubscribed() {
    if (!this.registration) {
      return false;
    }

    const subscription = await this.registration.pushManager.getSubscription();
    return !!subscription;
  }

  
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }


  async sendSubscriptionToServer(subscription) {
    try {
    
      console.log('Subscription to be sent to server:', JSON.stringify(subscription));
      
      // Example implementation:
      // const response = await fetch(`${CONFIG.BASE_URL}/subscribe`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      //   },
      //   body: JSON.stringify(subscription)
      // });
      
      // if (!response.ok) {
      //   throw new Error('Failed to send subscription to server');
      // }
    } catch (error) {
      console.error('Error sending subscription to server:', error);
    }
  }

  
  async removeSubscriptionFromServer(subscription) {
    try {
      console.log('Removing subscription from server');
      
    } catch (error) {
      console.error('Error removing subscription from server:', error);
    }
  }

  
  async testNotification() {
    if (this.getPermission() !== 'granted') {
      await this.requestPermission();
    }

    if (this.getPermission() === 'granted') {
      new Notification('StoryShare', {
        body: 'Notifikasi push berhasil diaktifkan!',
        icon: '/favicon.png',
        badge: '/favicon.png',
        tag: 'test-notification',
        requireInteraction: false
      });
    }
  }
}

export default new PushNotificationHelper();