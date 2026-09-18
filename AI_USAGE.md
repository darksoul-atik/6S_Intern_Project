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

### Architecture Refactor: Structure & Functional Components
- **Strict Zero-Regression Mandate**: Defined an unambiguous refactor-only scope: reorganize the codebase for readability and scale without introducing new features, changing API contracts, or altering user-facing behavior. Required explicit confirmation before proceeding at any step.
- **Dedicated Branching & Atomic Commits**: Enforced executing all refactoring on a dedicated branch (`refactor/structure-and-functional-components`), with step-by-step verification and commits for each domain boundary (Auth, Users/Profile, Admin, and Shared Utilities).
- **Feature-First Decomposition**: Guided the extraction of thick page components from `app/` into modular feature slices (`features/auth/`, `features/users/`, `features/admin/`), turning Next.js App Router pages into thin, readable route wrappers.
- **Dedicated Modal UI Surfaces**: Directed the extraction of complex dialogs into discrete feature components (`ExperienceModal.tsx`, `EditUserModal.tsx`, `DeleteUserConfirm.tsx`) to manage their own open/close state and forms, preventing parent components from ballooning to 1,000+ lines.
- **Type Colocation**: Mandated that TypeScript interfaces live directly in each feature's `.api.ts` file (e.g. `UserProfile`, `Experience` in `users.api.ts`; `AdminUser` in `admin.api.ts`; `AuthUser` in `auth.api.ts`) rather than fragmented in a disconnected global `types/` folder.
- **Shared Cross-Cutting Deduplication**: Consolidated copy-pasted canvas image compression into `lib/image.ts` and date/name formatting routines into `lib/formatters.ts`.

### Day 5: Developer Profile API
- **Domain Modeling & Nested Subdocument Validation**: Guided the implementation of the developer profile API with `headline`, `bio`, `skills`, and `portfolioProjects` Mongoose schemas. Enforced conditional date logic (`startDate <= endDate`, unless `isCurrent === true`), custom URL validation, and duplicate prevention.
- **Strict Ownership & Resource Protection**: Directed the creation of `ProfileOwnerOrAdminGuard` to protect `/profile/me` and `/profile/me/projects` mutations, while allowing public access to sanitized profiles via `GET /users/:id` without leaking sensitive fields (`email`, `passwordHash`, `role`).

### Day 6: Complex Developer Profile Form & Portfolio Management
- **Hierarchical Form & Subdocument Array Management**: Guided the implementation of dynamic nested forms for developer profiles, managing complex subdocument arrays (skills, work experiences, and portfolio projects) with dedicated modal dialogs and seamless validation.
- **Theme-Consistent Modal Architecture vs. Browser Popups**: Explicitly mandated replacing native browser confirmation dialogs (`window.confirm`) with a branded, glassmorphic `DeleteProjectModal` component matching the platform's color scheme, frosted glass backdrop, and typography.
- **Optimistic UI Updates & Instant Feedback**: Directed the integration of TanStack Query optimistic mutations for project creation, update, and deletion, ensuring immediate UI reactivity with automatic rollback on server errors.
- **Component Colocation & Feature Slicing**: Directed keeping modal state, handlers, and types cleanly colocated within `frontend/src/features/users/` (`ProjectModal.tsx`, `DeleteProjectModal.tsx`, `ProfileView.tsx`).

### Day 7: Posts API with Ownership, Pagination, Soft Delete & Background Cleanup
- **Domain Modeling & Compound Indexing**: Directed the creation of the `Post` schema with `authorId` ref to `User`, `title`, `body`, `commentCount`, `reactionCounts`, `deletedAt`, `deletedBy`, and timestamps. Enforced a compound index on `{ createdAt: -1, _id: -1 }` for high-throughput, deterministic feed sorting, and `{ deletedAt: 1 }` for background cleanup.
- **RESTful Endpoints & Strict Authorization**:
  - `POST /posts`: Enforced author derivation strictly from JWT claims (`@CurrentUser()`).
  - `GET /posts`: Required pagination query sanitization (`page`, `limit` clamped 1–100) and metadata (`total`, `page`, `limit`, `totalPages`) with safe public author projection (`name`, `headline`, `avatarUrl`) while strictly excluding sensitive user fields (`email`, `role`, `passwordHash`).
  - `GET /posts/:id`: Single post lookup with 24-character hexadecimal ObjectId pre-validation to avoid Mongoose CastError 500s and return clean 404s.
  - `PATCH /posts/:id`: Updates restricted strictly to active posts and guarded by `PostOwnerOrAdminGuard`.
  - `DELETE /posts/:id`: Soft-delete marking `deletedAt` and `deletedBy` with user profile `postsCount` decrement.
  - `POST /posts/:id/restore`: Re-enables soft-deleted posts within a 5-day restore window, incrementing the original author's `postsCount`.
  - `DELETE /posts/:id/permanent`: Irreversible physical document deletion restricted strictly to already soft-deleted posts.
