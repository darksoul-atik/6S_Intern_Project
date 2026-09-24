import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument, Types } from 'mongoose';

import { User } from '../../users/schemas/user.schema.js';

export type ReactionDocument = HydratedDocument<Reaction>;

export type ReactionTargetType = 'post' | 'comment';
export type ReactionType = 'like' | 'dislike';

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
export class Reaction {
  @Prop({
    type: 'ObjectId',
    ref: User.name,
    required: true,
  })
  userId!: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['post', 'comment'],
    required: true,
  })
  targetType!: ReactionTargetType;

  @Prop({
    type: 'ObjectId',
    required: true,
  })
  targetId!: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['like', 'dislike'],
    required: true,
  })
  type!: ReactionType;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ReactionSchema = SchemaFactory.createForClass(Reaction);

/*
|--------------------------------------------------------------------------
| One Reaction Per User Per Target
|--------------------------------------------------------------------------
*/

ReactionSchema.index(
  {
    userId: 1,
    targetType: 1,
    targetId: 1,
  },
  {
    unique: true,
  },
);
