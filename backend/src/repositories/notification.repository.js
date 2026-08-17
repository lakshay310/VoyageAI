// src/repositories/notification.repository.js
// Data-access layer for the Notification module.
// All database operations for the Notification table go here.

const prisma = require('../config/database');

/**
 * Create a new notification record in the database.
 * Called by notification.service.js whenever an event occurs.
 *
 * @param {object} data - { userId, title, message, type, link }
 * @returns The created Notification record
 */
const createNotification = async (data) => {
  return prisma.notification.create({ data });
};

/**
 * Get all notifications for a specific user, newest first.
 * Used by GET /api/notifications
 *
 * @param {string} userId - The logged-in user's ID
 * @returns Array of Notification records
 */
const findAllByUser = async (userId) => {
  return prisma.notification.findMany({
    where:   { userId },
    orderBy: { createdAt: 'desc' },  // newest first
  });
};

/**
 * Count how many unread notifications a user has.
 * Used to show the badge number on the bell icon.
 *
 * @param {string} userId
 * @returns Number (unread count)
 */
const countUnread = async (userId) => {
  return prisma.notification.count({
    where: { userId, isRead: false },
  });
};

/**
 * Mark a single notification as read.
 * Called when the user clicks on a specific notification.
 *
 * @param {string} id     - Notification ID
 * @param {string} userId - Must match to prevent cross-user access
 */
const markOneRead = async (id, userId) => {
  return prisma.notification.updateMany({
    where: { id, userId },          // userId guard prevents reading others' notifications
    data:  { isRead: true },
  });
};

/**
 * Mark ALL notifications for a user as read.
 * Called by the "Mark all as read" button.
 *
 * @param {string} userId
 */
const markAllRead = async (userId) => {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data:  { isRead: true },
  });
};

/**
 * Delete a single notification.
 *
 * @param {string} id     - Notification ID
 * @param {string} userId - Must match to prevent cross-user deletion
 */
const deleteOne = async (id, userId) => {
  return prisma.notification.deleteMany({
    where: { id, userId },
  });
};

/**
 * Delete all notifications for a user.
 * Called by the "Clear all" button.
 */
const deleteAll = async (userId) => {
  return prisma.notification.deleteMany({
    where: { userId },
  });
};

module.exports = {
  createNotification,
  findAllByUser,
  countUnread,
  markOneRead,
  markAllRead,
  deleteOne,
  deleteAll,
};
