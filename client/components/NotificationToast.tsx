import React, { useState, useEffect } from 'react';
import { X, Bell } from 'lucide-react';

interface NotificationData {
  id: string;
  title: string;
  body: string;
  url?: string;
  timestamp: number;
}

interface NotificationToastProps {
  notifications: NotificationData[];
  onDismiss: (id: string) => void;
  onNavigate: (url?: string) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notifications,
  onDismiss,
  onNavigate,
}) => {
  return (
    <div className="fixed top-4 right-4 left-4 sm:left-auto space-y-3 pointer-events-none" style={{ zIndex: 99999 }}>
      <div className="flex flex-col items-end space-y-3 pointer-events-none">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onDismiss={onDismiss}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </div>
  );
};

interface NotificationItemProps {
  notification: NotificationData;
  onDismiss: (id: string) => void;
  onNavigate: (url?: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onDismiss,
  onNavigate,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 100);
    
    // Auto dismiss after 10 seconds (test için uzatıldı)
    const dismissTimer = setTimeout(() => {
      handleDismiss();
    }, 10000);

    return () => {
      clearTimeout(timer);
      clearTimeout(dismissTimer);
    };
  }, []);

  const handleDismiss = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onDismiss(notification.id);
    }, 300);
  };

  const handleClick = () => {
    onNavigate(notification.url);
    handleDismiss();
  };

  return (
    <div
      className={`
        max-w-sm w-full sm:max-w-xs bg-white rounded-xl shadow-2xl border border-gray-200
        transform transition-all duration-300 ease-in-out cursor-pointer pointer-events-auto
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95'}
        hover:shadow-2xl hover:scale-[1.02]
        ring-1 ring-black/10
      `}
      onClick={handleClick}
    >
      {/* Gradient border */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 via-blue-500/30 to-indigo-500/30 rounded-xl p-[1px]">
        <div className="bg-white rounded-xl h-full w-full" />
      </div>
      
      <div className="relative p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg animate-pulse">
              <Bell className="w-5 h-5 text-white drop-shadow-sm" />
            </div>
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {notification.title}
                </p>
                <p className="text-sm text-gray-700 mt-1 line-clamp-2 leading-relaxed">
                  {notification.body}
                </p>
                <p className="text-xs text-gray-500 mt-2 font-medium">
                  {new Date(notification.timestamp).toLocaleTimeString('tr-TR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDismiss();
                }}
                className="ml-3 flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-all duration-200"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="relative h-1 bg-gray-100/50 rounded-b-xl overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-purple-500 to-blue-600 rounded-b-xl animate-shrink-width"
          style={{ 
            animation: 'shrink-width 5s linear forwards'
          }}
        />
      </div>
      
      <style jsx>{`
        @keyframes shrink-width {
          from { width: 100%; }
          to { width: 0%; }
        }
        .animate-shrink-width {
          animation: shrink-width 5s linear forwards;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};