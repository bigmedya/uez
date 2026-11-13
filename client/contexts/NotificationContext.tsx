import React, { createContext, useContext } from 'react';
import { useOneSignalNotifications } from '@/hooks/useOneSignalNotifications';
import { useNotificationManager } from '@/hooks/useNotificationManager';
import { NotificationToast } from '@/components/NotificationToast';

interface NotificationContextValue {
  requestPermission: () => Promise<boolean>;
  isSupported: boolean;
  isLoading: boolean;
  error: string | null;
  isSubscribed: boolean;
  permission: NotificationPermission | null;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const {
    notifications,
    showNotification,
    dismissNotification,
    handleNavigate,
  } = useNotificationManager();

  const {
    requestPermission,
    isSupported,
    isLoading,
    error,
    isSubscribed,
    permission,
  } = useOneSignalNotifications();

  // OneSignal permission is 'granted' | 'denied' | 'default' -> map to NotificationPermission | null
  const permissionValue: NotificationPermission | null =
    permission === 'granted' || permission === 'denied' || permission === 'default' ? permission : null;

  const value: NotificationContextValue = {
    requestPermission,
    isSupported,
    isLoading,
    error,
    isSubscribed,
    permission: permissionValue,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationToast
        notifications={notifications}
        onDismiss={dismissNotification}
        onNavigate={handleNavigate}
      />
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return ctx;
}

export function useNotificationOptional() {
  return useContext(NotificationContext);
}
