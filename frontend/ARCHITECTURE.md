# DevPulse Frontend Architecture & Folder Structure

## 1. Overview
The DevPulse frontend has been migrated to adhere strictly to the mandated modular and feature-driven architecture. This architecture separates concerns into feature modules, a dedicated services/api layer, shared core libraries (`lib/`), and UI components.

---

## 2. Directory Structure

```
frontend/src/
├── app/                              # Next.js App Router (Pages, Layouts, BFF Route Handlers)
│   ├── (auth)/                       # Auth route groups
│   ├── admin/                        # Admin dashboard pages
│   ├── api/                          # Next.js BFF Route Handlers (cookie forwarding)
│   │   ├── auth/                     # BFF auth proxy (/api/auth/*)
│   │   ├── posts/                    # BFF posts proxy (/api/posts/*)
│   │   ├── profile/                  # BFF profile proxy (/api/profile/*)
│   │   └── users/                    # BFF users proxy (/api/users/*)
│   ├── developers/[id]/              # Public developer profile route
│   ├── posts/                        # Community feed, new post, detail & edit routes
│   ├── profile/                      # Authenticated user profile routes
│   ├── status/                       # System health diagnostics route
│   ├── layout.tsx                    # Root layout wrapping Providers
│   └── page.tsx                      # Landing page
├── components/                       # Shared components
│   ├── layout/                       # Layout components (Navbar, Header, Footer)
│   └── ui/                           # Primitive UI components (buttons, modals, pagination, etc.)
├── constants/                        # Global immutable configuration and route mappings
│   ├── config.ts                     # Base URLs, cookie keys, pagination defaults
│   └── routes.ts                     # Type-safe central application route constants
├── context/                          # Global React contexts (AuthContext)
├── features/                         # Modular feature domains
│   ├── admin/                        # Admin management domain
│   │   ├── components/               # Admin users table, modals
│   │   ├── mutations/                # Admin mutations
│   │   ├── queries/                  # Admin queries
│   │   └── types/                    # Admin domain interfaces
│   ├── auth/                         # Authentication domain
│   │   ├── components/               # LoginForm, SignupForm
│   │   ├── mutations/                # Auth mutations (signup, login, logout)
│   │   ├── queries/                  # Auth queries (me, admin-check)
│   │   ├── schemas/                  # Zod validation schemas
│   │   ├── types/                    # AuthUser, token payload interfaces
│   │   └── utils/                    # Auth-specific utilities (error extraction)
│   ├── posts/                        # Posts & Feed domain
│   │   ├── components/               # PostCard, PostFeed, PostForm, PostDetails, DeletePostModal
│   │   ├── mutations/                # createPost, updatePost, softDeletePost
│   │   ├── queries/                  # infinite posts feed, post detail
│   │   ├── schemas/                  # Post form Zod schema
│   │   └── types/                    # Post, author, reaction interfaces
│   └── users/                        # Users & Profile domain
│       ├── components/               # ProfileView, ProfileEditForm, modals, fields
│       ├── mutations/                # Profile, avatar, skills, experience, project mutations
│       ├── queries/                  # Profile & current user queries
│       ├── schemas/                  # Profile & portfolio project Zod schemas
│       ├── types/                    # UserProfile, Experience, PortfolioProject interfaces
│       └── utils/                    # Image compression and manipulation
├── lib/                              # Core technical infrastructure
│   ├── axios/                        # Axios clients and interceptors
│   │   ├── client.ts                 # Browser client (baseURL: '/api', withCredentials: true)
│   │   ├── interceptors.ts           # Response normalization to ApiError
│   │   └── server.ts                 # Server-side API client factory
│   ├── tanstack/                     # TanStack Query infrastructure
│   │   ├── query-client.ts           # Central QueryClient configuration
│   │   └── query-keys.ts             # Central query keys registry
│   └── utils/                        # Shared utility functions
│       ├── cn.ts                     # Class name merger (clsx + tailwind-merge)
│       └── formatters.ts             # Date and initial formatting utilities
├── providers/                        # Global context and state providers
│   ├── providers.tsx                 # Composed application providers
│   └── query-provider.tsx            # TanStack Query client provider
├── schemas/                          # Shared cross-domain Zod schemas
│   └── common.ts                     # Pagination and ID parameter schemas
├── services/                         # Dedicated API layer
│   └── api/                          # Raw Axios endpoint calls
│       ├── admin.ts                  # Admin user endpoints
│       ├── auth.ts                   # Auth endpoints
│       ├── health.ts                 # Health diagnostic endpoint
│       ├── posts.ts                  # Post CRUD endpoints
│       └── users.ts                  # User profile and project endpoints
├── types/                            # Global and shared TypeScript definitions
│   ├── api.ts                        # ApiResponse, ApiError, PaginatedResponse
│   └── common.ts                     # Utility types (Nullable, AsyncStatus)
└── middleware.ts                     # Edge authentication and route protection
```

---

## 3. Crucial Architectural Rules & Constraints

### 3.1 Authentication & The BFF (Backend-for-Frontend) Exception
- **Constraint**: The user session JWT (`devpulse_token`) is stored in an `httpOnly`, `SameSite=Lax` cookie.
- **Consequence**: Browser JavaScript cannot read or attach this cookie directly via `Authorization: Bearer <token>`.
- **Implementation**:
  - The browser-side Axios client (`lib/axios/client.ts`) is configured with `baseURL: '/api'` and `withCredentials: true`.
  - Browser requests are sent to the Next.js Route Handlers (`src/app/api/*`).
  - Next.js Route Handlers extract the `httpOnly` cookie server-side from the incoming request and attach it as a `Bearer` token before proxying the request to the NestJS backend (`http://localhost:5000`).
  - This ensures maximum security against XSS attacks while keeping all client code clean and consistent.

### 3.2 Feature Module Isolation
- Each feature in `features/<feature-name>` is self-contained with its own:
  - `components/` (kebab-case file names)
  - `queries/` (TanStack Query hooks)
  - `mutations/` (TanStack Query mutation hooks)
  - `schemas/` (Zod schemas)
  - `types/` (TypeScript interfaces)
  - `utils/` (Feature-specific helpers)
- Cross-feature communication is done via imported types, queries, or shared services.

### 3.3 Separation of API Services and Query Hooks
- **`services/api/*.ts`**: Pure async functions performing raw Axios HTTP calls using `apiClient`. They do not use React hooks or TanStack Query state.
- **`features/*/queries/*.ts` & `features/*/mutations/*.ts`**: React hooks (`useQuery`, `useMutation`, `useInfiniteQuery`) that invoke the API service functions and manage TanStack Query caching, optimistic updates, and cache invalidation.

### 3.4 Backward Compatibility Re-Exports
- To ensure zero breaking changes across existing pages, routes, and imports during the migration, legacy export paths (such as `features/auth/auth.api.ts`, `features/users/users.api.ts`, `features/posts/posts.api.ts`, `lib/api.ts`, etc.) re-export from their new modular destinations.
