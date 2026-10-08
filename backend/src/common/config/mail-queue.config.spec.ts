import { describe, expect, it } from 'vitest';
import type { ConfigService } from '@nestjs/config';
import {
  getMailConfig,
  getRedisConfig,
} from './mail-queue.config.js';

describe('mail-queue.config', () => {
  describe('getRedisConfig', () => {
    it('should return default Redis config when env is empty', () => {
      const mockConfigService = {
        get: () => undefined,
      } as unknown as ConfigService;

      const config = getRedisConfig(mockConfigService);
      expect(config).toEqual({
        host: 'localhost',
        port: 6379,
        password: undefined,
        maxRetriesPerRequest: null,
      });
    });

    it('should parse individual REDIS_HOST, REDIS_PORT, REDIS_PASSWORD', () => {
      const mockValues: Record<string, string> = {
        REDIS_HOST: 'redis.internal',
        REDIS_PORT: '6380',
        REDIS_PASSWORD: 'secretpassword',
      };
      const mockConfigService = {
        get: (key: string) => mockValues[key],
      } as unknown as ConfigService;

      const config = getRedisConfig(mockConfigService);
      expect(config).toEqual({
        host: 'redis.internal',
        port: 6380,
        password: 'secretpassword',
        maxRetriesPerRequest: null,
      });
    });

    it('should parse REDIS_URL when provided', () => {
      const mockConfigService = {
        get: (key: string) =>
          key === 'REDIS_URL'
            ? 'redis://:auth123@redis-cluster.cloud:6390'
            : undefined,
      } as unknown as ConfigService;

      const config = getRedisConfig(mockConfigService);
      expect(config).toEqual({
        host: 'redis-cluster.cloud',
        port: 6390,
        password: 'auth123',
        maxRetriesPerRequest: null,
      });
    });
  });

  describe('getMailConfig', () => {
    it('should default to console provider with fallback values', () => {
      const mockConfigService = {
        get: () => undefined,
      } as unknown as ConfigService;

      const config = getMailConfig(mockConfigService);
      expect(config).toEqual({
        provider: 'console',
        from: 'DevPulse <no-reply@devpulse.io>',
        frontendUrl: 'http://localhost:3000',
        smtp: undefined,
      });
    });

    it('should configure SMTP provider when MAIL_PROVIDER=smtp', () => {
      const mockValues: Record<string, string> = {
        MAIL_PROVIDER: 'smtp',
        MAIL_FROM: 'DevPulse Team <team@devpulse.io>',
        FRONTEND_URL: 'https://devpulse.io',
        SMTP_HOST: 'smtp.mailtrap.io',
        SMTP_PORT: '2525',
        SMTP_SECURE: 'false',
        SMTP_USER: 'testuser',
        SMTP_PASSWORD: 'testpass',
      };
      const mockConfigService = {
        get: (key: string) => mockValues[key],
      } as unknown as ConfigService;

      const config = getMailConfig(mockConfigService);
      expect(config).toEqual({
        provider: 'smtp',
        from: 'DevPulse Team <team@devpulse.io>',
        frontendUrl: 'https://devpulse.io',
        smtp: {
          host: 'smtp.mailtrap.io',
          port: 2525,
          secure: false,
          user: 'testuser',
          password: 'testpass',
        },
      });
    });
  });
});
