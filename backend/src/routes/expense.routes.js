// src/routes/expense.routes.js
// URL paths for expense endpoints.
//
// Like bookings, expenses use two mounting points:
//   1. Nested under trips:  /api/trips/:tripId/expenses  (create, list, summary)
//   2. Standalone:          /api/expenses/:id            (update, delete)

const express = require('express');

// mergeParams: true so we can read :tripId from the parent trip router
const nestedRouter = express.Router({ mergeParams: true });
const standaloneRouter = express.Router();

const expenseController = require('../controllers/expense.controller');
const { protect } = require('../middlewares/auth.middleware');
const { createExpenseValidator, updateExpenseValidator } = require('../validators/expense.validator');
const validate = require('../middlewares/validate.middleware');

// ── Nested routes (under /api/trips/:tripId/expenses) ────────────────────────
nestedRouter.use(protect);

// GET    /api/trips/:tripId/expenses/summary  → expense breakdown by category
// IMPORTANT: Define this BEFORE /:id routes to avoid conflicts
nestedRouter.get('/summary', expenseController.getExpenseSummary);

// POST   /api/trips/:tripId/expenses          → add an expense to a trip
nestedRouter.post('/', createExpenseValidator, validate, expenseController.createExpense);

// GET    /api/trips/:tripId/expenses          → list all expenses for a trip
nestedRouter.get('/', expenseController.getExpenses);

// ── Standalone routes (under /api/expenses) ───────────────────────────────────
standaloneRouter.use(protect);

// PUT    /api/expenses/:id   → update an expense
standaloneRouter.put('/:id', updateExpenseValidator, validate, expenseController.updateExpense);

// DELETE /api/expenses/:id   → delete an expense
standaloneRouter.delete('/:id', expenseController.deleteExpense);

module.exports = { nestedRouter, standaloneRouter };
