/**
 * OneSignal Web Push Notifications Service
 * OneSignal ile web push bildirimleri yönetimi
 */

declare global {
  interface Window {
    OneSignal?: any;
    OneSignalDeferred?: any[];
  }
}

/** OneSignal yalnızca production domain'de çalışır; localhost'ta SDK init etmez. */
const ALLOWED_ORIGIN = "https://uluslararasiekonomizirvesi.org";
const ALLOW_LOCALHOST = import.meta.env.VITE_ONESIGNAL_ALLOW_LOCALHOST === "true";
/** Push izni ve OneSignal init sadece /m sayfasında çalışır. */
const ALLOWED_PATH = "/m";
const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID ?? "e6fd62b2-f120-4dba-8fff-cb23929d5952";

export class OneSignalService {
  private static instance: OneSignalService;
  private isInitialized = false;
  private isSupported = false;

  private constructor() {}

  public static getInstance(): OneSignalService {
    if (!OneSignalService.instance) {
      OneSignalService.instance = new OneSignalService();
    }
    return OneSignalService.instance;
  }

  /** Sadece izin verilen origin'de (ve isteğe bağlı localhost) OneSignal kullanılır. */
  private isAllowedOrigin(): boolean {
    if (typeof window === "undefined") return false;
    const origin = window.location.origin;
    if (origin === ALLOWED_ORIGIN) return true;
    if (ALLOW_LOCALHOST && (origin === "http://localhost:8082" || origin.startsWith("http://127.0.0.1") || origin.startsWith("http://localhost:"))) return true;
    return false;
  }

  /** OneSignal init ve push izni sadece /m sayfasında çalışır. */
  private isAllowedPath(): boolean {
    if (typeof window === "undefined") return false;
    return window.location.pathname === ALLOWED_PATH || window.location.pathname.startsWith(ALLOWED_PATH + "/");
  }

