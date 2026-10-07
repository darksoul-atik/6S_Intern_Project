# DevPulse — Agile Jira Board & Sprint Backlog Specification (Day 20)

> **Project Key**: `DP`  
> **Project Name**: DevPulse Full-Stack Platform  
> **Project Lead / Lead Developer**: DevPulse Team  
> **Methodology**: Scrum / 2-Week Sprints (5 Sprints total across 20 Days)  
> **Current Status as of Day 20**: **All Sprints Closed (100% Completed)** • 148 Story Points Delivered

---

## 🏛️ Epic Breakdown

| Epic Key | Epic Name | Summary & Scope | Story Points | Status |
| :--- | :--- | :--- | :---: | :---: |
| **DP-EPIC-1** | **Foundations, Architecture & Authentication** | NestJS modular layout, Mongoose ODM setup, Swagger OpenAPI, Next.js BFF proxy, dual `httpOnly` cookie authentication, Edge middleware route gating. | 29 pts | ✅ **CLOSED** |
| **DP-EPIC-2** | **Developer Profiles, Forms & Post Feeds** | Developer profile CRUD, nested skills, work experience timeline, portfolio subdocuments with chronological validation, post authoring, soft-delete, and hourly purge cron. | 31 pts | ✅ **CLOSED** |
| **DP-EPIC-3** | **Community Discussions, Threading & Reactions** | Threaded comments, depth-1 reply enforcement, @Mentions, reaction toggle engine with MongoDB ACID transactions, optimistic UI updates, reactors list modal with tabs. | 32 pts | ✅ **CLOSED** |
| **DP-EPIC-4** | **Discovery Engines, Feed Ranking & AI Intelligence** | Multi-criteria feed sorting (`top`, `latest`, `most-discussed`), deterministic rank score algorithm, debounced full-text search, Groq Cloud LLM post summarizer. | 28 pts | ✅ **CLOSED** |
| **DP-EPIC-5** | **Testing, Hardening, Containerization & Release** | Full-stack test matrix (274 tests), SHA-256 refresh token rotation, NestJS Throttler rate limiting, multi-stage Docker Compose orchestration, Day 20 smoke tests & documentation. | 28 pts | ✅ **CLOSED** |

---

## 🏃 Sprint-by-Sprint Ticket Backlog

### Sprint 1: Architecture, Contracts & Authentication (Days 1–4)
* **Goal**: Establish the full-stack monorepo foundation, standard response/error envelopes, Swagger docs, and secure cookie-based auth.

| Issue Key | Type | Summary | Component | Points | Status | Acceptance Criteria / Implementation Verification |
| :--- | :---: | :--- | :---: | :---: | :---: | :--- |
| **DP-101** | Story | Setup NestJS Modular Monorepo & Mongoose | Backend | 5 | Done | `AppModule`, `HealthModule`, `UsersModule`, `AuthModule` initialized; `GET /health` returns operational connection pool state. |
| **DP-102** | Story | Next.js 16 App Router Setup & System Status Page | Frontend | 3 | Done | Next.js App Router configured with Tailwind CSS; `/status` page visualizes live health states (loading, operational, offline). |
| **DP-103** | Story | Standard Response Envelopes & Swagger OpenAPI | Backend | 3 | Done | `TransformInterceptor` wraps successes (`{ success, data }`); `HttpExceptionFilter` formats errors; `/docs` serves interactive OpenAPI UI. |
| **DP-104** | Story | Backend Authentication & Password Hashing | Backend | 5 | Done | `User` schema with unique lowercase email; bcrypt password hashing (10 rounds); `POST /auth/signup` and `/auth/login` issue signed JWT. |
| **DP-105** | Story | Idempotent CLI Admin Bootstrap Script | Backend | 3 | Done | `npm run seed:admin` seeds or promotes `ADMIN_EMAIL` safely without modifying credentials if admin already exists. |
| **DP-106** | Story | Next.js BFF Proxy with Dual httpOnly Cookies | Frontend | 5 | Done | Route Handlers (`/api/auth/*`) set `devpulse_token` (15m) and `devpulse_refresh_token` (7d); client components never touch raw JWT strings. |
| **DP-107** | Story | React Hook Form & Centralized Zod Validation | Frontend | 3 | Done | `signupSchema` and `loginSchema` validate in `onTouched` mode; double-submit button disabling with spinning indicator. |
| **DP-108** | Story | Edge Middleware Protected Route Gating | Frontend | 2 | Done | `middleware.ts` guards `/dashboard`, `/profile`, `/admin`, redirecting unauthenticated users to `/login?redirect=<path>`. |

