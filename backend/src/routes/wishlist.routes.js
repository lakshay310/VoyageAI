// src/routes/wishlist.routes.js
// Express router for all wishlist REST endpoints.
// All routes are protected — only logged-in users can access.

const express              = require('express');
const router               = express.Router();
const { protect }          = require('../middlewares/auth.middleware');
const wishlistController   = require('../controllers/wishlist.controller');

// All wishlist routes require authentication
router.use(protect);

// POST   /api/wishlist       → add a new destination
router.post('/',     wishlistController.addItem);

// GET    /api/wishlist       → get all items + stats
router.get('/',      wishlistController.getAll);

// PATCH  /api/wishlist/:id   → edit item (notes, priority, mark visited)
router.patch('/:id', wishlistController.updateItem);

// DELETE /api/wishlist/:id   → remove from wishlist
router.delete('/:id', wishlistController.removeItem);

module.exports = router;
