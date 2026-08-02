// src/sockets/index.js
// Initialises Socket.io and sets up event listeners.
// Real-time features (e.g., live trip updates, notifications) go here.

const { Server } = require('socket.io');
const { CLIENT_URL } = require('../config/env');

let io; // shared Socket.io instance

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: CLIENT_URL,
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Allow a user to join a "room" named after their userId
    // So we can send targeted notifications to a specific user
    socket.on('join', (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined their room.`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

// Export io so services can emit events from anywhere
const getIO = () => io;

module.exports = { initSocket, getIO };
