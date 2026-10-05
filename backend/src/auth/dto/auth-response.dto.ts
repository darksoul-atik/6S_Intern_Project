import { ApiProperty } from '@nestjs/swagger';

export class AuthUserDto {
  @ApiProperty({
    example: '66e138fc29094e137127e4e0',
  })
  id!: string;

  @ApiProperty({
    example: 'Tasfia Rahman',
  })
  name!: string;

  @ApiProperty({
    example: 'tasfia@devpulse.io',
  })
  email!: string;

  @ApiProperty({
    enum: ['user', 'admin'],
    example: 'user',
  })
  role!: string;
}

export class SignupResponseDataDto extends AuthUserDto {
  @ApiProperty({
    example: '2026-10-05T08:00:00.000Z',
    required: false,
  })
  createdAt?: Date;

  @ApiProperty({
    example: '2026-10-05T08:00:00.000Z',
    required: false,
  })
  updatedAt?: Date;
}

export class LoginResponseDataDto {
  @ApiProperty({
    description:
      'Short-lived JWT access token used to authenticate protected backend requests.',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken!: string;

  @ApiProperty({
    description:
      'Rotating refresh token used to renew the authenticated session.',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken!: string;

  @ApiProperty({
    type: AuthUserDto,
  })
  user!: AuthUserDto;
}

export class SignupResponseDto {
  @ApiProperty({
    example: true,
  })
  success!: boolean;

  @ApiProperty({
    example: 201,
  })
  statusCode!: number;

  @ApiProperty({
    type: SignupResponseDataDto,
  })
  data!: SignupResponseDataDto;

  @ApiProperty({
    example: 'User registered successfully',
  })
  message!: string;
}

export class LoginResponseDto {
  @ApiProperty({
    example: true,
  })
  success!: boolean;

  @ApiProperty({
    example: 200,
  })
  statusCode!: number;

  @ApiProperty({
    type: LoginResponseDataDto,
  })
  data!: LoginResponseDataDto;

  @ApiProperty({
    example: 'Login successful',
  })
  message!: string;
}

export class RefreshResponseDto {
  @ApiProperty({
    example: true,
  })
  success!: boolean;

  @ApiProperty({
    example: 200,
  })
  statusCode!: number;

  @ApiProperty({
    type: LoginResponseDataDto,
  })
  data!: LoginResponseDataDto;

  @ApiProperty({
    example: 'Session refreshed successfully',
  })
  message!: string;
}

export class CurrentUserResponseDto {
  @ApiProperty({
    example: true,
  })
  success!: boolean;

  @ApiProperty({
    example: 200,
  })
  statusCode!: number;

  @ApiProperty({
    type: SignupResponseDataDto,
  })
  data!: SignupResponseDataDto;

  @ApiProperty({
    example: 'Request successful',
  })
  message!: string;
}
