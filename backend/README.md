# ⚡ DevPulse Backend API

> Robust, scalable enterprise REST backend built with **NestJS**, **MongoDB / Mongoose**, **Passport JWT**, and **OpenAPI/Swagger**.

---

## 🏛️ System Architecture Overview (As of Day 12)

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

# Run automated Vitest test suite (86 unit & integration tests)
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

### 3. `PostsModule` (`/posts`) — *Day 7 & 8 Deliverables*
- **`POST /posts`**: Create engineering posts. Author is derived strictly from verified JWT claims (`@CurrentUser()`). Automatically increments author's `postsCount`.
- **`GET /posts?page=1&limit=10&status=active`**: High-performance paginated feed sorted newest-first (`createdAt: -1, _id: -1`). Returns metadata (`total`, `page`, `limit`, `totalPages`) supporting infinite scroll.
- **`GET /posts/:id`**: Single post lookup with pre-validation of 24-character hexadecimal ObjectId to eliminate Mongoose CastError 500s.
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

---

## 🔄 Working Flow as of Day 12

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

### 3. Feed Pagination & Infinite Scroll Query

```
1. Client GET /posts?page=2&limit=10&status=active
                 │
                 ▼
2. PostsService.findAllPosts executes:
   ├── Filter: { deletedAt: { $exists: false } }
   ├── Compound Index Scan: { createdAt: -1, _id: -1 }
   ├── Lean Projection: authorId -> name, headline, avatarUrl
   ├── Pagination: .skip((page - 1) * limit).limit(limit)
   └── Total Count: countDocuments()
                 │
                 ▼
3. Returns { posts, total, page, limit, totalPages }
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

---

## 🧪 Automated Testing

DevPulse backend maintains a 100% pass rate across unit, integration, and guard test suites powered by **Vitest**:

```bash
# Run all 18 test suites (137 tests)
npx vitest run

# Run with watch mode
npx vitest

# Generate coverage report
npx vitest run --coverage
```

### Test Coverage Highlights:
- **`reactions.service.spec.ts` (18 tests)**: Toggle creation, toggle off, switch between like/dislike, post/comment target validation, soft-deleted post rejection, user reaction queries.
- **`reactions.concurrency.spec.ts` (4 tests)**: Concurrent toggle stress tests, duplicate race condition mitigation, and counter synchronization under parallel load.
- **`comments.service.spec.ts`**: Top-level creation, reply creation with cross-post & depth validation, single query tree construction, reply/thread cascade deletion, counter integrity.
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
