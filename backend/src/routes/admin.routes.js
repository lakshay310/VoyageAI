// src/routes/admin.routes.js
// Express router for the Admin Dashboard module.
// Secured with `protect` (JWT required) and `authorise('ADMIN')` (role must be ADMIN).

const express                = require('express');
const router                 = express.Router();
const { protect, authorise } = require('../middlewares/auth.middleware');
const adminController        = require('../controllers/admin.controller');

// Double-lock all routes in this router: must be logged in AND have role = ADMIN
router.use(protect);
router.use(authorise('ADMIN'));

// GET /api/admin/overview      → KPI stats + recent signups + recent bookings
router.get('/overview', adminController.getOverview);

// GET /api/admin/stats         → platform-wide stats only
router.get('/stats', adminController.getStats);

// GET /api/admin/users         → paginated user list
router.get('/users', adminController.getAllUsers);

// PATCH /api/admin/users/:id/role → promote/demote a user
router.patch('/users/:id/role', adminController.updateUserRole);

// DELETE /api/admin/users/:id     → delete a user
router.delete('/users/:id', adminController.deleteUser);

module.exports = router;
