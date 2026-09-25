import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsMongoId, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({
    example: 'This is a useful explanation.',
    description: 'Comment or reply content',
    minLength: 1,
    maxLength: 5000,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({
    message: 'body must be a string',
  })
  @MinLength(1, {
    message: 'body cannot be empty',
  })
  @MaxLength(5000, {
    message: 'body must not exceed 5000 characters',
  })
  body!: string;

  @ApiPropertyOptional({
    example: '66e138fc29094e137127e4e0',
    description: 'MongoDB ObjectId of the user mentioned in a reply-to-reply',
  })
  @IsOptional()
  @IsMongoId({
    message: 'mentionedUserId must be a valid MongoDB ObjectId',
  })
  mentionedUserId?: string;
}
