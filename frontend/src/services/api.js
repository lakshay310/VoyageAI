// src/services/api.js
// Centralised Axios instance.
// All API calls go through this so the base URL and auth token
// are configured in one place.
//
// Prompt 24 Enhancement: The response interceptor now shows user-friendly
// toast notifications for common error codes (400, 403, 422, 429, 500).

import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',  // Backend URL
  headers: { 'Content-Type': 'application/json' },
});

// ── Request Interceptor ───────────────────────────────────────────────────────
// Attaches the JWT token to every outgoing request automatically.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // Read token from localStorage
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response Interceptor ──────────────────────────────────────────────────────
// Catches HTTP errors and shows friendly toasts so individual pages
// don't have to handle every case themselves.
api.interceptors.response.use(
  (response) => response, // Pass successful responses through unchanged

  (error) => {
    const status = error.response?.status;
    // The server sends: { success: false, message: "..." }
    const serverMessage = error.response?.data?.message;

    if (status === 401) {
      // Token expired or invalid — log the user out and redirect
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Only redirect if not already on the login page (avoids redirect loop)
      if (!window.location.pathname.includes('/login')) {
        toast.error('Session expired. Please log in again.');
        window.location.href = '/login';
      }
    } else if (status === 403) {
      // User is logged in but doesn't have permission
      toast.error(serverMessage || 'You do not have permission to do that.');
    } else if (status === 422) {
      // Validation error from express-validator
      toast.error(serverMessage || 'Please check your input and try again.');
    } else if (status === 429) {
      // Rate limiter kicked in
      toast.error('Too many requests. Please slow down and try again later.');
    } else if (status >= 500) {
      // Server crash — don't show technical details to users
      toast.error('Server error. Please try again in a moment.');
    }
    // Always reject so the calling component can also handle the error if needed
    return Promise.reject(error);
  }
);

export default api;
