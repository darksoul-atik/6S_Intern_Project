import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export type PostSort = 'top' | 'latest';

export class GetPostsQueryDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'Page number. Minimum value is 1.',
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
  page: number = 1;

  @ApiPropertyOptional({
    example: 10,
    description: 'Number of posts per page. Maximum value is 100.',
    default: 10,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return 10;

    const parsed = parseInt(value, 10);

    return isNaN(parsed) ? 10 : parsed;
  })
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;

  @ApiPropertyOptional({
    example: 'latest',
    enum: ['top', 'latest'],
    description: 'Feed sort order.',
    default: 'latest',
  })
  @IsOptional()
  @IsIn(['top', 'latest'], {
    message: 'sort must be either "top" or "latest"',
  })
  sort: PostSort = 'latest';
}
