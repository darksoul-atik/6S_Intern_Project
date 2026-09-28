import { createConnection, type Connection } from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { PostsService } from './posts.service.js';

import { Post, PostSchema } from './schemas/post.schema.js';

import { User, UserSchema } from '../users/schemas/user.schema.js';

import type { UsersService } from '../users/users.service.js';

import {
  EXPECTED_LATEST_ORDER,
  EXPECTED_MOST_DISCUSSED_ORDER,
  EXPECTED_RANK_SCORES,
  EXPECTED_TOP_ORDER,
  RANKING_SEED_AUTHOR_ID,
  RANKING_SEED_POSTS,
} from './testing/ranking-seed.fixture.js';

describe('Post ranking integration', () => {
  let replSet: MongoMemoryReplSet;
  let connection: Connection;

  let postModel: any;
  let userModel: any;

  let service: PostsService;

  /*
  |--------------------------------------------------------------------------
  | Temporary MongoDB Replica Set
  |--------------------------------------------------------------------------
  */

  beforeAll(async () => {
    replSet = await MongoMemoryReplSet.create({
      replSet: {
        count: 1,
        storageEngine: 'wiredTiger',
      },
      instanceOpts: [
        {
          launchTimeout: 60000,
        },
      ],
    });

    connection = await createConnection(replSet.getUri()).asPromise();

    userModel = connection.model(User.name, UserSchema);
    postModel = connection.model(Post.name, PostSchema);

    await Promise.all([userModel.init(), postModel.init()]);

    service = new PostsService(postModel, {} as UsersService);
  }, 120_000);

  /*
  |--------------------------------------------------------------------------
  | Cleanup Between Tests
  |--------------------------------------------------------------------------
  */

  afterEach(async () => {
    await Promise.all([postModel.deleteMany({}), userModel.deleteMany({})]);
  });

  /*
  |--------------------------------------------------------------------------
  | Shutdown
  |--------------------------------------------------------------------------
  */

  afterAll(async () => {
    if (connection) {
      await connection.close();
    }

    if (replSet) {
      await replSet.stop();
    }
  });

  /*
  |--------------------------------------------------------------------------
  | Helpers
  |--------------------------------------------------------------------------
  */

  async function seedControlledRankingData(): Promise<void> {
    await userModel.create({
      _id: RANKING_SEED_AUTHOR_ID,
      name: 'Day 13 Ranking Seed User',
      email: 'day13-ranking-seed@devpulse.test',
      passwordHash: 'not-used-in-ranking-test',
      role: 'user',
      headline: 'Controlled ranking verification user',
      avatarUrl: null,
    });

    const postsToInsert = RANKING_SEED_POSTS.map(
      ({ label: _label, ...post }) => ({
        ...post,
        reactionCounts: {
          ...post.reactionCounts,
        },
      }),
    );

    await postModel.insertMany(postsToInsert);
  }

  function getPostId(post: any): string {
    if (post.id) {
      return post.id.toString();
    }

    return post._id.toString();
  }

  function getLabels(posts: any[]): string[] {
    const labelsById = new Map(
      RANKING_SEED_POSTS.map((post) => [post._id.toString(), post.label]),
    );

    return posts.map((post) => {
      const label = labelsById.get(getPostId(post));

      if (!label) {
        throw new Error(`Unknown ranking seed post ID: ${getPostId(post)}`);
      }

      return label;
    });
  }

  /*
  |--------------------------------------------------------------------------
  | Top Order
  |--------------------------------------------------------------------------
  */

  it('should return the exact expected Top order', async () => {
    await seedControlledRankingData();

    const result = await service.findAllPosts({
      page: 1,
      limit: 20,
      sort: 'top',
    });

    expect(getLabels(result.posts)).toEqual([...EXPECTED_TOP_ORDER]);

    expect(result.total).toBe(9);
    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(1);

    expect(getLabels(result.posts)).not.toContain('J');
  });

  /*
  |--------------------------------------------------------------------------
  | Calculated Scores
  |--------------------------------------------------------------------------
  */

  it('should return the expected rankScore for every active post', async () => {
    await seedControlledRankingData();

    const result = await service.findAllPosts({
      page: 1,
      limit: 20,
      sort: 'top',
    });

    const labels = getLabels(result.posts);

    result.posts.forEach((post: any, index) => {
      const label = labels[index] as keyof typeof EXPECTED_RANK_SCORES;

      expect(post.rankScore).toBe(EXPECTED_RANK_SCORES[label]);
    });
  });

  /*
  |--------------------------------------------------------------------------
  | Top Tie Breakers
  |--------------------------------------------------------------------------
  */

  it('should use createdAt when rank scores are tied', async () => {
    await seedControlledRankingData();

    const result = await service.findAllPosts({
      page: 1,
      limit: 20,
      sort: 'top',
    });

    const labels = getLabels(result.posts);

    expect(labels.indexOf('B')).toBeLessThan(labels.indexOf('I'));

    expect(labels.indexOf('H')).toBeLessThan(labels.indexOf('D'));

    expect(labels.indexOf('H')).toBeLessThan(labels.indexOf('C'));
  });

  it('should use _id when score and createdAt are identical', async () => {
    await seedControlledRankingData();

    const result = await service.findAllPosts({
      page: 1,
      limit: 20,
      sort: 'top',
    });

    const labels = getLabels(result.posts);

    expect(labels.indexOf('D')).toBeLessThan(labels.indexOf('C'));
  });

  /*
  |--------------------------------------------------------------------------
  | Zero + Negative Scores
  |--------------------------------------------------------------------------
  */

  it('should support zero and negative rank scores', async () => {
    await seedControlledRankingData();

    const result = await service.findAllPosts({
      page: 1,
      limit: 20,
      sort: 'top',
    });

    const labels = getLabels(result.posts);

    const postE = result.posts[labels.indexOf('E')] as any;
    const postF = result.posts[labels.indexOf('F')] as any;

    expect(postE.rankScore).toBe(0);
    expect(postF.rankScore).toBe(-2);

    expect(labels.indexOf('E')).toBeLessThan(labels.indexOf('F'));
  });

  /*
  |--------------------------------------------------------------------------
  | Latest Order
  |--------------------------------------------------------------------------
  */

  it('should return the exact expected Latest order', async () => {
    await seedControlledRankingData();

    const result = await service.findAllPosts({
      page: 1,
      limit: 20,
      sort: 'latest',
    });

    expect(getLabels(result.posts)).toEqual([...EXPECTED_LATEST_ORDER]);

    expect(result.total).toBe(9);

    expect(getLabels(result.posts)).not.toContain('J');
  });

  /*
  |--------------------------------------------------------------------------
  | Most Discussed Order
  |--------------------------------------------------------------------------
  */

  it('should return the exact expected Most Discussed order', async () => {
    await seedControlledRankingData();

    const result = await service.findAllPosts({
      page: 1,
      limit: 20,
      sort: 'most-discussed',
    });

    expect(getLabels(result.posts)).toEqual([...EXPECTED_MOST_DISCUSSED_ORDER]);

    expect(result.total).toBe(9);
    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(1);

    expect(getLabels(result.posts)).not.toContain('J');
  });

  /*
  |--------------------------------------------------------------------------
  | Most Discussed Tie Breakers
  |--------------------------------------------------------------------------
  */

  it('should use createdAt when commentCount is tied', async () => {
    await seedControlledRankingData();

    const result = await service.findAllPosts({
      page: 1,
      limit: 20,
      sort: 'most-discussed',
    });

    const labels = getLabels(result.posts);

    /*
     * D and A both have 3 comments.
     * D is newer.
     */
    expect(labels.indexOf('D')).toBeLessThan(labels.indexOf('A'));

    /*
     * H and C both have 2 comments.
     * H is newer.
     */
    expect(labels.indexOf('H')).toBeLessThan(labels.indexOf('C'));

    /*
     * F and G both have 1 comment.
     * F is newer.
     */
    expect(labels.indexOf('F')).toBeLessThan(labels.indexOf('G'));
  });

  /*
  |--------------------------------------------------------------------------
  | Empty Feed
  |--------------------------------------------------------------------------
  */

  it('should return an empty result for an empty database', async () => {
    const topResult = await service.findAllPosts({
      page: 1,
      limit: 10,
      sort: 'top',
    });

    const latestResult = await service.findAllPosts({
      page: 1,
      limit: 10,
      sort: 'latest',
    });

    const mostDiscussedResult = await service.findAllPosts({
      page: 1,
      limit: 10,
      sort: 'most-discussed',
    });

    expect(topResult).toMatchObject({
      posts: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    expect(latestResult).toMatchObject({
      posts: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    expect(mostDiscussedResult).toMatchObject({
      posts: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
  });

  /*
  |--------------------------------------------------------------------------
  | Top Pagination Stability
  |--------------------------------------------------------------------------
  */

  it('should keep Top pagination stable when data does not change', async () => {
    await seedControlledRankingData();

    const page1 = await service.findAllPosts({
      page: 1,
      limit: 3,
      sort: 'top',
    });

    const page2 = await service.findAllPosts({
      page: 2,
      limit: 3,
      sort: 'top',
    });

    const page3 = await service.findAllPosts({
      page: 3,
      limit: 3,
      sort: 'top',
    });

    expect(getLabels(page1.posts)).toEqual(['A', 'B', 'I']);
    expect(getLabels(page2.posts)).toEqual(['H', 'D', 'C']);
    expect(getLabels(page3.posts)).toEqual(['G', 'E', 'F']);

    expect(page1.total).toBe(9);
    expect(page1.totalPages).toBe(3);

    const combinedLabels = [
      ...getLabels(page1.posts),
      ...getLabels(page2.posts),
      ...getLabels(page3.posts),
    ];

    expect(combinedLabels).toEqual([...EXPECTED_TOP_ORDER]);

    expect(new Set(combinedLabels).size).toBe(9);

    const repeatedPage1 = await service.findAllPosts({
      page: 1,
      limit: 3,
      sort: 'top',
    });

    expect(getLabels(repeatedPage1.posts)).toEqual(['A', 'B', 'I']);
  });

  /*
  |--------------------------------------------------------------------------
  | Latest Pagination Stability
  |--------------------------------------------------------------------------
  */

  it('should keep Latest pagination stable when data does not change', async () => {
    await seedControlledRankingData();

    const page1 = await service.findAllPosts({
      page: 1,
      limit: 3,
      sort: 'latest',
    });

    const page2 = await service.findAllPosts({
      page: 2,
      limit: 3,
      sort: 'latest',
    });

    const page3 = await service.findAllPosts({
      page: 3,
      limit: 3,
      sort: 'latest',
    });

    expect(getLabels(page1.posts)).toEqual(['H', 'F', 'E']);
    expect(getLabels(page2.posts)).toEqual(['D', 'C', 'B']);
    expect(getLabels(page3.posts)).toEqual(['G', 'I', 'A']);

    expect(page1.total).toBe(9);
    expect(page1.totalPages).toBe(3);

    const combinedLabels = [
      ...getLabels(page1.posts),
      ...getLabels(page2.posts),
      ...getLabels(page3.posts),
    ];

    expect(combinedLabels).toEqual([...EXPECTED_LATEST_ORDER]);

    expect(new Set(combinedLabels).size).toBe(9);

    const repeatedPage1 = await service.findAllPosts({
      page: 1,
      limit: 3,
      sort: 'latest',
    });

    expect(getLabels(repeatedPage1.posts)).toEqual(['H', 'F', 'E']);
  });

  /*
  |--------------------------------------------------------------------------
  | Most Discussed Pagination Stability
  |--------------------------------------------------------------------------
  */

  it('should keep Most Discussed pagination stable when data does not change', async () => {
    await seedControlledRankingData();

    const page1 = await service.findAllPosts({
      page: 1,
      limit: 3,
      sort: 'most-discussed',
    });

    const page2 = await service.findAllPosts({
      page: 2,
      limit: 3,
      sort: 'most-discussed',
    });

    const page3 = await service.findAllPosts({
      page: 3,
      limit: 3,
      sort: 'most-discussed',
    });

    expect(getLabels(page1.posts)).toEqual(['I', 'B', 'D']);
    expect(getLabels(page2.posts)).toEqual(['A', 'H', 'C']);
    expect(getLabels(page3.posts)).toEqual(['F', 'G', 'E']);

    expect(page1.total).toBe(9);
    expect(page1.totalPages).toBe(3);

    const combinedLabels = [
      ...getLabels(page1.posts),
      ...getLabels(page2.posts),
      ...getLabels(page3.posts),
    ];

    expect(combinedLabels).toEqual([...EXPECTED_MOST_DISCUSSED_ORDER]);

    expect(new Set(combinedLabels).size).toBe(9);

    const repeatedPage1 = await service.findAllPosts({
      page: 1,
      limit: 3,
      sort: 'most-discussed',
    });

    expect(getLabels(repeatedPage1.posts)).toEqual(['I', 'B', 'D']);
  });
});
