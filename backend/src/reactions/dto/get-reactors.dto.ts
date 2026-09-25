import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsMongoId, IsOptional, Max, Min } from 'class-validator';

import type {
  ReactionTargetType,
  ReactionType,
} from '../schemas/reaction.schema.js';

export class GetReactorsQueryDto {
  @ApiProperty({
    example: 'post',
    enum: ['post', 'comment'],
    description: 'Type of target (post or comment)',
  })
  @IsIn(['post', 'comment'], {
    message: 'targetType must be either "post" or "comment"',
  })
  targetType!: ReactionTargetType;

  @ApiProperty({
    example: '68d38b2b00e4b3a0e5441234',
    description: 'MongoDB ObjectId of the target post or comment',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsMongoId({
    message: 'targetId must be a valid MongoDB ObjectId',
  })
  targetId!: string;

  @ApiPropertyOptional({
    example: 'like',
    enum: ['like', 'dislike'],
    description: 'Optional filter by reaction type',
  })
  @IsOptional()
  @IsIn(['like', 'dislike'], {
    message: 'type must be either "like" or "dislike"',
  })
  type?: ReactionType;

  @ApiPropertyOptional({
    example: 1,
    description: 'Page number (minimum 1)',
    default: 1,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return 1;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? 1 : parsed;
  })
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    example: 20,
    description: 'Number of items per page (1 to 50)',
    default: 20,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return 20;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? 20 : parsed;
  })
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;
}
