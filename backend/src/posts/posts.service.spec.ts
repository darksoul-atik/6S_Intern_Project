import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PostsService } from './posts.service.js';
import type { UsersService } from '../users/users.service.js';

describe('PostsService', () => {
  let service: PostsService;
  let mockPostModel: any;
  let mockUsersService: Partial<UsersService>;

  beforeEach(() => {
    function MockModel(this: any, dto: any) {
      Object.assign(this, dto);
      this._id = '66e138fc29094e137127e4e0';
      this.save = vi.fn().mockResolvedValue(this);
      this.populate = vi.fn().mockResolvedValue(this);
      this.deleteOne = vi.fn().mockResolvedValue({ deletedCount: 1 });
    }

    mockPostModel = MockModel;
    mockPostModel.findOne = vi.fn();
    mockPostModel.findById = vi.fn();
    mockPostModel.find = vi.fn();
    mockPostModel.countDocuments = vi.fn();
    mockPostModel.deleteMany = vi.fn();

    mockUsersService = {
      incrementPostsCount: vi.fn().mockResolvedValue(undefined),
      decrementPostsCount: vi.fn().mockResolvedValue(undefined),
    };

    service = new PostsService(mockPostModel as any, mockUsersService as UsersService);
  });

  describe('ID Validation', () => {
    it('should throw NotFoundException on non-24-character hexadecimal IDs', async () => {
      await expect(service.findAnyPostByIdOrThrow('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findActivePostByIdOrThrow('12345')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createPost', () => {
    it('should create a post, increment user post count, and return canonical post', async () => {
      const authorId = '66e138fc29094e137127e4e1';
      const dto = { title: 'Test Post', body: 'Test content for post body' };

      const mockSaved = {
        _id: '66e138fc29094e137127e4e0',
        authorId,
        title: dto.title,
        body: dto.body,
        commentCount: 0,
        reactionCounts: { like: 0, dislike: 0 },
        populate: vi.fn().mockResolvedValue({
          _id: '66e138fc29094e137127e4e0',
          title: dto.title,
        }),
      };

      mockPostModel.findOne.mockReturnValue({
        exec: vi.fn().mockResolvedValue(mockSaved),
      });

      const result = await service.createPost(authorId, dto);

      expect(result).toBeDefined();
      expect(mockUsersService.incrementPostsCount).toHaveBeenCalledWith(authorId);
    });
  });

  describe('findActivePostByIdOrThrow', () => {
    it('should return active post when deletedAt does not exist', async () => {
      const postId = '66e138fc29094e137127e4e0';
      const mockPost = { _id: postId, title: 'Active Post' };

      mockPostModel.findOne.mockReturnValue({
        exec: vi.fn().mockResolvedValue(mockPost),
      });

      const result = await service.findActivePostByIdOrThrow(postId);
      expect(result).toEqual(mockPost);
      expect(mockPostModel.findOne).toHaveBeenCalledWith({
        _id: postId,
        deletedAt: { $exists: false },
      });
    });

    it('should throw NotFoundException if post not found or is soft-deleted', async () => {
      const postId = '66e138fc29094e137127e4e0';
      mockPostModel.findOne.mockReturnValue({
        exec: vi.fn().mockResolvedValue(null),
      });

      await expect(service.findActivePostByIdOrThrow(postId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findDeletedPostByIdOrThrow', () => {
    it('should return soft-deleted post when deletedAt exists', async () => {
      const postId = '66e138fc29094e137127e4e0';
      const mockPost = { _id: postId, deletedAt: new Date() };

      mockPostModel.findOne.mockReturnValue({
        exec: vi.fn().mockResolvedValue(mockPost),
      });

      const result = await service.findDeletedPostByIdOrThrow(postId);
      expect(result).toEqual(mockPost);
    });

    it('should throw BadRequestException if post exists but is active', async () => {
      const postId = '66e138fc29094e137127e4e0';

      mockPostModel.findOne.mockReturnValue({
        exec: vi.fn().mockResolvedValue(null),
      });
      mockPostModel.findById.mockReturnValue({
        exec: vi.fn().mockResolvedValue({ _id: postId, title: 'Active Post' }),
      });

      await expect(service.findDeletedPostByIdOrThrow(postId)).rejects.toThrow(
        new BadRequestException('Post must be soft-deleted first'),
      );
    });

    it('should throw NotFoundException if post does not exist at all', async () => {
      const postId = '66e138fc29094e137127e4e0';

      mockPostModel.findOne.mockReturnValue({
        exec: vi.fn().mockResolvedValue(null),
      });
      mockPostModel.findById.mockReturnValue({
        exec: vi.fn().mockResolvedValue(null),
      });

      await expect(service.findDeletedPostByIdOrThrow(postId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAllPosts', () => {
    it('should filter out soft-deleted posts and return paginated results', async () => {
      const mockPosts = [{ _id: '66e138fc29094e137127e4e0', title: 'Post 1' }];

      mockPostModel.countDocuments.mockReturnValue({
        exec: vi.fn().mockResolvedValue(1),
      });

      const mockExec = vi.fn().mockResolvedValue(mockPosts);
      const mockPopulate = vi.fn().mockReturnValue({ exec: mockExec });
      const mockLimit = vi.fn().mockReturnValue({ populate: mockPopulate });
      const mockSkip = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockSort = vi.fn().mockReturnValue({ skip: mockSkip });

      mockPostModel.find.mockReturnValue({ sort: mockSort });

      const result = await service.findAllPosts({ page: 1, limit: 10 });

      expect(result.posts).toEqual(mockPosts);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
      expect(mockPostModel.countDocuments).toHaveBeenCalledWith({
        deletedAt: { $exists: false },
      });
      expect(mockPostModel.find).toHaveBeenCalledWith({
        deletedAt: { $exists: false },
      });
    });
  });

  describe('updatePost', () => {
    it('should update title and body of active post', async () => {
      const postId = '66e138fc29094e137127e4e0';
      const mockPost: any = {
        _id: postId,
        title: 'Old Title',
        body: 'Old Body',
        save: vi.fn().mockResolvedValue(true),
        populate: vi.fn().mockResolvedValue(true),
      };

      mockPostModel.findOne.mockReturnValue({
        exec: vi.fn().mockResolvedValue(mockPost),
      });

      const updated = await service.updatePost(postId, {
        title: 'New Title',
        body: 'New Body',
      });

      expect(mockPost.title).toBe('New Title');
      expect(mockPost.body).toBe('New Body');
      expect(mockPost.save).toHaveBeenCalled();
    });
  });

  describe('removePost (soft delete)', () => {
    it('should mark post with deletedAt and deletedBy, decrementing user post count', async () => {
      const postId = '66e138fc29094e137127e4e0';
      const authorId = '66e138fc29094e137127e4e1';
      const adminId = '66e138fc29094e137127e4e9';

      const mockPost: any = {
        _id: postId,
        authorId: { toString: () => authorId },
        save: vi.fn().mockResolvedValue(true),
      };

      mockPostModel.findOne.mockReturnValue({
        exec: vi.fn().mockResolvedValue(mockPost),
      });

      const result = await service.removePost(postId, adminId);

      expect(result.id).toBe(postId);
      expect(result.message).toBe('Post soft-deleted successfully');
      expect(mockPost.deletedAt).toBeInstanceOf(Date);
      expect(mockPost.deletedBy).toBeDefined();
      expect(mockUsersService.decrementPostsCount).toHaveBeenCalledWith(authorId);
    });
  });

  describe('restorePost', () => {
    it('should restore soft-deleted post within 5 days and re-increment user post count', async () => {
      const postId = '66e138fc29094e137127e4e0';
      const authorId = '66e138fc29094e137127e4e1';

      const mockPost: any = {
        _id: postId,
        authorId: { toString: () => authorId },
        deletedAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        deletedBy: 'some-user',
        save: vi.fn().mockResolvedValue(true),
        populate: vi.fn().mockResolvedValue(true),
      };

      mockPostModel.findOne.mockReturnValue({
        exec: vi.fn().mockResolvedValue(mockPost),
      });

      const result = await service.restorePost(postId);

      expect(mockPost.deletedAt).toBeUndefined();
      expect(mockPost.deletedBy).toBeUndefined();
      expect(mockPost.save).toHaveBeenCalled();
      expect(mockUsersService.incrementPostsCount).toHaveBeenCalledWith(authorId);
    });

    it('should throw BadRequestException if restore window has expired (>5 days)', async () => {
      const postId = '66e138fc29094e137127e4e0';
      const authorId = '66e138fc29094e137127e4e1';

      const mockPost: any = {
        _id: postId,
        authorId: { toString: () => authorId },
        deletedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6), // 6 days ago
      };

      mockPostModel.findOne.mockReturnValue({
        exec: vi.fn().mockResolvedValue(mockPost),
      });

      await expect(service.restorePost(postId)).rejects.toThrow(
        new BadRequestException(
          'Post can no longer be restored because the 5-day restore period has expired',
        ),
      );
    });
  });

  describe('permanentlyDeletePost', () => {
    it('should permanently delete an already soft-deleted post without touching postsCount', async () => {
      const postId = '66e138fc29094e137127e4e0';
      const mockPost: any = {
        _id: postId,
        deletedAt: new Date(),
        deleteOne: vi.fn().mockResolvedValue({ deletedCount: 1 }),
      };

      mockPostModel.findOne.mockReturnValue({
        exec: vi.fn().mockResolvedValue(mockPost),
      });

      const result = await service.permanentlyDeletePost(postId);

      expect(result.id).toBe(postId);
      expect(result.message).toBe('Post permanently deleted successfully');
      expect(mockPost.deleteOne).toHaveBeenCalled();
      expect(mockUsersService.decrementPostsCount).not.toHaveBeenCalled();
    });
  });

  describe('purgeExpiredDeletedPosts', () => {
    it('should delete posts whose deletedAt is older than 5 days', async () => {
      mockPostModel.deleteMany.mockReturnValue({
        exec: vi.fn().mockResolvedValue({ deletedCount: 5 }),
      });

      const count = await service.purgeExpiredDeletedPosts();

      expect(count).toBe(5);
      expect(mockPostModel.deleteMany).toHaveBeenCalled();
    });
  });
});
