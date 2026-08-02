# AI Trip Planner 🗺️

An AI-powered travel planning platform built with a clean modular architecture.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, Tailwind CSS, React Router, Axios |
| Backend | Node.js, Express.js, REST API |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT |
| Real-time | Socket.io |
| Uploads | Multer + Cloudinary |
| Testing | Jest + Supertest |

## Architecture

```
Route → Controller → Service → Repository → Prisma (DB)
```

## Folder Structure

```
ai-trip-planner/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       ← DB models
│   │   └── seed.js             ← Test data
│   ├── src/
│   │   ├── config/             ← env, database, cloudinary
│   │   ├── controllers/        ← handle HTTP req/res
│   │   ├── services/           ← business logic
│   │   ├── repositories/       ← DB queries via Prisma
│   │   ├── routes/             ← URL path definitions
│   │   ├── middlewares/        ← auth, error, validate, upload
│   │   ├── validators/         ← input validation rules
│   │   ├── utils/              ← jwt, response helpers
│   │   ├── sockets/            ← Socket.io events
│   │   ├── __tests__/          ← Jest tests
│   │   ├── app.js              ← Express app setup
│   │   └── server.js           ← HTTP server entry point
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── common/         ← reusable UI (Button, Input etc.)
    │   │   └── layout/         ← Navbar, Sidebar, Layouts
    │   ├── context/            ← React Context (auth state)
    │   ├── hooks/              ← custom React hooks
    │   ├── pages/              ← one file per page/route
    │   ├── services/           ← API calls (axios)
    │   ├── utils/              ← helper functions
    │   ├── App.jsx             ← routes definition
    │   └── main.jsx            ← React DOM mount
    └── package.json
```

## Getting Started

### 1. Setup Backend

```bash
cd backend
cp .env.example .env        # Fill in your DB URL and secrets
npm install
npx prisma migrate dev --name init
npm run seed                # Optional: seed test data
npm run dev                 # Starts on http://localhost:5000
```

### 2. Setup Frontend

```bash
cd frontend
npm install
npm run dev                 # Starts on http://localhost:5173
```

### 3. API Health Check

```
GET http://localhost:5000/api/health
```

## Default Login (after seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@tripplanner.com | Admin@123 |
| User | demo@tripplanner.com | Demo@123 |
# VoyageAI
