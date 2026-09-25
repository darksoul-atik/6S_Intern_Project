import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import {
  Types,
  type ClientSession,
  type Connection,
  type Model,
} from 'mongoose';

import {
  Reaction,
  type ReactionDocument,
  type ReactionTargetType,
  type ReactionType,
} from './schemas/reaction.schema.js';

import { ToggleReactionDto } from './dto/toggle-reaction.dto.js';

import { Post, type PostDocument } from '../posts/schemas/post.schema.js';

import {
  Comment,
  type CommentDocument,
} from '../comments/schemas/comment.schema.js';

export type ReactionAction = 'created' | 'removed' | 'switched';

export interface ToggleReactionResult {
  action: ReactionAction;
  reaction: ReactionType | null;
  reactionCounts: {
    like: number;
    dislike: number;
  };
}

interface ResolvedTarget {
  targetType: ReactionTargetType;
  targetId: Types.ObjectId;
  parentPostId?: Types.ObjectId;
}

const MAX_CONCURRENCY_ATTEMPTS = 5;

@Injectable()
export class ReactionsService {
  constructor(
    @InjectModel(Reaction.name)
    private readonly reactionModel: Model<ReactionDocument>,

    @InjectModel(Post.name)
    private readonly postModel: Model<PostDocument>,

    @InjectModel(Comment.name)
    private readonly commentModel: Model<CommentDocument>,

    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  async toggleReaction(
    userId: string,
    dto: ToggleReactionDto,
  ): Promise<ToggleReactionResult> {
    for (let attempt = 1; attempt <= MAX_CONCURRENCY_ATTEMPTS; attempt++) {
      try {
        return await this.runToggleTransaction(userId, dto);
      } catch (error) {
        const shouldRetry =
          attempt < MAX_CONCURRENCY_ATTEMPTS &&
          this.isRetryableConcurrencyError(error);

        if (!shouldRetry) {
          throw error;
        }
      }
    }

    throw new Error('Reaction toggle failed after maximum retry attempts');
  }

  private async runToggleTransaction(
    userId: string,
    dto: ToggleReactionDto,
  ): Promise<ToggleReactionResult> {
    const session = await this.connection.startSession();

    try {
      const result = await session.withTransaction(async () => {
        return this.toggleInsideTransaction(userId, dto, session);
      });

      if (!result) {
        throw new Error('Reaction transaction completed without a result');
      }

      return result;
    } finally {
      await session.endSession();
    }
  }

  private async toggleInsideTransaction(
    userId: string,
    dto: ToggleReactionDto,
    session: ClientSession,
  ): Promise<ToggleReactionResult> {
    const userObjectId = new Types.ObjectId(userId);
    const targetObjectId = new Types.ObjectId(dto.targetId);

    /*
     * Validate the target inside the transaction.
     *
     * Post:
     * - must exist
     * - must not be soft-deleted
     *
     * Comment:
     * - must exist
     * - its parent post must still be active
     */
    const target = await this.resolveActiveTarget(
      dto.targetType,
      targetObjectId,
      session,
    );

    /*
     * A unique index guarantees that only one Reaction
     * can exist for:
     *
     * userId + targetType + targetId
     */
    const existingReaction = await this.reactionModel
      .findOne({
        userId: userObjectId,
        targetType: dto.targetType,
        targetId: targetObjectId,
      })
      .session(session)
      .exec();

    /*
     * CASE 1
     *
     * No existing reaction.
     *
     * none + like
     * → create like
     *
     * none + dislike
     * → create dislike
     */
    if (!existingReaction) {
      await this.reactionModel.create(
        [
          {
            userId: userObjectId,
            targetType: dto.targetType,
            targetId: targetObjectId,
            type: dto.type,
          },
        ],
        {
          session,
        },
      );

      const reactionCounts = await this.updateTargetCounters(
        target,
        {
          [dto.type]: 1,
        },
        session,
      );

      return {
        action: 'created',
        reaction: dto.type,
        reactionCounts,
      };
    }

    /*
     * CASE 2
     *
     * Same reaction is sent again.
     *
     * like + like
     * → remove like
     *
     * dislike + dislike
     * → remove dislike
     */
    if (existingReaction.type === dto.type) {
      const deleteResult = await this.reactionModel
        .deleteOne({
          _id: existingReaction._id,
          type: dto.type,
        })
        .session(session)
        .exec();

      if (deleteResult.deletedCount === 0) {
        throw new Error('Reaction changed before it could be removed');
      }

      const reactionCounts = await this.updateTargetCounters(
        target,
        {
          [dto.type]: -1,
        },
        session,
      );

      return {
        action: 'removed',
        reaction: null,
        reactionCounts,
      };
    }

    /*
     * CASE 3
     *
     * Existing reaction is different.
     *
     * like → dislike
     *
     * or
     *
     * dislike → like
     */
    const previousType = existingReaction.type;

    const updateResult = await this.reactionModel
      .updateOne(
        {
          _id: existingReaction._id,
          type: previousType,
        },
        {
          $set: {
            type: dto.type,
          },
        },
        {
          session,
        },
      )
      .exec();

    if (updateResult.modifiedCount === 0) {
      throw new Error('Reaction changed before it could be switched');
    }

    const reactionCounts = await this.updateTargetCounters(
      target,
      {
        [previousType]: -1,
        [dto.type]: 1,
      },
      session,
    );

    return {
      action: 'switched',
      reaction: dto.type,
      reactionCounts,
    };
  }

  private async resolveActiveTarget(
    targetType: ReactionTargetType,
    targetId: Types.ObjectId,
    session: ClientSession,
  ): Promise<ResolvedTarget> {
    /*
     * POST TARGET
     *
     * Active post means deletedAt does not exist.
     */
    if (targetType === 'post') {
      const post = await this.postModel
        .findOne({
          _id: targetId,
          deletedAt: {
            $exists: false,
          },
        })
        .select('_id')
        .session(session)
        .exec();

      if (!post) {
        throw new NotFoundException(
          `Post with ID '${targetId.toString()}' not found`,
        );
      }

      return {
        targetType: 'post',
        targetId,
      };
    }

    /*
     * COMMENT TARGET
     *
     * Comments currently use hard-delete.
     *
     * Therefore:
     *
     * missing Comment = deleted/nonexistent Comment.
     */
    const comment = await this.commentModel
      .findById(targetId)
      .select('postId')
      .session(session)
      .exec();

    if (!comment) {
      throw new NotFoundException(
        `Comment with ID '${targetId.toString()}' not found`,
      );
    }

    /*
     * A Comment cannot be reacted to when its parent
     * Post has been soft-deleted.
     */
    const parentPost = await this.postModel
      .findOne({
        _id: comment.postId,
        deletedAt: {
          $exists: false,
        },
      })
      .select('_id')
      .session(session)
      .exec();

    if (!parentPost) {
      throw new NotFoundException(
        `Comment with ID '${targetId.toString()}' not found`,
      );
    }

    return {
      targetType: 'comment',
      targetId,
      parentPostId: comment.postId,
    };
  }

  private async updateTargetCounters(
    target: ResolvedTarget,
    changes: Partial<Record<ReactionType, number>>,
    session: ClientSession,
  ): Promise<{
    like: number;
    dislike: number;
  }> {
    /*
     * Convert:
     *
     * { like: 1 }
     *
     * into:
     *
     * { "reactionCounts.like": 1 }
     *
     * Or:
     *
     * {
     *   like: -1,
     *   dislike: 1
     * }
     */
    const increment: Record<string, number> = {};

    for (const [type, amount] of Object.entries(changes)) {
      increment[`reactionCounts.${type}`] = amount;
    }

    /*
     * POST COUNTER UPDATE
     */
    if (target.targetType === 'post') {
      const post = await this.postModel
        .findOneAndUpdate(
          {
            _id: target.targetId,

            /*
             * Check active state again during
             * the actual counter mutation.
             */
            deletedAt: {
              $exists: false,
            },
          },
          {
            $inc: increment,
          },
          {
            returnDocument: 'after',
            session,
          },
        )
        .select('reactionCounts')
        .exec();

      if (!post) {
        throw new NotFoundException(
          `Post with ID '${target.targetId.toString()}' not found`,
        );
      }

      return {
        like: post.reactionCounts.like,
        dislike: post.reactionCounts.dislike,
      };
    }

    /*
     * COMMENT TARGET
     *
     * Verify the parent Post still belongs to the
     * resolved Comment target.
     */
    if (!target.parentPostId) {
      throw new Error('Resolved comment target is missing parentPostId');
    }

    /*
     * Parent Post must still be an active target.
     */
    const parentPost = await this.postModel
      .findOne({
        _id: target.parentPostId,
        deletedAt: {
          $exists: false,
        },
      })
      .select('_id')
      .session(session)
      .exec();

    if (!parentPost) {
      throw new NotFoundException(
        `Comment with ID '${target.targetId.toString()}' not found`,
      );
    }

    /*
     * COMMENT COUNTER UPDATE
     */
    const comment = await this.commentModel
      .findOneAndUpdate(
        {
          _id: target.targetId,
          postId: target.parentPostId,
        },
        {
          $inc: increment,
        },
        {
          returnDocument: 'after',
          session,
        },
      )
      .select('reactionCounts')
      .exec();

    if (!comment) {
      throw new NotFoundException(
        `Comment with ID '${target.targetId.toString()}' not found`,
      );
    }

    return {
      like: comment.reactionCounts.like,
      dislike: comment.reactionCounts.dislike,
    };
  }

  private isRetryableConcurrencyError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const mongoError = error as {
      code?: number;
      errorLabels?: string[];
      hasErrorLabel?: (label: string) => boolean;
    };

    /*
     * Duplicate key.
     *
     * Usually happens when two concurrent requests
     * both initially see no Reaction and both try
     * to create the same unique:
     *
     * userId + targetType + targetId
     */
    if (mongoError.code === 11000) {
      return true;
    }

    /*
     * MongoDB write conflict.
     */
    if (mongoError.code === 112) {
      return true;
    }

    /*
     * MongoDB transaction conflict.
     */
    if (
      typeof mongoError.hasErrorLabel === 'function' &&
      mongoError.hasErrorLabel('TransientTransactionError')
    ) {
      return true;
    }

    return (
      Array.isArray(mongoError.errorLabels) &&
      mongoError.errorLabels.includes('TransientTransactionError')
    );
  }

  async getUserReactions(
    userId: string,
    targetIds?: string[],
    targetType?: ReactionTargetType,
  ): Promise<Record<string, ReactionType>> {
    const filter: Record<string, unknown> = {
      userId: new Types.ObjectId(userId),
    };

    // Keep post and comment reaction lookups separate.
    if (targetType) {
      filter.targetType = targetType;
    }

    // If targetIds was supplied, the query must stay scoped.
    if (targetIds !== undefined) {
      const validObjectIds = targetIds
        .filter((id) => Types.ObjectId.isValid(id))
        .map((id) => new Types.ObjectId(id));

      if (validObjectIds.length === 0) {
        return {};
      }

      filter.targetId = {
        $in: validObjectIds,
      };
    }

    const reactions = await this.reactionModel
      .find(filter)
      .select('targetId type')
      .exec();

    const result: Record<string, ReactionType> = {};

    for (const reaction of reactions) {
      result[reaction.targetId.toString()] = reaction.type;
    }

    return result;
  }
}
