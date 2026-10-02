# ⚡ DevPulse Backend API

> Robust, scalable enterprise REST backend built with **NestJS**, **MongoDB / Mongoose**, **Passport JWT**, and **OpenAPI/Swagger**.

---

## 🏛️ System Architecture Overview (As of Day 16)

The DevPulse backend is engineered as a modular, domain-driven NestJS service adhering to enterprise security standards, strict data encapsulation, and predictable REST conventions:

```
                  ┌─────────────────────────────────────────┐
                  │        Incoming HTTP Request            │
                  └────────────────────┬────────────────────┘
                                       │
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │    Global ValidationPipe (whitelist)    │
                  └────────────────────┬────────────────────┘
                                       │
                         ┌─────────────┴─────────────┐
                         ▼                           ▼
            ┌─────────────────────────┐ ┌─────────────────────────┐
            │      JwtAuthGuard       │ │       RolesGuard        │
            │   (Bearer Token Check)  │ │   (@Roles('admin') RBAC)│
            └────────────┬────────────┘ └────────────┬────────────┘
                         │                           │
                         └─────────────┬─────────────┘
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │ Controller -> Service -> Mongoose Model │
                  └────────────────────┬────────────────────┘
                                       │
                         ┌─────────────┴─────────────┐
                         ▼                           ▼
            ┌─────────────────────────┐ ┌─────────────────────────┐
            │   TransformInterceptor  │ │   HttpExceptionFilter   │
            │  { success: true, data }│ │  { success:false,errors}│
            └─────────────────────────┘ └─────────────────────────┘
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: `v18.x` or `v20.x`
- **MongoDB**: Running instance (MongoDB Atlas connection string or local `mongodb://localhost:27017/devpulse`)

### 2. Environment Configuration
Create a `.env` file in `backend/` following `.env.example`:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/dev_community
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
ADMIN_NAME="DevPulse Administrator"
ADMIN_EMAIL="admin@devpulse.io"
ADMIN_PASSWORD="Admin@SecurePass2026"
```

### 3. Install & Run
```bash
# Install dependencies
npm install

# Run database admin seed script (idempotent)
npm run seed:admin

# Start development server (watch mode)
npm run start:dev

# Run automated Vitest test suite (200 unit & integration tests across 27 suites)
npm run test
```

Interactive OpenAPI Swagger documentation is available at:  
👉 **`http://localhost:5000/docs`**

---

## 📦 Domain Modules

### 1. `AuthModule` (`/auth`)
- **`POST /auth/signup`**: Validated user registration with `bcrypt` password hashing (10 salt rounds).
- **`POST /auth/login`**: Credential verification issuing signed JWT tokens (`sub`, `email`, `role`, `name`).
- **`GET /auth/me`**: Current authenticated user identity verified via `JwtAuthGuard`.
- **`GET /auth/admin-check`**: Restricted route guarded by `@Roles('admin')` and `RolesGuard`.

### 2. `UsersModule` & `ProfileModule` (`/users`, `/profile`)
- **Public Profile Discovery (`GET /users/:id`)**: Peer developer profile viewing with sensitive fields (`passwordHash`, `email`, `role`, `isDeleted`) strictly projected out.
- **Self-Service Developer Profile (`GET /profile/me`, `PATCH /users/me`)**: Headline, bio, and social links editing.
- **Skills Management (`POST /users/me/skills`, `DELETE /users/me/skills/:skill`)**: Deduplicated skill tags.
- **Work Experiences (`POST /users/me/experiences`, `PATCH /experiences/:id`, `DELETE /experiences/:id`)**: Chronological employment history with conditional `isCurrent` / `to` date validation.
- **Portfolio Projects (`POST /profile/me/projects`, `PATCH /projects/:id`, `DELETE /projects/:id`)**: Showcase projects with title, description, tags, demo URL, and repo URL.
- **Avatar Media (`POST /users/:id/avatar`, `GET /users/:id/avatar`, `DELETE /users/:id/avatar`)**: Binary image upload and streaming with `ProfileOwnerOrAdminGuard`.

