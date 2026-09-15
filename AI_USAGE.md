# AI Usage Log

## Tools Used

- **Antigravity (Google DeepMind)**: Primary agentic execution environment utilized for hands-on codebase scaffolding, terminal command execution, dependency resolution, atomic git operations, and live local verification of services.
- **Claude (Anthropic)**: Utilized for high-level architectural planning, iterative prompt refinement, decomposing the multi-day roadmap into strictly bounded daily deliverables, and defining granular acceptance criteria.
- **ChatGPT (OpenAI)**: Leveraged for conceptual ideation, reviewing full-stack monorepo patterns, comparing NestJS module topologies, and validating Mongoose connection lifecycle strategies.

---

## How I Prompted

#### Day 1: Project Setup & Request Lifecycle
- **Strict Boundary Scoping**: Designed prompt contracts that explicitly restricted the AI from jumping ahead into Days 2–7 product logic (e.g., authentication, posts, reactions, comments). Day 1 was strictly scoped to infrastructure scaffolding, Mongoose connection validation, live health diagnostics (`GET /health` with `connection.readyState`), and Next.js App Router `/status` dashboard.
- **Contract-First Commit Discipline**: Enforced a granular, milestone-based commit protocol rather than end-of-day bulk commits. Each checklist item was mandated to have its own conventional commit (`chore:`, `feat:`, `docs:`) accompanied by explicit command-line verification (compilation, daemon boot, HTTP responses).
- **Dual-Branch Pipeline Orchestration**: Instructed the agent to follow a continuous parity model across `beta` and `main` branches, requiring validation and push to `beta` first before fast-forwarding into `main`.
- **Iterative Feedback Loops**: Steered implementation through progressive review phases—starting with plan approval in `implementation_plan.md`, validating runtime logs, and directing follow-up enhancements (such as Swagger documentation integration).

### Day 2: API Contracts & TanStack Query Foundation
- **Standardized Response Envelopes**: Mandated global NestJS interceptors and exception filters:
  - `TransformInterceptor` wrapping all successful responses in `{ success: true, data: T, message?: string }`.
  - `HttpExceptionFilter` wrapping errors in `{ success: false, statusCode: number, message: string, errors: string[] }`.
- **OpenAPI / Swagger Documentation**: Guided the integration of `@nestjs/swagger` at `/docs` with interactive DTO schemas (`HealthResponseDto`, `ErrorResponseDto`).
- **Typed Axios API Client Foundation**: Prompted for creating an extensible, typed API client in `frontend/src/lib/api.ts` powered by an `axios` instance configured with `withCredentials: true` and response interceptors mapping to `ApiError`.
- **Server-State Management**: Directed the setup of `QueryClientProvider` with resilient caching (`staleTime: 60s`, `retry: 1`) and wired the `/status` page with `useQuery(['health'])` displaying clear loading, connected, retry, and offline states without crashing.

### Day 3: Backend Authentication & Role-Based Access
- **Domain Modeling & Sensitive Field Sanitization**: Directed the implementation of the Mongoose `User` schema with unique lowercase email, role (`admin` | `user`), and `passwordHash` (strictly excluded on serialization via `toJSON` transform and `select('-passwordHash')`).
- **Secure Registration & Login Endpoints**:
  - `POST /auth/signup`: Input validation with `SignupDto`, password hashing via `bcrypt` (10 salt rounds), default `'user'` role, and 409 Conflict duplicate email handling.
  - `POST /auth/login`: Credential comparison with `bcrypt.compare`, anti-enumeration normalized error responses, and signed JWT issuance containing `{ sub, email, role, name }`.
- **RBAC & Authorization Guards**:
  - `JwtAuthGuard` protecting `GET /auth/me`.
  - `RolesGuard` paired with `@Roles('admin')` decorator protecting administrative routes (tested on `GET /auth/admin-check` with strict 403 Forbidden enforcement).
- **Idempotent Out-of-Band Admin Provisioning**: Instructed the agent to build an administrative bootstrap script executed exclusively via the CLI (`npm run seed:admin`), strictly rejecting any public HTTP registration endpoints for administrative accounts.
- **Developer Profiles & Ownership Security**: Extended domain models to support `skills: string[]` and `experiences: Experience[]` subdocuments, with public viewing (`GET /users/:id`), owner-only mutations, and administrative user moderation (`/admin/users`).