---

### Sprint 2: Profiles, Forms & Feed Infrastructure (Days 5–8)
* **Goal**: Deliver developer portfolios, nested project subdocuments, post CRUD with soft-deletion, and responsive infinite feeds.

| Issue Key | Type | Summary | Component | Points | Status | Acceptance Criteria / Implementation Verification |
| :--- | :---: | :--- | :---: | :---: | :---: | :--- |
| **DP-109** | Story | Developer Profile Schema & Ownership Authorization | Backend | 5 | Done | Headline (max 160), bio (max 2000), skills array; `ProfileOwnerOrAdminGuard` rejects unauthorized profile mutations with 403 Forbidden. |
| **DP-110** | Story | Portfolio Projects Subdocument Modeling & Validation | Backend | 5 | Done | `PortfolioProjectDto` validates URL formats, technology tags (1–20), and date constraints (`startDate <= endDate` or `isCurrent: true`). |
| **DP-111** | Story | Dynamic Portfolio Project Form & Branded Delete Modal | Frontend | 5 | Done | Form uses `useFieldArray` for dynamic project URLs and skills; custom glassmorphic `DeleteProjectModal` replaces browser `confirm()`. |
| **DP-112** | Story | Public vs. Private Profile Projections | Backend | 3 | Done | `GET /users/:id` executes explicit projection, stripping password and session hashes while exposing public developer attributes. |
| **DP-113** | Story | Posts REST API with Soft-Delete & Hourly Purge Task | Backend | 5 | Done | Post schema with author reference; `DELETE /posts/:id` sets `deletedAt`; `@Cron(CronExpression.EVERY_HOUR)` purges posts older than 5 days. |
| **DP-114** | Story | Infinite Scroll Feed & Markdown Post Presentation | Frontend | 5 | Done | High-contrast glassmorphic `PostCard`; `useInfiniteQuery` + Intersection Observer infinite scroll; Markdown rendering with code blocks. |
| **DP-115** | Story | Post Authoring Form & Client Validation | Frontend | 3 | Done | Author form (`/posts/new`) validates title (1–200 chars) and body (1–20,000 chars); auto-redirects to new post upon submission. |

---

### Sprint 3: Community Discussions, Threading & Reactions (Days 9–12)
* **Goal**: Build threaded discussions, concurrency-safe reactions with MongoDB transactions, and social proof UI features.

| Issue Key | Type | Summary | Component | Points | Status | Acceptance Criteria / Implementation Verification |
| :--- | :---: | :--- | :---: | :---: | :---: | :--- |
| **DP-116** | Story | Threaded Comments Schema & Single-Query Tree Assembly | Backend | 5 | Done | Self-referencing Mongoose model (`parentCommentId`); single-query tree hierarchy assembly; atomic counter sync on post and user models. |
| **DP-117** | Story | Flattened Depth-1 Reply Constraint with @Mentions | Backend | 5 | Done | Enforces max depth = 1 (`POST /posts/:postId/comments/:cId/replies`); stores `mentionedUserId`; nested reply branching rejected with 400. |
| **DP-118** | Story | Interactive Comment Tree & Reply Form UX | Frontend | 5 | Done | `CommentItem` renders level-1 replies; auto-focus on reply input; inline `@Developer` badge rendering; cascade deletion warning modal. |
| **DP-119** | Story | Concurrency-Safe Reaction Engine via MongoDB Transactions | Backend | 8 | Done | Like/dislike toggle inside `ClientSession` transaction with retry loop; compound unique index `{ userId, targetType, targetId }`. |
| **DP-120** | Story | Optimistic Reaction Updates with Atomic Rollback | Frontend | 5 | Done | TanStack Query `onMutate` snapshotting provides instant tactile response (<16ms); `onError` rolls back counters on failure. |
| **DP-121** | Story | Reactors List Modal with Filter Tabs & Hover Peek Popover | Custom | 4 | Done | `GET /reactions` endpoint supports pagination & type filtering; 300ms hover popover avatar stack; glassmorphic modal with All/Like/Dislike tabs. |

