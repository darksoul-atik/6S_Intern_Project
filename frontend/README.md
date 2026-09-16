# ⚡ DevPulse Frontend

> Modern, high-performance developer community platform built with **Next.js 16 (App Router)**, **React 19**, **TanStack Query v5**, **Tailwind CSS**, and **Framer Motion**.

---

## 🏛️ Architecture & Session Persistence Strategy

### 1. The Next.js BFF (Backend-For-Frontend) Pattern
Rather than having client-side JavaScript communicate directly with external REST APIs and store access tokens in browser `localStorage`, DevPulse employs an enterprise-grade **Backend-For-Frontend (BFF)** proxy pattern.

```
[ Browser / Client Components ]
              │
              │  Same-Origin Requests with Cookies (credentials: 'include')
              ▼
[ Next.js BFF Route Handlers (`src/app/api/auth/*`) ]
              │
              │  Extracts `devpulse_token` from httpOnly cookie
              │  Attaches `Authorization: Bearer <JWT>`
              ▼
[ NestJS Core API (`http://localhost:5000`) ]
              │
              ▼
[ MongoDB Database ]
```

### 2. Why `httpOnly` Cookies Over `localStorage`?
* **Zero Cross-Site Scripting (XSS) Exfiltration Risk**: `httpOnly` cookies cannot be accessed or stolen by client-side JavaScript (`document.cookie`), completely neutralizing malicious third-party script injection vectors.
* **Server-Side & Edge Route Protection**: Next.js Edge Middleware (`src/middleware.ts`) can inspect incoming requests before pages render, preventing UI flicker, flash of unauthenticated content, and layout shifts.
* **Decoupled API Architecture**: The NestJS backend remains a pure REST API expecting standard `Authorization: Bearer <token>` headers, maintaining compatibility with mobile apps and external consumers.

### 3. Edge Middleware Route Guarding (`src/middleware.ts`)
* **Live JWT Expiration & Structure Validation**: The Edge middleware parses and validates the JWT payload (verifying the `exp` timestamp) directly at the Edge.
* **Stale Cookie Invalidation**: If an expired or malformed token is detected:
  * When visiting protected routes (`/dashboard`, `/profile`, `/admin`), the middleware deletes the stale cookie and redirects to `/login?redirect=<original_path>`.
  * When visiting auth routes (`/login`, `/signup`), the middleware evicts the stale cookie and permits clean form access without redirect loops.
* **Destination Preservation**: Preserves requested query parameters (`?redirect=...`) so users are returned immediately to their target page upon authenticating.

### 4. Server-State Management via TanStack Query v5
* **Global Provider**: Wrapped in `QueryClientProvider` with 5-minute fresh cache policies (`staleTime: 5 * 60 * 1000`).
* **Error Isolation**: Authentication state (`useCurrentUser`) explicitly differentiates between unauthenticated status (401 -> `null`) and backend infrastructure failures (500, network error -> re-thrown error state) so network disruptions are never mistaken for session logouts.
* **Multi-Level Cache Invalidation**: Auth mutations (`useLoginMutation`, `useLogoutMutation`) automatically synchronize and purge cached credentials and user profiles platform-wide.

---

## 📂 Feature-First Directory Structure

```
frontend/src/
├── app/                      # Lightweight Next.js App Router wrappers
│   ├── (auth)/
│   │   ├── login/page.tsx    # Renders <LoginForm />
│   │   └── signup/page.tsx   # Renders <SignupForm />
│   ├── profile/
│   │   ├── page.tsx          # Renders <ProfileView targetId="me" />
│   │   └── edit/page.tsx     # Renders <ProfileEditForm />
│   ├── developers/[id]/
│   │   └── page.tsx          # Renders <ProfileView targetId={id} />
│   ├── admin/users/
│   │   └── page.tsx          # Renders <AdminUsersTable />
│   ├── dashboard/page.tsx    # Self-contained developer dashboard
│   └── status/page.tsx       # Live health diagnostics dashboard
│
├── features/                 # Domain-driven feature modules
│   ├── auth/                 # Authentication domain
│   │   ├── auth.schemas.ts   # Centralized Zod schemas (signupSchema, loginSchema)
│   │   ├── auth.api.ts       # Colocated types (AuthUser) and TanStack mutations
│   │   ├── LoginForm.tsx     # Interactive login form with accessible alerts
│   │   └── SignupForm.tsx    # Interactive registration form with inline error mapping
│   ├── users/                # Developer profiles & experience
│   │   ├── users.api.ts      # Colocated types (UserProfile, Experience) & query hooks
│   │   ├── useCurrentUser.ts # Current authenticated user query hook
│   │   ├── ProfileView.tsx   # Reusable profile presentation view
│   │   ├── ProfileEditForm.tsx # Skills & profile editor
│   │   ├── ExperienceModal.tsx # Standalone experience modal dialog
│   │   └── ProfileSkeleton.tsx # Shimmering loading placeholder
│   └── admin/                # Admin user moderation
│       ├── admin.api.ts      # Colocated types (AdminUser) & admin queries
│       ├── AdminUsersTable.tsx # Paginated directory table with search and filters
│       ├── EditUserModal.tsx # Standalone user edit modal
│       └── DeleteUserConfirm.tsx # Standalone soft-delete confirmation dialog
│
├── components/               # Shared cross-cutting components
│   ├── Navbar.tsx            # Global responsive navigation bar
│   ├── MeshGradientBackground.tsx # Specular animated canvas backdrop
│   ├── LottieAnimation.tsx   # SSR-safe Lottie vector wrapper
│   └── ui/pagination.tsx     # Reusable shadcn pagination controls
│
├── context/                  # React Context providers
│   └── AuthContext.tsx       # User session state provider
│
└── lib/                      # Cross-cutting utility modules
    ├── api.ts                # Axios client with interceptors & ApiError normalization
    ├── formatters.ts         # Initials and date formatting helpers
    └── image.ts              # HTML5 canvas image compression utility
```

---

## 🛠️ Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### 4. Build for Production
```bash
npm run build
npm start
```
