// src/services/auth.service.js
// All auth-related API calls — keeps the components clean.

import api from './api';

// Register a new user
export const registerUser = (data) => api.post('/auth/register', data);

// Login with email + password
export const loginUser = (data) => api.post('/auth/login', data);

// Fetch the current user's profile
export const getMe = () => api.get('/auth/me');
