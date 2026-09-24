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
    const session = await this.connection.startSession();

    try {
      let result: ToggleReactionResult | undefined;

      await session.withTransaction(async () => {
        result = await this.toggleInsideTransaction(userId, dto, session);
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

    await this.ensureTargetIsActive(dto.targetType, targetObjectId, session);

    const existingReaction = await this.reactionModel
      .findOne({
        userId: userObjectId,
        targetType: dto.targetType,
        targetId: targetObjectId,
      })
      .session(session)
      .exec();

    /*
     * CASE 1:
     * No reaction yet -> create.
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
        dto.targetType,
        targetObjectId,
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
     * CASE 2:
     * Same reaction again -> remove.
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
        dto.targetType,
        targetObjectId,
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
     * CASE 3:
     * Opposite reaction -> switch.
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
      dto.targetType,
      targetObjectId,
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

  private async ensureTargetIsActive(
    targetType: ReactionTargetType,
    targetId: Types.ObjectId,
    session: ClientSession,
  ): Promise<void> {
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

      return;
    }

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
  }

  private async updateTargetCounters(
    targetType: ReactionTargetType,
    targetId: Types.ObjectId,
    changes: Partial<Record<ReactionType, number>>,
    session: ClientSession,
  ): Promise<{
    like: number;
    dislike: number;
  }> {
    const increment: Record<string, number> = {};

    for (const [type, amount] of Object.entries(changes)) {
      increment[`reactionCounts.${type}`] = amount;
    }

    if (targetType === 'post') {
      const post = await this.postModel
        .findOneAndUpdate(
          {
            _id: targetId,
            deletedAt: {
              $exists: false,
            },
          },
          {
            $inc: increment,
          },
          {
            new: true,
            session,
          },
        )
        .select('reactionCounts')
        .exec();

      if (!post) {
        throw new NotFoundException(
          `Post with ID '${targetId.toString()}' not found`,
        );
      }

      return {
        like: post.reactionCounts.like,
        dislike: post.reactionCounts.dislike,
      };
    }

    const comment = await this.commentModel
      .findOneAndUpdate(
        {
          _id: targetId,
        },
        {
          $inc: increment,
        },
        {
          new: true,
          session,
        },
      )
      .select('reactionCounts')
      .exec();

    if (!comment) {
      throw new NotFoundException(
        `Comment with ID '${targetId.toString()}' not found`,
      );
    }

    return {
      like: comment.reactionCounts.like,
      dislike: comment.reactionCounts.dislike,
    };
  }
}
