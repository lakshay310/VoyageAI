// scripts/health-check.js
// A simple script to verify the deployed server is responding correctly.
// Run after deployment to confirm the service is healthy.
//
// Usage:
//   node scripts/health-check.js
//   node scripts/health-check.js https://your-api.onrender.com

const https = require('https');
const http  = require('http');

// Accept base URL as a CLI argument, or fall back to localhost
const BASE_URL = process.argv[2] || `http://localhost:${process.env.PORT || 5000}`;
const HEALTH_ENDPOINT = `${BASE_URL}/api/health`;

console.log(`\n🩺  Checking health at: ${HEALTH_ENDPOINT}\n`);

// Choose http or https automatically based on the URL
const client = HEALTH_ENDPOINT.startsWith('https') ? https : http;

const req = client.get(HEALTH_ENDPOINT, (res) => {
  let body = '';

  // Collect response chunks
  res.on('data', (chunk) => { body += chunk; });

  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log(`✅  Server is UP (HTTP ${res.statusCode})`);
      console.log(`    Response: ${body}`);
      process.exit(0);
    } else {
      console.error(`❌  Unexpected status code: ${res.statusCode}`);
      console.error(`    Response: ${body}`);
      process.exit(1);
    }
  });
});

req.on('error', (err) => {
  console.error(`❌  Could not reach the server: ${err.message}`);
  console.error('    Make sure the server is running and the URL is correct.');
  process.exit(1);
});

// Timeout after 10 seconds so the script doesn't hang in CI
req.setTimeout(10000, () => {
  console.error('❌  Request timed out after 10 seconds.');
  req.destroy();
  process.exit(1);
});
