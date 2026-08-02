// src/services/api.js
// Centralised Axios instance.
// All API calls go through this so the base URL and auth token
// are configured in one place.

import axios from 'axios';

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
// Handles 401 errors globally (token expired → redirect to login).
api.interceptors.response.use(
  (response) => response,  // Pass successful responses through
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear storage and redirect
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
