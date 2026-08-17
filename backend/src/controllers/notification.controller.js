// src/controllers/notification.controller.js
// HTTP handlers for the Notifications module.
// Each function is short — validate → call service → send response.

const notificationService = require('../services/notification.service');
const { sendSuccess }     = require('../utils/response');

/** GET /api/notifications — Get all notifications for the logged-in user */
const getAll = async (req, res, next) => {
  try {
    const notifications = await notificationService.getUserNotifications(req.user.id);
    const unreadCount   = await notificationService.getUnreadCount(req.user.id);
    return sendSuccess(res, 'Notifications fetched.', { notifications, unreadCount });
  } catch (error) {
    next(error);
  }
};

/** PATCH /api/notifications/:id/read — Mark one notification as read */
const markOneRead = async (req, res, next) => {
  try {
    await notificationService.markOneRead(req.params.id, req.user.id);
    return sendSuccess(res, 'Notification marked as read.');
  } catch (error) {
    next(error);
  }
};

/** PATCH /api/notifications/read-all — Mark ALL notifications as read */
const markAllRead = async (req, res, next) => {
  try {
    await notificationService.markAllRead(req.user.id);
    return sendSuccess(res, 'All notifications marked as read.');
  } catch (error) {
    next(error);
  }
};

/** DELETE /api/notifications/:id — Delete a single notification */
const deleteOne = async (req, res, next) => {
  try {
    await notificationService.deleteOne(req.params.id, req.user.id);
    return sendSuccess(res, 'Notification deleted.');
  } catch (error) {
    next(error);
  }
};

/** DELETE /api/notifications — Clear all notifications */
const deleteAll = async (req, res, next) => {
  try {
    await notificationService.deleteAll(req.user.id);
    return sendSuccess(res, 'All notifications cleared.');
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, markOneRead, markAllRead, deleteOne, deleteAll };
