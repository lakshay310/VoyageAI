// src/services/expense.service.js
// All API calls related to expenses.
// Expenses are always linked to a specific trip (tripId).
// Each function maps to one backend REST endpoint.

import api from './api';

/**
 * Get all expenses for a trip.
 * GET /api/trips/:tripId/expenses
 */
export const getExpenses = (tripId) =>
  api.get(`/trips/${tripId}/expenses`);

/**
 * Get expense breakdown by category (for charts/stats).
 * GET /api/trips/:tripId/expenses/summary
 */
export const getExpenseSummary = (tripId) =>
  api.get(`/trips/${tripId}/expenses/summary`);

/**
 * Add a new expense to a trip.
 * POST /api/trips/:tripId/expenses
 * Body: { title, amount, category, date?, notes? }
 */
export const createExpense = (tripId, data) =>
  api.post(`/trips/${tripId}/expenses`, data);

/**
 * Update an existing expense.
 * PUT /api/expenses/:id
 * Body: partial { title?, amount?, category?, date?, notes? }
 */
export const updateExpense = (id, data) =>
  api.put(`/expenses/${id}`, data);

/**
 * Delete an expense.
 * DELETE /api/expenses/:id
 */
export const deleteExpense = (id) =>
  api.delete(`/expenses/${id}`);
