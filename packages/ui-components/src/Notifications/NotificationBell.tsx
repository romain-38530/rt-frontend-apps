/**
 * Composant NotificationBell
 * Affiche une cloche avec badge de notifications non lues
 * Ouvre une dropdown avec la liste des notifications
 */

import React, { useState, useRef, useEffect } from 'react';

interface NotificationBellProps {
  unreadCount: number;
  onClick?: () => void;
  className?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  unreadCount,
  onClick,
  className = '',
}) => {
  const [isRinging, setIsRinging] = useState(false);
  const prevCountRef = useRef(unreadCount);

  // Animer la cloche quand le count augmente
  useEffect(() => {
    if (unreadCount > prevCountRef.current) {
      setIsRinging(true);
      const timer = setTimeout(() => setIsRinging(false), 1000);
      return () => clearTimeout(timer);
    }
    prevCountRef.current = unreadCount;
  }, [unreadCount]);

  return (
    <button
      onClick={onClick}
      className={`relative p-2 text-white hover:bg-white/20 rounded-lg transition-all ${className}`}
      style={{
        animation: isRinging ? 'wiggle 0.5s ease-in-out 2' : undefined,
      }}
      aria-label={`Notifications (${unreadCount} non lues)`}
    >
      {/* Icône cloche */}
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>

      {/* Badge de compteur */}
      {unreadCount > 0 && (
        <span
          className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
          style={{
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}

      {/* Point de notification (pour petits écrans) */}
      {unreadCount > 0 && (
        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
      )}
    </button>
  );
};

export default NotificationBell;
