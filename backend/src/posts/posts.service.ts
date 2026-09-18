import { Injectable, NotFoundException } from '@nestjs/common';
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
  | Delete Post
  |--------------------------------------------------------------------------
  */

  async removePost(postId: string): Promise<DeletePostResult> {
    /*
     * Find the actual post first.
     *
     * We need its authorId before deleting it because
     * User.postsCount belongs to the original author.
     */
    const post = await this.findPostByIdOrThrow(postId);

    const authorId = post.authorId.toString();

    /*
     * Day 7 decision:
     *
     * Posts are hard deleted.
     */
    await post.deleteOne();

    /*
     * Decrease the ORIGINAL AUTHOR'S post count.
     *
     * This is important when an admin deletes
     * another user's post.
     */
    await this.usersService.decrementPostsCount(authorId);

    return {
      id: postId,
      message: 'Post deleted successfully',
    };
  }
}
