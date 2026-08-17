// src/controllers/wishlist.controller.js
// HTTP handlers for the Wishlist module.
// Each handler is short: validate → call service → send response.

const wishlistService = require('../services/wishlist.service');
const { sendSuccess } = require('../utils/response');

/** POST /api/wishlist — Add a destination to wishlist */
const addItem = async (req, res, next) => {
  try {
    const item = await wishlistService.addToWishlist(req.user.id, req.body);
    return sendSuccess(res, 'Destination added to wishlist!', item, 201);
  } catch (error) {
    next(error);
  }
};

/** GET /api/wishlist — Get all wishlist items */
const getAll = async (req, res, next) => {
  try {
    const [items, stats] = await Promise.all([
      wishlistService.getWishlist(req.user.id),
      wishlistService.getStats(req.user.id),
    ]);
    return sendSuccess(res, 'Wishlist fetched.', { items, stats });
  } catch (error) {
    next(error);
  }
};

/** PATCH /api/wishlist/:id — Update a wishlist item */
const updateItem = async (req, res, next) => {
  try {
    const item = await wishlistService.updateItem(req.user.id, req.params.id, req.body);
    return sendSuccess(res, 'Wishlist item updated.', item);
  } catch (error) {
    next(error);
  }
};

/** DELETE /api/wishlist/:id — Remove a wishlist item */
const removeItem = async (req, res, next) => {
  try {
    await wishlistService.removeItem(req.user.id, req.params.id);
    return sendSuccess(res, 'Destination removed from wishlist.');
  } catch (error) {
    next(error);
  }
};

module.exports = { addItem, getAll, updateItem, removeItem };
