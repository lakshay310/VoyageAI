// src/services/wishlist.service.js
// Frontend API wrapper for all wishlist endpoints.
// Uses the shared axios instance which auto-attaches the JWT token.

import api from './api';

/** Fetch all wishlist items + stats */
export const getWishlist = () => api.get('/wishlist');

/** Add a new destination to wishlist */
export const addToWishlist = (data) => api.post('/wishlist', data);

/** Update a wishlist item (notes, priority, visited flag) */
export const updateWishlistItem = (id, data) => api.patch(`/wishlist/${id}`, data);

/** Delete a wishlist item */
export const removeFromWishlist = (id) => api.delete(`/wishlist/${id}`);
