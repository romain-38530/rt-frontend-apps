import React, { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  onClose: (id: string) => void;
}

const toastStyles: Record<ToastType, { background: string; icon: string; border: string }> = {
  success: {
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    icon: '✓',
    border: '#059669',
  },
  error: {
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    icon: '✕',
    border: '#dc2626',
  },
  warning: {
    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    icon: '⚠',
    border: '#d97706',
  },
  info: {
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    icon: 'ℹ',
    border: '#2563eb',
  },
};

export const Toast: React.FC<ToastProps> = ({ id, message, type, duration = 4000, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 50);

    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onClose(id), 300);
    }, duration);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [duration, id, onClose]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onClose(id), 300);
  };

  const style = toastStyles[type];

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 16px',
        background: style.background,
        borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(0, 0, 0, 0.1)',
        color: 'white',
        minWidth: '320px',
        maxWidth: '450px',
        position: 'relative',
        overflow: 'hidden',
        transform: isExiting ? 'translateX(120%)' : 'translateX(0)',
        opacity: isExiting ? 0 : 1,
        transition: 'transform 0.3s ease, opacity 0.3s ease',
        animation: 'slideIn 0.3s ease',
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          fontWeight: 'bold',
          flexShrink: 0,
        }}
      >
        {style.icon}
      </div>

      {/* Message */}
      <div style={{ flex: 1, fontSize: '14px', lineHeight: '1.4' }}>
        {message}
      </div>

      {/* Close button */}
      <button
        onClick={handleClose}
        aria-label="Fermer la notification"
        style={{
          background: 'rgba(255, 255, 255, 0.2)',
          border: 'none',
          borderRadius: '6px',
          color: 'white',
          width: '24px',
          height: '24px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          flexShrink: 0,
          transition: 'background 0.2s',
        }}>
        ✕
      </button>

      {/* Progress bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: '3px',
          width: `${progress}%`,
          background: 'rgba(255, 255, 255, 0.4)',
          transition: 'width 0.05s linear',
        }}
      />
    </div>
  );
};

export default Toast;
