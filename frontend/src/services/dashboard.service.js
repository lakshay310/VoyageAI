// src/services/dashboard.service.js
// API call to fetch the dashboard summary from the backend.

import api from './api';

/**
 * Fetch all dashboard data in one request.
 * Returns: { stats, recentTrips, recentExpenses }
 */
export const getDashboardData = () => api.get('/dashboard');
