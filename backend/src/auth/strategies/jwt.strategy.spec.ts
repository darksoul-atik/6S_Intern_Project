import { describe, it, expect } from 'vitest';
import { JwtStrategy } from './jwt.strategy.js';
import { UnauthorizedException } from '@nestjs/common';

describe('JwtStrategy', () => {
  const mockConfigService = {
    get: (key: string, defaultValue: string) => defaultValue || 'test-secret',
  };

  const strategy = new JwtStrategy(mockConfigService as any);

  it('should validate and return authenticated user from payload', async () => {
    const payload = {
      sub: 'user-123',
      email: 'alex@devpulse.io',
      role: 'user',
    };

    const user = await strategy.validate(payload);
    expect(user).toEqual({
      userId: 'user-123',
      email: 'alex@devpulse.io',
      role: 'user',
    });
  });

  it('should throw UnauthorizedException if required claims are missing', async () => {
    const invalidPayload = {
      sub: '',
      email: 'alex@devpulse.io',
      role: 'user',
    };

    await expect(strategy.validate(invalidPayload as any)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
