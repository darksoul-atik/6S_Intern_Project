import { IsOptional, IsString, Length, ValidateIf } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'Updated display name of the developer',
    example: 'Sarah Connor',
    minLength: 2,
    maxLength: 60,
  })
  @IsOptional()
  @IsString()
  @Length(2, 60, {
    message: 'Name must be between 2 and 60 characters in length',
  })
  name?: string;

  @ApiPropertyOptional({
    description: 'Professional headline of the developer',
    example: 'Senior Full-Stack Engineer',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  headline?: string;

  @ApiPropertyOptional({
    description: 'Biography / summary of the developer',
    example: 'Building resilient web services and distributed systems.',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({
    description: 'Avatar image URL, Base64 data URI, or null/empty string to remove',
    example: 'data:image/png;base64,...',
  })
  @IsOptional()
  @ValidateIf((obj, val) => val !== null && val !== '')
  @IsString()
  avatarUrl?: string | null;
}

