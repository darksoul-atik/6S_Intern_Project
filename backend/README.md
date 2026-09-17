<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## 🛡️ Admin Bootstrap Strategy

### Chosen Approach: CLI Seed Script (`npm run seed:admin`)

Self-service admin registration via public APIs is strictly disabled to prevent unauthorized privilege escalation. To provision the initial administrator, DevPulse utilizes a dedicated, idempotent CLI seed script (`src/scripts/seed-admin.ts`).

#### Why a CLI Seed Script instead of an HTTP Bootstrap Endpoint?
1. **Zero Attack Surface**: A public HTTP endpoint (even if protected by a shared secret or header) is exposed to network scans, brute-force attacks, and credential leaks. A CLI script runs entirely out-of-band in a trusted execution environment (terminal, container init, or CI/CD deployment pipeline).
2. **Strict Principle of Least Privilege**: Creating high-privilege administrative accounts is an operational concern, not an application-layer user action.
3. **Idempotence & Safety**: The script inspects the database: if the specified `ADMIN_EMAIL` already exists with role `admin`, it reports status without altering credentials; if the user exists under role `user`, it safely promotes them; if no user exists, it hashes `ADMIN_PASSWORD` via `bcrypt` (10 rounds) and creates the user with `role: 'admin'`.

#### Usage:
1. Configure administrative credentials in `backend/.env` (or override via environment variables):
   ```env
   ADMIN_NAME="DevPulse Administrator"
   ADMIN_EMAIL="admin@devpulse.io"
   ADMIN_PASSWORD="YourSecurePasswordHere"
   ```
2. Execute the seed command:
   ```bash
   npm run seed:admin
   ```

## 🌐 Developer Profile Visibility & Security Architecture

### Architectural Decision: Public Viewing (`GET /users/:id`), Authenticated & Authorized Mutations

In DevPulse, developer profiles are designed around **open discovery** coupled with **strict authorization boundaries**:

#### 1. Why `GET /users/:id` is Public (Unauthenticated):
- **Peer & Talent Discovery**: DevPulse is an engineering community platform. Requiring authentication just to view a developer's skills, bio, and portfolio projects introduces unnecessary friction for peer networking, recruiters, and prospective collaborators.
- **Search & Shareability**: Developers can share direct links to their DevPulse profile on GitHub, resumes, or social profiles without forcing recipients to create an account first.
- **Data Protection Guarantee**: Sensitive fields such as `passwordHash`, `email`, `role`, `isDeleted`, and `deletedAt` are explicitly excluded via Mongoose projection (`.select('name headline bio avatarUrl skills experiences portfolioProjects')`). Only public-facing developer attributes are exposed.

#### 2. Strict Ownership & Admin Authorization on Mutations:
- **No Anonymous Edits**: All write operations require a valid JWT Bearer token (`JwtAuthGuard`).
- **Dedicated Self-Service Controller (`/profile/*`)**: Authenticated developers manage their own profile and portfolio projects via `/profile/me` and `/profile/me/projects` without needing to specify their own user ID in path parameters.
- **Parameterized Resource Ownership (`/users/:id/projects/...`)**: Standard users can only update their own resources. If a non-admin attempts to mutate another developer's profile or projects, the system rejects the request immediately with `403 Forbidden` (`You are not authorized to modify another user's profile`) enforced by `ProfileOwnerOrAdminGuard`.
- **Administrative Override**: Users with role `admin` bypass ownership checks to moderate spam, inappropriate content, or compliance issues across any account.

---

## 📊 Developer Profile Schema & Data Models

### 1. User Profile Attributes
* **`headline`** (optional): Trimmed string, maximum 160 characters. Represents professional title or engineering tagline.
* **`bio`** (optional): Trimmed string, maximum 2000 characters. Detailed developer summary and background.
* **`avatarUrl`** (optional): Flexible profile image string. Supports standard `http://` / `https://` URLs, Base64 image data URIs (`data:image/jpeg;base64,...`), and empty string `""` to unset/clear the avatar photo.
* **`skills`**: Array of trimmed, case-deduplicated strings.
* **`experiences`**: Array of embedded work experience subdocuments (`title`, `company`, `from`, `to`, `description`).
* **`portfolioProjects`**: Array of embedded portfolio project subdocuments.