### Day 4: Frontend Authentication Flow & Brand Identity
- **Architectural Upgrade vs. Duplication**: Mandated an in-place upgrade of existing signup and login pages rather than creating parallel or duplicative routes, preserving the existing glassmorphic styling, background animations, and responsive layouts while modernizing the architecture.
- **Form Validation & Ergonomics Contract**: Required strict adherence to React Hook Form with centralized Zod schemas (`frontend/src/lib/validations/auth.ts`), specifically enforcing `mode: 'onTouched'` so users are not penalized with distracting errors while typing initially, yet receive instantaneous inline feedback on blur and subsequent keystrokes.
- **TanStack Query Mutation & Cache Architecture**: Directed the encapsulation of all authentication lifecycle mutations (`useSignupMutation`, `useLoginMutation`, `useLogoutMutation`) and current user hydration (`useCurrentUser`, `queryKey: ['auth', 'user']`), eliminating ad-hoc fetch logic and standardizing query cache invalidation.
- **Edge Route Protection & Return Redirection**: Prompted for comprehensive route matching in Next.js `middleware.ts` covering `/dashboard/:path*`, `/profile/:path*`, and `/admin/:path*`, preserving the user's requested destination via `?redirect=` query parameters.
- **Dual-Layer Double-Submit Defense**: Directed the implementation of submit locks featuring both programmatic in-flight early returns in `onSubmit` and reactive UI locks (`disabled={isPending}`, `aria-disabled={isPending}`, and inline animated spinners) to eliminate duplicate concurrent mutation requests.
- **Axios Foundation Realignment**: Prompted the agent to switch the HTTP client layer to `axios` to align with Day 2 architectural guidelines, requiring an Axios instance configured with `withCredentials: true`, response interceptors mapping to `ApiError`, and 100% backward compatibility for TanStack Query mutations.
- **Responsive Brand Asset Integration**: Prompted for replacing the generic placeholder SVG pulse with the newly provided brand PNG lockup. Mandated that the logo not be a static single size, but proportionally scaled and responsive per placement (`Navbar.tsx`, `page.tsx` hero centerpiece, `login/page.tsx`, and `signup/page.tsx`), and extracted a square 1:1 icon for browser tab favicons (`icon.png`).
tions.

---

## What I Reviewed or Rejected

### Day 1
- **Rejected Temporary / Ad-Hoc Frontend API Checking**: Intervened when assessing how frontend health checks should be structured. Rather than allowing a quick, throwaway component-level fetch, insisted on establishing an extensible, typed `lib/api.ts` abstraction that will serve as the persistent foundation for all API interactions across Days 2–7.
- **Enforced Early Monorepo Hygiene**: Reviewed and prioritized `.gitignore` rules at Step 0 before executing any scaffolding scripts to prevent `node_modules`, build artifacts (`dist/`, `.next/`), or `.env` credential files from ever being staged or tracked.
- **Rejected Premature Feature Bloat**: Actively audited generated code to ensure zero premature domain schemas, dummy models, or unrequested utility code crept into the Day 1 baseline.
- **Verified Secrets Isolation**: Verified that the MongoDB Atlas connection URI was strictly confined to a gitignored local `backend/.env` file, ensuring only sanitized `.env.example` templates were staged for version control.

### Day 2
- **Rejected `localStorage` for JWT Storage**: Explicitly rejected storing authentication tokens in browser `localStorage` or `sessionStorage` due to vulnerability to token exfiltration via Cross-Site Scripting (XSS). Enforced the Next.js Route Handler BFF pattern with `httpOnly` cookie persistence.
- **Rejected Public HTTP Admin Provisioning Endpoint**: Rejected creating an HTTP route for bootstrapping the initial administrator, even if protected by a shared header. Mandated an isolated, idempotent CLI script (`backend/src/scripts/seed-admin.ts`) to keep the attack surface at zero.
- **Rejected Redundant Duplicate Action Buttons**: Audited the dashboard interactive cards and detected duplicate action buttons (`Verify User Session` and `Test Admin Access`) in the individual diagnostic cards that duplicated identical buttons in the Welcome Developer banner. Directed their removal for a clean, hierarchy-focused UX.
- **Rejected Whimsical Emojis in Technical Portal**: Audited dashboard and authentication headers; stripped out emojis in favor of crisp, professional SVG icons from `react-icons/fi`.
- **Rejected Static/Unnecessary Navigation Links**: Removed the "Overview" navigation link from the top navigation bar to streamline developer navigation directly between key platform features.
- **Rejected Internal Design Color Terminology**: Removed design system labels (e.g., "Primary Accent", "Secondary Color") that had inadvertently leaked into user-facing status indicators.

