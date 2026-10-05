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

  @Post('signup')
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
  async signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @Post('login')
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
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
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
  async refresh(
    @Body()
    refreshTokenDto: RefreshTokenDto,
  ) {
    return this.authService.refresh(refreshTokenDto.refreshToken);
  }

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