### 3. `PostsModule` (`/posts`) — *Day 7, 8, 15 & 16 Deliverables*
- **`POST /posts`**: Create engineering posts. Author is derived strictly from verified JWT claims (`@CurrentUser()`). Automatically increments author's `postsCount`.
- **`GET /posts?page=1&limit=10&sort=latest|top|most-discussed`**: High-performance paginated feed with multi-sort options. Returns metadata (`total`, `page`, `limit`, `totalPages`) supporting infinite scroll.
- **`GET /posts/search?q=query&page=1&limit=10`**: High-performance full-text search engine. Queries MongoDB `$text` index with weighted fields (`title: 5, body: 1`), orders primarily by relevance (`$meta: 'textScore'`) with tie-breakers (`createdAt: -1, _id: -1`), and filters soft-deleted posts.
- **`GET /posts/:id`**: Single post lookup with pre-validation of 24-character hexadecimal ObjectId to eliminate Mongoose CastError 500s.
- **`POST /posts/:id/summarize`**: Generates on-demand AI summary and technical tags for active posts. Guarded by `JwtAuthGuard`. Computed dynamically and not persisted in MongoDB.
- **`PATCH /posts/:id`**: Update title and body, strictly guarded by `PostOwnerOrAdminGuard`.
- **`DELETE /posts/:id`**: Soft-delete lifecycle initiation. Sets `deletedAt = now` and `deletedBy = user`, decrements author's `postsCount`, and starts the 5-day recovery window.
- **`POST /posts/:id/restore`**: Restores soft-deleted posts within 5 days, resetting `deletedAt` and incrementing author's `postsCount`.
- **`DELETE /posts/:id/permanent`**: Irreversible hard delete from database, restricted strictly to administrators.
- **Automated Background Purge (`PostCleanupTask`)**: Automated hourly cron (`@Cron(CronExpression.EVERY_HOUR)`) that permanently deletes posts soft-deleted older than 5 days.

### 4. `CommentsModule` (`/posts/:postId/comments`, `/comments/:id`) — *Day 9 Deliverables*
- **`GET /posts/:postId/comments`**: Public endpoint returning hierarchical comments and nested replies sorted chronologically (`createdAt: 1, _id: 1`). Author is populated with public fields (`name`, `headline`, `avatarUrl`).
- **`POST /posts/:postId/comments`**: Authenticated creation of top-level comments (`parentCommentId: null`). Atomically increments parent `Post.commentCount` and author `User.commentsCount` by 1.
- **`POST /posts/:postId/comments/:commentId/replies`**: Authenticated creation of replies linked to `parentCommentId`. Enforces that the parent comment belongs to the specified post and enforces a strict maximum reply depth of 1 (replies cannot have child replies).
- **`DELETE /comments/:id`**: Guarded by `CommentOwnerOrAdminGuard`. Deleting a reply deletes only that single reply (decrementing counters by 1). Deleting a root comment executes a cascade deletion of the entire thread (`root + replies`), decrementing `Post.commentCount` by `deletedCount` and author counts accurately.

### 5. `ReactionsModule` (`/reactions`) — *Day 11 Deliverables*
- **`POST /reactions`**: Authenticated endpoint to toggle a reaction on a target (`targetType: 'post' | 'comment'`, `targetId`, `reactionType: 'like' | 'dislike'`).
  - **First reaction**: Creates new reaction document and atomically increments `[reactionType]: +1`.
  - **Toggle off**: If the same reaction is clicked again, removes the reaction document and atomically decrements `[reactionType]: -1`.
  - **Switch reaction**: If the opposite reaction is clicked (e.g. like -> dislike), updates the reaction document and atomically applies `{ [oldReaction]: -1, [newReaction]: +1 }`.
  - **Concurrency Safety**: Enforced via MongoDB compound unique index `{ userId: 1, targetType: 1, targetId: 1 }` preventing race condition duplicates and atomic `$inc` operators preventing counter drift.
