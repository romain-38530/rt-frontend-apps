'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Toast, ToastType } from './Toast';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toast: {
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
  };
  showToast: (message: string, type: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    // Return a fallback that uses console.log if no provider
    return {
      toast: {
        success: (message: string) => console.log('[Toast Success]', message),
        error: (message: string) => console.error('[Toast Error]', message),
        warning: (message: string) => console.warn('[Toast Warning]', message),
        info: (message: string) => console.info('[Toast Info]', message),
      },
      showToast: (message: string, type: ToastType) => console.log(`[Toast ${type}]`, message),
    };
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  maxToasts?: number;
}

const positionStyles: Record<string, React.CSSProperties> = {
  'top-right': { top: '20px', right: '20px' },
  'top-left': { top: '20px', left: '20px' },
  'bottom-right': { bottom: '20px', right: '20px' },
  'bottom-left': { bottom: '20px', left: '20px' },
  'top-center': { top: '20px', left: '50%', transform: 'translateX(-50%)' },
  'bottom-center': { bottom: '20px', left: '50%', transform: 'translateX(-50%)' },
};

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  position = 'top-right',
  maxToasts = 5,
}) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const generateId = () => `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const showToast = useCallback((message: string, type: ToastType, duration?: number) => {
    const id = generateId();
    setToasts((prev) => {
      const newToasts = [...prev, { id, message, type, duration }];
      // Keep only the last maxToasts
      return newToasts.slice(-maxToasts);
    });
  }, [maxToasts]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (message: string, duration?: number) => showToast(message, 'success', duration),
    error: (message: string, duration?: number) => showToast(message, 'error', duration),
    warning: (message: string, duration?: number) => showToast(message, 'warning', duration),
    info: (message: string, duration?: number) => showToast(message, 'info', duration),
  };

  return (
    <ToastContext.Provider value={{ toast, showToast }}>
      {children}

      {/* Toast Container */}
      <div
        style={{
          position: 'fixed',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          pointerEvents: 'none',
          ...positionStyles[position],
        }}
      >
        <style>
          {`
            @keyframes slideIn {
              from {
                transform: translateX(120%);
                opacity: 0;
              }
              to {
                transform: translateX(0);
                opacity: 1;
              }
            }
          `}
        </style>
        {toasts.map((t) => (
          <div key={t.id} style={{ pointerEvents: 'auto' }}>
            <Toast
              id={t.id}
              message={t.message}
              type={t.type}
              duration={t.duration}
              onClose={removeToast}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
