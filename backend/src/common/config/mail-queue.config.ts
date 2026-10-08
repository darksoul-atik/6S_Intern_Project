import type { ConfigService } from '@nestjs/config';

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  maxRetriesPerRequest: null;
}

export interface MailConfig {
  provider: 'console' | 'smtp';
  from: string;
  frontendUrl: string;
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    user?: string;
    password?: string;
  };
}

export function getRedisConfig(configService: ConfigService): RedisConfig {
  const redisUrl = configService.get<string>('REDIS_URL')?.trim();
  if (redisUrl) {
    try {
      const parsed = new URL(redisUrl);
      return {
        host: parsed.hostname || 'localhost',
        port: parsed.port ? parseInt(parsed.port, 10) : 6379,
        password: parsed.password
          ? decodeURIComponent(parsed.password)
          : undefined,
        maxRetriesPerRequest: null,
      };
    } catch {
      // If parsing fails, fall back to individual variables
    }
  }

  const host = configService.get<string>('REDIS_HOST')?.trim() || 'localhost';
  const rawPort = configService.get<string | number>('REDIS_PORT');
  const port = rawPort ? Number(rawPort) : 6379;
  const password =
    configService.get<string>('REDIS_PASSWORD')?.trim() || undefined;

  return {
    host,
    port: Number.isNaN(port) ? 6379 : port,
    password,
    maxRetriesPerRequest: null,
  };
}

export function getMailConfig(configService: ConfigService): MailConfig {
  const rawProvider = configService
    .get<string>('MAIL_PROVIDER')
    ?.trim()
    .toLowerCase();
  const provider: 'console' | 'smtp' =
    rawProvider === 'smtp' ? 'smtp' : 'console';
  const from =
    configService.get<string>('MAIL_FROM')?.trim() ||
    'DevPulse <no-reply@devpulse.io>';
  const frontendUrl =
    configService.get<string>('FRONTEND_URL')?.trim() ||
    configService.get<string>('FRONTEND_ORIGIN')?.trim() ||
    'http://localhost:3000';

  let smtp: MailConfig['smtp'];
  if (provider === 'smtp') {
    const host = configService.get<string>('SMTP_HOST')?.trim() || 'localhost';
    const port =
      Number(configService.get<string | number>('SMTP_PORT')) || 587;
    const secureStr = configService
      .get<string>('SMTP_SECURE')
      ?.trim()
      .toLowerCase();
    const secure = secureStr === 'true' || secureStr === '1' || port === 465;
    const user = configService.get<string>('SMTP_USER')?.trim();
    const password = configService.get<string>('SMTP_PASSWORD');

    smtp = {
      host,
      port,
      secure,
      user,
      password,
    };
  }

  return {
    provider,
    from,
    frontendUrl,
    smtp,
  };
}