  /**
   * Init ve push izni sadece /m sayfasında yapılır; diğer sayfalarda false döner (isInitialized set edilmez).
   */
  public async init(): Promise<boolean> {
    if (this.isInitialized) {
      return this.isSupported;
    }

    if (!this.isAllowedPath()) {
      return false;
    }

    if (!this.isAllowedOrigin()) {
      this.isInitialized = true;
      this.isSupported = false;
      return false;
    }

    try {
      await this.waitForOneSignal();
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      await new Promise<void>((resolve, reject) => {
        window.OneSignalDeferred!.push(async (OneSignal: typeof window.OneSignal) => {
          try {
            if (OneSignal.context?.appId) {
              resolve();
              return;
            }
            await OneSignal.init({
              appId: ONESIGNAL_APP_ID,
              serviceWorkerPath: "/OneSignalSDK.sw.js",
              serviceWorkerUpdaterPath: "/OneSignalSDKUpdaterWorker.js",
              serviceWorkerParam: { scope: "/" },
            });
            resolve();
          } catch (err) {
            if ((err as Error)?.message?.includes('already initialized')) {
              resolve();
            } else {
              reject(err);
            }
          }
        });
      });
      if (typeof window.OneSignal?.isPushNotificationsSupported !== "function") {
        this.isInitialized = true;
        this.isSupported = false;
        return false;
      }
      this.isSupported = await window.OneSignal.isPushNotificationsSupported();
      if (!this.isSupported) {
        return false;
      }
      this.isInitialized = true;
      console.log('OneSignal başlatıldı');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * OneSignal SDK'sının yüklenmesini bekler
   */
  private async waitForOneSignal(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.OneSignal) {
        resolve();
        return;
      }

      let attempts = 0;
      const maxAttempts = 50; // 5 saniye bekle
      
      const checkOneSignal = () => {
        attempts++;
        
        if (window.OneSignal) {
          resolve();
        } else if (attempts >= maxAttempts) {
          reject(new Error('OneSignal SDK yüklenemedi'));
        } else {
          setTimeout(checkOneSignal, 100);
        }
      };

      checkOneSignal();
    });
  }

  /**
   * Kullanıcının izin durumunu kontrol eder
   */
  public async getNotificationPermission(): Promise<'granted' | 'denied' | 'default'> {
    if (!this.isInitialized) {
      await this.init();
    }

    if (!this.isSupported) {
      return 'denied';
    }

    try {
      return await window.OneSignal.getNotificationPermission();
    } catch {
      return 'denied';
    }
  }

  /**
   * Push bildirimlere abone olmak için izin ister
   */
  public async requestNotificationPermission(): Promise<boolean> {
    if (!this.isInitialized) {
      const initialized = await this.init();
      if (!initialized) return false;
    }

    try {
      const permission = await this.getNotificationPermission();
      
      if (permission === 'granted') return true;
      if (permission === 'denied') return false;

      const granted = await window.OneSignal.requestPermission();
      return granted;
    } catch {
      return false;
    }
  }

  /**
   * Kullanıcının OneSignal Player ID'sini alır
   */
  public async getUserId(): Promise<string | null> {
    if (!this.isInitialized) {
      const initialized = await this.init();
      if (!initialized) return null;
    }

    try {
      const userId = await window.OneSignal.getUserId();
      return userId;
    } catch {
      return null;
    }
  }

  /**
   * Kullanıcının abone durumunu kontrol eder
   */
  public async isSubscribed(): Promise<boolean> {
    if (!this.isInitialized) {
      const initialized = await this.init();
      if (!initialized) return false;
    }

    try {
      const subscribed = await window.OneSignal.isPushNotificationsEnabled();
      return subscribed;
    } catch {
      return false;
    }
  }

  /**
   * Push bildirimlerden aboneliği iptal eder
   */
  public async unsubscribe(): Promise<boolean> {
    if (!this.isInitialized) {
      const initialized = await this.init();
      if (!initialized) return false;
    }

    try {
      await window.OneSignal.setSubscription(false);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Push bildirimler için tekrar abone olur
   */
  public async resubscribe(): Promise<boolean> {
    if (!this.isInitialized) {
      const initialized = await this.init();
      if (!initialized) return false;
    }

    try {
      await window.OneSignal.setSubscription(true);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Kullanıcıya özel tag ekler
   */
  public async sendTags(tags: Record<string, string>): Promise<boolean> {
    if (!this.isInitialized) {
      const initialized = await this.init();
      if (!initialized) return false;
    }

    try {
      await window.OneSignal.sendTags(tags);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Kullanıcının mevcut tag'larını alır
   */
  public async getTags(): Promise<Record<string, string> | null> {
    if (!this.isInitialized) {
      const initialized = await this.init();
      if (!initialized) return null;
    }

    try {
      const tags = await window.OneSignal.getTags();
      return tags || {};
    } catch {
      return null;
    }
  }

  /**
   * Test bildirimi gönderir (sadece geliştirme için)
   */
  public async sendTestNotification(): Promise<boolean> {
    try {
      const response = await fetch('/api/onesignal/test-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (result.success) {
        return true;
      } else {
        return false;
      }
    } catch {
      return false;
    }
  }

  /**
   * OneSignal istatistiklerini alır
   */
  public async getStats() {
    try {
      const response = await fetch('/api/onesignal/stats');
      const result = await response.json();
      
      if (result.success) {
        return result.stats;
      } else {
        return null;
      }
    } catch {
      return null;
    }
  }

  /**
   * Bildirim click event listener ekler. Sadece izin verilen origin'de ve SDK hazırsa çalışır.
   */
  public onNotificationClick(callback: (event: any) => void): void {
    if (!this.isAllowedOrigin() || typeof window.OneSignal?.on !== "function") return;
    if (window.OneSignal) {
      window.OneSignal.on("notificationClick", callback);
    } else {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(() => {
        if (typeof window.OneSignal?.on === "function") {
          window.OneSignal.on("notificationClick", callback);
        }
      });
    }
  }

  /**
   * Subscription change event listener ekler. Sadece izin verilen origin'de ve SDK hazırsa çalışır.
   */
  public onSubscriptionChange(callback: (isSubscribed: boolean) => void): void {
    if (!this.isAllowedOrigin() || typeof window.OneSignal?.on !== "function") return;
    if (window.OneSignal) {
      window.OneSignal.on("subscriptionChange", callback);
    } else {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(() => {
        if (typeof window.OneSignal?.on === "function") {
          window.OneSignal.on("subscriptionChange", callback);
        }
      });
    }
  }
}

// Singleton instance
export const oneSignalService = OneSignalService.getInstance();

// Sadece izin verilen origin'de init et (localhost'ta sessizce atlanır)
if (typeof window !== "undefined") {
  oneSignalService.init().catch(() => {});
}