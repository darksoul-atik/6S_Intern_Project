import { describe, expect, it, vi } from 'vitest';
import type { ConfigService } from '@nestjs/config';
import type { MailProvider } from './providers/mail-provider.interface.js';
import { MailService } from './mail.service.js';

describe('MailService', () => {
  it('should format welcome email and call provider.send', async () => {
    const mockProvider: MailProvider = {
      send: vi.fn().mockResolvedValue(undefined),
    };
    const mockConfigService = {
      get: (key: string) =>
        key === 'FRONTEND_URL' ? 'https://devpulse.io' : undefined,
    } as unknown as ConfigService;

    const mailService = new MailService(mockProvider, mockConfigService);

    await mailService.sendWelcomeEmail({
      id: '64b1f2a3c4d5e6f7a8b9c0d1',
      name: 'Ada Lovelace',
      email: 'ada@devpulse.test',
    });

    expect(mockProvider.send).toHaveBeenCalledOnce();
    const callArgs = vi.mocked(mockProvider.send).mock.calls[0][0];

    expect(callArgs.to).toBe('ada@devpulse.test');
    expect(callArgs.subject).toBe('Welcome to DevPulse, Ada Lovelace!');
    expect(callArgs.text).toContain('Hello Ada Lovelace,');
    expect(callArgs.text).toContain('https://devpulse.io/posts');
    expect(callArgs.html).toContain('Ada Lovelace');
    expect(callArgs.html).toContain('https://devpulse.io/posts');
  });
});