- **`GET /reactions/mine`**: Authenticated endpoint retrieving current user reactions mapped by target ID, with optional `targetType` filter (`post` or `comment`) and comma-separated `targetIds` filter.
- **`GET /reactions`**: Public paginated endpoint retrieving the list of users who reacted to a post or comment (`targetType`, `targetId`, optional `type` filter: `like` or `dislike`, `page`, `limit`). Populates reactor profiles (`name`, `headline`, `avatarUrl`) and returns pagination metadata (`total`, `page`, `limit`, `totalPages`).

---

### 6. Comments Hierarchy & Flattened Replies
- **`POST /posts/:postId/comments/:commentId/replies`**: Replying to a top-level comment stores a reply linked to that comment. Replying to an existing reply flattens into a sibling under the same root comment (`parentCommentId = rootId`) with `mentionedUserId` pointing to the author being addressed, maintaining a clean 2-level hierarchy.

---

### 7. Ranked, Latest & Most-Discussed Feeds (Day 13)
- **`GET /posts?sort=latest`**: Default chronological feed sorted by `{ createdAt: -1, _id: -1 }`.
- **`GET /posts?sort=top`**: Deterministic ranked feed computing `rankScore` via aggregation pipeline:
  $$\text{rankScore} = (\text{likes} - \text{dislikes}) + (\text{commentCount} \times \text{COMMENT\_WEIGHT})$$
  with `COMMENT_WEIGHT = 2`. Secondary tie-breaker sorts by `{ rankScore: -1, createdAt: -1, _id: -1 }` guaranteeing zero item shifting or page order drift.
- **`GET /posts?sort=most-discussed`**: Discussion-first feed sorted strictly by comment engagement:
  $$\{ \text{commentCount}: -1, \text{createdAt}: -1, \text{_id}: -1 \}$$
  Supported by dedicated compound index `{ commentCount: -1, createdAt: -1, _id: -1 }` for high-throughput execution without in-memory sort limits.
- **Validation & OpenAPI**: Query parameter validation via `GetPostsQueryDto` (`@IsIn(['top', 'latest', 'most-discussed'])`, `@Min(1)`, `@Max(100)`).
- **Query Plan Verification Script**: `npm run check:plans` executes MongoDB `explain("executionStats")` across all three feed sorting modes, confirming index utilization (`IXSCAN`).
- **Controlled Seed Fixtures & Safety Isolation**: `npm run seed:ranking`, `npm run verify:seed`, and `npm run cleanup:ranking` guarded by strict database name checking (`devpulse_day13_seed`).

---

### 8. Full-Text Search Engine & Debounced Pipeline (Day 15)
- **Compound Text Index**: Mongoose schema index `{ title: 'text', body: 'text' }` with weights `{ title: 5, body: 1 }`.
- **Relevance Scoring & Sorting**: Queries `$text: { $search: q }`, project `{ score: { $meta: 'textScore' } }`, and sorts by `{ score: { $meta: 'textScore' }, createdAt: -1, _id: -1 }`.
- **Validation & Trimming**: `SearchPostsQueryDto` applies `@Transform` whitespace trimming, minimum length 1, maximum length 100, and pagination clamping.
- **Author Projection & Soft-Delete Filtering**: Populates lean author attributes (`name`, `headline`, `avatarUrl`) and excludes soft-deleted posts (`deletedAt: null`).

---

### 9. AI-Assisted Post Summarizer (Day 16)
- **`POST /posts/:id/summarize`**: Authenticated endpoint (`JwtAuthGuard`) generating on-demand AI summaries and technical tags for active posts. Result is computed dynamically and is **not persisted** to MongoDB.
- **Provider Architecture**: Abstracted via `SUMMARIZER_PROVIDER` interface with dynamic factory switching:
  - **`GroqSummarizerProvider`**: Activated when `GROQ_API_KEY` is present. Uses `groq-sdk` with `openai/gpt-oss-20b` (or configured `GROQ_MODEL`) in JSON mode (`response_format: { type: 'json_object' }`).
  - **`MockSummarizerProvider`**: Activated when `GROQ_API_KEY` is absent. Uses a deterministic 2-sentence heuristic extractor and keyword scanner across 12 tech domains.
