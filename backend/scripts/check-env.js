// scripts/check-env.js
// Run this BEFORE deploying to production to make sure every required
// environment variable is set.  It exits with code 1 if anything is missing,
// so CI/CD pipelines will fail fast instead of deploying a broken build.
//
// Usage:
//   node scripts/check-env.js
//
// Add it to package.json "prestart" to auto-run before npm start:
//   "prestart": "node scripts/check-env.js"

require('dotenv').config(); // Load .env locally; in prod vars come from host

// All environment variables the server needs in production.
// Grouped by category for readable error messages.
const REQUIRED_VARS = [
  // Server
  { key: 'NODE_ENV',              hint: 'Set to "production"' },
  { key: 'PORT',                  hint: 'e.g. 5000' },

  // Database
  { key: 'DATABASE_URL',          hint: 'postgresql://user:pass@host:5432/dbname' },

  // Auth
  { key: 'JWT_SECRET',            hint: 'A long random string — never the default!' },
  { key: 'JWT_EXPIRES_IN',        hint: 'e.g. 7d' },

  // CORS
  { key: 'CLIENT_URL',            hint: 'Your deployed frontend URL e.g. https://myapp.com' },

  // Gemini AI
  { key: 'GEMINI_API_KEY',        hint: 'From Google AI Studio (aistudio.google.com)' },
];

// Optional vars — warn but don't block startup
const OPTIONAL_VARS = [
  { key: 'CLOUDINARY_CLOUD_NAME', hint: 'From cloudinary.com dashboard (needed for avatar uploads)' },
  { key: 'CLOUDINARY_API_KEY',    hint: 'From cloudinary.com dashboard (needed for avatar uploads)' },
  { key: 'CLOUDINARY_API_SECRET', hint: 'From cloudinary.com dashboard (needed for avatar uploads)' },
];

// ── Validation ───────────────────────────────────────────────────────────────

let hasError = false;

console.log('\n🔍  Checking environment variables...\n');

REQUIRED_VARS.forEach(({ key, hint }) => {
  const value = process.env[key];

  if (!value || value.trim() === '') {
    console.error(`  ❌  ${key} is not set`);
    console.error(`      Hint: ${hint}\n`);
    hasError = true;
  } else {
    // Mask secret values so they don't leak in CI logs
    const masked = value.length > 6
      ? value.slice(0, 3) + '***' + value.slice(-3)
      : '***';
    console.log(`  ✅  ${key} = ${masked}`);
  }
});

// ── Optional vars check (warn only — don't block startup) ─────────────────────
console.log('\n📋  Optional environment variables:\n');
OPTIONAL_VARS.forEach(({ key, hint }) => {
  const value = process.env[key];
  if (!value || value.trim() === '' || value.startsWith('your_')) {
    console.warn(`  ⚠️   ${key} is not set — ${hint}`);
  } else {
    const masked = value.length > 6
      ? value.slice(0, 3) + '***' + value.slice(-3)
      : '***';
    console.log(`  ✅  ${key} = ${masked}`);
  }
});

// ── Extra safety checks ───────────────────────────────────────────────────────

// Reject the dev-default JWT secret in production
if (process.env.JWT_SECRET === 'changeme' || process.env.JWT_SECRET === 'your_super_secret_jwt_key_here') {
  console.error('\n  ❌  JWT_SECRET is still a placeholder. Please set a strong random secret.\n');
  hasError = true;
}

// Friendly warning if not in production mode
if (process.env.NODE_ENV !== 'production') {
  console.warn('\n  ⚠️   NODE_ENV is not "production". OK locally; update before deploying.\n');
}

// ── Final result ──────────────────────────────────────────────────────────────

if (hasError) {
  console.error('\n❌  Environment check FAILED. Fix the issues above before starting.\n');
  process.exit(1); // Non-zero exit fails CI/CD pipelines
} else {
  console.log('\n✅  All environment variables are set. Safe to start! 🚀\n');
  process.exit(0);
}
