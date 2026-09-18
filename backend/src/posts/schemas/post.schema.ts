import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema, type HydratedDocument, type Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema.js';

export type PostDocument = HydratedDocument<Post>;

/*
|--------------------------------------------------------------------------
| Reaction Counts
|--------------------------------------------------------------------------
|
| Day 7:
| Both counters start at 0.
|
| Day 11:
| The reaction system will update these values.
|--------------------------------------------------------------------------
*/

@Schema({
  _id: false,
})
export class ReactionCounts {
  @Prop({ type: Number, default: 0 })
  like!: number;

  @Prop({ type: Number, default: 0 })
  dislike!: number;
}

export const ReactionCountsSchema =
  SchemaFactory.createForClass(ReactionCounts);

/*
|--------------------------------------------------------------------------
| Post document
|--------------------------------------------------------------------------
*/

@Schema({
  timestamps: true,
  toJSON: {
    transform: (_doc: unknown, ret: Record<string, unknown>) => {
      if (ret._id) {
        ret.id = ret._id.toString();
      }

      return ret;
    },
  },
})
export class Post {
  /*
   * User who created the post.
   *
   * This is assigned by the backend from the authenticated user.
   * The client will never be allowed to choose authorId.
   */
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: User.name,
    required: true,
  })
  authorId!: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 200,
  })
  title!: string;

  @Prop({
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 20000,
  })
  body!: string;

  /*
   * Day 9 will maintain this value when comments
   * are created/deleted.
   */
  @Prop({
    type: Number,
    default: 0,
    min: 0,
  })
  commentCount!: number;

  /*
   * Day 11 will maintain these values.
   */
  @Prop({
    type: ReactionCountsSchema,
    default: () => ({
      like: 0,
      dislike: 0,
    }),
  })
  reactionCounts!: ReactionCounts;

  createdAt?: Date;
  updatedAt?: Date;
}

export const PostSchema = SchemaFactory.createForClass(Post);

/*
|--------------------------------------------------------------------------
| Feed index
|--------------------------------------------------------------------------
|
| Main Day 7 list:
|
| GET /posts
| newest first
|
| _id is the secondary sort field so posts with the same createdAt
| still have deterministic ordering.
|--------------------------------------------------------------------------
*/

PostSchema.index({
  createdAt: -1,
  _id: -1,
});
