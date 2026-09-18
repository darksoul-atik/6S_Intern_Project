import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreatePostDto {
  @ApiProperty({
    example: 'Architecting Scalable Microservices with NestJS and MongoDB',
    description: 'Post title',
    minLength: 1,
    maxLength: 200,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({
    message: 'title must be a string',
  })
  @MinLength(1, {
    message: 'title cannot be empty',
  })
  @MaxLength(200, {
    message: 'title must not exceed 200 characters',
  })
  title!: string;

  @ApiProperty({
    example: 'In this article, we examine high-concurrency indexing strategies and MongoDB replica set design...',
    description: 'Main body content of the post (markdown or plain text)',
    minLength: 1,
    maxLength: 20000,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({
    message: 'body must be a string',
  })
  @MinLength(1, {
    message: 'body cannot be empty',
  })
  @MaxLength(20000, {
    message: 'body must not exceed 20000 characters',
  })
  body!: string;
}
