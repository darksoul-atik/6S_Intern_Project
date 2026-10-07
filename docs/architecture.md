# DevPulse System Architecture & Engineering Specifications

This document details the architectural decisions, design patterns, security mechanisms, and data flows implemented across the DevPulse full-stack platform.

---

## 1. High-Level System Topology

```
┌────────────────────────────────────────────────────────────────────────┐
│                              CLIENT TIER                               │
│                         Web Browser (React 19)                         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                        HTTP / Secure httpOnly Cookies
                        (devpulse_token, devpulse_refresh_token)
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     BACKEND-FOR-FRONTEND (BFF) TIER                    │
│                      Next.js 16 (Node 24 Standalone)                   │
│                                                                        │
│   • Edge Middleware (Route Gating: /dashboard, /profile, /admin)       │
│   • App Router Pages (SSR, Static Optimization, Suspense)              │
│   • BFF Route Handlers (/api/auth/*, /api/posts/*, /api/users/*)       │
│   • Axios Response Interceptor (Promise Coalescing, Auto Refresh)      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                        Internal Docker / LAN HTTP
                        (Authorization: Bearer <JWT>)
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY & DOMAIN                         │
│                         NestJS 11 Application                          │
│                                                                        │
│   • Global Filters & Interceptors (Envelope Transform, Error Masking)  │
│   • Guards: JwtAuthGuard, RolesGuard, Resource Ownership Guards        │
│   • Modules: Auth, Users, Posts, Comments, Reactions, Summarizer       │
│   • Rate Limiting: @nestjs/throttler (IP-based window buckets)         │
│   • Scheduled Tasks: Hourly soft-delete purge cron                     │
└───────────────────────┬───────────────────────────────┬────────────────┘
                        │                               │
            Mongoose ODM Connection             HTTPS REST API
            (ACID Multi-Doc Transactions)       (8s Timeout, Strict JSON)
                        │                               │
                        ▼                               ▼
     ┌───────────────────────────────────┐    ┌───────────────────┐
     │           DATABASE TIER           │    │    AI PROVIDER    │
     │      MongoDB 7.0 Replica Set      │    │    Groq Cloud     │
     │   (Replica Set rs0 for Tx Safety) │    │(gpt-oss-20b/Mock) │
     └───────────────────────────────────┘    └───────────────────┘
```

---

## 2. Authentication & Session Management (BFF Pattern)

### 2.1. Dual httpOnly Cookie Strategy
To prevent Cross-Site Scripting (XSS) token exfiltration, browser JavaScript is never granted direct access to raw JWT strings. Tokens are persisted strictly in `httpOnly` cookies:
1. **`devpulse_token`** (Access Token):
   * Lifespan: 15 minutes (`maxAge: 900`).
   * Attributes: `httpOnly: true`, `SameSite: Lax`, `Path: /`, `Secure` (in production).
2. **`devpulse_refresh_token`** (Refresh Token):
   * Lifespan: 7 days (`maxAge: 604800`).
   * Attributes: `httpOnly: true`, `SameSite: Lax`, `Path: /`, `Secure` (in production).

### 2.2. Hashed Refresh Token Storage
* The database never stores raw refresh tokens.
* When a refresh token is issued, the backend computes its deterministic cryptographic SHA-256 digest:
  $$\text{hash} = \text{SHA256}(\text{refreshToken})$$
* This hash is saved in `User.refreshTokenHash`.
* **Atomic Compare-and-Swap Rotation**: During token refresh, MongoDB matches the incoming token's hash and atomically updates it with the new token's hash. If a duplicate or revoked token is presented, the request is immediately rejected with `401 Unauthorized`.

### 2.3. Shared-Promise 401 Interceptor with Coalescing
* **The Problem**: When an access token expires while browsing a rich feed page, multiple parallel queries (post feed, user profile, notifications) trigger 401 errors simultaneously. A naive interceptor fires multiple refresh requests, causing race conditions and token invalidation.
* **The Solution (`frontend/src/lib/axios/interceptors.ts`)**:
  * DevPulse implements module-scoped promise coalescing (`refreshPromise`).
  * The first 401 triggers `POST /api/auth/refresh`.
  * All concurrent 401 requests attach to this **same in-flight promise**.
  * Upon resolution, all stalled requests replay transparently with the new access token.
  * If refresh fails (or the refresh token has expired), a single `failurePromise` handles graceful cleanup and redirects to `/login?session_expired=true` without infinite redirect loops.

---

## 3. Frontend Architecture & State Management

### 3.1. Mandated Feature-Sliced Structure
The client codebase strictly isolates concerns under `frontend/src/`:
```
src/
├── app/                  # Route wrappers, server layouts, BFF handlers
├── components/           # Shared layout (Navbar, Footer, Modals)
├── features/             # Domain modules
│   ├── admin/            # Admin table, user moderation
│   ├── auth/             # Login/signup forms, auth redirect utils
│   ├── comments/         # Comment list, reply forms, thread deletion
│   ├── posts/            # Feed sorting, post card, post creation, search
│   ├── reactions/        # Reaction buttons, reactors modal & hover peek
│   └── users/            # Developer profile, experience modal, portfolio
├── lib/
│   ├── axios/            # Client, SSR instance, 401 interceptor
│   └── tanstack/         # QueryClient config, ReactQueryProvider
└── services/api/         # Typed API client contracts
```

### 3.2. TanStack Query Cache Strategy
* **Sort-Aware Cache Keys**:
  ```typescript
  postKeys.feed(sort, limit) // ['posts', 'feed', sort, { limit }]
  ```
  Switching between `Top`, `Latest`, and `Discussed` feeds never evicts or pollutes the sibling feed caches.
* **Optimistic Reaction Updates**:
  When a user clicks like or dislike, TanStack Query immediately cancels outgoing queries, takes a snapshot of previous data (`onMutate`), updates the local UI and counter pills optimistically (<16ms), and automatically rolls back in `onError` if the network transaction fails.

---

## 4. Backend Architecture & Security Controls

### 4.1. Role-Based Access Control (RBAC) & Ownership Guards
* **`JwtAuthGuard`**: Validates incoming Bearer JWT signatures against `JWT_SECRET`.
* **`RolesGuard`**: Evaluates metadata set by `@Roles('admin')`.
* **`ProfileOwnerOrAdminGuard`**: Verifies `targetUserId === currentUser.userId || currentUser.role === 'admin'`.
* **`PostOwnerOrAdminGuard`**: Verifies post author ownership prior to update/soft-delete.
* **`CommentOwnerOrAdminGuard`**: Verifies comment author ownership prior to comment deletion.

### 4.2. Throttler Rate Limiting
To defend against brute-force attacks and resource exhaustion:
* `/auth/signup`: Maximum **5 requests per 15 minutes** per IP.
* `/auth/login`: Maximum **10 requests per 15 minutes** per IP.
* `/auth/refresh`: Maximum **30 requests per 15 minutes** per IP.
* `/posts/search`: Maximum **60 requests per minute** per IP.
* `/posts/:id/summarize`: Maximum **10 requests per minute** per IP.

### 4.3. Soft-Delete Lifecycle & Background Cleanup Task
* Posts deleted by users or admins are marked with `deletedAt: new Date()` and `deletedBy`.
* Active queries automatically filter out deleted records (`deletedAt: { $exists: false }`).
* Authors can restore posts within **5 days**.
* **Scheduled Cleanup**: A background NestJS task (`PostCleanupTask`) runs every hour (`@Cron(CronExpression.EVERY_HOUR)`), permanently removing posts deleted more than 5 days ago.
