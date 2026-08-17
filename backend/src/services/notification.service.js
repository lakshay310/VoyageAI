// src/services/notification.service.js
// Business logic layer for the Notification module.
//
// Key responsibility: createAndEmit()
//   1. Saves the notification to PostgreSQL via the repository
//   2. Immediately emits it over Socket.io to the user's room
//      so the frontend receives it in real-time without polling
//
// Other services (trip.service, booking.service, auth.service) can
// import createAndEmit() and call it when important events happen.

const notificationRepo = require('../repositories/notification.repository');
const { getIO }        = require('../sockets');   // Socket.io instance

/**
 * Create a notification in the DB AND push it to the user via Socket.io.
 * This is the main function other services will use.
 *
 * Example usage in trip.service.js:
 *   await notificationService.createAndEmit(userId, {
 *     title:   'Trip Created!',
 *     message: 'Your trip to Goa has been created.',
 *     type:    'TRIP_CREATED',
 *     link:    `/trips/${trip.id}`,
 *   });
 *
 * @param {string} userId - The user who should receive the notification
 * @param {object} payload - { title, message, type, link? }
 * @returns The saved Notification record
 */
const createAndEmit = async (userId, { title, message, type = 'INFO', link = null }) => {
  // Step 1: Save to database so it persists even if user is offline
  const notification = await notificationRepo.createNotification({
    userId,
    title,
    message,
    type,
    link,
  });

  // Step 2: Push to user's Socket.io room in real-time
  // Each user joins a room named after their userId when they log in.
  // This means only that specific user receives this event.
  const io = getIO();
  if (io) {
    io.to(userId).emit('notification:new', notification);
  }

  return notification;
};

/** Get all notifications for a user */
const getUserNotifications = async (userId) => {
  return notificationRepo.findAllByUser(userId);
};

/** Get unread count (used for bell badge) */
const getUnreadCount = async (userId) => {
  return notificationRepo.countUnread(userId);
};

/** Mark one notification as read */
const markOneRead = async (id, userId) => {
  return notificationRepo.markOneRead(id, userId);
};

/** Mark all notifications as read */
const markAllRead = async (userId) => {
  return notificationRepo.markAllRead(userId);
};

/** Delete one notification */
const deleteOne = async (id, userId) => {
  return notificationRepo.deleteOne(id, userId);
};

/** Delete all notifications for the user */
const deleteAll = async (userId) => {
  return notificationRepo.deleteAll(userId);
};

module.exports = {
  createAndEmit,
  getUserNotifications,
  getUnreadCount,
  markOneRead,
  markAllRead,
  deleteOne,
  deleteAll,
};