---

### Sprint 4: Discovery Engines, Feed Ranking & AI Intelligence (Days 13–16)
* **Goal**: Deliver deterministic multi-criteria feed sorting, debounced search, and Groq Cloud AI post summarization.

| Issue Key | Type | Summary | Component | Points | Status | Acceptance Criteria / Implementation Verification |
| :--- | :---: | :--- | :---: | :---: | :---: | :--- |
| **DP-122** | Story | Deterministic Multi-Criteria Feed Ranking Pipeline | Backend | 8 | Done | `GET /posts?sort=top\|latest\|most-discussed`; rank score pipeline: `(likes - dislikes) + (comments * 2)` with secondary tie-breaker. |
| **DP-123** | Story | Feed Filter Tabs, Glass Sort Dropdown & URL Query Sync | Frontend | 5 | Done | `FeedTabs` syncs bidirectionally with URL `?sort=`; isolated TanStack Query cache partitioning (`['posts', 'feed', sort]`); zero-flicker tabs. |
| **DP-124** | Story | Debounced Full-Text Search Engine | Fullstack | 5 | Done | Backend MongoDB text index on `{ title: 5, body: 1 }`; `GET /posts/search?q=`; Frontend 300ms debounced search bar with AbortController. |
| **DP-125** | Story | Groq Cloud AI Post Summarization Engine | Backend | 5 | Done | `POST /posts/:id/summarize` invokes `openai/gpt-oss-20b` via Groq Cloud; 12k char body truncation; 8s timeout guard; mock fallback provider. |
| **DP-126** | Story | AI Summary Presentation Panel & Loading State | Frontend | 3 | Done | `PostSummaryPanel` renders bullet summaries and extracted skill tags; animated progress bar during inference; auth redirect modal if unauthenticated. |
| **DP-127** | Story | Clickable Commenter Profiles & Lean Author Projections | Custom | 2 | Done | Commenter avatars and names wrap in `<Link href="/developers/[id]">`; backend projects lean author fields without leaking credentials. |

---

### Sprint 5: Hardening, DevOps, Smoke Testing & Release (Days 17–20)
* **Goal**: Complete automated test matrix, security rate limiting, token rotation, multi-stage Dockerization, and final verification.

| Issue Key | Type | Summary | Component | Points | Status | Acceptance Criteria / Implementation Verification |
| :--- | :---: | :--- | :---: | :---: | :---: | :--- |
| **DP-128** | Story | Full-Stack Automated Test Matrix (274 Tests) | QA | 8 | Done | 212 backend Vitest tests (81.7% line coverage) + 62 frontend Vitest tests; unit, integration, and E2E regression verification. |
| **DP-129** | Story | SHA-256 Refresh Token Rotation & Compare-and-Swap | Security | 5 | Done | Long-lived refresh tokens stored as SHA-256 digests in MongoDB; atomic compare-and-swap rotation on `POST /auth/refresh`; logout revocation. |
| **DP-130** | Story | NestJS Throttler Rate Limiting & Sliding Windows | Security | 3 | Done | IP rate limits configured: 5 signups / 15m, 10 logins / 15m, 30 refreshes / 15m, 60 searches / min, 10 summaries / min. |
| **DP-131** | Story | Shared-Promise 401 Interceptor with Coalescing | Frontend | 5 | Done | Singleton `refreshPromise` coalesces parallel 401s into single refresh call; clean replay of stalled requests; graceful redirect on expiry. |
| **DP-132** | Story | Multi-Stage Production Dockerization & Compose Stack | DevOps | 5 | Done | Multi-stage Dockerfiles (`node:24-bookworm-slim`); Next.js standalone output bundle (180MB image); Docker Compose replica set `rs0`. |
| **DP-133** | Story | Day 20 Live Smoke Testing & Regression Verification | QA | 2 | Done | 13/13 primary & custom flows verified passing on live ports 3000 & 5000; documentation suite, workflow PDF, and demo script generated. |
