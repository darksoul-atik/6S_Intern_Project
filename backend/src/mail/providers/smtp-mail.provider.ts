import { Injectable, Logger } from '@nestjs/common';
import nodemailer, { type Transporter } from 'nodemailer';
import type { MailProvider, SendMailOptions } from './mail-provider.interface.js';
import { maskEmail } from './console-mail.provider.js';

export interface SmtpOptions {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  password?: string;
  from: string;
}

@Injectable()
export class SmtpMailProvider implements MailProvider {
  private readonly logger = new Logger(SmtpMailProvider.name);
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(options: SmtpOptions, transporter?: Transporter) {
    this.from = options.from;

    if (transporter) {
      this.transporter = transporter;
    } else {
      this.transporter = nodemailer.createTransport({
        host: options.host,
        port: options.port,
        secure: options.secure,
        auth:
          options.user && options.password
            ? {
                user: options.user,
                pass: options.password,
              }
            : undefined,
      });
    }
  }

  async send(options: SendMailOptions): Promise<void> {
    const masked = maskEmail(options.to);
    try {
      await this.transporter.sendMail({
        from: this.from,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      this.logger.log(
        `[SMTP DISPATCH SUCCESS] Delivered email to ${masked} | Subject: "${options.subject}"`,
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `[SMTP DISPATCH FAILURE] Failed to deliver email to ${masked}: ${message}`,
      );
      throw error;
    }
  }
}
