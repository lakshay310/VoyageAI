// src/services/deployment.service.js
// Business logic for the deployment status endpoint.
// Collects information about the server's runtime environment so developers
// can confirm everything is configured correctly after a deploy.

const deploymentRepository = require('../repositories/deployment.repository');
const { NODE_ENV, PORT, CLIENT_URL } = require('../config/env');

/**
 * Run a full deployment readiness check.
 * Returns a structured report of:
 *   - server config (env, port, CORS origin)
 *   - database connectivity and record counts
 *   - which optional services are configured
 *
 * @returns {Promise<object>} status report
 */
const getDeploymentStatus = async () => {
  // ── 1. Check database ─────────────────────────────────────────────────────
  let dbStatus = { connected: false, latencyMs: null, error: null };
  let tableCounts = null;

  try {
    dbStatus = await deploymentRepository.pingDatabase();     // lightweight SELECT 1
    tableCounts = await deploymentRepository.getTableCounts(); // row counts per table
  } catch (err) {
    // DB is down — report it but don't crash the whole status endpoint
    dbStatus.error = err.message;
  }

  // ── 2. Check optional services ────────────────────────────────────────────
  // We only check whether the API key variable EXISTS, not if the key is valid.
  // A full "live" check would cost API credits and slow down every deploy.
  const services = {
    cloudinary: !!process.env.CLOUDINARY_API_KEY,
    geminiAI:   !!process.env.GEMINI_API_KEY,
  };

  // ── 3. Assemble the report ────────────────────────────────────────────────
  return {
    status:     dbStatus.connected ? 'ok' : 'degraded',
    timestamp:  new Date().toISOString(),
    environment: NODE_ENV,
    server: {
      port:       PORT,
      corsOrigin: CLIENT_URL,
      nodeVersion: process.version,       // useful for debugging "works on my machine"
      uptime:     Math.floor(process.uptime()) + 's', // how long the process has been running
    },
    database: {
      connected:  dbStatus.connected,
      latencyMs:  dbStatus.latencyMs,
      error:      dbStatus.error,
      tableCounts,
    },
    services,

    // Deployment checklist for the developer reading the response
    checklist: {
      jwtSecretSet:     !!process.env.JWT_SECRET && process.env.JWT_SECRET !== 'changeme',
      corsConfigured:   !!CLIENT_URL,
      cloudinarySet:    services.cloudinary,
      geminiSet:        services.geminiAI,
      dbConnected:      dbStatus.connected,
    },
  };
};

module.exports = { getDeploymentStatus };
