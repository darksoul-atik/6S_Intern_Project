# ⚡ DevPulse Frontend

> Next-generation developer collaboration hub built with **Next.js 16 (App Router)**, **React 19**, **TanStack Query v5**, **Tailwind CSS**, and **Framer Motion**. Follows the mandated feature-driven modular structure documented in [`ARCHITECTURE.md`](ARCHITECTURE.md).

---

## 🏛️ Architecture & Authentication Security

### 1. The Backend-For-Frontend (BFF) Pattern
Rather than storing sensitive JWT tokens in browser `localStorage` where they are vulnerable to Cross-Site Scripting (XSS), DevPulse utilizes an enterprise **BFF (Backend-For-Frontend)** architecture:

```
[ Browser / Client UI ]
           │
           │  Same-Origin Relative HTTP Requests (`/api/*`)
           │  withCredentials: true (cookies sent automatically)
           ▼
[ Next.js BFF Route Handlers (`src/app/api/*`) ]
           │
           │  1. Extracts `devpulse_token` from httpOnly cookie
           │  2. Attaches `Authorization: Bearer <JWT>` header
           ▼
[ NestJS Core API (`http://localhost:5000`) ]
           │
           ▼
[ MongoDB Atlas Database ]
```

### 2. Edge Middleware Route Guarding (`src/middleware.ts`)
- **Server-Side Authorization**: Runs at the Edge before route rendering, inspecting the `devpulse_token` cookie.
- **Immediate Zero-Flicker Redirects**: Unauthenticated requests to `/dashboard`, `/profile`, `/posts/new`, `/posts/*/edit`, or `/admin` are intercepted immediately and redirected to `/login?redirect=<original_path>`.
- **Destination Memory**: Preserves requested paths and query parameters so users land exactly where they intended upon logging in.

### 3. Server-State Management via TanStack Query v5
- **Global Configuration** (`src/lib/tanstack/query-client.ts`): Configured with standard garbage collection (`gcTime: 5m`), stale time (`staleTime: 30s` to `1m`), and exponential retry policy.
- **Separation of Concerns**: Feature hooks are strictly split into:
  - **`queries/`**: Data-fetching hooks (`useQuery`, `useInfiniteQuery`) that depend on deterministic `queryKeys`.
  - **`mutations/`**: State-mutating hooks (`useMutation`) managing optimistic updates, cache invalidation, and notification dispatch.
- **Central Query Keys Factory** (`src/lib/tanstack/query-keys.ts`): Single source of truth for query key serialization.

---

## 📂 Mandated Feature-Driven Directory Structure

```
frontend/src/
├── app/                           # Thin Next.js App Router route wrappers
│   ├── (auth)/
│   │   ├── login/page.tsx         # Renders <LoginForm />
│   │   └── signup/page.tsx        # Renders <SignupForm />
│   ├── dashboard/page.tsx         # Renders <DashboardView />
│   ├── posts/
│   │   ├── page.tsx               # Community feed with <PostFeed />
│   │   ├── new/page.tsx           # Create post with <PostForm />
│   │   ├── [id]/page.tsx          # Single post view with <PostDetails />
│   │   └── [id]/edit/page.tsx     # Edit post with <PostForm post={data} />
│   ├── profile/
│   │   ├── page.tsx               # Self profile view with <ProfileView />
│   │   └── edit/page.tsx          # Self profile editor with <ProfileEditForm />
│   ├── developers/[id]/page.tsx   # Public peer developer view with <ProfileView />
│   ├── admin/users/page.tsx       # Admin directory with <AdminUsersTable />
│   └── status/page.tsx            # Live system diagnostics
│
├── features/                      # Domain-driven feature modules
│   ├── auth/                      # Authentication domain (login, signup)
│   │   ├── components/            # login-form.tsx, signup-form.tsx
│   │   ├── mutations/             # useLoginMutation, useSignupMutation, useLogoutMutation
│   │   ├── queries/               # useMeQuery, useAdminCheckQuery
│   │   ├── schemas/               # auth-schema.ts (Zod)
│   │   ├── types/                 # auth.ts
│   │   └── utils/                 # auth-error.ts
│   │
│   ├── posts/                     # Posts & Community Feed domain (Day 7 & 8)
│   │   ├── components/            # post-card.tsx, post-feed.tsx, post-details.tsx,
│   │   │                          # post-form.tsx, delete-post-modal.tsx
│   │   ├── mutations/             # useCreatePostMutation, useUpdatePostMutation,
│   │   │                          # useSoftDeletePostMutation, useRestorePostMutation
│   │   ├── queries/               # useInfinitePosts, usePost
│   │   ├── schemas/               # post-schema.ts (Zod)
│   │   └── types/                 # post.ts
│   │
│   ├── users/                     # Profiles, skills, experiences, portfolios
│   │   ├── components/            # profile-view.tsx, profile-edit-form.tsx,
│   │   │                          # experience-modal.tsx, delete-project-modal.tsx
│   │   ├── mutations/             # user-mutations.ts
│   │   ├── queries/               # user-queries.ts
│   │   ├── schemas/               # user-schema.ts (Zod)
│   │   ├── types/                 # user.ts
│   │   └── utils/                 # image-utils.ts (canvas compression)
│   │
│   └── admin/                     # Admin moderation & user directory
│       ├── components/            # admin-users-table.tsx, edit-user-modal.tsx
│       ├── mutations/             # admin-mutations.ts
│       ├── queries/               # admin-queries.ts
│       └── types/                 # admin.ts
│
├── services/api/                  # Pure Axios API functions (NO React dependencies)
│   ├── auth.ts                    # loginUser, signupUser, logoutUser, getCurrentUser
│   ├── posts.ts                   # getPosts, getPostById, createPost, updatePost, softDeletePost
│   ├── users.ts                   # getUserProfile, updateUserProfile, uploadAvatar, deleteAvatar
│   ├── admin.ts                   # getAdminUsers, updateUserByAdmin, toggleAdminRole
│   └── health.ts                  # getHealthStatus
│
├── lib/                           # Core infrastructure & utilities
│   ├── axios/                     # Axios client, server factory, error interceptor
│   ├── tanstack/                  # QueryClient config, query-keys factory
│   └── utils/                     # cn.ts (clsx + twMerge), formatters.ts
│
├── components/                    # Global cross-cutting components
│   ├── layout/navbar.tsx          # Responsive navigation bar with mobile drawer
│   └── ui/                        # mesh-gradient-background.tsx, lottie-animation.tsx
│
└── providers/                     # React Context providers
    ├── query-provider.tsx         # TanStack QueryClientProvider
    └── providers.tsx              # Composed root application providers
