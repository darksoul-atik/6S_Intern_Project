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
   * Updated whenever comments or replies
   * are created or deleted.
   *
   * Also used as the primary sort field
   * for the Most Discussed feed.
   */
  @Prop({
    type: Number,
    default: 0,
    min: 0,
  })
  commentCount!: number;

  /*
   * Updated whenever reactions change.
   *
   * like/dislike counts are also used
   * when calculating the Top rankScore.
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
| Main / Latest Feed Index
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
*/

PostSchema.index({
  deletedAt: 1,
});

/*
|--------------------------------------------------------------------------
| Most Discussed Feed Index
|--------------------------------------------------------------------------
*/

PostSchema.index({
  commentCount: -1,
  createdAt: -1,
  _id: -1,
});

/*
|--------------------------------------------------------------------------
| Full-text Search Index
|--------------------------------------------------------------------------
|
| Searches both post title and body.
|
| Title has a higher weight because a search term appearing
| in the title is usually more relevant than the same term
| appearing only in the body.
|--------------------------------------------------------------------------
*/

PostSchema.index(
  {
    title: 'text',
    body: 'text',
  },
  {
    weights: {
      title: 5,
      body: 1,
    },
    name: 'post_text_search',
  },
);
