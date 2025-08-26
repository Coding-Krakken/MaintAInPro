/**
 * PWA Service - Manages Progressive Web App functionality
 * Handles service worker registration, update notifications, and app install prompts
 */

interface InstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export interface PWAStatus {
  isInstallable: boolean;
  isInstalled: boolean;
  hasUpdate: boolean;
  isOnline: boolean;
  serviceWorkerReady: boolean;
}

export class PWAService {
  private static instance: PWAService;
  private installPromptEvent: InstallPromptEvent | null = null;
  private registration: ServiceWorkerRegistration | null = null;
  private listeners: Map<string, ((_data: unknown) => void)[]> = new Map();
  private status: PWAStatus = {
    isInstallable: false,
    isInstalled: false,
    hasUpdate: false,
    isOnline: navigator.onLine,
    serviceWorkerReady: false,
  };

  private constructor() {
    // Only setup event listeners, don't auto-initialize
    this.setupEventListeners();
    this.checkInstallStatus();
  }

  public static getInstance(): PWAService {
    if (!PWAService.instance) {
      PWAService.instance = new PWAService();
    }
    return PWAService.instance;
  }

  /**
   * Initialize PWA service and register service worker
   */
  async initialize(): Promise<void> {
    try {
      if ('serviceWorker' in navigator) {
        await this.registerServiceWorker();
      }

      await this.setupInstallPrompt();
      this.setupBackgroundSync();
      this.setupPushNotifications();

      console.log('PWA service initialized successfully');
    } catch (_error) {
      console.error('Failed to initialize PWA service:', _error);
    }
  }

