import { Transform } from 'class-transformer';
import {
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class UpdateProfileDto {
  // -------------------------
  // Name
  // -------------------------

  @ValidateIf((_object, value) => value !== undefined)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({
    message: 'name must be a string',
  })
  @MinLength(1, {
    message: 'name cannot be empty',
  })
  @MaxLength(100, {
    message: 'name must not exceed 100 characters',
  })
  name?: string;

  // -------------------------
  // Headline
  // -------------------------

  @ValidateIf((_object, value) => value !== undefined && value !== null)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({
    message: 'headline must be a string',
  })
  @MinLength(1, {
    message: 'headline cannot be empty',
  })
  @MaxLength(160, {
    message: 'headline must not exceed 160 characters',
  })
  headline?: string | null;

  // -------------------------
  // Bio
  // -------------------------

  @ValidateIf((_object, value) => value !== undefined && value !== null)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({
    message: 'bio must be a string',
  })
  @MinLength(1, {
    message: 'bio cannot be empty',
  })
  @MaxLength(2000, {
    message: 'bio must not exceed 2000 characters',
  })
  bio?: string | null;

  // -------------------------
  // Avatar URL
  // -------------------------

  @ValidateIf(
    (_object, value) => value !== undefined && value !== null && value !== '',
  )
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({
    message: 'avatarUrl must be a string',
  })
  @Matches(/^(https?:\/\/|data:image\/)/, {
    message: 'avatarUrl must be a valid HTTP/HTTPS URL or Base64 data URI',
  })
  avatarUrl?: string | null;
}
