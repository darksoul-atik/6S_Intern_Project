import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class SignupDto {
  @ApiProperty({
    example: 'Alex Chen',
    description: 'Full name of the user',
    minLength: 2,
  })
  @IsNotEmpty({ message: 'Name is required' })
  @IsString({ message: 'Name must be a string' })
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  name!: string;

  @ApiProperty({
    example: 'alex.chen@devpulse.io',
    description: 'Valid and unique email address',
  })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }: { value: string }) => value?.toLowerCase()?.trim())
  email!: string;

  @ApiProperty({
    example: 'SecretP@ss123',
    description: 'Password with minimum 6 characters',
    minLength: 6,
  })
  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'Password must be a string' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password!: string;
}
