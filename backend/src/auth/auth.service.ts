import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

import { UsersService } from '../users/users.service.js';
import { SignupDto } from './dto/signup.dto.js';
import { LoginDto } from './dto/login.dto.js';

export interface UserResponseData {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AuthenticatedUserData {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface LoginResponseData {
  accessToken: string;
  refreshToken: string;
  user: AuthenticatedUserData;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  name?: string;
}

interface RefreshTokenPayload {
  sub: string;
  jti: string;
}

@Injectable()
export class AuthService {
  private readonly refreshTokenSaltRounds = 10;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async signup(signupDto: SignupDto): Promise<{
    data: UserResponseData;
    message: string;
  }> {
    const normalizedEmail = signupDto.email.toLowerCase().trim();

    const existingUser = await this.usersService.findByEmail(normalizedEmail);

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    if (!signupDto.password || signupDto.password.trim().length < 6) {
      throw new ConflictException(
        'Password must contain at least 6 non-whitespace characters',
      );
    }

    const passwordHash = await bcrypt.hash(signupDto.password, 10);

    const newUser = await this.usersService.create({
      name: signupDto.name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'user',
    });

    return {
      data: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
      },
      message: 'User registered successfully',
    };
  }

  async login(loginDto: LoginDto): Promise<{
    data: LoginResponseData;
    message: string;
  }> {
    const normalizedEmail = loginDto.email.toLowerCase().trim();

    const user = await this.usersService.findByEmail(normalizedEmail);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.isDeleted) {
      throw new UnauthorizedException(
        'Your profile has been deleted by an Admin. Please contact support if you believe this was an error.',
      );
    }

    let isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    /*
    |--------------------------------------------------------------------------
    | Existing compatibility fallback
    |--------------------------------------------------------------------------
    |
    | Keeps the current project's behavior where a password with accidental
    | surrounding whitespace may still match the stored password.
    |
    */

    if (
      !isPasswordValid &&
      loginDto.password &&
      loginDto.password.trim() !== loginDto.password
    ) {
      isPasswordValid = await bcrypt.compare(
        loginDto.password.trim(),
        user.passwordHash,
      );
    }

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const userData: AuthenticatedUserData = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.createAccessToken(userData);

    const refreshToken = this.createRefreshToken(userData.id);

    const refreshTokenHash = await bcrypt.hash(
      refreshToken,
      this.refreshTokenSaltRounds,
    );

    await this.usersService.setRefreshTokenHash(userData.id, refreshTokenHash);

    return {
      data: {
        accessToken,
        refreshToken,
        user: userData,
      },
      message: 'Login successful',
    };
  }

  async refresh(refreshToken: string): Promise<{
    data: LoginResponseData;
    message: string;
  }> {
    const payload = this.verifyRefreshToken(refreshToken);

    const user = await this.usersService.findByIdWithRefreshTokenHash(
      payload.sub,
    );

    if (!user || user.isDeleted || !user.refreshTokenHash) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    /*
    |--------------------------------------------------------------------------
    | Step 1: verify the submitted token matches the current DB hash
    |--------------------------------------------------------------------------
    */

    const tokenMatches = await bcrypt.compare(
      refreshToken,
      user.refreshTokenHash,
    );

    if (!tokenMatches) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const userData: AuthenticatedUserData = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    /*
    |--------------------------------------------------------------------------
    | Step 2: generate the new rotated refresh token
    |--------------------------------------------------------------------------
    */

    const newRefreshToken = this.createRefreshToken(userData.id);

    const newRefreshTokenHash = await bcrypt.hash(
      newRefreshToken,
      this.refreshTokenSaltRounds,
    );

    /*
    |--------------------------------------------------------------------------
    | Step 3: atomically rotate the stored hash
    |--------------------------------------------------------------------------
    |
    | The update succeeds only if MongoDB STILL contains the same hash that
    | we verified above.
    |
    | Example:
    |
    | Request A verifies R1 -> rotates hash(R1) to hash(R2)
    | Request B also tries R1 -> old hash no longer exists -> fails
    |
    | This prevents two concurrent refreshes using the same token from both
    | succeeding.
    |
    */

    const rotated = await this.usersService.rotateRefreshTokenHash(
      userData.id,
      user.refreshTokenHash,
      newRefreshTokenHash,
    );

    if (!rotated) {
      throw new UnauthorizedException(
        'Refresh token has already been used or revoked',
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Step 4: issue a fresh short-lived access token
    |--------------------------------------------------------------------------
    */

    const newAccessToken = this.createAccessToken(userData);

    return {
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        user: userData,
      },
      message: 'Session refreshed successfully',
    };
  }

  async logout(refreshToken: string): Promise<{
    message: string;
  }> {
    let payload: RefreshTokenPayload;

    /*
    |--------------------------------------------------------------------------
    | Logout stays idempotent
    |--------------------------------------------------------------------------
    |
    | Even if the token is already expired/invalid, logout should still
    | succeed from the client's perspective.
    |
    */

    try {
      payload = this.verifyRefreshToken(refreshToken);
    } catch {
      return {
        message: 'Logout successful',
      };
    }

    const user = await this.usersService.findByIdWithRefreshTokenHash(
      payload.sub,
    );

    if (!user || !user.refreshTokenHash) {
      return {
        message: 'Logout successful',
      };
    }

    const tokenMatches = await bcrypt.compare(
      refreshToken,
      user.refreshTokenHash,
    );

    if (tokenMatches) {
      await this.usersService.setRefreshTokenHash(user._id.toString(), null);
    }

    return {
      message: 'Logout successful',
    };
  }

  async getMe(userId: string): Promise<UserResponseData> {
    const user = await this.usersService.findById(userId);

    if (!user || user.isDeleted) {
      throw new UnauthorizedException(
        'User not found or account has been deleted',
      );
    }

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Access token
  |--------------------------------------------------------------------------
  |
  | Uses the JwtModule's normal JWT_SECRET + JWT_EXPIRES_IN configuration.
  |
  | Current target:
  | JWT_EXPIRES_IN=15m
  |
  */

  private createAccessToken(user: AuthenticatedUserData): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    return this.jwtService.sign(payload);
  }

  /*
  |--------------------------------------------------------------------------
  | Refresh token
  |--------------------------------------------------------------------------
  |
  | Refresh tokens use a DIFFERENT secret from access tokens.
  |
  | Payload intentionally contains only:
  |
  | sub = user ID
  | jti = unique token identifier
  |
  */

  private createRefreshToken(userId: string): string {
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');

    if (!refreshSecret) {
      throw new Error(
        'CRITICAL SECURITY CONFIGURATION ERROR: JWT_REFRESH_SECRET environment variable is missing.',
      );
    }

    const expiresIn =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d') || '7d';

    const payload: RefreshTokenPayload = {
      sub: userId,
      jti: randomUUID(),
    };

    return this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: expiresIn as any,
    });
  }

  private verifyRefreshToken(refreshToken: string): RefreshTokenPayload {
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');

    if (!refreshSecret) {
      throw new Error(
        'CRITICAL SECURITY CONFIGURATION ERROR: JWT_REFRESH_SECRET environment variable is missing.',
      );
    }

    try {
      return this.jwtService.verify<RefreshTokenPayload>(refreshToken, {
        secret: refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
