import { Injectable, Logger } from '@nestjs/common';
import type { MailProvider, SendMailOptions } from './mail-provider.interface.js';

/**
 * Mask an email address to avoid leaking PII in server logs.
 * e.g. "alexander@devpulse.io" -> "a***r@devpulse.io"
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.trim().split('@');
  if (!domain || !local) {
    return '***@***';
  }
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`;
  }
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

@Injectable()
export class ConsoleMailProvider implements MailProvider {
  private readonly logger = new Logger(ConsoleMailProvider.name);

  async send(options: SendMailOptions): Promise<void> {
    const masked = maskEmail(options.to);
    this.logger.log(
      `[SIMULATED DISPATCH] Welcome email dispatched to ${masked} | Subject: "${options.subject}"`,
    );
  }
}
