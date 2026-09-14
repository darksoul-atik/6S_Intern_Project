import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateExperienceDto {
  @ApiProperty({
    description: 'Job title / role',
    example: 'Senior Full Stack Engineer',
    minLength: 2,
    maxLength: 100,
  })
  @IsNotEmpty()
  @IsString()
  @Length(2, 100, { message: 'Title must be between 2 and 100 characters' })
  title!: string;

  @ApiProperty({
    description: 'Company or organization name',
    example: '6sense',
    minLength: 2,
    maxLength: 100,
  })
  @IsNotEmpty()
  @IsString()
  @Length(2, 100, { message: 'Company must be between 2 and 100 characters' })
  company!: string;

  @ApiProperty({
    description: 'Start date / duration (e.g., 2022-01 or Jan 2022)',
    example: '2022-01',
    minLength: 2,
    maxLength: 30,
  })
  @IsNotEmpty()
  @IsString()
  @Length(2, 30, { message: 'Start date must be between 2 and 30 characters' })
  from!: string;

  @ApiPropertyOptional({
    description: 'End date / duration (e.g., 2024-05 or Present)',
    example: 'Present',
    maxLength: 30,
  })
  @IsOptional()
  @IsString()
  @Length(2, 30, { message: 'End date must be between 2 and 30 characters' })
  to?: string;

  @ApiPropertyOptional({
    description: 'Summary of engineering impact, responsibilities, and achievements',
    example: 'Led migration of microservices to NestJS and built real-time analytics pipeline.',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @Length(0, 1000, { message: 'Description cannot exceed 1000 characters' })
  description?: string;
}

export class UpdateExperienceDto {
  @ApiPropertyOptional({
    description: 'Updated job title / role',
    example: 'Staff Software Engineer',
    minLength: 2,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(2, 100, { message: 'Title must be between 2 and 100 characters' })
  title?: string;

  @ApiPropertyOptional({
    description: 'Updated company or organization name',
    example: '6sense HQ',
    minLength: 2,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(2, 100, { message: 'Company must be between 2 and 100 characters' })
  company?: string;

  @ApiPropertyOptional({
    description: 'Updated start date',
    example: '2022-01',
    minLength: 2,
    maxLength: 30,
  })
  @IsOptional()
  @IsString()
  @Length(2, 30, { message: 'Start date must be between 2 and 30 characters' })
  from?: string;

  @ApiPropertyOptional({
    description: 'Updated end date',
    example: 'Present',
    maxLength: 30,
  })
  @IsOptional()
  @IsString()
  @Length(2, 30, { message: 'End date must be between 2 and 30 characters' })
  to?: string;

  @ApiPropertyOptional({
    description: 'Updated summary of engineering impact',
    example: 'Architected distributed event queues.',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @Length(0, 1000, { message: 'Description cannot exceed 1000 characters' })
  description?: string;
}
