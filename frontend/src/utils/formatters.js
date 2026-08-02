// src/utils/formatters.js
// Small helper functions used across the app to format data for display.
// Keeping them here avoids repeating the same logic in multiple components.

/**
 * Format a number as Indian Rupees.
 * For international routes with USD prices, pass currency='USD'.
 * Example: formatCurrency(15000) → "₹15,000"
 *          formatCurrency(450, 'USD') → "$450"
 */
export const formatCurrency = (amount, currency = 'INR') => {
  const localeMap = {
    INR: 'en-IN',
    USD: 'en-US',
    EUR: 'de-DE',
    GBP: 'en-GB',
    AED: 'en-AE',
    SGD: 'en-SG',
  };
  return new Intl.NumberFormat(localeMap[currency] || 'en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format a date string to a readable format.
 * Example: formatDate('2025-12-20') → "20 Dec 2025"
 */
export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Return the first name from a full name string.
 * Example: getFirstName('John Doe') → "John"
 */
export const getFirstName = (fullName = '') => {
  return fullName.split(' ')[0];
};

/**
 * Calculate how many days are between two dates.
 * Example: getDayCount('2025-12-20', '2025-12-27') → 7
 */
export const getDayCount = (startDate, endDate) => {
  const start = new Date(startDate);
  const end   = new Date(endDate);
  const diffMs = end - start;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24)); // ms → days
};

/**
 * Convert a TripStatus enum value to a human-readable badge label.
 * Example: getStatusLabel('PLANNED') → 'Planned'
 */
export const getStatusLabel = (status) => {
  const map = {
    PLANNED:   'Planned',
    ONGOING:   'Ongoing',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
  };
  return map[status] || status;
};
