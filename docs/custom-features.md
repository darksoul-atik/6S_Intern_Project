# DevPulse Custom Engineering Features

This document provides a detailed technical breakdown of the **four custom features engineered beyond the original 20-day plan**. Each feature was designed to address real user-experience and architectural bottlenecks commonly found in social developer platforms.

---

## 1. Clickable Commenter Profiles

### Problem & Motivation
In typical MVP discussion boards, comment authors are rendered as static text or plain avatars. Users who read insightful comments cannot easily view the commenter's technical background, skill set, or experience without manually searching for them in an external directory.

### Implementation & User Experience
* **Frontend Component**: `frontend/src/features/comments/components/comment-item.tsx`
* **Interaction**: Comment author names and avatar rings are interactive links (`<Link href={/developers/${author.id}}>`). Hovering displays a subtle micro-animation zoom with smooth transition, guiding users directly to the developer's public portfolio and profile.
* **Lean Projection Architecture**:
  * Instead of populating the entire `User` document (which contains password hashes, email addresses, and detailed experience arrays), `CommentsService.findCommentsByPost` executes a strict projection:
    ```typescript
    .populate({
      path: 'authorId',
      select: 'name headline avatarUrl',
    })
    ```
  * This guarantees high-speed responses and zero leakage of sensitive user data while providing all necessary metadata for client-side navigation.

---

## 2. Flattened Same-Depth Replies with @Mentions

### Problem & Motivation
Traditional recursive tree comment designs allow arbitrary nesting depth. On mobile viewports ($\le$ 375px), deeply nested threads compress horizontal margins, causing severe layout squishing, unreadable code snippets, and confusing UX. In MongoDB, arbitrary nesting requires recursive `$graphLookup` aggregation pipelines or deeply nested array updates that complicate atomic operations.

### Implementation & User Experience
* **Single-Depth Constraint**: All replies render at a consistent single indentation level (depth = 1) beneath their root parent comment.
* **Conversational Context via @Mentions**:
  * When a user replies to an existing reply within a thread, the UI automatically prepends an `@DeveloperName` badge.
  * In the database, the comment schema captures `mentionedUserId`:
    ```typescript
    @Prop({ type: 'ObjectId', ref: User.name, default: null })
    mentionedUserId?: Types.ObjectId | null;
    ```
* **Backend Validation**:
  * `CommentsController.createReply` enforces that `parentCommentId` always resolves to a valid root comment (`POST /posts/:postId/comments/:commentId/replies`).
  * Attempting to nest a reply under another reply is intercepted and rejected with `400 Bad Request`.
* **Cascade Deletion Safety**:
  * Deleting a single reply removes only that item.
  * Deleting a root comment atomically removes the entire thread and recalculates the post's `commentCount` inside a MongoDB transaction.

---

## 3. Reactors List Modal & Hover Peek Popover

### Problem & Motivation
Most developer platforms display like/dislike counts as static counters (e.g., "12 Likes"). Users cannot see who endorsed a post or understand the community consensus without an explicit social transparency mechanism.

### Implementation & User Experience
* **Dual Interaction Layer**:
  1. **Hover Peek (`ReactionHoverPeek`)**: Pausing the cursor over a reaction pill for 300ms triggers a lightweight popover showing an instant avatar stack of the most recent reactors.
  2. **Detailed Modal (`ReactorsModal`)**: Clicking the reaction count pill opens a high-contrast glassmorphic dialog with paginated reactor listings.
* **Filtering Tabs**: The modal includes tabs to filter by:
  * **All Reactions**
  * **Likes Only** (👍)
  * **Dislikes Only** (👎)
* **Backend API (`GET /reactions`)**:
  * Supports pagination (`page`, `limit`) and target filtering (`targetId`, `targetType`, `type`).
  * Returns user profile cards with `name`, `headline`, and `avatarUrl`:
    ```json
    {
      "items": [
        {
          "userId": "6aa3998713d8321eedee6f70",
          "name": "DevPulse Lead Admin",
          "headline": "Principal Distributed Systems Architect",
          "avatarUrl": "/users/6aa3998713d8321eedee6f70/avatar",
          "type": "like",
          "createdAt": "2026-10-07T04:41:50.000Z"
        }
      ],
      "total": 1,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
    ```

---

## 4. Groq-Based Post Summarizer with Graceful Degradation

### Problem & Motivation
Long architectural posts and technical deep-dives can be intimidating or time-consuming to read on mobile. Users need a quick, reliable summary of key concepts and extracted technology tags before reading a 20,000-character article.

### Implementation & User Experience
* **Frontend Panel (`PostSummaryPanel`)**:
  * Positioned at the top of the post view.
  * Features an "AI Summarize" button with an animated gradient loader while processing.
  * Renders a clean executive summary and chip tags for extracted technologies (e.g., `TypeScript`, `Docker`, `MongoDB`).
* **High-Speed Inference Engine**:
  * Integrates the **Groq Cloud API** running `openai/gpt-oss-20b` in strict JSON mode (`response_format: { type: 'json_object' }`).
* **Production Boundary Guards**:
  1. **Input Truncation Guard**: Post content is safely truncated at **12,000 characters** before dispatching to the LLM to prevent prompt injection and token limits.
  2. **Timeout Guard (`SUMMARIZER_TIMEOUT_MS = 8000`)**: If the external API fails to respond within 8 seconds, the request times out and throws `GatewayTimeoutException` (504).
  3. **Strict Schema Validation**: Verifies that the LLM output conforms to `{ summary: string, tags: string[] }`. Invalid output triggers `BadGatewayException` (502).
  4. **Mock Fallback Provider**: If `GROQ_API_KEY` is not provided in `.env`, `SummarizerModule` automatically instantiates `MockSummarizerProvider`, generating deterministic local summaries so offline environments and CI/CD pipelines never break.
