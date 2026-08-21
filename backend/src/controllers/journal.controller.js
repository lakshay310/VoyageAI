// src/controllers/journal.controller.js
// HTTP handlers for the Travel Journal module.
// Each function: extract params → call service → send response.

const journalService = require('../services/journal.service');
const { sendSuccess } = require('../utils/response');

/** GET /api/journal — Get ALL journal entries for the logged-in user (across all trips) */
const getAll = async (req, res, next) => {
  try {
    const entries = await journalService.getAllEntries(req.user.id);
    return sendSuccess(res, 'Journal entries fetched.', { entries });
  } catch (error) {
    next(error);
  }
};

/** GET /api/journal/trip/:tripId — Get entries for a specific trip */
const getByTrip = async (req, res, next) => {
  try {
    const entries = await journalService.getTripEntries(req.params.tripId, req.user.id);
    return sendSuccess(res, 'Trip journal entries fetched.', { entries });
  } catch (error) {
    next(error);
  }
};

/** GET /api/journal/:id — Get a single journal entry */
const getOne = async (req, res, next) => {
  try {
    const entry = await journalService.getEntry(req.params.id, req.user.id);
    return sendSuccess(res, 'Journal entry fetched.', entry);
  } catch (error) {
    next(error);
  }
};

/** POST /api/journal/trip/:tripId — Create a new journal entry for a trip */
const create = async (req, res, next) => {
  try {
    const entry = await journalService.createEntry(req.user.id, req.params.tripId, req.body);
    return sendSuccess(res, 'Journal entry created!', entry, 201);
  } catch (error) {
    next(error);
  }
};

/** PATCH /api/journal/:id — Update a journal entry */
const update = async (req, res, next) => {
  try {
    const entry = await journalService.updateEntry(req.params.id, req.user.id, req.body);
    return sendSuccess(res, 'Journal entry updated.', entry);
  } catch (error) {
    next(error);
  }
};

/** DELETE /api/journal/:id — Delete a journal entry */
const remove = async (req, res, next) => {
  try {
    await journalService.deleteEntry(req.params.id, req.user.id);
    return sendSuccess(res, 'Journal entry deleted.');
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getByTrip, getOne, create, update, remove };