- **Error Mapping & Resilience**:
  - `429 Too Many Requests`: Triggered on provider rate limits (`SummarizerRateLimitError`).
  - `502 Bad Gateway`: Triggered if the provider returns invalid JSON or fails the runtime result schema validator (`SummarizerMalformedOutputError`).
  - `503 Service Unavailable`: Triggered if upstream provider is down, network fails, or summarizer module is unmounted (`SummarizerUnavailableError`).
  - `504 Gateway Timeout`: Triggered if provider processing exceeds 8 seconds (`SUMMARIZER_TIMEOUT_MS = 8_000`).

#### 📐 Documented Boundary Behavior for Very Short & Very Long Posts
The summarizer explicitly handles boundary conditions for extreme post lengths:
1. **Very Short Posts** (e.g. 1 short sentence, minimal words, or empty body):
   - **Groq Provider**: Prompted with a zero-temperature strict anti-hallucination constraint (`"Do not invent technologies or facts that are not present in the post."` and `"Return at most 5 tags."`). Short posts produce a concise 1-sentence summary matching the provided context and empty tags (`tags: []`) if no technologies are referenced.
   - **Mock Provider**: Extracts the first 1–2 available sentences directly without error. If the body is empty or whitespace only, returns the standard fallback: `"No post content available to summarize."` with empty tags.
   - **Runtime Schema Validator**: Accepts valid non-empty summaries and empty tag arrays (`tags: []`) without schema rejection.
2. **Very Long Posts** (e.g. posts up to the schema maximum of 20,000 characters):
   - **Input Truncation Guard**: `GroqSummarizerProvider` safely truncates `input.body` to the first 12,000 characters (`MAX_BODY_LENGTH = 12_000`) before constructing the prompt. This prevents token context window overflow, LLM context crashes, and rate-limit spikes.
   - **Output Length Ceiling**: The runtime validator (`isSummarizerResult`) strictly enforces `MAX_SUMMARY_LENGTH = 1,000` characters and `MAX_TAGS = 10` (with max 50 chars per tag).
   - **Mock Provider Summary Cap**: Bounds the heuristic lead summary to at most 280 characters (`MAX_SUMMARY_LENGTH = 280`), slicing cleanly at 279 characters and appending an ellipsis (`…`).
   - **Timeout Ceiling**: An 8-second hard timeout (`SUMMARIZER_TIMEOUT_MS = 8_000`) prevents long-context LLM calls from hanging client connections indefinitely.

---

## 🔄 Working Flow as of Day 16

### 1. Threaded Comments & Replies Lifecycle

```
1. Client POST /posts/:postId/comments with { body } + Bearer Token
                 │
                 ▼
2. JwtAuthGuard authenticates JWT -> extracts { userId, role }
                 │
                 ▼
3. CommentsService:
   ├── Verifies active post exists via PostsService.findActivePostByIdOrThrow(postId)
   ├── Creates Comment document with parentCommentId: null
   ├── Atomically increments Post.commentCount by +1
   └── Atomically increments User.commentsCount by +1
                 │
                 ▼
4. Replying: POST /posts/:postId/comments/:commentId/replies with { body }
   ├── Verifies parent exists and belongs to :postId
   ├── Enforces max reply depth: rejects if parent.parentCommentId is already set
   └── Creates reply with parentCommentId: parent._id & increments counters
                 │
                 ▼
5. Retrieval: GET /posts/:postId/comments
   ├── Executes single query sorted by { createdAt: 1, _id: 1 }
   ├── Populates author with safe fields (name, headline, avatarUrl)
   └── Assembles nested tree hierarchy in memory in O(N) time (roots with replies: [])
                 │
                 ▼
6. Deletion: DELETE /comments/:id
   ├── CommentOwnerOrAdminGuard enforces authorship or admin role
   ├── Wrapped in MongoDB ClientSession transaction (runInTransaction) with resilient fallback
   ├── Reply: deletes 1 document, decrements counters by -1
   └── Root Comment: cascade-deletes root + all replies, decrements counters by -deletedCount
```

