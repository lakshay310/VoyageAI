// src/server.js
// Entry point: starts the HTTP server and Socket.io.
// Separating this from app.js allows us to test app.js without binding a port.

const http = require('http');
const app = require('./app');
const { PORT } = require('./config/env');
const prisma = require('./config/database');
const { initSocket } = require('./sockets');

// Create the HTTP server (wraps Express)
const server = http.createServer(app);

// Attach Socket.io to the same HTTP server
initSocket(server);

// Connect to DB and start listening
const startServer = async () => {
  try {
    // Try to verify database connection before accepting traffic
    await prisma.$connect();
    console.log('✅ Connected to PostgreSQL database.');
  } catch (error) {
    // Neon serverless DBs go to sleep on the free tier.
    // We log the warning but DON'T exit — the server still starts.
    // Prisma will auto-reconnect on the next DB query when Neon wakes up.
    console.warn('⚠️  Database not reachable yet (Neon cold-start). Server will still start.');
    console.warn('   Endpoints that need the DB will retry automatically.');
  }

  // Always start the HTTP server regardless of DB status
  server.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
};

startServer();
