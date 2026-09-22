import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

import { CommentsService } from './comments.service.js';
import type { PostsService } from '../posts/posts.service.js';
import type { UsersService } from '../users/users.service.js';

describe('CommentsService', () => {
  let service: CommentsService;
  let mockCommentModel: any;
  let mockPostsService: Partial<PostsService>;
  let mockUsersService: Partial<UsersService>;

  const validPostId = '66e138fc29094e137127e4e0';
  const validAuthorId = '66e138fc29094e137127e4e1';
  const validCommentId = '66e138fc29094e137127e4e2';
  const validReplyId = '66e138fc29094e137127e4e3';

  beforeEach(() => {
    mockCommentModel = {
      create: vi.fn(),
      findById: vi.fn(),
      find: vi.fn(),
      deleteOne: vi.fn(),
      deleteMany: vi.fn(),
    };

    mockPostsService = {
      findActivePostByIdOrThrow: vi.fn().mockResolvedValue({ _id: validPostId }),
      incrementCommentCount: vi.fn().mockResolvedValue(undefined),
      decrementCommentCount: vi.fn().mockResolvedValue(undefined),
    };

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

  describe('createComment', () => {
    it('should create a top-level comment and increment post & user counters', async () => {
      const dto = { body: 'Top-level comment body' };
      const createdComment = {
        _id: new Types.ObjectId(validCommentId),
        postId: new Types.ObjectId(validPostId),
        authorId: new Types.ObjectId(validAuthorId),
        parentCommentId: null,
        body: dto.body,
      };

      mockCommentModel.create.mockResolvedValue(createdComment);

      const result = await service.createComment(validPostId, validAuthorId, dto);

      expect(mockPostsService.findActivePostByIdOrThrow).toHaveBeenCalledWith(validPostId);
      expect(mockCommentModel.create).toHaveBeenCalledWith({
        postId: expect.any(Types.ObjectId),
        authorId: expect.any(Types.ObjectId),
        parentCommentId: null,
        body: dto.body,
      });
      expect(mockPostsService.incrementCommentCount).toHaveBeenCalledWith(validPostId);
      expect(mockUsersService.incrementCommentsCount).toHaveBeenCalledWith(validAuthorId);
      expect(result).toEqual(createdComment);
    });

    it('should propagate error if post does not exist', async () => {
      vi.mocked(mockPostsService.findActivePostByIdOrThrow!).mockRejectedValue(
        new NotFoundException('Post not found'),
      );

      await expect(
        service.createComment(validPostId, validAuthorId, { body: 'test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createReply', () => {
    it('should throw NotFoundException on invalid parentCommentId', async () => {
      await expect(
        service.createReply(validPostId, 'invalid-id', validAuthorId, { body: 'reply' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if parent comment is not found', async () => {
      mockCommentModel.findById.mockReturnValue({
        exec: vi.fn().mockResolvedValue(null),
      });

      await expect(
        service.createReply(validPostId, validCommentId, validAuthorId, { body: 'reply' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if parent comment belongs to a different post', async () => {
      const differentPostId = '66e138fc29094e137127e4e9';
      mockCommentModel.findById.mockReturnValue({
        exec: vi.fn().mockResolvedValue({
          _id: new Types.ObjectId(validCommentId),
          postId: new Types.ObjectId(differentPostId),
          parentCommentId: null,
        }),
      });

      await expect(
        service.createReply(validPostId, validCommentId, validAuthorId, { body: 'reply' }),
      ).rejects.toThrow(new BadRequestException('Parent comment does not belong to this post'));
    });

    it('should throw BadRequestException if parent comment is already a reply (depth limit exceeded)', async () => {
      mockCommentModel.findById.mockReturnValue({
        exec: vi.fn().mockResolvedValue({
          _id: new Types.ObjectId(validReplyId),
          postId: new Types.ObjectId(validPostId),
          parentCommentId: new Types.ObjectId(validCommentId),
        }),
      });

      await expect(
        service.createReply(validPostId, validReplyId, validAuthorId, { body: 'nested reply' }),
      ).rejects.toThrow(
        new BadRequestException('Maximum reply depth exceeded. Replies cannot have child replies'),
      );
    });

    it('should successfully create a reply and increment counters', async () => {
      const parentComment = {
        _id: new Types.ObjectId(validCommentId),
        postId: new Types.ObjectId(validPostId),
        parentCommentId: null,
      };

      mockCommentModel.findById.mockReturnValue({
        exec: vi.fn().mockResolvedValue(parentComment),
      });

      const replyData = {
        _id: new Types.ObjectId(validReplyId),
        postId: new Types.ObjectId(validPostId),
        authorId: new Types.ObjectId(validAuthorId),
        parentCommentId: parentComment._id,
        body: 'Valid reply',
      };

      mockCommentModel.create.mockResolvedValue(replyData);

      const result = await service.createReply(validPostId, validCommentId, validAuthorId, {
        body: 'Valid reply',
      });

      expect(mockPostsService.incrementCommentCount).toHaveBeenCalledWith(validPostId);
      expect(mockUsersService.incrementCommentsCount).toHaveBeenCalledWith(validAuthorId);
      expect(result).toEqual(replyData);
    });
  });

  describe('findCommentsByPost', () => {
    it('should return nested tree hierarchy for comments and replies', async () => {
      const rootComment = {
        _id: new Types.ObjectId(validCommentId),
        postId: new Types.ObjectId(validPostId),
        authorId: { name: 'Alice', headline: 'Engineer', avatarUrl: null },
        parentCommentId: null,
        body: 'Root Comment',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const replyComment = {
        _id: new Types.ObjectId(validReplyId),
        postId: new Types.ObjectId(validPostId),
        authorId: { name: 'Bob', headline: 'Designer', avatarUrl: null },
        parentCommentId: rootComment._id,
        body: 'Reply to Root',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockQuery = {
        sort: vi.fn().mockReturnThis(),
        populate: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue([rootComment, replyComment]),
      };

      mockCommentModel.find.mockReturnValue(mockQuery);

      const tree = await service.findCommentsByPost(validPostId);

      expect(tree).toHaveLength(1);
      expect(tree[0].id).toBe(validCommentId);
      expect(tree[0].replies).toHaveLength(1);
      expect(tree[0].replies[0].id).toBe(validReplyId);
      expect(tree[0].replies[0].parentCommentId).toBe(validCommentId);
    });
  });

  describe('deleteComment', () => {
    it('should delete a single reply and decrement post & user counters by 1', async () => {
      const replyComment = {
        _id: new Types.ObjectId(validReplyId),
        postId: new Types.ObjectId(validPostId),
        authorId: new Types.ObjectId(validAuthorId),
        parentCommentId: new Types.ObjectId(validCommentId),
      };

      mockCommentModel.findById.mockReturnValue({
        exec: vi.fn().mockResolvedValue(replyComment),
      });

      mockCommentModel.deleteOne.mockReturnValue({
        exec: vi.fn().mockResolvedValue({ deletedCount: 1 }),
      });

      const res = await service.deleteComment(validReplyId);

      expect(res.deletedCount).toBe(1);
      expect(mockPostsService.decrementCommentCount).toHaveBeenCalledWith(validPostId);
      expect(mockUsersService.decrementCommentsCount).toHaveBeenCalledWith(validAuthorId);
    });

    it('should delete main comment and all its replies, decrementing counters accordingly', async () => {
      const rootComment = {
        _id: new Types.ObjectId(validCommentId),
        postId: new Types.ObjectId(validPostId),
        authorId: new Types.ObjectId(validAuthorId),
        parentCommentId: null,
      };

      const replyAuthorId = '66e138fc29094e137127e4e5';
      const threadItems = [
        rootComment,
        {
          _id: new Types.ObjectId(validReplyId),
          postId: new Types.ObjectId(validPostId),
          authorId: new Types.ObjectId(replyAuthorId),
          parentCommentId: rootComment._id,
        },
      ];

      mockCommentModel.findById.mockReturnValue({
        exec: vi.fn().mockResolvedValue(rootComment),
      });

      mockCommentModel.find.mockReturnValue({
        exec: vi.fn().mockResolvedValue(threadItems),
      });

      mockCommentModel.deleteMany.mockReturnValue({
        exec: vi.fn().mockResolvedValue({ deletedCount: 2 }),
      });

      const res = await service.deleteComment(validCommentId);

      expect(res.deletedCount).toBe(2);
      expect(mockPostsService.decrementCommentCount).toHaveBeenCalledWith(validPostId, 2);
      expect(mockUsersService.decrementCommentsCount).toHaveBeenCalledWith(validAuthorId, 1);
      expect(mockUsersService.decrementCommentsCount).toHaveBeenCalledWith(replyAuthorId, 1);
    });
  });

  describe('findCommentByIdOrThrow', () => {
    it('should throw NotFoundException on invalid ObjectId', async () => {
      await expect(service.findCommentByIdOrThrow('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when comment is not found', async () => {
      mockCommentModel.findById.mockReturnValue({
        exec: vi.fn().mockResolvedValue(null),
      });

      await expect(service.findCommentByIdOrThrow(validCommentId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return comment document when found', async () => {
      const mockDoc = { _id: validCommentId, body: 'Hello' };
      mockCommentModel.findById.mockReturnValue({
        exec: vi.fn().mockResolvedValue(mockDoc),
      });

      const res = await service.findCommentByIdOrThrow(validCommentId);
      expect(res).toEqual(mockDoc);
    });
  });
});