### 2. Post Creation to Feed Delivery Flow

```
1. Client POST /posts with Bearer Token & { title, body }
                 │
                 ▼
2. JwtAuthGuard authenticates JWT -> extracts { userId, role }
                 │
                 ▼
3. PostsController passes userId and validated CreatePostDto to PostsService
                 │
                 ▼
4. PostsService:
   ├── Instantiates new Post document with authorId = userId
   ├── Initializes commentCount: 0, reactionCounts: { like: 0, dislike: 0 }
   ├── Saves document to MongoDB
   └── Atomically increments author's user.postsCount by 1
                 │
                 ▼
5. Post returned populated with LEAN_POST_DETAIL_AUTHOR_FIELDS (name, headline, avatarUrl)
                 │
                 ▼
6. Global TransformInterceptor wraps payload into standard envelope:
   {
     "success": true,
     "data": { "id": "...", "title": "...", "authorId": { ... }, ... }
   }
```

### 3. Feed Pagination & Multi-Sort Query Execution

```
1. Client GET /posts?page=2&limit=10&sort=top|latest|most-discussed
                 │
                 ▼
2. PostsService.findAllPosts branches by sort mode:
   ├── sort=latest:
   │   └── find({ deletedAt: { $exists: false } }).sort({ createdAt: -1, _id: -1 }) [IXSCAN]
   ├── sort=most-discussed:
   │   └── find({ deletedAt: { $exists: false } }).sort({ commentCount: -1, createdAt: -1, _id: -1 }) [IXSCAN]
   └── sort=top:
       └── aggregate([ { $match }, { $addFields: { rankScore } }, { $sort: { rankScore: -1, createdAt: -1, _id: -1 } }, ... ])
                 │
                 ▼
3. Pagination & Projection:
   ├── Lean Author Projection: authorId -> name, headline, avatarUrl
   ├── Pagination Window: .skip((page - 1) * limit).limit(limit)
   └── Total Count: countDocuments() or aggregation facet
                 │
                 ▼
4. Returns { posts, total, page, limit, totalPages }
```

### 4. Concurrency-Safe Reaction State Machine Flow

```
1. Client POST /reactions with { targetType, targetId, reactionType } + Bearer Token
                 │
                 ▼
2. JwtAuthGuard authenticates JWT -> extracts { userId }
                 │
                 ▼
3. ReactionsService.toggleReaction(userId, dto):
   ├── Verifies target entity exists and is active:
   │   ├── 'post': PostsService.findActivePostByIdOrThrow(targetId)
   │   └── 'comment': CommentsService.findCommentById(targetId)
   ├── Queries existing reaction via compound key { userId, targetType, targetId }
   │
   ├── Case A: No existing reaction
   │   ├── Insert new Reaction document
   │   └── Atomically $inc target.reactionCounts[reactionType] by +1
   │
   ├── Case B: Same reactionType clicked again (Toggle Off)
   │   ├── Delete existing Reaction document
   │   └── Atomically $inc target.reactionCounts[reactionType] by -1
   │
   └── Case C: Opposite reactionType clicked (Switch)
       ├── Update existing Reaction document to new reactionType
       └── Atomically $inc target.reactionCounts: { [oldType]: -1, [newType]: +1 }
                 │
                 ▼
4. Returns updated reactionCounts and active userReaction state ('like' | 'dislike' | null)
```

### 5. On-Demand AI Post Summarization Lifecycle (Day 16)

