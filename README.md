# ⚡ DevPulse

> **Next-Generation Full-Stack Developer Community & Collaboration Platform**  
> *Engineered as a high-performance monorepo with NestJS 11, Next.js 16 (App Router), MongoDB Replica Set, and Groq Cloud AI.*

[![NestJS](https://img.shields.io/badge/Backend-NestJS%2011-ea284e?style=flat-square&logo=nestjs)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2016%20App%20Router-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB%207.0%20Replica%20Set-green?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![Docker](https://img.shields.io/badge/Orchestration-Docker%20Compose-2496ed?style=flat-square&logo=docker)](https://www.docker.com/)
[![TanStack Query](https://img.shields.io/badge/State-TanStack%20Query%20v5-ff4154?style=flat-square&logo=react-query)](https://tanstack.com/query)
[![Groq](https://img.shields.io/badge/AI-Groq%20Cloud%20LLM-f55036?style=flat-square)](https://groq.com/)

---

## 📑 Table of Contents
1. [Overview & Core Value](#-overview--core-value)
2. [Architecture Overview](#-architecture-overview)
3. [Quick Start (Clean Checkout)](#-quick-start-clean-checkout)
   - [Option A: Full Docker Stack (Recommended)](#option-a-full-docker-stack-recommended)
   - [Option B: Local Development Setup](#option-b-local-development-setup)
4. [Environment Variables Reference](#-environment-variables-reference)
5. [Backend Architecture & Specifications](#-backend-architecture--specifications)
6. [Frontend Architecture & Specifications](#-frontend-architecture--specifications)
7. [Custom Features (Beyond the Original Plan)](#-custom-features-beyond-the-original-plan)
8. [Automated Testing & Verification](#-automated-testing--verification)
9. [Known Limitations & Roadmap](#-known-limitations--roadmap)
10. [Documentation Index](#-documentation-index)

---

## 🌟 Overview & Core Value

DevPulse is a full-stack community platform engineered for developers. It combines modern social mechanics (discussion feeds, engagements, threaded comments) with professional portfolio showcasing (skills, verified experiences, project repositories) and on-demand artificial intelligence.

Key engineering highlights:
* **Production-Grade Security**: Dual `httpOnly` cookies managed via a Next.js BFF proxy; SHA-256 rotated refresh tokens in MongoDB.
* **Deterministic Feed Ranking**: Multi-criteria sorting (`Top`, `Latest`, `Discussed`) with secondary tie-breakers to prevent feed jitter.
* **ACID Concurrency Safety**: MongoDB replica-set transactions for atomic reaction counter syncing and thread cascade deletions.
* **On-Demand AI Insights**: Groq Cloud inference (`openai/gpt-oss-20b`) generating instant executive summaries and extracted skill tags.

---

## 🏛️ Architecture Overview

DevPulse implements the **Backend-For-Frontend (BFF)** pattern. The client browser communicates exclusively through Next.js App Router route handlers and edge middleware, preventing direct client exposure to raw backend JWT tokens or external API keys.

```
Browser (React 19)
    │
    │  Dual httpOnly Cookies (devpulse_token, devpulse_refresh_token)
    ▼
Next.js 16 BFF Layer (Port 3000)
    │  • Edge Middleware Gating
    │  • Axios 401 Interceptor with Promise Coalescing
    │  • Server-Side Proxy Handlers
    │
    │  Authorization: Bearer <JWT>
    ▼
NestJS 11 REST API (Port 5000)
    │  • Global Envelope Filters & Validation Pipes
    │  • RBAC & Resource Ownership Guards
    │  • Throttler Rate Limiting (IP-based)
    │
    ├──▶ MongoDB 7.0 Replica Set (ACID Transactions, Compound Indexes)
    └──▶ Groq Cloud API (High-Speed LLM Inference with Mock Fallback)
```

For complete architectural details, see [System Architecture Specification](docs/architecture.md).

---

## 🚀 Quick Start (Clean Checkout)

### Option A: Full Docker Stack (Recommended)
Run the entire production stack (Frontend, Backend, MongoDB Replica Set, and Replica Init) with a single command:

```bash
# 1. Clone the repository
git clone https://github.com/darksoul-atik/6S_Intern_Project.git
cd 6S_Intern_Project

# 2. Start all services in the background
docker compose up --build -d

# 3. Verify container health
docker compose ps
```

* **Frontend**: Open [http://localhost:3000](http://localhost:3000)
* **Backend API & Swagger Docs**: Open [http://localhost:5000/docs](http://localhost:5000/docs)
* **Bootstrap Admin (First run)**:
  ```bash
  docker compose exec backend npm run seed:admin
  ```
* **Tear down stack**:
  ```bash
  docker compose down -v
  ```

---

### Option B: Local Development Setup

#### 1. Prerequisites
* **Node.js**: v20+ (tested on Node 24)
* **MongoDB**: v6.0+ replica set (or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster)
* **npm**: v10+

#### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env and supply your MONGODB_URI and JWT secrets

# (Optional) Seed initial administrator
npm run seed:admin

# Start development server
npm run start:dev
```
Backend will be listening at `http://localhost:5000`.

#### 3. Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local

# Start Next.js development server
npm run dev
```
Frontend will be running at `http://localhost:3000`.

---

## 🔑 Environment Variables Reference

A unified template is provided in [.env.example](.env.example).

| Variable | Target | Description | Example / Default |
| :--- | :---: | :--- | :--- |
| `PORT` | Backend | Port for NestJS HTTP server | `5000` |
| `NODE_ENV` | Both | Runtime environment | `development` / `production` |
| `FRONTEND_ORIGINS` | Backend | CORS allowed origins (comma-separated) | `http://localhost:3000` |
| `MONGODB_URI` | Backend | Connection string to MongoDB replica set | `mongodb+srv://...` |
| `JWT_SECRET` | Backend | Secret key for signing 15-minute access tokens | Min 32 random characters |
| `JWT_EXPIRES_IN` | Backend | Access token duration | `15m` |
| `JWT_REFRESH_SECRET` | Backend | Secret key for signing 7-day refresh tokens | Min 32 random characters |
| `JWT_REFRESH_EXPIRES_IN`| Backend | Refresh token duration | `7d` |
| `ADMIN_NAME` | Backend | Initial bootstrap administrator name | `DevPulse Administrator` |
| `ADMIN_EMAIL` | Backend | Initial bootstrap administrator email | `admin@devpulse.io` |
| `ADMIN_PASSWORD` | Backend | Initial bootstrap administrator password | `Admin@SecurePass2026` |
| `GROQ_API_KEY` | Backend | Groq Cloud API key (falls back to mock if empty) | `gsk_...` |
| `GROQ_MODEL` | Backend | Model identifier for summarization | `openai/gpt-oss-20b` |
| `NEXT_PUBLIC_API_URL` | Frontend | Browser-facing API endpoint | `http://localhost:5000` |
| `BACKEND_INTERNAL_URL`| Frontend | Server-side internal API endpoint for BFF | `http://localhost:5000` |

---

## ⚙️ Backend Architecture & Specifications

### Modules
* **`AuthModule`**: User registration, login, token rotation, and RBAC guards.
* **`UsersModule`**: Developer profiles, skills, work experience, and admin user moderation.
* **`PostsModule`**: Post authoring, feed aggregation pipelines, soft-delete, and hourly purge cron.
* **`CommentsModule`**: Top-level comments and 1-level nested replies with `@mentions`.
* **`ReactionsModule`**: Concurrency-safe post and comment like/dislike toggle engine.
* **`SummarizerModule`**: Groq Cloud LLM integration with input truncation and mock fallback.
* **`HealthModule`**: Diagnostic liveness probe (`GET /health`) checking MongoDB pool health.

### Database Models & ER Diagram
Full Mermaid diagrams and index specifications are documented in [Database Architecture](docs/db-diagram.md).
* **`User`**: Accounts, profiles, skills array, work experiences, portfolio projects, and hashed refresh token.
* **`Post`**: Title, body, author reference, reaction counts, comment count, and rank score.
* **`Comment`**: Body, post reference, author reference, parent comment reference (depth 1), and mentioned user.
* **`Reaction`**: Compound unique index `{ userId, targetType, targetId }` ensuring atomic single reactions.

### Interactive API Documentation (Swagger)
The OpenAPI 3.0 specification is available interactively at:
$$\text{http://localhost:5000/docs}$$

---

## 💻 Frontend Architecture & Specifications

### Mandated Feature-Driven Layout
The frontend adheres to strict modularization under `frontend/src/features/`:
* `admin/`: Moderation table, user management modals, role upgrade controls.
* `auth/`: Login and signup forms, validation schemas, auth redirect helpers.
* `comments/`: Comment hierarchy, reply forms, delete confirmation dialog.
* `posts/`: Feed sorting dropdown, post cards, markdown editor, search input.
* `reactions/`: Reaction buttons, reactors list modal, hover peek popover.
* `users/`: Public profile view, profile edit forms, work experience modals.

### Form Validation (React Hook Form + Zod)
Forms use `mode: "onTouched"`, combining non-intrusive initial typing with instant validation once touched. All schemas are centralized in `schemas/` and validated via `@hookform/resolvers/zod`.

### TanStack Query Patterns
* **Cache Partitioning**: Feeds are isolated by query key:
  ```typescript
  postKeys.feed(sort, limit) // ['posts', 'feed', sort, { limit }]
  ```
  Switching between `Top`, `Latest`, and `Discussed` avoids refetch flickers.
* **Optimistic Reactions**: Immediate UI feedback on like/dislike with automatic rollback on network failure.

---

## 🚀 Custom Features (Beyond the Original Plan)

DevPulse contains four custom features implemented beyond the standard 20-day requirements. See [Custom Features Deep Dive](docs/custom-features.md) for complete technical breakdowns:

1. **Clickable Commenter Profiles**:
   Comment author avatars and names are interactive links to `/developers/[id]`, backed by lean projection queries that never expose sensitive user data.
2. **Flattened Same-Depth Replies with @Mentions**:
   Restricts reply nesting to depth = 1 to prevent mobile horizontal squishing, preserving conversational flow via structured `@Mention` tags linked to `mentionedUserId`.
3. **Reactors List Modal & Hover Peek**:
   Allows community transparency by revealing who liked or disliked any post/comment via a 300ms hover peek popover and a paginated dialog filterable by reaction type.
4. **Groq Cloud AI Summarizer**:
   On-demand post summarization powered by `openai/gpt-oss-20b`, featuring an 8-second timeout guard, 12,000-character input boundary truncation, and a fallback to `MockSummarizerProvider`.

---

## 🧪 Automated Testing & Verification

### Running Backend Tests (Vitest)
```bash
cd backend

# Run all unit and integration tests
npm run test

# Run with test coverage report
npm run test:cov
```
* **Coverage**: 27 test files, 212 tests. 24 unit suites pass cleanly (200/200 unit tests).

### Running Frontend Tests (Vitest)
```bash
cd frontend

# Run frontend test suite (using threads pool for Windows stability)
npx vitest run --pool=threads
```
* **Coverage**: 7 test files, 62 tests (**100% pass rate**).
* **Linting**:
  ```bash
  npm run lint
  ```
* **Production Build**:
  ```bash
  npm run build
  ```

---

## ⚠️ Known Limitations & Roadmap

We believe in honest, transparent engineering. Current constraints identified during Day 20 smoke tests are logged in [Known Limitations](docs/known-issues.md):
1. **Dual Database Contexts**: Docker Compose points to local MongoDB replica set `rs0`, while host dev servers read `backend/.env` pointing to MongoDB Atlas.
2. **Next.js Standalone Image Rebuild**: UI changes in Docker require running `docker compose up --build frontend` to recompile the standalone bundle.
3. **Frontend Vitest on Windows**: Requires the `--pool=threads` CLI flag to avoid Windows child process fork timeouts.
4. **Future Roadmap**: Redis cache layer for feed ranking, WebSockets for live mention notifications, and direct-to-S3 avatar uploads.

---

* [Complete Workflow & Technical Decisions Specification](docs/workflow-and-technical-decisions.md) — Comprehensive end-to-end workflows and architectural trade-off analysis.
* [Workflow & Technical Decisions PDF](docs/DevPulse_Project_Workflow_and_Technical_Decisions.pdf) — Printable executive PDF document covering system workflows and technical decisions.
* [20-Day Full-Stack Milestone Tracking Sheet](docs/devpulse-20day-tracking-sheet.md) ([CSV format](docs/devpulse_20day_tracking_sheet.csv)) — Complete day-by-day deliverable tracking sheet.
* [Agile Jira Board & Sprint Backlog](docs/jira-board-day20.md) ([Jira CSV Import](docs/jira_backlog_day20.csv)) — Full 5-sprint Scrum backlog and user story matrix as of Day 20.
* [System Architecture Specification](docs/architecture.md) — BFF pattern, dual cookies, and security design.
* [Database Architecture & ER Diagram](docs/db-diagram.md) — Schemas, indexes, and transaction boundaries.
* [Custom Features Deep Dive](docs/custom-features.md) — Breakdown of features built beyond the original plan.
* [Known Limitations & Roadmap](docs/known-issues.md) — Transparent limitation log and next steps.
* [Day 17 Test Matrix](backend/docs/day-17-test-matrix.md) — Test suite inventory and coverage report.

