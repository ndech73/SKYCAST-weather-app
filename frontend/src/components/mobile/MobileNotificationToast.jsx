import React, { useState, useEffect, useCallback } from 'react';
import { subscribeToNotifications } from '../../events/notificationEvents';

const MobileNotificationToast = () => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((notification) => {
    const id = notification.id || Date.now();
    setNotifications(prev => [...prev, { ...notification, id }]);

    // Auto-dismiss after 8 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 8000);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToNotifications(addNotification);
    return unsubscribe;
  }, [addNotification]);

  const dismiss = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '4.5rem',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      width: '90%',
      maxWidth: '420px',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      pointerEvents: 'auto'
    }}>
      {notifications.map((notif) => (
        <div
          key={notif.id}
          onClick={() => dismiss(notif.id)}
          style={{
            background: getToastColor(notif.type),
            color: 'white',
            padding: '0.75rem 1rem',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
            animation: 'slideDown 0.25s ease',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
          }}
        >
          <span style={{ fontSize: '1.4rem' }}>{getToastIcon(notif.type)}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: '0.25rem' }}>
              {notif.title || 'Notification'}
            </div>
            <div style={{ fontSize: '0.85rem', opacity: 0.95, whiteSpace: 'pre-wrap' }}>
              {notif.message}
            </div>
          </div>
          <span style={{ opacity: 0.85, fontSize: '1.1rem', paddingLeft: '0.5rem' }}>✕</span>
        </div>
      ))}

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

const getToastColor = (type) => {
  switch (type) {
    case 'success': return 'linear-gradient(135deg, #38a169, #2f855a)';
    case 'warning': return 'linear-gradient(135deg, #dd6b20, #c05621)';
    case 'error': return 'linear-gradient(135deg, #e53e3e, #c53030)';
    case 'weather-alert': return 'linear-gradient(135deg, #d69e2e, #b7791f)';
    default: return 'linear-gradient(135deg, #667eea, #764ba2)';
  }
};

const getToastIcon = (type) => {
  switch (type) {
    case 'success': return '✅';
    case 'warning': return '⚠️';
    case 'error': return '❌';
    case 'weather-alert': return '🌩️';
    default: return '🔔';
  }
};

export default MobileNotificationToast;