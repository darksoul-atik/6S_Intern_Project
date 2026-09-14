# ⚡ DevPulse

> **Next-Generation Full-Stack Developer Community & Collaboration Hub**  
> *(Intern Project — 7-Day Sprint)*

DevPulse is a high-performance, engineering-first developer community platform engineered as a clean, unified monorepo. It features a scalable **NestJS** backend integrated with **MongoDB** via **Mongoose** for resilient domain logic, alongside a modern **Next.js 16** App Router frontend styled with **Tailwind CSS**, **Framer Motion**, frosted white glassmorphism, **Google Inter & Manrope** typography, and pure **React Icons** for a fluid, reactive developer experience.

---

## 📅 7-Day Roadmap & Implementation Status

| Day | Milestone | Focus Areas | Status |
|:---:|---|---|:---:|
| **Day 1** | **Foundation, Health Check, OpenAPI & UI** | Monorepo scaffolding, NestJS + Next.js App Router setup, Mongoose Atlas integration, live DB connection diagnostics (`/health`), interactive Swagger UI (`/docs`), generic typed API client (`lib/api.ts`), interactive Framer Motion `MeshGradientBackground` with cursor physics, and a sleek 2-column DevPulse login interface in Google Inter font. | ✅ **Completed** |
| **Day 2** | **Auth, Identity & Security** | User schema (Mongoose) with role field (`admin` \| `user`), shared response envelopes (`TransformInterceptor` & `HttpExceptionFilter`), `POST /auth/signup` with bcrypt hashing, `POST /auth/login` issuing signed JWTs, Passport `JwtAuthGuard`, `RolesGuard` + `@Roles()` decorator, admin bootstrap CLI seed script, Next.js BFF `httpOnly` cookie persistence, route protection middleware, frontend `/signup`, `/login`, and `/dashboard` pages with dynamic header badges, frosted white glassmorphic cards, Google Inter & Manrope typography, pure React Icons (zero emojis), Lottie micro-animations, instant flicker-free logout to `/`, and xs/sm/md responsiveness. | ✅ **Completed** |
| **Day 3** | **Profiles & Account Management** | Extended User schema (skills & work experiences subdocuments), public profile viewing (`GET /users/:id`), authenticated & authorized mutations (`/users/me`, `/users/:id`, `/skills`, `/experiences`), `ProfileOwnerOrAdminGuard` with strict 403 Forbidden enforcement on unauthorized edits, Next.js BFF catch-all proxy (`/api/users/[[...path]]`), responsive view-profile page (`/profile/[id]`), interactive edit-profile page (`/profile/[id]/edit`) with optimistic skills tag management and work experience modal, loading skeletons, and comprehensive empty/error states. | ✅ **Completed** |
| **Day 4** | **Content Engine & Markdown Posts** | Markdown post editor with live preview, tags & categories, post CRUD operations, cursor/page pagination, and unified home feed. | ⏳ *Upcoming* |
| **Day 5** | **Community Engagement & Socials** | Threaded/nested comments system, polymorphic reactions (likes, stars, bookmarks), and optimistic UI interaction feedback. | ⏳ *Upcoming* |
| **Day 6** | **Trending Algorithms & Discovery** | Time-decay + engagement ranking algorithm (hot/trending/top), tag-based search and filtering, and an interactive Explore portal. | ⏳ *Upcoming* |
| **Day 7** | **Hardening, Testing & Final Audit** | End-to-end integration tests, rate limiting, audit logging, production optimization, final `AI_USAGE.md` compilation, and showcase preparation. | ⏳ *Upcoming* |

---

## 🛠️ Tech Stack Summary

- **Backend**: [NestJS](https://nestjs.com/) (Node.js, TypeScript), [Mongoose](https://mongoosejs.com/) (MongoDB ODM), `@nestjs/config`, `@nestjs/swagger`, `passport-jwt`, `bcryptjs`, `class-validator`, `vitest`
- **Frontend**: [Next.js 16](https://nextjs.org/) (React 19, TypeScript, App Router), [Tailwind CSS](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/), [Lottie React](https://github.com/Gamote/lottie-react), [React Icons (Feather Icons)](https://react-icons.github.io/react-icons/icons/fi/), Google Inter & Manrope Fonts
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
