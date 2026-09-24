import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsMongoId } from 'class-validator';

import type {
  ReactionTargetType,
  ReactionType,
} from '../schemas/reaction.schema.js';

export class ToggleReactionDto {
  @ApiProperty({
    example: 'post',
    enum: ['post', 'comment'],
    description: 'Type of target being reacted to',
  })
  @IsIn(['post', 'comment'], {
    message: 'targetType must be either "post" or "comment"',
  })
  targetType!: ReactionTargetType;

  @ApiProperty({
    example: '68d38b2b00e4b3a0e5441234',
    description: 'MongoDB ObjectId of the post or comment',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsMongoId({
    message: 'targetId must be a valid MongoDB ObjectId',
  })
  targetId!: string;

  @ApiProperty({
    example: 'like',
    enum: ['like', 'dislike'],
    description: 'Reaction type',
  })
  @IsIn(['like', 'dislike'], {
    message: 'type must be either "like" or "dislike"',
  })
  type!: ReactionType;
}
