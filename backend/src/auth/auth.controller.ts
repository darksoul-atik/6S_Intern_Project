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
  |
  | Maximum:
  | 5 requests per 15 minutes per IP
  |
  | Protects against automated account creation / signup spam.
  |
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
      'Creates a new user account using validated input and a securely hashed password.',
  })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed',
  })
  @ApiResponse({
    status: 409,
    description: 'Email is already registered',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many signup attempts. Please try again later.',
  })
  async signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  /*
  |--------------------------------------------------------------------------
  | Login
  |--------------------------------------------------------------------------
  |
  | Maximum:
  | 10 requests per 15 minutes per IP
  |
  | This is stricter because login is a brute-force target.
  |
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
      'Validates credentials and issues a short-lived access token plus a refresh token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Authentication successful',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid email or password',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many login attempts. Please try again later.',
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /*
  |--------------------------------------------------------------------------
  | Refresh
  |--------------------------------------------------------------------------
  |
  | Maximum:
  | 30 requests per 15 minutes per IP
  |
  | More generous than login because legitimate clients may need several
  | refreshes throughout a normal session.
  |
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
      'Validates the current refresh token, rotates it, and issues a new access token and refresh token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Session refreshed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Refresh token is missing or invalid',
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token is invalid, expired, revoked, or already used',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many refresh attempts. Please try again later.',
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
  |
  | Uses the normal global throttling policy.
  |
  */

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Revoke the current refresh token',
    description:
      'Revokes the matching stored refresh-token hash. The endpoint remains idempotent if the refresh token is already invalid or expired.',
  })
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
  })
  @ApiResponse({
    status: 400,
    description: 'Refresh token is missing or invalid',
  })
  async logout(
    @Body()
    refreshTokenDto: RefreshTokenDto,
  ) {
    return this.authService.logout(refreshTokenDto.refreshToken);
  }

  /*
  |--------------------------------------------------------------------------
  | Current user
  |--------------------------------------------------------------------------
  */

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get the current authenticated user',
    description:
      'Uses the verified access token to return the current user identity.',
  })
  @ApiResponse({
    status: 200,
    description: 'Current user returned successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing, invalid, or expired access token',
  })
  async getMe(
    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.authService.getMe(user.userId);
  }

  /*
  |--------------------------------------------------------------------------
  | Admin check
  |--------------------------------------------------------------------------
  */

  @Get('admin-check')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Verify admin-only access',
    description: 'Requires a valid access token and the admin role.',
  })
  @ApiResponse({
    status: 200,
    description: 'Admin authorization verified',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing, invalid, or expired access token',
  })
  @ApiResponse({
    status: 403,
    description: 'Authenticated user does not have the admin role',
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
