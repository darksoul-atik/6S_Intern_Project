import { Module, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  MAIL_PROVIDER,
  type MailProvider,
} from './providers/mail-provider.interface.js';
import { ConsoleMailProvider } from './providers/console-mail.provider.js';
import { SmtpMailProvider } from './providers/smtp-mail.provider.js';
import { MailService } from './mail.service.js';
import { getMailConfig } from '../common/config/mail-queue.config.js';

@Module({
  providers: [
    MailService,
    {
      provide: MAIL_PROVIDER,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): MailProvider => {
        const mailConfig = getMailConfig(configService);
        const logger = new Logger('MailModule');

        if (mailConfig.provider === 'smtp') {
          if (!mailConfig.smtp?.host) {
            logger.warn(
              'MAIL_PROVIDER is set to "smtp" but SMTP_HOST is missing. Falling back to ConsoleMailProvider.',
            );
            return new ConsoleMailProvider();
          }

          logger.log(
            `Initialized SmtpMailProvider connected to ${mailConfig.smtp.host}:${mailConfig.smtp.port}`,
          );
          return new SmtpMailProvider({
            host: mailConfig.smtp.host,
            port: mailConfig.smtp.port,
            secure: mailConfig.smtp.secure,
            user: mailConfig.smtp.user,
            password: mailConfig.smtp.password,
            from: mailConfig.from,
          });
        }

        logger.log('Initialized ConsoleMailProvider (safe local mode).');
        return new ConsoleMailProvider();
      },
    },
  ],
  exports: [MailService, MAIL_PROVIDER],
})
export class MailModule {}
