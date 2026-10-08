import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { createHash } from 'crypto';

import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  let authService: AuthService;

  let mockUsersService: any;
  let mockJwtService: any;
  let mockConfigService: any;
  let mockMailProducerService: any;

  const sha256 = (value: string) =>
    createHash('sha256').update(value).digest('hex');

  beforeEach(() => {
    mockUsersService = {
      findByEmail: vi.fn(),
      findById: vi.fn(),
      findByIdWithRefreshTokenHash: vi.fn(),
      create: vi.fn(),
      setRefreshTokenHash: vi.fn(),
      rotateRefreshTokenHash: vi.fn().mockResolvedValue(true),
    };

    mockMailProducerService = {
      enqueueWelcomeEmail: vi.fn().mockResolvedValue(undefined),
    };

    mockJwtService = {
      sign: vi.fn(
        (
          payload: any,
          options?: {
            secret?: string;
            expiresIn?: string;
          },
        ) => {
          if (!options?.secret) {
            return 'mock-access-token';
          }

          if (options.secret === 'test-refresh-secret') {
            return 'mock-refresh-token';
          }

          return 'mock-token';
        },
      ),

      verify: vi.fn().mockReturnValue({
        sub: '507f1f77bcf86cd799439011',
        jti: 'refresh-jti-123',
      }),
    };

    mockConfigService = {
      get: vi.fn((key: string, fallback?: string) => {
        const values: Record<string, string> = {
          JWT_REFRESH_SECRET: 'test-refresh-secret',

          JWT_REFRESH_EXPIRES_IN: '7d',
        };

        return values[key] ?? fallback;
      }),
    };

    authService = new AuthService(
      mockUsersService,
      mockJwtService,
      mockConfigService,
      mockMailProducerService,
    );
  });

  describe('signup', () => {
    it('should successfully register a user and hash the password', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      mockUsersService.create.mockImplementation((dto: any) =>
        Promise.resolve({
          _id: '507f1f77bcf86cd799439011',
          ...dto,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      );

      const signupDto = {
        name: 'Jane Doe',
        email: 'Jane.Doe@devpulse.io',
        password: 'SuperSecret123',
      };

      const result = await authService.signup(signupDto);

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
        'jane.doe@devpulse.io',
      );

      expect(mockUsersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Jane Doe',
          email: 'jane.doe@devpulse.io',
          role: 'user',
        }),
      );

      const createArg = mockUsersService.create.mock.calls[0][0];

      expect(createArg.passwordHash).not.toBe('SuperSecret123');

      const isPasswordValid = await bcrypt.compare(
        'SuperSecret123',
        createArg.passwordHash,
      );

      expect(isPasswordValid).toBe(true);

      expect(mockMailProducerService.enqueueWelcomeEmail).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
      );

      expect(result.data.email).toBe('jane.doe@devpulse.io');

      expect(result.data.role).toBe('user');

      expect((result.data as any).passwordHash).toBeUndefined();

      expect(result.message).toBe('User registered successfully');
    });

    it('should still succeed and return 201 response when enqueueWelcomeEmail throws', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      mockUsersService.create.mockImplementation((dto: any) =>
        Promise.resolve({
          _id: '507f1f77bcf86cd799439011',
          ...dto,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      );

      mockMailProducerService.enqueueWelcomeEmail.mockRejectedValue(
        new Error('Redis is down'),
      );

      const signupDto = {
        name: 'Jane Doe',
        email: 'jane.offline@devpulse.io',
        password: 'SuperSecret123',
      };

      const result = await authService.signup(signupDto);

      expect(mockMailProducerService.enqueueWelcomeEmail).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
      );

      expect(result.data.email).toBe('jane.offline@devpulse.io');
      expect(result.message).toBe('User registered successfully');
    });

    it('should throw ConflictException if email already exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        email: 'taken@devpulse.io',
      });

      await expect(
        authService.signup({
          name: 'Existing Person',
          email: 'taken@devpulse.io',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);

      expect(mockUsersService.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should authenticate valid credentials and issue access and refresh tokens', async () => {
      const passwordHash = await bcrypt.hash('Secret123', 10);

      mockUsersService.findByEmail.mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        name: 'Alex Chen',
        email: 'alex.chen@devpulse.io',
        passwordHash,
        role: 'user',
        isDeleted: false,
      });

      const result = await authService.login({
        email: 'Alex.Chen@devpulse.io',
        password: 'Secret123',
      });

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
        'alex.chen@devpulse.io',
      );

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: '507f1f77bcf86cd799439011',
        name: 'Alex Chen',
        email: 'alex.chen@devpulse.io',
        role: 'user',
      });

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: '507f1f77bcf86cd799439011',
          jti: expect.any(String),
        }),
        {
          secret: 'test-refresh-secret',
          expiresIn: '7d',
        },
      );

      expect(result.data.accessToken).toBe('mock-access-token');

      expect(result.data.refreshToken).toBe('mock-refresh-token');

      expect(result.data.user).toEqual({
        id: '507f1f77bcf86cd799439011',
        name: 'Alex Chen',
        email: 'alex.chen@devpulse.io',
        role: 'user',
      });

      expect(mockUsersService.setRefreshTokenHash).toHaveBeenCalledOnce();

      const [storedUserId, storedRefreshHash] =
        mockUsersService.setRefreshTokenHash.mock.calls[0];

      expect(storedUserId).toBe('507f1f77bcf86cd799439011');

      expect(storedRefreshHash).toBe(sha256('mock-refresh-token'));

      expect(storedRefreshHash).not.toBe('mock-refresh-token');

      expect(result.message).toBe('Login successful');
    });

    it('should throw UnauthorizedException on wrong password', async () => {
      const passwordHash = await bcrypt.hash('CorrectPassword', 10);

      mockUsersService.findByEmail.mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        name: 'Alex Chen',
        email: 'alex.chen@devpulse.io',
        passwordHash,
        role: 'user',
        isDeleted: false,
      });

      await expect(
        authService.login({
          email: 'alex.chen@devpulse.io',
          password: 'WrongPassword',
        }),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockUsersService.setRefreshTokenHash).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if user does not exist', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'nonexistent@devpulse.io',
          password: 'anyPassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException with admin deletion message if user account isDeleted', async () => {
      mockUsersService.findByEmail.mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        name: 'Deleted User',
        email: 'deleted@devpulse.io',
        passwordHash: await bcrypt.hash('Secret123', 10),
        role: 'user',
        isDeleted: true,
      });

      await expect(
        authService.login({
          email: 'deleted@devpulse.io',
          password: 'Secret123',
        }),
      ).rejects.toThrow(
        'Your profile has been deleted by an Admin. Please contact support if you believe this was an error.',
      );

      expect(mockUsersService.setRefreshTokenHash).not.toHaveBeenCalled();
    });

    it('should preserve the existing trimmed-password fallback behavior', async () => {
      const passwordHash = await bcrypt.hash('Secret123', 10);

      mockUsersService.findByEmail.mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        name: 'Alex Chen',
        email: 'alex.chen@devpulse.io',
        passwordHash,
        role: 'user',
        isDeleted: false,
      });

      const result = await authService.login({
        email: 'alex.chen@devpulse.io',
        password: '  Secret123  ',
      });

      expect(result.data.accessToken).toBe('mock-access-token');

      expect(result.data.refreshToken).toBe('mock-refresh-token');
    });
  });

  describe('refresh', () => {
    it('should validate the refresh token, rotate its hash, and issue new tokens', async () => {
      const oldRefreshToken = 'old-refresh-token';

      const oldRefreshTokenHash = sha256(oldRefreshToken);

      mockUsersService.findByIdWithRefreshTokenHash.mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        name: 'Alex Chen',
        email: 'alex.chen@devpulse.io',
        role: 'user',
        isDeleted: false,
        refreshTokenHash: oldRefreshTokenHash,
      });

      mockUsersService.rotateRefreshTokenHash.mockResolvedValue(true);

      const result = await authService.refresh(oldRefreshToken);

      expect(mockJwtService.verify).toHaveBeenCalledWith(oldRefreshToken, {
        secret: 'test-refresh-secret',
      });

      expect(
        mockUsersService.findByIdWithRefreshTokenHash,
      ).toHaveBeenCalledWith('507f1f77bcf86cd799439011');

      expect(mockUsersService.rotateRefreshTokenHash).toHaveBeenCalledOnce();

      const [userId, currentStoredHash, newStoredHash] =
        mockUsersService.rotateRefreshTokenHash.mock.calls[0];

      expect(userId).toBe('507f1f77bcf86cd799439011');

      expect(currentStoredHash).toBe(sha256(oldRefreshToken));

      expect(newStoredHash).toBe(sha256('mock-refresh-token'));

      expect(newStoredHash).not.toBe('mock-refresh-token');

      expect(result.data.accessToken).toBe('mock-access-token');

      expect(result.data.refreshToken).toBe('mock-refresh-token');

      expect(result.data.user).toEqual({
        id: '507f1f77bcf86cd799439011',
        name: 'Alex Chen',
        email: 'alex.chen@devpulse.io',
        role: 'user',
      });

      expect(result.message).toBe('Session refreshed successfully');
    });

    it('should reject a refresh token that does not match the stored hash', async () => {
      mockUsersService.findByIdWithRefreshTokenHash.mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        name: 'Alex Chen',
        email: 'alex.chen@devpulse.io',
        role: 'user',
        isDeleted: false,
        refreshTokenHash: sha256('different-refresh-token'),
      });

      await expect(authService.refresh('stale-refresh-token')).rejects.toThrow(
        UnauthorizedException,
      );

      expect(mockUsersService.rotateRefreshTokenHash).not.toHaveBeenCalled();
    });

    it('should reject refresh when user has no stored refresh token hash', async () => {
      mockUsersService.findByIdWithRefreshTokenHash.mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        name: 'Alex Chen',
        email: 'alex.chen@devpulse.io',
        role: 'user',
        isDeleted: false,
        refreshTokenHash: null,
      });

      await expect(authService.refresh('some-refresh-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should reject refresh for a deleted user', async () => {
      const refreshToken = 'current-refresh-token';

      mockUsersService.findByIdWithRefreshTokenHash.mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        name: 'Deleted User',
        email: 'deleted@devpulse.io',
        role: 'user',
        isDeleted: true,
        refreshTokenHash: sha256(refreshToken),
      });

      await expect(authService.refresh(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should reject refresh when atomic rotation fails because token was already used or revoked', async () => {
      const refreshToken = 'current-refresh-token';

      mockUsersService.findByIdWithRefreshTokenHash.mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        name: 'Alex Chen',
        email: 'alex.chen@devpulse.io',
        role: 'user',
        isDeleted: false,
        refreshTokenHash: sha256(refreshToken),
      });

      mockUsersService.rotateRefreshTokenHash.mockResolvedValue(false);

      await expect(authService.refresh(refreshToken)).rejects.toThrow(
        'Refresh token has already been used or revoked',
      );
    });

    it('should reject an invalid or expired refresh JWT', async () => {
      mockJwtService.verify.mockImplementationOnce(() => {
        throw new Error('jwt expired');
      });

      await expect(
        authService.refresh('expired-refresh-token'),
      ).rejects.toThrow(UnauthorizedException);

      expect(
        mockUsersService.findByIdWithRefreshTokenHash,
      ).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should revoke the stored refresh token when the current token matches', async () => {
      const refreshToken = 'current-refresh-token';

      mockUsersService.findByIdWithRefreshTokenHash.mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        refreshTokenHash: sha256(refreshToken),
      });

      const result = await authService.logout(refreshToken);

      expect(mockUsersService.setRefreshTokenHash).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        null,
      );

      expect(result).toEqual({
        message: 'Logout successful',
      });
    });

    it('should not clear the current hash if the provided token does not match it', async () => {
      mockUsersService.findByIdWithRefreshTokenHash.mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        refreshTokenHash: sha256('different-refresh-token'),
      });

      const result = await authService.logout('stale-refresh-token');

      expect(mockUsersService.setRefreshTokenHash).not.toHaveBeenCalled();

      expect(result).toEqual({
        message: 'Logout successful',
      });
    });

    it('should remain successful if the refresh token is already invalid or expired', async () => {
      mockJwtService.verify.mockImplementationOnce(() => {
        throw new Error('jwt expired');
      });

      const result = await authService.logout('expired-refresh-token');

      expect(
        mockUsersService.findByIdWithRefreshTokenHash,
      ).not.toHaveBeenCalled();

      expect(mockUsersService.setRefreshTokenHash).not.toHaveBeenCalled();

      expect(result).toEqual({
        message: 'Logout successful',
      });
    });

    it('should remain successful when no current refresh hash exists', async () => {
      mockUsersService.findByIdWithRefreshTokenHash.mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        refreshTokenHash: null,
      });

      const result = await authService.logout('some-refresh-token');

      expect(mockUsersService.setRefreshTokenHash).not.toHaveBeenCalled();

      expect(result).toEqual({
        message: 'Logout successful',
      });
    });
  });

  describe('getMe', () => {
    it('should return user identity and profile attributes including name', async () => {
      const now = new Date();

      mockUsersService.findById.mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        name: 'Sarah Connor',
        email: 'sarah@sky.net',
        role: 'user',
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
      });

      const result = await authService.getMe('507f1f77bcf86cd799439011');

      expect(mockUsersService.findById).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
      );

      expect(result).toEqual({
        id: '507f1f77bcf86cd799439011',
        name: 'Sarah Connor',
        email: 'sarah@sky.net',
        role: 'user',
        createdAt: now,
        updatedAt: now,
      });
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      mockUsersService.findById.mockResolvedValue(null);

      await expect(
        authService.getMe('507f1f77bcf86cd799439011'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if current user is deleted', async () => {
      mockUsersService.findById.mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        name: 'Deleted User',
        email: 'deleted@devpulse.io',
        role: 'user',
        isDeleted: true,
      });

      await expect(
        authService.getMe('507f1f77bcf86cd799439011'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