```

---

## 🔄 Working Flow as of Day 8

### 1. Community Feed & Infinite Scroll (`/posts`)
1. User navigates to `/posts`.
2. `useInfinitePosts(limit = 10)` triggers `fetchPostsPage(pageParam = 1, limit = 10)` via `services/api/posts.ts`.
3. Posts are rendered inside `PostCard` components featuring:
   - High-contrast typography (`text-slate-900` title, `text-slate-700` body).
   - Card container background hover elevation (`hover:bg-slate-50/80 hover:border-slate-300 hover:-translate-y-0.5`).
   - Dark theme "Read Post" action button with vibrant purple arrow icon.
   - Glassmorphic reaction and comment counters.
4. When the user scrolls near the bottom (within `300px`), `IntersectionObserver` observes `loadMoreRef` and triggers `fetchNextPage()`.
5. Page 2 posts (`/api/posts?page=2&limit=10`) are fetched, deduplicated by ID, and seamlessly appended to the feed without layout shift.
6. When `page >= totalPages`, `hasNextPage` becomes `false` and the `"You're all caught up!"` badge renders.

### 2. Post Creation Flow (`/posts/new`)
1. Authenticated user fills `PostForm` (title & body with character counters).
2. React Hook Form validates constraints with Zod (`title`: 3–120 chars, `body`: 10–10,000 chars).
3. `useCreatePostMutation` sends payload to `/api/posts`.
4. On success:
   - `queryClient.invalidateQueries({ queryKey: postKeys.feed() })` evicts stale feed cache.
   - User is redirected to the newly created post details page (`/posts/${id}`).

### 3. Soft-Delete & Feed Invalidation Flow
1. Author or admin clicks "Delete" on a post card or details page.
2. Theme-consistent `DeletePostModal` opens with specular borders and clear warning copy.
3. On confirming delete, `useSoftDeletePostMutation` sends `DELETE /api/posts/${id}`.
4. On success:
   - The post query cache is invalidated across all active feed queries (`postKeys.feed()`).
   - The modal closes, and the deleted post immediately vanishes from the live feed.
   - If executed on `/posts/${id}`, user is redirected back to `/posts` with zero orphaned UI states.

### 4. Phase 3 Comments Integration Roadmap (Day 9 BE Completed, Day 10 FE Upcoming)
- **Backend API Ingestion (Completed in Day 9)**: Fully integrated NestJS `CommentsModule` with endpoints:
  - `GET /posts/:postId/comments` (hierarchical comment tree with nested replies)
  - `POST /posts/:postId/comments` (top-level comment creation)
  - `POST /posts/:postId/comments/:commentId/replies` (reply creation with max depth 1 enforcement)
  - `DELETE /comments/:id` (cascade thread deletion with accurate post/user counter decrements)
- **Frontend Architecture Purity**: Pruned all 31 legacy 1-line re-export bridge files across features (`posts/`, `admin/`, `auth/`, `users/`, `components/`, and `lib/`), strictly enforcing clean direct imports from canonical feature subfolders (`components/`, `queries/`, `mutations/`, `schemas/`, `types/`, `utils/`).
- **Day 10 Target (Threaded Comments Interface)**: Next up is the recursive `CommentItem` component, inline reply form with keyboard focus management, and optimistic posting with TanStack Query cache reconciliation.

---

## 🚀 Development Scripts

```bash
# Start development server with Turbopack (port 3000)
npm run dev

# Run ESLint validation
npm run lint

# Compile production Next.js build
npm run build

# Start production server
npm run start
```
