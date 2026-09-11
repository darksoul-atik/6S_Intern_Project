# AI Usage Log

## Tools Used

- **Antigravity (Google DeepMind)**: Primary agentic execution environment utilized for hands-on codebase scaffolding, terminal command execution, dependency resolution, atomic git operations, and live local verification of services.
- **Claude (Anthropic)**: Utilized for high-level architectural planning, iterative prompt refinement, decomposing the multi-day roadmap into strictly bounded daily deliverables, and defining granular acceptance criteria.
- **ChatGPT (OpenAI)**: Leveraged for conceptual ideation, reviewing full-stack monorepo patterns, comparing NestJS module topologies, and validating Mongoose connection lifecycle strategies.

---

## How I Prompted

### Day 1: Foundation, Diagnostics & Scaffolding
- **Strict Boundary Scoping**: Designed prompt contracts that explicitly restricted the AI from jumping ahead into Days 2–7 product logic (e.g., authentication, posts, reactions, comments). Day 1 was strictly scoped to infrastructure scaffolding, Mongoose connection validation, and health diagnostics.
- **Contract-First Commit Discipline**: Enforced a granular, milestone-based commit protocol rather than end-of-day bulk commits. Each checklist item was mandated to have its own conventional commit (`chore:`, `feat:`, `docs:`) accompanied by explicit command-line verification (compilation, daemon boot, HTTP responses).
- **Dual-Branch Pipeline Orchestration**: Instructed the agent to follow a continuous parity model across `beta` and `main` branches, requiring validation and push to `beta` first before fast-forwarding into `main`.
- **Iterative Feedback Loops**: Steered implementation through progressive review phases—starting with plan approval in `implementation_plan.md`, validating runtime logs, and directing follow-up enhancements (such as Swagger documentation integration).

### Day 2: Authentication, Identity, Security & Polish
- **Security-First Architecture Specification**: Prompted for an enterprise-grade authentication system utilizing the Backend-For-Frontend (BFF) proxy pattern with `httpOnly`, `Secure`, `SameSite=lax` cookies, completely isolating tokens from client-side JavaScript to eliminate XSS risks.
- **Role-Based Access Control (RBAC) Contracts**: Guided the creation of a declarative `@Roles('admin')` decorator paired with NestJS `RolesGuard` and Passport JWT strategy, with strict HTTP 403 Forbidden enforcement on unauthorized roles.
- **Idempotent Out-of-Band Admin Provisioning**: Instructed the agent to build an administrative bootstrap script executed exclusively via the CLI (`npm run seed:admin`), strictly rejecting any public HTTP registration endpoints for administrative accounts.
- **Iterative UI/UX Modernization**: Steered the UI through progressive design reviews:
  - Transitioned the dashboard to frosted white glassmorphism (`backdrop-blur-3xl`, specular highlights).
  - Enforced modern typography pairings with Google Inter and Manrope fonts.
  - Mandated clean, scalable vector icons (`react-icons/fi`) and strictly eliminated emojis across all cards, badges, and feedback toasts.
  - Ensured full viewport responsiveness down to mobile `xs` (<380px), `sm`, and `md` breakpoints.
  - Removed internal design/technical jargon (such as "Primary Accent" and "Secondary Color") from user-facing copy.
  - Eliminated duplicate action triggers, consolidating verification calls into the primary Welcome Developer banner.
  - Integrated lightweight, SSR-safe Lottie micro-animations for the welcome card, security shield, and status responses.
- **Flicker-Free Instant Navigation**: Prompted to optimize the session termination lifecycle, eliminating full-page reloads and spinner flashes by performing instantaneous router redirection (`router.replace('/')`) paired with immediate client-state resetting.

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
