import { IsOptional, IsString, IsEmail, IsIn, Length, ValidateIf, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AdminUpdateUserDto {
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
    description: 'Updated email address of the developer',
    example: 'sarah.connor@devpulse.io',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Must be a valid email address' })
  email?: string;

  @ApiPropertyOptional({
    description: 'System role of the user',
    enum: ['admin', 'user'],
    example: 'user',
  })
  @IsOptional()
  @IsIn(['admin', 'user'], { message: 'Role must be either "admin" or "user"' })
  role?: 'admin' | 'user';

  @ApiPropertyOptional({
    description: 'Professional title or headline of the developer',
    example: 'Senior Full-Stack Engineer',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: 'Avatar image URL, Base64 data URI, or null to remove',
    example: 'data:image/png;base64,...',
  })
  @IsOptional()
  @ValidateIf((_obj, val) => val !== null && val !== '')
  @IsString()
  avatarUrl?: string | null;

  @ApiPropertyOptional({
    description: 'Soft deletion status of the account',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isDeleted?: boolean;
}
