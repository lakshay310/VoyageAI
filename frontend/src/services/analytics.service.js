// src/services/analytics.service.js
// Frontend API wrappers for all Analytics endpoints.

import api from './api';

/** Full analytics (all sections in one call) */
export const getFullAnalytics = () => api.get('/analytics');

/** Just the KPI summary numbers */
export const getAnalyticsSummary = () => api.get('/analytics/summary');

/** Spending by category + monthly trend */
export const getSpendingAnalytics = () => api.get('/analytics/spending');

/** Trip breakdown + upcoming trips */
export const getTripAnalytics = () => api.get('/analytics/trips');

/** Budget vs actual per trip */
export const getBudgetAnalytics = () => api.get('/analytics/budget');
