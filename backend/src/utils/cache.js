// src/utils/cache.js
// A dead-simple in-memory cache using a JavaScript Map.
//
// Why this instead of Redis?
// For a student project, Redis needs a separate server to run.
// An in-memory Map is zero-setup and teaches the exact same concept:
// store a result with a key, return it if not expired, clear it on write.
//
// Limitation: cache is wiped if the Node.js process restarts.
// In production, swap this for Redis (same API surface).
//
// Usage:
//   cache.set('dashboard:user123', data, 60);  // cache for 60 seconds
//   const hit = cache.get('dashboard:user123'); // null if expired
//   cache.del('dashboard:user123');             // invalidate after write

const store = new Map(); // Map<key, { value, expiresAt }>

/**
 * Store a value under a key for `ttlSeconds` seconds.
 * @param {string} key
 * @param {*}      value       - anything JSON-serialisable
 * @param {number} ttlSeconds  - how long to keep it (default 60s)
 */
const set = (key, value, ttlSeconds = 60) => {
  store.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
};

/**
 * Retrieve a cached value.
 * Returns null if the key doesn't exist or has expired.
 * @param {string} key
 * @returns {*|null}
 */
const get = (key) => {
  const entry = store.get(key);
  if (!entry) return null;

  // Expired — remove it and pretend it was never there
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }

  return entry.value;
};

/**
 * Remove a specific cache entry (call this after a write operation
 * so stale data isn't served on the next read).
 * @param {string} key
 */
const del = (key) => {
  store.delete(key);
};

/**
 * Clear ALL cache entries (useful during testing or logout).
 */
const flush = () => {
  store.clear();
};

module.exports = { set, get, del, flush };
