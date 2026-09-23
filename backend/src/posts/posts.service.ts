import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types, type ClientSession, type Model } from 'mongoose';

import { Post, type PostDocument } from './schemas/post.schema.js';

import { CreatePostDto } from './dto/create-post.dto.js';
import { UpdatePostDto } from './dto/update-post.dto.js';

import { UsersService } from '../users/users.service.js';
import {
  POPULATE_POST_LIST_AUTHOR,
  POPULATE_POST_DETAIL_AUTHOR,
} from './posts.constants.js';

export * from './posts.constants.js';

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

    return this.findOnePost(savedPost._id.toString());
  }

  /*
  |--------------------------------------------------------------------------
  | List ACTIVE Posts
  |--------------------------------------------------------------------------
  |
  | Order: newest to oldest (createdAt: -1, _id: -1).
  | Filters out soft-deleted posts.
  | Uses lean author projection excluding avatarUrl.
  |--------------------------------------------------------------------------
  */

  async findAllPosts(query: {
    page: number;
    limit: number;
  }): Promise<PaginatedPostsResult> {
    const activePostFilter = {
      deletedAt: {
        $exists: false,
      },
    };

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
        .populate(POPULATE_POST_LIST_AUTHOR)
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

    await post.populate(POPULATE_POST_DETAIL_AUTHOR);

    return post;
  }

  /*
  |--------------------------------------------------------------------------
  | Update ACTIVE Post
  |--------------------------------------------------------------------------
  */

  async updatePost(postId: string, dto: UpdatePostDto): Promise<PostDocument> {
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
  | Soft Delete Post
  |--------------------------------------------------------------------------
  |
  | DELETE /posts/:id
  |
  | Does NOT physically remove the document.
  |
  | Instead:
  | - deletedAt = current time
  | - deletedBy = user/admin who performed deletion
  | - author's postsCount decreases by 1
  |--------------------------------------------------------------------------
  */

  /*
  |--------------------------------------------------------------------------
  | Restore Soft-Deleted Post
  |--------------------------------------------------------------------------
  |
  | A post may only be restored within 5 days
  | of deletedAt.
  |
  | Restore:
  | - clears deletedAt
  | - clears deletedBy
  | - increments the original author's postsCount
  |--------------------------------------------------------------------------
  */

  async restorePost(postId: string): Promise<PostDocument> {
    /*
     * Only a soft-deleted Post can be restored.
     */
    const post = await this.findDeletedPostByIdOrThrow(postId);

    /*
     * findDeletedPostByIdOrThrow() guarantees
     * deletedAt exists, but keep this safety check
     * for TypeScript/runtime clarity.
     */
    if (!post.deletedAt) {
      throw new BadRequestException('Post is not currently deleted');
    }

    /*
     * Restore window = 5 days.
     */
    const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

    const deletionAge = Date.now() - post.deletedAt.getTime();

    /*
     * Even if the scheduled cleanup job has not
     * physically removed the Post yet, restoring
     * after 5 days is forbidden.
     */
    if (deletionAge > FIVE_DAYS_MS) {
      throw new BadRequestException(
        'Post can no longer be restored because the 5-day restore period has expired',
      );
    }

    const authorId = post.authorId.toString();

    /*
     * Remove soft-delete information.
     */
    post.deletedAt = undefined;
    post.deletedBy = undefined;

    await post.save();

    /*
     * The Post is visible again,
     * so restore the author's visible postsCount.
     */
    await this.usersService.incrementPostsCount(authorId);

    /*
     * Return the restored Post using the normal
     * active-post response with safe author data.
     */
    return this.findOnePost(postId);
  }

  /*
  |--------------------------------------------------------------------------
  | Permanently Delete Soft-Deleted Post
  |--------------------------------------------------------------------------
  |
  | This endpoint is irreversible.
  |
  | Approved rule:
  | - the post MUST already be soft-deleted
  | - active posts cannot be permanently deleted directly
  | - postsCount does NOT change here because it was already
  |   decremented during soft delete
  |--------------------------------------------------------------------------
  */

  async permanentlyDeletePost(postId: string): Promise<DeletePostResult> {
    /*
     * Only a soft-deleted Post may be permanently removed.
     */
    const post = await this.findDeletedPostByIdOrThrow(postId);

    /*
     * Physically remove the document from MongoDB.
     */
    await post.deleteOne();

    /*
     * Do NOT decrement postsCount here.
     *
     * It was already decremented when the post
     * was soft-deleted.
     */
    return {
      id: postId,
      message: 'Post permanently deleted successfully',
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Purge Expired Soft-Deleted Posts
  |--------------------------------------------------------------------------
  |
  | Permanently deletes posts whose deletedAt
  | is older than 5 days.
  |
  | This method is called by the scheduled cleanup task.
  |--------------------------------------------------------------------------
  */

  async purgeExpiredDeletedPosts(): Promise<number> {
    const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

    /*
     * Anything deleted before this cutoff
     * has passed the 5-day restore window.
     */
    const cutoffDate = new Date(Date.now() - FIVE_DAYS_MS);

    const result = await this.postModel
      .deleteMany({
        deletedAt: {
          $lte: cutoffDate,
        },
      })
      .exec();

    /*
     * Return how many Posts were physically removed.
     *
     * Useful for logs / scheduled task feedback.
     */
    return result.deletedCount;
  }

  async removePost(
    postId: string,
    deletedByUserId: string,
  ): Promise<DeletePostResult> {
    /*
     * Only ACTIVE posts can be soft-deleted.
     *
     * Trying to delete the same post again will
     * therefore return 404 and will not decrement
     * postsCount twice.
     */
    const post = await this.findActivePostByIdOrThrow(postId);

    const authorId = post.authorId.toString();

    /*
     * Keep the Post in MongoDB but mark it deleted.
     */
    post.deletedAt = new Date();

    post.deletedBy = new Types.ObjectId(deletedByUserId);

    await post.save();

    /*
     * The post is now hidden from the user's
     * visible/public posts, so decrease postsCount.
     */
    await this.usersService.decrementPostsCount(authorId);

    return {
      id: postId,
      message: 'Post soft-deleted successfully',
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Increment Comment Count
  |--------------------------------------------------------------------------
  */

  async incrementCommentCount(
    postId: string,
    session?: ClientSession,
  ): Promise<void> {
    this.validatePostId(postId);

    const result = await this.postModel
      .updateOne(
        {
          _id: postId,
          deletedAt: { $exists: false },
        },
        {
          $inc: { commentCount: 1 },
        },
        {
          session,
        },
      )
      .exec();

    if (result.matchedCount === 0) {
      throw new NotFoundException(`Post with ID '${postId}' not found`);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Decrement Comment Count
  |--------------------------------------------------------------------------
  */

  async decrementCommentCount(
    postId: string,
    amount = 1,
    session?: ClientSession,
  ): Promise<void> {
    this.validatePostId(postId);

    const result = await this.postModel
      .updateOne(
        {
          _id: postId,
          deletedAt: { $exists: false },
        },
        {
          $inc: { commentCount: -amount },
        },
        {
          session,
        },
      )
      .exec();

    if (result.matchedCount === 0) {
      throw new NotFoundException(`Post with ID '${postId}' not found`);
    }
  }
}
