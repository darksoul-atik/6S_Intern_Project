import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument, Types } from 'mongoose';

import { Post } from '../../posts/schemas/post.schema.js';
import { User } from '../../users/schemas/user.schema.js';

export type CommentDocument = HydratedDocument<Comment>;

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
export class Comment {
  @Prop({
    type: 'ObjectId',
    ref: Post.name,
    required: true,
  })
  postId!: Types.ObjectId;

  @Prop({
    type: 'ObjectId',
    ref: User.name,
    required: true,
  })
  authorId!: Types.ObjectId;

  // null = main comment, ObjectId = reply
  @Prop({
    type: 'ObjectId',
    ref: 'Comment',
    default: null,
  })
  parentCommentId?: Types.ObjectId | null;

  @Prop({
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 5000,
  })
  body!: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

CommentSchema.index({
  postId: 1,
  parentCommentId: 1,
});

CommentSchema.index({
  postId: 1,
  createdAt: 1,
  _id: 1,
});
