import { Types, createConnection, type Connection } from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { ReactionsService } from './reactions.service.js';

import { Reaction, ReactionSchema } from './schemas/reaction.schema.js';

import { Post, PostSchema } from '../posts/schemas/post.schema.js';

import { Comment, CommentSchema } from '../comments/schemas/comment.schema.js';

describe('ReactionsService concurrency', () => {
  let replSet: MongoMemoryReplSet;
  let connection: Connection;

  let reactionModel: any;
  let postModel: any;
  let commentModel: any;

  let service: ReactionsService;

  const userId = new Types.ObjectId();

  /*
  |--------------------------------------------------------------------------
  | Setup Real Temporary MongoDB Replica Set
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

    reactionModel = connection.model(Reaction.name, ReactionSchema);

    postModel = connection.model(Post.name, PostSchema);

    commentModel = connection.model(Comment.name, CommentSchema);

    /*
     * Make sure MongoDB actually creates the indexes,
     * especially the Reaction compound unique index.
     */
    await Promise.all([
      reactionModel.init(),
      postModel.init(),
      commentModel.init(),
    ]);

    service = new ReactionsService(
      reactionModel,
      postModel,
      commentModel,
      connection,
    );
  }, 120_000);

  /*
  |--------------------------------------------------------------------------
  | Clean Database Between Tests
  |--------------------------------------------------------------------------
  */

  afterEach(async () => {
    await Promise.all([
      reactionModel.deleteMany({}),
      postModel.deleteMany({}),
      commentModel.deleteMany({}),
    ]);
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
  | Helper
  |--------------------------------------------------------------------------
  */

  async function createPost() {
    return postModel.create({
      authorId: new Types.ObjectId(),
      title: 'Concurrency test post',
      body: 'Testing reaction concurrency.',
    });
  }

  /*
  |--------------------------------------------------------------------------
  | Unique Index
  |--------------------------------------------------------------------------
  */

  it('should enforce one Reaction per user and target with the compound unique index', async () => {
    const post = await createPost();

    const reaction = {
      userId,
      targetType: 'post',
      targetId: post._id,
      type: 'like',
    };

    const results = await Promise.allSettled([
      reactionModel.create(reaction),
      reactionModel.create(reaction),
    ]);

    const fulfilled = results.filter((result) => result.status === 'fulfilled');

    const rejected = results.filter((result) => result.status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    if (rejected[0]?.status === 'rejected') {
      const error = rejected[0].reason as {
        code?: number;
      };

      expect(error.code).toBe(11000);
    }

    const reactionCount = await reactionModel.countDocuments({
      userId,
      targetType: 'post',
      targetId: post._id,
    });

    expect(reactionCount).toBe(1);
  }, 30_000);

  /*
  |--------------------------------------------------------------------------
  | Same Concurrent Toggle
  |--------------------------------------------------------------------------
  */

  it('should keep Reaction and counters consistent when two identical toggles run concurrently', async () => {
    const post = await createPost();

    const dto = {
      targetType: 'post' as const,
      targetId: post._id.toString(),
      type: 'like' as const,
    };

    /*
     * Two likes at the same time.
     *
     * Logically:
     *
     * none → like → none
     */
    const results = await Promise.allSettled([
      service.toggleReaction(userId.toString(), dto),
      service.toggleReaction(userId.toString(), dto),
    ]);

    expect(results.every((result) => result.status === 'fulfilled')).toBe(true);

    const reactions = await reactionModel
      .find({
        userId,
        targetType: 'post',
        targetId: post._id,
      })
      .lean();

    const updatedPost = await postModel.findById(post._id).lean();

    /*
     * Two identical toggles cancel each other.
     */
    expect(reactions).toHaveLength(0);

    expect(updatedPost).not.toBeNull();

    expect(updatedPost?.reactionCounts).toEqual({
      like: 0,
      dislike: 0,
    });
  }, 30_000);

  /*
  |--------------------------------------------------------------------------
  | Conflicting Concurrent Toggle
  |--------------------------------------------------------------------------
  */

  it('should keep counters consistent when like and dislike race concurrently', async () => {
    const post = await createPost();

    const likeDto = {
      targetType: 'post' as const,
      targetId: post._id.toString(),
      type: 'like' as const,
    };

    const dislikeDto = {
      targetType: 'post' as const,
      targetId: post._id.toString(),
      type: 'dislike' as const,
    };

    const results = await Promise.allSettled([
      service.toggleReaction(userId.toString(), likeDto),

      service.toggleReaction(userId.toString(), dislikeDto),
    ]);

    expect(results.every((result) => result.status === 'fulfilled')).toBe(true);

    /*
     * Unique index must still leave at most one
     * Reaction for this user + target.
     */
    const reactions = await reactionModel
      .find({
        userId,
        targetType: 'post',
        targetId: post._id,
      })
      .lean();

    expect(reactions).toHaveLength(1);

    const finalReaction = reactions[0];

    const updatedPost = await postModel.findById(post._id).lean();

    expect(updatedPost).not.toBeNull();

    /*
     * We do NOT assume which request wins.
     *
     * Concurrent requests do not guarantee ordering.
     *
     * We only require that the final counter matches
     * the final stored Reaction.
     */
    if (finalReaction.type === 'like') {
      expect(updatedPost?.reactionCounts).toEqual({
        like: 1,
        dislike: 0,
      });
    } else {
      expect(finalReaction.type).toBe('dislike');

      expect(updatedPost?.reactionCounts).toEqual({
        like: 0,
        dislike: 1,
      });
    }

    /*
     * Counters must never become negative.
     */
    expect(updatedPost?.reactionCounts.like).toBeGreaterThanOrEqual(0);

    expect(updatedPost?.reactionCounts.dislike).toBeGreaterThanOrEqual(0);
  }, 30_000);
});