```
1. Client POST /posts/:id/summarize with Bearer Token (Any Authenticated User)
                 │
                 ▼
2. JwtAuthGuard authenticates JWT -> extracts { userId }
                 │
                 ▼
3. PostsController delegates to PostsService.summarizePost(id)
                 │
                 ▼
4. PostsService:
   ├── Verifies active post exists via findActivePostByIdOrThrow(postId)
   │   └── Soft-deleted or missing posts reject with 404 Not Found
   └── Passes only { title: post.title, body: post.body } to SummarizerService
                 │
                 ▼
5. SummarizerService:
   ├── Initiates 8,000ms race timeout (Promise.race)
   ├── Dispatches payload to active SUMMARIZER_PROVIDER:
   │   ├── Groq Provider (if GROQ_API_KEY set):
   │   │   ├── Truncates body to 12,000 chars (MAX_BODY_LENGTH)
   │   │   ├── Calls Groq API in JSON mode (openai/gpt-oss-20b)
   │   │   └── Catches 429 -> SummarizerRateLimitError
   │   └── Mock Provider (if GROQ_API_KEY absent):
   │       ├── Extracts lead sentences (bounded to 280 chars with '…')
   │       └── Scans keyword dictionary across 12 tech domains
   │
   ├── Validates output shape via isSummarizerResult guard:
   │   ├── summary: string (non-empty, max 1,000 chars)
   │   └── tags: string[] (max 10 tags, unique, max 50 chars each)
   │   └── Fails -> throws SummarizerMalformedOutputError (502 Bad Gateway)
   │
   └── Catches domain errors & maps to HTTP status:
       ├── SummarizerTimeoutError (>8s) -> 504 Gateway Timeout
       ├── SummarizerMalformedOutputError -> 502 Bad Gateway
       ├── SummarizerRateLimitError -> 429 Too Many Requests
       └── SummarizerUnavailableError -> 503 Service Unavailable
                 │
                 ▼
6. Returns on-demand summary result { summary: string, tags: string[] }
   (Result is NEVER persisted to MongoDB)
```

---

## 🧪 Automated Testing

DevPulse backend maintains a 100% pass rate across unit, integration, and guard test suites powered by **Vitest**:

```bash
# Run all 27 test suites (200 tests)
npx vitest run

# Run with watch mode
npx vitest

# Generate coverage report
npx vitest run --coverage
```