- **Automated Hourly Cron Cleanup**: Prompted the integration of `@nestjs/schedule` and `PostCleanupTask` with `@Cron(CronExpression.EVERY_HOUR)` to automatically purge posts soft-deleted older than 5 days.

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

### Architecture Refactor: Structure & Functional Components
- **Rejected Over-Engineered Custom Hook Abstractions**: Upheld the core principle "Clean and Readable over Maximally Correct Architecture." Rejected extracting custom hooks for simple local component state (such as dropdown toggles, modal open/close booleans, or tab selection) where standard `useState` was clearer and more straightforward for interns to read.
- **Rejected Artificial Splitting of Presentation Pages**: Assessed `dashboard/page.tsx`. Because it is primarily a presentational landing dashboard with minimal UI complexity, rejected creating a superfluous `features/dashboard` folder with fragmented sub-components, keeping it clean and self-contained.
- **Rejected Disconnected Global Types Directory**: Reviewed type organization and rejected keeping a separate top-level `types/` folder. Colocated types directly inside their corresponding feature's `.api.ts` file (`auth.api.ts`, `users.api.ts`, `admin.api.ts`), ensuring domain changes and their associated contracts remain cohesive.
- **Rejected Retaining Stale Empty Legacy Directories**: Following the extraction of queries, hooks, and types into feature directories, audited the repository and cleanly removed obsolete files and empty directories (`frontend/src/hooks`, `frontend/src/types`) rather than leaving confusing dead artifacts.

### Day 5
- **Rejected Monolithic Controller Overloading**: Rejected stuffing all profile operations into `UsersController`. Separated concerns cleanly by creating `ProfileController` for `/profile/me` and `/profile/me/projects` while keeping `/users` focused on public lookup and admin management.
- **Rejected Loose Date Checking**: Rejected trusting client date inputs without cross-field validation. Enforced conditional date logic ensuring `startDate` precedes `endDate` unless `isCurrent` is explicitly `true`.
- **Rejected Leaking Private Claims in Public Profile Projections**: Strictly audited `GET /users/:id` to ensure user emails, password hashes, and administrative roles are never exposed to public consumers.

### Day 6
- **Rejected Native Browser Confirmation Popups**: Explicitly rejected using native `window.confirm()` or browser alerts when deleting portfolio projects. Enforced a custom React modal component (`DeleteProjectModal.tsx`) matching the application's glassmorphic design system and color palette.
- **Rejected Arbitrary Tailwind Class Names**: Audited profile statistic elements and rejected non-standard Tailwind arbitrary values (`min-w-[92px] sm:min-w-[108px]`), refactoring them into clean standard utility classes (`min-w-23 sm:min-w-27`).
- **Rejected Hard Page Reloads on Subdocument Mutations**: Rejected full profile refetches or page refreshes when modifying portfolio projects, enforcing surgical query cache invalidations (`['profile']`, `['users', id]`).

### Day 7
- **Rejected Placing Backend NestJS Schemas in Frontend**: Detected and intervened when a Mongoose schema file was initially authored inside the frontend folder (`frontend/src/posts/schemas/post.schemas.ts`). Relocated the file to its proper domain boundary at `backend/src/posts/schemas/post.schema.ts` and pruned the extraneous frontend folder.
- **Rejected Immediate Hard Deletion Without Recovery Window**: Upgraded the simple hard-delete requirement to an enterprise-grade soft-delete lifecycle featuring `deletedAt`, `deletedBy`, a 5-day restore period (`/posts/:id/restore`), and a separate permanent delete endpoint (`/posts/:id/permanent`).
- **Rejected Double-Decrementing User Post Counters**: Audited the interaction between soft-delete and permanent-delete. Prevented a double-decrement bug by ensuring `User.postsCount` is decremented during soft deletion and incremented upon restore, but left unchanged during permanent deletion.
- **Rejected Serial Database Calls on Paginated Feeds**: Reviewed feed retrieval in `PostsService.findAllPosts` and rejected sequential `await countDocuments()` followed by `await find()`. Refactored into concurrent execution using `Promise.all([countQuery, findQuery])` to minimize latency.
- **Rejected Leaking Private Author Claims in Public Feeds**: Enforced strict `.populate({ path: 'authorId', select: 'name headline avatarUrl' })` across both feed and single-post endpoints, ensuring `email`, `role`, and `passwordHash` are never leaked over public endpoints.

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

### Architecture Refactor: Structure & Functional Components
- **TypeScript Import Resolution & Missing Helper Export**: During the extraction of `ExperienceModal.tsx`, TypeScript compilation caught a missing named export `formatDateDisplay` from `lib/formatters.ts`. Added and exported `formatDateDisplay` in `lib/formatters.ts`, restoring clean type safety across all consumers.
- **Dynamic Route Params Resolution in React 19 / Next.js 16**: When simplifying `app/developers/[id]/page.tsx`, ensured compatibility with Next.js 16 App Router where `params` is a Promise by unwrapping it using React 19's `use(params)`.
- **Canvas Image Compression Unification**: Caught three independent, copy-pasted HTML5 canvas image resizing routines across the codebase (used for avatar uploads). Extracted and unified them into a reusable `compressImage` function in `lib/image.ts`, eliminating over 100 lines of duplicated canvas and blob logic.
- **Verification Gate Before Each Atomic Commit**: Before executing commits for each domain boundary (Auth, Users/Profile, Admin), ran `tsc --noEmit` and `next build` to guarantee zero compilation errors, zero type drift, and 100% successful static/dynamic page generation.
- **Backend Test Suite Integrity (48/48 Passing)**: Re-executed the complete Vitest test suite (`npm test`) on the NestJS backend to confirm that all 48 tests across 9 test suites remained fully green and unaffected by the structural refactoring.

