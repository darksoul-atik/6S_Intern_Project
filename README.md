# ⚡ DevPulse

> **Next-Generation Full-Stack Developer Community & Collaboration Hub**  
> *(Intern Project — 7-Day Sprint)*

DevPulse is a high-performance, engineering-first developer community platform engineered as a clean, unified monorepo. It features a scalable **NestJS** backend integrated with **MongoDB** via **Mongoose** for resilient domain logic, alongside a modern **Next.js** App Router frontend styled with **Tailwind CSS**, **Framer Motion**, and **Google Inter** typography for a fluid, reactive developer experience.

---

## 📅 7-Day Roadmap & Implementation Status

| Day | Milestone | Focus Areas | Status |
|:---:|---|---|:---:|
| **Day 1** | **Foundation, Health Check, OpenAPI & UI** | Monorepo scaffolding, NestJS + Next.js App Router setup, Mongoose Atlas integration, live DB connection diagnostics (`/health`), interactive Swagger UI (`/docs`), generic typed API client (`lib/api.ts`), interactive Framer Motion `MeshGradientBackground` with cursor physics, and a sleek 2-column DevPulse login interface in Google Inter font. | ✅ **Completed** |
| **Day 2** | **Auth, Identity & Security** | User schema (Mongoose) with role field (`admin` \| `user`), shared response envelopes (`TransformInterceptor` & `HttpExceptionFilter`), `POST /auth/signup` with bcrypt hashing, `POST /auth/login` issuing signed JWTs, Passport `JwtAuthGuard`, `RolesGuard` + `@Roles()` decorator, admin bootstrap CLI seed script, Next.js BFF `httpOnly` cookie persistence, route protection middleware, frontend `/signup`, `/login`, and `/dashboard` pages with dynamic header badges. | ✅ **Completed** |
| **Day 3** | **Profiles & Account Management** | Extended user schema (bio, avatars, tech tags, socials), profile CRUD APIs, account settings dashboard, and dynamic `/profile/[username]` routing. | ⏳ *Upcoming* |
| **Day 4** | **Content Engine & Markdown Posts** | Markdown post editor with live preview, tags & categories, post CRUD operations, cursor/page pagination, and unified home feed. | ⏳ *Upcoming* |
| **Day 5** | **Community Engagement & Socials** | Threaded/nested comments system, polymorphic reactions (likes, stars, bookmarks), and optimistic UI interaction feedback. | ⏳ *Upcoming* |
| **Day 6** | **Trending Algorithms & Discovery** | Time-decay + engagement ranking algorithm (hot/trending/top), tag-based search and filtering, and an interactive Explore portal. | ⏳ *Upcoming* |
| **Day 7** | **Hardening, Testing & Final Audit** | End-to-end integration tests, rate limiting, audit logging, production optimization, final `AI_USAGE.md` compilation, and showcase preparation. | ⏳ *Upcoming* |

---

## 🛠️ Tech Stack Summary

