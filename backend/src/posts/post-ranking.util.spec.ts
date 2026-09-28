import { describe, expect, it } from 'vitest';

import { COMMENT_WEIGHT } from './posts.constants.js';
import { calculatePostRankScore } from './post-ranking.util.js';

describe('calculatePostRankScore', () => {
  it('should use COMMENT_WEIGHT = 2', () => {
    expect(COMMENT_WEIGHT).toBe(2);
  });

  it('should calculate a positive rank score', () => {
    const score = calculatePostRankScore(8, 1, 3);

    expect(score).toBe(13);
  });

  it('should calculate zero when likes, dislikes, and comments cancel out', () => {
    const score = calculatePostRankScore(0, 4, 2);

    expect(score).toBe(0);
  });

  it('should allow a negative rank score', () => {
    const score = calculatePostRankScore(1, 5, 1);

    expect(score).toBe(-2);
  });

  it('should give each comment a weight of 2', () => {
    const score = calculatePostRankScore(0, 0, 3);

    expect(score).toBe(6);
  });

  it('should cancel equal likes and dislikes', () => {
    const score = calculatePostRankScore(5, 5, 0);

    expect(score).toBe(0);
  });

  it('should handle a post with no engagement', () => {
    const score = calculatePostRankScore(0, 0, 0);

    expect(score).toBe(0);
  });
});
