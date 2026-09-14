import { IsOptional, IsString, Length } from 'class-validator';
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
}
