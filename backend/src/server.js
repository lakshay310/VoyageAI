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
    // Verify database connection before accepting traffic
    await prisma.$connect();
    console.log('✅ Connected to PostgreSQL database.');

    server.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to connect to database:', error.message);
    process.exit(1); // Exit so the process manager can restart it
  }
};

startServer();
