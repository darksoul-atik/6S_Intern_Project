import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdatePostDto {
  @ApiPropertyOptional({
    example: 'Updated Architecture Breakdown: Microservices in Practice',
    description: 'Updated title of the post',
    minLength: 1,
    maxLength: 200,
  })
  @IsOptional()
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
  title?: string;

  @ApiPropertyOptional({
    example: 'Updated body content incorporating community feedback and performance benchmarks...',
    description: 'Updated markdown or plain-text body content of the post',
    minLength: 1,
    maxLength: 20000,
  })
  @IsOptional()
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
  body?: string;
}
