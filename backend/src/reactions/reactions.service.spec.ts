import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ReactionsService } from './reactions.service.js';

describe('ReactionsService', () => {
  let service: ReactionsService;

  let mockReactionModel: any;
  let mockPostModel: any;
  let mockCommentModel: any;
  let mockConnection: any;
  let mockSession: any;

  const userId = '66e138fc29094e137127e4e1';
  const postId = '66e138fc29094e137127e4e2';
  const commentId = '66e138fc29094e137127e4e3';

  /*
  |--------------------------------------------------------------------------
  | Query Helpers
  |--------------------------------------------------------------------------
  */

  const createSessionQuery = (result: unknown) => ({
    select: vi.fn().mockReturnThis(),
    session: vi.fn().mockReturnThis(),
    exec: vi.fn().mockResolvedValue(result),
  });

  const createQuery = (result: unknown) => ({
    select: vi.fn().mockReturnThis(),
    exec: vi.fn().mockResolvedValue(result),
  });

  beforeEach(() => {
    /*
    |--------------------------------------------------------------------------
    | Mongo Session
    |--------------------------------------------------------------------------
    */

    mockSession = {
      withTransaction: vi.fn(async (callback: () => Promise<unknown>) => {
        return callback();
      }),

      endSession: vi.fn().mockResolvedValue(undefined),
    };

    mockConnection = {
      startSession: vi.fn().mockResolvedValue(mockSession),
    };

    /*
    |--------------------------------------------------------------------------
    | Reaction Model
    |--------------------------------------------------------------------------
    */

    mockReactionModel = {
      findOne: vi.fn(),
      create: vi.fn(),
      deleteOne: vi.fn(),
      updateOne: vi.fn(),
    };

    /*
    |--------------------------------------------------------------------------
    | Post Model
    |--------------------------------------------------------------------------
    */

    mockPostModel = {
      findOne: vi.fn(),
      findOneAndUpdate: vi.fn(),
    };

    /*
    |--------------------------------------------------------------------------
    | Comment Model
    |--------------------------------------------------------------------------
    */

    mockCommentModel = {
      findById: vi.fn(),
      findOneAndUpdate: vi.fn(),
    };

    service = new ReactionsService(
      mockReactionModel,
      mockPostModel,
      mockCommentModel,
      mockConnection,
    );
  });

  /*
  |--------------------------------------------------------------------------
  | CREATE
  |--------------------------------------------------------------------------
  */

  describe('create reaction', () => {
    it('should create a like reaction on an active post', async () => {
      /*
       * Active Post.
       */
      mockPostModel.findOne.mockReturnValue(
        createSessionQuery({
          _id: new Types.ObjectId(postId),
        }),
      );

      /*
       * User currently has no Reaction.
       */
      mockReactionModel.findOne.mockReturnValue(createSessionQuery(null));

      mockReactionModel.create.mockResolvedValue([
        {
          _id: new Types.ObjectId(),
          type: 'like',
        },
      ]);

      /*
       * Counter after +1.
       */
      mockPostModel.findOneAndUpdate.mockReturnValue(
        createQuery({
          reactionCounts: {
            like: 1,
            dislike: 0,
          },
        }),
      );

      const result = await service.toggleReaction(userId, {
        targetType: 'post',
        targetId: postId,
        type: 'like',
      });

      expect(result).toEqual({
        action: 'created',
        reaction: 'like',
        reactionCounts: {
          like: 1,
          dislike: 0,
        },
      });

      expect(mockReactionModel.create).toHaveBeenCalledWith(
        [
          {
            userId: expect.any(Types.ObjectId),
            targetType: 'post',
            targetId: expect.any(Types.ObjectId),
            type: 'like',
          },
        ],
        {
          session: mockSession,
        },
      );

      expect(mockPostModel.findOneAndUpdate).toHaveBeenCalledWith(
        {
          _id: expect.any(Types.ObjectId),
          deletedAt: {
            $exists: false,
          },
        },
        {
          $inc: {
            'reactionCounts.like': 1,
          },
        },
        {
          returnDocument: 'after',
          session: mockSession,
        },
      );

      expect(mockSession.withTransaction).toHaveBeenCalledTimes(1);
      expect(mockSession.endSession).toHaveBeenCalledTimes(1);
    });

    it('should create a dislike reaction on an active comment', async () => {
      const parentPostObjectId = new Types.ObjectId(postId);

      /*
       * Comment exists.
       */
      mockCommentModel.findById.mockReturnValue(
        createSessionQuery({
          _id: new Types.ObjectId(commentId),
          postId: parentPostObjectId,
        }),
      );

      /*
       * Parent Post active:
       *
       * First check = resolveActiveTarget()
       * Second check = updateTargetCounters()
       */
      mockPostModel.findOne
        .mockReturnValueOnce(
          createSessionQuery({
            _id: parentPostObjectId,
          }),
        )
        .mockReturnValueOnce(
          createSessionQuery({
            _id: parentPostObjectId,
          }),
        );

      mockReactionModel.findOne.mockReturnValue(createSessionQuery(null));

      mockReactionModel.create.mockResolvedValue([
        {
          type: 'dislike',
        },
      ]);

      mockCommentModel.findOneAndUpdate.mockReturnValue(
        createQuery({
          reactionCounts: {
            like: 0,
            dislike: 1,
          },
        }),
      );

      const result = await service.toggleReaction(userId, {
        targetType: 'comment',
        targetId: commentId,
        type: 'dislike',
      });

      expect(result).toEqual({
        action: 'created',
        reaction: 'dislike',
        reactionCounts: {
          like: 0,
          dislike: 1,
        },
      });

      expect(mockCommentModel.findOneAndUpdate).toHaveBeenCalledWith(
        {
          _id: expect.any(Types.ObjectId),
          postId: parentPostObjectId,
        },
        {
          $inc: {
            'reactionCounts.dislike': 1,
          },
        },
        {
          returnDocument: 'after',
          session: mockSession,
        },
      );
    });
  });

  /*
  |--------------------------------------------------------------------------
  | REMOVE
  |--------------------------------------------------------------------------
  */

  describe('remove reaction', () => {
    it('should remove a like when the same like is sent again', async () => {
      const reactionId = new Types.ObjectId();

      mockPostModel.findOne.mockReturnValue(
        createSessionQuery({
          _id: new Types.ObjectId(postId),
        }),
      );

      mockReactionModel.findOne.mockReturnValue(
        createSessionQuery({
          _id: reactionId,
          type: 'like',
        }),
      );

      mockReactionModel.deleteOne.mockReturnValue({
        session: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue({
          deletedCount: 1,
        }),
      });

      mockPostModel.findOneAndUpdate.mockReturnValue(
        createQuery({
          reactionCounts: {
            like: 0,
            dislike: 0,
          },
        }),
      );

      const result = await service.toggleReaction(userId, {
        targetType: 'post',
        targetId: postId,
        type: 'like',
      });

      expect(result).toEqual({
        action: 'removed',
        reaction: null,
        reactionCounts: {
          like: 0,
          dislike: 0,
        },
      });

      expect(mockReactionModel.deleteOne).toHaveBeenCalledWith({
        _id: reactionId,
        type: 'like',
      });

      expect(mockPostModel.findOneAndUpdate).toHaveBeenCalledWith(
        expect.any(Object),
        {
          $inc: {
            'reactionCounts.like': -1,
          },
        },
        expect.any(Object),
      );
    });

    it('should remove a dislike when the same dislike is sent again', async () => {
      mockPostModel.findOne.mockReturnValue(
        createSessionQuery({
          _id: new Types.ObjectId(postId),
        }),
      );

      mockReactionModel.findOne.mockReturnValue(
        createSessionQuery({
          _id: new Types.ObjectId(),
          type: 'dislike',
        }),
      );

      mockReactionModel.deleteOne.mockReturnValue({
        session: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue({
          deletedCount: 1,
        }),
      });

      mockPostModel.findOneAndUpdate.mockReturnValue(
        createQuery({
          reactionCounts: {
            like: 0,
            dislike: 0,
          },
        }),
      );

      const result = await service.toggleReaction(userId, {
        targetType: 'post',
        targetId: postId,
        type: 'dislike',
      });

      expect(result.action).toBe('removed');
      expect(result.reaction).toBeNull();
    });
  });

  /*
  |--------------------------------------------------------------------------
  | SWITCH
  |--------------------------------------------------------------------------
  */

  describe('switch reaction', () => {
    it('should switch like to dislike', async () => {
      const reactionId = new Types.ObjectId();

      mockPostModel.findOne.mockReturnValue(
        createSessionQuery({
          _id: new Types.ObjectId(postId),
        }),
      );

      mockReactionModel.findOne.mockReturnValue(
        createSessionQuery({
          _id: reactionId,
          type: 'like',
        }),
      );

      mockReactionModel.updateOne.mockReturnValue({
        exec: vi.fn().mockResolvedValue({
          matchedCount: 1,
          modifiedCount: 1,
        }),
      });

      mockPostModel.findOneAndUpdate.mockReturnValue(
        createQuery({
          reactionCounts: {
            like: 0,
            dislike: 1,
          },
        }),
      );

      const result = await service.toggleReaction(userId, {
        targetType: 'post',
        targetId: postId,
        type: 'dislike',
      });

      expect(result).toEqual({
        action: 'switched',
        reaction: 'dislike',
        reactionCounts: {
          like: 0,
          dislike: 1,
        },
      });

      expect(mockReactionModel.updateOne).toHaveBeenCalledWith(
        {
          _id: reactionId,
          type: 'like',
        },
        {
          $set: {
            type: 'dislike',
          },
        },
        {
          session: mockSession,
        },
      );

      expect(mockPostModel.findOneAndUpdate).toHaveBeenCalledWith(
        expect.any(Object),
        {
          $inc: {
            'reactionCounts.like': -1,
            'reactionCounts.dislike': 1,
          },
        },
        expect.any(Object),
      );
    });

    it('should switch dislike to like', async () => {
      mockPostModel.findOne.mockReturnValue(
        createSessionQuery({
          _id: new Types.ObjectId(postId),
        }),
      );

      mockReactionModel.findOne.mockReturnValue(
        createSessionQuery({
          _id: new Types.ObjectId(),
          type: 'dislike',
        }),
      );

      mockReactionModel.updateOne.mockReturnValue({
        exec: vi.fn().mockResolvedValue({
          modifiedCount: 1,
        }),
      });

      mockPostModel.findOneAndUpdate.mockReturnValue(
        createQuery({
          reactionCounts: {
            like: 1,
            dislike: 0,
          },
        }),
      );

      const result = await service.toggleReaction(userId, {
        targetType: 'post',
        targetId: postId,
        type: 'like',
      });

      expect(result).toEqual({
        action: 'switched',
        reaction: 'like',
        reactionCounts: {
          like: 1,
          dislike: 0,
        },
      });
    });
  });

  /*
  |--------------------------------------------------------------------------
  | INVALID / DELETED TARGETS
  |--------------------------------------------------------------------------
  */

  describe('target validation', () => {
    it('should reject a missing or soft-deleted post', async () => {
      mockPostModel.findOne.mockReturnValue(createSessionQuery(null));

      await expect(
        service.toggleReaction(userId, {
          targetType: 'post',
          targetId: postId,
          type: 'like',
        }),
      ).rejects.toThrow(NotFoundException);

      expect(mockReactionModel.create).not.toHaveBeenCalled();
    });

    it('should reject a missing or hard-deleted comment', async () => {
      mockCommentModel.findById.mockReturnValue(createSessionQuery(null));

      await expect(
        service.toggleReaction(userId, {
          targetType: 'comment',
          targetId: commentId,
          type: 'like',
        }),
      ).rejects.toThrow(NotFoundException);

      expect(mockReactionModel.create).not.toHaveBeenCalled();
    });

    it('should reject a comment when its parent post is soft-deleted', async () => {
      mockCommentModel.findById.mockReturnValue(
        createSessionQuery({
          _id: new Types.ObjectId(commentId),
          postId: new Types.ObjectId(postId),
        }),
      );

      mockPostModel.findOne.mockReturnValue(createSessionQuery(null));

      await expect(
        service.toggleReaction(userId, {
          targetType: 'comment',
          targetId: commentId,
          type: 'like',
        }),
      ).rejects.toThrow(NotFoundException);

      expect(mockReactionModel.create).not.toHaveBeenCalled();
    });
  });

  /*
  |--------------------------------------------------------------------------
  | TRANSACTION FAILURE
  |--------------------------------------------------------------------------
  */

  describe('transaction safety', () => {
    it('should propagate counter update failure and always end the session', async () => {
      mockPostModel.findOne.mockReturnValue(
        createSessionQuery({
          _id: new Types.ObjectId(postId),
        }),
      );

      mockReactionModel.findOne.mockReturnValue(createSessionQuery(null));

      mockReactionModel.create.mockResolvedValue([
        {
          type: 'like',
        },
      ]);

      mockPostModel.findOneAndUpdate.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        exec: vi.fn().mockRejectedValue(new Error('Counter update failed')),
      });

      await expect(
        service.toggleReaction(userId, {
          targetType: 'post',
          targetId: postId,
          type: 'like',
        }),
      ).rejects.toThrow('Counter update failed');

      expect(mockSession.withTransaction).toHaveBeenCalledTimes(1);

      expect(mockSession.endSession).toHaveBeenCalledTimes(1);
    });

    it('should not silently fall back when transactions fail', async () => {
      mockSession.withTransaction.mockRejectedValue(
        new Error('Transaction unavailable'),
      );

      await expect(
        service.toggleReaction(userId, {
          targetType: 'post',
          targetId: postId,
          type: 'like',
        }),
      ).rejects.toThrow('Transaction unavailable');

      expect(mockSession.endSession).toHaveBeenCalledTimes(1);

      expect(mockReactionModel.create).not.toHaveBeenCalled();
    });
  });

  /*
  |--------------------------------------------------------------------------
  | RETRY
  |--------------------------------------------------------------------------
  */

  describe('concurrency retry', () => {
    it('should retry with a fresh transaction after duplicate-key race', async () => {
      /*
       * Attempt #1
       *
       * Simulate E11000 before the callback does useful work.
       */
      const duplicateKeyError = Object.assign(
        new Error('E11000 duplicate key'),
        {
          code: 11000,
        },
      );

      const firstSession = {
        withTransaction: vi.fn().mockRejectedValue(duplicateKeyError),

        endSession: vi.fn().mockResolvedValue(undefined),
      };

      /*
       * Attempt #2 succeeds.
       */
      const secondSession = {
        withTransaction: vi.fn(async (callback: () => Promise<unknown>) => {
          return callback();
        }),

        endSession: vi.fn().mockResolvedValue(undefined),
      };

      mockConnection.startSession
        .mockResolvedValueOnce(firstSession)
        .mockResolvedValueOnce(secondSession);

      mockPostModel.findOne.mockReturnValue(
        createSessionQuery({
          _id: new Types.ObjectId(postId),
        }),
      );

      /*
       * Fresh read after retry sees an existing like.
       *
       * Same incoming like therefore removes it.
       */
      mockReactionModel.findOne.mockReturnValue(
        createSessionQuery({
          _id: new Types.ObjectId(),
          type: 'like',
        }),
      );

      mockReactionModel.deleteOne.mockReturnValue({
        session: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue({
          deletedCount: 1,
        }),
      });

      mockPostModel.findOneAndUpdate.mockReturnValue(
        createQuery({
          reactionCounts: {
            like: 0,
            dislike: 0,
          },
        }),
      );

      const result = await service.toggleReaction(userId, {
        targetType: 'post',
        targetId: postId,
        type: 'like',
      });

      expect(mockConnection.startSession).toHaveBeenCalledTimes(2);

      expect(firstSession.endSession).toHaveBeenCalledTimes(1);
      expect(secondSession.endSession).toHaveBeenCalledTimes(1);

      expect(result.action).toBe('removed');
      expect(result.reaction).toBeNull();
    });

    it('should not retry ordinary application errors', async () => {
      mockPostModel.findOne.mockReturnValue(createSessionQuery(null));

      await expect(
        service.toggleReaction(userId, {
          targetType: 'post',
          targetId: postId,
          type: 'like',
        }),
      ).rejects.toThrow(NotFoundException);

      expect(mockConnection.startSession).toHaveBeenCalledTimes(1);
    });
  });
});
