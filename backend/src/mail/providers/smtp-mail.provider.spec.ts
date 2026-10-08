import { describe, expect, it, vi } from 'vitest';
import type { Transporter } from 'nodemailer';
import { SmtpMailProvider } from './smtp-mail.provider.js';

describe('SmtpMailProvider', () => {
  it('should deliver mail via injected transporter', async () => {
    const mockSendMail = vi.fn().mockResolvedValue({ messageId: '123' });
    const mockTransporter = {
      sendMail: mockSendMail,
    } as unknown as Transporter;

    const provider = new SmtpMailProvider(
      {
        host: 'smtp.test.com',
        port: 587,
        secure: false,
        from: 'DevPulse <no-reply@devpulse.io>',
      },
      mockTransporter,
    );

    await provider.send({
      to: 'recipient@devpulse.test',
      subject: 'Welcome to DevPulse!',
      text: 'Hello test',
      html: '<p>Hello test</p>',
    });

    expect(mockSendMail).toHaveBeenCalledOnce();
    expect(mockSendMail).toHaveBeenCalledWith({
      from: 'DevPulse <no-reply@devpulse.io>',
      to: 'recipient@devpulse.test',
      subject: 'Welcome to DevPulse!',
      text: 'Hello test',
      html: '<p>Hello test</p>',
    });
  });

  it('should rethrow errors when transporter fails', async () => {
    const mockSendMail = vi
      .fn()
      .mockRejectedValue(new Error('SMTP connection timeout'));
    const mockTransporter = {
      sendMail: mockSendMail,
    } as unknown as Transporter;

    const provider = new SmtpMailProvider(
      {
        host: 'smtp.test.com',
        port: 587,
        secure: false,
        from: 'DevPulse <no-reply@devpulse.io>',
      },
      mockTransporter,
    );

    await expect(
      provider.send({
        to: 'recipient@devpulse.test',
        subject: 'Welcome!',
        text: 'Hello',
        html: '<p>Hello</p>',
      }),
    ).rejects.toThrow('SMTP connection timeout');
  });
});
