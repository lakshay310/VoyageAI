// src/controllers/expense.controller.js
// HTTP layer for expense operations — reads req, calls service, sends response.

const expenseService = require('../services/expense.service');
const { sendSuccess } = require('../utils/response');

/**
 * POST /api/trips/:tripId/expenses
 * Add a new expense to a trip.
 */
const createExpense = async (req, res, next) => {
  try {
    const expense = await expenseService.createExpense(
      req.params.tripId,
      req.user.id,
      req.body
    );
    return sendSuccess(res, 'Expense added successfully!', expense, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/trips/:tripId/expenses
 * Get all expenses for a specific trip.
 */
const getExpenses = async (req, res, next) => {
  try {
    const expenses = await expenseService.getExpensesForTrip(
      req.params.tripId,
      req.user.id
    );
    return sendSuccess(res, 'Expenses fetched successfully.', expenses);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/trips/:tripId/expenses/summary
 * Get expense totals grouped by category (for chart/dashboard).
 */
const getExpenseSummary = async (req, res, next) => {
  try {
    const summary = await expenseService.getExpenseSummary(
      req.params.tripId,
      req.user.id
    );
    return sendSuccess(res, 'Expense summary fetched.', summary);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/expenses/:id
 * Update an expense.
 */
const updateExpense = async (req, res, next) => {
  try {
    const expense = await expenseService.updateExpense(
      req.params.id,
      req.user.id,
      req.body
    );
    return sendSuccess(res, 'Expense updated successfully.', expense);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/expenses/:id
 * Delete an expense.
 */
const deleteExpense = async (req, res, next) => {
  try {
    await expenseService.deleteExpense(req.params.id, req.user.id);
    return sendSuccess(res, 'Expense deleted successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createExpense,
  getExpenses,
  getExpenseSummary,
  updateExpense,
  deleteExpense,
};
