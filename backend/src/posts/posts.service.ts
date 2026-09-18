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

  async findAllPosts(query: {
    page: number;
    limit: number;
  }): Promise<PaginatedPostsResult> {
    /*
     * Total number of posts.
     *
     * This is used to calculate pagination metadata.
     */
    const total = await this.postModel.countDocuments().exec();

    /*
     * Main feed query.
     *
     * Sort:
     * newest posts first.
     *
     * _id is used as the secondary sort field
     * so ordering stays deterministic when two
     * posts have the same createdAt value.
     */
    const posts = await this.postModel
      .find()
      .sort({
        createdAt: -1,
        _id: -1,
      })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)

      /*
       * Populate author information in bulk.
       *
       * Only public/safe fields are selected.
       *
       * email, role and passwordHash are NOT returned.
       */
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

      /*
       * Keep the same pagination convention already
       * used by UsersService.
       *
       * An empty database still reports page 1
       * as the only page.
       */
      totalPages: Math.ceil(total / query.limit) || 1,
    };
  }
}
