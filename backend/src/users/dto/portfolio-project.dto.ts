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
  Validate,
  ValidateIf,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

const YEAR_MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

@ValidatorConstraint({
  name: 'validPortfolioProjectEndDate',
  async: false,
})
class ValidPortfolioProjectEndDate implements ValidatorConstraintInterface {
  validate(endDate: unknown, args: ValidationArguments): boolean {
    const project = args.object as PortfolioProjectDto;

    // Let @IsBoolean handle an invalid isCurrent value.
    if (typeof project.isCurrent !== 'boolean') {
      return true;
    }

    // Current project must not have an end date.
    if (project.isCurrent) {
      return endDate === undefined;
    }

    // Non-current project must have an end date.
    if (typeof endDate !== 'string') {
      return false;
    }

    // Validate the endDate format here because this custom
    // validator owns all endDate rules.
    if (!YEAR_MONTH_PATTERN.test(endDate)) {
      return false;
    }

    // Let startDate's own validator report an invalid startDate.
    if (!YEAR_MONTH_PATTERN.test(project.startDate)) {
      return true;
    }

    // Because format is YYYY-MM, string comparison works chronologically.
    return endDate >= project.startDate;
  }

  defaultMessage(args: ValidationArguments): string {
    const project = args.object as PortfolioProjectDto;
    const endDate = args.value;

    if (project.isCurrent === true) {
      return 'endDate must not be provided when isCurrent is true';
    }

    if (endDate === undefined) {
      return 'endDate is required when isCurrent is false';
    }

    if (typeof endDate !== 'string' || !YEAR_MONTH_PATTERN.test(endDate)) {
      return 'endDate must be in YYYY-MM format';
    }

    return 'endDate must be the same as or later than startDate';
  }
}

export class PortfolioProjectDto {
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
  title!: string;

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
  description!: string;

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
  technologies!: string[];

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({
    message: 'startDate must be a string',
  })
  @Matches(YEAR_MONTH_PATTERN, {
    message: 'startDate must be in YYYY-MM format',
  })
  startDate!: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @Validate(ValidPortfolioProjectEndDate)
  endDate?: string;

  @IsBoolean({
    message: 'isCurrent must be a boolean',
  })
  isCurrent!: boolean;
}
