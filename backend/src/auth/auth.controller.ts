import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { SignupDto } from './dto/signup.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
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
      'Creates a new user with a hashed password, enforcing role "user" and unique email.',
  })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed on input fields',
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
    summary: 'Authenticate user and issue JWT',
    description:
      'Validates credentials and issues a signed JWT containing user ID, email, and role.',
  })
  @ApiResponse({
    status: 200,
    description: 'Authentication successful, JWT token issued',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed on input fields',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid email or password',
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current authenticated user identity',
    description:
      'Extracts and returns verified user identity (id, email, role) from the provided JWT Bearer token.',
  })
  @ApiResponse({
    status: 200,
    description: 'User authenticated, returns identity payload',
  })
  @ApiResponse({
    status: 401,
    description: 'Missing or invalid Bearer token',
  })
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return {
      data: {
        id: user.userId,
        email: user.email,
        role: user.role,
      },
    };
  }
}
