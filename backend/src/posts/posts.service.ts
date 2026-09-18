import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';

import { Post, type PostDocument } from './schemas/post.schema.js';

import { CreatePostDto } from './dto/create-post.dto.js';
import { UsersService } from '../users/users.service.js';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name)
    private readonly postModel: Model<PostDocument>,

    private readonly usersService: UsersService,
  ) {}

  async findPostByIdOrThrow(postId: string): Promise<PostDocument> {
    /*
     * MongoDB ObjectIds must be 24 hexadecimal characters.
     *
     * We check this before calling MongoDB so malformed IDs
     * return our normal 404 instead of causing a Mongoose error.
     */
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

      /*
       * These already default to 0 in the schema.
       *
       * We do not accept them from the client.
       */
      commentCount: 0,

      reactionCounts: {
        like: 0,
        dislike: 0,
      },
    });

    const savedPost = await createdPost.save();

    /*
     * Keep the already-existing User.postsCount
     * synchronized with actual created posts.
     */
    await this.usersService.incrementPostsCount(authorId);

    return savedPost;
  }
}
