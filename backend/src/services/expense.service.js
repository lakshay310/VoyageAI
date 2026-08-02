// src/services/expense.service.js
// Business logic for expenses.
// Expenses belong to a trip; we always verify trip ownership first.

const expenseRepository = require('../repositories/expense.repository');
const tripRepository = require('../repositories/trip.repository');

/**
 * Helper: verify the trip exists and belongs to the requesting user.
 */
const verifyTripOwnership = async (tripId, userId) => {
  const trip = await tripRepository.findById(tripId);

  if (!trip) {
    const error = new Error('Trip not found.');
    error.statusCode = 404;
    throw error;
  }

  if (trip.userId !== userId) {
    const error = new Error('You are not allowed to access this trip.');
    error.statusCode = 403;
    throw error;
  }

  return trip;
};

/**
 * Add a new expense to a trip.
 */
const createExpense = async (tripId, userId, body) => {
  await verifyTripOwnership(tripId, userId);

  const { title, amount, category, date, notes } = body;

  return expenseRepository.create({
    title,
    amount: parseFloat(amount),
    category,
    date: date ? new Date(date) : new Date(), // default to today
    notes,
    tripId,
  });
};

/**
 * Get all expenses for a trip.
 */
const getExpensesForTrip = async (tripId, userId) => {
  await verifyTripOwnership(tripId, userId);
  return expenseRepository.findAllByTrip(tripId);
};

/**
 * Update an expense.
 */
const updateExpense = async (expenseId, userId, body) => {
  const expense = await expenseRepository.findById(expenseId);

  if (!expense) {
    const error = new Error('Expense not found.');
    error.statusCode = 404;
    throw error;
  }

  await verifyTripOwnership(expense.tripId, userId);

  const updateData = {};
  if (body.title)    updateData.title    = body.title;
  if (body.amount !== undefined) updateData.amount = parseFloat(body.amount);
  if (body.category) updateData.category = body.category;
  if (body.date)     updateData.date     = new Date(body.date);
  if (body.notes !== undefined)  updateData.notes  = body.notes;

  return expenseRepository.update(expenseId, updateData);
};

/**
 * Delete an expense.
 */
const deleteExpense = async (expenseId, userId) => {
  const expense = await expenseRepository.findById(expenseId);

  if (!expense) {
    const error = new Error('Expense not found.');
    error.statusCode = 404;
    throw error;
  }

  await verifyTripOwnership(expense.tripId, userId);
  return expenseRepository.remove(expenseId);
};

/**
 * Get expense totals grouped by category for a trip.
 * Used to power the expense breakdown chart on the dashboard.
 */
const getExpenseSummary = async (tripId, userId) => {
  await verifyTripOwnership(tripId, userId);
  return expenseRepository.getSummaryByTrip(tripId);
};

module.exports = {
  createExpense,
  getExpensesForTrip,
  updateExpense,
  deleteExpense,
  getExpenseSummary,
};