### 2. Embedded Portfolio Project Subdocument (`PortfolioProjectSchema`)
* **`_id`**: MongoDB ObjectId generated automatically for each embedded subdocument.
* **`title`**: Required, non-empty trimmed string (max 100 characters).
* **`description`**: Required, non-empty trimmed string (max 1000 characters).
* **`urls`**: Array of valid HTTP/HTTPS URLs (maximum 5 links, deduplicated case-insensitively).
* **`technologies`**: Array of non-empty strings (minimum 1, maximum 20 items, deduplicated case-insensitively).
* **`startDate`**: Required string in `YYYY-MM` ISO month format (regex `/^\d{4}-(0[1-9]|1[0-2])$/`).
* **`endDate`**: Optional string in `YYYY-MM` ISO month format.
* **`isCurrent`**: Required boolean flag indicating ongoing/active projects.
* **`createdAt` / `updatedAt`**: Automatic timestamps managed by Mongoose.

---

## ⚖️ Validation & Business Rules

### 1. Custom Date Constraint (`ValidPortfolioProjectEndDate`)
Portfolio project date validity enforces strict business invariants via a custom Class-Validator constraint:
- **Ongoing Projects (`isCurrent: true`)**: `endDate` must **not** be provided. Supplying an `endDate` while `isCurrent` is true returns `400 Bad Request` (`"endDate must not be provided when isCurrent is true"`).
- **Completed Projects (`isCurrent: false`)**: `endDate` is strictly **required** in valid `YYYY-MM` format. Omitting it returns `400 Bad Request` (`"endDate is required when isCurrent is false"`).
- **Chronological Ordering**: `endDate` must be the same month as or later than `startDate` (`endDate >= startDate`). Reversing dates returns `400 Bad Request` (`"endDate must be the same as or later than startDate"`).

### 2. Partial Project Updates (`UpdatePortfolioProjectDto`)
When updating projects via `PATCH /profile/me/projects/:projectId` or `PATCH /users/:id/projects/:projectId`:
- State transition evaluation calculates the combined next state (merging DTO values with existing project values).
- Switching `isCurrent` from `false` to `true` automatically unsets `endDate`.
- Switching `isCurrent` from `true` to `false` requires a valid `endDate >= startDate`.

---

## 📡 Complete Profile Endpoints Contract

### Dedicated Self-Service Profile Endpoints (`/profile/*`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/profile/me` | Bearer JWT | Retrieve authenticated developer profile (including private fields) |
| `PATCH` | `/profile/me` | Bearer JWT | Update basic profile (`name`, `headline`, `bio`, `avatarUrl`) |
| `POST` | `/profile/me/projects` | Bearer JWT | Add a new portfolio project to authenticated user |
| `PATCH` | `/profile/me/projects/:projectId` | Bearer JWT | Partially update a portfolio project by subdocument ID |
| `DELETE`| `/profile/me/projects/:projectId` | Bearer JWT | Remove a portfolio project by subdocument ID |

### Public & Parameterized User Endpoints (`/users/:id/*`)

