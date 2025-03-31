const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const net = require('net');

// Ensure directories exist
const ensureDirs = require('./utils/ensureDirs');
ensureDirs();

// Load environment variables
dotenv.config();

// Import the app
const app = require('./app');

// Define default port
const DEFAULT_PORT = process.env.PORT || 3000;

// Find an available port function
function findAvailablePort(startPort) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`⚠️ Port ${startPort} is already in use, trying ${startPort + 1}...`);
        findAvailablePort(startPort + 1)
          .then(resolve)
          .catch(reject);
      } else {
        reject(err);
      }
    });
    
    server.once('listening', () => {
      server.close(() => {
        resolve(startPort);
      });
    });
    
    server.listen(startPort);
  });
}

// Start the server on an available port
async function startServer() {
  try {
    const port = await findAvailablePort(DEFAULT_PORT);
    
    const server = app.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
      console.log(`📡 Local URL: http://localhost:${port}`);
      console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
    
    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
