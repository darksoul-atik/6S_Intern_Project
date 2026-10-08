import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { createHash, randomUUID } from 'crypto';

import { UsersService } from '../users/users.service.js';
import { MailProducerService } from '../mail-queue/mail-producer.service.js';
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
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailProducerService: MailProducerService,
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

    /*
    |--------------------------------------------------------------------------
    | Password hashing
    |--------------------------------------------------------------------------
    |
    | Passwords still use bcrypt.
    |
    | Unlike refresh tokens, passwords are human-created and potentially weak,
    | so they need a deliberately slow password hashing algorithm.
    |
    */

    const passwordHash = await bcrypt.hash(signupDto.password, 10);

    const newUser = await this.usersService.create({
      name: signupDto.name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'user',
    });

    /*
    |--------------------------------------------------------------------------
    | Resilient Welcome Email Enqueue
    |--------------------------------------------------------------------------
    |
    | Queue dispatch must never block or fail signup registration.
    | If Redis is unavailable, the error is safely caught and logged.
    |
    */
    try {
      await this.mailProducerService.enqueueWelcomeEmail(
        newUser._id.toString(),
      );
    } catch {
      this.logger.warn(
        `Failed to enqueue welcome email for user: ${newUser._id.toString()}`,
      );
    }

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
    | Existing trimmed-password compatibility
    |--------------------------------------------------------------------------
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

    /*
    |--------------------------------------------------------------------------
    | Access token
    |--------------------------------------------------------------------------
    */

    const accessToken = this.createAccessToken(userData);

    /*
    |--------------------------------------------------------------------------
    | Refresh token
    |--------------------------------------------------------------------------
    */

    const refreshToken = this.createRefreshToken(userData.id);

    /*
    |--------------------------------------------------------------------------
    | Store only deterministic SHA-256 digest
    |--------------------------------------------------------------------------
    |
    | Refresh tokens are already cryptographically random JWT secrets.
    |
    | We do not need bcrypt here.
    |
    | Deterministic hashing also lets MongoDB atomically perform:
    |
    | WHERE refreshTokenHash = hash(R1)
    | SET   refreshTokenHash = hash(R2)
    |
    */

    const refreshTokenHash = this.hashRefreshToken(refreshToken);

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
    /*
    |--------------------------------------------------------------------------
    | Step 1: cryptographically verify refresh JWT
    |--------------------------------------------------------------------------
    */

    const payload = this.verifyRefreshToken(refreshToken);

    /*
    |--------------------------------------------------------------------------
    | Step 2: load current refresh hash
    |--------------------------------------------------------------------------
    */

    const user = await this.usersService.findByIdWithRefreshTokenHash(
      payload.sub,
    );

    if (!user || user.isDeleted || !user.refreshTokenHash) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    /*
    |--------------------------------------------------------------------------
    | Step 3: deterministically hash presented token
    |--------------------------------------------------------------------------
    */

    const presentedRefreshTokenHash = this.hashRefreshToken(refreshToken);

    /*
    |--------------------------------------------------------------------------
    | Step 4: ensure R1 is actually the current token
    |--------------------------------------------------------------------------
    */

    if (presentedRefreshTokenHash !== user.refreshTokenHash) {
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
    | Step 5: generate R2
    |--------------------------------------------------------------------------
    */

    const newRefreshToken = this.createRefreshToken(userData.id);

    const newRefreshTokenHash = this.hashRefreshToken(newRefreshToken);

    /*
    |--------------------------------------------------------------------------
    | Step 6: atomically rotate R1 -> R2
    |--------------------------------------------------------------------------
    |
    | MongoDB only updates the user if the database STILL contains hash(R1).
    |
    | This is important for concurrent refresh requests:
    |
    | Request A:
    | hash(R1) matches
    | -> DB becomes hash(R2)
    |
    | Request B using R1:
    | WHERE refreshTokenHash = hash(R1)
    | -> no longer matches
    | -> modifiedCount = 0
    | -> rejected
    |
    */

    const rotated = await this.usersService.rotateRefreshTokenHash(
      userData.id,
      presentedRefreshTokenHash,
      newRefreshTokenHash,
    );

    if (!rotated) {
      throw new UnauthorizedException(
        'Refresh token has already been used or revoked',
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Step 7: issue fresh access token
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
    | Logout remains idempotent
    |--------------------------------------------------------------------------
    |
    | If the refresh JWT is already expired or malformed, logout still returns
    | success. The BFF will clear its cookies regardless.
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

    const presentedRefreshTokenHash = this.hashRefreshToken(refreshToken);

    /*
    |--------------------------------------------------------------------------
    | Only revoke if this is still the current token
    |--------------------------------------------------------------------------
    |
    | A stale R1 must never be able to revoke a newer R2 session.
    |
    */

    if (presentedRefreshTokenHash === user.refreshTokenHash) {
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
  | Access-token creation
  |--------------------------------------------------------------------------
  |
  | Uses JwtModule configuration:
  |
  | JWT_SECRET
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
  | Refresh-token creation
  |--------------------------------------------------------------------------
  |
  | Uses:
  |
  | JWT_REFRESH_SECRET
  | JWT_REFRESH_EXPIRES_IN=7d
  |
  | jti guarantees each issued refresh token is unique.
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

  /*
  |--------------------------------------------------------------------------
  | Refresh-token verification
  |--------------------------------------------------------------------------
  */

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

  /*
  |--------------------------------------------------------------------------
  | Refresh-token hashing
  |--------------------------------------------------------------------------
  |
  | SHA-256 is appropriate here because refresh tokens are high-entropy,
  | machine-generated secrets.
  |
  | Example:
  |
  | R1
  | -> SHA-256(R1)
  | -> MongoDB
  |
  | Raw R1 is never persisted.
  |
  */

  private hashRefreshToken(refreshToken: string): string {
    return createHash('sha256').update(refreshToken).digest('hex');
  }
}
