// src/services/user.service.js
// API calls related to the logged-in user's profile.

import api from './api';

/**
 * Update the current user's display name.
 */
export const updateProfile = (data) => api.patch('/auth/me', data);

/**
 * Change password — requires current password for verification.
 */
export const changePassword = (data) => api.patch('/auth/password', data);

/**
 * Upload a profile avatar image.
 * Uses FormData because we're sending a file (multipart/form-data),
 * not a regular JSON body.
 */
export const uploadAvatar = (file) => {
  const formData = new FormData();
  formData.append('avatar', file); // 'avatar' must match the field name in upload.single('avatar')

  return api.post('/auth/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

