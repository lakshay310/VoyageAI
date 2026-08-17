// src/hooks/useNotifications.js
// Custom React hook that manages notifications for the entire app.
//
// What it does:
//   1. Fetches existing notifications from the REST API on login
//   2. Connects to Socket.io and listens for 'notification:new' events
//   3. When a new notification arrives in real-time, adds it to state
//      and shows a toast popup
//   4. Exposes helpers: markRead, markAll, remove, clearAll
//
// This hook is used inside NotificationBell and NotificationsPage.

import { useState, useEffect, useCallback } from 'react';
import { io }   from 'socket.io-client';
import toast    from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import * as notifService from '../services/notification.service';

// Connect to our backend Socket.io server
// Vite's proxy handles the /socket.io path automatically
const SOCKET_URL = 'http://localhost:5000';

const useNotifications = () => {
  const { user } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [loading,       setLoading]       = useState(false);

  // ── Fetch notifications from REST API ──────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await notifService.getNotifications();
      setNotifications(res.data.data.notifications);
      setUnreadCount(res.data.data.unreadCount);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // ── Connect Socket.io and listen for real-time notifications ───────────────
  useEffect(() => {
    if (!user) return;

    // Fetch existing notifications from REST API
    fetchNotifications();

    // Create a Socket.io connection to the backend
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });

    // Join the user's personal room so the backend knows who we are
    // Backend: io.to(userId).emit('notification:new', ...) targets this room
    socket.on('connect', () => {
      socket.emit('join', user.id);
    });

    // Listen for real-time notifications pushed from the backend
    socket.on('notification:new', (newNotif) => {
      // Prepend new notification to the list (newest first)
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Show a toast popup with the notification title
      toast(`🔔 ${newNotif.title}`, {
        duration: 4000,
        style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155' },
      });
    });

    // Cleanup: disconnect socket when user logs out or component unmounts
    return () => {
      socket.disconnect();
    };
  }, [user, fetchNotifications]);

  // ── Actions ────────────────────────────────────────────────────────────────

  /** Mark a single notification as read */
  const markRead = async (id) => {
    await notifService.markOneRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  /** Mark all notifications as read */
  const markAll = async () => {
    await notifService.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  /** Delete a single notification */
  const remove = async (id) => {
    const notif = notifications.find((n) => n.id === id);
    await notifService.deleteNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (notif && !notif.isRead) setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  /** Clear all notifications */
  const clearAll = async () => {
    await notifService.clearAllNotifications();
    setNotifications([]);
    setUnreadCount(0);
  };

  return {
    notifications,
    unreadCount,
    loading,
    markRead,
    markAll,
    remove,
    clearAll,
    refresh: fetchNotifications,
  };
};

export default useNotifications;
