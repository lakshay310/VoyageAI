// src/pages/InterviewNotesPage.jsx
// Prompt 30 — Final Review, README & Interview Notes
//
// An in-app accordion-based interview preparation guide.
// Covers all major technical topics so the developer can confidently
// explain the project in a placement interview.

import { useState } from "react";

// ── Content data ───────────────────────────────────────────────────────────────

const sections = [
  {
    id: "elevator",
    icon: "🎤",
    title: "2-Minute Project Pitch",
    content: `"I built VoyageAI — a full-stack AI-powered travel planning platform.

The core feature: a user describes their trip, and Google Gemini generates a
complete day-by-day itinerary. Beyond that, users can search flights and hotels,
create bookings, track expenses per trip, write travel journal entries, get
real-time push notifications, and save dream destinations to a wishlist.

Technical highlights:
  • Backend: Node.js + Express — Route → Controller → Service → Repository → Prisma → PostgreSQL
  • Frontend: React 19 + Vite + Tailwind CSS v4
  • Auth: JWT with role-based access (USER / ADMIN)
  • Real-time: Socket.io push notifications
  • Uploads: Multer + Cloudinary
  • Tests: Jest + Supertest integration tests
  • Security: Helmet, rate limiting, bcrypt, CORS"`,
  },
  {
    id: "architecture",
    icon: "🏗️",
    title: "Architecture & Layer Pattern",
    content: `The app uses a strict 4-layer architecture — each file has ONE job:

  Route       → URL path, HTTP method, middleware chain
  Controller  → reads req, calls service, writes res. Zero business logic.
  Service     → ALL business logic. Calls repository. Never touches req/res.
  Repository  → the ONLY layer allowed to call Prisma.

Example: "Create a Trip"
  1. POST /api/trips → trip.routes.js
  2. protect middleware verifies JWT → attaches req.user
  3. TripController.createTrip() reads req.body → calls TripService
  4. TripService validates dates, calls TripRepository.create()
  5. TripRepository calls prisma.trip.create({ data })
  6. Result bubbles up → res.json({ success: true, data: trip })

Why this pattern?
  • Testable: each layer can be tested or mocked independently
  • Swappable: changing the DB means only changing repositories
  • Readable: new developers know exactly where to look for any logic`,
  },
  {
    id: "auth",
    icon: "🔐",
    title: "Authentication & Security",
    content: `JWT Flow:
  1. POST /api/auth/login → verify password with bcrypt.compare()
  2. Sign JWT: jwt.sign({ id, email, role }, JWT_SECRET, { expiresIn: "7d" })
  3. Return token → React stores in localStorage
  4. Axios interceptor: Authorization: Bearer <token> on every request
  5. protect middleware: jwt.verify() on every protected route

Security layers:
  • Helmet.js         → 11 HTTP security headers (X-Frame-Options, HSTS etc.)
  • express-rate-limit → general: 200/15min | auth: 10/15min (brute-force protection)
  • bcryptjs           → passwords hashed with cost factor 10, never stored plain
  • express-validator  → sanitises all user input before it reaches the service
  • CORS               → only the frontend origin is allowed
  • authorise("ADMIN") → role middleware guards admin-only endpoints

Why JWT over sessions?
JWT is stateless — no session store needed. Multiple backend instances can
all validate the same token without sharing state.`,
  },
  {
    id: "database",
    icon: "🗄️",
    title: "Database Design (Prisma + PostgreSQL)",
    content: `Schema relationships:

  User ─── Trip ─── Booking
               └─── Expense
               └─── JournalEntry
  User ─── Notification
  User ─── Wishlist
  User ─── Review (polymorphic: HOTEL | FLIGHT | TRIP)

Key Prisma features used:
  • onDelete: Cascade   → delete user → all their trips/bookings/etc auto-deleted
  • @@unique([userId, targetType, targetId]) → one review per item per user
  • @@index([userId])   → fast lookups (avoids full table scans)
  • $queryRaw(SELECT 1) → lightweight DB ping in deployment health check
  • Promise.all         → run independent queries in parallel (dashboard, analytics)

Prisma commands:
  npx prisma migrate dev         → generate + apply migration (development)
  npx prisma migrate deploy      → apply pending migrations (production, safe)
  npx prisma generate            → regenerate Prisma Client after schema changes`,
  },
  {
    id: "realtime",
    icon: "⚡",
    title: "Real-Time Notifications (Socket.io)",
    content: `How it works:
  1. http.createServer(app) — Express and Socket.io share the same port
  2. Frontend: io(API_URL) and emits "join" event with the user's userId
  3. Server: socket.join(userId) — user joins a room named after their ID
  4. When a trip is created, notification.service.js:
       createAndEmit(userId, { title, message, type })
     → saves to PostgreSQL (persistent)
     → io.to(userId).emit("notification:new", data) (real-time push)
  5. React listens: socket.on("notification:new", handler)
     → shows toast notification + increments unread badge

Why WebSockets over polling?
  Polling wastes bandwidth and adds 1–5s latency.
  WebSockets keep a persistent TCP connection — push is instant.`,
  },
  {
    id: "ai",
    icon: "🤖",
    title: "AI Integration (Google Gemini)",
    content: `How the AI trip planner works:
  1. User inputs: destination, dates, budget, travelers, interests
  2. POST /api/ai/generate-itinerary
  3. ai.service.js builds a structured English prompt
  4. Calls: gemini.models.generateContent({ model: "gemini-2.5-flash", contents: prompt })
  5. Gemini returns a Markdown itinerary (## Day 1: ..., ## Day 2: ...)
  6. Service saves it to Trip.itinerary column via Prisma
  7. Frontend renders the text in a styled container

The AI Chatbot works similarly but maintains a conversation history array
and passes the full history with each request to simulate memory.

Model: gemini-2.5-flash — fast, free-tier friendly, excellent for text generation.`,
  },
  {
    id: "performance",
    icon: "🚀",
    title: "Performance Optimisations",
    content: `Backend:
  • compression()    → gzip all HTTP responses; JSON shrinks ~70%. Placed before routes.
  • In-memory cache  → Map-based TTL cache. Dashboard data cached for 60s.
                       cache.set(key, data, ttl) / cache.get(key) / cache.del(key)
                       Call cache.del after writes to invalidate stale data.
  • Prisma indexes   → @@index on frequently queried columns avoids sequential scans
  • Promise.all      → parallel DB queries (dashboard runs 5 queries simultaneously)

Frontend:
  • React.lazy()     → each page is a separate JS chunk loaded only on first visit
  • Suspense         → shows a spinner while the chunk downloads (~100-300ms)
  • Code splitting   → Vite automatically creates per-route chunks at build time

Interview explanation for caching:
"Before querying the database, I check a key in the cache Map.
 If the key exists and hasn't expired, I return the cached value — no DB call needed.
 When a user writes data, I call cache.del(key) to invalidate it so the next
 read gets fresh data. This pattern is called Cache-Aside / Lazy Loading."`,
  },
  {
    id: "testing",
    icon: "🧪",
    title: "Testing (Jest + Supertest)",
    content: `Stack: Jest (test runner) + Supertest (HTTP testing library)

Test files are in: backend/src/__tests__/
  auth.test.js       → register, login, wrong password, JWT validation
  trips.test.js      → CRUD, ownership checks, date validation
  analytics.test.js  → summary, spending, budget endpoints
  admin.test.js      → admin-only endpoints, role enforcement
  utils.test.js      → cache TTL, paginate helper, AppError class

How Supertest works:
  const app = require("../app");   // import Express app (no server.listen)
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email, password });
  expect(res.statusCode).toBe(200);
  expect(res.body.data.token).toBeDefined();

Supertest sends real HTTP requests without binding a port.
It tests the FULL stack: middleware → controller → service → repository → DB.

Run tests: cd backend && npm test`,
  },
  {
    id: "deployment",
    icon: "☁️",
    title: "Deployment (Without Docker)",
    content: `Backend → Render / Railway:
  1. Create PostgreSQL on Neon (free tier) or Railway
  2. Set all env vars from .env.production.example in the platform dashboard
  3. Build command: npx prisma generate && npx prisma migrate deploy
  4. Start command: npm start (prestart runs scripts/check-env.js automatically)
  5. Verify: node scripts/health-check.js https://your-api.onrender.com

Frontend → Vercel:
  1. Import GitHub repo, set root directory to frontend/
  2. Add env var: VITE_API_URL = https://your-backend.onrender.com/api
  3. Build command: npm run build  |  Output directory: dist/

Post-deploy: Log in as admin → /deployment → all items show green ✅

Key scripts added:
  npm run check:env   → validate all env vars (exits 1 if missing — fails CI/CD)
  npm run health      → hit /api/health and report response time
  npm run build       → npx prisma generate (regenerates type-safe Prisma Client)`,
  },
  {
    id: "qa",
    icon: "💬",
    title: "Common Interview Q&A",
    content: `Q: Why PostgreSQL and not MongoDB?
A: This app has many relations (user → trips → bookings → expenses).
   Relational data with foreign keys is a natural fit.
   Prisma also gives us type-safe queries, which prevents runtime errors.

Q: Why JWT instead of sessions?
A: JWT is stateless — the server stores nothing. Multiple backend
   instances can all validate the same token without a shared session store.
   Trade-off: you cannot revoke a token before it expires (a blocklist would fix this).

Q: How would you scale this?
A: 1. Replace in-memory cache with Redis (same cache.set/get API)
   2. Load balancer + multiple Node.js instances
   3. PgBouncer connection pool in front of PostgreSQL
   4. Move AI calls to a BullMQ job queue (async processing)

Q: What is bcrypt salt?
A: A random value added before hashing so two identical passwords produce
   different hashes. This defeats rainbow table attacks. bcrypt stores the
   salt inside the hash string automatically.

Q: What does onDelete: Cascade do in Prisma?
A: When a parent record is deleted, all related child records are automatically
   deleted too. Example: delete User → all their Trips, Bookings, Notifications
   are gone. We don't have to manually clean up child records.

Q: What is CORS and why configure it?
A: Browsers block JS from calling APIs on a different origin (Same-Origin Policy).
   CORS headers tell the browser which origins are trusted. We restrict it to only
   the frontend URL so no other website can call our API using a user's session.`,
  },
];

