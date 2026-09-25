import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CommentsService } from './comments.service.js';
import type { PostsService } from '../posts/posts.service.js';
import type { UsersService } from '../users/users.service.js';

describe('CommentsService', () => {
  let service: CommentsService;

  let mockCommentModel: any;
  let mockPostsService: Partial<PostsService>;
  let mockUsersService: Partial<UsersService>;

  let mockSession: any;

  const validPostId = '66e138fc29094e137127e4e0';
  const validAuthorId = '66e138fc29094e137127e4e1';
  const validCommentId = '66e138fc29094e137127e4e2';
  const validReplyId = '66e138fc29094e137127e4e3';

  /*
  |--------------------------------------------------------------------------
  | Query Helper
  |--------------------------------------------------------------------------
  |
  | Transactional queries now use:
  |
  | findById(...)
  |   .session(session)
  |   .exec()
  |
  */

  const createSessionQuery = (result: unknown) => ({
    session: vi.fn().mockReturnThis(),
    exec: vi.fn().mockResolvedValue(result),
  });

  beforeEach(() => {
    /*
    |--------------------------------------------------------------------------
    | MongoDB Session Mock
    |--------------------------------------------------------------------------
    */

    mockSession = {
      withTransaction: vi.fn(async (callback: () => Promise<unknown>) => {
        return callback();
      }),

      endSession: vi.fn().mockResolvedValue(undefined),
    };

    /*
    |--------------------------------------------------------------------------
    | Comment Model Mock
    |--------------------------------------------------------------------------
    */

    mockCommentModel = {
      db: {
        startSession: vi.fn().mockResolvedValue(mockSession),
      },

      create: vi.fn(),

      findById: vi.fn(),

      find: vi.fn(),

      deleteOne: vi.fn(),

      deleteMany: vi.fn(),
    };

    /*
    |--------------------------------------------------------------------------
    | Posts Service Mock
    |--------------------------------------------------------------------------
    */

    mockPostsService = {
      findActivePostByIdOrThrow: vi.fn().mockResolvedValue({
        _id: validPostId,
      }),

      incrementCommentCount: vi.fn().mockResolvedValue(undefined),

      decrementCommentCount: vi.fn().mockResolvedValue(undefined),
    };

    /*
    |--------------------------------------------------------------------------
    | Users Service Mock
    |--------------------------------------------------------------------------
    */

    mockUsersService = {
      incrementCommentsCount: vi.fn().mockResolvedValue(undefined),

      decrementCommentsCount: vi.fn().mockResolvedValue(undefined),
    };

    service = new CommentsService(
      mockCommentModel as any,
      mockPostsService as PostsService,
      mockUsersService as UsersService,
    );
  });

  /*
  |--------------------------------------------------------------------------
  | Create Top-Level Comment
  |--------------------------------------------------------------------------
  */

  describe('createComment', () => {
    it('should create a top-level comment and update counters inside one transaction', async () => {
      const dto = {
        body: 'Top-level comment body',
      };

      const createdComment = {
        _id: new Types.ObjectId(validCommentId),

        postId: new Types.ObjectId(validPostId),

        authorId: new Types.ObjectId(validAuthorId),

        parentCommentId: null,

        body: dto.body,
      };

      /*
       * create() now receives an array
       * because the transaction session is supplied.
       */
      mockCommentModel.create.mockResolvedValue([createdComment]);

      const result = await service.createComment(
        validPostId,
        validAuthorId,
        dto,
      );

      expect(mockPostsService.findActivePostByIdOrThrow).toHaveBeenCalledWith(
        validPostId,
      );

      expect(mockCommentModel.db.startSession).toHaveBeenCalledTimes(1);

      expect(mockSession.withTransaction).toHaveBeenCalledTimes(1);

      expect(mockCommentModel.create).toHaveBeenCalledWith(
        [
          {
            postId: expect.any(Types.ObjectId),

            authorId: expect.any(Types.ObjectId),

            parentCommentId: null,

            body: dto.body,
          },
        ],
        {
          session: mockSession,
        },
      );

      expect(mockPostsService.incrementCommentCount).toHaveBeenCalledWith(
        validPostId,
        mockSession,
      );

      expect(mockUsersService.incrementCommentsCount).toHaveBeenCalledWith(
        validAuthorId,
        mockSession,
      );

      expect(result).toEqual(createdComment);

      expect(mockSession.endSession).toHaveBeenCalledTimes(1);
    });

    it('should propagate error if post does not exist before starting transaction', async () => {
      vi.mocked(mockPostsService.findActivePostByIdOrThrow!).mockRejectedValue(
        new NotFoundException('Post not found'),
      );

      await expect(
        service.createComment(validPostId, validAuthorId, {
          body: 'test',
        }),
      ).rejects.toThrow(NotFoundException);

      /*
       * Post validation failed before transaction.
       */
      expect(mockCommentModel.db.startSession).not.toHaveBeenCalled();
    });

    it('should end the session if a counter update fails', async () => {
      const createdComment = {
        _id: new Types.ObjectId(validCommentId),

        postId: new Types.ObjectId(validPostId),

        authorId: new Types.ObjectId(validAuthorId),

        parentCommentId: null,

        body: 'test',
      };

      mockCommentModel.create.mockResolvedValue([createdComment]);

      vi.mocked(mockUsersService.incrementCommentsCount!).mockRejectedValue(
        new Error('User counter failed'),
      );

      await expect(
        service.createComment(validPostId, validAuthorId, {
          body: 'test',
        }),
      ).rejects.toThrow('User counter failed');

      expect(mockSession.endSession).toHaveBeenCalledTimes(1);
    });
  });

  /*
  |--------------------------------------------------------------------------
  | Create Reply
  |--------------------------------------------------------------------------
  */

  describe('createReply', () => {
    it('should throw NotFoundException on invalid parentCommentId', async () => {
      await expect(
        service.createReply(validPostId, 'invalid-id', validAuthorId, {
          body: 'reply',
        }),
      ).rejects.toThrow(NotFoundException);

      expect(mockCommentModel.db.startSession).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if parent comment is not found', async () => {
      const parentQuery = createSessionQuery(null);

      mockCommentModel.findById.mockReturnValue(parentQuery);

      await expect(
        service.createReply(validPostId, validCommentId, validAuthorId, {
          body: 'reply',
        }),
      ).rejects.toThrow(NotFoundException);

      expect(parentQuery.session).toHaveBeenCalledWith(mockSession);

      expect(mockSession.endSession).toHaveBeenCalledTimes(1);
    });

    it('should throw BadRequestException if parent belongs to another post', async () => {
      const differentPostId = '66e138fc29094e137127e4e9';

      const parentComment = {
        _id: new Types.ObjectId(validCommentId),

        postId: new Types.ObjectId(differentPostId),

        parentCommentId: null,
      };

      mockCommentModel.findById.mockReturnValue(
        createSessionQuery(parentComment),
      );

      await expect(
        service.createReply(validPostId, validCommentId, validAuthorId, {
          body: 'reply',
        }),
      ).rejects.toThrow(
        new BadRequestException('Parent comment does not belong to this post'),
      );

      expect(mockSession.endSession).toHaveBeenCalledTimes(1);
    });

    it('should flatten reply-to-reply into a sibling under the root comment with mentionedUserId', async () => {
      const existingReply = {
        _id: new Types.ObjectId(validReplyId),

        postId: new Types.ObjectId(validPostId),

        authorId: new Types.ObjectId(validAuthorId),

        parentCommentId: new Types.ObjectId(validCommentId),
      };

      mockCommentModel.findById.mockReturnValue(
        createSessionQuery(existingReply),
      );

      const flattenedReplyData = {
        _id: new Types.ObjectId('66e138fc29094e137127e4e5'),

        postId: new Types.ObjectId(validPostId),

        authorId: new Types.ObjectId('66e138fc29094e137127e4e6'),

        parentCommentId: new Types.ObjectId(validCommentId),

        mentionedUserId: new Types.ObjectId(validAuthorId),

        body: 'nested reply',
      };

      mockCommentModel.create.mockResolvedValue([flattenedReplyData]);

      const result = await service.createReply(
        validPostId,
        validReplyId,
        '66e138fc29094e137127e4e6',
        {
          body: 'nested reply',
        },
      );

      expect(mockCommentModel.create).toHaveBeenCalledWith(
        [
          {
            postId: expect.any(Types.ObjectId),

            authorId: expect.any(Types.ObjectId),

            parentCommentId: existingReply.parentCommentId,

            mentionedUserId: existingReply.authorId,

            body: 'nested reply',
          },
        ],
        {
          session: mockSession,
        },
      );

      expect(result).toEqual(flattenedReplyData);

      expect(mockSession.endSession).toHaveBeenCalledTimes(1);
    });

    it('should create a reply and update both counters using the same session', async () => {
      const parentComment = {
        _id: new Types.ObjectId(validCommentId),

        postId: new Types.ObjectId(validPostId),

        parentCommentId: null,
      };

      mockCommentModel.findById.mockReturnValue(
        createSessionQuery(parentComment),
      );

      const replyData = {
        _id: new Types.ObjectId(validReplyId),

        postId: new Types.ObjectId(validPostId),

        authorId: new Types.ObjectId(validAuthorId),

        parentCommentId: parentComment._id,

        mentionedUserId: null,

        body: 'Valid reply',
      };

      mockCommentModel.create.mockResolvedValue([replyData]);

      const result = await service.createReply(
        validPostId,
        validCommentId,
        validAuthorId,
        {
          body: 'Valid reply',
        },
      );

      expect(mockCommentModel.create).toHaveBeenCalledWith(
        [
          {
            postId: expect.any(Types.ObjectId),

            authorId: expect.any(Types.ObjectId),

            parentCommentId: parentComment._id,

            mentionedUserId: null,

            body: 'Valid reply',
          },
        ],
        {
          session: mockSession,
        },
      );

      expect(mockPostsService.incrementCommentCount).toHaveBeenCalledWith(
        validPostId,
        mockSession,
      );

      expect(mockUsersService.incrementCommentsCount).toHaveBeenCalledWith(
        validAuthorId,
        mockSession,
      );

      expect(result).toEqual(replyData);

      expect(mockSession.endSession).toHaveBeenCalledTimes(1);
    });
  });

  /*
  |--------------------------------------------------------------------------
  | Get Comment Tree
  |--------------------------------------------------------------------------
  */

  describe('findCommentsByPost', () => {
    it('should return nested tree hierarchy for comments and replies', async () => {
      const rootComment = {
        _id: new Types.ObjectId(validCommentId),

        postId: new Types.ObjectId(validPostId),

        authorId: {
          name: 'Alice',
          headline: 'Engineer',
          avatarUrl: null,
        },

        parentCommentId: null,

        body: 'Root Comment',

        createdAt: new Date(),

        updatedAt: new Date(),
      };

      const olderReply = {
        _id: new Types.ObjectId(validReplyId),

        postId: new Types.ObjectId(validPostId),

        authorId: {
          name: 'Bob',
          headline: 'Designer',
          avatarUrl: null,
        },

        parentCommentId: rootComment._id,

        body: 'Older Reply',

        createdAt: new Date('2026-01-01T10:00:00Z'),

        updatedAt: new Date('2026-01-01T10:00:00Z'),
      };

      const newerReplyId = '66e138fc29094e137127e4e4';
      const newerReply = {
        _id: new Types.ObjectId(newerReplyId),

        postId: new Types.ObjectId(validPostId),

        authorId: {
          name: 'Charlie',
          headline: 'Dev',
          avatarUrl: null,
        },

        parentCommentId: rootComment._id,

        body: 'Newer Reply',

        createdAt: new Date('2026-01-01T11:00:00Z'),

        updatedAt: new Date('2026-01-01T11:00:00Z'),
      };

      const mockQuery = {
        sort: vi.fn().mockReturnThis(),

        populate: vi.fn().mockReturnThis(),

        exec: vi.fn().mockResolvedValue([rootComment, newerReply, olderReply]),
      };

      mockCommentModel.find.mockReturnValue(mockQuery);

      const tree = await service.findCommentsByPost(validPostId);

      expect(tree).toHaveLength(1);

      expect(tree[0].id).toBe(validCommentId);

      expect(tree[0].replies).toHaveLength(2);

      // Oldest reply at top of reply stack
      expect(tree[0].replies[0].id).toBe(validReplyId);
      expect(tree[0].replies[0].body).toBe('Older Reply');

      // Latest reply at bottom of reply stack
      expect(tree[0].replies[1].id).toBe(newerReplyId);
      expect(tree[0].replies[1].body).toBe('Newer Reply');
    });
  });

  /*
  |--------------------------------------------------------------------------
  | Delete Comment
  |--------------------------------------------------------------------------
  */

  describe('deleteComment', () => {
    it('should delete one reply and decrement counters inside the transaction', async () => {
      const replyComment = {
        _id: new Types.ObjectId(validReplyId),

        postId: new Types.ObjectId(validPostId),

        authorId: new Types.ObjectId(validAuthorId),

        parentCommentId: new Types.ObjectId(validCommentId),
      };

      const findQuery = createSessionQuery(replyComment);

      mockCommentModel.findById.mockReturnValue(findQuery);

      const deleteQuery = {
        session: vi.fn().mockReturnThis(),

        exec: vi.fn().mockResolvedValue({
          deletedCount: 1,
        }),
      };

      mockCommentModel.deleteOne.mockReturnValue(deleteQuery);

      const result = await service.deleteComment(validReplyId);

      expect(findQuery.session).toHaveBeenCalledWith(mockSession);

      expect(deleteQuery.session).toHaveBeenCalledWith(mockSession);

      expect(mockPostsService.decrementCommentCount).toHaveBeenCalledWith(
        validPostId,
        1,
        mockSession,
      );

      expect(mockUsersService.decrementCommentsCount).toHaveBeenCalledWith(
        validAuthorId,
        1,
        mockSession,
      );

      expect(result.deletedCount).toBe(1);

      expect(mockSession.endSession).toHaveBeenCalledTimes(1);
    });

    it('should delete root comment and all replies and decrement each author correctly', async () => {
      const replyAuthorId = '66e138fc29094e137127e4e5';

      const rootComment = {
        _id: new Types.ObjectId(validCommentId),

        postId: new Types.ObjectId(validPostId),

        authorId: new Types.ObjectId(validAuthorId),

        parentCommentId: null,
      };

      const replyOne = {
        _id: new Types.ObjectId(validReplyId),

        postId: new Types.ObjectId(validPostId),

        authorId: new Types.ObjectId(replyAuthorId),

        parentCommentId: rootComment._id,
      };

      const secondReplyId = '66e138fc29094e137127e4e6';

      const replyTwo = {
        _id: new Types.ObjectId(secondReplyId),

        postId: new Types.ObjectId(validPostId),

        authorId: new Types.ObjectId(replyAuthorId),

        parentCommentId: rootComment._id,
      };

      const threadItems = [rootComment, replyOne, replyTwo];

      const findRootQuery = createSessionQuery(rootComment);

      mockCommentModel.findById.mockReturnValue(findRootQuery);

      const findThreadQuery = createSessionQuery(threadItems);

      mockCommentModel.find.mockReturnValue(findThreadQuery);

      const deleteManyQuery = {
        session: vi.fn().mockReturnThis(),

        exec: vi.fn().mockResolvedValue({
          deletedCount: 3,
        }),
      };

      mockCommentModel.deleteMany.mockReturnValue(deleteManyQuery);

      const result = await service.deleteComment(validCommentId);

      expect(findThreadQuery.session).toHaveBeenCalledWith(mockSession);

      expect(deleteManyQuery.session).toHaveBeenCalledWith(mockSession);

      /*
       * 3 comments disappeared from the Post.
       */
      expect(mockPostsService.decrementCommentCount).toHaveBeenCalledWith(
        validPostId,
        3,
        mockSession,
      );

      /*
       * Root author lost one comment.
       */
      expect(mockUsersService.decrementCommentsCount).toHaveBeenCalledWith(
        validAuthorId,
        1,
        mockSession,
      );

      /*
       * Reply author wrote two replies,
       * therefore loses two comments.
       */
      expect(mockUsersService.decrementCommentsCount).toHaveBeenCalledWith(
        replyAuthorId,
        2,
        mockSession,
      );

      expect(result.deletedCount).toBe(3);

      expect(mockSession.endSession).toHaveBeenCalledTimes(1);
    });

    it('should fail transaction if the complete thread was not deleted', async () => {
      const rootComment = {
        _id: new Types.ObjectId(validCommentId),

        postId: new Types.ObjectId(validPostId),

        authorId: new Types.ObjectId(validAuthorId),

        parentCommentId: null,
      };

      const replyComment = {
        _id: new Types.ObjectId(validReplyId),

        postId: new Types.ObjectId(validPostId),

        authorId: new Types.ObjectId(validAuthorId),

        parentCommentId: rootComment._id,
      };

      mockCommentModel.findById.mockReturnValue(
        createSessionQuery(rootComment),
      );

      mockCommentModel.find.mockReturnValue(
        createSessionQuery([rootComment, replyComment]),
      );

      mockCommentModel.deleteMany.mockReturnValue({
        session: vi.fn().mockReturnThis(),

        /*
         * We expected 2 deletions,
         * but MongoDB reports only 1.
         */
        exec: vi.fn().mockResolvedValue({
          deletedCount: 1,
        }),
      });

      await expect(service.deleteComment(validCommentId)).rejects.toThrow(
        'Comment thread changed during deletion',
      );

      /*
       * Counters must not be updated after detecting
       * the inconsistent delete result.
       */
      expect(mockPostsService.decrementCommentCount).not.toHaveBeenCalled();

      expect(mockUsersService.decrementCommentsCount).not.toHaveBeenCalled();

      expect(mockSession.endSession).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when comment does not exist', async () => {
      mockCommentModel.findById.mockReturnValue(createSessionQuery(null));

      await expect(service.deleteComment(validCommentId)).rejects.toThrow(
        NotFoundException,
      );

      expect(mockSession.endSession).toHaveBeenCalledTimes(1);
    });
  });

  /*
  |--------------------------------------------------------------------------
  | Find Comment By ID
  |--------------------------------------------------------------------------
  */

  describe('findCommentByIdOrThrow', () => {
    it('should throw NotFoundException on invalid ObjectId', async () => {
      await expect(
        service.findCommentByIdOrThrow('invalid-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when comment is not found', async () => {
      mockCommentModel.findById.mockReturnValue({
        exec: vi.fn().mockResolvedValue(null),
      });

      await expect(
        service.findCommentByIdOrThrow(validCommentId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return comment document when found', async () => {
      const mockDoc = {
        _id: validCommentId,
        body: 'Hello',
      };

      mockCommentModel.findById.mockReturnValue({
        exec: vi.fn().mockResolvedValue(mockDoc),
      });

      const result = await service.findCommentByIdOrThrow(validCommentId);

      expect(result).toEqual(mockDoc);
    });
  });

  /*
  |--------------------------------------------------------------------------
  | updateComment
  |--------------------------------------------------------------------------
  */

  describe('updateComment', () => {
    it('should throw NotFoundException on invalid commentId', async () => {
      await expect(
        service.updateComment('invalid-id', validAuthorId, { body: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not author of the comment', async () => {
      const mockDoc = {
        _id: validCommentId,
        authorId: { toString: () => 'different-user-id' },
        body: 'Old text',
        save: vi.fn(),
      };

      mockCommentModel.findById.mockReturnValue({
        exec: vi.fn().mockResolvedValue(mockDoc),
      });

      await expect(
        service.updateComment(validCommentId, validAuthorId, { body: 'New text' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should successfully update comment body and return updated document', async () => {
      const mockDoc = {
        _id: validCommentId,
        authorId: { toString: () => validAuthorId },
        body: 'Old text',
        save: vi.fn().mockResolvedValue(undefined),
      };

      mockCommentModel.findById.mockReturnValue({
        exec: vi.fn().mockResolvedValue(mockDoc),
      });

      const result = await service.updateComment(validCommentId, validAuthorId, {
        body: 'New updated text',
      });

      expect(mockDoc.body).toBe('New updated text');
      expect(mockDoc.save).toHaveBeenCalled();
      expect(result).toEqual(mockDoc);
    });
  });
});
