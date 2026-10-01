// src/services/wishlist.service.js
// Business logic for the Wishlist module.
// Validates inputs and calls the repository layer.
// Also triggers a notification when the user adds a new wishlist item.

const AppError           = require('../utils/AppError');
const wishlistRepo       = require('../repositories/wishlist.repository');
const notificationService = require('./notification.service');

// Valid category values (must match Prisma enum)
const VALID_CATEGORIES = ['DOMESTIC', 'INTERNATIONAL', 'ADVENTURE', 'BEACH', 'CULTURAL', 'WILDLIFE'];

/**
 * Add a new destination to the wishlist.
 * Validates required fields and priority range before saving.
 */
const addToWishlist = async (userId, body) => {
  const { destination, country, category, notes, priority } = body;

  if (!destination?.trim()) {
    throw new AppError('Destination name is required.', 400);
  }

  if (category && !VALID_CATEGORIES.includes(category)) {
    throw new AppError(`Category must be one of: ${VALID_CATEGORIES.join(', ')}`, 400);
  }

  // Priority must be 1 (High), 2 (Medium), or 3 (Low)
  const parsedPriority = priority ? parseInt(priority) : 2;
  if (![1, 2, 3].includes(parsedPriority)) {
    throw new AppError('Priority must be 1 (High), 2 (Medium), or 3 (Low).', 400);
  }

  const item = await wishlistRepo.create({
    userId,
    destination: destination.trim(),
    country:     country?.trim() || null,
    category:    category || 'INTERNATIONAL',
    notes:       notes?.trim() || null,
    priority:    parsedPriority,
  });

  // 🔔 Notify the user that their dream destination was saved
  await notificationService.createAndEmit(userId, {
    title:   'Added to Wishlist! 🌟',
    message: `${destination.trim()} has been added to your travel bucket list.`,
    type:    'SUCCESS',
    link:    '/wishlist',
  });

  return item;
};

/** Get all wishlist items for the logged-in user. */
const getWishlist = async (userId) => {
  return wishlistRepo.findAllByUser(userId);
};

/** Get wishlist stats: total, visited, remaining. */
const getStats = async (userId) => {
  return wishlistRepo.getStats(userId);
};

/**
 * Update a wishlist item — used for editing notes, priority,
 * and marking a destination as visited.
 */
const updateItem = async (userId, id, body) => {
  const existing = await wishlistRepo.findById(id, userId);
  if (!existing) {
    throw new AppError('Wishlist item not found.', 404);
  }

  const { destination, country, category, notes, priority, visited } = body;

  const updateData = {};
  if (destination !== undefined) updateData.destination = destination.trim();
  if (country     !== undefined) updateData.country     = country?.trim() || null;
  if (category    !== undefined) updateData.category    = category;
  if (notes       !== undefined) updateData.notes       = notes?.trim() || null;
  if (priority    !== undefined) updateData.priority    = parseInt(priority);
  if (visited     !== undefined) updateData.visited     = Boolean(visited);

  await wishlistRepo.update(id, userId, updateData);

  // If user just marked it as visited, send a celebration notification 🎉
  if (visited === true && !existing.visited) {
    await notificationService.createAndEmit(userId, {
      title:   'Dream achieved! 🎉',
      message: `Congratulations! You've visited ${existing.destination}. Mark it as a memory!`,
      type:    'SUCCESS',
      link:    '/wishlist',
    });
  }

  return wishlistRepo.findById(id, userId);
};

/** Remove a wishlist item. */
const removeItem = async (userId, id) => {
  const existing = await wishlistRepo.findById(id, userId);
  if (!existing) {
    throw new AppError('Wishlist item not found.', 404);
  }
  return wishlistRepo.remove(id, userId);
};

module.exports = { addToWishlist, getWishlist, getStats, updateItem, removeItem };
