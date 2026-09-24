import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateCommentDto {
  @ApiProperty({
    example: 'This is an updated explanation.',
    description: 'Updated comment or reply content',
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
}
