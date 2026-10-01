// src/services/journal.service.js
// Business logic for the Travel Journal module.
// Validates inputs and coordinates between controller and repository.

const AppError           = require('../utils/AppError');
const journalRepo        = require('../repositories/journal.repository');
const notificationService = require('./notification.service');
const { verifyTripOwnership } = require('./trip.service'); // shared — not copy-pasted

// Valid mood values (must match Prisma enum)
const VALID_MOODS = ['AMAZING', 'HAPPY', 'NEUTRAL', 'TIRED', 'EXCITED', 'STRESSED', 'RELAXED', 'ADVENTUROUS'];

/**
 * Create a new journal entry for a trip.
 * Validates mood and required fields.
 */
const createEntry = async (userId, tripId, body) => {
  // Only the trip owner can add journal entries
  const trip = await verifyTripOwnership(tripId, userId);

  const { title, content, mood, location, date } = body;

  if (!title?.trim()) {
    throw new AppError('Entry title is required.', 400);
  }
  if (!content?.trim()) {
    throw new AppError('Entry content is required.', 400);
  }
  if (mood && !VALID_MOODS.includes(mood)) {
    throw new AppError(`Mood must be one of: ${VALID_MOODS.join(', ')}`, 400);
  }

  const entry = await journalRepo.create({
    tripId,
    title:    title.trim(),
    content:  content.trim(),
    mood:     mood || 'HAPPY',
    location: location?.trim() || null,
    date:     date ? new Date(date) : new Date(),
  });

  // 🔔 Notify user — journal entry saved!
  await notificationService.createAndEmit(userId, {
    title:   '📔 Journal Entry Added!',
    message: `"${title.trim()}" has been saved to your travel diary for ${trip.destination}.`,
    type:    'SUCCESS',
    link:    '/journal',
  });

  return entry;
};

/** Get all entries for a specific trip. */
const getTripEntries = async (tripId, userId) => {
  await verifyTripOwnership(tripId, userId);
  return journalRepo.findAllByTrip(tripId, userId);
};

/** Get ALL entries for a user across all trips. */
const getAllEntries = async (userId) => {
  return journalRepo.findAllByUser(userId);
};

/** Get a single journal entry. */
const getEntry = async (id, userId) => {
  const entry = await journalRepo.findById(id, userId);

  if (!entry) {
    throw new AppError('Journal entry not found.', 404);
  }

  return entry;
};

/** Update a journal entry. */
const updateEntry = async (id, userId, body) => {
  // Verify it exists and user owns it
  await getEntry(id, userId);

  const { title, content, mood, location, date } = body;
  const updateData = {};
  if (title    !== undefined) updateData.title    = title.trim();
  if (content  !== undefined) updateData.content  = content.trim();
  if (mood     !== undefined) updateData.mood     = mood;
  if (location !== undefined) updateData.location = location?.trim() || null;
  if (date     !== undefined) updateData.date     = new Date(date);

  await journalRepo.update(id, userId, updateData);
  return journalRepo.findById(id, userId);
};

/** Delete a journal entry. */
const deleteEntry = async (id, userId) => {
  await getEntry(id, userId); // verify ownership
  return journalRepo.remove(id, userId);
};

module.exports = { createEntry, getTripEntries, getAllEntries, getEntry, updateEntry, deleteEntry };
