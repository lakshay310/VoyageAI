// src/middlewares/auth.middleware.js
// Protects routes that require a logged-in user.
// Reads the JWT from the Authorization header and attaches user to req.

const { verifyToken } = require('../utils/jwt');
const { sendError } = require('../utils/response');

const protect = (req, res, next) => {
  // The token is sent as: Authorization: Bearer <token>
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'No token provided. Please log in.', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    // Decode the token and attach the user payload to req
    const decoded = verifyToken(token);
    req.user = decoded; // { id, email, role }
    next();
  } catch (error) {
    return sendError(res, 'Invalid or expired token. Please log in again.', 401);
  }
};

/**
 * Role-based access middleware factory.
 * Usage: protect, authorise('ADMIN')
 */
const authorise = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return sendError(res, 'You do not have permission to perform this action.', 403);
    }
    next();
  };
};

module.exports = { protect, authorise };
