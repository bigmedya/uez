/**
 * OneSignal Notifications React Hook
 * OneSignal web push bildirimleri için React hook
 */

import { useState, useEffect, useCallback } from 'react';
import { oneSignalService } from '../lib/onesignal';

export interface OneSignalStats {
  totalSubscribers: number;
  activeSubscribers: number;
  clickRate: number;
  deliveryRate: number;
}

export interface UseOneSignalNotificationsReturn {
  // States
  isSupported: boolean;
  isLoading: boolean;
  isSubscribed: boolean;
  userId: string | null;
  permission: 'granted' | 'denied' | 'default';
  error: string | null;
  
  // Actions
  requestPermission: () => Promise<boolean>;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  sendTestNotification: () => Promise<boolean>;
  getTags: () => Promise<Record<string, string> | null>;
  sendTags: (tags: Record<string, string>) => Promise<boolean>;
  getStats: () => Promise<OneSignalStats | null>;
  
  // Utils
  clearError: () => void;
  refresh: () => Promise<void>;
}

export const useOneSignalNotifications = (): UseOneSignalNotificationsReturn => {
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [permission, setPermission] = useState<'granted' | 'denied' | 'default'>('default');
  const [error, setError] = useState<string | null>(null);

  // OneSignal durumunu kontrol et
  const checkOneSignalStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // OneSignal'ı başlat
      const initialized = await oneSignalService.init();
      setIsSupported(initialized);

      if (!initialized) {
        setIsLoading(false);
        return;
      }

      // İzin durumunu kontrol et
      const currentPermission = await oneSignalService.getNotificationPermission();
      setPermission(currentPermission);

      // Abone durumunu kontrol et
      const subscribed = await oneSignalService.isSubscribed();
      setIsSubscribed(subscribed);

      // User ID'yi al
      const currentUserId = await oneSignalService.getUserId();
      setUserId(currentUserId);

    } catch (err) {
      const message = err instanceof Error ? err.message : 'OneSignal kontrol hatası';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // İzin iste
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      const granted = await oneSignalService.requestNotificationPermission();
      
      if (granted) {
        await checkOneSignalStatus(); // Durumu güncelle
      }
      
      return granted;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'İzin isteme hatası';
      setError(message);
      return false;
    }
  }, [checkOneSignalStatus]);

  // Abone ol
  const subscribe = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      
      // İlk önce izin iste
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        return false;
      }

      // Tekrar abone ol
      const success = await oneSignalService.resubscribe();
      
      if (success) {
        await checkOneSignalStatus(); // Durumu güncelle
      }
      
      return success;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Abonelik hatası';
      setError(message);
      return false;
    }
  }, [requestPermission, checkOneSignalStatus]);

  // Abonelikten çık
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      const success = await oneSignalService.unsubscribe();
      
      if (success) {
        await checkOneSignalStatus(); // Durumu güncelle
      }
      
      return success;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Abonelik iptal hatası';
      setError(message);
      return false;
    }
  }, [checkOneSignalStatus]);

  // Test bildirimi gönder
  const sendTestNotification = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      return await oneSignalService.sendTestNotification();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Test bildirimi hatası';
      setError(message);
      return false;
    }
  }, []);

  // Tag'ları al
  const getTags = useCallback(async (): Promise<Record<string, string> | null> => {
    try {
      setError(null);
      return await oneSignalService.getTags();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Tag alma hatası';
      setError(message);
      return null;
    }
  }, []);

  // Tag'ları gönder
  const sendTags = useCallback(async (tags: Record<string, string>): Promise<boolean> => {
    try {
      setError(null);
      return await oneSignalService.sendTags(tags);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Tag gönderme hatası';
      setError(message);
      return false;
    }
  }, []);

  // İstatistikleri al
  const getStats = useCallback(async (): Promise<OneSignalStats | null> => {
    try {
      setError(null);
      return await oneSignalService.getStats();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'İstatistik alma hatası';
      setError(message);
      return null;
    }
  }, []);

  // Hata temizle
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Durumu yenile
  const refresh = useCallback(async () => {
    await checkOneSignalStatus();
  }, [checkOneSignalStatus]);

  // Component mount olduğunda OneSignal'ı kontrol et
  useEffect(() => {
    checkOneSignalStatus();

    // OneSignal event listener'ları
    oneSignalService.onSubscriptionChange((subscribed: boolean) => {
      setIsSubscribed(subscribed);
      oneSignalService.getUserId().then(id => setUserId(id)).catch(() => {});
    });

    oneSignalService.onNotificationClick(() => {});

  }, [checkOneSignalStatus]);

  return {
    // States
    isSupported,
    isLoading,
    isSubscribed,
    userId,
    permission,
    error,
    
    // Actions
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification,
    getTags,
    sendTags,
    getStats,
    
    // Utils
    clearError,
    refresh,
  };
};