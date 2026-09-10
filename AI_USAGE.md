# AI Usage Log

## Tools Used

- **Antigravity (Google DeepMind)**: Primary agentic execution environment utilized for hands-on codebase scaffolding, terminal command execution, dependency resolution, atomic git operations, and live local verification of services.
- **Claude (Anthropic)**: Utilized for high-level architectural planning, iterative prompt refinement, decomposing the multi-day roadmap into strictly bounded daily deliverables, and defining granular acceptance criteria.
- **ChatGPT (OpenAI)**: Leveraged for conceptual ideation, reviewing full-stack monorepo patterns, comparing NestJS module topologies, and validating Mongoose connection lifecycle strategies.

---

## How I Prompted

- **Strict Boundary Scoping**: Designed prompt contracts that explicitly restricted the AI from jumping ahead into Days 2–7 product logic (e.g., authentication, posts, reactions, comments). Day 1 was strictly scoped to infrastructure scaffolding, Mongoose connection validation, and health diagnostics.
- **Contract-First Commit Discipline**: Enforced a granular, milestone-based commit protocol rather than end-of-day bulk commits. Each checklist item was mandated to have its own conventional commit (`chore:`, `feat:`, `docs:`) accompanied by explicit command-line verification (compilation, daemon boot, HTTP responses).
- **Dual-Branch Pipeline Orchestration**: Instructed the agent to follow a continuous parity model across `beta` and `main` branches, requiring validation and push to `beta` first before fast-forwarding into `main`.
- **Iterative Feedback Loops**: Steered implementation through progressive review phases—starting with plan approval in `implementation_plan.md`, validating runtime logs, and directing follow-up enhancements (such as Swagger documentation integration).

---

## What I Reviewed or Rejected

- **Rejected Temporary / Ad-Hoc Frontend API Checking**: Intervened when assessing how frontend health checks should be structured. Rather than allowing a quick, throwaway component-level fetch, insisted on establishing an extensible, typed `lib/api.ts` abstraction that will serve as the persistent foundation for all API interactions across Days 2–7.
- **Enforced Early Monorepo Hygiene**: Reviewed and prioritized `.gitignore` rules at Step 0 before executing any scaffolding scripts to prevent `node_modules`, build artifacts (`dist/`, `.next/`), or `.env` credential files from ever being staged or tracked.
- **Rejected Premature Feature Bloat**: Actively audited generated code to ensure zero premature domain schemas, dummy models, or unrequested utility code crept into the Day 1 baseline.
- **Verified Secrets Isolation**: Verified that the MongoDB Atlas connection URI was strictly confined to a gitignored local `backend/.env` file, ensuring only sanitized `.env.example` templates were staged for version control.

---

## Bugs Caught & Critical Interventions

- **Omission of Swagger / OpenAPI Documentation**: Upon reviewing the initial backend scaffold and health controller, noticed that OpenAPI documentation had not been included in the default setup. Directed the agent to install `@nestjs/swagger`, create dedicated DTO schemas (`HealthResponseDto`, `HealthDataDto`), and expose interactive documentation at `/docs`.
- **Node.js ESM / CommonJS Type Import Conflicts**: Caught a TypeScript runtime `SyntaxError` during backend initialization caused by attempting to import `Connection` as a named value from CommonJS `mongoose` under Node.js ESM. Directed the resolution to enforce explicit `import type { Connection }`, allowing TypeScript to cleanly elide the type during transpilation.
- **Windows PowerShell Script Execution Blocking**: Identified and mitigated PowerShell script execution restrictions (`npm.ps1` blocking) by enforcing `npm.cmd` execution and resolving Arborist peer-dependency resolution failures using `--legacy-peer-deps`.
- **Live Database State Dynamic Verification**: Verified that `GET /health` did not return a static, hardcoded payload, but instead dynamically queried `connection.readyState === 1` against the live MongoDB Atlas cluster.
