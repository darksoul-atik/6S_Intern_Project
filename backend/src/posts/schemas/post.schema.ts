import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument, Types } from 'mongoose';

import { User } from '../../users/schemas/user.schema.js';

export type PostDocument = HydratedDocument<Post>;

/*
|--------------------------------------------------------------------------
| Reaction Counts
|--------------------------------------------------------------------------
*/

@Schema({
  _id: false,
})
export class ReactionCounts {
  @Prop({
    type: Number,
    default: 0,
    min: 0,
  })
  like!: number;

  @Prop({
    type: Number,
    default: 0,
    min: 0,
  })
  dislike!: number;
}

export const ReactionCountsSchema =
  SchemaFactory.createForClass(ReactionCounts);

/*
|--------------------------------------------------------------------------
| Post Schema
|--------------------------------------------------------------------------
*/

@Schema({
  timestamps: true,

  toJSON: {
    transform: (_doc, ret: Record<string, unknown>) => {
      if (ret._id) {
        ret.id = ret._id.toString();
        delete ret._id;
      }
      delete ret.__v;

      return ret;
    },
  },
})
export class Post {
  /*
   * Original author of the post.
   */
  @Prop({
    type: 'ObjectId',
    ref: User.name,
    required: true,
  })
  authorId!: Types.ObjectId;

  /*
   * Post title.
   */
  @Prop({
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 200,
  })
  title!: string;

  /*
   * Main post content.
   */
  @Prop({
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 20000,
  })
  body!: string;

  /*
   * Day 9 will update this when comments
   * are created or deleted.
   */
  @Prop({
    type: Number,
    default: 0,
    min: 0,
  })
  commentCount!: number;

  /*
   * Day 11 will update these counters.
   */
  @Prop({
    type: ReactionCountsSchema,
    default: () => ({
      like: 0,
      dislike: 0,
    }),
  })
  reactionCounts!: ReactionCounts;

  /*
   * Soft-delete timestamp.
   *
   * If this field does not exist,
   * the post is active.
   *
   * If this field exists,
   * the post is considered deleted.
   */
  @Prop({
    type: Date,
    default: undefined,
  })
  deletedAt?: Date;

  /*
   * User who performed the deletion.
   *
   * This can be:
   * - the original author
   * - an admin
   */
  @Prop({
    type: 'ObjectId',
    ref: User.name,
    default: undefined,
  })
  deletedBy?: Types.ObjectId;

  /*
   * Automatically created by:
   * timestamps: true
   */
  createdAt?: Date;

  /*
   * Automatically created by:
   * timestamps: true
   */
  updatedAt?: Date;
}

export const PostSchema = SchemaFactory.createForClass(Post);

/*
|--------------------------------------------------------------------------
| Main Feed Index
|--------------------------------------------------------------------------
|
| Used for:
|
| GET /posts
|
| newest-first ordering
|--------------------------------------------------------------------------
*/

PostSchema.index({
  createdAt: -1,
  _id: -1,
});

/*
|--------------------------------------------------------------------------
| Soft-delete Cleanup Index
|--------------------------------------------------------------------------
|
| Used by the scheduled cleanup job.
|
| The job will query posts where:
|
| deletedAt <= fiveDaysAgo
|--------------------------------------------------------------------------
*/

PostSchema.index({
  deletedAt: 1,
});