### Day 3
- **Rejected Premature Feature Creep (Posts, Ranking, Comments)**: Enforced strict Day 3 boundary discipline by rejecting any inclusion of social posts, upvotes, feeds, or threaded comments until Days 4–6, keeping the focus entirely on developer profiles, skills, and work experiences.
- **Rejected Blanket Authentication on Profile Viewing**: Audited the profile viewing design and rejected gating `GET /users/:id` behind authentication. In a developer platform, peer profiles, resumes, and skill portfolios must be shareable and discoverable publicly without login barriers.
- **Rejected Duplicate DTO Envelopes**: Ensured that the profile endpoints reused Day 2's global `TransformInterceptor` and `HttpExceptionFilter`, keeping success/error response structures consistent across the entire platform.
- **Rejected Destructive Array Overwrite for Single Operations**: Avoided requiring full array uploads for single skill or experience additions/removals; implemented targeted subdocument endpoints (`POST /skills`, `DELETE /skills/:skill`, `POST /experiences`, `PATCH /experiences/:id`, `DELETE /experiences/:id`).
- **Rejected Artificial Name Truncation (`Name.....`)**: Strictly rejected applying CSS `truncate` and fixed pixel max-widths on user names across the landing page, navbar, dashboard, and admin cards. Enforced flexible, natural text wrapping (`break-words` and `leading-snug`) ensuring full developer names and titles display completely without ellipsis dots.
- **Rejected Crammed Mobile Top Navbar**: Rejected placing user badges, logout buttons, and the hamburger toggle concurrently in the mobile header row (<640px), which caused header overflow on devices $\le$ 375px. Mandated moving the rich user profile details and logout button into the slide-down mobile menu drawer.
- **Rejected Fixed-Width Action Wrappers in Mobile Cards**: Replaced rigid `space-x-2` button containers with modern flex-wrap and `gap-2` to eliminate awkward margin-wrapping offsets on narrow mobile cards.

### Day 4
- **Rejected Premature Day 5+ Scope Creep**: Strictly held the boundary line against introducing post editors, feeds, markdown previews, comments, or reaction data structures, keeping the work strictly confined to the frontend authentication flow.
- **Rejected Duplicating Signup/Login Pages**: Audited the existing pages and rejected creating brand new or parallel routes (`/auth/login`, `/auth/signup`), electing to upgrade the existing pages in place to preserve visual polish and established URL bookmarks.
- **Rejected Aggressive Keystroke Error Feedback (`onChange` mode)**: Evaluated RHF validation modes and rejected default `onChange` validation on unblurred inputs, which displays disruptive validation errors while the user is still in the middle of typing. Enforced `mode: 'onTouched'` for a calm, professional developer experience.
- **Rejected Raw JSON Server Error Dumps**: Rejected exposing raw backend HTTP error payloads directly to users. Structured error envelope mappers (`extractAuthErrorMessage`) to extract meaningful messages (such as translating 409 Conflict to actionable guidance on duplicate emails).
- **Rejected Client-Side `localStorage` Token Storage**: Re-evaluated and confirmed the `httpOnly` cookie strategy, rejecting suggestions to place JWTs in `localStorage` or `sessionStorage` where they would be exposed to client-side script injection.
- **Rejected Fetch-Only Hardcoding**: Intervened after reviewing Day 2 architectural requirements which recommended an Axios-powered client. Directed a clean migration in `frontend/src/lib/api.ts` to use `axiosInstance` while ensuring callers passing Fetch-style options (`body: string`) are transparently supported.
- **Rejected Raw Uncropped Image Embedding**: Analyzed the user's uploaded 1024×1024 logo PNG and detected over 350px of empty transparent padding around the actual artwork. Rejected embedding it raw, which would have rendered an unreadable, tiny micro-logo in the navbar. Used `sharp` to trim transparent bounds (yielding 628×281, aspect ratio 2.23:1) and extracted the standalone yellow geometric emblem (282×281).

---

## Bugs Caught & Critical Interventions

