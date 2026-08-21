// src/routes/journal.routes.js
// Express router for all Travel Journal REST endpoints.
// All routes require authentication (JWT).

const express           = require('express');
const router            = express.Router();
const { protect }       = require('../middlewares/auth.middleware');
const journalController = require('../controllers/journal.controller');

// All routes require a valid JWT
router.use(protect);

// GET  /api/journal                    → all entries for the logged-in user (all trips)
router.get('/',                 journalController.getAll);

// GET  /api/journal/trip/:tripId       → all entries for a specific trip
// IMPORTANT: This specific route must come BEFORE /:id to avoid "trip" matching as an ID
router.get('/trip/:tripId',    journalController.getByTrip);

// POST /api/journal/trip/:tripId       → create a new entry for a trip
router.post('/trip/:tripId',   journalController.create);

// GET  /api/journal/:id                → get one entry
router.get('/:id',             journalController.getOne);

// PATCH /api/journal/:id               → update an entry
router.patch('/:id',           journalController.update);

// DELETE /api/journal/:id              → delete an entry
router.delete('/:id',          journalController.remove);

module.exports = router;
