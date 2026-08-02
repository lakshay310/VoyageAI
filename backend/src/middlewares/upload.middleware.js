// src/middlewares/upload.middleware.js
// Multer + Cloudinary upload middleware.
// Use this in any route that needs image upload.

const multer = require('multer');
const { storage } = require('../config/cloudinary');

// Multer uses Cloudinary storage so files go directly to the cloud
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only JPEG, PNG, and WEBP images are allowed.'));
    }
    cb(null, true);
  },
});

module.exports = upload;
