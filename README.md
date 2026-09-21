# ⚡ DevPulse

> **Next-Generation Full-Stack Developer Community & Collaboration Hub**  
> *(Full-Stack Software Engineering Internship — 20-Day Learning Plan)*

DevPulse is a high-performance, engineering-first developer community platform engineered as a clean, unified monorepo. It features a scalable **NestJS** backend integrated with **MongoDB** via **Mongoose** for resilient domain logic, alongside a modern **Next.js 16** App Router frontend styled with **Tailwind CSS**, **Framer Motion**, frosted white glassmorphism, **Google Inter & Manrope** typography, and pure **React Icons** for a fluid, reactive developer experience.

---

## 📅 20-Day Learning Plan Roadmap & Implementation Status

### Phase 1: Foundations and Authentication (Days 1–4) — ✅ COMPLETED
| Day | Milestone | Focus Areas | Status |
|:---:|---|---|:---:|
| **Day 1** | **Project Setup & Request Lifecycle** | NestJS modular architecture (`AppModule`, `HealthModule`, `UsersModule`, `AuthModule`), Mongoose MongoDB Atlas connection, live diagnostics (`GET /health`), Next.js App Router setup, `/status` page with loading/operational/offline states, `.env.example`, clean checkout verification. | ✅ **Completed** |
| **Day 2** | **API Contracts & TanStack Query Foundation** | Global `TransformInterceptor` (`{ success: true, data }`), `HttpExceptionFilter` (standard error envelope), interactive Swagger OpenAPI (`/docs`), typed Axios API client (`frontend/src/lib/api.ts`) with `withCredentials: true`, `QueryClientProvider` with default caching/retry policies, status query lifecycle with TanStack Query. | ✅ **Completed** |
| **Day 3** | **Backend Authentication & Role-Based Access** | Mongoose `User` schema with unique lowercase email and `passwordHash` exclusion, `POST /auth/signup` with DTO validation and bcrypt salt rounds (10), `POST /auth/login` issuing signed JWT with `{ sub, email, role }`, `GET /auth/me` with `JwtAuthGuard`, `@Roles('admin')` + `RolesGuard`, idempotent admin bootstrap script (`npm run seed:admin`), anti-enumeration error normalization. | ✅ **Completed** |
| **Day 4** | **Frontend Authentication Flow & Brand Identity** | RHF + centralized Zod validation (`mode: 'onTouched'`), TanStack Query mutations (`useSignupMutation`, `useLoginMutation`, `useLogoutMutation`), `httpOnly` cookie persistence via Next.js Route Handlers, Edge middleware protection for `/dashboard`, `/profile`, `/admin` with `?redirect=` preservation, double-submit defense, responsive brand PNG logo integration (`Navbar`, Hero, `login`, `signup`, and tab favicon). | ✅ **Completed** |

### Phase 2: Profiles, Forms, and Posts (Days 5–8)
| Day | Milestone | Focus Areas | Status |
|:---:|---|---|:---:|
| **Day 5** | **Developer Profile API** | Headline, bio, skills, portfolioProjects Mongoose models, nested validation, conditional date rules, ownership rules (`GET /profile/me`, `PATCH /profile/me`, `/profile/me/projects`). | ✅ **Completed** |
| **Day 6** | **Complex Developer Profile Form** | Dynamic forms with nested arrays, `useFieldArray` for portfolio projects, theme-matching `DeleteProjectModal`, optimistic updates, delete confirmation dialog. | ✅ **Completed** |
| **Day 7** | **Posts API with Ownership & Pagination** | Post schema, authorId, CRUD endpoints, pagination metadata, author sanitization, query indexing, soft-delete lifecycle (5-day restore, permanent delete), automated hourly cron purge. | ✅ **Completed** |
| **Day 8** | **Feed & Reusable Post Interface** | `PostCard`, feed components, `useInfiniteQuery`, Intersection Observer infinite scroll, query cache invalidation. | ⏳ *Upcoming* |

### Phase 3: Comments, Reactions, and Reliable UI (Days 9–12)
| Day | Focus Areas | Status |
|:---:|---|:---:|
| **Day 9–12** | Threaded comments API, recursive comment interface, reaction engine (like/dislike toggling), optimistic UI with instant rollback. | ⏳ *Upcoming* |

### Phase 4: Discovery, Quality, and Applied Features (Days 13–16)
| Day | Focus Areas | Status |
|:---:|---|:---:|
| **Day 13–16** | Ranked and latest feed APIs, feed filter tabs with URL sync, full-text search with debounce & abort signal, AI-assisted post summarizer. | ⏳ *Upcoming* |

### Phase 5: Testing, Security, Deployment, and Communication (Days 17–20)
| Day | Focus Areas | Status |
|:---:|---|:---:|
| **Day 17–20** | Automated testing matrix, refresh token rotation, rate limiting & security hardening, multi-stage Dockerization, final release candidate demo. | ⏳ *Upcoming* |

---

## 🛠️ Tech Stack Summary

