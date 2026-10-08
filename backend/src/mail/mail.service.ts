import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  MAIL_PROVIDER,
  type MailProvider,
} from './providers/mail-provider.interface.js';
import { renderWelcomeEmail } from './templates/welcome-email.template.js';

export interface WelcomeEmailUser {
  id: string;
  name: string;
  email: string;
}

@Injectable()
export class MailService {
  private readonly frontendUrl: string;

  constructor(
    @Inject(MAIL_PROVIDER)
    private readonly provider: MailProvider,
    private readonly configService: ConfigService,
  ) {
    this.frontendUrl =
      this.configService.get<string>('FRONTEND_URL')?.trim() ||
      this.configService.get<string>('FRONTEND_ORIGIN')?.trim() ||
      'http://localhost:3000';
  }

  async sendWelcomeEmail(user: WelcomeEmailUser): Promise<void> {
    const { subject, text, html } = renderWelcomeEmail({
      name: user.name,
      frontendUrl: this.frontendUrl,
    });

    await this.provider.send({
      to: user.email,
      subject,
      text,
      html,
    });
  }
}
