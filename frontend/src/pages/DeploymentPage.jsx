// src/pages/DeploymentPage.jsx
// Prompt 29 — Deployment Preparation
//
// Admin-only page that shows a full deployment readiness report:
//   - Server environment (Node version, port, uptime)
//   - Database connectivity and table row counts
//   - 3rd-party service configuration status
//   - A go / no-go pre-deploy checklist
//   - A step-by-step deployment guide (without Docker)

import { useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/common/LoadingSpinner";

// ── Small reusable components ──────────────────────────────────────────────────

/** Green / Red badge */
const Badge = ({ ok }) => (
  <span
    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold
      ${ok
        ? "bg-green-500/15 text-green-400 border border-green-500/30"
        : "bg-red-500/15 text-red-400 border border-red-500/30"
      }`}
  >
    {ok ? "✅ OK" : "❌ FAIL"}
  </span>
);

/** Single checklist row with label, hint, and badge */
const CheckRow = ({ label, ok, detail }) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-700/50 last:border-0">
    <div>
      <span className="text-sm text-gray-200">{label}</span>
      {detail && <p className="text-xs text-gray-500 mt-0.5">{detail}</p>}
    </div>
    <Badge ok={ok} />
  </div>
);

/** Card container for each section */
const Card = ({ title, icon, children }) => (
  <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-5 backdrop-blur-sm">
    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
      <span>{icon}</span> {title}
    </h3>
    {children}
  </div>
);

// ── Main Page ──────────────────────────────────────────────────────────────────

const DeploymentPage = () => {
  const { user } = useAuth();

  const [status, setStatus]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    // Only fetch if the current user is an admin
    if (user?.role !== "ADMIN") {
      setLoading(false);
      return;
    }

    api.get("/deployment/status")
      .then((res) => setStatus(res.data.data))
      .catch((err) => setError(err.response?.data?.message || "Failed to load deployment status"))
      .finally(() => setLoading(false));
  }, [user]);

  // ── Access denied ────────────────────────────────────────────────────────────
  if (user?.role !== "ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 text-center p-8">
        <span className="text-6xl mb-4">🔒</span>
        <h2 className="text-xl font-bold text-white mb-2">Admin Only</h2>
        <p className="text-gray-400">This page is restricted to administrators.</p>
      </div>
    );
  }

  if (loading) return <LoadingSpinner message="Checking deployment status..." />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 text-center p-8">
        <span className="text-6xl mb-4">⚠️</span>
        <h2 className="text-xl font-bold text-white mb-2">Error</h2>
        <p className="text-gray-400">{error}</p>
      </div>
    );
  }

  const { server, database, services, checklist, environment, timestamp } = status;

  const passCount  = Object.values(checklist).filter(Boolean).length;
  const totalCount = Object.values(checklist).length;
  const allGood    = passCount === totalCount;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          🚀 Deployment Status
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Environment:{" "}
          <span className="font-mono text-blue-400">{environment}</span>
          {" · "}
          Checked:{" "}
          <span className="font-mono text-gray-300">
            {new Date(timestamp).toLocaleString()}
          </span>
        </p>
      </div>

      {/* Overall banner */}
      <div
        className={`rounded-xl p-4 border flex items-center gap-3 ${
          allGood
            ? "bg-green-500/10 border-green-500/30 text-green-300"
            : "bg-yellow-500/10 border-yellow-500/30 text-yellow-300"
        }`}
      >
        <span className="text-3xl">{allGood ? "✅" : "⚠️"}</span>
        <div>
          <p className="font-semibold">
            {allGood ? "All systems go!" : "Some items need attention"}
          </p>
          <p className="text-sm opacity-75">
            {passCount} / {totalCount} checks passing
          </p>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Server */}
        <Card title="Server" icon="🖥️">
          <dl className="space-y-2 text-sm">
            {[
              { label: "Node.js Version", value: server.nodeVersion },
              { label: "Port",            value: server.port },
              { label: "CORS Origin",     value: server.corsOrigin },
              { label: "Uptime",          value: server.uptime },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <span className="text-gray-400">{label}</span>
                <span className="font-mono text-gray-200 text-right truncate max-w-xs">{value}</span>
              </div>
            ))}
          </dl>
        </Card>

        {/* Database */}
        <Card title="Database" icon="🗄️">
          <div className="flex items-center gap-2 mb-3">
            <Badge ok={database.connected} />
            {database.latencyMs !== null && (
              <span className="text-xs text-gray-400">{database.latencyMs}ms ping</span>
            )}
          </div>
          {database.error && (
            <p className="text-xs text-red-400 bg-red-500/10 rounded p-2 mb-3">
              {database.error}
            </p>
          )}
          {database.tableCounts && (
            <dl className="space-y-1 text-sm">
              {Object.entries(database.tableCounts).map(([table, count]) => (
                <div key={table} className="flex justify-between">
                  <span className="text-gray-400 capitalize">{table}</span>
                  <span className="font-mono text-gray-200">{count.toLocaleString()} rows</span>
                </div>
              ))}
            </dl>
          )}
        </Card>

        {/* Services */}
        <Card title="External Services" icon="🔌">
          <div className="space-y-3">
            {[
              { name: "Cloudinary (Image Uploads)",   ok: services.cloudinary },
              { name: "Gemini AI (Trip Planner)",     ok: services.geminiAI  },
            ].map(({ name, ok }) => (
              <div key={name} className="flex items-center justify-between">
                <span className="text-sm text-gray-300">{name}</span>
                <Badge ok={ok} />
              </div>
            ))}
          </div>
        </Card>

        {/* Checklist */}
        <Card title="Pre-Deploy Checklist" icon="📋">
          <CheckRow label="JWT Secret set (not default)"  ok={checklist.jwtSecretSet}  detail="Must not be 'changeme'" />
          <CheckRow label="CORS Origin configured"        ok={checklist.corsConfigured} detail="CLIENT_URL env var" />
          <CheckRow label="Cloudinary configured"         ok={checklist.cloudinarySet}  detail="Image upload service" />
          <CheckRow label="Gemini AI configured"          ok={checklist.geminiSet}      detail="AI trip planner" />
          <CheckRow label="Database connected"            ok={checklist.dbConnected}    detail="PostgreSQL via Prisma" />
        </Card>
      </div>

      {/* Step-by-step guide */}
      <Card title="Deployment Guide (Without Docker)" icon="📖">
        <ol className="space-y-4 text-sm text-gray-300">
          {[
            {
              n: 1,
              title: "Provision a PostgreSQL database",
              body:  "Use Neon (free tier), Railway, or Supabase. Copy the connection URL.",
            },
            {
              n: 2,
              title: "Set environment variables on your host",
              body:  "Render / Railway → add all vars from .env.production.example in the platform dashboard.",
            },
            {
              n: 3,
              title: "Run database migrations",
              body:  "npx prisma migrate deploy  (safe for production — never resets data)",
            },
            {
              n: 4,
              title: "Build & start the backend",
              body:  "npm run build && npm start  (prestart auto-runs check-env.js)",
            },
            {
              n: 5,
              title: "Deploy the frontend",
              body:  "cd frontend && npm run build → upload dist/ to Vercel / Netlify.",
            },
            {
              n: 6,
              title: "Verify with health check",
              body:  "node scripts/health-check.js https://your-api.onrender.com",
            },
            {
              n: 7,
              title: "Open this page",
              body:  "Log in as admin and visit /deployment — confirm all checks are green.",
            },
          ].map(({ n, title, body }) => (
            <li key={n} className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600/30 text-blue-400 text-xs font-bold flex items-center justify-center mt-0.5">
                {n}
              </span>
              <div>
                <span className="font-semibold text-white">{title}</span>
                <p className="mt-0.5 text-gray-400 font-mono text-xs leading-relaxed">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
};

export default DeploymentPage;