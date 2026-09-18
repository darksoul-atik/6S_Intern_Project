import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';

import { Post, type PostDocument } from './schemas/post.schema.js';

import { CreatePostDto } from './dto/create-post.dto.js';
import { UpdatePostDto } from './dto/update-post.dto.js';

import { UsersService } from '../users/users.service.js';

export interface PaginatedPostsResult {
  posts: PostDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DeletePostResult {
  id: string;
  message: string;
}

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name)
    private readonly postModel: Model<PostDocument>,

    private readonly usersService: UsersService,
  ) {}

  /*
  |--------------------------------------------------------------------------
  | Validate Post ID
  |--------------------------------------------------------------------------
  */

  private validatePostId(postId: string): void {
    if (!/^[0-9a-fA-F]{24}$/.test(postId)) {
      throw new NotFoundException(`Post with ID '${postId}' not found`);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Find ANY Post
  |--------------------------------------------------------------------------
  |
  | Can find:
  |
  | - active posts
  | - soft-deleted posts
  |
  | This is useful for authorization because the
  | owner/admin guard must also work on restore and
  | permanent-delete routes.
  |--------------------------------------------------------------------------
  */

  async findAnyPostByIdOrThrow(postId: string): Promise<PostDocument> {
    this.validatePostId(postId);

    const post = await this.postModel.findById(postId).exec();

    if (!post) {
      throw new NotFoundException(`Post with ID '${postId}' not found`);
    }

    return post;
  }

  /*
  |--------------------------------------------------------------------------
  | Find ACTIVE Post
  |--------------------------------------------------------------------------
  |
  | Used by normal application operations:
  |
  | GET /posts/:id
  | PATCH /posts/:id
  | DELETE /posts/:id
  |
  | A soft-deleted post behaves like it does not
  | exist to normal application queries.
  |--------------------------------------------------------------------------
  */

  async findActivePostByIdOrThrow(postId: string): Promise<PostDocument> {
    const post = await this.findAnyPostByIdOrThrow(postId);

    if (post.deletedAt) {
      throw new NotFoundException(`Post with ID '${postId}' not found`);
    }

    return post;
  }

  /*
  |--------------------------------------------------------------------------
  | Find SOFT-DELETED Post
  |--------------------------------------------------------------------------
  |
  | Used by:
  |
  | POST /posts/:id/restore
  | DELETE /posts/:id/permanent
  |--------------------------------------------------------------------------
  */

  async findDeletedPostByIdOrThrow(postId: string): Promise<PostDocument> {
    const post = await this.findAnyPostByIdOrThrow(postId);

    if (!post.deletedAt) {
      throw new BadRequestException('Post must be soft-deleted first');
    }

    return post;
  }

  /*
  |--------------------------------------------------------------------------
  | Temporary Compatibility Method
  |--------------------------------------------------------------------------
  |
  | Existing Day 7 code still calls this method.
  |
  | Until the remaining soft-delete migration steps
  | are completed, treat this as an ACTIVE-post lookup.
  |
  | We can remove this compatibility method after
  | SD3/SD4/SD8 are finished.
  |--------------------------------------------------------------------------
  */

  async findPostByIdOrThrow(postId: string): Promise<PostDocument> {
    return this.findActivePostByIdOrThrow(postId);
  }

  /*
  |--------------------------------------------------------------------------
  | Create Post
  |--------------------------------------------------------------------------
  */

  async createPost(
    authorId: string,
    dto: CreatePostDto,
  ): Promise<PostDocument> {
    const createdPost = new this.postModel({
      authorId,
      title: dto.title,
      body: dto.body,
      commentCount: 0,
      reactionCounts: {
        like: 0,
        dislike: 0,
      },
    });

    const savedPost = await createdPost.save();

    await this.usersService.incrementPostsCount(authorId);

    return savedPost;
  }

  /*
  |--------------------------------------------------------------------------
  | List Posts
  |--------------------------------------------------------------------------
  |
  | SD3 will update this query so deleted posts
  | are excluded from the feed.
  |--------------------------------------------------------------------------
  */

  async findAllPosts(query: {
    page: number;
    limit: number;
  }): Promise<PaginatedPostsResult> {
    const total = await this.postModel.countDocuments().exec();

    const posts = await this.postModel
      .find()
      .sort({
        createdAt: -1,
        _id: -1,
      })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .populate({
        path: 'authorId',
        select: 'name headline avatarUrl',
      })
      .exec();

    return {
      posts,
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit) || 1,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Get One Post
  |--------------------------------------------------------------------------
  */

  async findOnePost(postId: string): Promise<PostDocument> {
    const post = await this.findPostByIdOrThrow(postId);

    await post.populate({
      path: 'authorId',
      select: 'name headline avatarUrl',
    });

    return post;
  }

  /*
  |--------------------------------------------------------------------------
  | Update Post
  |--------------------------------------------------------------------------
  */

  async updatePost(postId: string, dto: UpdatePostDto): Promise<PostDocument> {
    const post = await this.findPostByIdOrThrow(postId);

    if (dto.title !== undefined) {
      post.title = dto.title;
    }

    if (dto.body !== undefined) {
      post.body = dto.body;
    }

    await post.save();

    return this.findOnePost(postId);
  }

  /*
  |--------------------------------------------------------------------------
  | Existing Delete Logic
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  |
  | This is still the OLD hard-delete implementation.
  |
  | SD4 will replace this with soft-delete behavior.
  | Do not test DELETE /posts/:id yet.
  |--------------------------------------------------------------------------
  */

  async removePost(postId: string): Promise<DeletePostResult> {
    const post = await this.findPostByIdOrThrow(postId);

    const authorId = post.authorId.toString();

    await post.deleteOne();

    await this.usersService.decrementPostsCount(authorId);

    return {
      id: postId,
      message: 'Post deleted successfully',
    };
  }
}