// ── Sub-components ─────────────────────────────────────────────────────────────

/** Accordion item — header always visible, body slides open on click */
const AccordionItem = ({ section, isOpen, onToggle }) => (
  <div className="border border-gray-700/50 rounded-xl overflow-hidden">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-800/50 transition-colors duration-150"
      aria-expanded={isOpen}
    >
      <span className="flex items-center gap-3">
        <span className="text-xl">{section.icon}</span>
        <span className="font-semibold text-white text-sm sm:text-base">{section.title}</span>
      </span>
      <span className={`text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : "rotate-0"}`}>
        ▼
      </span>
    </button>

    {isOpen && (
      <div className="border-t border-gray-700/50 bg-gray-900/50">
        <pre className="p-5 text-sm text-gray-300 font-mono leading-relaxed whitespace-pre-wrap break-words overflow-x-auto">
          {section.content.trim()}
        </pre>
      </div>
    )}
  </div>
);

// ── Main Page ──────────────────────────────────────────────────────────────────

const InterviewNotesPage = () => {
  // openId tracks which accordion is currently expanded (null = all closed)
  const [openId, setOpenId] = useState(null);

  const toggle = (id) => setOpenId((prev) => (prev === id ? null : id));

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          📝 Interview Preparation Guide
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Everything you need to confidently explain VoyageAI in a placement interview.
          Click any section to expand it.
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Pages",      value: "25+", icon: "📄" },
          { label: "API Routes", value: "50+", icon: "🛣️" },
          { label: "DB Tables",  value: "10",  icon: "🗄️" },
          { label: "Features",   value: "23",  icon: "✅" },
        ].map(({ label, value, icon }) => (
          <div
            key={label}
            className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-3 text-center"
          >
            <div className="text-2xl mb-1">{icon}</div>
            <div className="text-xl font-bold text-white">{value}</div>
            <div className="text-xs text-gray-400">{label}</div>
          </div>
        ))}
      </div>

      {/* Architecture banner */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
        <p className="text-blue-300 font-semibold text-sm mb-2">
          🏗️ Core Architecture (memorise this!)
        </p>
        <p className="font-mono text-xs sm:text-sm text-blue-200 tracking-wide">
          Route → Middleware → Controller → Service → Repository → Prisma → PostgreSQL
        </p>
      </div>

      {/* Accordion */}
      <div className="space-y-3">
        {sections.map((section) => (
          <AccordionItem
            key={section.id}
            section={section}
            isOpen={openId === section.id}
            onToggle={() => toggle(section.id)}
          />
        ))}
      </div>

      {/* Footer tip */}
      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-sm text-green-300">
        <strong>💡 Interview Tip:</strong> Always explain the <em>why</em> behind your
        choices — why JWT over sessions, why PostgreSQL over MongoDB, why Socket.io over
        polling. Interviewers care more about your reasoning than your ability to list
        technologies.
      </div>
    </div>
  );
};

export default InterviewNotesPage;