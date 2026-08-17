// src/services/notification.service.js
// Frontend API wrapper for all notification endpoints.
// Uses the shared axios instance which auto-attaches the JWT token.

import api from './api';

/** Fetch all notifications + unread count */
export const getNotifications = () => api.get('/notifications');

/** Mark a single notification as read */
export const markOneRead = (id) => api.patch(`/notifications/${id}/read`);

/** Mark all notifications as read */
export const markAllRead = () => api.patch('/notifications/read-all');

/** Delete a single notification */
export const deleteNotification = (id) => api.delete(`/notifications/${id}`);

/** Clear all notifications */
export const clearAllNotifications = () => api.delete('/notifications');