### Day 1
- **Omission of Swagger / OpenAPI Documentation**: Upon reviewing the initial backend scaffold and health controller, noticed that OpenAPI documentation had not been included in the default setup. Directed the agent to install `@nestjs/swagger`, create dedicated DTO schemas (`HealthResponseDto`, `HealthDataDto`), and expose interactive documentation at `/docs`.
- **Node.js ESM / CommonJS Type Import Conflicts**: Caught a TypeScript runtime `SyntaxError` during backend initialization caused by attempting to import `Connection` as a named value from CommonJS `mongoose` under Node.js ESM. Directed the resolution to enforce explicit `import type { Connection }`, allowing TypeScript to cleanly elide the type during transpilation.
- **Windows PowerShell Script Execution Blocking**: Identified and mitigated PowerShell script execution restrictions (`npm.ps1` blocking) by enforcing `npm.cmd` execution and resolving Arborist peer-dependency resolution failures using `--legacy-peer-deps`.
- **Live Database State Dynamic Verification**: Verified that `GET /health` did not return a static, hardcoded payload, but instead dynamically queried `connection.readyState === 1` against the live MongoDB Atlas cluster.

### Day 2
- **React 19 / ESLint Canary Hook Violations (`useTransform` & `set-state-in-effect`)**:
  - Caught a violation of the Rules of Hooks in `MeshGradientBackground.tsx` where Framer Motion's `useTransform` was invoked conditionally inside an interactive JSX block. Resolved by hoisting hook calls to the top level of the component.
  - Identified cascading-render ESLint errors where `setState` was called directly inside `useEffect` across `login/page.tsx`, `LottieAnimation.tsx`, and `AuthContext.tsx`. Resolved by deriving state directly from `searchParams` during render, migrating SSR hydration mount checks to `useSyncExternalStore`, and isolating async initialization with cancellation guards.
- **Logout Page Flash & Slow Redirection**: Identified an issue where clicking "Sign Out" caused a full window refresh (`window.location.reload()`) with an undesirable loading spinner flash. Fixed by coordinating immediate local user state clearance with Next.js App Router transition (`router.replace('/')`) prior to issuing the background cookie termination request.
- **Admin Password Autofill & Trailing Whitespace**: Diagnosed edge cases where browser credential managers or manual copy-paste inserted trailing whitespace into email/password inputs. Hardened `AuthService.login` to sanitize input emails (`email.trim().toLowerCase()`) and added diagnostic authentication logging.
- **SSR Hydration Mismatches on Lottie Animations**: Resolved SSR hydration errors when rendering Lottie vector animations by developing an SSR-safe client wrapper (`LottieAnimation.tsx`) that mounts animations only after the client tree has hydrated.

### Day 3
- **NestJS Passport Module Missing Provider in `UsersModule`**: Caught a runtime dependency resolution error (`UnknownAuthenticationStrategyException: Unknown authentication strategy "jwt"`) when applying `JwtAuthGuard` in `UsersController`. Diagnosed that `UsersModule` required importing `PassportModule.register({ defaultStrategy: 'jwt' })` to supply the authentication options context.
- **Next.js 16 Dynamic Route Params as Promises**: Handled Next.js 16 App Router deprecation where `params` is now an asynchronous Promise (`params: Promise<{ id: string }>`), leveraging React 19's `use(params)` for type-safe parameter unwrap without hydration mismatches.
- **Mongoose Subdocument Case Sensitivity & Array Mutation**: Prevented skill duplicate pollution by implementing case-insensitive trimming (`skill.trim().toLowerCase()`) before inserting into user documents, preserving case-preserving display strings while enforcing uniqueness.
- **Navbar Mobile Viewport Overflow ($\le$ 375px)**: Discovered that on small screens (e.g. 320px–375px), rendering the logo, user pill, logout button, and hamburger toggle side-by-side exceeded 350px width, causing the hamburger menu button to overflow the right edge. Resolved by streamlining the mobile top bar (logo + 32px avatar dot + hamburger toggle) and relocating the full profile card, links, and full-width sign-out button into the mobile drawer.
- **Tailwind `space-x` Wrapping Margin Bug**: Fixed alignment glitches where `space-x-2` applied unnecessary left margins to wrapped buttons on mobile cards by migrating to native `gap-2` in flex-wrap layouts.
- **Root Viewport Horizontal Scroll Prevention**: Added `overflow-x: hidden; max-width: 100vw;` to `html` to prevent mobile browser bounce and scrollbar appearance on touch devices.
- **Browser Subagent Playwright CDN Failure Protocol**: When the browser subagent encountered an external Playwright driver CDN 404 (`azureedge.net`), immediately halted automated browser actions and adhered to system protocols by querying the user for instruction before proceeding with verified programmatic and local verification workflows.
- **Automated Test Coverage Expansion**: Expanded backend unit and integration test coverage from 20 to 46 passing tests across 8 test suites, verifying authentication, profile ownership, role guards, user service mutations, and response interceptors.