- **Backend**: [NestJS](https://nestjs.com/) (Node.js, TypeScript), [Mongoose](https://mongoosejs.com/) (MongoDB ODM), `@nestjs/config`, `@nestjs/swagger`, `passport-jwt`, `bcryptjs`, `class-validator`, `vitest`
- **Frontend**: [Next.js 16](https://nextjs.org/) (React 19, TypeScript, App Router), [Axios](https://axios-http.com/), [TanStack Query v5](https://tanstack.com/query), [React Hook Form](https://react-hook-form.com/), [Zod](https://zod.dev/), [Tailwind CSS](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/), [React Icons](https://react-icons.github.io/react-icons/icons/fi/), Google Inter & Manrope Fonts. Architecture follows the mandated feature-driven modular structure documented in [frontend/ARCHITECTURE.md](frontend/ARCHITECTURE.md).
- **Database**: MongoDB (Atlas cloud cluster or local MongoDB)
- **API Documentation**: OpenAPI 3.0 / Swagger UI at `http://localhost:5000/docs`
- **Package Manager**: npm

---

## 🩺 Day 1 — Project Setup & Request Lifecycle

### 1. Architecture & Monorepo Foundation
- **NestJS Application**: Modular layout split into `AppModule`, `HealthModule`, `UsersModule`, and `AuthModule`. Configuration is managed globally through `@nestjs/config` reading environment variables from `.env`.
- **Database Connection Lifecycle**: Connected to MongoDB Atlas via `MongooseModule.forRootAsync`. Connection health is evaluated dynamically via `connection.readyState` (`1 = connected`).
- **Health Diagnostic Endpoint (`GET /health`)**:
  - Live inspection of the Mongoose connection pool.
  - Returns backend operational status, timestamp, and database connectivity.
- **Frontend App Router Foundation**:
  - Built with Next.js 16 App Router (`src/app/`).
  - `/status` page (`frontend/src/app/status/page.tsx`): Pings `/health` and renders real-time visual states for **Loading**, **Operational (200 OK)**, and **Unavailable (Offline / Degraded)**.
- **Request Lifecycle (Browser to Database)**:
  `Client (Browser/Next.js) ──▶ Express Middleware ──▶ ValidationPipe ──▶ Route Guards ──▶ Controller ──▶ Service ──▶ Mongoose ODM ──▶ MongoDB Atlas ──▶ TransformInterceptor ──▶ Standard Success JSON`

---

## 📡 Day 2 — API Contracts & TanStack Query Foundation

### 1. Standardized Response & Error Contracts
Implemented globally in `backend/src/main.ts` across **all endpoints**:
- **Global Success Interceptor (`TransformInterceptor`)**: Wraps successful responses in:
  ```json
  {
    "success": true,
    "data": {},
    "message": "Optional feedback"
  }
  ```
- **Global Exception Filter (`HttpExceptionFilter`)**: Standardizes all HTTP errors into:
  ```json
  {
    "success": false,
    "statusCode": 400,
    "message": "Human-readable error description",
    "errors": ["Validation error 1", "Validation error 2"]
  }
  ```

### 2. Interactive Swagger Documentation (`/docs`)
- Documented health DTOs, authentication contracts, bearer authorization, and error envelopes at `http://localhost:5000/docs`.

### 3. Typed Axios API Client (`frontend/src/lib/api.ts`)
- Powered by `axiosInstance` with `withCredentials: true` and JSON headers.
- Response interceptors convert Axios rejections directly into typed `ApiError` instances.
- Universal routing forwards requests seamlessly to Next.js BFF routes (`/api/auth/*`) or the NestJS backend.

### 4. Server-State Management via TanStack Query
- Application wrapped in `QueryClientProvider` (`frontend/src/providers/QueryProvider.tsx`) with 1-minute fresh caching (`staleTime: 60000`) and network retry policy.
- `/status` page manages health polling via `useQuery({ queryKey: ['health'] })`, resiliently handling backend shutdowns without UI crashes.


---

## 🔐 Day 3 — Backend Authentication & Role-Based Access

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

#### Decision C: Refined Developer UI & Design System
- **Frosted White Glassmorphism**: High-contrast, multi-layer frosted cards (`bg-white/55`, `backdrop-blur-3xl`, `backdrop-saturate-200`, specular rim highlights) positioned on a dark glassmorphic shell.
- **Typography & Iconography**: Google Inter for readable data and Manrope for bold typography; SVG vectors via `react-icons/fi` replacing whimsical emojis.
- **Single-Source Action Hierarchy**: Diagnostic verification actions trigger directly from the Welcome Developer banner, eliminating duplicate buttons and keeping the diagnostic cards clean and responsive.
- **Instantaneous Logout Experience**: Direct transition to root (`/`) with instant local state reset and background session revocation, preventing white flashes or page reload spinners.

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
- `POST /api/auth/login`: Proxies credentials to NestJS, writes `httpOnly` cookie `devpulse_token`.
- `POST /api/auth/logout`: Clears `devpulse_token` cookie and terminates session.
- `GET /api/auth/me`: Reads cookie, forwards Bearer token to NestJS `/auth/me`.
- `GET /api/auth/admin-check`: Reads cookie, forwards Bearer token to NestJS `/auth/admin-check`.

---

### 4. Testing API Routes in Hoppscotch / Postman

You can test all endpoints in Hoppscotch (`https://hoppscotch.io`) or Postman directly against the backend (`http://localhost:5000`):

1. **Signup (`POST http://localhost:5000/auth/signup`)**:
   - Header: `Content-Type: application/json`
   - Body: `{"name":"Dev User","email":"user@devpulse.io","password":"Password123"}`
2. **Login (`POST http://localhost:5000/auth/login`)**:
   - Header: `Content-Type: application/json`
   - Body: `{"email":"user@devpulse.io","password":"Password123"}`
   - Copy the `accessToken` string from the JSON response.
3. **Verify User Session (`GET http://localhost:5000/auth/me`)**:
   - Auth tab: Choose **Bearer Token**, paste the `accessToken`.
   - Expected Response: `200 OK` with user profile object.
4. **Test Admin Access (`GET http://localhost:5000/auth/admin-check`)**:
   - Auth tab: Choose **Bearer Token**, paste the `accessToken`.
   - Expected Response: `403 Forbidden` for standard users, or `200 OK` for admin (`admin@devpulse.io`).
5. **Interactive Swagger Docs**:
   - Open your browser to `http://localhost:5000/docs` to execute requests directly with interactive schemas.

---

## 👤 Day 3 — Developer Profiles (Skills & Experiences) Architecture

### 1. Profile Visibility Choice & Security Guarantees

In DevPulse, developer profiles are architected around **open talent discovery** coupled with **strict authorization boundaries**:

#### Why Public Profile Retrieval (`GET /users/:id`):
- **Organic Discovery & Sharing**: DevPulse is an engineering community where developers showcase skills and projects. Forcing external visitors, recruiters, or peers to register before viewing a profile impairs organic reach and SEO.
- **Zero Information Leakage**: Sensitive credentials (`passwordHash`) are strictly excluded at query time via Mongoose projection (`.select('-passwordHash')`). Only public-facing developer attributes (`name`, `role`, `skills`, `experiences`, `createdAt`, `updatedAt`) are exposed.

#### Strict Ownership & Admin Authorization on Mutations:
- **No Anonymous Writes**: Every profile mutation requires a valid JWT Bearer token (`JwtAuthGuard`).
- **Owner-Only Edits**: Standard users can only update their own profile (`/users/me` or `/users/:id` matching their own `userId`).
- **Admin Management**: Administrators can edit any user profile to enforce community standards and moderation.
- **Strict 403 Forbidden**: Any attempt by a non-admin to mutate another developer's profile is immediately rejected with `403 Forbidden` (`You do not have permission to modify this profile`) enforced by `ProfileOwnerOrAdminGuard`.

---

### 2. Complete Profile Endpoints Reference

| Method | Endpoint | Access / Role | Description |
|---|---|---|---|
| `GET` | `/users/:id` | **Public** | Fetch developer profile (name, role, skills, experiences) |
| `GET` | `/users/me` | Bearer JWT (User) | Fetch authenticated user's own profile |
| `PATCH` | `/users/me` | Bearer JWT (Owner) | Update own basic profile (`name`) |
| `POST` | `/users/me/skills` | Bearer JWT (Owner) | Add skill (trimmed, deduplicated) |
| `DELETE` | `/users/me/skills/:skill` | Bearer JWT (Owner) | Remove skill from own profile |
| `PUT` | `/users/me/skills` | Bearer JWT (Owner) | Replace entire skills list |
| `POST` | `/users/me/experiences` | Bearer JWT (Owner) | Add work experience subdocument |
| `PATCH` | `/users/me/experiences/:id`| Bearer JWT (Owner) | Update work experience by subdocument ID |
| `DELETE` | `/users/me/experiences/:id`| Bearer JWT (Owner) | Delete work experience by subdocument ID |
| `PATCH` | `/users/:id` | Owner or Admin | Update profile for target user ID (`403` if unauthorized) |
| `POST` | `/users/:id/skills` | Owner or Admin | Add skill to target user ID (`403` if unauthorized) |
| `DELETE` | `/users/:id/skills/:skill` | Owner or Admin | Remove skill from target user ID (`403` if unauthorized) |
| `PUT` | `/users/:id/skills` | Owner or Admin | Overwrite skills for target user ID (`403` if unauthorized) |
| `POST` | `/users/:id/experiences` | Owner or Admin | Add experience to target user ID (`403` if unauthorized) |
| `PATCH` | `/users/:id/experiences/:id`| Owner or Admin| Update experience on target user ID (`403` if unauthorized) |
| `DELETE` | `/users/:id/experiences/:id`| Owner or Admin| Delete experience on target user ID (`403` if unauthorized) |

#### Frontend BFF Catch-All Proxy (`frontend/src/app/api/users/[[...path]]`):
- Next.js acts as an authenticated BFF proxy, extracting `devpulse_token` from `httpOnly` cookies and relaying `Authorization: Bearer <token>` to NestJS backend seamlessly for all client-side profile mutations.

---

### 3. Profile Testing Recipes (cURL / Hoppscotch)

```bash
# 1. Fetch Public Profile by User ID (No auth required)
curl http://localhost:5000/users/<USER_ID>

# 2. Fetch Authenticated User's Profile
curl http://localhost:5000/users/me \
  -H "Authorization: Bearer <TOKEN>"

# 3. Update Display Name
curl -X PATCH http://localhost:5000/users/me \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Alex Chen"}'

# 4. Add Skill (Deduplicated, trimmed)
curl -X POST http://localhost:5000/users/me/skills \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"skill":"TypeScript"}'

# 5. Remove Skill
curl -X DELETE http://localhost:5000/users/me/skills/TypeScript \
  -H "Authorization: Bearer <TOKEN>"

# 6. Add Work Experience Subdocument
curl -X POST http://localhost:5000/users/me/experiences \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Senior Engineer","company":"Vercel","from":"2023-01","to":"Present","description":"Building edge infrastructure."}'

# 7. Update Work Experience by ID
curl -X PATCH http://localhost:5000/users/me/experiences/<EXPERIENCE_ID> \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Staff Engineer"}'

# 8. Delete Work Experience by ID
curl -X DELETE http://localhost:5000/users/me/experiences/<EXPERIENCE_ID> \
  -H "Authorization: Bearer <TOKEN>"

# 9. Unauthorized Modification Attempt (Expect 403 Forbidden)
curl -X PATCH http://localhost:5000/users/<OTHER_USER_ID> \
  -H "Authorization: Bearer <USER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Hacked Name"}'
```

---

### 4. Frontend Profile UI & Experience

1. **View Profile (`/profile/[id]` or `/profile/me`)**:
   - High-contrast frosted glassmorphism card with initials avatar ring, online status dot, and role badge.
   - Skills & Tech chip tags with subtle hover states.
   - Work Experience vertical timeline with indigo connectors, date badges, company, and responsibilities.
   - One-click **"Share Profile"** button copying direct URL to clipboard.
   - Context-aware **"Edit Profile"** button (rendered only when viewer is owner or admin).
2. **Edit Profile (`/profile/[id]/edit`)**:
   - Full display name editing with validation feedback.
   - Interactive skills management with instant optimistic chip addition and removal.
   - Work experience management with modal dialog for adding and editing positions, plus delete confirmation.
3. **Resilient UX States**:
   - **Loading Skeleton**: `ProfileSkeleton` component with shimmering header, skills, and experience cards.
   - **Empty States**: Contextual messaging ("No skills listed yet" + `+ Add your skills` CTA for owners; clean text for external visitors).
   - **Error States**: Dedicated 404 (User Not Found) and 403 (Permission Denied) cards with dashboard fallback navigation.

---

## 🛡️ Day 4 — Frontend Authentication Flow (React Hook Form, Zod & TanStack Query)

### 1. Architectural Strategy & Design Choices

#### A. Chosen Session Persistence Strategy: `httpOnly` Cookie via Next.js BFF Route Handlers
- **Strategy**: Authentication tokens are stored in an **`httpOnly`**, **`Secure`**, **`SameSite=Lax`** cookie (`devpulse_token`) managed via Next.js Backend-For-Frontend (BFF) Route Handlers (`frontend/src/app/api/auth/*`).
- **Why this strategy was chosen over `localStorage`**:
  1. **Maximum XSS Immunity**: Tokens stored in browser `localStorage` or `sessionStorage` can be exfiltrated by rogue scripts or vulnerable third-party dependencies. An `httpOnly` cookie cannot be read or accessed by client-side JavaScript.
  2. **Edge Middleware Interception**: Next.js App Router `middleware.ts` reads the cookie directly from the HTTP request headers at the edge, redirecting unauthorized users before server components render or layout shifts occur.
  3. **Decoupled REST Backend**: The Next.js BFF acts as a secure proxy that forwards `Authorization: Bearer <token>` headers to the NestJS backend, keeping the backend API decoupled and generic.

#### B. React Hook Form Validation Mode: `mode: 'onTouched'`
- **Decision**: Configured `mode: 'onTouched'` for both signup and login forms.
- **Rationale**:
  - Eliminates distracting error messages on initial keystrokes while a user is still typing.
  - Automatically runs validation the moment a user finishes typing and leaves the field (`onBlur`).
  - Once a field has been touched, validation dynamically switches to `onChange` for instant positive feedback when errors are resolved.

#### C. Centralized Zod Validation Schemas (`frontend/src/lib/validations/auth.ts`)
- **`signupSchema`**:
  - `name`: Must be a string between 2 and 50 characters (matches backend `SignupDto` `@MinLength(2)`).
  - `email`: Non-empty, valid email format, auto-trimmed and lowercased (matches backend `SignupDto` `@IsEmail()`).
  - `password`: Non-empty, minimum 6 characters (matches backend `SignupDto` `@MinLength(6)`).
- **`loginSchema`**:
  - `email`: Non-empty, valid email format.
  - `password`: Non-empty string (no client-side length constraints to prevent leaking password criteria or rejecting valid legacy passwords).

#### D. TanStack Query Session & Mutation Architecture
- **Mutations (`useSignupMutation`, `useLoginMutation`, `useLogoutMutation`)**:
  - Encapsulated in `frontend/src/hooks/useAuthMutations.ts`.
  - Maps backend error envelopes into safe human-readable feedback (e.g. 409 Conflict duplicate email mapped to clear advice).
  - `useLoginMutation` optimistically seeds the current user query cache (`queryClient.setQueryData(['auth', 'user'], user)`).
  - `useLogoutMutation` calls `/api/auth/logout`, purges all user-specific queries (`queryClient.removeQueries({ queryKey: ['auth'] })`), and clears the query cache (`queryClient.clear()`).
- **Current User Query (`useCurrentUser`)**:
  - Centralized hook in `frontend/src/hooks/useCurrentUser.ts` with `queryKey: ['auth', 'user']`.
  - Replaces ad-hoc re-fetching across components with a 5-minute fresh cache (`staleTime: 5 * 60 * 1000`).
  - Consumed directly in `AuthContext.tsx` and `Navbar.tsx` to display user name, email, and role badge (`USER` or `ADMIN`).

#### E. Safe Error Messaging & Enumeration Protection
- During login, whether an email does not exist in the database or the provided password is incorrect, both backend and frontend return and display the identical message:
  `"Invalid email or password. Please verify your credentials."`
- This completely prevents malicious actors from enumerating registered user emails.

#### F. Double-Submit Defense & Accessibility
- Forms feature double-defense locks:
  1. Internal handler early return: `if (isPending) return;`
  2. Button UI locks: `disabled={isPending}` and `aria-disabled={isPending}` with an inline spinning loader.
- Inputs are tied to `<label>` elements via `htmlFor` and explicit `id`s, while errors are linked with `aria-invalid` and `aria-describedby`.

#### G. Protected Route Handling & Redirect Preservation
- Edge `middleware.ts` guards `/dashboard/:path*`, `/profile/:path*`, and `/admin/:path*`.
- Unauthenticated requests are redirected to `/login?redirect=<original_path>`.
- Upon successful authentication, users are returned directly to their requested destination.

#### H. Typed Axios API Client Foundation (`frontend/src/lib/api.ts`)
- **Engine**: Powered by an `axios` instance configured with `withCredentials: true` and application/json headers for seamless cookie transmission.
- **Interceptors**: Response interceptor normalizes error payloads and network failures into strongly-typed `ApiError` instances containing `statusCode`, `message`, and validation error arrays.
- **Universal Routing**: Seamlessly delegates requests between Next.js internal BFF routes (`/api/auth/*`), relative endpoints, and absolute backend URLs (`NEXT_PUBLIC_API_URL`).
- **Full Backward Compatibility**: Interoperable with standard Fetch options (`body: JSON.stringify(...)` or Axios `data: {...}`), ensuring zero breaking changes across TanStack Query mutations.

#### I. Responsive Brand Identity & Logo Integration
- **Asset Processing**: High-resolution PNG brand lockup trimmed of empty transparent borders down to its exact bounds (`628×281`, aspect ratio 2.23:1) and saved to [`frontend/public/images/logo.png`](file:///c:/Users/hp/Downloads/6senseHQ/frontend/public/images/logo.png).
- **Standalone Emblem Favicon**: Isolated the golden geometric emblem (`282×281`) to generate `frontend/src/app/icon.png` (64×64) and configured `metadata.icons` in `layout.tsx` for browser tabs.
- **Placement-Tailored Responsive Sizing**:
  - **Top Navigation Bar (`Navbar.tsx`)**: Compact `h-7 sm:h-8 md:h-9 w-auto` (~62px to ~80px wide), ensuring zero overflow on narrow mobile screens ($\le$ 375px) while pairing with the 64px header.
  - **Landing Hero Banner (`page.tsx`)**: Centered focal showcase `h-12 min-[380px]:h-14 sm:h-16 md:h-20 w-auto` with ambient golden backlight (`drop-shadow-[0_0_28px_rgba(251,191,36,0.3)]`).
  - **Auth Cards (`login/page.tsx` & `signup/page.tsx`)**: Balanced `h-9 sm:h-11 md:h-12 w-auto` with subtle hover scaling (`hover:scale-105`).

---

## 🏗️ Monorepo Refactoring & Feature-Based Architecture

As the DevPulse application expanded through Days 1–4, a dedicated architectural refactoring was executed to organize the codebase for readability, scalability, and clean separation of concerns without altering any user-facing behavior, API contracts, or state handling.

### 1. Feature-First Directory Structure
Migrated from dispersed hooks, types, and bloated page files to self-contained feature slices under `frontend/src/features/`:

```
frontend/src/
├── app/                      # Thin App Router wrappers (routing, params unwrap, metadata)
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
│   └── dashboard/page.tsx    # Clean dashboard presentation page
│
├── features/                 # Modular domain features
│   ├── auth/
│   │   ├── auth.schemas.ts   # Zod validation schemas (signupSchema, loginSchema)
│   │   ├── auth.api.ts       # Colocated types & TanStack Query mutations (signup, login, logout, me, admin-check)
│   │   ├── LoginForm.tsx     # Extracted interactive login component
│   │   └── SignupForm.tsx    # Extracted interactive signup component
│   │
│   ├── users/
│   │   ├── users.api.ts      # Colocated types (UserProfile, Experience) & TanStack profile mutations
│   │   ├── useCurrentUser.ts # Current user authentication query hook
│   │   ├── ProfileView.tsx   # Reusable profile presentation view (used by /profile and /developers/[id])
│   │   ├── ProfileEditForm.tsx # Clean profile & skills editor
│   │   ├── ExperienceModal.tsx # Standalone modal for adding & editing work experiences
│   │   └── ProfileSkeleton.tsx # Reusable shimmering loading placeholder
│   │
│   └── admin/
│       ├── admin.api.ts      # Colocated types (AdminUser, PaginatedResponse) & TanStack admin queries
│       ├── AdminUsersTable.tsx # Admin directory table with stats, search, filtering & pagination
│       ├── EditUserModal.tsx # Standalone modal for editing user details and system roles
│       └── DeleteUserConfirm.tsx # Standalone confirmation modal for soft-deleting accounts
│
├── components/               # Shared cross-feature UI components
│   ├── Navbar.tsx            # Global navigation bar with user badge and mobile drawer
│   ├── MeshGradientBackground.tsx # Specular ambient backdrop glow
│   ├── LottieAnimation.tsx   # SSR-safe vector animation wrapper
│   └── ui/pagination.tsx     # Reusable shadcn pagination controls
│
└── lib/                      # Core cross-cutting utilities
    ├── api.ts                # Axios client with interceptors & ApiError normalization
    ├── formatters.ts         # Shared initials and date formatting helpers (getInitials, formatDate, formatExpDate)
    └── image.ts              # Shared HTML5 canvas image compression utility (compressImage)
```

### 2. Key Architectural Improvements
1. **Colocated Feature Types (`.api.ts`)**:
   - Rather than maintaining fragmented or disconnected global `types/` directories, all domain entities and payloads (`AuthUser`, `UserProfile`, `Experience`, `AdminUser`, `PaginatedResponse`) are strictly colocated within their feature API module (`auth.api.ts`, `users.api.ts`, `admin.api.ts`).
2. **Thin Route Wrappers in `app/`**:
   - Next.js App Router files (`page.tsx`) now act strictly as lightweight route handlers responsible for unrolling dynamic route params (using React 19's `use(params)`), enforcing metadata, and rendering the designated feature component.
3. **Discrete Modal UI Surfaces**:
   - Complex dialogs (`ExperienceModal.tsx`, `EditUserModal.tsx`, `DeleteUserConfirm.tsx`) were extracted into dedicated components with their own local form states and animations, reducing parent page sizes by over 60% without artificial fragmentation.
4. **Deduplication of Common Utilities**:
   - Canvas-based image compression was consolidated into `lib/image.ts`.
   - Date formatters (`formatDate`, `formatExpDate`, `formatDateDisplay`, `toDateInputValue`) and name initial generators (`getInitials`) were unified into `lib/formatters.ts`.
5. **Zero Behavior Regressions**:
   - Maintained 100% feature parity, exact styling, responsive breakpoints, cookie session lifetimes, and route protection across all pages.

---

## 👤 Day 5 — Developer Profile API (Models, Validation & Ownership Rules)

### 1. MongoDB Schema Modeling
* **Headline & Bio on User Document**:
  * `headline`: Optional trimmed string (max 160 characters) representing professional title/tagline.
  * `bio`: Optional trimmed string (max 2000 characters) for developer summary/about.
* **Embedded Portfolio Projects (`PortfolioProjectSchema`)**:
  * `title`: Required non-empty string (max 100 characters).
  * `description`: Required non-empty string (max 1000 characters).
  * `urls`: Array of valid HTTP/HTTPS URLs (max 5 links, deduplicated case-insensitively).
  * `technologies`: Array of non-empty technology names (min 1, max 20 items, deduplicated case-insensitively).
  * `startDate`: Required `YYYY-MM` calendar string.
  * `endDate`: Optional `YYYY-MM` calendar string.
  * `isCurrent`: Boolean flag designating ongoing/current projects.
  * Auto-generated timestamps (`createdAt`, `updatedAt`) and Mongoose `id` projection transform.

### 2. Nested Validation & Custom Constraints
* **`PortfolioProjectDto` & `UpdatePortfolioProjectDto`**:
  * Enforces string trimming and length bounds via `@Transform` and `@MinLength` / `@MaxLength`.
  * URL format enforcement via `@IsUrl({ protocols: ['http', 'https'] })`.
  * Array size and uniqueness enforcement via `@ArrayMinSize`, `@ArrayMaxSize`, and `@ArrayUnique`.
* **Custom Constraint: `ValidPortfolioProjectEndDate`**:
  * When `isCurrent === true`: Rejects payload if `endDate` is provided (`endDate must not be provided when isCurrent is true`).
  * When `isCurrent === false`: Requires `endDate` in `YYYY-MM` format.
  * Chronological Validation: Enforces that `endDate >= startDate` based on ISO `YYYY-MM` format comparison.
* **Flexible Avatar Format in `UpdateProfileDto`**:
  * Accepts standard `http://` / `https://` URLs, Base64 data URIs (`data:image/jpeg;base64,...`), and empty string `""` to allow profile photo removal.

### 3. Ownership & Authorization Architecture
* **Self-Service Profile (`/profile/me`)**:
  * Dedicated [`ProfileController`](file:///c:/Users/hp/Downloads/6senseHQ/backend/src/users/profile.controller.ts) mounted at `/profile`.
  * Scoped strictly to authenticated user via `@CurrentUser()` and `@UseGuards(JwtAuthGuard)`.
* **Resource Ownership Guard (`ProfileOwnerOrAdminGuard`)**:
  * Applied to parameterized user endpoints (`/users/:id/projects/...`).
  * Enforces that regular developers cannot read, modify, or delete another developer's projects (HTTP 403 Forbidden).
  * Grants bypass access to users with role `admin`.

### 4. Public Profile Privacy Projections
* **`GET /users/:id` (Public)**:
  * Uses explicit projection: `.select('name headline bio avatarUrl skills experiences portfolioProjects')`.
  * Sensitive and administrative attributes (`passwordHash`, `email`, `role`, `isDeleted`, `deletedAt`, `deletedReason`) are strictly omitted.
* **`GET /profile/me` (Private)**:
  * Returns authenticated user's profile including private identity claims for current session hydration.

### 5. Day 5 API Verification Commands

```bash
# 1. Retrieve Authenticated User Profile
curl -X GET http://localhost:5000/profile/me \
  -H "Authorization: Bearer <JWT_TOKEN>"

# 2. Update Developer Headline & Bio
curl -X PATCH http://localhost:5000/profile/me \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "headline": "Senior Full-Stack & Distributed Systems Architect",
    "bio": "Passionate about high-throughput microservices, NestJS, and modern frontend architectures."
  }'

# 3. Add Portfolio Project (with nested validation)
curl -X POST http://localhost:5000/profile/me/projects \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "DevPulse Platform",
    "description": "Enterprise social developer portfolio and discussion system.",
    "urls": ["https://github.com/example/devpulse", "https://devpulse.io"],
    "technologies": ["TypeScript", "NestJS", "MongoDB", "React", "Next.js"],
    "startDate": "2026-01",
    "isCurrent": true
  }'

# 4. Partial Update of Portfolio Project by ID
curl -X PATCH http://localhost:5000/profile/me/projects/<PROJECT_ID> \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "isCurrent": false,
    "endDate": "2026-06"
  }'

# 5. Delete Portfolio Project by ID
curl -X DELETE http://localhost:5000/profile/me/projects/<PROJECT_ID> \
  -H "Authorization: Bearer <JWT_TOKEN>"

# 6. Retrieve Public Profile (Sanitized Projection)
curl -X GET http://localhost:5000/users/<USER_ID>

# 7. Unauthorized Mutation by Another User (Expect 403 Forbidden)
curl -X PATCH http://localhost:5000/users/<OTHER_USER_ID>/projects/<PROJECT_ID> \
  -H "Authorization: Bearer <USER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Tampered Title"}'
```

---

## 🎨 Day 6 — Complex Developer Profile Form & Portfolio Management

### 1. Dynamic Nested Forms & Portfolio Subdocuments
* **Multi-Layer Profile Editing**:
  * Extracted and refactored profile management into dedicated feature components (`ProfileEditForm.tsx`, `ProjectModal.tsx`, `DeleteProjectModal.tsx`).
  * Dynamic array management for technology tags (`technologies: string[]`) and project URLs (`urls: string[]`) with validation and deduplication.
  * Date range logic handling ongoing projects (`isCurrent === true`) and chronological validation (`startDate <= endDate`).
* **Branded Confirmation Modal (`DeleteProjectModal.tsx`)**:
  * Replaced native browser `window.confirm()` with a custom glassmorphic modal matching the platform's color palette, frosted background, and typography.
  * Accessible focus trapping, keyboard ESC cancellation, and animated transitions.
* **Optimistic UI Updates & Responsive Design**:
  * Instant visual feedback with TanStack Query optimistic mutations and automatic cache invalidation (`['profile']`, `['users', id]`).
  * Standardized responsive layout using Tailwind utility classes (`min-w-23 sm:min-w-27`).

---

## 📝 Day 7 — Posts API with Ownership, Pagination, Soft-Delete & Background Cleanup

### 1. Post Schema & Feed Indexing ([`post.schema.ts`](file:///c:/Users/hp/Downloads/6senseHQ/backend/src/posts/schemas/post.schema.ts))
* **Mongoose Schema Structure**:
  * `authorId`: ObjectId referencing `User` (`required: true`).
  * `title`: String with automatic whitespace trimming (1–200 characters, `required: true`).
  * `body`: String with automatic whitespace trimming (1–20,000 characters, `required: true`).
  * `commentCount`: Number starting at 0 (`min: 0`).
  * `reactionCounts`: Nested subdocument `{ like: 0, dislike: 0 }`.
  * `deletedAt`: Date timestamp for soft deletion (`default: undefined`).
  * `deletedBy`: ObjectId referencing `User` who performed deletion (`default: undefined`).
  * `timestamps: true` producing `createdAt` and `updatedAt`.
  * `toJSON.transform`: Maps `_id` to `id` while preserving clean serialization.
* **Compound & Optimization Indexes**:
  * Primary Feed Index: `{ createdAt: -1, _id: -1 }` matches newest-first chronological sorting with deterministic secondary tie-breaking.
  * Soft-Delete Cleanup Index: `{ deletedAt: 1 }` enables high-performance query execution for the hourly purge job.

### 2. Posts REST Endpoints Reference

| Method | Endpoint | Access / Auth | Description |
|---|---|---|---|
| `POST` | `/posts` | Bearer JWT (Auth) | Create new post. `authorId` is strictly assigned from JWT claims. Increments user's `postsCount`. |
| `GET` | `/posts` | **Public** | Fetch paginated feed (newest first). Filters out soft-deleted posts. Returns pagination metadata. |
| `GET` | `/posts/:id` | **Public** | Fetch single post with safe public author info (`name`, `headline`, `avatarUrl`). Returns 404 for missing/deleted posts. |
| `PATCH` | `/posts/:id` | Owner or Admin | Update post `title` or `body`. Restricted strictly to active posts. |
| `DELETE` | `/posts/:id` | Owner or Admin | Soft-delete post. Sets `deletedAt` and `deletedBy`. Decrements original author's `postsCount`. |
| `POST` | `/posts/:id/restore` | Owner or Admin | Restore soft-deleted post within 5 days. Re-increments original author's `postsCount`. |
| `DELETE` | `/posts/:id/permanent`| Owner or Admin | Permanently delete an already soft-deleted post from MongoDB. |

### 3. Ownership & Authorization (`PostOwnerOrAdminGuard`)
* Enforces that only the original post author (`post.authorId.toString() === user.userId`) or a user with `role: 'admin'` can mutate a post.
* Pre-validates 24-character hexadecimal ObjectIds (`validatePostId`), returning clean HTTP 404s instead of Mongoose `CastError` 500s.
* Uses `findAnyPostByIdOrThrow` internally so ownership checks succeed for both active and soft-deleted posts during restore and permanent deletion.

### 4. Background Scheduled Purge (`PostCleanupTask`)
* Integrated via `@nestjs/schedule` with `ScheduleModule.forRoot()`.
* Cron Schedule: `@Cron(CronExpression.EVERY_HOUR)` runs `purgeExpiredPosts()` every hour.
* Policy: Permanently purges documents where `deletedAt <= 5 days ago` (`5 * 24 * 60 * 60 * 1000`).
* Error Handling: Defensive try/catch logging errors without crashing the backend process.

### 5. Day 7 API Verification Commands (cURL)

```bash
# 1. Create Post (Requires Bearer Token)
curl -X POST http://localhost:5000/posts \
  -H "Authorization: Bearer <USER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Scaling NestJS and MongoDB at Production",
    "body": "A deep dive into compound indexing, soft deletion patterns, and NestJS schedule tasks."
  }'

# 2. Get Paginated Feed (Public)
curl "http://localhost:5000/posts?page=1&limit=10"

# 3. Get Single Post by ID (Public)
curl http://localhost:5000/posts/<POST_ID>

# 4. Update Post (Author or Admin Only)
curl -X PATCH http://localhost:5000/posts/<POST_ID> \
  -H "Authorization: Bearer <USER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated: Scaling NestJS and MongoDB at Production"
  }'

# 5. Soft Delete Post (Author or Admin Only)
curl -X DELETE http://localhost:5000/posts/<POST_ID> \
  -H "Authorization: Bearer <USER_TOKEN>"

# 6. Verify Soft-Deleted Post Excluded from Feed
curl "http://localhost:5000/posts?page=1&limit=10"

# 7. Restore Soft-Deleted Post (Within 5-day window)
curl -X POST http://localhost:5000/posts/<POST_ID>/restore \
  -H "Authorization: Bearer <USER_TOKEN>"

# 8. Permanently Delete Post (Must be soft-deleted first)
curl -X DELETE http://localhost:5000/posts/<POST_ID> \
  -H "Authorization: Bearer <USER_TOKEN>"
curl -X DELETE http://localhost:5000/posts/<POST_ID>/permanent \
  -H "Authorization: Bearer <USER_TOKEN>"
```

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
| `ADMIN_PASSWORD` | Secure password for bootstrapped administrator | `<your_secure_admin_password>` |

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

### 2. Automated Test Suite
```bash
cd backend
npm test
```
*Runs Vitest test suite covering auth service, users service (skills & experiences subdocuments), controllers, JWT strategies, guards (RolesGuard & ProfileOwnerOrAdminGuard), response transform interceptors, and exception filters (46/46 passing across 8 suites).*

### 3. Live API Diagnostics (cURL)
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

### 4. Web UI Flow
1. **Navigate to `http://localhost:3000/signup`**:
   - Register a new account. Notice error validation alerts and success auto-redirect to `/login`.
2. **Sign in at `http://localhost:3000/login`**:
   - Authenticate with your new user credentials.
   - Automatically establishes the `httpOnly` cookie and redirects to `/dashboard`.
3. **Explore the Protected Dashboard (`http://localhost:3000/dashboard`)**:
   - **Navbar**: Shows your user email and dynamic role badge (`USER` or `ADMIN`).
   - **Welcome Developer Banner**: Interactive card with quick-test actions.
   - Click **"Verify User Identity"**: Populates the User Identity Check card with live decoded JWT claims.
   - Click **"Verify Admin Privileges"**: Populates the Admin Access Verification card with formatted `403 FORBIDDEN` for standard users, or `200 OK` for administrators.
4. **Instant Logout**:
   - Click **"Sign Out"**: Clears the `httpOnly` session and immediately transitions to the root landing page (`/`) without page reload or spinner flash.
   - Attempting to revisit `/dashboard` triggers server-side middleware redirect to `/login`.

---

## 🔍 Day 3 Verification Guide

### 1. Developer Profiles Flow (`/profile/me` & `/profile/[id]`)
1. **View Public Profile (`GET /profile/:id`)**:
   - Open any user's profile URL directly in your browser.
   - Verify public accessibility without requiring login.
   - Verify avatar ring, name, title, role badge, email, join date, skills tags, and work experience timeline.
   - Click **"Share Profile"**: Verifies URL copied to clipboard with visual confirmation.
2. **Edit Profile (`GET /profile/:id/edit` or `/profile/me/edit`)**:
   - Click **"Edit Profile"** on your own profile.
   - **Basic Details**: Update display name and headline title.
   - **Avatar Management**: Upload photo with automated client-side canvas compression; remove photo.
   - **Skills Management**: Add new skills (instant optimistic addition, duplicate prevention); click `×` to delete skill.
   - **Work Experiences**: Click `+ Add Position` to open modal; fill title, company, dates, or toggle "Currently Working Here"; click edit on existing entries or delete.
3. **Security & Ownership Enforcement**:
   - Log in as a standard user (`user@devpulse.io`).
   - Try navigating to `/profile/<OTHER_USER_ID>/edit`.
   - Verify that `ProfileOwnerOrAdminGuard` denies access with the dedicated `403 Permission Denied` interface.
   - Log in as Admin (`admin@devpulse.io`) and verify that administrators are authorized to edit any profile.

### 2. Admin User Directory Flow (`/admin/users`)
1. **Access Control**:
   - Standard users navigating to `/admin/users` are blocked or redirected.
   - Administrators accessing `/admin/users` see the full developer directory.
2. **KPI Analytics Cards**:
   - View live counters for Total Users, Active Accounts, Deleted Accounts, and Admins.
3. **Directory Features**:
   - **Search**: Type keyword to filter by name, email, or title in real time.
   - **Tabs**: Switch between "All", "Active", and "Deleted" user filters.
   - **Shadcn Pagination**: Navigate multi-page user sets using responsive pagination controls.
   - **Edit User Modal**: Click "Edit" to modify any user's name, email, title, or system role.
   - **Soft Delete & Deletion Rejection Notice**: Click "Delete" on an active user. When that user subsequently attempts to log in, their sign-in is rejected with:
     > *"Your profile has been deleted by an Admin. Please contact support if you believe this was an error."*
   - **Restore User**: Click "Restore" in the admin directory; the account is instantly re-enabled.

### 3. Mobile Responsiveness & Zero Overflow Verification
- **Screen Widths 320px–640px**:
  - Open browser DevTools (F12) and toggle device toolbar to 320px (iPhone SE / Galaxy Fold).
  - **Zero Horizontal Overflow**: `scrollWidth === innerWidth` across all pages with zero clipping.
  - **Navigation Hamburger Toggle**: Cleanly positioned at right edge with ample padding.
  - **Mobile Menu Drawer**: Tap hamburger button to reveal full user name (no `Name.....` truncation), role badge, email, nav links, and full-width sign-out button.
  - **Landing Page Hero**: "Continue as [Full Name]" button naturally wraps text across lines using `break-words`.
