import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types, type ClientSession, type Model } from 'mongoose';

import { Comment, type CommentDocument } from './schemas/comment.schema.js';

import { CreateCommentDto } from './dto/create-comment.dto.js';
import { UpdateCommentDto } from './dto/update-comment.dto.js';
import { PostsService } from '../posts/posts.service.js';
import { UsersService } from '../users/users.service.js';

export interface CommentTreeItem {
  id: string;
  postId: string;
  authorId: unknown;
  parentCommentId: string | null;
  body: string;
  reactionCounts?: {
    like: number;
    dislike: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
  replies: CommentTreeItem[];
}

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name)
    private readonly commentModel: Model<CommentDocument>,

    private readonly postsService: PostsService,

    private readonly usersService: UsersService,
  ) {}

  /*
  |--------------------------------------------------------------------------
  | Run MongoDB Transaction
  |--------------------------------------------------------------------------
  */

  private async runInTransaction<T>(
    operation: (session?: ClientSession) => Promise<T>,
  ): Promise<T> {
    const db = (this.commentModel as any).db;
    if (!db || typeof db.startSession !== "function") {
      return operation(undefined);
    }

    let session: ClientSession;
    try {
      session = await db.startSession();
    } catch {
      return operation(undefined);
    }

    try {
      return await session.withTransaction(async () => {
        return operation(session);
      });
    } catch (err: any) {
      if (
        err?.message?.includes("replica set") ||
        err?.message?.includes("Transactions are not supported") ||
        err?.message?.includes("Transaction numbers")
      ) {
        return operation(undefined);
      }
      throw err;
    } finally {
      await session.endSession();
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Create Top-Level Comment
  |--------------------------------------------------------------------------
  */

  async createComment(
    postId: string,
    authorId: string,
    dto: CreateCommentDto,
  ): Promise<CommentDocument> {
    /*
     * Early validation.
     *
     * The incrementCommentCount() call inside the transaction
     * also verifies that the post is still active.
     */
    await this.postsService.findActivePostByIdOrThrow(postId);

    return this.runInTransaction(async (session) => {
      let comment: CommentDocument;

      if (session) {
        /*
         * Model.create() receives an array so that the
         * Mongoose session is definitely applied.
         */
        const [created] = await this.commentModel.create(
          [
            {
              postId: new Types.ObjectId(postId),
              authorId: new Types.ObjectId(authorId),
              parentCommentId: null,
              body: dto.body,
            },
          ],
          {
            session,
          },
        );
        comment = created;

        /*
         * Both counters participate in the SAME transaction.
         */
        await this.postsService.incrementCommentCount(postId, session);
        await this.usersService.incrementCommentsCount(authorId, session);
      } else {
        comment = await this.commentModel.create({
          postId: new Types.ObjectId(postId),
          authorId: new Types.ObjectId(authorId),
          parentCommentId: null,
          body: dto.body,
        });

        await this.postsService.incrementCommentCount(postId);
        await this.usersService.incrementCommentsCount(authorId);
      }

      return comment;
    });
  }

  /*
  |--------------------------------------------------------------------------
  | Create Reply
  |--------------------------------------------------------------------------
  */

  async createReply(
    postId: string,
    parentCommentId: string,
    authorId: string,
    dto: CreateCommentDto,
  ): Promise<CommentDocument> {
    await this.postsService.findActivePostByIdOrThrow(postId);

    this.validateCommentId(parentCommentId);

    return this.runInTransaction(async (session) => {
      /*
       * Read the parent inside the transaction.
       */
      const parentQuery = this.commentModel.findById(parentCommentId);
      if (session && typeof (parentQuery as any).session === "function") {
        parentQuery.session(session);
      }
      const parent = await parentQuery.exec();

      if (!parent) {
        throw new NotFoundException(
          `Comment with ID '${parentCommentId}' not found`,
        );
      }

      /*
       * Parent must belong to the same Post.
       */
      if (parent.postId.toString() !== postId) {
        throw new BadRequestException(
          "Parent comment does not belong to this post",
        );
      }

      /*
       * Maximum reply depth = 1.
       *
       * A reply already has parentCommentId,
       * therefore it cannot receive another reply.
       */
      if (parent.parentCommentId) {
        throw new BadRequestException(
          "Maximum reply depth exceeded. Replies cannot have child replies",
        );
      }

      let reply: CommentDocument;

      if (session) {
        const [created] = await this.commentModel.create(
          [
            {
              postId: new Types.ObjectId(postId),
              authorId: new Types.ObjectId(authorId),
              parentCommentId: parent._id,
              body: dto.body,
            },
          ],
          {
            session,
          },
        );
        reply = created;

        await this.postsService.incrementCommentCount(postId, session);
        await this.usersService.incrementCommentsCount(authorId, session);
      } else {
        reply = await this.commentModel.create({
          postId: new Types.ObjectId(postId),
          authorId: new Types.ObjectId(authorId),
          parentCommentId: parent._id,
          body: dto.body,
        });

        await this.postsService.incrementCommentCount(postId);
        await this.usersService.incrementCommentsCount(authorId);
      }

      return reply;
    });
  }

  /*
  |--------------------------------------------------------------------------
  | Get Comment Tree
  |--------------------------------------------------------------------------
  */

  async findCommentsByPost(postId: string): Promise<CommentTreeItem[]> {
    await this.postsService.findActivePostByIdOrThrow(postId);

    const comments = await this.commentModel
      .find({
        postId: new Types.ObjectId(postId),
      })
      .sort({
        createdAt: -1,
        _id: -1,
      })
      .populate({
        path: "authorId",
        select: "name headline avatarUrl",
      })
      .exec();

    const roots: CommentTreeItem[] = [];

    const rootMap = new Map<string, CommentTreeItem>();

    /*
     * First pass:
     * collect root comments.
     */
    for (const comment of comments) {
      if (comment.parentCommentId) {
        continue;
      }

      const item = this.toTreeItem(comment);

      roots.push(item);

      rootMap.set(comment._id.toString(), item);
    }

    /*
     * Second pass:
     * attach replies to their root comments.
     */
    for (const comment of comments) {
      if (!comment.parentCommentId) {
        continue;
      }

      const parent = rootMap.get(comment.parentCommentId.toString());

      if (parent) {
        parent.replies.push(this.toTreeItem(comment));
      }
    }

    /*
     * Third pass:
     * sort replies chronologically (ascending) so the latest reply
     * appears at the bottom of the reply stack.
     */
    for (const root of roots) {
      root.replies.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeA - timeB;
      });
    }

    return roots;
  }

  /*
  |--------------------------------------------------------------------------
  | Delete Comment
  |--------------------------------------------------------------------------
  |
  | Reply:
  | - delete only the reply
  |
  | Root comment:
  | - delete root
  | - delete every reply belonging to it
  |
  | Comment deletion is HARD DELETE.
  |--------------------------------------------------------------------------
  */

  async deleteComment(commentId: string): Promise<{ deletedCount: number }> {
    this.validateCommentId(commentId);

    return this.runInTransaction(async (session) => {
      /*
       * Load the comment inside the transaction.
       */
      const findQuery = this.commentModel.findById(commentId);
      if (session && typeof (findQuery as any).session === "function") {
        findQuery.session(session);
      }
      const comment = await findQuery.exec();

      if (!comment) {
        throw new NotFoundException(`Comment with ID '${commentId}' not found`);
      }

      const postId = comment.postId.toString();

      /*
      |--------------------------------------------------------------------------
      | Reply Delete
      |--------------------------------------------------------------------------
      |
      | Replies cannot have child replies,
      | so deleting a reply removes only one document.
      |--------------------------------------------------------------------------
      */

      if (comment.parentCommentId) {
        const deleteQuery = this.commentModel.deleteOne({
          _id: comment._id,
        });
        if (session && typeof (deleteQuery as any).session === "function") {
          deleteQuery.session(session);
        }
        const result = await deleteQuery.exec();

        if (result.deletedCount === 0) {
          throw new NotFoundException(
            `Comment with ID '${commentId}' not found`,
          );
        }

        if (session) {
          await this.postsService.decrementCommentCount(postId, 1, session);
          await this.usersService.decrementCommentsCount(
            comment.authorId.toString(),
            1,
            session,
          );
        } else {
          await this.postsService.decrementCommentCount(postId);
          await this.usersService.decrementCommentsCount(
            comment.authorId.toString(),
          );
        }

        return {
          deletedCount: 1,
        };
      }

      /*
      |--------------------------------------------------------------------------
      | Root Comment Delete
      |--------------------------------------------------------------------------
      |
      | Deleting a root comment deletes the whole thread.
      |--------------------------------------------------------------------------
      */

      const threadQuery = this.commentModel.find({
        $or: [
          {
            _id: comment._id,
          },
          {
            parentCommentId: comment._id,
          },
        ],
      });
      if (session && typeof (threadQuery as any).session === "function") {
        threadQuery.session(session);
      }
      const thread = await threadQuery.exec();

      /*
       * Count how many comments belong to each author.
       *
       * Example:
       *
       * Parent      -> User A
       * Reply 1     -> User B
       * Reply 2     -> User B
       *
       * authorCounts:
       *
       * User A = 1
       * User B = 2
       */
      const authorCounts = new Map<string, number>();

      for (const item of thread) {
        const itemAuthorId = item.authorId.toString();

        authorCounts.set(
          itemAuthorId,
          (authorCounts.get(itemAuthorId) ?? 0) + 1,
        );
      }

      const deleteManyQuery = this.commentModel.deleteMany({
        _id: {
          $in: thread.map((item) => item._id),
        },
      });
      if (session && typeof (deleteManyQuery as any).session === "function") {
        deleteManyQuery.session(session);
      }
      const result = await deleteManyQuery.exec();

      const deletedCount = result.deletedCount;

      /*
       * Nothing should disappear between the thread
       * lookup and deletion while this transaction
       * is being performed.
       *
       * If something unexpected happens, fail the
       * transaction instead of corrupting counters.
       */
      if (deletedCount !== thread.length) {
        throw new Error("Comment thread changed during deletion");
      }

      if (deletedCount > 0) {
        /*
         * Post counter decreases by the complete
         * number of deleted comments.
         */
        if (session) {
          await this.postsService.decrementCommentCount(
            postId,
            deletedCount,
            session,
          );

          /*
           * Do NOT use Promise.all here.
           *
           * All operations use the same MongoDB session,
           * so perform them sequentially.
           */
          for (const [authorId, count] of authorCounts.entries()) {
            await this.usersService.decrementCommentsCount(
              authorId,
              count,
              session,
            );
          }
        } else {
          await this.postsService.decrementCommentCount(postId, deletedCount);

          await Promise.all(
            Array.from(authorCounts.entries()).map(([authorId, count]) =>
              this.usersService.decrementCommentsCount(authorId, count),
            ),
          );
        }
      }

      return {
        deletedCount,
      };
    });
  }

  /*
  |--------------------------------------------------------------------------
  | Find Comment By ID
  |--------------------------------------------------------------------------
  */

  async findCommentByIdOrThrow(commentId: string): Promise<CommentDocument> {
    this.validateCommentId(commentId);

    const comment = await this.commentModel.findById(commentId).exec();

    if (!comment) {
      throw new NotFoundException(`Comment with ID '${commentId}' not found`);
    }

    return comment;
  }

  /*
  |--------------------------------------------------------------------------
  | Update Comment Or Reply (Author Only)
  |--------------------------------------------------------------------------
  */

  async updateComment(
    commentId: string,
    userId: string,
    dto: UpdateCommentDto,
  ): Promise<CommentDocument> {
    this.validateCommentId(commentId);

    const comment = await this.findCommentByIdOrThrow(commentId);

    if (comment.authorId.toString() !== userId) {
      throw new ForbiddenException(
        'You do not have permission to edit this comment',
      );
    }

    comment.body = dto.body;
    await comment.save();

    return comment;
  }

  /*
  |--------------------------------------------------------------------------
  | Convert Comment To Tree Item
  |--------------------------------------------------------------------------
  */

  private toTreeItem(comment: CommentDocument): CommentTreeItem {
    return {
      id: comment._id.toString(),
      postId: comment.postId.toString(),
      authorId: comment.authorId,
      parentCommentId: comment.parentCommentId?.toString() ?? null,
      body: comment.body,
      reactionCounts: comment.reactionCounts
        ? {
            like: comment.reactionCounts.like,
            dislike: comment.reactionCounts.dislike,
          }
        : { like: 0, dislike: 0 },
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      replies: [],
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Validate Comment ID
  |--------------------------------------------------------------------------
  */

  private validateCommentId(commentId: string): void {
    if (!Types.ObjectId.isValid(commentId)) {
      throw new NotFoundException(`Comment with ID '${commentId}' not found`);
    }
  }
}
