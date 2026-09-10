// src/constants/index.js
// Centralized application constants.
//
// Why extract constants?
// Eliminates magic strings and duplicate object maps across different pages.
// If a status color or label changes, it only needs to be updated in this single file.
//
// Prompt 28 — Code Refactoring

export const TRIP_STATUS = {
  PLANNED: 'PLANNED',
  ONGOING: 'ONGOING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

export const STATUS_COLORS = {
  PLANNED:   'bg-blue-500/15 text-blue-400 border-blue-500/20',
  ONGOING:   'bg-green-500/15 text-green-400 border-green-500/20',
  COMPLETED: 'bg-gray-500/15 text-gray-400 border-gray-500/20',
  CANCELLED: 'bg-red-500/15 text-red-400 border-red-500/20',
};

export const BOOKING_CATEGORIES = {
  FLIGHT: 'FLIGHT',
  HOTEL: 'HOTEL',
  TRAIN: 'TRAIN',
  CAR_RENTAL: 'CAR_RENTAL',
  ACTIVITY: 'ACTIVITY',
  OTHER: 'OTHER',
};

export const EXPENSE_CATEGORIES = {
  FOOD: 'FOOD',
  TRANSPORT: 'TRANSPORT',
  ACCOMMODATION: 'ACCOMMODATION',
  ACTIVITIES: 'ACTIVITIES',
  SHOPPING: 'SHOPPING',
  OTHER: 'OTHER',
};
