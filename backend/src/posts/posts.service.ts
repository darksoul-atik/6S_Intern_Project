import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';

import { Post, type PostDocument } from './schemas/post.schema.js';

import { CreatePostDto } from './dto/create-post.dto.js';
import { UsersService } from '../users/users.service.js';

export interface PaginatedPostsResult {
  posts: PostDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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
  | Find Post or Throw 404
  |--------------------------------------------------------------------------
  */

  async findPostByIdOrThrow(postId: string): Promise<PostDocument> {
    if (!/^[0-9a-fA-F]{24}$/.test(postId)) {
      throw new NotFoundException(`Post with ID '${postId}' not found`);
    }

    const post = await this.postModel.findById(postId).exec();

    if (!post) {
      throw new NotFoundException(`Post with ID '${postId}' not found`);
    }

    return post;
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
    /*
     * Reuse our existing ID validation + not-found logic.
     */
    const post = await this.findPostByIdOrThrow(postId);

    /*
     * Populate only safe/public author fields.
     *
     * Do NOT expose:
     * email
     * role
     * passwordHash
     */
    await post.populate({
      path: 'authorId',
      select: 'name headline avatarUrl',
    });

    return post;
  }
}