  /**
   * Register service worker
   */
  private async registerServiceWorker(): Promise<void> {
    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      });

      console.log('Service worker registered:', this.registration);
      this.status.serviceWorkerReady = true;
      this.notifyListeners('statusChange', this.status);

      // Handle service worker updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration?.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.status.hasUpdate = true;
              this.notifyListeners('updateAvailable', newWorker);
              this.showUpdateNotification();
            }
          });
        }
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', event => {
        this.handleServiceWorkerMessage(event.data);
      });

      // Notify when service worker is ready
      await navigator.serviceWorker.ready;
      console.log('Service worker is ready');
    } catch (_error) {
      console.error('Service worker registration failed:', _error);
    }
  }

  /**
   * Setup install prompt handling
   */
  private async setupInstallPrompt(): Promise<void> {
    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', event => {
      event.preventDefault();
      this.installPromptEvent = event as InstallPromptEvent;
      this.status.isInstallable = true;
      this.notifyListeners('installable', true);
      console.log('App is installable');
    });

    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      this.status.isInstalled = true;
      this.status.isInstallable = false;
      this.notifyListeners('installed', true);
      console.log('App was installed');
    });
  }

  /**
   * Setup background sync
   */
  private setupBackgroundSync(): void {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      // Register for background sync when actions are queued
      this.addEventListener('offlineAction', () => {
        this.requestBackgroundSync('offline-actions-sync');
      });
    }
  }

  /**
   * Setup push notifications
   */
  private async setupPushNotifications(): Promise<void> {
    if ('Notification' in window && 'PushManager' in window) {
      // Check current permission status
      const permission = Notification.permission;
      console.log('Notification permission:', permission);

      if (permission === 'granted' && this.registration) {
        // Subscribe to push notifications
        try {
          // Try to get existing subscription first
          let subscription = await this.registration.pushManager.getSubscription();

          if (!subscription) {
            // Create new subscription with VAPID key (for demo purposes)
            const vapidPublicKey = this.getVapidPublicKey();
            subscription = await this.registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
                .buffer as ArrayBuffer,
            });
          }

          // Send subscription to server
          await this.sendSubscriptionToServer(subscription);

          // Update status
          this.status.serviceWorkerReady = true;
          this.notifyListeners('statusUpdate', this.status);
        } catch (error) {
          console.error('Push subscription failed:', error);
        }
      }
    }
  }

  /**
   * Get VAPID public key (in production this would come from config)
   */
  private getVapidPublicKey(): string {
    // For development/demo purposes. In production, this should be from environment variables
    return (
      process.env.VITE_VAPID_PUBLIC_KEY ||
      'BEl62iUYgUivxIkv69yViEuiBIa40HI80NM2eCFBXk2X8TZAEj9DsRPt7t8EG8ZhFZyOkS_Km7HBQZ_KNFxvq7s'
    );
  }

  /**
   * Send subscription to server
   */
  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      const userId = localStorage.getItem('userId') || 'anonymous';

      const response = await fetch('/api/push-subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          p256dhKey: subscription.getKey('p256dh')
            ? btoa(
                String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh') as ArrayBuffer))
              )
            : '',
          authKey: subscription.getKey('auth')
            ? btoa(
                String.fromCharCode(...new Uint8Array(subscription.getKey('auth') as ArrayBuffer))
              )
            : '',
          userAgent: navigator.userAgent,
        }),
      });

      if (response.ok) {
        console.log('Push subscription sent to server successfully');
      } else {
        console.error('Failed to send push subscription to server');
      }
    } catch (error) {
      console.error('Error sending subscription to server:', error);
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribeFromPushNotifications(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      if (subscription) {
        const success = await subscription.unsubscribe();

        if (success) {
          // Notify server about unsubscription
          await this.removeSubscriptionFromServer(subscription);
          console.log('Successfully unsubscribed from push notifications');
        }

        return success;
      }
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
    }

    return false;
  }

  /**
   * Remove subscription from server
   */
  private async removeSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
    try {
      await fetch('/api/push-subscriptions', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
        }),
      });
    } catch (error) {
      console.error('Error removing subscription from server:', error);
    }
  }

  /**
   * Get current push subscription status
   */
  async getPushSubscriptionStatus(): Promise<{
    supported: boolean;
    granted: boolean;
    subscribed: boolean;
    subscription?: PushSubscription;
  }> {
    if (!('Notification' in window) || !('PushManager' in window)) {
      return { supported: false, granted: false, subscribed: false };
    }

    const permission = Notification.permission;
    const granted = permission === 'granted';

    let subscribed = false;
    let subscription: PushSubscription | undefined;

    if (granted && this.registration) {
      subscription = await this.registration.pushManager.getSubscription();
      subscribed = !!subscription;
    }

    return {
      supported: true,
      granted,
      subscribed,
      subscription,
    };
  }

  /**
   * Request install prompt
   */
  async showInstallPrompt(): Promise<boolean> {
    if (!this.installPromptEvent) {
      console.log('Install prompt not available');
      return false;
    }

    try {
      await this.installPromptEvent.prompt();
      const result = await this.installPromptEvent.userChoice;

      this.installPromptEvent = null;
      this.status.isInstallable = false;

      if (result.outcome === 'accepted') {
        console.log('User accepted install prompt');
        return true;
      } else {
        console.log('User dismissed install prompt');
        return false;
      }
    } catch (_error) {
      console.error('Install prompt failed:', _error);
      return false;
    }
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.log('Notifications not supported');
      return 'denied';
    }

    let permission = Notification.permission;

    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    return permission;
  }

  /**
   * Show local notification
   */
  async showNotification(title: string, options: NotificationOptions = {}): Promise<void> {
    const permission = await this.requestNotificationPermission();

    if (permission === 'granted') {
      if (this.registration) {
        await this.registration.showNotification(title, {
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          ...options,
        });
      } else {
        new Notification(title, {
          icon: '/icon-192.png',
          ...options,
        });
      }
    }
  }

  /**
   * Request background sync
   */
  async requestBackgroundSync(tag: string): Promise<void> {
    if (this.registration && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        interface ServiceWorkerRegistrationWithSync extends ServiceWorkerRegistration {
          sync?: {
            register(_tag: string): Promise<void>;
          };
        }
        await (this.registration as ServiceWorkerRegistrationWithSync).sync?.register(tag);
        console.log(`Background sync registered: ${tag}`);
      } catch (_error) {
        console.error('Background sync registration failed:', _error);
      }
    }
  }

  /**
   * Check if app is installed
   */
  private checkInstallStatus(): void {
    // Check if running in standalone mode (installed)
    this.status.isInstalled =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as { standalone?: boolean }).standalone ||
      document.referrer.includes('android-app://');
  }

  /**
   * Handle service worker messages
   */
  private handleServiceWorkerMessage(data: unknown): void {
    console.log('Message from service worker:', data);

    const messageData = data as { type?: string };
    switch (messageData.type) {
      case 'SYNC_STATUS':
        this.notifyListeners('syncStatus', data);
        break;
      case 'CACHE_UPDATED':
        this.notifyListeners('cacheUpdated', data);
        break;
      default:
        this.notifyListeners('message', data);
    }
  }

  /**
   * Show update notification
   */
  private showUpdateNotification(): void {
    this.showNotification('App Update Available', {
      body: 'A new version of MaintainPro is available. Tap to update.',
      tag: 'app-update',
      requireInteraction: true,
    });
  }

  /**
   * Update service worker
   */
  async updateServiceWorker(): Promise<void> {
    if (this.registration) {
      try {
        await this.registration.update();
        window.location.reload();
      } catch (_error) {
        console.error('Service worker update failed:', _error);
      }
    }
  }

  /**
   * Get PWA status
   */
  getStatus(): PWAStatus {
    return { ...this.status };
  }

  /**
   * Add event listener
   */
  addEventListener(event: string, callback: (_data: unknown) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    this.listeners.get(event)?.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Notify all listeners for an event
   */
  private notifyListeners(event: string, data: unknown): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  /**
   * Setup network status listeners
   */
  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      this.status.isOnline = true;
      this.notifyListeners('networkChange', { isOnline: true });
    });

    window.addEventListener('offline', () => {
      this.status.isOnline = false;
      this.notifyListeners('networkChange', { isOnline: false });
    });
  }

  /**
   * Convert VAPID key to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

  /**
   * Install the app
   */
  async installApp(): Promise<boolean> {
    return this.showInstallPrompt();
  }

  /**
   * Update the app
   */
  async updateApp(): Promise<void> {
    return this.updateServiceWorker();
  }

  /**
   * Remove event listener
   */
  removeEventListener(event: string, callback: (_data: unknown) => void): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }
}

// Create singleton instance
export const pwaService = PWAService.getInstance();
