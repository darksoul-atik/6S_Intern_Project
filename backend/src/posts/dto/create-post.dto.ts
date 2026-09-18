import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreatePostDto {
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