| Method | Endpoint | Auth Required | Role / Permissions | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/users/:id` | No | Public | Fetch sanitized developer profile (name, headline, bio, avatarUrl, skills, experiences, portfolioProjects) |
| `GET` | `/users/me` | Yes (JWT) | Authenticated User | Fetch currently logged-in user profile |
| `PATCH` | `/users/me` | Yes (JWT) | Authenticated User | Update basic profile (name, headline, bio, avatarUrl) |
| `POST` | `/users/me/skills` | Yes (JWT) | Authenticated User | Add a skill (case-trimmed, deduplicated) |
| `DELETE` | `/users/me/skills/:skill` | Yes (JWT) | Authenticated User | Remove a skill |
| `PUT` | `/users/me/skills` | Yes (JWT) | Authenticated User | Replace entire skills list |
| `POST` | `/users/me/experiences` | Yes (JWT) | Authenticated User | Add work experience subdocument |
| `PATCH` | `/users/me/experiences/:expId`| Yes (JWT) | Authenticated User | Update work experience by subdocument ID |
| `DELETE` | `/users/me/experiences/:expId`| Yes (JWT) | Authenticated User | Delete work experience by subdocument ID |
| `POST` | `/users/:id/projects` | Yes (JWT) | Owner or Admin | Add portfolio project to target user ID (`403` if unauthorized) |
| `PATCH` | `/users/:id/projects/:projectId` | Yes (JWT) | Owner or Admin | Update portfolio project on target user ID (`403` if unauthorized) |
| `DELETE`| `/users/:id/projects/:projectId` | Yes (JWT) | Owner or Admin | Delete portfolio project on target user ID (`403` if unauthorized) |
| `PATCH` | `/users/:id` | Yes (JWT) | Owner or Admin | Update profile for target user ID (`403` if unauthorized) |
| `POST` | `/users/:id/skills` | Yes (JWT) | Owner or Admin | Add skill to target user ID (`403` if unauthorized) |
| `DELETE` | `/users/:id/skills/:skill` | Yes (JWT) | Owner or Admin | Remove skill from target user ID (`403` if unauthorized) |
| `PUT` | `/users/:id/skills` | Yes (JWT) | Owner or Admin | Overwrite skills for target user ID (`403` if unauthorized) |
| `POST` | `/users/:id/experiences` | Yes (JWT) | Owner or Admin | Add experience to target user ID (`403` if unauthorized) |
| `PATCH` | `/users/:id/experiences/:expId`| Yes (JWT) | Owner or Admin | Update experience on target user ID (`403` if unauthorized) |
| `DELETE` | `/users/:id/experiences/:expId`| Yes (JWT) | Owner or Admin | Delete experience on target user ID (`403` if unauthorized) |

---

## 🧪 Testing Profile Endpoints (cURL / Hoppscotch)

```bash
# 1. Fetch Authenticated Developer Profile
curl -X GET http://localhost:5000/profile/me \
  -H "Authorization: Bearer <JWT_TOKEN>"

# 2. Update Headline, Bio, and Avatar
curl -X PATCH http://localhost:5000/profile/me \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "headline": "Lead Full-Stack & Distributed Systems Architect",
    "bio": "Building high-performance web platforms and developer tools.",
    "avatarUrl": "https://images.unsplash.com/photo-1534528741775-53994a69daeb"
  }'

# 3. Add an Ongoing Portfolio Project (isCurrent: true, no endDate)
curl -X POST http://localhost:5000/profile/me/projects \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "DevPulse Community Hub",
    "description": "Collaborative developer networking and portfolio platform.",
    "urls": ["https://github.com/example/devpulse"],
    "technologies": ["NestJS", "TypeScript", "MongoDB", "React"],
    "startDate": "2024-01",
    "isCurrent": true
  }'

# 4. Partially Update Portfolio Project by Subdocument ID
curl -X PATCH http://localhost:5000/profile/me/projects/<PROJECT_ID> \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "isCurrent": false,
    "endDate": "2024-06"
  }'

# 5. Delete Portfolio Project
curl -X DELETE http://localhost:5000/profile/me/projects/<PROJECT_ID> \
  -H "Authorization: Bearer <JWT_TOKEN>"

# 6. Fetch Sanitized Public Profile
curl -X GET http://localhost:5000/users/<USER_ID>
```


## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Observability

In production applications, observability is essential for understanding how your system behaves, detecting issues early, and maintaining reliable performance.

[NestJS Observe](https://observe.nestjs.com) automatically instruments your NestJS application, giving you deep visibility into your system with minimal setup:

- **Distributed tracing:** Follow requests across services and understand how they flow through your system.
- **Waterfall analysis:** Visualize request execution and identify slow operations, bottlenecks, and unexpected delays.
- **Performance analysis:** Analyze application performance in real time and quickly pinpoint areas that need optimization.
- **Metrics:** Track key application and infrastructure metrics to understand system health and performance trends.
- **Logging:** Centralize and correlate logs with traces and other telemetry to make debugging easier.
- **Error tracking:** Detect errors quickly and investigate their root causes with the surrounding context.
- **SLA monitoring:** Track service-level objectives and identify when your application is approaching or exceeding defined thresholds.
- **Alarms and alerts:** Set up alerts for critical errors, performance degradation, SLA violations, and other anomalies so your team can react quickly.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Auto-instrument your application with [NestJS Observer](https://observer.nestjs.com). Distributed tracing, metrics, and logging made easy. Error tracking and performance monitoring for your NestJS applications.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
