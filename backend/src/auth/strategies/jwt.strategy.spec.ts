import { describe, it, expect, vi } from 'vitest';
import { JwtStrategy } from './jwt.strategy.js';
import { UnauthorizedException } from '@nestjs/common';

describe('JwtStrategy', () => {
  const mockConfigService = {
    get: (key: string) => {
      if (key === 'JWT_SECRET') return 'test-jwt-secret-key-12345';
      return null;
    },
  };

  const mockActiveUser = {
    _id: { toString: () => '64f1a2b3c4d5e6f7a8b9c0d1' },
    name: 'Alex Chen',
    email: 'alex@devpulse.io',
    role: 'admin',
    isDeleted: false,
  };

  const mockUsersService = {
    findById: vi.fn(),
  };

  const strategy = new JwtStrategy(
    mockConfigService as any,
    mockUsersService as any,
  );

  it('should validate and return live authenticated user from database', async () => {
    mockUsersService.findById.mockResolvedValueOnce(mockActiveUser);

    const payload = {
      sub: '64f1a2b3c4d5e6f7a8b9c0d1',
      email: 'alex@devpulse.io',
      role: 'user', // Token says user, but DB updated to admin
    };

    const user = await strategy.validate(payload);
    expect(user).toEqual({
      userId: '64f1a2b3c4d5e6f7a8b9c0d1',
      name: 'Alex Chen',
      email: 'alex@devpulse.io',
      role: 'admin', // Fresh role reflected immediately from database
    });
  });

  it('should throw UnauthorizedException if account was soft-deleted by admin', async () => {
    mockUsersService.findById.mockResolvedValueOnce({
      ...mockActiveUser,
      isDeleted: true,
    });

    const payload = {
      sub: '64f1a2b3c4d5e6f7a8b9c0d1',
      email: 'alex@devpulse.io',
      role: 'user',
    };

    await expect(strategy.validate(payload)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException if user account does not exist in DB', async () => {
    mockUsersService.findById.mockResolvedValueOnce(null);

    const payload = {
      sub: '64f1a2b3c4d5e6f7a8b9c0d1',
      email: 'alex@devpulse.io',
      role: 'user',
    };

    await expect(strategy.validate(payload)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException if payload is malformed', async () => {
    const invalidPayload = {
      sub: '',
      email: 'alex@devpulse.io',
      role: 'user',
    };

    await expect(strategy.validate(invalidPayload as any)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw error during construction if JWT_SECRET is missing', () => {
    const emptyConfigService = {
      get: () => null,
    };

    expect(
      () => new JwtStrategy(emptyConfigService as any, mockUsersService as any),
    ).toThrow('CRITICAL SECURITY CONFIGURATION ERROR');
  });
});
