// src/config/cloudinary.js
// Configure Cloudinary for image uploads.
// Images uploaded via Multer will go directly to Cloudinary.

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = require('./env');

// Set up Cloudinary credentials
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

// Configure where in Cloudinary to store files and what format to accept
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'ai-trip-planner', // Cloudinary folder name
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  },
});

module.exports = { cloudinary, storage };
