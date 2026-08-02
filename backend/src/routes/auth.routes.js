// src/routes/auth.routes.js
// Defines the URL paths for auth endpoints.
// The flow is: Route -> Controller -> Service -> Repository -> Prisma

const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');
const { registerValidator, loginValidator } = require('../validators/auth.validator');
const { changePasswordValidator, updateNameValidator } = require('../validators/profile.validator');
const validate = require('../middlewares/validate.middleware');
const upload = require('../middlewares/upload.middleware'); // Multer + Cloudinary

// POST /api/auth/register
router.post('/register', registerValidator, validate, authController.register);

// POST /api/auth/login
router.post('/login', loginValidator, validate, authController.login);

// GET  /api/auth/me  — get logged-in user's profile
router.get('/me', protect, authController.getMe);

// PATCH /api/auth/me — update profile name
router.patch('/me', protect, updateNameValidator, validate, authController.updateMe);

// PATCH /api/auth/password — change password (requires current password)
router.patch('/password', protect, changePasswordValidator, validate, authController.changePassword);

// POST /api/auth/avatar — upload profile picture via Cloudinary
// upload.single('avatar') processes the multipart file before the controller runs
router.post('/avatar', protect, upload.single('avatar'), authController.uploadAvatar);

module.exports = router;
