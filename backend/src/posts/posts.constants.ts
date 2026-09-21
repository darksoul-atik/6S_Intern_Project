/*
|--------------------------------------------------------------------------
| Post Author Summary Projections
|--------------------------------------------------------------------------
|
| Explicit, named projections for author summaries embedded in post objects.
|
| Prevents arbitrary User schema fields (e.g., passwordHash, email, role,
| skills, experiences, portfolioProjects) from leaking into post responses.
|--------------------------------------------------------------------------
*/

/**
 * Shared projection fields for author summary embedded in multi-post list responses.
 * Excludes avatarUrl to prevent Base64 payload bloat on list endpoints (Fix 1).
 */
export const LEAN_POST_LIST_AUTHOR_FIELDS = 'name headline' as const;

/**
 * Shared projection fields for author summary embedded in single-post detail responses.
 * Keeps avatarUrl for single-post views.
 */
export const LEAN_POST_DETAIL_AUTHOR_FIELDS = 'name headline avatarUrl' as const;

/**
 * Mongoose population configuration for author summary in multi-post listings.
 */
export const POPULATE_POST_LIST_AUTHOR = {
  path: 'authorId',
  select: LEAN_POST_LIST_AUTHOR_FIELDS,
} as const;

/**
 * Mongoose population configuration for author summary in single-post detail views.
 */
export const POPULATE_POST_DETAIL_AUTHOR = {
  path: 'authorId',
  select: LEAN_POST_DETAIL_AUTHOR_FIELDS,
} as const;