### Day 4 (Continued) & TanStack Query Full-Stack Frontend Migration
- **Incomplete Edge Middleware Route Matcher**: Identified during audit that `frontend/src/middleware.ts` had an incomplete route matcher (`['/dashboard/:path*', '/login', '/signup']`) which omitted `/profile/:path*` and `/admin/:path*`. This would have allowed unauthenticated users to access profile editing or admin directories before triggering client-side guards. Fixed by extending the matcher to comprehensively intercept all protected subtrees.
- **Query Parameter Preservation on Protected Redirects**: Caught that unauthorized redirects were dropping destination search parameters. Enhanced the middleware to preserve query strings (`${pathname}${search}`) within the `?redirect=` URL query parameter, guaranteeing users are returned to their exact requested URL state upon authenticating.
- **Query Cache Invalidation on Session Termination**: Caught that existing logout logic only wiped the `httpOnly` cookie but failed to evict cached user state in TanStack Query (`['auth', 'user']`), which could allow stale identity data to momentarily render if another user logged in on the same browser session. Resolved by integrating `queryClient.removeQueries({ queryKey: ['auth'] })` and `queryClient.clear()` directly into the `useLogoutMutation` lifecycle.
- **Anti-Enumeration Error Normalization**: Enforced that both non-existent account lookups and bad password attempts return identical safe error messages (`"Invalid email or password. Please verify your credentials."`), preventing malicious user enumeration attacks.
- **Dual-Layer Double-Submit Race Condition**: Diagnosed potential duplicate network requests caused by users double-clicking submit or pressing Enter in rapid succession during slow network conditions. Mitigated by applying both programmatic early-return checks (`if (isPending) return;`) inside `onSubmit` and reactive UI locks (`disabled={isPending}` and `aria-disabled={isPending}` with an inline loading spinner).
- **Axios Error Envelope Mapping & Cookie Forwarding**: Diagnosed that standard Axios errors throw `AxiosError` with response payloads nested in `error.response.data`, which would have broken existing UI error mappers expecting `ApiError(message, statusCode, errors)`. Implemented an Axios response interceptor that converts rejected HTTP responses into `ApiError` instances while setting `withCredentials: true` to guarantee `httpOnly` cookie transmission across Next.js BFF routes.
- **Brand Icon & Next.js Favicon Pipeline**: Generated `frontend/src/app/icon.png` (64×64) from the extracted emblem mark and configured `metadata.icons` in `layout.tsx`, ensuring modern browsers cleanly render the high-DPI yellow brand emblem in tab bars.
- **Aspect-Ratio Preservation**: Handled horizontal lockup scaling using `w-auto object-contain` on Next.js `<Image />` tags to guarantee zero distortion or squishing across screen widths from 320px up to 4K displays.
- **Elimination of All Raw `apiClient` Calls from UI Layer**: Audited the entire frontend codebase for unmanaged manual API calls inside `useEffect` and event handlers. Migrated all 5 remaining manual pages (`developers/[id]`, `profile`, `profile/edit`, `admin/users`, and `dashboard`) to centralized TanStack Query hook modules (`useProfileQueries`, `useAdminQueries`, `useDashboardQueries`).
- **Smooth Pagination with `keepPreviousData`**: Implemented `placeholderData: keepPreviousData` in `useAdminUsers` to eliminate layout shift and table flickering during pagination and filter changes.
- **Multi-Level Cache Invalidation**: Enforced that all user mutations (avatar uploads/removals, skill additions/deletions, experience CRUD, and profile details) automatically invalidate both their specific user query cache (`['users', id]`) and the active auth session (`['auth', 'user']`), ensuring the Navbar user badge, profile cards, and directory tables stay synchronized platform-wide.