### Day 5 — Developer Profile API (Models, Nested Validation & Ownership Rules)
- **Profile Title to Headline & Bio Migration**: Handled schema evolution from legacy single `title` field to discrete `headline` (max 160) and `bio` (max 2000) fields across Mongoose schema, service mutation handlers, search `$or` regex filters, and admin update DTOs.
- **Base64 Data URI Avatar Validation Defense**: Caught an edge case where switching `avatarUrl` to `@IsUrl({ protocols: ['http', 'https'] })` caused client-side uploads (compressed canvas Base64 `data:image/jpeg;base64,...`) and photo removal (`avatarUrl: ''`) to be rejected with HTTP 400. Replaced with pattern matching both URL protocols and Data URIs while preserving empty-string unsetting.
- **State-Transition Validation for Partial Updates**: Designed conditional validation in `updatePortfolioProject` to calculate projected project state (`nextStartDate`, `nextIsCurrent`, `nextEndDate`), ensuring partial PATCH updates cannot place a project into an illegal date state (e.g. updating `startDate` past existing `endDate`).
- **Dedicated `ProfileController` Route Mapping**: Introduced `ProfileController` at `/profile` alongside existing `/users` controller to provide strict REST compliance with Day 5 specification (`GET /profile/me`, `PATCH /profile/me`, `POST/PATCH/DELETE /profile/me/projects`).
- **Public Profile Privacy Enforcement**: Audited `GET /users/:id` to enforce strict projection whitelisting (`name headline bio avatarUrl skills experiences portfolioProjects`), guaranteeing zero leakage of private claims (`email`, `passwordHash`, `role`, `isDeleted`).
- **Automated Test Coverage Expansion (67/67 Passing)**: Expanded test suite from 48 to 67 unit and validation tests across 11 test suites, verifying custom date constraints, URL validation, duplicate array filtering, project CRUD, and permission guards.

### Day 6 — Complex Developer Profile Form & Portfolio Management
- **Modal Theme & Focus Trap Cohesion**: Identified unstyled delete confirmation flows that broke UI immersion. Engineered `DeleteProjectModal` with specular borders, backdrop blur, responsive sizing, and keyboard escape handling.
- **Tailwind v4 Width Compatibility**: Caught arbitrary pixel width classes in profile stat badges that triggered linter warnings. Migrated to standardized Tailwind scale values (`min-w-23 sm:min-w-27`) while preserving exact responsive badge dimensions.

### Day 7 — Posts API with Ownership, Pagination, Soft Delete & Background Cleanup
- **Frontend Mongoose Import Error**: Caught and resolved `@nestjs/mongoose` and `mongoose` module resolution errors caused by misplaced backend files inside `frontend/src/posts`. Relocated schemas and DTOs to `backend/src/posts/`, verified clean NestJS build and Next.js compilation.
- **Malformed MongoDB ObjectId 500 Internal Server Error**: Identified that querying non-hexadecimal post IDs caused Mongoose `CastError` throwing unhandled 500 errors. Implemented `validatePostId` checking `/^[0-9a-fA-F]{24}$/` to reliably convert malformed IDs into standard `404 NotFoundException`.
- **Soft-Deleted Post Leakage in Main Feed**: Caught that `findAllPosts` initially queried all documents regardless of deletion state. Added `{ deletedAt: { $exists: false } }` filter to both `countDocuments` and `find` queries, and created a compound index `{ createdAt: -1, _id: -1 }` to guarantee high performance.
- **Restore Window Expiration Enforcement**: Guaranteed that even if the scheduled cleanup cron has not yet purged an expired post, attempting to call `/posts/:id/restore` on a post deleted longer than 5 days (`5 * 24 * 60 * 60 * 1000`) throws a `400 BadRequestException`.
- **Cron Task Error Handling**: Wrapped `PostCleanupTask.purgeExpiredPosts()` in a defensive try/catch with `Logger.error`, ensuring transient database connectivity glitches during background sweeps do not crash the NestJS server instance.
- **Swagger / OpenAPI Documentation Parity**: Audited the Swagger UI at `/docs` and observed missing request body schemas for `POST /posts` and `PATCH /posts/:id`. Added `@ApiProperty` and `@ApiPropertyOptional` to `CreatePostDto` and `UpdatePostDto`, added the `posts` and `profile` tags to `DocumentBuilder` in `main.ts`, and verified interactive documentation.