- **Backend**: [NestJS](https://nestjs.com/) (Node.js, TypeScript), [Mongoose](https://mongoosejs.com/) (MongoDB ODM), `@nestjs/config`, `@nestjs/swagger`, `passport-jwt`, `bcryptjs`, `class-validator`
- **Frontend**: [Next.js](https://nextjs.org/) (React 19, TypeScript, App Router), [Tailwind CSS](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/), Google Inter Font
- **Database**: MongoDB (Atlas cloud cluster or local MongoDB)
- **API Documentation**: OpenAPI 3.0 / Swagger UI at `/docs`
- **Package Manager**: npm

---

## 🔐 Day 2 — Authentication, Authorization & Security Architecture

### 1. Key Architectural Decisions

#### Decision A: Token Persistence via `httpOnly` Cookies (Next.js BFF Pattern)
- **Chosen Approach**: The JWT access token is stored in an **`httpOnly`**, **`Secure`**, **`SameSite=Lax`** cookie (`devpulse_token`) managed via Next.js Route Handlers (`app/api/auth/*`).
- **Why this was chosen over `localStorage`**:
  1. **Maximum XSS Immunity**: `httpOnly` cookies cannot be accessed or stolen by client-side JavaScript (`document.cookie`), neutralizing cross-site scripting token exfiltration risks.
  2. **Server-Side Route Protection**: Next.js Edge `middleware.ts` can immediately inspect the cookie before rendering, redirecting unauthenticated visitors to `/login` without UI flicker or client layout shifts.
  3. **Decoupled Backend Architecture**: Next.js acts as a secure BFF (Backend-For-Frontend) proxy, extracting the cookie and forwarding it to the NestJS API as a standard `Authorization: Bearer <token>` header. This ensures NestJS remains a pure REST API compatible with mobile or external API clients.

#### Decision B: Admin Bootstrap via Idempotent CLI Seed Script
- **Chosen Approach**: Provisioning the initial administrator is executed through a dedicated CLI seed script (`npm run seed:admin` / `backend/src/scripts/seed-admin.ts`).
- **Why this was chosen over an HTTP Bootstrap Endpoint**:
  1. **Zero Attack Surface**: A public HTTP endpoint (even if protected by a shared secret or header) is exposed to network scans, brute-force attacks, and credential leaks. A CLI script runs entirely out-of-band in a trusted execution environment (terminal, container init, or CI/CD deployment pipeline).
  2. **Strict Principle of Least Privilege**: Creating high-privilege administrative accounts is an operational concern, not an application-layer user action.
  3. **Idempotence & Safety**: The script inspects the database: if the specified `ADMIN_EMAIL` already exists with role `admin`, it reports status without altering credentials; if the user exists under role `user`, it safely promotes them; if no user exists, it hashes `ADMIN_PASSWORD` via `bcrypt` (10 rounds) and creates the user with `role: 'admin'`.

---

### 2. Shared Response Envelope Convention

Implemented via global `TransformInterceptor` and `HttpExceptionFilter` in NestJS across **all endpoints** (including `/health`):

#### Success Envelope:
```json
{
  "success": true,
  "data": {},
  "message": "Optional human-readable feedback"
}
```

#### Error Envelope:
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Human-readable error description",
  "errors": ["Validation error detail 1", "Validation error detail 2"]
}
```

---

### 3. API Endpoints Reference

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/health` | Public | Live database connection diagnostics |
| `POST` | `/auth/signup` | Public | Register new user (`role: 'user'`), bcrypt hash password |
| `POST` | `/auth/login` | Public | Validate credentials, issue signed JWT `{ sub, email, role }` |
| `GET` | `/auth/me` | Bearer JWT | Protected route: returns current authenticated user identity |
| `GET` | `/auth/admin-check` | Admin Role | Protected route: requires `role: 'admin'` (403 for standard users) |

#### Frontend BFF Route Handlers (`frontend/src/app/api/auth/*`):
- `POST /api/auth/login`: Proxies to NestJS, writes `httpOnly` cookie `devpulse_token`.
- `POST /api/auth/logout`: Clears `devpulse_token` cookie and terminates session.
- `GET /api/auth/me`: Reads cookie, forwards Bearer token to NestJS `/auth/me`.
- `GET /api/auth/admin-check`: Reads cookie, forwards Bearer token to NestJS `/auth/admin-check`.

---

## 🔐 Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Example / Default |
|---|---|---|
| `PORT` | Port on which the NestJS HTTP API listens | `5000` |
| `MONGODB_URI` | MongoDB connection URI (Atlas or local) | `mongodb+srv://<user>:<pass>@cluster.mongodb.net/dev_community` |
| `JWT_SECRET` | Secret key used to sign and verify JWT tokens | `devpulse_super_secret_jwt_key_intern_2026_dev` |
| `JWT_EXPIRES_IN` | JWT token lifespan / expiration | `7d` |
| `ADMIN_NAME` | Display name for bootstrapped administrator | `DevPulse Administrator` |
| `ADMIN_EMAIL` | Email address for bootstrapped administrator | `admin@devpulse.io` |
| `ADMIN_PASSWORD` | Password for bootstrapped administrator | `Admin@SecurePass2026` |

### Frontend (`frontend/.env.local`)

| Variable | Description | Example / Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the backend API | `http://localhost:5000` |

---

## 🚀 Getting Started Locally

### 1. Clone the Repository

```bash
git clone https://github.com/darksoul-atik/6S_Intern_Project.git
cd 6S_Intern_Project
```

### 2. Backend Setup & Run

In a new terminal:

```bash
cd backend

# 1. Configure environment
cp .env.example .env
# Verify your MONGODB_URI and JWT_SECRET

# 2. Install dependencies
npm install

# 3. Bootstrap initial admin account (Optional/Recommended)
npm run seed:admin

# 4. Start development server
npm run start:dev
```

The backend boots at `http://localhost:5000` (Swagger docs at `http://localhost:5000/docs`).

### 3. Frontend Setup & Run

In a second terminal:

```bash
cd frontend

# 1. Configure environment
cp .env.example .env.local

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

The frontend boots at `http://localhost:3000`.

---

## 🔍 Day 2 Verification Guide

### 1. Admin Account Bootstrap
```bash
cd backend
npm run seed:admin
```
*Creates initial admin account (`admin@devpulse.io`). Rerunning proves idempotency.*

### 2. Live API Diagnostics (cURL)
```bash
# 1. User Signup
curl -X POST http://localhost:5000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Sarah Connor","email":"sarah@devpulse.io","password":"SecurePassword123"}'

# 2. User Login
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"sarah@devpulse.io","password":"SecurePassword123"}'

# 3. Verify /auth/me without token -> 401 Unauthorized
curl http://localhost:5000/auth/me

# 4. Verify /auth/me with Bearer token -> 200 OK
curl http://localhost:5000/auth/me -H "Authorization: Bearer <TOKEN>"

# 5. Verify /auth/admin-check with user token -> 403 Forbidden
curl http://localhost:5000/auth/admin-check -H "Authorization: Bearer <USER_TOKEN>"

# 6. Verify /auth/admin-check with admin token -> 200 OK
curl http://localhost:5000/auth/admin-check -H "Authorization: Bearer <ADMIN_TOKEN>"
```

### 3. Web UI Flow
1. Navigate to `http://localhost:3000/signup`:
   - Register a new account. Notice error validation alerts and success auto-redirect to `/login`.
2. Sign in at `http://localhost:3000/login`:
   - Authenticate with your new user credentials.
   - Automatically establishes the `httpOnly` cookie and redirects to `/dashboard`.
3. Test the Protected Dashboard (`http://localhost:3000/dashboard`):
   - Check the **Navbar**: shows your user name/email and role badge (`USER` or `ADMIN`).
   - Click **"Verify Identity via /auth/me"**: displays live verified JWT claims.
   - Click **"Test Admin Privilege (/auth/admin-check)"**: displays formatted `403 FORBIDDEN` for standard user, or `200 OK` for admin.
4. Test Logout:
   - Click **"Sign Out"**: clears the `httpOnly` session and redirects to `/login`.
   - Attempting to revisit `/dashboard` triggers server-side middleware redirect to `/login`.
