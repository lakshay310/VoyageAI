// src/components/NotificationBell.jsx
// Bell icon shown in the Navbar with a red badge for unread notifications.
// Clicking it opens a dropdown with the latest 5 notifications.
// Hovering over a notification marks it as read.

import { useState, useRef, useEffect } from 'react';
import { useNavigate }                  from 'react-router-dom';
import useNotifications                 from '../hooks/useNotifications';

// Maps notification type to an emoji icon
const TYPE_ICON = {
  TRIP_CREATED:      '🧳',
  BOOKING_CONFIRMED: '🎫',
  EXPENSE_ADDED:     '💰',
  TRIP_REMINDER:     '⏰',
  WELCOME:           '👋',
  SUCCESS:           '✅',
  WARNING:           '⚠️',
  INFO:              '🔔',
};

const NotificationBell = () => {
  const navigate            = useNavigate();
  const [open, setOpen]     = useState(false);
  const dropdownRef         = useRef(null);

  const { notifications, unreadCount, markRead, markAll } = useNotifications();

  // Close the dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Show only the 5 most recent notifications in the dropdown
  const recent = notifications.slice(0, 5);

  return (
    <div className="relative" ref={dropdownRef}>

      {/* ── Bell Button ─────────────────────────────────────────────────── */}
      <button
        id="notification-bell-btn"
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>

        {/* Red badge with unread count */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold
                           rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1
                           animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown Panel ──────────────────────────────────────────────── */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-gray-900 border border-gray-700 rounded-2xl
                        shadow-2xl z-50 overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <span className="font-bold text-white text-sm">Notifications</span>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAll}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => { setOpen(false); navigate('/notifications'); }}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                See all →
              </button>
            </div>
          </div>

          {/* Notification list */}
          {recent.length === 0 ? (
            <div className="py-8 text-center text-gray-500 text-sm">
              🔔 No notifications yet
            </div>
          ) : (
            <ul>
              {recent.map((n) => (
                <li
                  key={n.id}
                  onClick={() => { markRead(n.id); if (n.link) navigate(n.link); setOpen(false); }}
                  className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors
                    hover:bg-gray-800 border-b border-gray-800/50 last:border-0
                    ${!n.isRead ? 'bg-blue-950/30' : ''}`}
                >
                  {/* Icon */}
                  <span className="text-xl mt-0.5 shrink-0">
                    {TYPE_ICON[n.type] || '🔔'}
                  </span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${n.isRead ? 'text-gray-400' : 'text-white'}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-gray-600 mt-1">
                      {new Date(n.createdAt).toLocaleString('en-IN', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>

                  {/* Unread dot */}
                  {!n.isRead && (
                    <span className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
