import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

const YEAR_MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export class UpdatePortfolioProjectDto {
  @ValidateIf((_object, value) => value !== undefined)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({
    message: 'title must be a string',
  })
  @MinLength(1, {
    message: 'title cannot be empty',
  })
  @MaxLength(100, {
    message: 'title must not exceed 100 characters',
  })
  title?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({
    message: 'description must be a string',
  })
  @MinLength(1, {
    message: 'description cannot be empty',
  })
  @MaxLength(1000, {
    message: 'description must not exceed 1000 characters',
  })
  description?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value.map((url) => (typeof url === 'string' ? url.trim() : url))
      : value,
  )
  @IsArray({
    message: 'urls must be an array',
  })
  @ArrayMaxSize(5, {
    message: 'urls cannot contain more than 5 links',
  })
  @ArrayUnique(
    (url: unknown) => (typeof url === 'string' ? url.toLowerCase() : url),
    {
      message: 'urls cannot contain duplicate links',
    },
  )
  @IsUrl(
    {
      protocols: ['http', 'https'],
      require_protocol: true,
    },
    {
      each: true,
      message: 'each URL must be a valid HTTP or HTTPS URL',
    },
  )
  urls?: string[];

  @ValidateIf((_object, value) => value !== undefined)
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value.map((technology) =>
          typeof technology === 'string' ? technology.trim() : technology,
        )
      : value,
  )
  @IsArray({
    message: 'technologies must be an array',
  })
  @ArrayMinSize(1, {
    message: 'at least one technology is required',
  })
  @ArrayMaxSize(20, {
    message: 'technologies cannot contain more than 20 items',
  })
  @ArrayUnique(
    (technology: unknown) =>
      typeof technology === 'string' ? technology.toLowerCase() : technology,
    {
      message: 'technologies cannot contain duplicates',
    },
  )
  @IsString({
    each: true,
    message: 'each technology must be a string',
  })
  @MinLength(1, {
    each: true,
    message: 'technology cannot be empty',
  })
  @MaxLength(50, {
    each: true,
    message: 'each technology must not exceed 50 characters',
  })
  technologies?: string[];

  @ValidateIf((_object, value) => value !== undefined)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({
    message: 'startDate must be a string',
  })
  @Matches(YEAR_MONTH_PATTERN, {
    message: 'startDate must be in YYYY-MM format',
  })
  startDate?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({
    message: 'endDate must be a string',
  })
  @Matches(YEAR_MONTH_PATTERN, {
    message: 'endDate must be in YYYY-MM format',
  })
  endDate?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsBoolean({
    message: 'isCurrent must be a boolean',
  })
  isCurrent?: boolean;
}
