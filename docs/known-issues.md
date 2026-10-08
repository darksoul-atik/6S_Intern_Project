# DevPulse Known Limitations & Engineering Roadmap

This document provides a transparent, un-sanitized log of current architectural constraints, environment-specific edge cases, and prioritized technical debt identified during Day 20 smoke testing.

---

## 1. Environment & Runtime Limitations

### 1.1. Dual Database Contexts (Docker Compose vs. Local Development)
* **Description**: Running the stack via `docker compose up` connects the backend to the containerized MongoDB replica set (`mongodb://mongo:27017/devpulse?replicaSet=rs0`). In contrast, running the backend on the host machine (`npm run start:dev`) reads `backend/.env`, which points to a remote MongoDB Atlas cluster.
* **Impact**: Data created while using Docker Compose (users, posts, reactions) does not exist when starting the app locally outside Docker, and vice versa.
* **Mitigation**: Ensure developers know which context they are targeting. To point Docker Compose to MongoDB Atlas, update `MONGODB_URI` in `docker-compose.yml` to the Atlas connection string.

### 1.2. Next.js Standalone Docker Image Rebuild Requirement
* **Description**: The frontend production Dockerfile compiles the Next.js app using `output: "standalone"`.
* **Impact**: Unlike development mode where hot module replacement is active, any code change made to `frontend/src` requires executing `docker compose up --build frontend` to recompile the standalone bundle.
* **Mitigation**: Use `npm run dev` in `frontend/` for day-to-day UI feature work and Docker Compose for production smoke testing and deployment verification.

### 1.3. Windows MongoMemoryServer Startup Latency
* **Description**: When running backend Vitest integration tests (`post-search.integration.spec.ts`, `post-summarization.integration.spec.ts`), Vitest boots an in-memory MongoDB instance via `mongodb-memory-server`. On Windows environments with real-time antivirus scanning, downloading and spawning the binary can exceed the default 10,000ms hook timeout.
* **Impact**: Integration test suites may fail or skip with `GenericMMSError: Instance failed to start within 10000ms`, even though unit tests (200/200) and live database calls pass 100%.
* **Mitigation**: Increase hook timeouts to 30,000ms in integration spec setups or run integration suites against the local Docker replica set.

### 1.4. Frontend Vitest Worker Pool on Windows
* **Description**: Vitest 4 defaults to a `forks` worker pool. On Windows, child process forks can hang waiting for IPC response (`[vitest-pool]: Failed to start forks worker... Timeout waiting for worker to respond`).
* **Impact**: Running `npm run test` directly in `frontend/` triggers a timeout error.
* **Mitigation**: Execute frontend tests using the threads pool:
  ```bash
  npx vitest run --pool=threads
  ```
  With this flag, all 62 tests across 7 test suites pass cleanly.

### 1.5. Docker Admin Account Bootstrap
* **Description**: The backend Docker container entrypoint is `node dist/main.js`. It does not automatically run the `npm run seed:admin` script during startup.
* **Impact**: A completely fresh Docker stack will have no default administrator account until seeded.
* **Mitigation**: After running a fresh `docker compose up -d`, seed the administrator inside the container:
  ```bash
  docker compose exec backend npm run seed:admin
  ```

### 1.6. Throttler Rate Limiting during Automated Regressions
* **Description**: NestJS Throttler guards authentication endpoints with sliding windows (5 signups per 15 min, 10 logins per 15 min).
* **Impact**: Running automated test scripts in rapid succession from the same local IP address triggers `429 Too Many Requests`.
* **Mitigation**: Automated regression runners must account for rate-limit cooldown windows or configure `THROTTLE_TTL` overrides in test environments.

### 1.7. At-Least-Once Email Delivery & Worker Crash Window
* **Description**: The email queue processing pipeline adheres to standard distributed systems **at-least-once** delivery semantics. The worker process performs idempotency checks against `User.welcomeEmailSentAt` prior to dispatching email via Nodemailer/SMTP, and records the timestamp immediately following successful transmission.
* **Impact**: If the worker process or host container crashes or suffers power failure during the microsecond window between SMTP relay acceptance and the completion of `UsersService.setWelcomeEmailSentAt()` in MongoDB, BullMQ's automatic retry policy will re-dispatch the job when the worker recovers, resulting in a duplicate welcome email delivered to the recipient.
* **Mitigation**: Accepted architectural trade-off. Duplicate welcome emails are benign compared to missing welcome emails. Strict pre-send idempotency guards and atomic database updates minimize the crash window to near zero.

### 1.8. Omission of Durable Transactional Outbox Sweep for Complete Redis Outages
* **Description**: To ensure that registration response times and availability are never compromised, `AuthService.signup` employs a non-blocking, resilient dispatch pattern: if Redis is unreachable or unresponsive during signup, the API logs an error and returns HTTP 201 Created without failing the registration.
* **Impact**: Users who register during a prolonged, catastrophic Redis cluster outage will not have their welcome email job stored in Redis. Because the system currently omits a secondary transactional MongoDB outbox collection with a periodic poll-and-sweep recovery worker, those specific users will not receive a welcome email unless triggered via an administrative resend tool.
* **Mitigation**: Accepted trade-off prioritizing signup availability over email non-loss during total infrastructure degradation. In high-availability environments, Redis Sentinel or Redis Cluster guarantees high uptime, and a durable MongoDB Transactional Outbox pattern can be introduced in future iterations.

---

## 2. Prioritized Roadmap & Future Improvements

1. **Redis Caching for Feed Aggregations**:
   * *Current*: The `top` feed computes engagement rank scores via MongoDB aggregation queries.
   * *Improvement*: Introduce a Redis sorted set (`ZADD devpulse:feed:top <score> <postId>`) for $O(\log N)$ feed reads under heavy traffic.
2. **WebSocket Live Notification Gateway**:
   * *Current*: Comment additions and mentions are fetched on page load or mutation invalidation.
   * *Improvement*: Implement `@nestjs/websockets` with Socket.io to push real-time toast notifications when a user is tagged in a reply.
3. **Direct-to-S3 Pre-Signed Avatar Uploads**:
   * *Current*: Avatars are compressed via client-side canvas and served directly through backend endpoints.
   * *Improvement*: Generate pre-signed S3/Cloudflare R2 URLs for direct client uploads with CDN edge caching.
4. **Next.js 16 Proxy Migration Codemod**:
   * *Current*: Next.js 16 emits a deprecation notice recommending migrating `middleware.ts` to `proxy.ts`.
   * *Improvement*: Run `npx @next/codemod@canary middleware-to-proxy .` to adopt the canary proxy convention.
