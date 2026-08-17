// src/app.js
// Creates the Express application with all middlewares and routes wired up.
// Kept separate from server.js so it is easy to test without starting the HTTP server.

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const { CLIENT_URL } = require('./config/env');

// Import route files
const authRoutes      = require('./routes/auth.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const tripRoutes      = require('./routes/trip.routes');
const aiRoutes        = require('./routes/ai.routes');
const flightRoutes    = require('./routes/flight.routes');
const hotelRoutes     = require('./routes/hotel.routes');
const { nestedRouter: bookingNestedRoutes, standaloneRouter: bookingRoutes } = require('./routes/booking.routes');
const { nestedRouter: expenseNestedRoutes, standaloneRouter: expenseRoutes } = require('./routes/expense.routes');
const mapRoutes       = require('./routes/map.routes');
const weatherRoutes   = require('./routes/weather.routes');
const notificationRoutes = require('./routes/notification.routes');
const wishlistRoutes     = require('./routes/wishlist.routes');

// Import global error handler (must be last)
const errorHandler = require('./middlewares/error.middleware');

const app = express();

// ── Security headers ─────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS: allow requests from the React frontend ──────────────────────────────
app.use(cors({
  origin: CLIENT_URL,
  credentials: true, // allow cookies if needed
}));

// ── Body parsers ──────────────────────────────────────────────────────────────
app.use(express.json());           // parse JSON bodies
app.use(express.urlencoded({ extended: true })); // parse form bodies

// ── HTTP request logger (development only) ───────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ── Health check route ───────────────────────────────────────────────────────
// Useful for verifying the server is up (e.g., in CI/CD or load balancers)
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'API is running 🚀' });
});

// ── Feature routes ───────────────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai',        aiRoutes);
app.use('/api/flights',   flightRoutes);
app.use('/api/hotels',    hotelRoutes);

// Trip routes: all CRUD under /api/trips
app.use('/api/trips', tripRoutes);

// Booking routes:
//   Nested  → /api/trips/:tripId/bookings  (create & list)
//   Standalone → /api/bookings/:id        (update & delete)
app.use('/api/trips/:tripId/bookings', bookingNestedRoutes);
app.use('/api/bookings', bookingRoutes);

// Expense routes:
//   Nested  → /api/trips/:tripId/expenses  (create, list & summary)
//   Standalone → /api/expenses/:id        (update & delete)
app.use('/api/trips/:tripId/expenses', expenseNestedRoutes);
app.use('/api/expenses', expenseRoutes);

// Maps route
app.use('/api/maps',    mapRoutes);

// Weather route
app.use('/api/weather',        weatherRoutes);

// Notifications route
app.use('/api/notifications',  notificationRoutes);

// Wishlist route
app.use('/api/wishlist',        wishlistRoutes);

// ── Global error handler (must come AFTER all routes) ────────────────────────
app.use(errorHandler);

module.exports = app;
