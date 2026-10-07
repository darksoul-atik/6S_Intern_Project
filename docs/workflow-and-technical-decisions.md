# DevPulse — Complete Project Workflow & Technical Decisions Specification (Days 1–20)

> **Platform**: DevPulse Developer Community & Collaboration Hub  
> **Tech Stack**: Next.js 16 (React 19, TypeScript, App Router) • NestJS 11 (Node 24, TypeScript) • MongoDB 7.0 (Replica Set) • Groq Cloud AI (`openai/gpt-oss-20b`) • Docker Compose  
> **Date**: October 2026 (Day 20 Final Release)

---

## 📑 Table of Contents
1. [End-to-End System Request Lifecycle & Workflows](#1-end-to-end-system-request-lifecycle--workflows)
   - [1.1. Architecture & Request Pipeline](#11-architecture--request-pipeline)
   - [1.2. Authentication & Session Rotation Workflow](#12-authentication--session-rotation-workflow)
   - [1.3. Post Authoring, Feed Discovery & Ranking Workflow](#13-post-authoring-feed-discovery--ranking-workflow)
   - [1.4. Threaded & Flattened Comments with @Mentions Workflow](#14-threaded--flattened-comments-with-mentions-workflow)
   - [1.5. Transactional Reaction Engine Workflow](#15-transactional-reaction-engine-workflow)
   - [1.6. AI Post Summarizer Workflow (Groq Cloud)](#16-ai-post-summarizer-workflow-groq-cloud)
   - [1.7. Developer Profile & Portfolio Management Workflow](#17-developer-profile--portfolio-management-workflow)
   - [1.8. Administrative Moderation & RBAC Workflow](#18-administrative-moderation--rbac-workflow)
2. [Complete Technical Decisions & Architectural Trade-offs](#2-complete-technical-decisions--architectural-trade-offs)
   - [Decision 1: Next.js BFF Proxy with Dual httpOnly Cookies vs. localStorage JWT](#decision-1-nextjs-bff-proxy-with-dual-httponly-cookies-vs-localstorage-jwt)
   - [Decision 2: Deterministic SHA-256 Hashed Refresh Token Storage vs. Plaintext / bcrypt](#decision-2-deterministic-sha-256-hashed-refresh-token-storage-vs-plaintext--bcrypt)
   - [Decision 3: Shared-Refresh-Promise 401 Interceptor with Coalescing](#decision-3-shared-refresh-promise-401-interceptor-with-coalescing)
   - [Decision 4: MongoDB Multi-Document Transactions for Reaction Concurrency](#decision-4-mongodb-multi-document-transactions-for-reaction-concurrency)
   - [Decision 5: Deterministic Post Ranking Pipeline vs. Asynchronous Cron Calculation](#decision-5-deterministic-post-ranking-pipeline-vs-asynchronous-cron-calculation)
   - [Decision 6: Single-Depth Flattened Replies with @Mentions vs. Arbitrary Tree Nesting](#decision-6-single-depth-flattened-replies-with-mentions-vs-arbitrary-tree-nesting)
   - [Decision 7: Strict Lean Projections for Author Objects vs. Full Document Population](#decision-7-strict-lean-projections-for-author-objects-vs-full-document-population)
   - [Decision 8: Groq LLM Inference with Truncation, Timeout Guard & Mock Fallback](#decision-8-groq-llm-inference-with-truncation-timeout-guard--mock-fallback)
   - [Decision 9: Sort-Aware Query-Key Cache Partitioning in TanStack Query](#decision-9-sort-aware-query-key-cache-partitioning-in-tanstack-query)
   - [Decision 10: Multi-Stage Dockerization with Standalone Next.js Bundle](#decision-10-multi-stage-dockerization-with-standalone-nextjs-bundle)
3. [Day-by-Day Milestone Roadmap (Days 1–20)](#3-day-by-day-milestone-roadmap-days-120)

---

## 1. End-to-End System Request Lifecycle & Workflows

### 1.1. Architecture & Request Pipeline

```
[Browser / Client Component]
       │
       │  HTTP / Dual httpOnly Cookies (devpulse_token, devpulse_refresh_token)
       ▼
[Next.js 16 BFF Layer] (Port 3000)
       ├── Edge Middleware (route gating: /dashboard, /profile, /admin)
       ├── App Router Page Handlers (SSR / Suspense / Client hydration)
       └── Route Handlers (/api/auth/*, /api/posts/*, /api/users/*)
       │
       │  HTTP / Bearer Authorization Header: Bearer <accessToken>
       ▼
[NestJS 11 REST API Gateway] (Port 5000)
       ├── Global Express Middleware (CORS origin whitelist, request logging)
       ├── Global ValidationPipe (whitelist: true, transform: true, DTO validation)
       ├── Route Guards (JwtAuthGuard, RolesGuard, ResourceOwnerGuards)
       ├── Controllers & Services (Auth, Users, Posts, Comments, Reactions, Summarizer)
       ├── Scheduled Tasks (@Cron hourly soft-delete purge)
       ├── Global TransformInterceptor ({ success: true, data, message })
       └── Global HttpExceptionFilter ({ success: false, statusCode, message, errors })
       │
       ├──▶ [MongoDB 7.0 Replica Set rs0] (ACID Transactions, Multi-Doc Sync)
       └──▶ [Groq Cloud Inference API] (High-Speed LLM: openai/gpt-oss-20b)
```

---

### 1.2. Authentication & Session Rotation Workflow

```
1. Signup / Login:
   User Form ──▶ POST /api/auth/login ──▶ NestJS POST /auth/login
   NestJS verifies password via bcrypt (10 rounds).
   Generates Access Token (15m, signed with JWT_SECRET).
   Generates Refresh Token (7d, signed with JWT_REFRESH_SECRET).
   Computes SHA-256 digest of Refresh Token: hash = SHA256(refreshToken).
   Stores hash in MongoDB User.refreshTokenHash.
   Next.js BFF sets dual httpOnly cookies:
     - devpulse_token (15m, httpOnly, SameSite=Lax, Secure in prod)
     - devpulse_refresh_token (7d, httpOnly, SameSite=Lax, Secure in prod)

2. Authenticated Request:
   Client performs API call via apiClient.
   Next.js BFF intercepts, extracts devpulse_token cookie, forwards as:
     Authorization: Bearer <token> to NestJS.
   NestJS JwtAuthGuard parses token, populates request.user.

3. Token Expiry & Silent Refresh:
   Access token expires after 15 minutes ──▶ NestJS returns 401 Unauthorized.
   Axios Interceptor catches 401:
     - Attaches request to singleton refreshPromise (Promise Coalescing).
     - Issues single POST /api/auth/refresh to Next.js BFF.
     - BFF reads devpulse_refresh_token cookie, forwards to NestJS POST /auth/refresh.
     - NestJS verifies JWT signature, matches SHA-256 hash in DB, issues new pair.
     - BFF updates cookies; Axios re-executes all queued original requests.
     - If refresh fails, single failurePromise redirects to /login?session_expired=true.
```

---

### 1.3. Post Authoring, Feed Discovery & Ranking Workflow

```
1. Post Authoring:
   User fills form (/posts/new) ──▶ React Hook Form + Zod (mode: 'onTouched').
   POST /posts { title, body } ──▶ NestJS PostsController.createPost.
   authorId is extracted strictly from verified JWT claims (anti-spoofing).
   Mongoose persists post; atomically increments User.postsCount.
   TanStack Query invalidates ['posts'] queries; redirects to /posts/[id].

2. Feed Discovery & Ranking Tabs:
   User selects Feed Tab: Top, Latest, or Most-Discussed.
   URL updates query param: ?sort=top | latest | most-discussed.
   TanStack Query uses isolated key: ['posts', 'feed', sort, { limit }].
   API Query: GET /posts?sort=<sort>&page=1&limit=10.
   Sort Strategies:
     - latest: Sort by { createdAt: -1, _id: -1 }.
     - top: MongoDB Aggregation pipeline calculating deterministic engagement score:
            rankScore = (likes - dislikes) + (commentCount * 2)
            Sort by { rankScore: -1, createdAt: -1, _id: -1 }.
     - most-discussed: Sort by { commentCount: -1, createdAt: -1, _id: -1 }.
   Author field is strictly projected as { id, name, headline, avatarUrl }.

3. Debounced Full-Text Search:
   User types query in search bar (PostSearch component).
   useDebounce waits 300ms ──▶ GET /posts/search?q=<query>&limit=10.
   Backend executes MongoDB text search over indexed fields:
     { title: "text", body: "text" } with weights { title: 5, body: 1 }.
   Results sorted by { score: { $meta: "textScore" } }.
```

---

### 1.4. Threaded & Flattened Comments with @Mentions Workflow

```
1. Root Comment:
   User posts comment ──▶ POST /posts/:postId/comments { body }.
   NestJS creates Comment document with parentCommentId: null.
   Atomically increments Post.commentCount and User.commentsCount.

2. Flattened Reply with @Mention (Depth 1):
   User clicks "Reply" on comment or existing reply.
   POST /posts/:postId/comments/:commentId/replies { body, mentionedUserId }.
   NestJS CommentsService enforces:
     - parentCommentId must point to root comment.
     - Nesting under an existing reply is rejected with 400 Bad Request.
   UI renders reply indented at level 1 beneath root comment.
   Reply displays clickable @Mention badge referencing target developer.

3. Comment Deletion Cascade:
   User/Admin triggers delete ──▶ DELETE /comments/:id.
   Ownership checked by CommentOwnerOrAdminGuard.
   - If deleting reply: Removes single reply; decrements Post.commentCount by 1.
   - If deleting root comment: MongoDB transaction removes root comment AND all
     child replies ({ parentCommentId: id }); decrements Post.commentCount by (1 + N).
```

---

### 1.5. Transactional Reaction Engine Workflow

```
1. User Clicks Like or Dislike:
   TanStack Query applies Optimistic Update:
     - Cancels outgoing queries for post.
     - Snapshots current reaction counts and active user state.
     - Instantly updates pill count and active highlight in UI (<16ms).

2. Network Mutation:
   POST /reactions { targetId, targetType: 'post' | 'comment', type: 'like' | 'dislike' }.
   NestJS runs operation inside MongoDB ClientSession transaction with retry loop:
     Case 1: No previous reaction ──▶ Create Reaction, $inc { 'reactionCounts.like': 1 }.
     Case 2: Same reaction clicked ──▶ Delete Reaction, $inc { 'reactionCounts.like': -1 }.
     Case 3: Opposite reaction clicked ──▶ Switch Reaction, $inc { 'reactionCounts.dislike': -1, 'reactionCounts.like': 1 }.

3. Reconciliation & Community Transparency:
   If request succeeds: Query cache commits updated counts.
   If request fails: onError restores previous snapshot.
   Hovering on reaction pill (300ms) displays ReactionHoverPeek popover.
   Clicking count pill opens ReactorsModal (GET /reactions?targetId=:id) with tabs:
     [All] [Likes 👍] [Dislikes 👎], showing developer cards.
```

---

### 1.6. AI Post Summarizer Workflow (Groq Cloud)

```
1. Trigger:
   User clicks "Summarize Post" on post view page.
   UI enters loading state with animated progress skeleton.

2. Request Execution:
   POST /posts/:id/summarize (requires JWT).
   NestJS SummarizerService:
     - Retrieves post title and body.
     - Boundary Guard: Truncates body to 12,000 characters (anti-prompt-bloat).
     - Dispatches payload to Groq Cloud API (openai/gpt-oss-20b).
     - Passes system prompt enforcing strict JSON schema:
       { "summary": "string", "tags": ["string"] }
     - Timeout Guard: Wraps call in Promise.race with SUMMARIZER_TIMEOUT_MS = 8000ms.
     - If GROQ_API_KEY is not set: Automatically falls back to MockSummarizerProvider.

3. Result Delivery:
   Valid response parsed, returned in { success: true, data: { summary, tags } }.
   Frontend renders executive summary and technology skill badges.
```

---

### 1.7. Developer Profile & Portfolio Management Workflow

```
1. Public Profile Discovery:
   Visitor navigates to /developers/[id].
   GET /users/:id (Public, no auth required).
   Mongoose projects: name, headline, bio, avatarUrl, skills, experiences, portfolioProjects.
   Sensitive attributes (passwordHash, refreshTokenHash, email) strictly excluded.

2. Profile Editing & Work Experience Management:
   Owner logs in, navigates to /profile/edit.
   Edits basic headline, bio, skills chip tags.
   ExperienceModal opens for work history:
     - Date validation: startDate <= endDate, or isCurrent: true.
     - Dispatches POST /profile/me/experiences or PATCH /profile/me/experiences/:id.
   Portfolio Projects:
     - Dynamic array form validating URLs and unique technology tags.
     - Custom DeleteProjectModal handles confirmed project removal.
```

---

### 1.8. Administrative Moderation & RBAC Workflow

```
1. Route & API Protection:
   Admin pages (/admin/users) protected by Next.js Edge middleware inspecting JWT role.
   Backend endpoints (@Roles('admin')) protected by RolesGuard.
   Non-admin access immediately rejected with 403 Forbidden.

2. Admin Actions:
   - GET /users: Paginated user directory with search and filter.
   - PATCH /users/:id/admin: Modify user details, headline, or assign 'admin' role.
   - DELETE /users/:id: Soft-delete user account (marks isDeleted: true).
     Prevents deleted user login with custom message:
     "Your profile has been deleted by an Admin."
   - PATCH /users/:id/restore: Re-activates soft-deleted account.
```

---

## 2. Complete Technical Decisions & Architectural Trade-offs

### Decision 1: Next.js BFF Proxy with Dual httpOnly Cookies vs. localStorage JWT
* **Context**: Client applications need to store session tokens across page refreshes and browser tabs.
* **Chosen Architecture**: Next.js App Router Route Handlers (`/api/auth/*`) act as a Backend-For-Frontend (BFF). Tokens are stored in dual `httpOnly`, `SameSite=Lax`, `Secure` cookies (`devpulse_token` 15m, `devpulse_refresh_token` 7d).
* **Alternative Considered**: Storing raw JWT access and refresh tokens in browser `localStorage` or `sessionStorage`.
* **Trade-off Analysis**:
  * *Advantage*: Immune to XSS token exfiltration (`document.cookie` cannot read `httpOnly` cookies). Edge middleware can evaluate session validity before SSR renders, preventing layout flicker.
  * *Cost/Drawback*: Requires maintaining BFF route proxy handlers in Next.js to forward tokens to NestJS via `Authorization: Bearer <token>`.

---

### Decision 2: Deterministic SHA-256 Hashed Refresh Token Storage vs. Plaintext / bcrypt
* **Context**: Refresh tokens are long-lived (7 days) and stored in the database to allow server-side revocation.
* **Chosen Architecture**: Store only the cryptographic SHA-256 digest (`crypto.createHash('sha256').update(token).digest('hex')`) in `User.refreshTokenHash`.
* **Alternative Considered**: Plaintext database storage, or hashing with `bcrypt`.
* **Trade-off Analysis**:
  * *Advantage*: If the database is compromised, raw refresh tokens cannot be used to forge sessions. Unlike passwords, refresh tokens are high-entropy 256-bit cryptographic secrets, so slow `bcrypt` hashing is unnecessary. SHA-256 enables instant, atomic MongoDB compare-and-swap rotation queries.
  * *Cost/Drawback*: Does not support fuzzy lookups; the exact token string must be presented by the client.

---

### Decision 3: Shared-Refresh-Promise 401 Interceptor with Coalescing
* **Context**: When a 15-minute access token expires, multiple parallel queries (feed, user profile, notifications) trigger 401 errors simultaneously.
* **Chosen Architecture**: Module-scoped singleton `refreshPromise` in `frontend/src/lib/axios/interceptors.ts`. The first 401 initializes the refresh request; all concurrent 401s await this single promise and replay automatically once resolved.
* **Alternative Considered**: Individual interceptor retry for each failed request.
* **Trade-off Analysis**:
  * *Advantage*: Eliminates token refresh stampedes and prevents race-condition invalidation of rotated refresh tokens in MongoDB.
  * *Cost/Drawback*: Requires careful error handling to ensure failed refreshes reject all subscribers cleanly and route to `/login?session_expired=true` without infinite loops.

---

### Decision 4: MongoDB Multi-Document Transactions for Reaction Concurrency
* **Context**: High-frequency like/dislike clicks on posts and comments can cause counter desynchronization if counter `$inc` updates and `Reaction` document mutations are decoupled.
* **Chosen Architecture**: Wrap reaction toggle logic in a MongoDB multi-document ACID transaction (`ClientSession`) with an automated retry loop for write conflicts.
* **Alternative Considered**: Event-driven counter recalculation via background message queue (e.g. BullMQ / Redis).
* **Trade-off Analysis**:
  * *Advantage*: 100% strict consistency. Counter values are guaranteed to equal the actual sum of reaction records at all times.
  * *Cost/Drawback*: Mandates a MongoDB **Replica Set** (`rs0`) in Docker and local environments, adding container orchestration complexity compared to standalone MongoDB.

---

### Decision 5: Deterministic Post Ranking Pipeline vs. Asynchronous Cron Calculation
* **Context**: Users expect the "Top" feed to prioritize posts with high engagement (likes, discussions) without stale scores.
* **Chosen Architecture**: An inline MongoDB aggregation pipeline (`buildTopPostsPipeline`) that computes:
  $$\text{rankScore} = (\text{likes} - \text{dislikes}) + (\text{commentCount} \times 2)$$
  with deterministic secondary tie-breaking on `{ createdAt: -1, _id: -1 }`.
* **Alternative Considered**: Pre-calculating rank scores via an hourly cron job.
* **Trade-off Analysis**:
  * *Advantage*: Real-time ranking. As soon as a post receives a like or comment, its ranking updates immediately on subsequent feed fetches.
  * *Cost/Drawback*: Higher CPU cost per feed query on MongoDB compared to reading a static pre-computed field.

---

### Decision 6: Single-Depth Flattened Replies with @Mentions vs. Arbitrary Tree Nesting
* **Context**: Threaded comments often support arbitrary nesting depth, leading to mobile UI horizontal squishing and recursive database aggregation queries (`$graphLookup`).
* **Chosen Architecture**: Enforce a strict maximum depth of 1. All replies attach to a root comment (`parentCommentId`). When replying to an existing reply, the system stores `mentionedUserId` and renders an `@Username` badge at the same indentation level.
* **Alternative Considered**: Infinite nested tree structures with recursive client components.
* **Trade-off Analysis**:
  * *Advantage*: Flawless mobile viewport responsiveness ($\le$ 375px), simplified single-query tree assembly, and clean transactional cascade deletions.
  * *Cost/Drawback*: Users cannot branch deeply nested sub-threads into isolated conversation trees.

---

### Decision 7: Strict Lean Projections for Author Objects vs. Full Document Population
* **Context**: Posts and comments require author metadata (name, avatar, headline) to render developer cards.
* **Chosen Architecture**: Strict `.populate({ path: 'authorId', select: 'name headline avatarUrl' })` and explicit schema `.select()` masks.
* **Alternative Considered**: Full `User` document population.
* **Trade-off Analysis**:
  * *Advantage*: Reduces JSON response payload size by over **70%**, optimizes MongoDB buffer cache, and guarantees zero leakage of sensitive password hashes or token digests.
  * *Cost/Drawback*: Client views that need extended author metadata (e.g. bio, full skill array) must issue an additional request to `/users/:id`.

---

### Decision 8: Groq LLM Inference with Truncation, Timeout Guard & Mock Fallback
* **Context**: Summarizing technical posts requires an LLM. External LLM APIs can be slow, expensive, or encounter rate limits.
* **Chosen Architecture**: Groq Cloud API running `openai/gpt-oss-20b` in strict JSON mode with three boundary protections: 12,000-character input truncation, 8,000ms timeout guard (`Promise.race`), and a deterministic `MockSummarizerProvider` fallback when `GROQ_API_KEY` is omitted.
* **Alternative Considered**: Self-hosting a local HuggingFace model or directly embedding external client scripts.
* **Trade-off Analysis**:
  * *Advantage*: Ultra-fast inference (<1.5s), zero failure in offline or CI/CD test environments, and predictable structured output.
  * *Cost/Drawback*: Posts exceeding 12,000 characters are summarized based on their initial sections.

---

### Decision 9: Sort-Aware Query-Key Cache Partitioning in TanStack Query
* **Context**: Toggling feed filters (`Top`, `Latest`, `Discussed`) should feel instant without refetch flashes.
* **Chosen Architecture**: Query keys are partitioned by sorting dimension: `['posts', 'feed', sort, { limit }]`.
* **Alternative Considered**: Storing all feed posts under a single `['posts']` query key and mutating the list.
* **Trade-off Analysis**:
  * *Advantage*: Instant tab switching from client memory without layout shifts or unwanted network spinners.
  * *Cost/Drawback*: Slightly higher browser memory consumption, as multiple feed lists are retained in memory concurrently.

---

### Decision 10: Multi-Stage Dockerization with Standalone Next.js Bundle
* **Context**: Deploying a full-stack Next.js + NestJS + MongoDB stack requires minimal container images and fast boot times.
* **Chosen Architecture**: Multi-stage Dockerfiles based on `node:24-bookworm-slim`. Next.js is built with `output: "standalone"`, copying only production dependencies and compiled `.next/standalone` files.
* **Alternative Considered**: Running `next start` inside a standard full `node_modules` container.
* **Trade-off Analysis**:
  * *Advantage*: Reduces frontend container image size from >1.2GB down to ~180MB; eliminates development tooling from production containers.
  * *Cost/Drawback*: Code edits during development require a full Docker rebuild (`docker compose up --build`) if tested in containerized mode.

---

## 3. Day-by-Day Milestone Roadmap (Days 1–20)

| Phase | Days | Focus Areas | Key Deliverables |
| :--- | :---: | :--- | :--- |
| **Phase 1: Foundations** | Days 1–4 | Architecture, Contracts, Auth & UI Foundation | NestJS modular layout, Mongoose setup, `/health` diagnostic probe, Next.js App Router, `/status` page, Swagger OpenAPI `/docs`, global transform & exception filters, bcrypt password hashing, JWT issuance, `httpOnly` cookie BFF proxy, React Hook Form + Zod, Edge route protection middleware. |
| **Phase 2: Profiles & Posts** | Days 5–8 | Domain Models, Complex Forms & Feed System | Developer profile schema, skills, work experience subdocuments, portfolio project model with chronological validation, dynamic forms with `useFieldArray`, delete confirmation modal, Post schema, CRUD endpoints, soft-delete lifecycle (5-day restore), hourly cleanup task, infinite scroll feed. |
| **Phase 3: Community & Social** | Days 9–12 | Discussions, Concurrency & Optimistic Reactions | Threaded comment schema, single-query tree retrieval, depth-1 reply enforcement, @Mentions, reaction toggle engine with MongoDB transactions, optimistic UI mutations with rollbacks, reactors list modal with tabs, hover peek popovers, clickable commenter profiles. |
| **Phase 4: Discovery & AI** | Days 13–16 | Ranking Engines, Search & AI Summarization | Multi-criteria feed sorting (`top`, `latest`, `most-discussed`), deterministic rank score algorithm, compound indexing, query plan explain checks, debounced full-text search, Groq Cloud LLM summarization with timeout guard, 12k char truncation, and mock fallback. |
| **Phase 5: Release & DevOps** | Days 17–20 | Hardening, Dockerization & Final Verification | Full-stack test matrix (212 backend tests, 62 frontend tests), refresh token SHA-256 rotation, Throttler rate limiting, multi-stage Dockerfiles, Docker Compose replica set orchestration, Day 20 clean smoke tests, documentation suite, demo scripts, and rehearsal checklist. |
