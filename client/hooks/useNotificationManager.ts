import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface NotificationData {
  id: string;
  title: string;
  body: string;
  url?: string;
  timestamp: number;
}

export const useNotificationManager = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const navigate = useNavigate();

  const showNotification = useCallback((title: string, body: string, url?: string) => {
    const notification: NotificationData = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      title,
      body,
      url,
      timestamp: Date.now(),
    };

    setNotifications(prev => [...prev, notification]);

    // Also try to show browser notification if permission granted
    if (Notification.permission === 'granted') {
      try {
        const browserNotification = new Notification(title, {
          body,
          icon: '/favicon.ico',
          tag: notification.id,
        });

        browserNotification.onclick = () => {
          if (url) {
            window.focus();
            if (url.startsWith('http://') || url.startsWith('https://')) {
              window.open(url, '_blank', 'noopener,noreferrer');
            } else if (url.includes('.') && !url.startsWith('/')) {
              // Domain gibi görünüyorsa https ekle
              window.open(`https://${url}`, '_blank', 'noopener,noreferrer');
            } else {
              // Relative URL'ler için UEZ domain'ini kullan
              const uezDomain = import.meta.env.VITE_UEZ_DOMAIN || 'https://uluslararasiekonomizirvesi.org';
              window.open(uezDomain + url, '_blank', 'noopener,noreferrer');
            }
          }
          browserNotification.close();
        };

        // Auto close browser notification after 5 seconds
        setTimeout(() => {
          browserNotification.close();
        }, 5000);
      } catch {
        // ignore
      }
    }
  }, [navigate]);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const handleNavigate = useCallback((url?: string) => {
    if (!url) return;
    
    if (url.startsWith('http://') || url.startsWith('https://')) {
      // Tam URL
      window.open(url, '_blank', 'noopener,noreferrer');
    } else if (url.includes('.') && !url.startsWith('/')) {
      // Domain gibi görünüyorsa https ekle (bmag.com.tr → https://bmag.com.tr)
      window.open(`https://${url}`, '_blank', 'noopener,noreferrer');
    } else {
      // Relative URL'ler için UEZ domain'ini kullan (/hakkimizda → https://uez.../hakkimizda)
      const uezDomain = import.meta.env.VITE_UEZ_DOMAIN || 'https://uluslararasiekonomizirvesi.org';
      window.open(uezDomain + url, '_blank', 'noopener,noreferrer');
    }
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    showNotification,
    dismissNotification,
    handleNavigate,
    clearAllNotifications,
  };
};