### Test Coverage Highlights:
- **`groq-summarizer.provider.spec.ts` (4 tests)**: Tests short posts, long post truncation at 12,000 characters, 429 rate limit error mapping, and 503 provider unavailability error handling.
- **`mock-summarizer.provider.spec.ts` (4 tests)**: Tests single-sentence short posts, empty body fallback message, long post 280-character bounding with ellipsis (`…`), and domain keyword tag extraction.
- **`summarizer.service.spec.ts` (5 tests)**: Tests valid results, malformed schema rejection with 502, 503 service unavailable, 429 rate limit, and 8-second timeout with 504.
- **`post-summarization.integration.spec.ts` (5 tests)**: In-memory MongoDB integration tests verifying active post summarization, 404 for missing post, 404 for invalid ObjectId, 404 for soft-deleted post, and error propagation.
- **`posts.controller.spec.ts` (3 tests)**: Summarization delegation, `JwtAuthGuard` protection verification, and controller error propagation.
- **`search-posts-query.dto.spec.ts` (9 tests)**: DTO transformation and validation tests covering query trimming, empty string rejection, max-length boundaries, and pagination clamping.
- **`post-search.integration.spec.ts` (6 tests)**: In-memory MongoDB replica set integration tests verifying weighted search relevance (`title = 5, body = 1`), relevance score sorting, secondary tie-breakers (`createdAt DESC, _id DESC`), soft-deleted post exclusion, pagination across search results, and empty result handling.
- **`post-ranking.util.spec.ts` (7 tests)**: Pure deterministic rank scoring calculations, likes/dislikes cancellation, negative score handling, comment weighting ($+2$), and zero engagement fallback.
- **`post-ranking.integration.spec.ts` (12 tests)**: End-to-end integration tests on an in-memory replica set verifying controlled top order, latest chronological order, most-discussed order, tie-breaking by `createdAt` and `_id`, pagination order stability across all 3 sort modes, soft-delete exclusions, and empty feed states.
- **`reactions.service.spec.ts` (22 tests)**: Toggle creation, toggle off, switch between like/dislike, post/comment target validation, soft-deleted post rejection, user reaction queries, paginated reactor listings.
- **`reactions.concurrency.spec.ts` (4 tests)**: Concurrent toggle stress tests, duplicate race condition mitigation, and counter synchronization under parallel load.
- **`comments.service.spec.ts` (20 tests)**: Top-level creation, reply creation with root-flattening & mentioned user derivation, tree construction with normalized mentions, reply/thread cascade deletion, counter integrity.
- **`comment-owner-or-admin.guard.spec.ts`**: Authentication requirements, author ownership verification, and admin override.
- **`auth.service.spec.ts`**: Registration, password hashing, JWT issuance, deleted user login rejection.
- **`posts.service.spec.ts`**: Post CRUD, author derivation, soft-delete, 5-day restore expiration, permanent purge.
- **`post-owner-or-admin.guard.spec.ts`**: Ownership verification and admin override.
- **`users.service.spec.ts`**: Profile updates, subdocument arrays, duplicate skill handling.
- **`http-exception.filter.spec.ts` & `transform.interceptor.spec.ts`**: Standardized response envelopes.

---

## 🛡️ Security & Data Integrity

1. **Anti-Enumeration Defense**: Login failures return generic `"Invalid email or password"` to prevent account harvesting.
2. **Author Sanitization**: Post author population explicitly projects only public fields (`name`, `headline`, `avatarUrl`), preventing exposure of `passwordHash`, `email`, or `role`.
3. **Soft-Delete Safety Net**: Deleted posts remain recoverable for 5 days before automated background purge, protecting users from accidental data loss.
4. **Principle of Least Privilege**: Sensitive administrative actions (permanent post purge, user role promotion, user soft-delete) are strictly enforced via `@Roles('admin')` and `RolesGuard`.

---

## 🧪 Day 17 Automated Testing Matrix & E2E Runbook

### 1. Test Matrix Summary
- **Total Test Suites**: 27 unit/integration suites + 1 E2E suite
- **Total Passing Tests**: 207 / 207 tests (100% passing)
- **Line Coverage**: **81.69%** (Vitest v8 provider)
- **E2E Engine**: `supertest` + `MongoMemoryServer` in-memory cluster

### 2. Coverage Metrics Breakdown
| Layer / Domain | Statements | Branches | Functions | Lines |
|---|---|---|---|---|
| **All Files** | **81.55%** | **62.55%** | **80.43%** | **81.69%** |
| Auth & RBAC | 90.00% | 80.00% | 100.00% | 90.00% |
| Guards & Interceptors | 100.00% | 89.20% | 100.00% | 100.00% |
| Comments Service | 88.27% | 69.89% | 94.11% | 88.27% |
| Reactions Service | 90.08% | 69.13% | 100.00% | 90.75% |
| Post Ranking Util & Pipeline | 100.00% | 87.50% | 100.00% | 100.00% |
| Posts Service | 84.25% | 68.88% | 81.81% | 84.11% |
| AI Summarizer Service | 95.83% | 83.33% | 100.00% | 95.83% |
| AI Providers (Groq & Mock) | 95.74% | 90.00% | 100.00% | 95.65% |

### 3. Execution Commands
```bash
# Run 200 unit and replica-set integration tests
npm test

# Run 7 Supertest E2E lifecycle tests
npm run test:e2e

# Run coverage report with v8 thresholds
npm run test:cov
```

