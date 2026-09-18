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
  | Can find both:
  | - active
  | - soft-deleted
  |
  | Used mainly for ownership / lifecycle operations.
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
  | Soft-deleted posts are excluded directly
  | from the MongoDB query.
  |--------------------------------------------------------------------------
  */

  async findActivePostByIdOrThrow(postId: string): Promise<PostDocument> {
    this.validatePostId(postId);

    const post = await this.postModel
      .findOne({
        _id: postId,
        deletedAt: {
          $exists: false,
        },
      })
      .exec();

    if (!post) {
      throw new NotFoundException(`Post with ID '${postId}' not found`);
    }

    return post;
  }

  /*
  |--------------------------------------------------------------------------
  | Find SOFT-DELETED Post
  |--------------------------------------------------------------------------
  */

  async findDeletedPostByIdOrThrow(postId: string): Promise<PostDocument> {
    this.validatePostId(postId);

    const post = await this.postModel
      .findOne({
        _id: postId,
        deletedAt: {
          $exists: true,
        },
      })
      .exec();

    if (!post) {
      /*
       * If the Post exists but is active, give the
       * lifecycle-specific error.
       */
      const existingPost = await this.postModel.findById(postId).exec();

      if (existingPost) {
        throw new BadRequestException('Post must be soft-deleted first');
      }

      throw new NotFoundException(`Post with ID '${postId}' not found`);
    }

    return post;
  }

  /*
  |--------------------------------------------------------------------------
  | Temporary Compatibility Method
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

    /*
     * Return the canonical Post with the same
     * safe author data used by list/details.
     */
    return this.findOnePost(savedPost._id.toString());
  }

  /*
  |--------------------------------------------------------------------------
  | List ACTIVE Posts
  |--------------------------------------------------------------------------
  */

  async findAllPosts(query: {
    page: number;
    limit: number;
  }): Promise<PaginatedPostsResult> {
    /*
     * Every normal feed query must ignore
     * soft-deleted posts.
     */
    const activePostFilter = {
      deletedAt: {
        $exists: false,
      },
    };

    /*
     * Two database operations are necessary:
     *
     * 1. count matching posts
     * 2. fetch requested page
     *
     * Run them together.
     */
    const [total, posts] = await Promise.all([
      this.postModel.countDocuments(activePostFilter).exec(),

      this.postModel
        .find(activePostFilter)
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
        .exec(),
    ]);

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
  | Get One ACTIVE Post
  |--------------------------------------------------------------------------
  */

  async findOnePost(postId: string): Promise<PostDocument> {
    const post = await this.findActivePostByIdOrThrow(postId);

    await post.populate({
      path: 'authorId',
      select: 'name headline avatarUrl',
    });

    return post;
  }

  /*
  |--------------------------------------------------------------------------
  | Update ACTIVE Post
  |--------------------------------------------------------------------------
  */

  async updatePost(postId: string, dto: UpdatePostDto): Promise<PostDocument> {
    /*
     * Deleted posts cannot be edited through
     * the normal PATCH endpoint.
     */
    const post = await this.findActivePostByIdOrThrow(postId);

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
  | OLD DELETE LOGIC — temporary
  |--------------------------------------------------------------------------
  |
  | SD4 replaces this with soft deletion.
  |
  | Do not test DELETE /posts/:id yet.
  |--------------------------------------------------------------------------
  */

  async removePost(postId: string): Promise<DeletePostResult> {
    const post = await this.findActivePostByIdOrThrow(postId);

    const authorId = post.authorId.toString();

    await post.deleteOne();

    await this.usersService.decrementPostsCount(authorId);

    return {
      id: postId,
      message: 'Post deleted successfully',
    };
  }
}
