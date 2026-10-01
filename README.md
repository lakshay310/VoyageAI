# VoyageAI — AI Trip Planner ✈️🗺️

> A full-stack AI-powered travel planning platform built with a clean **Route → Controller → Service → Repository → Prisma** architecture.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Folder Structure](#folder-structure)
- [Database Schema](#database-schema)
- [Features](#features)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Deployment (Without Docker)](#deployment-without-docker)
- [Running Tests](#running-tests)
- [Interview Notes](#interview-notes)

---

## Overview

VoyageAI is a complete travel-planning web application. Users can:

1. **AI Trip Planner** — describe a destination and get a Gemini-generated day-by-day itinerary
2. **Flights & Hotels** — browse curated inventory of flights and hotels across India
3. **Bookings** — record and manage flight/hotel/activity bookings per trip
4. **Expense Tracker** — log expenses by category and see budget vs. actual
5. **Travel Journal** — write diary entries per day of each trip
6. **Wishlist** — save dream destinations to visit later
7. **Reviews** — rate and review hotels, flights, and trip destinations
8. **Real-Time Notifications** — Socket.io pushes in-app alerts instantly
9. **Maps & Weather** — explore destinations on Leaflet map + live weather data
10. **Admin Dashboard** — manage users, view platform KPIs, check deployment status
11. **Analytics** — spending trends, booking breakdown, budget charts

---

## Tech Stack

| Layer          | Technology                        | Reason                                              |
|----------------|-----------------------------------|-----------------------------------------------------|
| Frontend       | React 19 + Vite + Tailwind CSS v4 | Fast builds, great DX, utility-first styling        |
| Routing        | React Router v7                   | Declarative, nested protected routes                |
| State          | React Context API                 | Lightweight — no Redux needed at this scale         |
| Charts         | Recharts                          | Composable, React-native chart library              |
| HTTP Client    | Axios                             | Interceptors, base URL, auto-auth header            |
| Real-time (FE) | socket.io-client                  | Matches the backend Socket.io server                |
| Backend        | Node.js + Express 5               | Non-blocking I/O, huge npm ecosystem                |
| ORM            | Prisma 5                          | Type-safe DB queries, auto migrations               |
| Database       | PostgreSQL (Neon serverless)      | Battle-tested relational DB                         |
| Auth           | JWT (jsonwebtoken)                | Stateless, no session store needed                  |
| File Uploads   | Multer + Cloudinary               | Multipart handling + CDN image storage              |
| Real-time (BE) | Socket.io                         | Event-based push notifications                      |
| AI             | Google Gemini 2.5 Flash           | Best-in-class text generation, free tier            |
| Security       | Helmet + express-rate-limit       | Security headers + brute-force protection           |
| Performance    | compression (gzip)                | Reduces JSON payload size ~70%                      |
| Caching        | In-memory Map (TTL-based)         | Zero-setup cache — swap for Redis in production     |
| Testing        | Jest + Supertest                  | Integration tests for API endpoints                 |
| Passwords      | bcryptjs                          | Industry-standard password hashing                  |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  CLIENT (React + Vite)                                          │
│                                                                 │
│  Pages → services/api.js (Axios) → AuthContext (JWT)           │
│  Hooks: useApi, useAuth, useNotifications                       │
└────────────────────────┬────────────────────────────────────────┘
                         │  HTTP REST + WebSocket (Socket.io)
┌────────────────────────▼────────────────────────────────────────┐
│  SERVER (Express + Socket.io)                                   │
│                                                                 │
│  Every request goes through these layers in order:             │
│                                                                 │
│  Route → Middleware → Controller → Service → Repository         │
│             │              │           │          │             │
│        (auth, rate     (thin HTTP  (business   (Prisma          │
│         limit,          req/res     logic)      queries)        │
│         validate)       wiring)                                  │
│                                                                 │
│  Global middleware stack (app.js):                              │
│    gzip → helmet → rate limiter → CORS → JSON parser →          │
│    morgan (dev only) → routes → error handler                   │
└────────────────────────┬────────────────────────────────────────┘
                         │  Prisma ORM
┌────────────────────────▼────────────────────────────────────────┐
│  DATABASE (PostgreSQL via Neon)                                 │
│  10 tables: User, Trip, Booking, Expense, Flight, Hotel,        │
│             Notification, Wishlist, JournalEntry, Review        │
└─────────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

| Layer          | Location                           | Responsibility                                    |
|----------------|------------------------------------|---------------------------------------------------|
| **Route**      | `src/routes/*.routes.js`           | Declares URL, HTTP method, and middleware chain   |
| **Controller** | `src/controllers/*.controller.js`  | Reads `req`, calls service, writes `res`          |
| **Service**    | `src/services/*.service.js`        | Business logic, validation, calls repository      |
| **Repository** | `src/repositories/*.repository.js` | All Prisma queries — only layer touching the DB   |
| **Prisma**     | `prisma/schema.prisma`             | Schema definition and auto-generated DB client    |

---

## Folder Structure

```
ai-trip-planner/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       ← All database models (10 tables)
│   │   └── seed.js             ← Inserts flights, hotels, and demo users
│   ├── scripts/
│   │   ├── check-env.js        ← Validates env vars before starting; exits 1 if missing
│   │   └── health-check.js     ← Hits /api/health to confirm the deployed server is up
│   └── src/
│       ├── config/
│       │   ├── env.js          ← Loads and exports all environment variables
│       │   ├── database.js     ← Prisma client singleton (one shared connection)
│       │   └── cloudinary.js   ← Cloudinary SDK configuration
│       ├── controllers/        ← One file per feature; thin HTTP wrappers
│       ├── services/           ← One file per feature; all business logic lives here
│       ├── repositories/       ← One file per feature; all Prisma queries live here
│       ├── routes/             ← One file per feature; URL definitions
│       ├── middlewares/
│       │   ├── auth.middleware.js        ← protect (JWT verify) + authorise (role check)
│       │   ├── error.middleware.js       ← Global error handler (must be last in app.js)
│       │   ├── rateLimiter.middleware.js ← General 200/15min + auth 10/15min limiters
│       │   ├── upload.middleware.js      ← Multer + Cloudinary storage engine
│       │   └── validate.middleware.js   ← express-validator runner
│       ├── validators/         ← express-validator rule arrays, one file per feature
│       ├── sockets/
│       │   └── index.js        ← Socket.io init + userId room join handler
│       ├── utils/
│       │   ├── AppError.js     ← Custom error class with statusCode + isOperational
│       │   ├── cache.js        ← In-memory Map cache with TTL expiry
│       │   ├── jwt.js          ← generateToken and verifyToken helpers
│       │   ├── paginate.js     ← Prisma-based pagination (skip + take + count)
│       │   └── response.js     ← sendSuccess / sendError — consistent response shape
│       ├── __tests__/          ← Jest + Supertest integration tests (5 files)
│       ├── app.js              ← Express app: all middleware + routes wired up
│       └── server.js           ← HTTP server entry point + Prisma connect + Socket.io
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── common/         ← LoadingSpinner, EmptyState, StarRating, etc.
    │   │   └── layout/         ← Navbar, Sidebar (hover-expand), DashboardLayout, ProtectedRoute
    │   ├── context/
    │   │   └── AuthContext.jsx ← Global auth state (user, login, logout, loading)
    │   ├── hooks/
    │   │   ├── useApi.js            ← Custom hook: manages loading/error/data for any API call
    │   │   ├── useAuth.js           ← Convenience re-export of useContext(AuthContext)
    │   │   └── useNotifications.js  ← Socket.io listener + notification state
    │   ├── pages/              ← 27 JSX files — one per route
    │   ├── services/           ← 19 JS files — one per feature; Axios calls to the backend
    │   ├── utils/              ← formatDate, formatCurrency, and other helpers
    │   ├── constants/
    │   │   └── index.js        ← TRIP_STATUS, STATUS_COLORS, EXPENSE_CATEGORIES etc.
    │   ├── App.jsx             ← React Router route tree with lazy loading + Suspense
    │   └── main.jsx            ← ReactDOM.createRoot entry point
    └── package.json
```

---

## Database Schema

| Table          | Key Fields                                                 | Relations                        |
|----------------|------------------------------------------------------------|----------------------------------|
| **User**       | id, name, email, password (hash), avatar, role (USER/ADMIN)| → Trip, Booking, Notification, Wishlist, Review |
| **Trip**       | id, title, destination, startDate, endDate, budget, status, itinerary | → Booking, Expense, JournalEntry |
| **Booking**    | id, type (FLIGHT/HOTEL/CAR/ACTIVITY), provider, reference, amount, status | → User, Trip |
| **Expense**    | id, title, amount, category (FOOD/TRANSPORT/etc), date     | → Trip                           |
| **Flight**     | id, flightNumber, airline, fromCode, toCode, departureTime, price, stops | (inventory) |
| **Hotel**      | id, name, city, starRating, pricePerNight, roomType, amenities | (inventory) |
| **Notification** | id, title, message, type, isRead, link                  | → User                           |
| **Wishlist**   | id, destination, country, category, priority, visited      | → User                           |
| **JournalEntry** | id, title, content, mood, location, date, isPublic       | → Trip                           |
| **Review**     | id, rating, comment, targetType (HOTEL/FLIGHT/TRIP), targetId | → User (polymorphic)         |

**Important constraints:**
- `onDelete: Cascade` on all User → child relations (deleting a user cleans up everything)
- `@@unique([userId, targetType, targetId])` on Review (one review per item per user)
- `@@index([userId])` on Notification and Wishlist for fast per-user queries

---

## Features

| # | Module                  | Backend API | Frontend Page        |
|---|-------------------------|-------------|----------------------|
| 1 | Auth (JWT + bcrypt)     | ✅          | Login / Register     |
| 2 | Trip CRUD               | ✅          | Trips / TripDetail   |
| 3 | Dashboard               | ✅          | Dashboard            |
| 4 | AI Trip Planner         | ✅          | AIPlannerPage        |
| 5 | Admin Panel             | ✅          | AdminPage            |
| 6 | Analytics & Charts      | ✅          | AnalyticsPage        |
| 7 | Flight Search           | ✅          | FlightSearchPage     |
| 8 | Hotel Search            | ✅          | HotelSearchPage      |
| 9 | Bookings                | ✅          | BookingsPage         |
| 10| Expense Tracker         | ✅          | ExpenseTrackerPage   |
| 11| Interactive Maps        | ✅          | MapExplorerPage      |
| 12| Live Weather            | ✅          | WeatherPage          |
| 13| Real-time Notifications | ✅          | NotificationsPage    |
| 14| Wishlist                | ✅          | WishlistPage         |
| 15| Travel Journal          | ✅          | JournalPage          |
| 16| Reviews & Ratings       | ✅          | ReviewsPage          |
| 17| Search & Pagination     | ✅          | SearchPage           |
| 18| Security                | ✅          | SecurityPage         |
| 19| File Uploads            | ✅          | Profile / Trip form  |
| 20| Testing                 | ✅ (Jest)   | —                    |
| 21| Performance             | ✅ (gzip + cache) | (lazy loading)  |
| 22| Code Refactoring        | ✅          | ✅                   |
| 23| Deployment Prep         | ✅          | DeploymentPage       |
| 24| Interview Notes         | —           | InterviewNotesPage   |

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (local or hosted on Neon / Railway / Supabase)
- Cloudinary account (free tier)
- Google Gemini API key — free at [aistudio.google.com](https://aistudio.google.com)

### 1. Clone & install

```bash
git clone https://github.com/your-username/ai-trip-planner.git
cd ai-trip-planner

cd backend  && npm install
cd ../frontend && npm install
```

### 2. Configure backend environment

```bash
cd backend
cp .env.example .env
# Edit .env — fill in DATABASE_URL, JWT_SECRET, CLOUDINARY_*, GEMINI_API_KEY
```

### 3. Set up the database

```bash
cd backend
npx prisma migrate dev --name init   # creates tables
npm run seed                          # optional: inserts flights, hotels, demo users
```

### 4. Run in development

```bash
# Terminal 1
cd backend && npm run dev    # http://localhost:5000

# Terminal 2
cd frontend && npm run dev   # http://localhost:5173
```

### 5. Open the app

| URL                                       | Purpose            |
|-------------------------------------------|--------------------|
| http://localhost:5173                     | Frontend           |
| http://localhost:5000/api/health          | API health check   |
| http://localhost:5173/deployment (admin)  | Deployment status  |
| http://localhost:5173/interview-notes     | Interview prep     |

### Default accounts (after seeding)

| Role  | Email                      | Password  |
|-------|----------------------------|-----------|
| Admin | admin@tripplanner.com       | Admin@123 |
| User  | demo@tripplanner.com        | Demo@123  |

---

## Environment Variables

### Backend (`.env`)

| Variable               | Example                               | Required |
|------------------------|---------------------------------------|----------|
| `PORT`                 | `5000`                                | Yes      |
| `NODE_ENV`             | `development` / `production`          | Yes      |
| `DATABASE_URL`         | `postgresql://user:pass@host/db`      | Yes      |
| `JWT_SECRET`           | `a-long-random-secret`                | Yes      |
| `JWT_EXPIRES_IN`       | `7d`                                  | Yes      |
| `CLIENT_URL`           | `http://localhost:5173`               | Yes      |
| `CLOUDINARY_CLOUD_NAME`| `your_cloud_name`                     | Yes      |
| `CLOUDINARY_API_KEY`   | `your_api_key`                        | Yes      |
| `CLOUDINARY_API_SECRET`| `your_api_secret`                     | Yes      |
| `GEMINI_API_KEY`       | `AIza...`                             | Yes      |

Copy `.env.example` → `.env` (dev) or `.env.production.example` → `.env` (prod).

### Frontend (`.env`)

| Variable      | Example                              |
|---------------|--------------------------------------|
| `VITE_API_URL`| `http://localhost:5000/api`          |

---

## API Reference

All endpoints are prefixed with `/api`. Protected routes require `Authorization: Bearer <token>`.

### Auth
| Method | Endpoint              | Auth    | Description              |
|--------|-----------------------|---------|--------------------------|
| POST   | /auth/register        | Public  | Create account           |
| POST   | /auth/login           | Public  | Login, receive JWT       |
| GET    | /auth/me              | JWT     | Get current user profile |
| PATCH  | /auth/me              | JWT     | Update name              |
| PATCH  | /auth/password        | JWT     | Change password          |
| POST   | /auth/avatar          | JWT     | Upload profile picture   |

### Trips
| Method | Endpoint              | Auth    | Description              |
|--------|-----------------------|---------|--------------------------|
| GET    | /trips                | JWT     | List my trips            |
| POST   | /trips                | JWT     | Create a trip            |
| GET    | /trips/:id            | JWT     | Get trip detail          |
| PUT    | /trips/:id            | JWT     | Update a trip            |
| DELETE | /trips/:id            | JWT     | Delete a trip            |

### Bookings
| Method | Endpoint                       | Auth | Description               |
|--------|--------------------------------|------|---------------------------|
| GET    | /trips/:tripId/bookings        | JWT  | List trip bookings        |
| POST   | /trips/:tripId/bookings        | JWT  | Create a booking          |
| GET    | /bookings                      | JWT  | All my bookings (filtered)|
| GET    | /bookings/:id                  | JWT  | Get one booking           |
| PUT    | /bookings/:id                  | JWT  | Update a booking          |
| DELETE | /bookings/:id                  | JWT  | Delete a booking          |

### Expenses
| Method | Endpoint                          | Auth | Description                  |
|--------|-----------------------------------|------|------------------------------|
| GET    | /trips/:tripId/expenses           | JWT  | List trip expenses           |
| POST   | /trips/:tripId/expenses           | JWT  | Log an expense               |
| GET    | /trips/:tripId/expenses/summary   | JWT  | Breakdown by category        |
| PUT    | /expenses/:id                     | JWT  | Update an expense            |
| DELETE | /expenses/:id                     | JWT  | Delete an expense            |

### Other modules
| Method | Endpoint                          | Auth  | Description                     |
|--------|-----------------------------------|-------|---------------------------------|
| POST   | /ai/generate-itinerary            | JWT   | Generate AI itinerary (Gemini)  |
| POST   | /ai/chat                          | JWT   | AI chatbot message              |
| GET    | /flights                          | JWT   | Search flights                  |
| GET    | /hotels                           | JWT   | Search hotels                   |
| GET    | /dashboard                        | JWT   | Dashboard summary               |
| GET    | /analytics                        | JWT   | Full analytics                  |
| GET    | /maps/places                      | JWT   | Place search                    |
| GET    | /weather                          | JWT   | Live weather for a city         |
| GET    | /notifications                    | JWT   | List notifications              |
| PATCH  | /notifications/:id/read           | JWT   | Mark one as read                |
| PATCH  | /notifications/read-all           | JWT   | Mark all as read                |
| GET    | /wishlist                         | JWT   | List wishlist items             |
| POST   | /wishlist                         | JWT   | Add to wishlist                 |
| GET    | /journal                          | JWT   | List journal entries            |
| POST   | /journal/trip/:tripId             | JWT   | Create journal entry            |
| GET    | /reviews                          | JWT   | List my reviews                 |
| POST   | /reviews                          | JWT   | Submit a review                 |
| GET    | /search                           | JWT   | Global search                   |
| GET    | /admin/overview                   | ADMIN | Admin overview                  |
| GET    | /admin/users                      | ADMIN | All users (paginated)           |
| PATCH  | /admin/users/:id/role             | ADMIN | Update user role                |
| DELETE | /admin/users/:id                  | ADMIN | Delete a user                   |
| GET    | /deployment/status                | ADMIN | Deployment readiness report     |
| GET    | /health                           | Public| Server health check             |

---

## Deployment (Without Docker)

### Backend — Render / Railway

```bash
# 1. Create PostgreSQL on Neon (free) or Railway
# 2. Set all env vars from .env.production.example in the platform dashboard
# 3. Set build command:
npx prisma generate && npx prisma migrate deploy
# 4. Set start command (prestart auto-runs check-env.js):
npm start
# 5. Verify after deploy:
node scripts/health-check.js https://your-api.onrender.com
```

### Frontend — Vercel

```bash
# Root directory: frontend/
# Build command: npm run build
# Output directory: dist/
# Add env var: VITE_API_URL=https://your-api.onrender.com/api
```

### Deployment Scripts

```bash
npm run check:env    # Validate all env vars — exits 1 if any are missing
npm run health       # Ping /api/health and report response time
npm run build        # npx prisma generate (regenerates Prisma Client)
```

Post-deploy: Log in as admin → visit `/deployment` → confirm all checklist items show ✅.

---

## Running Tests

```bash
cd backend
npm test             # Runs all tests in src/__tests__/

# Test files:
#   auth.test.js     → register, login, token validation
#   trips.test.js    → CRUD, ownership, date validation
#   analytics.test.js → summary, spending, budget endpoints
#   admin.test.js    → admin-only route protection
#   utils.test.js    → cache TTL, paginate, AppError
```

---

## Interview Notes

The in-app interview guide is at `/interview-notes` (log in required).

It covers:
- 2-minute project pitch
- Architecture deep-dive
- Auth & security explanation
- Database design decisions
- Real-time notification flow
- AI integration
- Performance optimisations
- Testing strategy
- Deployment walkthrough
- 10 common interview Q&A

The full written version is in [`INTERVIEW_NOTES.md`](./INTERVIEW_NOTES.md).