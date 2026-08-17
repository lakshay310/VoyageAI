// src/routes/notification.routes.js
// Express router for all notification REST endpoints.
// All routes are protected — only logged-in users can access.

const express    = require('express');
const router     = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const notificationController = require('../controllers/notification.controller');

// All notification routes require authentication
router.use(protect);

// GET    /api/notifications          → list all + unread count
router.get('/',              notificationController.getAll);

// PATCH  /api/notifications/read-all → mark everything read
// IMPORTANT: This route must come BEFORE /:id routes to avoid
// "read-all" being treated as an ID parameter
router.patch('/read-all',    notificationController.markAllRead);

// PATCH  /api/notifications/:id/read → mark one read
router.patch('/:id/read',   notificationController.markOneRead);

// DELETE /api/notifications          → clear all
router.delete('/',           notificationController.deleteAll);

// DELETE /api/notifications/:id      → delete one
router.delete('/:id',        notificationController.deleteOne);

module.exports = router;
