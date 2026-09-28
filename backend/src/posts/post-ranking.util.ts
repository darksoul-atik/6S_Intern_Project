import { COMMENT_WEIGHT } from './posts.constants.js';

/**
 * Pure, deterministic ranking score calculation for posts.
 * Score formula: Likes - Dislikes + (Comments * COMMENT_WEIGHT)
 */
export function calculatePostRankScore(
  likes: number,
  dislikes: number,
  comments: number,
): number {
  const safeLikes = typeof likes === 'number' && !Number.isNaN(likes) ? likes : 0;
  const safeDislikes = typeof dislikes === 'number' && !Number.isNaN(dislikes) ? dislikes : 0;
  const safeComments = typeof comments === 'number' && !Number.isNaN(comments) ? comments : 0;

  return safeLikes - safeDislikes + safeComments * COMMENT_WEIGHT;
}
