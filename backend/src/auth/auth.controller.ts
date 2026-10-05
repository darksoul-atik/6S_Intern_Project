import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { Throttle } from '@nestjs/throttler';

import { AuthService } from './auth.service.js';

import { SignupDto } from './dto/signup.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';

import {
  CurrentUserResponseDto,
  LoginResponseDto,
  RefreshResponseDto,
  SignupResponseDto,
} from './dto/auth-response.dto.js';

import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { RolesGuard } from './guards/roles.guard.js';

import { Roles } from './decorators/roles.decorator.js';
import { CurrentUser } from './decorators/current-user.decorator.js';

import type { AuthenticatedUser } from './strategies/jwt.strategy.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /*
  |--------------------------------------------------------------------------
  | Signup
  |--------------------------------------------------------------------------
  */

  @Post('signup')
  @Throttle({
    default: {
      limit: 5,
      ttl: 15 * 60_000,
    },
  })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Creates a new DevPulse user account using validated input and a securely hashed password.',
  })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: SignupResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed',
    schema: {
      example: {
        success: false,
        statusCode: 400,
        message: 'email must be an email',
        errors: ['email must be an email'],
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'The supplied email address is already registered',
    schema: {
      example: {
        success: false,
        statusCode: 409,
        message: 'Email is already registered',
        errors: [],
      },
    },
  })
  @ApiResponse({
    status: 429,
    description: 'Too many signup attempts',
    schema: {
      example: {
        success: false,
        statusCode: 429,
        message: 'ThrottlerException: Too Many Requests',
        errors: [],
      },
    },
  })
  async signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  /*
  |--------------------------------------------------------------------------
  | Login
  |--------------------------------------------------------------------------
  */

  @Post('login')
  @Throttle({
    default: {
      limit: 10,
      ttl: 15 * 60_000,
    },
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Authenticate a user',
    description:
      'Validates the supplied credentials and returns a short-lived access token, rotating-session refresh token, and authenticated user information.',
  })
  @ApiResponse({
    status: 200,
    description: 'Authentication successful',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed',
    schema: {
      example: {
        success: false,
        statusCode: 400,
        message: 'email must be an email',
        errors: ['email must be an email'],
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid email or password',
    schema: {
      example: {
        success: false,
        statusCode: 401,
        message: 'Invalid email or password',
        errors: [],
      },
    },
  })
  @ApiResponse({
    status: 429,
    description: 'Too many login attempts',
    schema: {
      example: {
        success: false,
        statusCode: 429,
        message: 'ThrottlerException: Too Many Requests',
        errors: [],
      },
    },
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /*
  |--------------------------------------------------------------------------
  | Refresh Session
  |--------------------------------------------------------------------------
  */

  @Post('refresh')
  @Throttle({
    default: {
      limit: 30,
      ttl: 15 * 60_000,
    },
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh an authenticated session',
    description:
      'Validates the current refresh token, rotates it, and returns a fresh access token and refresh token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Session refreshed successfully',
    type: RefreshResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Refresh token request body is invalid',
    schema: {
      example: {
        success: false,
        statusCode: 400,
        message: 'refreshToken should not be empty',
        errors: ['refreshToken should not be empty'],
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token is invalid, expired, revoked, or already used',
    schema: {
      example: {
        success: false,
        statusCode: 401,
        message: 'Invalid or expired refresh token',
        errors: [],
      },
    },
  })
  @ApiResponse({
    status: 429,
    description: 'Too many refresh attempts',
    schema: {
      example: {
        success: false,
        statusCode: 429,
        message: 'ThrottlerException: Too Many Requests',
        errors: [],
      },
    },
  })
  async refresh(
    @Body()
    refreshTokenDto: RefreshTokenDto,
  ) {
    return this.authService.refresh(refreshTokenDto.refreshToken);
  }

  /*
  |--------------------------------------------------------------------------
  | Logout
  |--------------------------------------------------------------------------
  */

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Revoke the current refresh token',
    description:
      'Revokes the matching stored refresh token. Logout remains idempotent if the supplied token is already expired or invalid.',
  })
  @ApiResponse({
    status: 200,
    description: 'Logout completed successfully',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        data: null,
        message: 'Logout successful',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Refresh token request body is invalid',
    schema: {
      example: {
        success: false,
        statusCode: 400,
        message: 'refreshToken should not be empty',
        errors: ['refreshToken should not be empty'],
      },
    },
  })
  async logout(
    @Body()
    refreshTokenDto: RefreshTokenDto,
  ) {
    return this.authService.logout(refreshTokenDto.refreshToken);
  }

  /*
  |--------------------------------------------------------------------------
  | Current User
  |--------------------------------------------------------------------------
  */

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get the current authenticated user',
    description:
      'Returns the current user based on the verified short-lived access token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Current user returned successfully',
    type: CurrentUserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Access token is missing, invalid, or expired',
    schema: {
      example: {
        success: false,
        statusCode: 401,
        message: 'Unauthorized',
        errors: [],
      },
    },
  })
  async getMe(
    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.authService.getMe(user.userId);
  }

  /*
  |--------------------------------------------------------------------------
  | Admin Authorization Check
  |--------------------------------------------------------------------------
  */

  @Get('admin-check')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Verify admin-only access',
    description:
      'Requires a valid access token and an authenticated user with the admin role.',
  })
  @ApiResponse({
    status: 200,
    description: 'Admin authorization verified',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        data: {
          id: '66e138fc29094e137127e4e0',
          email: 'admin@devpulse.io',
          role: 'admin',
          adminAccess: true,
        },
        message: 'Admin authorization verified',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Access token is missing, invalid, or expired',
    schema: {
      example: {
        success: false,
        statusCode: 401,
        message: 'Unauthorized',
        errors: [],
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Authenticated user does not have the admin role',
    schema: {
      example: {
        success: false,
        statusCode: 403,
        message: 'Forbidden',
        errors: [],
      },
    },
  })
  getAdminCheck(
    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return {
      data: {
        id: user.userId,
        email: user.email,
        role: user.role,
        adminAccess: true,
      },
      message: 'Admin authorization verified',
    };
  }
}
