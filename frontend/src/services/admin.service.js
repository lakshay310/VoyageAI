// src/services/admin.service.js
// Frontend API wrappers for all Admin endpoints.
// Protected by backend role check (requires ADMIN role).

import api from './api';

/** Get full dashboard overview (stats + recent users + recent bookings) */
export const getAdminOverview = () => api.get('/admin/overview');

/** Get just the KPI stats */
export const getAdminStats = () => api.get('/admin/stats');

/** Get paginated list of all users */
export const getAdminUsers = (params) => api.get('/admin/users', { params });

/** Promote or demote a user's role */
export const updateUserRole = (userId, role) =>
  api.patch(`/admin/users/${userId}/role`, { role });

/** Delete a user from the platform */
export const deleteUser = (userId) => api.delete(`/admin/users/${userId}`);
